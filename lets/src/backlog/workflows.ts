import {randomUUID} from 'node:crypto';
import {readdirSync} from 'node:fs';
import {Store,hash} from './store.ts';
import {transaction,ActionYield} from './runtime-context.ts';
import {readConfiguration} from './repository-config.ts';
import {render} from './definitions.ts';
import {AdapterFailure,NonDispatchFailure} from './errors.ts';
import {digest,sealAction,verifyCapture,capturedReadFailure} from './action-contract.ts';
import type {Action,CaptureReader,TrustedTool} from './action-contract.ts';
import type {Query} from './github.ts';
type Entry={action:Action;result?:any;receipt?:string;notDispatched?:boolean};
type Workflow={version:1;handle:string;command:string;input:Record<string,any>;configuration:string;created:number;initial:Record<string,any>;entries:Entry[];status:'active'|'complete';history?:Entry[];readOnly?:boolean;baseline?:Record<string,any>;result?:any;remove?:string[];commit?:Record<string,any>};
type Options={tools:Record<string,TrustedTool>;capture:CaptureReader;execute:(command:string,input:Record<string,any>,cwd:string)=>Promise<any>};
function failure(message:string):never {throw new AdapterFailure('conflict','none',message);}
export class WorkflowEngine {
  readonly store:Store;
  readonly cwd:string;
  readonly options:Options;
  constructor(cwd:string,options:Options){this.cwd=cwd;this.options=options;this.store=new Store(cwd);}
  private name(handle:string){if(typeof handle!=='string'||!handle)failure('original workflow handle required');return 'workflow-'+hash(handle);}
  private recover(workflow:Workflow){
    if(workflow.commit){for(const [name,value] of Object.entries(workflow.commit))this.store.write(name,value);for(const name of workflow.remove??[])this.store.remove(name);delete workflow.remove;delete workflow.commit;this.store.write(this.name(workflow.handle),workflow);}
  }
  private cancelUnsent(workflow:Workflow) {
    const writes=[...workflow.history??[],...workflow.entries].filter(entry=>entry.action.mode==='write');
    if(!writes.length||writes.some(entry=>!entry.notDispatched))return false;
    const baseline=workflow.baseline??workflow.initial;
    workflow.commit=baseline;workflow.remove=readdirSync(this.store.root).filter(name=>/^(claim-|current-local-claim-|mutation-|reference-|session-).*\.json$/.test(name)).map(name=>name.slice(0,-5)).filter(name=>!Object.hasOwn(baseline,name));
    workflow.status='complete';workflow.result={state:'absent'};this.store.write(this.name(workflow.handle),workflow);this.recover(workflow);return true;
  }
  private submissionFailure(workflow:Workflow, error:AdapterFailure):never {
    const issuedWrite=[...workflow.history??[],...workflow.entries].some(entry=>entry.action.mode==='write'&&!entry.notDispatched);
    if(!issuedWrite&&error.effects==='none'){
      const baseline=workflow.baseline??workflow.initial;workflow.commit=baseline;workflow.remove=readdirSync(this.store.root).filter(name=>/^(claim-|current-local-claim-|mutation-|reference-|session-).*\.json$/.test(name)).map(name=>name.slice(0,-5)).filter(name=>!Object.hasOwn(baseline,name));workflow.status='complete';this.store.write(this.name(workflow.handle),workflow);this.recover(workflow);throw error;
    }
    throw Object.assign(new AdapterFailure(error.category,issuedWrite?'unknown':error.effects,error.message),{workflow:workflow.handle,actionId:workflow.entries.at(-1)?.action.id});
  }
  async start(command:string,input:Record<string,any>):Promise<any>{
    return this.store.lock('workflow',async()=>{
      const reservation=this.store.read('workflow-current');
      if(reservation){const prior=this.store.read(this.name(reservation.handle));if(!prior||prior.status!=='complete')failure('an outstanding workflow requires its original private handle');this.recover(prior);}
      const configuration=readConfiguration(this.cwd);
      for(const fact of Object.values(configuration.definition.facts))if(!this.options.tools[fact.tool])throw new AdapterFailure('invalid_configuration','none','required trusted tool unavailable; no fallback');
      const initial=Object.fromEntries(readdirSync(this.store.root).filter(name=>/^(claim-|current-local-claim-|mutation-|reference-|session-).*\.json$/.test(name)).map(name=>[name.slice(0,-5),this.store.read(name.slice(0,-5))]));
      const workflow:Workflow={version:1,handle:randomUUID(),command,input:structuredClone(input),configuration:digest(configuration),created:Date.now(),initial,entries:[],status:'active'};
      this.store.write(this.name(workflow.handle),workflow);this.store.write('workflow-current',{handle:workflow.handle});
      return this.advance(workflow);
    });
  }
  async submit(input:{workflow:string;actionId:string;receipt:string}):Promise<any>{
    if(!input||typeof input.receipt!=='string'||!input.receipt||Object.keys(input).some(key=>!['workflow','actionId','receipt'].includes(key)))failure('one independent capture receipt reference required');
    return this.store.lock('workflow',async()=>{
      const workflow=this.store.read(this.name(input.workflow)) as Workflow|undefined;
      if(!workflow)failure('original outstanding workflow required');
      if(workflow.status==='complete'){
        if(!workflow.entries.some(entry=>entry.action.id===input.actionId&&entry.receipt===input.receipt))failure('submission does not match an accepted action');
        return this.advance(workflow,true);
      }
      if(this.store.read('workflow-current')?.handle!==input.workflow)failure('original outstanding workflow required');
      this.recover(workflow);
      if(digest(readConfiguration(this.cwd))!==workflow.configuration)failure('workflow configuration changed');
      const entry=workflow.entries.at(-1);
      if(workflow.entries.some(item=>item.action.id===input.actionId&&item.receipt===input.receipt))return this.advance(workflow);
      if(!entry||entry.receipt||entry.action.id!==input.actionId)failure('submission does not match the outstanding action');
      if(workflow.entries.some(item=>item.receipt===input.receipt))failure('capture receipt cannot be replayed');
      let captured;
      try{captured=verifyCapture(entry.action,await this.options.capture.read(input.receipt,entry.action),input.receipt);}
      catch(error){
        if(error instanceof NonDispatchFailure){entry.notDispatched=true;this.store.write(this.name(workflow.handle),workflow);if(this.cancelUnsent(workflow))throw error;}
        const failure=error instanceof AdapterFailure?error:new AdapterFailure('unknown_outcome','unknown','independent capture unavailable; retain original workflow');
        if(failure.effects==='none')this.submissionFailure(workflow,failure);
        const sessions=Object.entries(workflow.commit??{}).filter(([name,value])=>name.startsWith('session-')&&value.context?.session===entry.action.scope.session);
        // Checkpoint commits have already been applied, so recover the exact
        // original local session by scope rather than adopting another claim.
        const matches=sessions.length?sessions:readdirSync(this.store.root).filter(name=>name.startsWith('session-')&&name.endsWith('.json')).map(name=>[name,this.store.read(name.slice(0,-5))] as const).filter(([,value])=>value.context?.session===entry.action.scope.session);
        throw Object.assign(failure,{workflow:workflow.handle,actionId:entry.action.id,...(matches.length===1?{continuationHandle:matches[0][1].handle}:{})});
      }
      let response;
      try{response=JSON.parse(captured.stdout);}catch{this.submissionFailure(workflow,new AdapterFailure('unsupported',entry.action.mode==='read'?'none':'unknown','captured result is not JSON'));}
      if(!response||typeof response!=='object'||response.errors?.length)this.submissionFailure(workflow,entry.action.mode==='read'?capturedReadFailure(captured):new AdapterFailure('unknown_outcome','unknown','captured backend result failed; reconcile original action'));
      const definition=readConfiguration(this.cwd).definition;
      try{entry.result=render(definition.facts[entry.action.name].result,response);}catch{this.submissionFailure(workflow,new AdapterFailure('unknown_outcome',entry.action.mode==='read'?'none':'unknown','captured response cannot establish the required normalized facts; reconcile original action'));}
      entry.receipt=input.receipt;
      this.store.write(this.name(workflow.handle),workflow);
      return this.advance(workflow);
    });
  }
  async abandon(input:{workflow:string}):Promise<any>{
    return this.store.lock('workflow',async()=>{
      const workflow=this.store.read(this.name(input.workflow)) as Workflow;
      if(!workflow||workflow.status!=='active'||this.store.read('workflow-current')?.handle!==input.workflow)failure('original outstanding workflow required');
      if([...workflow.history??[],...workflow.entries].some(entry=>entry.action.mode==='write'))failure('issued write cannot be abandoned; reconcile original action');
      this.recover(workflow);workflow.commit=workflow.initial;workflow.remove=readdirSync(this.store.root).filter(name=>/^(claim-|current-local-claim-|mutation-|reference-|session-).*\.json$/.test(name)).map(name=>name.slice(0,-5)).filter(name=>!Object.hasOwn(workflow.initial,name));workflow.status='complete';this.store.write(this.name(workflow.handle),workflow);this.recover(workflow);return {state:'abandoned'};
    });
  }
  async reconcile(input:{workflow:string}):Promise<any>{
    return this.store.lock('workflow',async()=>{
      const workflow=this.store.read(this.name(input.workflow)) as Workflow;
      if(!workflow||workflow.status!=='active'||this.store.read('workflow-current')?.handle!==input.workflow)failure('original outstanding workflow required');
      if(digest(readConfiguration(this.cwd))!==workflow.configuration)failure('workflow configuration changed');
      this.recover(workflow);
      const entries=[...workflow.history??[],...workflow.entries];
      const unsettled=entries.findLast(entry=>entry.action.mode==='write'&&!entry.receipt&&!entry.notDispatched);
      if(unsettled&&this.options.capture.settle){
        try{await this.options.capture.settle(unsettled.action);}catch(error){if(error instanceof NonDispatchFailure){unsettled.notDispatched=true;this.store.write(this.name(workflow.handle),workflow);if(this.cancelUnsent(workflow))return {state:'complete',result:{state:'absent'}};}}
      }

      if(!entries.some(entry=>entry.action.mode==='write')){
        const current=workflow.entries.at(-1);if(current&&!current.receipt){workflow.entries.pop();workflow.history=[...workflow.history??[],current];}
        return this.advance(workflow);
      }
      // Only the original private mutation journal can identify recovery. A new
      // request or a published actor/session pair cannot adopt this reservation.
      const records=Object.fromEntries(readdirSync(this.store.root).filter(name=>/^(claim-|current-local-claim-|mutation-|reference-|session-).*\.json$/.test(name)).map(name=>[name.slice(0,-5),this.store.read(name.slice(0,-5))]));
      const pending=Object.entries(records).filter(([name,value])=>name.startsWith('mutation-')&&value?.request&&digest(value)!==digest(workflow.initial[name]));
      const request=workflow.readOnly?workflow.input.request:pending.length===1?pending[0][1].request:undefined;
      if(!request)failure('original mutation provenance unavailable; manual reconciliation required');
      const sessions=Object.entries(records).filter(([name,value])=>name.startsWith('session-')&&value.context?.session===request.context.session);
      workflow.baseline??=workflow.initial;
      workflow.history=entries;workflow.entries=[];workflow.initial=records;workflow.command='reconcile-internal';workflow.input={request,...(sessions.length===1?{handle:sessions[0][1].handle}:{})};workflow.readOnly=true;
      this.store.write(this.name(workflow.handle),workflow);
      return this.advance(workflow);
    });
  }
  private async advance(workflow:Workflow,replayOnly=false):Promise<any>{
    const configuration=readConfiguration(this.cwd);
    if(digest(configuration)!==workflow.configuration)failure('workflow configuration changed; original definition and scope required');
    if((!workflow.readOnly&&Date.now()-workflow.created>86400000)||workflow.entries.length>10000)failure('workflow bound exceeded; reconcile original continuation');
    const tx={root:this.store.root,records:structuredClone(workflow.initial),seed:workflow.handle,nextId:0,query:undefined as Query|undefined};
    const requireFresh = () => {
      const latest=new Map<string,Entry>();
      for(const entry of workflow.entries)if(entry.receipt&&['Actor','IssueOwners','ItemValues'].includes(entry.action.name))latest.set(entry.action.name,entry);
      if([...latest.values()].some(entry=>entry.action.expiresAt<=Date.now()))throw new AdapterFailure('conflict',workflow.entries.some(entry=>entry.action.mode==='write')?'partial':'none','fresh captured ownership/status/authentication facts are required; reconcile or restart before progression');
    };
    let index=0;
    tx.query=async(name,variables,context)=>{
      const fact=configuration.definition.facts[name];if(!fact)failure('unknown definition fact');
      const stdin=render(fact.stdin,null,variables);
      const sourceScope=context??workflow.input.request?.context??workflow.input.context??workflow.input;
      const actionScope={provider:configuration.provider,repository:sourceScope.repository,actor:sourceScope.actor,session:sourceScope.session??workflow.handle,...((sourceScope.backlog??configuration.backlog)?{backlog:sourceScope.backlog??configuration.backlog}:{})};
      const prior=workflow.entries[index++];
      if(prior){
        if(prior.action.workflow!==workflow.handle||prior.action.name!==name||digest(prior.action.scope)!==digest(actionScope)||digest(prior.action.tool)!==digest(this.options.tools[fact.tool])||digest(prior.action.stdin)!==digest(stdin))failure('workflow replay differs from original bounded action');
        if(prior.receipt){
          const capture=verifyCapture(prior.action,await this.options.capture.read(prior.receipt,prior.action,{historical:true}),prior.receipt,Date.now(),true);
          const response=JSON.parse(capture.stdout);
          if(response.errors?.length)failure('historical capture has backend errors');
          return render(fact.result,response);
        }
        throw new ActionYield();
      }
      if(fact.mode==='write')requireFresh();
      if(replayOnly)failure('completed workflow replay diverged from its accepted transcript');
      if(workflow.readOnly&&fact.mode==='write')failure('uncertain reservation permits reconciliation reads only');
      const tool=this.options.tools[fact.tool];if(!tool)throw new AdapterFailure('invalid_configuration','none','required trusted tool unavailable; no fallback');
      const issuedAt=Date.now();
      const action=sealAction({version:1,id:randomUUID(),workflow:workflow.handle,sequence:(workflow.history?.length??0)+workflow.entries.length,name,scope:actionScope,tool,stdin,mode:fact.mode,issuedAt,expiresAt:issuedAt+180000,timeoutMs:4500,maxBytes:1048576});
      workflow.entries.push({action});throw new ActionYield();
    };
    let result:any;let error:any;
    try{result=await transaction.run(tx,()=>this.options.execute(workflow.command,workflow.input,this.cwd));}
    catch(caught){error=caught;}
    if(replayOnly){if(error)throw error;return {state:'complete',result};}
    const issuedWrite=[...workflow.history??[],...workflow.entries].some(entry=>entry.action.mode==='write');
    if(error&&!(error instanceof ActionYield)&&!(error instanceof AdapterFailure)){const original=error;error=new AdapterFailure(issuedWrite?'unknown_outcome':'invalid_configuration',issuedWrite?'unknown':'none','backlog policy or captured response validation failed');if(original.continuationHandle)Object.assign(error,{continuationHandle:original.continuationHandle});}
    workflow.commit=error&&!(error instanceof ActionYield)&&!issuedWrite?workflow.initial:tx.records;
    if(error&&!(error instanceof ActionYield)&&!issuedWrite)workflow.remove=Object.keys(tx.records).filter(name=>!Object.hasOwn(workflow.initial,name));
    if(!(error instanceof ActionYield)&&!(['partial','unknown'].includes(error?.effects)&&[...workflow.history??[],...workflow.entries].some(entry=>entry.action.mode==='write'))&&(!workflow.readOnly||(!error&&['applied','absent'].includes(result?.state)))){workflow.status='complete';if(!error)workflow.result=result;}
    this.store.write(this.name(workflow.handle),workflow);this.recover(workflow);
    if(error instanceof ActionYield){return {state:'action-required',workflow:workflow.handle,action:workflow.entries.at(-1)!.action};}
    if(error)throw Object.assign(error,workflow.status==='active'?{workflow:workflow.handle,actionId:workflow.entries.at(-1)?.action.id}:{});
    if(workflow.status!=='complete')return {state:'reconciliation-required',workflow:workflow.handle};
    return {state:'complete',result};
  }
}
