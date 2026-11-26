// lets backlog claim, run as a program against a stand-in gh and issue.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import type { IssueState } from './issue.ts';
import { backlog, claimComment, fail, issue, issueState, json, LOOKUP_ONE, REPO } from './github.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;
const ASSIGN = ['issue', 'edit', '149', '--add-assignee', '@me'];
const STATUS = ['project', 'item-edit', '7', '--owner', 'acme', '--url', URL_149, '--field', 'Status', '--value', 'In Progress'];
const EARLIER = '00000000-0000-4000-8000-000000000001';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// The row that answers every call that starts with args.
const row = (args: string, answer: { stdout?: string; stderr?: string; code?: number }): StandInRow => ({ args: args.split(' '), prefix: true, ...answer });

// lets backlog claim <key>, with rows before the stand-in issue, after
// checking its exit code.
async function claim(t: TestContext, { key = '149', rows = [] as StandInRow[], state = {} as Partial<IssueState>, code = 0 } = {}) {
  const b = backlog(t, [...LOOKUP_ONE, ...rows, issue()], { state: issueState(state) });
  const result = await b.lets('claim', key);
  assert.equal(result.code, code, result.output);
  const calls = b.calls();
  const ran = (args: string) => calls.some((call) => args.split(' ').every((arg, i) => arg === call[i]));
  return { out: b.json(result), calls, ran, state: b.state() as IssueState };
}

// The token in the last comment octocat wrote.
const posted = (state: IssueState) => state.pages.flat().filter((c) => c.user.login === 'octocat').at(-1)?.body.split('Token: ')[1];

test('claim assigns the user, then sets Status to In Progress, and returns claimed', async (t) => {
  const { out, calls, state } = await claim(t);
  assert.equal(out.result, 'claimed');
  assert.match(out.claim, UUID);
  assert.deepEqual(calls.at(-1), STATUS);
  assert.ok(calls.some((args) => JSON.stringify(args) === JSON.stringify(ASSIGN)));
  assert.deepEqual(state.assignees, ['octocat']);
  assert.deepEqual(state.status, ['In Progress']);
  assert.equal(posted(state), out.claim);
});

test('claim returns taken with the logins, and writes nothing, when anyone is assigned', async (t) => {
  const { out, ran, state } = await claim(t, { state: { assignees: ['octocat', 'hubot'] } });
  assert.deepEqual(out, { result: 'taken', assignees: ['octocat', 'hubot'] });
  assert.ok(!ran('issue edit'));
  assert.ok(!ran('project item-edit'));
  assert.deepEqual(state, issueState({ assignees: ['octocat', 'hubot'] }));
});

test('a failed Status write returns failed with status and gh\'s error, and undoes nothing', async (t) => {
  const { out, calls, ran, state } = await claim(t, { rows: [row('project item-edit', fail('field not found'))] });
  assert.deepEqual(out, { result: 'failed', write: 'status', message: 'field not found', claim: out.claim });
  assert.match(out.claim, UUID);
  assert.ok(!ran('issue edit 149 --remove-assignee'));
  assert.equal(calls.filter((args) => args[0] === 'project').length, 1);
  assert.deepEqual(state.assignees, ['octocat']);
});

test('a failed assign returns failed with assign, and sets no Status', async (t) => {
  const { out, calls, ran, state } = await claim(t, { rows: [row('issue edit 149 --add-assignee', fail('could not assign'))] });
  assert.deepEqual(out, { result: 'failed', write: 'assign', message: 'could not assign' });
  assert.ok(!ran('project item-edit'));
  assert.equal(calls.filter((args) => args[1] === 'edit').length, 1);
  assert.deepEqual(state.status, []);
});

test('a failed assignee read is backend-failed, and writes nothing', async (t) => {
  const { out, ran } = await claim(t, { rows: [row('issue view 149', fail('HTTP 502'))], code: 1 });
  assert.equal(out.error, 'backend-failed');
  assert.ok(!ran('issue edit'));
});

test('a failed claim comment write retains its recovery token', async (t) => {
  const { out, ran } = await claim(t, { rows: [row('api repos/acme/app/issues/149/comments --method POST', fail('HTTP 502'))] });
  assert.equal(out.result, 'failed');
  assert.equal(out.write, 'claim');
  assert.match(out.claim, UUID);
  assert.ok(!ran('project item-edit'));
});

test('an unreadable election retains its recovery token', async (t) => {
  const { out, ran, state } = await claim(t, { state: { readsFailAfterPost: 'HTTP 502' }, code: 1 });
  assert.equal(out.error, 'backend-failed');
  assert.match(out.claim, UUID);
  assert.equal(posted(state), out.claim);
  assert.ok(!ran('project item-edit'));
});

test('a missing posted claim never grants ownership', async (t) => {
  const { out, ran } = await claim(t, { rows: [row('api repos/acme/app/issues/149/comments --paginate', json([[]]))], code: 1 });
  assert.match(out.message, /posted claim is missing/);
  assert.ok(!ran('project item-edit'));
});

test('the earliest valid claim wins across comment pages', async (t) => {
  // Another session's claims land between this one's post and its read.
  const { out, ran, state } = await claim(t, { state: { nextId: 200, rivals: [
    { page: 0, comment: claimComment(EARLIER, { id: 1, login: 'outsider', association: 'NONE' }) },
    { page: 1, comment: claimComment(EARLIER, { id: 100, login: 'winner', association: 'MEMBER' }) },
  ] } });
  assert.deepEqual(out, { result: 'taken', assignees: ['winner'] });
  assert.ok(ran('api repos/acme/app/issues/comments/200 --method DELETE'));
  assert.ok(ran('issue edit 149 --remove-assignee'));
  assert.ok(!ran('project item-edit'));
  assert.deepEqual(state.assignees, []);
});

for (const login of ['octocat', 'abandoned']) {
  test(`an unassigned issue ignores an old claim by ${login}`, async (t) => {
    const { out, ran, state } = await claim(t, { state: { pages: [[claimComment(EARLIER, { id: 0, login })]], nextId: 2 } });
    assert.equal(out.result, 'claimed');
    assert.ok(ran('project item-edit'));
    assert.ok(!ran('issue edit 149 --remove-assignee'));
    // The winning claim deletes the old one, whoever wrote it.
    assert.deepEqual(state.pages.flat().map((c) => c.id), [2]);
  });
}

test('a claim with a final newline participates in the election', async (t) => {
  const final = claimComment(EARLIER, { id: 1, login: 'winner', association: 'MEMBER' });
  final.body += '\n';
  const { out } = await claim(t, { state: { nextId: 2, rivals: [{ page: 0, comment: final }] } });
  assert.deepEqual(out, { result: 'taken', assignees: ['winner'] });
});

test('claim with a key GitHub does not use is not-found, and runs no gh command', async (t) => {
  const { out, calls } = await claim(t, { key: 'PROJ-12', code: 1 });
  assert.equal(out.error, 'not-found');
  assert.deepEqual(calls, []);
});

test('claim #149 claims issue 149', async (t) => {
  const { out, calls } = await claim(t, { key: '#149' });
  assert.equal(out.result, 'claimed');
  assert.deepEqual(calls.at(-1), STATUS);
});
