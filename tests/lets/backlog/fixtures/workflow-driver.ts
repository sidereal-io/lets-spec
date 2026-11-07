// Offline contract fixture. This receipt collector is deliberately not a
// production capture channel; deployment qualification uses the protected runner.
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {WorkflowEngine} from '../../../../lets/src/backlog/workflows.ts';
import {transaction} from '../../../../lets/src/backlog/runtime-context.ts';
import {execute} from '../../../../lets/src/backlog/commands.ts';
import {loadDefinition,render} from '../../../../lets/src/backlog/definitions.ts';
import {AdapterFailure} from '../../../../lets/src/backlog/errors.ts';
import {dispatch} from '../../../../lets/src/backlog/github-main.ts';
import type {Capture} from '../../../../lets/src/backlog/action-contract.ts';
const tool={id:'github-graphql',digest:'a'.repeat(64),authentication:'offline-fixture',executable:process.execPath,argv:[]};
const captures=new Map<string,Capture>();
const input=JSON.parse(readFileSync(0,'utf8'));
const engine=new WorkflowEngine(process.cwd(),{tools:{'github-graphql':tool},capture:{async read(reference){return captures.get(reference)!;}},execute:async(command,input,cwd)=>command==='fixture-request'?dispatch(input,transaction.getStore()!.query!):execute(command,input,cwd)});
try {
  if(process.argv[2]==='fixture-request') {
    const definition=loadDefinition({name:'github',version:1},'github',process.cwd()).definition;
    const result=await dispatch(input,async(name,variables)=>{
      const fact=definition.facts[name];
      const child=spawnSync(process.execPath,[process.argv[3]],{input:JSON.stringify(render(fact.stdin,null,variables)),encoding:'utf8'});
      let response:any;try{response=JSON.parse(child.stdout);}catch{throw new AdapterFailure('unknown_outcome','unknown','offline fixture lost the backend result');}
      if(child.status!==0||response.errors?.length)throw new AdapterFailure(response.errors?.some((error:any)=>error.type==='FORBIDDEN')?'permission':'unknown_outcome',response.errors?.length?'none':'unknown','offline backend result failed');
      return render(fact.result,response);
    });
    console.log(JSON.stringify(result));
    process.exit(0);
  }
  let current=process.argv[2]==='reconcile'?await engine.reconcile(input):await engine.start(process.argv[2],input);
  while(current.state==='action-required'){
    const action=current.action;const reference=randomUUID();const startedAt=Date.now();
    const result=spawnSync(process.execPath,[process.argv[3]],{input:JSON.stringify(action.stdin),encoding:'utf8'});
    captures.set(reference,{version:1,id:reference,actionId:action.id,actionDigest:action.digest,tool:action.tool,stdin:action.stdin,startedAt,finishedAt:Date.now(),dispatched:true,state:'complete',exitCode:result.status,signal:result.signal,stdout:result.stdout,stderr:result.stderr,bytes:Buffer.byteLength(result.stdout)+Buffer.byteLength(result.stderr)});
    current=await engine.submit({workflow:current.workflow,actionId:action.id,receipt:reference});
  }
  console.log(JSON.stringify(current.result));
}catch(error:any){console.log(JSON.stringify({error:{category:error.category??'invalid_request',effects:error.effects??'none',message:error.message},...(error.continuationHandle?{handle:error.continuationHandle}:{}),...(error.workflow?{workflow:error.workflow,actionId:error.actionId}:{})}));process.exitCode=error.category==='invalid_request'?2:1;}
