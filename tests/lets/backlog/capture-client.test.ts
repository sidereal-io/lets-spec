import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CaptureClient, readCaptureSetup } from '../../../lets/src/backlog/capture-client.ts';
import { protectedPath } from '../../../lets/src/backlog/capture-service.ts';
import { sealAction } from '../../../lets/src/backlog/action-contract.ts';
import type { Capture } from '../../../lets/src/backlog/action-contract.ts';

async function fixture(t: test.TestContext, edit: (capture: Capture) => unknown = c => c) {
  const directory = await mkdtemp(resolve('.workspace/capture-client-'));
  const socket = resolve(directory,'socket');
  const tool = {id:'fixture',digest:'a'.repeat(64),authentication:'fixture',executable:process.execPath,argv:[]};
  const now = Date.now();
  const action = sealAction({version:1,id:'request-1',workflow:'workflow',sequence:0,name:'fixture',scope:{provider:'fixture',repository:'owner/repo',actor:'actor',session:'session'},tool,stdin:{query:'{ viewer { login } }'},mode:'read',issuedAt:now-1,expiresAt:now+30000,timeoutMs:10000,maxBytes:1000});
  const capture: Capture = {version:1,id:action.id,actionId:action.id,actionDigest:action.digest,tool,stdin:action.stdin,startedAt:now,finishedAt:now,dispatched:true,state:'complete',exitCode:0,signal:null,stdout:'{}',stderr:'',bytes:2};
  const server = createServer((_request,response)=>{response.setHeader('content-type','application/json');response.end(JSON.stringify(edit(capture)));});
  await new Promise<void>(r=>server.listen(socket,r));
  t.after(async()=>{await new Promise<void>((r,e)=>server.close(error=>error?e(error):r()));await rm(directory,{recursive:true,force:true});});
  const setup={socket,serviceUid:process.getuid!(),tools:{fixture:tool}};
  return {action,capture,directory,setup,client:new CaptureClient(setup,{verifySocket:async()=>{}})};
}

test('client refuses a tool absent from administrator trust',async t=>{
  const {action,setup}=await fixture(t);
  const client=new CaptureClient({...setup,tools:{other:{...setup.tools.fixture,id:'other'}}},{verifySocket:async()=>{}});
  await assert.rejects(client.read(action.id,action));
});

for (const [name,edit] of Object.entries({
  forged:(c:Capture)=>({...c,actionDigest:'b'.repeat(64)}),
  mismatched:(c:Capture)=>({...c,stdin:{query:'mutation { change }'}}),
  stale:(c:Capture)=>({...c,startedAt:0,finishedAt:0}),
  incomplete:(c:Capture)=>({...c,bytes:3}),
  unavailable:()=>({error:'not found'}),
  uncertain:(c:Capture)=>({...c,state:'unknown'}),
})) test(`client rejects ${name} receipt`,async t=>{
  const {client,action}=await fixture(t,edit);
  await assert.rejects(client.read(action.id,action),(error:any)=>error.effects===(name==='uncertain'?'none':'unknown'));
});

test('client accepts the original complete capture',async t=>{
  const {client,action}=await fixture(t);
  assert.equal((await client.read(action.id,action)).stdout,'{}');
});

test('production client rejects a same-account socket',async t=>{
  const {setup,action}=await fixture(t);
  await assert.rejects(new CaptureClient(setup).read(action.id,action),(error:any)=>error.effects==='unknown');
});

test('client rejects unknown runtime setup fields',async t=>{
  const {setup}=await fixture(t);
  assert.throws(()=>new CaptureClient({...setup,allowEditable:true} as any),/invalid administrator capture setup/);
});

test('setup protection rejects agent-editable configuration',async t=>{
  const {directory}=await fixture(t);
  const path=resolve(directory,'capture-client.json');
  await writeFile(path,'{}'); await chmod(path,0o666);
  await assert.rejects(readCaptureSetup({protect:()=>protectedPath(path,[0],'file')}), /administrator capture setup unavailable or editable/);
});

test('capture setup has no repository override',async t=>{
  const {setup}=await fixture(t);
  let observed='';
  await readCaptureSetup({protect:async path=>{observed=path;},read:async()=>JSON.stringify(setup)});
  assert.equal(observed,'/etc/lets/capture-client.json');
});

test('client bounds oversized receipt responses',async t=>{
  const {client,action}=await fixture(t,c=>({...c,stdout:'x'.repeat(9*1048576)}));
  await assert.rejects(client.read(action.id,action),(error:any)=>error.effects==='unknown');
});
