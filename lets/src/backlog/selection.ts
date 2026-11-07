import { readyWork } from './capabilities.ts';
import type { Candidate } from './capabilities.ts';
import type { Item } from './items.ts';
import { fail } from './github.ts';
export type Call = (operation: string, input?: Record<string, any>, mutationId?: string) => Promise<any>;
export async function enumerate(call: Call, operation: string, input: Record<string, any> = {}): Promise<any[]> {
  const items: any[] = []; const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await call(operation, { ...input, ...(cursor ? { cursor } : {}) });
    if (!Array.isArray(page.items) || typeof page.complete !== 'boolean') fail('unsupported', 'incomplete enumeration');
    items.push(...page.items);
    if (page.complete && page.nextCursor === null) return items;
    const next = page.nextCursor;
    if (page.complete || typeof next !== 'string' || !next || cursors.has(next)) fail('unsupported', 'repeated or missing enumeration cursor');
    cursors.add(next); cursor = next;
  } while (true);
}
/** Candidates still need packet, comment and glossary checks before claim. */
export async function select(call: Call, repository: string, reference?: string): Promise<{ item: Item; candidates: Item[] }> {
  const items = await enumerate(call, reference ? 'item.search' : 'candidate.list', reference ? { query: reference } : {});
  if (reference && items.length !== 1) fail('not_found', 'named reference must match exactly one scoped item');
  const candidates: Candidate[] = [];
  for (const item of items as Item[]) {
    if (reference && item.owners.length) fail('conflict', `item is owned by ${item.owners.join(', ')}`);
    const blockers = await enumerate(call, 'relationship.list', { item: item.identity, kind: 'blocked_by' });
    if (reference && blockers.some(blocker => blocker.status !== 'Done')) fail('conflict', 'item has open blockers');
    candidates.push({ ...item, repository, blockers: { complete: true, open: blockers.filter(blocker => blocker.status !== 'Done').map(blocker => blocker.identity) } });
  }
  if (reference && candidates[0].metadata.Kind === 'Epic') return { item: candidates[0], candidates: [candidates[0]] };
  const ready = readyWork(candidates, repository);
  if (!ready.length) fail('not_found', 'backlog has no eligible ready work');
  return { item: ready[0], candidates: ready };
}
