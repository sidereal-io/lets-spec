import { ActionYield } from './runtime-context.ts';
import { randomUUID } from './runtime-context.ts';
import { Store, hash, scope } from './store.ts';
import { fail } from './github.ts';
import type { Context } from './github.ts';
import type { Identity } from './protocol.ts';
import type { Call } from './selection.ts';
export type Connect = (session: string) => Call;
export function verifyClaim(claim: any, context: Context, token: string) {
  if (!claim || claim.actor !== context.actor || claim.session !== context.session || claim.token !== token || claim.status !== 'In Progress') fail('conflict', 'fresh claim ownership and In Progress are required');
}
export async function acquireSession(context: Context, item: Identity, connect: Connect) {
  const handle = randomUUID(); const store = new Store(context.cwd);
  const session = { handle, context: { ...context, session: randomUUID() }, item, mutationId: randomUUID(), token: undefined as string | undefined };
  const name = 'session-' + hash(handle); store.write(name, session);
  try {
    const call = connect(session.context.session);
    const { claim } = await call('claim.acquire', { item }, session.mutationId);
    session.token = claim.token; store.write(name, session);
    const fresh = (await call('claim.read', { item })).claim;
    verifyClaim(fresh, session.context, session.token!);
    return { handle, claim: fresh };
  } catch (error) {
        if (error instanceof ActionYield) throw error;
    if (error instanceof Error) Object.assign(error, { continuationHandle: handle });
    throw error;
  }
}
export function loadSession(context: Context, handle: string) {
  if (typeof handle !== 'string' || !/^[0-9a-f-]{36}$/.test(handle)) fail('conflict', 'explicit original continuation handle required; reconcile manually');
  const store = new Store(context.cwd); const session = store.read('session-' + hash(handle));
  if (!session || session.handle !== handle || JSON.stringify(scope(session.context)) !== JSON.stringify(scope(context)) || session.context.actor !== context.actor) fail('conflict', 'continuation handle does not match this selection and actor');
  return session;
}
export async function recoverSession(context: Context, handle: string, connect: Connect) {
  const session = loadSession(context, handle); const call = connect(session.context.session);
  if (!session.token) {
    const recovery = await call('mutation.read', { mutationId: session.mutationId });
    if (recovery.state === 'unknown') fail('conflict', 'claim outcome remains unknown; reconcile manually without another acquire');
    const result = recovery.state === 'applied' ? recovery.result : await call('claim.acquire', { item: session.item }, session.mutationId);
    session.token = result.claim.token;
    new Store(context.cwd).write('session-' + hash(handle), session);
  }
  verifyClaim((await call('claim.read', { item: session.item })).claim, session.context, session.token);
  return session;
}
