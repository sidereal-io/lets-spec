import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, ok, REPO, TIMED_OUT } from './fixtures/fake-gh.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;
const ASSIGN = ['issue', 'edit', '149', '--add-assignee', '@me'];
const STATUS = ['project', 'item-edit', '7', '--owner', 'acme', '--url', URL_149, '--field', 'Status', '--value', 'In Progress'];

const rows = ({ assignees = [] as string[], assign = ok('') as Answer, status = ok('') as Answer } = {}): Row[] => [
  ...LOOKUP_ONE,
  ['issue view 149 --json assignees,url', json({ assignees: assignees.map((login) => ({ login })), url: URL_149 })],
  ['issue edit 149 --add-assignee', assign],
  ['project item-edit', status],
];

test('claim assigns the user, then sets Status to In Progress, and returns claimed', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'claimed' });
  assert.deepEqual(t.calls().slice(1), [['issue', 'view', '149', '--json', 'assignees,url'], ASSIGN, STATUS]);
});

test('claim returns taken with the logins, and writes nothing, when anyone is assigned', async () => {
  const t = backlogDeps(rows({ assignees: ['octocat', 'hubot'] }));
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'taken', assignees: ['octocat', 'hubot'] });
  assert.ok(!t.ran('issue edit'));
  assert.ok(!t.ran('project item-edit'));
});

test('a failed Status write returns failed with status and gh\'s error, and undoes nothing', async () => {
  const t = backlogDeps(rows({ status: fail('field not found') }));
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', write: 'status', message: 'field not found' });
  assert.ok(!t.ran('issue edit 149 --remove-assignee'));
  assert.equal(t.calls().filter((args) => args[0] === 'project').length, 1);
});

test('a failed assign returns failed with assign, and sets no Status', async () => {
  const t = backlogDeps(rows({ assign: fail('could not assign') }));
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', write: 'assign', message: 'could not assign' });
  assert.ok(!t.ran('project item-edit'));
  assert.equal(t.calls().filter((args) => args[1] === 'edit').length, 1);
});

test('a write that times out is failed, and says it may have happened', async () => {
  for (const [which, write] of [['assign', 'assign'], ['status', 'status']] as const) {
    const t = backlogDeps(rows({ [which]: TIMED_OUT }));
    assert.equal(await run(['claim', '149'], t.deps), 0);
    assert.deepEqual(t.json(), { result: 'failed', write, message: 'timed out; the write may have happened' });
  }
});

test('a failed assignee read is gh-failed, and writes nothing', async () => {
  const t = backlogDeps([...LOOKUP_ONE, ['issue view 149', fail('HTTP 502')]]);
  assert.equal(await run(['claim', '149'], t.deps), 1);
  assert.equal(t.json().error, 'gh-failed');
  assert.ok(!t.ran('issue edit'));
});

test('every write has a finite timeout', async () => {
  const t = backlogDeps(rows());
  await run(['claim', '149'], t.deps);
  for (const opts of t.options()) assert.ok(Number.isFinite(opts.timeoutMs));
});
