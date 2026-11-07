import {resolveConfiguration} from './repository-config.ts';
import {AdapterFailure} from './errors.ts';
/** Validate already-parsed configuration using the production definition path. */
export function checkConfiguration(document:unknown,cwd:string,available:(tool:string)=>unknown){
  const selection=resolveConfiguration(document,cwd);
  for(const tool of new Set(Object.values(selection.definition.facts).map(fact=>fact.tool)))if(!available(tool))throw new AdapterFailure('invalid_configuration','none','required trusted tool unavailable; no fallback');
  return selection;
}
