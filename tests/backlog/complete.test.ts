// lets backlog complete, run as a program against a stand-in gh and issue.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import type { IssueState } from './issue.ts';
import { backlog, fail, issue, issueState, LOOKUP_ONE } from './github.ts';

// The row that answers every call that starts with args.
const row = (args: string, answer: { stdout?: string; stderr?: string; code?: number }): StandInRow => ({ args: args.split(' '), prefix: true, ...answer });

// lets backlog complete <key>, on the stand-in issue `number`, after
// checking its exit code.
async function complete(t: TestContext, { key = '258', number = 258, rows = [] as StandInRow[], state = {} as Partial<IssueState>, code = 0 } = {}) {
  const b = backlog(t, [...LOOKUP_ONE, ...rows, issue({ number })], { state: issueState(state) });
  const result = await b.lets('complete', key);
  assert.equal(result.code, code, result.output);
  const calls = b.calls();
  // As in fixtures/fake-gh.ts, a prefix of the joined call, so 'assignees' matches 'assignees,url'.
  const ran = (args: string) => calls.some((call) => call.join(' ').startsWith(args));
  return { out: b.json(result), calls, ran, state: b.state() as IssueState };
}

const closes = (calls: string[][]) => calls.filter((args) => args[0] === 'issue' && args[1] === 'close').length;

test('complete closes an open issue as completed, and returns completed', async (t) => {
  const { out, calls, state } = await complete(t);
  assert.deepEqual(out, { result: 'completed' });
  assert.deepEqual(calls.slice(1), [
    ['issue', 'view', '258', '--json', 'state'],
    ['issue', 'close', '258', '--reason', 'completed'],
  ]);
  assert.equal(state.state, 'CLOSED');
});

test('complete on a closed issue writes nothing, and returns completed', async (t) => {
  const { out, ran } = await complete(t, { state: { state: 'CLOSED' } });
  assert.deepEqual(out, { result: 'completed' });
  assert.ok(!ran('issue close'));
});

test('complete writes no Project field', async (t) => {
  const { ran, state } = await complete(t);
  assert.ok(!ran('project item-edit'));
  assert.deepEqual(state.status, []);
});

test('complete closes an assigned open Epic like any other item', async (t) => {
  const { out, ran, state } = await complete(t, { key: '52', number: 52, state: { assignees: ['octocat'] } });
  assert.deepEqual(out, { result: 'completed' });
  assert.ok(ran('issue close 52 --reason completed'));
  // It reads no assignees and no Kind, and writes no Project field.
  assert.ok(!ran('issue view 52 --json assignees'));
  assert.ok(!ran('project item-list'));
  assert.ok(!ran('project item-edit'));
  assert.equal(state.state, 'CLOSED');
});

test('complete on an issue that does not exist is not-found', async (t) => {
  const { out, ran } = await complete(t, {
    key: '99999',
    rows: [row('issue view 99999 --json state', fail('GraphQL: Could not resolve to an issue or pull request with the number of 99999. (repository.issue)'))],
    code: 1,
  });
  assert.equal(out.error, 'not-found');
  assert.ok(!ran('issue close'));
});

test('complete with a key GitHub does not use is not-found, and runs no gh command', async (t) => {
  const { out, calls } = await complete(t, { key: 'PROJ-12', code: 1 });
  assert.equal(out.error, 'not-found');
  assert.deepEqual(calls, []);
});

test('a state read that fails is backend-failed, and closes nothing', async (t) => {
  const { out, ran, state } = await complete(t, { rows: [row('issue view 258 --json state', fail('HTTP 502'))], code: 1 });
  assert.equal(out.error, 'backend-failed');
  assert.ok(!ran('issue close'));
  assert.equal(state.state, 'OPEN');
});

test('a close that fails returns failed with gh\'s error, exits 0, and is not retried', async (t) => {
  const { out, calls } = await complete(t, { rows: [row('issue close 258', fail('GraphQL: Resource not accessible by integration (closeIssue)'))] });
  assert.deepEqual(out, { result: 'failed', message: 'GraphQL: Resource not accessible by integration (closeIssue)' });
  assert.equal(closes(calls), 1);
});
