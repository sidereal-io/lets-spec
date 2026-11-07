import { ActionYield } from './runtime-context.ts';
import { AdapterFailure } from './errors.ts';
import { Claims } from './claims.ts';
import { fail } from './github.ts';
import { Store, scope, mutationName } from './store.ts';
function outside(body: string) {
  const lines=body.match(/.*(?:\n|$)/g)!.filter(Boolean);let offset=0;let fence='';let start=-1;let content=-1;let level=0;let bold=false;
  for(const line of lines){
    const clean=line.replace(/\r?\n$/,'');const marker=/^ {0,3}(`{3,}|~{3,})/.exec(clean);
    if(marker){if(!fence)fence=marker[1];else if(marker[1][0]===fence[0]&&marker[1].length>=fence.length)fence='';offset+=line.length;continue;}
    if(!fence){
      const heading=/^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(clean);
      if(start<0&&(heading?.[2]==='Glossary handoff'||/^\*\*Glossary handoff\*\*:?.*$/.test(clean))){start=offset;content=offset+line.length;level=heading?.[1].length??0;bold=!heading;}
      else if(start>=0&&((heading&&(bold||heading[1].length<=level))||(bold&&/^\*\*[^*]+\*\*:\s*$/.test(clean))))return [body.slice(0,start),body.slice(offset)];
    }
    offset+=line.length;
  }
  if(content<0)fail('unsupported','existing Glossary handoff section required');
  return [body.slice(0,start),''];
}
export async function updateGlossary(claims: Claims, request: Record<string, any>) {
  if (Object.keys(request.input.patch).some(key => key !== 'body') || typeof request.input.patch.body !== 'string') fail('unsupported', 'build only updates Glossary handoff body text');
  const github = claims.github; const id = request.input.item.id; const context = github.context;
  const store = new Store(context.cwd); const name = mutationName(request);
  return store.lock(scope(context), async () => {
    const previous = store.read(name);
    if (previous && JSON.stringify(previous.request) !== JSON.stringify(request)) fail('invalid_request', 'mutation key cannot be rebound');
    const current = await claims.writable(id); const claim = (await claims.read(id)).claim;
    if (claim.actor !== context.actor || claim.session !== context.session || claim.status !== 'In Progress') fail('conflict', 'glossary update requires the current session claim');
    const body = request.input.patch.body;
    if (JSON.stringify(outside(current.issue.body)) !== JSON.stringify(outside(body))) fail('unsupported', 'only the Glossary handoff section may change');
    if (body !== current.issue.body) {
      if (previous && previous.state !== 'absent') fail('conflict', 'uncertain glossary update requires reconciliation');
      store.write(name, { request, state: 'pending' });
      try { await github.query('UpdateIssueBody', { id, body }); }
      catch (error) {
        if (error instanceof ActionYield) throw error;
        if (error instanceof AdapterFailure && error.effects === 'none') store.write(name, { request, state: 'absent' });
        throw error;
      }
    }
    try {
      const item = await github.read(id, claims.mappings, true);
      if (item.body !== body) fail('conflict', 'glossary body changed during update');
      const result = { item }; store.write(name, { request, state: 'applied', result }); return result;
    } catch (error) {
        if (error instanceof ActionYield) throw error;
      if (body !== current.issue.body || previous?.state === 'pending') {
        if (error instanceof AdapterFailure) throw new AdapterFailure(error.category, error.effects === 'unknown' ? 'unknown' : 'partial', error.message);
        throw new AdapterFailure('unknown_outcome', 'unknown', 'glossary verification interrupted after write');
      }
      throw error;
    }
  });
}
export async function reconcileGlossary(claims: Claims, mutationId: string) {
  const context = claims.github.context; const store = new Store(context.cwd); const name = mutationName({ context, mutationId });
  return store.lock(scope(context), async () => {
    const entry = store.read(name); if (!entry) return { state: 'unknown' };
    const claim = (await claims.read(entry.request.input.item.id)).claim;
    if (claim.actor !== context.actor || claim.session !== context.session || claim.status !== 'In Progress') fail('conflict', 'glossary ownership changed');
    const item = await claims.github.read(entry.request.input.item.id, claims.mappings, true);
    if (item.body !== entry.request.input.patch.body) return { state: entry.state === 'absent' ? 'absent' : 'unknown' };
    entry.state = 'applied'; entry.result = { item }; store.write(name, entry); return { state: 'applied', result: entry.result };
  });
}
