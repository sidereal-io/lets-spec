import { randomUUID } from 'node:crypto';
import { GitHub, fail } from './github.ts';
import { Store, scope, mutationName, hash } from './store.ts';
import { AdapterFailure } from './errors.ts';
import type { Mappings } from './items.ts';
export type Provenance = { version: 1; provider: string; repository: string; backlog: string; item: string; generation: string; actor: string; session: string; token: string; state: 'active' | 'released' };
export class Claims {
  readonly github: GitHub;
  readonly mappings?: Mappings;
  constructor(github: GitHub, mappings?: Mappings) { this.github = github; this.mappings = mappings; }
  async snapshot(id: string) {
    const github = this.github; const config = await github.project(this.mappings);
    const issue = await github.issue(id);
    const projectItem = await github.projectItem(id);
    const values = await github.values(projectItem); const owners = await github.owners(id);
    const status = Object.entries(config.mappings.Status.values).find(([, option]) => option === values[config.mappings.Status.field])?.[0];
    if (!status) fail('invalid_configuration', 'missing or ambiguous Status');
    // Local intent permits continuation only; native state is checked separately.
    const provenance = new Store(github.context.cwd).read('claim-' + hash([scope(github.context), github.context.actor, github.context.session, id])) as Provenance | undefined;
    return { config, issue, projectItem, values, owners, status, provenance };
  }
  async writable(id: string) {
    const snapshot = await this.snapshot(id);
    if (!snapshot.config.project.viewerCanUpdate || !['WRITE', 'MAINTAIN', 'ADMIN'].includes(await this.github.authenticate())) fail('permission', 'Project write and repository assignment permissions required');
    return snapshot;
  }
  async read(id: string) {
    const state = await this.snapshot(id); const record = state.provenance;
    if (!record || record.state === 'released') {
      if (state.owners.length) fail('conflict', 'assignment without active session provenance cannot authorize work');
      return { claim: { actor: null, session: null, token: null, status: state.status, guarantee: 'best-effort' } };
    }
    if (state.issue.closed || state.owners.length !== 1 || state.owners[0] !== record.actor || !['Todo', 'In Progress'].includes(state.status)) fail('conflict', 'claim ownership or status has changed');
    return { claim: { actor: record.actor, session: record.session, token: record.token, status: state.status, guarantee: 'best-effort' } };
  }
  require(state: Awaited<ReturnType<Claims['snapshot']>>, record: Provenance, owners: string[], statuses: string[]) {
    if (JSON.stringify(state.provenance) !== JSON.stringify(record) || state.issue.closed || state.owners.length !== owners.length || owners.some(owner => !state.owners.includes(owner)) || !statuses.includes(state.status)) fail('conflict', 'claim provenance, owners or status changed');
  }
  async acquire(request: Record<string, any>) {
    const github = this.github; const id = request.input.item.id;
    const store = new Store(github.context.cwd); const name = mutationName(request);
    return store.lock(scope(github.context), async () => {
      const previous = store.read(name);
      if (previous && previous.state !== 'absent') {
        if (JSON.stringify(previous.request) !== JSON.stringify(request)) fail('invalid_request', 'mutation key cannot be rebound');
        if (previous.state !== 'applied') throw new AdapterFailure('unknown_outcome', 'unknown', 'acquire requires mutation reconciliation before retry');
        const state = await this.snapshot(id); this.require(state, previous.intent, [github.context.actor], ['In Progress']);
        return this.read(id);
      }
      const initial = await this.writable(id);
      if (initial.issue.closed || initial.owners.length || initial.status !== 'Todo' || initial.provenance?.state === 'active') fail('conflict', 'item is already owned or not Todo');
      const record: Provenance = previous?.intent ?? { version: 1, provider: 'github', repository: github.context.repository, backlog: github.context.backlog!, item: id, generation: randomUUID(), actor: github.context.actor, session: github.context.session, token: randomUUID(), state: 'active' };
      const entry = { request, state: 'pending', intent: record, phase: 'prepared', result: undefined as any };
      store.write(name, entry);
      let started = false;
      try {
        entry.phase = 'writing'; store.write(name, entry); started = true;
        store.write('claim-' + hash([scope(github.context), github.context.actor, github.context.session, id]), record);
        this.require(await this.snapshot(id), record, [], ['Todo']);
        const actor = (await github.query('Actor', github.variables())).viewer;
        if (actor.login !== record.actor || !actor.id) fail('authentication', 'authenticated actor changed');
        await github.query('Assign', { issue: id, actor: actor.id });
        this.require(await this.snapshot(id), record, [record.actor], ['Todo']);
        await github.query('FieldStatus', { project: github.context.backlog, item: initial.projectItem, field: initial.config.mappings.Status.field, option: initial.config.mappings.Status.values['In Progress'] });
        this.require(await this.snapshot(id), record, [record.actor], ['In Progress']);
        const result = await this.read(id); entry.state = 'applied'; entry.result = result; store.write(name, entry);
        return result;
      } catch (error) {
        if (error instanceof AdapterFailure) throw new AdapterFailure(error.category, started ? error.effects === 'unknown' ? 'unknown' : 'partial' : 'none', error.message);
        throw new AdapterFailure('unknown_outcome', 'unknown', 'claim interrupted; reconcile mutation before progression');
      }
    });
  }

  async reconcile(mutationId: string) {
    const context = this.github.context; const store = new Store(context.cwd);
    const name = mutationName({ context, mutationId });
    return store.lock(scope(context), async () => {
      const entry = store.read(name);
      if (!entry) return { state: 'unknown' };
      const id = entry.request.input.item.id;
      const current = await this.snapshot(id);
      if (entry.request.operation === 'claim.release') {
        const released = { ...entry.intent, state: 'released' };
        if (!current.owners.length && current.status === 'Todo' && !current.issue.closed) {
          store.write('claim-' + hash([scope(context), context.actor, context.session, id]), released);
          current.provenance = released;
          this.require(current, released, [], ['Todo']); entry.state = 'applied'; entry.result = { released: true }; store.write(name, entry);
          return { state: 'applied', result: entry.result };
        }
        if (current.provenance && JSON.stringify(current.provenance) !== JSON.stringify(entry.intent)) fail('conflict', 'release ownership was replaced');
        return { state: 'unknown' };
      }
      if (entry.request.operation !== 'claim.acquire') return { state: 'unknown' };
      if (entry.phase === 'prepared') { entry.state = 'absent'; store.write(name, entry); return { state: 'absent' }; }
      if (current.provenance && JSON.stringify(current.provenance) !== JSON.stringify(entry.intent)) fail('conflict', 'mutation claim was replaced or released');
      if (!current.provenance || !current.owners.length || current.status === 'Todo') return { state: 'unknown' };
      this.require(current, entry.intent, [context.actor], ['In Progress']);
      const result = await this.read(id); entry.state = 'applied'; entry.result = result; store.write(name, entry);
      return { state: 'applied', result };
    });
  }

  async release(request: Record<string, any>) {
    const github = this.github; const id = request.input.item.id;
    const store = new Store(github.context.cwd); const name = mutationName(request);
    return store.lock(scope(github.context), async () => {
      const previous = store.read(name);
      if (previous && JSON.stringify(previous.request) !== JSON.stringify(request)) fail('invalid_request', 'mutation key cannot be rebound');
      const initial = await this.writable(id); const record = initial.provenance;
      if (!record || record.actor !== github.context.actor || record.session !== github.context.session || record.token !== request.input.token) fail('conflict', 'release requires original actor, session and token');
      if (previous?.state === 'applied') {
        this.require(initial, { ...previous.intent, state: 'released' }, [], ['Todo']); return { released: true };
      }
      if (previous) throw new AdapterFailure('unknown_outcome', 'unknown', 'release requires mutation reconciliation before retry');
      if (record.state !== 'active') fail('conflict', 'claim is no longer active');
      const originalOwners = initial.status === 'Todo' && initial.owners.length === 0 ? [] : [record.actor];
      this.require(initial, record, originalOwners, ['Todo', 'In Progress']);
      const entry = { request, state: 'pending', intent: record, phase: 'prepared', result: undefined as any }; store.write(name, entry);
      try {
        entry.phase = 'writing'; store.write(name, entry);
        const actor = (await github.query('Actor', github.variables())).viewer;
        if (actor.login !== record.actor || !actor.id) fail('authentication', 'authenticated actor changed');
        if (originalOwners.length) await github.query('Unassign', { issue: id, actor: actor.id });
        this.require(await this.snapshot(id), record, [], [initial.status]);
        if (initial.status !== 'Todo') await github.query('FieldStatus', { project: github.context.backlog, item: initial.projectItem, field: initial.config.mappings.Status.field, option: initial.config.mappings.Status.values.Todo });
        this.require(await this.snapshot(id), record, [], ['Todo']);
        store.write('claim-' + hash([scope(github.context), github.context.actor, github.context.session, id]), { ...record, state: 'released' });
        this.require(await this.snapshot(id), { ...record, state: 'released' }, [], ['Todo']);
        entry.state = 'applied'; entry.result = { released: true }; store.write(name, entry); return entry.result;
      } catch (error) {
        if (error instanceof AdapterFailure) throw new AdapterFailure(error.category, error.effects === 'unknown' ? 'unknown' : 'partial', error.message);
        throw new AdapterFailure('unknown_outcome', 'unknown', 'release interrupted; reconcile before retry');
      }
    });
  }
}
