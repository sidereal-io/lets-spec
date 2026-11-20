// The shared rules, apart from any adapter: what an adapter returns is
// filtered here, so a second adapter does not repeat it.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Candidate, Item } from '../../../lets/src/backlog/adapter.ts';
import { itemView, ready } from '../../../lets/src/backlog/policy.ts';

const item = (subIssues: Item['subIssues']): Item => ({
  key: '52', label: '#52', title: 'epic', body: '', url: 'u52', state: 'OPEN',
  kind: 'Epic', priority: null, size: null, status: null,
  assignees: [], blockedBy: [], parent: null, subIssues,
});

test('item lists only the open sub-issues an adapter returns, without their state', () => {
  const view = itemView(item([
    { key: '135', label: '#135', title: 'done', url: 'u135', state: 'CLOSED' },
    { key: '136', label: '#136', title: 'open', url: 'u136', state: 'OPEN' },
  ]));
  assert.deepEqual(view.subIssues, [{ key: '136', label: '#136', title: 'open', url: 'u136' }]);
});

const candidate = (key: string, created: string, extra: Partial<Candidate> = {}): Candidate => ({
  key, label: `#${key}`, title: key, url: `u${key}`, kind: 'Story', priority: 'Must', size: 'S', status: 'Todo', free: true, blockers: null, created, ...extra,
});

test('ready ranks ties by creation time, oldest first', () => {
  const view = ready([candidate('1', '2026-03-01T00:00:00Z'), candidate('2', '2026-01-01T00:00:00Z'), candidate('3', '2026-02-01T00:00:00+01:00')]);
  assert.deepEqual(view.map((c) => c.key), ['2', '3', '1']);
});

test('ready keeps the adapter\'s order for equal times, and never compares keys', () => {
  const same = '2026-01-01T00:00:00Z';
  assert.deepEqual(ready([candidate('9', same), candidate('10', same), candidate('PROJ-1', same)]).map((c) => c.key), ['9', '10', 'PROJ-1']);
  assert.deepEqual(ready([candidate('10', same), candidate('9', same)]).map((c) => c.key), ['10', '9']);
});

test('a candidate that is not free never reaches the sort, even with no creation time', () => {
  const view = ready([candidate('5', '', { free: false }), candidate('6', '2026-01-01T00:00:00Z')]);
  assert.deepEqual(view.map((c) => c.key), ['6']);
});

const blocked = (key: string, blockers: string[] | null, extra: Partial<Candidate> = {}) => candidate(key, '2026-01-01T00:00:00Z', { free: false, blockers, ...extra });

test('a candidate whose every open blocker is met passes the blocker filter', () => {
  assert.deepEqual(ready([blocked('280', ['279'])], { met: ['279'] }).map((c) => c.key), ['280']);
});

test('a candidate with one open blocker not met stays out', () => {
  assert.deepEqual(ready([blocked('281', ['279', '280'])], { met: ['279'] }), []);
});

test('a candidate with null blockers never passes, whatever is met', () => {
  assert.deepEqual(ready([blocked('283', null)], { met: ['279'] }), []);
});

test('a met blocker does not skip the Status, Kind or Priority filters', () => {
  const view = ready([
    blocked('290', ['279'], { status: 'In Progress' }),
    blocked('291', ['279'], { kind: 'Epic' }),
    blocked('292', ['279'], { priority: 'Wont' }),
  ], { met: ['279'] });
  assert.deepEqual(view, []);
});

test('with no met list, a blocked candidate stays out', () => {
  assert.deepEqual(ready([blocked('280', ['279'])]), []);
});
