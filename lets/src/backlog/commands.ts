import { readStdin } from './stdin.ts';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { Client } from './client.ts';
import { select } from './selection.ts';
import { acquireSession, loadSession, recoverSession } from './sessions.ts';
import { bind, resume, readIdentity, checkSelection } from './identity.ts';
import { Store, hash, mutationName } from './store.ts';
import { referenceChange, completeChange, reconcileWrite } from './host.ts';
import { GitHub, fail } from './github.ts';
import { ghQuery } from './gh.ts';
import { AdapterFailure } from './errors.ts';
import { identityKey } from './items.ts';
import { requireCapability } from './capabilities.ts';
import { validateRequest, MUTATIONS } from './protocol.ts';
import { invoke } from './transport.ts';
export async function execute(command: string, input: Record<string, any>, cwd: string) {
  if (command === 'request') {
    validateRequest(input as unknown);
    if (input.context.cwd !== cwd) fail('invalid_request', 'request cwd must match current repository cwd');
    const client = new Client(cwd, input.context);
    if (client.context.provider !== input.context.provider) fail('invalid_configuration', 'provider differs from current selection');
    if (!['backlog.list', 'backlog.create'].includes(input.operation)) {
      await client.resolve();
      if (input.context.backlog !== client.context.backlog) fail('invalid_configuration', 'backlog differs from current selection');
    }
    if (MUTATIONS.includes(input.operation)) {
      const session = loadSession(client.context, input.handle);
      if (input.context.session !== session.context.session || (input.input.item && identityKey(input.input.item) !== identityKey(session.item))) fail('conflict', 'raw mutation requires the original private continuation handle and scope');
      if (input.operation === 'claim.acquire' && input.mutationId !== session.mutationId) fail('conflict', 'raw acquire must continue its original mutation key');
    }
    const { handle: _privateHandle, ...envelope } = input;
    return invoke(client.selection.executable, envelope, { timeoutMs: client.timeoutMs });
  }
  const client = await new Client(cwd, input).resolve(); const { context, call, connect } = client;
  if (command === 'select') return { context, ...await select(call, context.repository, input.reference) };
  if (command === 'claim') {
    const { capabilities } = await call('capability.read');
    requireCapability(capabilities, 'claims'); requireCapability(capabilities, 'blockers'); requireCapability(capabilities, 'metadata');
    if (input.handle) {
      const session = loadSession(context, input.handle);
      if (input.item && identityKey(input.item) !== identityKey(session.item)) fail('conflict', 'continuation item differs from original claim');
      await recoverSession(context, input.handle, connect);
      return { handle: input.handle, claim: (await connect(session.context.session)('claim.read', { item: session.item })).claim };
    }
    return acquireSession(context, input.item, connect);
  }
  if (command === 'release') {
    const session = loadSession(context, input.handle); const store = new Store(cwd);
    const token = session.token ?? store.read(mutationName({ context: session.context, mutationId: session.mutationId }))?.intent?.token;
    if (!token) fail('conflict', 'original claim token unavailable; reconcile manually');
    session.releaseMutation ??= randomUUID(); store.write('session-' + hash(input.handle), session);
    return reconcileWrite(connect(session.context.session), 'claim.release', { item: session.item, token }, session.releaseMutation);
  }
  if (command === 'bind') return bind(context, input.change, input.handle, (await call('item.read', { item: input.item })).item, connect);
  if (command === 'resume') { const result = await resume(context, input.change, input.handle, connect); return { identity: result.identity, handle: input.handle }; }
  if (command === 'reference' || command === 'complete') {
    const { capabilities } = await call('capability.read'); requireCapability(capabilities, command === 'reference' ? 'references' : 'completion');
    return (command === 'reference' ? referenceChange : completeChange)(context, input.change, input.handle, input.reference, connect, ghQuery(cwd));
  }
  if (command === 'packet') {
    if (context.provider !== 'github') fail('unsupported', 'supplemental packet reads are currently GitHub-only');
    let item = input.item;
    if (input.change) { const identity = readIdentity(cwd, input.change); checkSelection(identity, context); item = identity.item; }
    if (!item && input.reference) item = (await call('item.search', { query: input.reference })).items[0]?.identity;
    if (!item || item.provider !== context.provider || item.backlog !== context.backlog) fail('invalid_request', 'scoped item or recorded change required');
    const config = parse(readFileSync(join(cwd, 'openspec/config.yaml'), 'utf8'));
    return new GitHub(context, ghQuery(cwd)).packet(item.id, config?.lets?.backlog?.mappings);
  }
  if (command === 'glossary-update') {
    const { identity, session } = await resume(context, input.change, input.handle, connect);
    return reconcileWrite(connect(session.context.session), 'item.update', { item: identity.item, patch: { body: input.body } }, input.mutationId ?? randomUUID());
  }
  fail('invalid_request', 'unknown backlog command');
}
export async function run(command: string) {
  try {
    const source = await readStdin();
    let input;
    try { input = JSON.parse(source); } catch { fail('invalid_request', 'expected one JSON input on stdin'); }
    const result = await execute(command, input, process.cwd()); process.stdout.write(JSON.stringify(result) + '\n');
  } catch (error: any) {
    const failure = error instanceof AdapterFailure ? error : new AdapterFailure('invalid_request', 'none', 'invalid backlog input or unavailable state');
    process.stdout.write(JSON.stringify({ error: { category: failure.category, effects: failure.effects, message: failure.message }, ...(error.continuationHandle ? { handle: error.continuationHandle } : {}) }) + '\n');
    process.exitCode = failure.category === 'invalid_request' ? 2 : 1;
  }
}
