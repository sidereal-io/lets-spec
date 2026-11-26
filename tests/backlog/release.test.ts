// lets backlog release, run as a program against a stand-in gh and issue.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import type { IssueState } from './issue.ts';
import { backlog, claimComment, fail, issue, issueState, LOOKUP_ONE, REPO } from './github.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;
const TOKEN = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';

// The row that answers every call that starts with args.
const row = (args: string, answer: { stdout?: string; stderr?: string; code?: number }): StandInRow => ({ args: args.split(' '), prefix: true, ...answer });

// lets backlog release <key> --claim <token>, on issue 149 assigned to
// octocat with octocat's claim TOKEN, after checking its exit code.
async function release(t: TestContext, { key = '149', token = TOKEN, rows = [] as StandInRow[], state = {} as Partial<IssueState>, code = 0 } = {}) {
  const start = issueState({ assignees: ['octocat'], pages: [[claimComment(TOKEN)]], nextId: 2, ...state });
  const b = backlog(t, [...LOOKUP_ONE, ...rows, issue()], { state: start });
  const result = await b.lets('release', key, '--claim', token);
  assert.equal(result.code, code, result.output);
  const calls = b.calls();
  // As in fixtures/fake-gh.ts, a prefix of the joined call, so 'assignees' matches 'assignees,url'.
  const ran = (args: string) => calls.some((call) => call.join(' ').startsWith(args));
  return { out: b.json(result), calls, ran, start, state: b.state() as IssueState };
}

test('release removes only the signed-in user, then sets Status to Todo, and returns released', async (t) => {
  const { out, calls, ran, state } = await release(t, { state: { assignees: ['octocat', 'hubot'] } });
  assert.deepEqual(out, { result: 'released' });
  assert.deepEqual(calls.slice(calls.findIndex((args) => args[0] === 'issue' && args[1] === 'edit')), [
    ['issue', 'edit', '149', '--remove-assignee', '@me'],
    ['issue', 'view', '149', '--json', 'url'],
    ['project', 'item-edit', '7', '--owner', 'acme', '--url', URL_149, '--field', 'Status', '--value', 'Todo'],
  ]);
  // It names only @me, so another user's assignment stays.
  assert.ok(!ran('issue view 149 --json assignees'));
  assert.deepEqual(state.assignees, ['hubot']);
  assert.deepEqual(state.pages, [[]]);
  assert.deepEqual(state.status, ['Todo']);
});

test('a failed unassign returns failed with unassign, and sets no Status', async (t) => {
  const { out, ran } = await release(t, { rows: [row('issue edit 149 --remove-assignee', fail('not allowed'))] });
  assert.deepEqual(out, { result: 'failed', write: 'unassign', message: 'not allowed' });
  assert.ok(!ran('project item-edit'));
});

test('a failed Status write returns failed with status', async (t) => {
  const { out } = await release(t, { rows: [row('project item-edit', fail('field not found'))] });
  assert.deepEqual(out, { result: 'failed', write: 'status', message: 'field not found' });
});

test('a failed read of the issue\'s URL is a failed Status write', async (t) => {
  const { out, ran } = await release(t, { rows: [row('issue view 149 --json url', fail('HTTP 502'))] });
  assert.deepEqual(out, { result: 'failed', write: 'status', message: 'HTTP 502' });
  assert.ok(!ran('project item-edit'));
});

test('a stale token returns not-found without touching the winner', async (t) => {
  const { out, calls, ran, start, state } = await release(t, { token: OTHER });
  assert.deepEqual(out, { result: 'not-found' });
  assert.ok(!ran('issue edit'));
  assert.ok(!ran('project item-edit'));
  assert.ok(!calls.some((args) => args[1]?.startsWith('repos/acme/app/issues/comments/')));
  assert.deepEqual(state, start);
});

test('release preserves another claim under the same login', async (t) => {
  const { ran, state } = await release(t, { state: { pages: [[claimComment(TOKEN), claimComment(OTHER, { id: 2 })]], nextId: 3 } });
  assert.ok(ran('api repos/acme/app/issues/comments/1 --method DELETE'));
  assert.ok(!ran('issue edit'));
  assert.ok(!ran('project item-edit'));
  assert.deepEqual(state.pages, [[claimComment(OTHER, { id: 2 })]]);
  assert.deepEqual(state.assignees, ['octocat']);
});

test('release with a key GitHub does not use is not-found, and runs no gh command', async (t) => {
  const { out, calls } = await release(t, { key: 'PROJ-12', code: 1 });
  assert.equal(out.error, 'not-found');
  assert.deepEqual(calls, []);
});
