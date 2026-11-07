import { randomUUID } from './runtime-context.ts';
import { pullNumber } from './completion.ts';
import { readIdentity, checkSelection, resume } from './identity.ts';
import { loadSession } from './sessions.ts';
import type { Connect } from './sessions.ts';
import type { Context, Query } from './github.ts';
import { fail } from './github.ts';
import { hash, Store } from './store.ts';
import { identityKey } from './items.ts';
import type { Call } from './selection.ts';
export async function reconcileWrite(call: Call, operation: string, input: any, mutationId: string) {
  try { return await call(operation, input, mutationId); }
  catch (error: any) {
    if (!['partial', 'unknown'].includes(error.effects)) throw error;
    const recovery = await call('mutation.read', { mutationId });
    if (recovery.state === 'applied') return recovery.result;
    if (recovery.state === 'absent') return call(operation, input, mutationId);
    throw error;
  }
}
async function pr(context: Context, reference: string, host: Query) {
  const number = pullNumber(reference, context.repository); const [owner, name] = context.repository.split('/');
  const result = (await host('PullRequest', { owner, name, number })).repository?.pullRequest;
  if (!result || result.url !== reference || result.repository?.nameWithOwner?.toLowerCase() !== context.repository.toLowerCase()) fail('conflict', 'code-host PR does not match recorded repository and reference');
  return result;
}
export async function referenceChange(context: Context, change: string, handle: string, reference: string, connect: Connect, host: Query) {
  const { identity, session } = await resume(context, change, handle, connect);
  if (session.reference && session.reference !== reference) fail('conflict', 'continuation already has another PR reference');
  const pull = await pr(context, reference, host);
  if (identity.item.provider === 'github') {
    const closing = `Closes ${identity.reference}`;
    if (!pull.body.split(/\r?\n/).some((line: string) => line.trim() === closing)) await host('UpdatePRBody', { id: pull.id, body: `${pull.body.trimEnd()}\n\n${closing}\n` });
  }
  session.reference = reference; session.referenceMutation ??= randomUUID();
  new Store(context.cwd).write('session-' + hash(handle), session);
  return reconcileWrite(connect(session.context.session), 'reference.write', { item: identity.item, reference }, session.referenceMutation);
}
export async function completeChange(context: Context, change: string, handle: string, reference: string, connect: Connect, host: Query) {
  const identity = readIdentity(context.cwd, change); checkSelection(identity, context);
  const session = loadSession(context, handle);
  if (identityKey(session.item) !== identityKey(identity.item) || JSON.stringify(session.identity) !== JSON.stringify(identity) || session.reference !== reference) fail('conflict', 'completion requires the recorded item and associated PR');
  const pull = await pr(context, reference, host);
  if (pull.merged !== true || typeof pull.mergeCommit?.oid !== 'string' || !pull.mergeCommit.oid.trim()) fail('conflict', 'associated PR is not merged');
  session.completionMutation ??= randomUUID(); new Store(context.cwd).write('session-' + hash(handle), session);
  return reconcileWrite(connect(session.context.session), 'completion.write', { item: identity.item, merge: { reference, merged: true, commit: pull.mergeCommit.oid } }, session.completionMutation);
}
