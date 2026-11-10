// The backlog rules every backend shares: what is ready, how it ranks, and
// the claim and release sequences. Written once, here, outside the adapter.
import type { Adapter, Candidate, Item, Related } from './adapter.ts';
import { WriteFailed } from './adapter.ts';

// The priorities that make an issue a candidate, best first. A Wont is never
// one.
export const RANK = ['Must', 'Should', 'Could'] as const;

export type ReadyIssue = Pick<Candidate, 'number' | 'title' | 'url' | 'kind' | 'priority' | 'size'>;

// The ready candidates, ranked Must, Should, Could, then lowest number.
// only keeps the issues named; exclude leaves the issues named out.
export function ready(candidates: Candidate[], { only, exclude = [] }: { only?: number[]; exclude?: number[] } = {}): ReadyIssue[] {
  const rank = (priority: string | null) => RANK.indexOf(priority as (typeof RANK)[number]);
  return candidates
    .filter((c) => c.status === 'Todo' && c.kind !== 'Epic' && rank(c.priority) >= 0 && c.free)
    .filter((c) => (only === undefined || only.includes(c.number)) && !exclude.includes(c.number))
    .sort((a, b) => rank(a.priority) - rank(b.priority) || a.number - b.number)
    .map(({ number, title, url, kind, priority, size }) => ({ number, title, url, kind, priority, size }));
}

// An issue as lets backlog item prints it: only the open sub-issues, each
// without its state.
export type ItemView = Omit<Item, 'subIssues'> & { subIssues: Related[] };

export function itemView({ subIssues, ...rest }: Item): ItemView {
  return { ...rest, subIssues: subIssues.filter((s) => s.state === 'OPEN').map(({ number, title, url }) => ({ number, title, url })) };
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

// Claim the issue when nobody has it: assign the signed-in user, then set
// Status to In Progress.
export async function claim(adapter: Adapter, issue: number): Promise<WriteResult<'claimed', 'assign' | 'status'> | { result: 'taken'; assignees: string[] }> {
  const assignees = await adapter.assignees(issue);
  if (assignees.length > 0) return { result: 'taken', assignees };
  return inOrder('claimed', [
    ['assign', () => adapter.assignSelf(issue)],
    ['status', () => adapter.setStatus(issue, 'In Progress')],
  ]);
}

// Give the issue back: remove the signed-in user only, then set Status to
// Todo.
export function release(adapter: Adapter, issue: number): Promise<WriteResult<'released', 'unassign' | 'status'>> {
  return inOrder('released', [
    ['unassign', () => adapter.unassignSelf(issue)],
    ['status', () => adapter.setStatus(issue, 'Todo')],
  ]);
}
