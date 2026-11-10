// The shared rules, apart from any adapter: what an adapter returns is
// filtered here, so a second adapter does not repeat it.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Item } from '../../../lets/src/backlog/adapter.ts';
import { itemView } from '../../../lets/src/backlog/policy.ts';

const item = (subIssues: Item['subIssues']): Item => ({
  number: 52, title: 'epic', body: '', url: 'u52', state: 'OPEN',
  kind: 'Epic', priority: null, size: null, status: null,
  assignees: [], blockedBy: [], parent: null, subIssues,
});

test('item lists only the open sub-issues an adapter returns, without their state', () => {
  const view = itemView(item([
    { number: 135, title: 'done', url: 'u135', state: 'CLOSED' },
    { number: 136, title: 'open', url: 'u136', state: 'OPEN' },
  ]));
  assert.deepEqual(view.subIssues, [{ number: 136, title: 'open', url: 'u136' }]);
});
