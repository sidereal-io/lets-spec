import { AdapterFailure } from './errors.ts';
import { Claims } from './claims.ts';
import { fail } from './github.ts';
import { Store, scope, mutationName } from './store.ts';
function outside(body: string) {
  const start = /^(?:#{1,6}\s+Glossary handoff\s*|\*\*Glossary handoff\*\*:?.*)$/m.exec(body);
  if (!start) fail('unsupported', 'existing Glossary handoff section required');
  const rest = body.slice(start.index + start[0].length);
  const end = /^#{1,6}\s+|^\*\*[^*]+\*\*:/m.exec(rest);
  return [body.slice(0, start.index), end ? rest.slice(end.index) : ''];
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
        if (error instanceof AdapterFailure && error.effects === 'none') store.write(name, { request, state: 'absent' });
        throw error;
      }
    }
    try {
      const item = await github.read(id, claims.mappings);
      if (item.body !== body) fail('conflict', 'glossary body changed during update');
      const result = { item }; store.write(name, { request, state: 'applied', result }); return result;
    } catch (error) {
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
    const item = await claims.github.read(entry.request.input.item.id, claims.mappings);
    if (item.body !== entry.request.input.patch.body) return { state: entry.state === 'absent' ? 'absent' : 'unknown' };
    entry.state = 'applied'; entry.result = { item }; store.write(name, entry); return { state: 'applied', result: entry.result };
  });
}
