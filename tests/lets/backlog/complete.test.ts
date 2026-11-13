import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, ok, TIMED_OUT } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

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

test('complete on an issue that does not exist is not-found', async () => {
  const t = backlogDeps([
    ...LOOKUP_ONE,
    ['issue view 99999 --json state', fail('GraphQL: Could not resolve to an issue or pull request with the number of 99999. (repository.issue)')],
  ]);
  assert.equal(await run(['complete', '99999'], t.deps), 1);
  assert.equal(t.json().error, 'not-found');
  assert.ok(!t.ran('issue close'));
});

test('complete with a key GitHub does not use is not-found, and runs no gh command', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['complete', 'PROJ-12'], t.deps), 1);
  assert.equal(t.json().error, 'not-found');
  assert.deepEqual(t.calls(), []);
});

test('a state read that times out is backend-failed, and closes nothing', async () => {
  const t = backlogDeps(rows({ state: TIMED_OUT }));
  assert.equal(await run(['complete', '258'], t.deps), 1);
  assert.equal(t.json().error, 'backend-failed');
  assert.ok(!t.ran('issue close'));
});

test('a close that fails returns failed with gh\'s error, and exits 0', async () => {
  const t = backlogDeps(rows({ close: fail('GraphQL: Resource not accessible by integration (closeIssue)') }));
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', message: 'GraphQL: Resource not accessible by integration (closeIssue)' });
});

test('a close that times out returns failed, says it may have happened, and is not retried', async () => {
  const t = backlogDeps(rows({ close: TIMED_OUT }));
  assert.equal(await run(['complete', '258'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', message: 'timed out; the write may have happened' });
  assert.equal(t.calls().filter((args) => args[0] === 'issue' && args[1] === 'close').length, 1);
});

test('a backlog provider with Jira-style keys gets the key PROJ-12, and returns completed', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['complete', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider }), 0);
  assert.deepEqual(t.json(), { result: 'completed' });
  assert.deepEqual(jira.calls(), [['create'], ['complete', 'PROJ-12']]);
  assert.equal(jira.item('PROJ-12')!.state, 'CLOSED');
  assert.deepEqual(t.calls(), []);
});
