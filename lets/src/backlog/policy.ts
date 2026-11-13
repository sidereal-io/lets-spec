// The backlog rules every backend shares: what is ready, how it ranks, and
// the claim and release sequences. Written once, here, outside the adapter.
import { randomUUID } from 'node:crypto';
import type { Adapter, Candidate, Item, Related } from './adapter.ts';
import { BacklogError, WriteFailed } from './adapter.ts';

// The priorities that make an issue a candidate, best first. A Wont is never
// one.
export const RANK = ['Must', 'Should', 'Could'] as const;

export type ReadyIssue = Pick<Candidate, 'key' | 'label' | 'title' | 'url' | 'kind' | 'priority' | 'size'>;

// The ready candidates, ranked Must, Should, Could, then oldest first. The
// sort is stable, so items created at the same time keep the adapter's
// order: keys are never compared. only keeps the items named; exclude
// leaves the items named out.
export function ready(candidates: Candidate[], { only, exclude = [] }: { only?: string[]; exclude?: string[] } = {}): ReadyIssue[] {
  const rank = (priority: string | null) => RANK.indexOf(priority as (typeof RANK)[number]);
  const time = ({ created }: Candidate) => {
    const parsed = Date.parse(created);
    return Number.isNaN(parsed) ? Infinity : parsed;
  };
  const older = (a: Candidate, b: Candidate) => {
    const [x, y] = [time(a), time(b)];
    return x < y ? -1 : x > y ? 1 : 0;
  };
  return candidates
    .filter((c) => c.status === 'Todo' && c.kind !== 'Epic' && rank(c.priority) >= 0 && c.free)
    .filter((c) => (only === undefined || only.includes(c.key)) && !exclude.includes(c.key))
    .sort((a, b) => rank(a.priority) - rank(b.priority) || older(a, b))
    .map(({ key, label, title, url, kind, priority, size }) => ({ key, label, title, url, kind, priority, size }));
}

// An issue as lets backlog item prints it: only the open sub-issues, each
// without its state.
export type ItemView = Omit<Item, 'subIssues'> & { subIssues: Related[] };

export function itemView({ subIssues, ...rest }: Item): ItemView {
  return { ...rest, subIssues: subIssues.filter((s) => s.state === 'OPEN').map(({ key, label, title, url }) => ({ key, label, title, url })) };
}

export type WriteResult<Done extends string, Write extends string> =
  | { result: Done }
  | { result: 'failed'; write: Write; message: string };

// Run each write in order, and stop at the first that fails. Nothing is
// undone, retried or recorded.
async function inOrder<Done extends string, Write extends string>(
  done: Done,
  writes: [Write, () => Promise<void>][],
): Promise<WriteResult<Done, Write>> {
  for (const [write, run] of writes) {
    try {
      await run();
    } catch (error) {
      if (!(error instanceof WriteFailed)) throw error;
      return { result: 'failed', write, message: error.message };
    }
  }
  return { result: done };
}

export type ClaimWrite = 'assign' | 'claim' | 'delete-claim' | 'unassign' | 'status';
export type ClaimResult =
  | { result: 'claimed'; claim: string }
  | { result: 'taken'; assignees: string[] }
  | { result: 'failed'; write: ClaimWrite; message: string; claim?: string };

// Elect before changing Status. Comment IDs distinguish concurrent sessions,
// even when assigning @me twice changes the assignee list only once.
export async function claim(adapter: Adapter, issue: string): Promise<ClaimResult> {
  const previous = new Set((await adapter.claims(issue)).map((c) => c.id));
  const assignees = await adapter.assignees(issue);
  if (assignees.length > 0) return { result: 'taken', assignees };
  const login = await adapter.signedInLogin();
  const token = randomUUID();
  let write: ClaimWrite = 'assign';
  try {
    await adapter.assignSelf(issue);
    write = 'claim';
    await adapter.postClaim(issue, token);
    const claims = (await adapter.claims(issue)).filter((c) => !previous.has(c.id));
    const own = claims.find((c) => c.token === token && c.login === login);
    if (!own) throw new BacklogError('backend-failed', 'The posted claim is missing from the issue comments; inspect the issue before retrying.');
    const winner = claims.reduce((a, b) => a.id < b.id ? a : b);
    if (winner.id !== own.id) {
      write = 'delete-claim';
      await adapter.deleteClaim(issue, own.id);
      const remaining = (await adapter.claims(issue)).filter((c) => !previous.has(c.id) && c.id !== own.id);
      if (!remaining.some((c) => c.login === login)) {
        write = 'unassign';
        await adapter.unassignSelf(issue);
      }
      if (remaining.length === 0) {
        write = 'status';
        await adapter.setStatus(issue, 'Todo');
      }
      return { result: 'taken', assignees: [winner.login] };
    }
    write = 'delete-claim';
    for (const id of previous) await adapter.deleteClaim(issue, id);
    write = 'status';
    await adapter.setStatus(issue, 'In Progress');
    return { result: 'claimed', claim: token };
  } catch (error) {
    if (error instanceof WriteFailed) return { result: 'failed', write, message: error.message, ...(write === 'assign' ? {} : { claim: token }) };
    if (error instanceof BacklogError) throw new BacklogError(error.code, error.message, { ...error.extra, claim: token });
    throw error;
  }
}

// Release only the named session. A stale token never touches an assignment.
export async function release(adapter: Adapter, issue: string, token: string): Promise<WriteResult<'released', 'delete-claim' | 'unassign' | 'status'> | { result: 'not-found' }> {
  const login = await adapter.signedInLogin();
  const claims = await adapter.claims(issue);
  const own = claims.find((c) => c.token === token && c.login === login);
  if (!own) return { result: 'not-found' };
  const deleted = await inOrder('released', [['delete-claim', () => adapter.deleteClaim(issue, own.id)]]);
  if (deleted.result === 'failed') return deleted;
  const others = (await adapter.claims(issue)).filter((c) => c.id !== own.id);
  const writes: ['delete-claim' | 'unassign' | 'status', () => Promise<void>][] = [];
  if (!others.some((c) => c.login === login)) writes.push(['unassign', () => adapter.unassignSelf(issue)]);
  if (others.length === 0) writes.push(['status', () => adapter.setStatus(issue, 'Todo')]);
  return inOrder('released', writes);
}
