import { Claims } from './claims.ts';
import { fail } from './github.ts';
import { Store, scope, mutationName } from './store.ts';
import { AdapterFailure } from './errors.ts';
export function pullNumber(reference: string, repository: string) {
  let url;
  try { url = new URL(reference); } catch { fail('invalid_request', 'PR must be a GitHub URL'); }
  const parts = url.pathname.split('/').filter(Boolean);
  if (url.origin !== 'https://github.com' || url.search || url.hash || parts.length !== 4 || `${parts[0]}/${parts[1]}`.toLowerCase() !== repository.toLowerCase() || parts[2] !== 'pull' || !/^[1-9][0-9]*$/.test(parts[3])) fail('conflict', 'PR reference must match the recorded repository');
  return Number(parts[3]);
}
export class Completion {
  readonly claims: Claims;
  constructor(claims: Claims) { this.claims = claims; }
  async current(id: string) {
    const state = await this.claims.writable(id); const context = this.claims.github.context;
    if (!state.config.referenceField) fail('unsupported', 'Lets reference text field required');
    const record = state.provenance;
    if (!record || record.state !== 'active' || record.actor !== context.actor || record.session !== context.session || state.owners.length !== 1 || state.owners[0] !== context.actor || !['In Progress', 'Done'].includes(state.status)) fail('conflict', 'PR lifecycle requires original current claim provenance');
    return state;
  }
  association(state: Awaited<ReturnType<Completion['current']>>) {
    const text = state.values[state.config.referenceField!];
    if (text === undefined || text === '') return undefined;
    let value;
    try { value = JSON.parse(text as string); } catch { fail('conflict', 'malformed PR association'); }
    const context = this.claims.github.context;
    if (!value || value.version !== 1 || value.repository !== context.repository || value.item !== state.issue.id || typeof value.reference !== 'string' || Object.keys(value).some(key => !['version', 'repository', 'item', 'reference'].includes(key))) fail('conflict', 'PR association scope or schema differs');
    pullNumber(value.reference, context.repository);
    return value;
  }
  async write(request: Record<string, any>) {
    const github = this.claims.github; const context = github.context; const id = request.input.item.id;
    const store = new Store(context.cwd); const name = mutationName(request);
    return store.lock(scope(context), async () => {
      const previous = store.read(name);
      if (previous && JSON.stringify(previous.request) !== JSON.stringify(request)) fail('invalid_request', 'mutation key cannot be rebound');
      const state = await this.current(id); const association = this.association(state);
      const completing = request.operation === 'completion.write'; const reference = completing ? request.input.merge.reference : request.input.reference;
      pullNumber(reference, context.repository);
      if (association && association.reference !== reference) fail('conflict', 'item is associated with a different PR');
      if (completing && (!association || request.input.merge.merged !== true || !request.input.merge.commit?.trim())) fail('conflict', 'completion requires associated PR merge and nonempty commit evidence');
      const result = completing ? { status: 'Done' } : { reference };
      if ((completing && state.status === 'Done') || (!completing && association)) {
        store.write(name, { request, state: 'applied', result }); return result;
      }
      if (previous && previous.state !== 'absent') throw new AdapterFailure('unknown_outcome', 'unknown', 'PR mutation requires reconciliation before retry');
      const entry = { request, state: 'pending', phase: 'writing', result }; store.write(name, entry);
      try {
        if (completing) await github.query('FieldStatus', { project: context.backlog, item: state.projectItem, field: state.config.mappings.Status.field, option: state.config.mappings.Status.values.Done });
        else await github.query('FieldText', { project: context.backlog, item: state.projectItem, field: state.config.referenceField, text: JSON.stringify({ version: 1, repository: context.repository, item: id, reference }) });
        const fresh = await this.current(id); const linked = this.association(fresh);
        if (linked?.reference !== reference || (completing && fresh.status !== 'Done')) fail('conflict', 'PR mutation did not retain expected association and state');
        entry.state = 'applied'; store.write(name, entry); return result;
      } catch (error) {
        if (error instanceof AdapterFailure) {
          if (error.effects === 'none') { entry.state = 'absent'; store.write(name, entry); }
          throw error;
        }
        throw new AdapterFailure('unknown_outcome', 'unknown', 'PR mutation interrupted; reconcile before retry');
      }
    });
  }
  async reconcile(mutationId: string) {
    const context = this.claims.github.context; const store = new Store(context.cwd); const name = mutationName({ context, mutationId });
    return store.lock(scope(context), async () => {
      const entry = store.read(name);
      if (!entry || !['reference.write', 'completion.write'].includes(entry.request.operation)) return { state: 'unknown' };
      const state = await this.current(entry.request.input.item.id); const linked = this.association(state);
      const completing = entry.request.operation === 'completion.write'; const reference = completing ? entry.request.input.merge.reference : entry.request.input.reference;
      if (linked && linked.reference !== reference) fail('conflict', 'PR association changed after mutation');
      if (linked?.reference !== reference || (completing && state.status !== 'Done')) return { state: entry.state === 'absent' ? 'absent' : 'unknown' };
      entry.state = 'applied'; entry.result = completing ? { status: 'Done' } : { reference }; store.write(name, entry);
      return { state: 'applied', result: entry.result };
    });
  }
}
