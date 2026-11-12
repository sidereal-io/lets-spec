import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, ok, REPO, TIMED_OUT } from './fixtures/fake-gh.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;
const ASSIGN = ['issue', 'edit', '149', '--add-assignee', '@me'];
const STATUS = ['project', 'item-edit', '7', '--owner', 'acme', '--url', URL_149, '--field', 'Status', '--value', 'In Progress'];

const rows = ({ assignees = [] as string[], assign = ok('') as Answer, status = ok('') as Answer, comments = (body: string): unknown => [[{ id: 1, body, user: { login: 'octocat', type: 'User' }, author_association: 'OWNER' }]] } = {}): Row[] => {
  let body = '';
  return [
    ...LOOKUP_ONE,
    ['issue view 149 --json assignees,url', json({ assignees: assignees.map((login) => ({ login })), url: URL_149 })],
    ['api user', json({ login: 'octocat' })],
    ['issue edit 149 --add-assignee', assign],
    ['api repos/acme/app/issues/149/comments --method POST', (args) => { body = args.find((a) => a.startsWith('body='))!.slice(5); return ok(''); }],
    ['api repos/acme/app/issues/149/comments --paginate --slurp', () => json(comments(body))],
    ['project item-edit', status],
    ['api repos/acme/app/issues/comments/', ok('')],
    ['issue edit 149 --remove-assignee', ok('')],
  ];
};

test('claim assigns the user, then sets Status to In Progress, and returns claimed', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.equal(t.json().result, 'claimed');
  assert.match(t.json().claim, /^[0-9a-f-]{36}$/);
  assert.deepEqual(t.calls().at(-1), STATUS);
  assert.ok(t.calls().find((args) => JSON.stringify(args) === JSON.stringify(ASSIGN)));
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
  assert.deepEqual(t.json(), { result: 'failed', write: 'status', message: 'field not found', claim: t.json().claim });
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
    assert.deepEqual(t.json(), { result: 'failed', write, message: 'timed out; the write may have happened', ...(write === 'status' ? { claim: t.json().claim } : {}) });
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

test('a failed claim comment write retains its recovery token', async () => {
  const t = backlogDeps([
    ['api repos/acme/app/issues/149/comments --method POST', TIMED_OUT],
    ...rows(),
  ]);
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.equal(t.json().result, 'failed');
  assert.equal(t.json().write, 'claim');
  assert.match(t.json().claim, /^[0-9a-f-]{36}$/);
  assert.ok(!t.ran('project item-edit'));
});

test('an unreadable election retains its recovery token', async () => {
  const t = backlogDeps([
    ['api repos/acme/app/issues/149/comments --paginate', fail('HTTP 502')],
    ...rows(),
  ]);
  assert.equal(await run(['claim', '149'], t.deps), 1);
  assert.equal(t.json().error, 'gh-failed');
  assert.match(t.json().claim, /^[0-9a-f-]{36}$/);
  assert.ok(!t.ran('project item-edit'));
});

test('a missing posted claim never grants ownership', async () => {
  const t = backlogDeps([
    ['api repos/acme/app/issues/149/comments --paginate', json([[]])],
    ...rows(),
  ]);
  assert.equal(await run(['claim', '149'], t.deps), 1);
  assert.match(t.json().message, /posted claim is missing/);
  assert.ok(!t.ran('project item-edit'));
});

test('the earliest valid claim wins across comment pages', async () => {
  const earlier = 'lets-go claimed this issue.\n\nToken: 00000000-0000-4000-8000-000000000001';
  const t = backlogDeps(rows({ comments: (body) => [
    [{ id: 200, body, user: { login: 'octocat', type: 'User' }, author_association: 'OWNER' },
     { id: 1, body: earlier, user: { login: 'outsider', type: 'User' }, author_association: 'NONE' }],
    [{ id: 100, body: earlier, user: { login: 'winner', type: 'User' }, author_association: 'MEMBER' }],
  ] }));
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'taken', assignees: ['winner'] });
  assert.ok(t.ran('api repos/acme/app/issues/comments/200 --method DELETE'));
  assert.ok(t.ran('issue edit 149 --remove-assignee'));
  assert.ok(!t.ran('project item-edit'));
});
