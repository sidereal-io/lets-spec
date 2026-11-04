import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { join, relative, isAbsolute, resolve } from 'node:path';
import { validateItem, identityKey } from './items.ts';
import type { Item } from './items.ts';
import { validateIdentity } from './protocol.ts';
import type { Identity } from './protocol.ts';
import { fail } from './github.ts';
import type { Context } from './github.ts';
import { recoverSession } from './sessions.ts';
import type { Connect } from './sessions.ts';
import { Store, hash } from './store.ts';
export type ChangeIdentity = { version: 1; repository: string; item: Identity; reference: string; url?: string };
function pathFor(cwd: string, change: string) {
  const root = realpathSync(join(cwd, 'openspec/changes')); const path = realpathSync(resolve(cwd, change));
  const inside = relative(root, path);
  if (!inside || inside.startsWith('..') || isAbsolute(inside)) fail('invalid_request', 'change must be a folder under openspec/changes');
  return join(path, 'backlog.json');
}
function validate(value: any): asserts value is ChangeIdentity {
  validateIdentity(value?.item);
  if (Object.keys(value.item).some(key => !['provider', 'backlog', 'id'].includes(key))) fail('invalid_configuration', 'identity contains nonidentity fields');
  if (value.version !== 1 || typeof value.repository !== 'string' || !value.repository || typeof value.reference !== 'string' || !value.reference || Object.keys(value).some(key => !['version', 'repository', 'item', 'reference', 'url'].includes(key)) || (value.url !== undefined && (typeof value.url !== 'string' || !URL.canParse(value.url)))) fail('invalid_configuration', 'invalid versioned change backlog identity');
}
export function readIdentity(cwd: string, change: string): ChangeIdentity {
  try { const value = JSON.parse(readFileSync(pathFor(cwd, change), 'utf8')); validate(value); return value; }
  catch { fail('conflict', 'change identity unavailable; explicitly confirm identity and original claim provenance before binding a legacy change'); }
}
export function checkSelection(identity: ChangeIdentity, context: Context) {
  if (identity.repository !== context.repository || identity.item.provider !== context.provider || identity.item.backlog !== context.backlog) fail('conflict', 'recorded identity differs from current repository backlog selection');
}
export async function bind(context: Context, change: string, handle: string, item: Item, connect: Connect) {
  validateItem(item);
  const identity: ChangeIdentity = { version: 1, repository: context.repository, item: { provider: item.identity.provider, backlog: item.identity.backlog, id: item.identity.id }, reference: item.reference, ...(item.url ? { url: item.url } : {}) };
  checkSelection(identity, context);
  const session = await recoverSession(context, handle, connect);
  if (identityKey(session.item) !== identityKey(item.identity)) fail('conflict', 'claim handle belongs to another item');
  const path = pathFor(context.cwd, change);
  try { writeFileSync(path, JSON.stringify(identity, null, 2) + '\n', { flag: 'wx', mode: 0o644 }); }
  catch (error: any) { if (error.code !== 'EEXIST') throw error; if (JSON.stringify(readIdentity(context.cwd, change)) !== JSON.stringify(identity)) fail('conflict', 'change identity is immutable'); }
  if (session.identity && JSON.stringify(session.identity) !== JSON.stringify(identity)) fail('conflict', 'continuation is already bound to another change identity');
  session.identity = identity;
  new Store(context.cwd).write('session-' + hash(handle), session);
  return identity;
}
export async function resume(context: Context, change: string, handle: string, connect: Connect) {
  const identity = readIdentity(context.cwd, change); checkSelection(identity, context);
  const session = await recoverSession(context, handle, connect);
  if (!session.identity || JSON.stringify(session.identity) !== JSON.stringify(identity) || identityKey(session.item) !== identityKey(identity.item)) fail('conflict', 'explicit continuation is not bound to this identity');
  return { identity, session };
}
