import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, json, LOOKUP_ONE } from './fixtures/fake-gh.ts';

test('find returns the open issues whose titles match, unfiltered', async () => {
  const found = [
    { number: 136, title: 'github-backlog-build — Take an existing GitHub story through the shared backlog boundary' },
    { number: 236, title: 'config backlogs follow github-backlog-build' },
  ];
  const t = backlogDeps([...LOOKUP_ONE, ['issue list --state open --search', json(found)]]);
  assert.equal(await run(['find', 'github-backlog-build'], t.deps), 0);
  assert.deepEqual(t.json(), { issues: found });
  assert.deepEqual(t.calls()[1], ['issue', 'list', '--state', 'open', '--search', 'github-backlog-build in:title', '--json', 'number,title']);
});

test('find joins several words into one search', async () => {
  const t = backlogDeps([...LOOKUP_ONE, ['issue list --state open --search', json([])]]);
  await run(['find', 'add', 'a', '--quiet', 'flag'], t.deps);
  assert.equal(t.calls()[1][5], 'add a --quiet flag in:title');
});

test('no match is an empty list, and exits 0', async () => {
  const t = backlogDeps([...LOOKUP_ONE, ['issue list --state open --search', json([])]]);
  assert.equal(await run(['find', 'nothing-like-this'], t.deps), 0);
  assert.deepEqual(t.json(), { issues: [] });
});
