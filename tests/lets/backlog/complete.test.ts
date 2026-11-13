import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { backlogDeps, json, LOOKUP_ONE, ok } from './fixtures/fake-gh.ts';

const rows = ({ state = json({ state: 'OPEN' }) as Answer, close = ok('') as Answer } = {}): Row[] => [
  ...LOOKUP_ONE,
  ['issue view 258 --json state', state],
  ['issue close 258', close],
];

test('complete closes an open issue as completed, and returns completed', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'completed' });
  assert.deepEqual(t.calls().slice(1), [
    ['issue', 'view', '258', '--json', 'state'],
    ['issue', 'close', '258', '--reason', 'completed'],
  ]);
});

test('complete on a closed issue writes nothing, and returns completed', async () => {
  const t = backlogDeps(rows({ state: json({ state: 'CLOSED' }) }));
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'completed' });
  assert.ok(!t.ran('issue close'));
});

test('complete writes no Project field', async () => {
  const t = backlogDeps([...rows(), ['project item-edit', ok('')]]);
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.ok(!t.ran('project item-edit'));
});

test('complete closes an assigned open Epic like any other item', async () => {
  const t = backlogDeps([
    ...LOOKUP_ONE,
    ['issue view 52 --json state', json({ state: 'OPEN' })],
    ['issue close 52', ok('')],
    ['project item-edit', ok('')],
  ]);
  assert.equal(await run(['complete', '52'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'completed' });
  assert.ok(t.ran('issue close 52 --reason completed'));
  // It reads no assignees and no Kind, and writes no Project field.
  assert.ok(!t.ran('issue view 52 --json assignees'));
  assert.ok(!t.ran('project item-list'));
  assert.ok(!t.ran('project item-edit'));
});
