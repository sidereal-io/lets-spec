import { randomUUID } from 'node:crypto';
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
  const session = { context: { ...context, session: handle }, item, mutationId: randomUUID(), token: undefined as string | undefined };
  const name = 'session-' + hash(handle); store.write(name, session);
  try {
    const call = connect(handle);
    const { claim } = await call('claim.acquire', { item }, session.mutationId);
    session.token = claim.token; store.write(name, session);
    const fresh = (await call('claim.read', { item })).claim;
    verifyClaim(fresh, session.context, session.token!);
    return { handle, claim: fresh };
  } catch (error) {
    if (error instanceof Error) Object.assign(error, { continuationHandle: handle });
    throw error;
  }
}
