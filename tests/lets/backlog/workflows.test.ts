import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {WorkflowEngine} from '../../../lets/src/backlog/workflows.ts';
import type {Action,Capture} from '../../../lets/src/backlog/action-contract.ts';
import {Store} from '../../../lets/src/backlog/store.ts';
import {transaction} from '../../../lets/src/backlog/runtime-context.ts';
const tool={id:'github-graphql',digest:'a'.repeat(64),authentication:'fixture',executable:'/fixture/tool',argv:[]};
function capture(action:Action, reference:string):Capture {
  const stdout=JSON.stringify({data:{viewer:{login:'me'}}});
  return {version:1,id:reference,actionId:action.id,actionDigest:action.digest,tool:action.tool,stdin:action.stdin,startedAt:action.issuedAt,finishedAt:action.issuedAt,dispatched:true,state:'complete',exitCode:0,signal:null,stdout,stderr:'',bytes:Buffer.byteLength(stdout)};
}
async function fixture(run:(engine:WorkflowEngine, receipts:Map<string,Capture>, cwd:string)=>Promise<void>, execute?: (command:string,input:any,cwd:string)=>Promise<any>) {
  mkdirSync('.workspace',{recursive:true});const cwd=mkdtempSync(join(process.cwd(),'.workspace/workflow-'));
  try {execFileSync('git',['init','--quiet'],{cwd});mkdirSync(join(cwd,'openspec'));writeFileSync(join(cwd,'openspec/config.yaml'),'schema: lets-standard\n');
    const receipts=new Map<string,Capture>();
    const engine=new WorkflowEngine(cwd,{tools:{'github-graphql':tool},capture:{async read(ref){if(!receipts.has(ref))throw Error('unavailable');return receipts.get(ref)!;}},execute:execute??(async()=>await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'}))});
    await run(engine,receipts,cwd);
  }finally{rmSync(cwd,{recursive:true,force:true});}
}
const input={repository:'owner/repo',actor:'me',session:'s'};
test('workflow advances only from independently retrieved capture',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('select',input);assert.equal(first.state,'action-required');assert.equal(first.action.name,'Actor');
  receipts.set('r',capture(first.action,'r'));
  assert.deepEqual(await engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'}),{state:'complete',result:{viewer:{login:'me'}}});
}));
test('outstanding workflow excludes a new caller',()=>fixture(async(engine)=>{
  await engine.start('select',input);
  await assert.rejects(engine.start('select',input),/outstanding/);
}));
test('unavailable capture retains the original action',()=>fixture(async(engine)=>{
  const first=await engine.start('select',input);
  await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'missing'}),/capture/);
  await assert.rejects(engine.start('select',input),/outstanding/);
}));
test('caller cannot submit a capture body',()=>fixture(async(engine)=>{
  const first=await engine.start('select',input);
  await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:capture(first.action,'fake')} as any),/receipt/);
}));
test('read-only workflow can be abandoned with its original handle',()=>fixture(async(engine)=>{
  const first=await engine.start('select',input);
  assert.deepEqual(await engine.abandon({workflow:first.workflow}),{state:'abandoned'});
  assert.equal((await engine.start('select',input)).state,'action-required');
}));
test('configuration change prevents capture acceptance',()=>fixture(async(engine,receipts,cwd)=>{
  const first=await engine.start('select',input);receipts.set('r',capture(first.action,'r'));
  writeFileSync(join(cwd,'openspec/config.yaml'),'lets:\n  backlog:\n    executable: obsolete\n');
  await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'}),/configuration|setting/);
}));
test('uncertain write permits fresh reconciliation reads',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('claim',input);assert.equal(first.action.mode,'write');
  await assert.rejects(engine.abandon({workflow:first.workflow}),/write/);
  const recovery=await engine.reconcile({workflow:first.workflow});assert.equal(recovery.action.mode,'read');
  receipts.set('fresh',capture(recovery.action,'fresh'));
  assert.deepEqual(await engine.submit({workflow:first.workflow,actionId:recovery.action.id,receipt:'fresh'}),{state:'complete',result:{state:'applied',result:'recovered'}});
},async(command,_input,cwd)=>{
  const query=transaction.getStore()!.query!;
  if(command==='reconcile-internal'){await query('Actor',{owner:'owner',name:'repo'});return {state:'applied',result:'recovered'};}
  new Store(cwd).write('mutation-fixture',{state:'pending',request:{operation:'claim.acquire',context:input,mutationId:'m',input:{}}});
  await query('FieldStatus',{project:'P',item:'PI',field:'status',option:'progress'});return {};
}));
test('workflow resumes from durable state in a new engine',()=>fixture(async(engine,receipts,cwd)=>{
  const first=await engine.start('select',input);receipts.set('r',capture(first.action,'r'));
  const restarted=new WorkflowEngine(cwd,engine.options);
  assert.equal((await restarted.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'})).state,'complete');
}));
test('accepted action is replayed after its original deadline',async()=>{
  const originalNow=Date.now;const start=originalNow();let clock=start;Date.now=()=>clock;
  try{await fixture(async(engine,receipts)=>{
    const first=await engine.start('two',input);receipts.set('first',capture(first.action,'first'));
    const second=await engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'first'});
    receipts.set('second',capture(second.action,'second'));
    assert.equal((await engine.submit({workflow:first.workflow,actionId:second.action.id,receipt:'second'})).state,'complete');
  },async()=>{await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});clock=start+180001;return await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});});}
  finally{Date.now=originalNow;}
});
test('editable replay cache cannot fabricate captured facts',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('two',input);receipts.set('first',capture(first.action,'first'));
  const second=await engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'first'});
  const {hash}=await import('../../../lets/src/backlog/store.ts');const name='workflow-'+hash(first.workflow);const file=engine.store.read(name);
  file.entries[0].result={viewer:{login:'forged'}};engine.store.write(name,file);
  receipts.set('second',capture(second.action,'second'));
  assert.equal((await engine.submit({workflow:first.workflow,actionId:second.action.id,receipt:'second'})).result.viewer.login,'me');
},async()=>{const first=await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});return first;}));
test('simultaneous callers obtain only one outstanding workflow',()=>fixture(async(engine)=>{
  const results=await Promise.allSettled([engine.start('select',input),engine.start('select',input)]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(results.filter(result=>result.status==='rejected').length,1);
}));
test('post-write uncertainty retains the workflow reservation',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('claim',input);receipts.set('write',capture(first.action,'write'));
  await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'write'}),/uncertain/);
  await assert.rejects(engine.start('select',input),/outstanding/);
},async(_command,_input,cwd)=>{
  const {AdapterFailure}=await import('../../../lets/src/backlog/errors.ts');
  new Store(cwd).write('mutation-fixture',{state:'pending',request:{operation:'claim.acquire',context:input,mutationId:'m',input:{}}});
  await transaction.getStore()!.query!('FieldStatus',{project:'P',item:'PI',field:'status',option:'progress'});
  throw new AdapterFailure('conflict','partial','uncertain after write');
}));
test('lost final acknowledgement can be recovered without rewriting private state',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('select',input);receipts.set('r',capture(first.action,'r'));
  const submission={workflow:first.workflow,actionId:first.action.id,receipt:'r'};
  const complete=await engine.submit(submission);
  engine.store.write('session-marker',{value:2});
  assert.deepEqual(await engine.submit(submission),complete);
  assert.deepEqual(engine.store.read('session-marker'),{value:2});
},async(_command,_input,cwd)=>{
  new Store(cwd).write('session-marker',{value:1});return await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});
}));
test('abandoning an undispatched workflow rolls back private preparation',()=>fixture(async(engine)=>{
  const first=await engine.start('claim',input);assert.deepEqual(engine.store.read('session-prepared'),{value:1});
  await engine.abandon({workflow:first.workflow});assert.equal(engine.store.read('session-prepared'),undefined);
},async(_command,_input,cwd)=>{
  new Store(cwd).write('session-prepared',{value:1});return await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});
}));
test('stale ownership facts cannot authorize a later write',async()=>{
  const originalNow=Date.now;const start=originalNow();let clock=start;Date.now=()=>clock;
  try{await fixture(async(engine,receipts)=>{
    const first=await engine.start('claim',input);receipts.set('r',capture(first.action,'r'));
    await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'}),/fresh/);
  },async()=>{await transaction.getStore()!.query!('Actor',{owner:'owner',name:'repo'});clock=start+180001;return await transaction.getStore()!.query!('FieldStatus',{project:'P',item:'PI',field:'status',option:'progress'});});}
  finally{Date.now=originalNow;}
});
test('unmappable dispatched write result retains unknown effects',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('claim',input);const result=capture(first.action,'r');result.stdout='{}';result.bytes=2;receipts.set('r',result);
  await assert.rejects(engine.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'}),(error:any)=>error.effects==='unknown');
  await assert.rejects(engine.start('select',input),/outstanding/);
},async()=>await transaction.getStore()!.query!('FieldStatus',{project:'P',item:'PI',field:'status',option:'progress'})));
test('restart reapplies an interrupted private checkpoint idempotently',()=>fixture(async(engine,receipts,cwd)=>{
  const first=await engine.start('select',input);const {hash}=await import('../../../lets/src/backlog/store.ts');const name='workflow-'+hash(first.workflow);const file=engine.store.read(name);
  file.commit={'session-a':{value:1},'session-b':{value:2}};engine.store.write(name,file);engine.store.write('session-a',{value:1});
  receipts.set('r',capture(first.action,'r'));const restarted=new WorkflowEngine(cwd,engine.options);
  await restarted.submit({workflow:first.workflow,actionId:first.action.id,receipt:'r'});
  // The replay transaction reconstructs original policy state; the WAL is
  // fully applied before policy resumes and is no longer pending afterwards.
  assert.equal(restarted.store.read(name).commit,undefined);
  assert.deepEqual(restarted.store.read('session-b'),{value:2});
}));
test('trusted cancellation clears an unexecuted write and its private preparation',()=>fixture(async(engine,receipts)=>{
  const first=await engine.start('claim',input);
  engine.options.capture.settle=async(action)=>{const {NonDispatchFailure}=await import('../../../lets/src/backlog/errors.ts');throw new NonDispatchFailure();};
  assert.equal((await engine.reconcile({workflow:first.workflow})).result.state,'absent');
  assert.equal(engine.store.read('mutation-fixture'),undefined);
  assert.equal((await engine.start('claim',input)).state,'action-required');
},async(_command,_input,cwd)=>{new Store(cwd).write('mutation-fixture',{request:{context:input,mutationId:'m',operation:'claim.acquire',input:{}},state:'pending'});await transaction.getStore()!.query!('FieldStatus',{project:'P',item:'PI',field:'status',option:'progress'});}));
