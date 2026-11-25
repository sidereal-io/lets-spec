// What tests/backlog/claim.test.ts cannot check through lets: a gh call past
// its 60-second limit, and a second backlog provider.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, json, LOOKUP_ONE, ok, REPO, TIMED_OUT } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem, LOGIN } from './fixtures/fake-provider.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;

const rows = ({ assign = ok('') as Answer, status = ok('') as Answer } = {}): Row[] => {
  let body = '';
  return [
    ...LOOKUP_ONE,
    ['issue view 149 --json assignees,url', json({ assignees: [], url: URL_149 })],
    ['api user', json({ login: 'octocat' })],
    ['issue edit 149 --add-assignee', assign],
    ['api repos/acme/app/issues/149/comments --method POST', (args) => { body = args.find((a) => a.startsWith('body='))!.slice(5); return ok(''); }],
    ['api repos/acme/app/issues/149/comments --paginate --slurp', () => json(body ? [[{ id: 1, body, user: { login: 'octocat', type: 'User' }, author_association: 'OWNER' }]] : [[]])],
    ['project item-edit', status],
    ['api repos/acme/app/issues/comments/', ok('')],
    ['issue edit 149 --remove-assignee', ok('')],
  ];
};

test('a write that times out is failed, and says it may have happened', async () => {
  for (const [which, write] of [['assign', 'assign'], ['status', 'status']] as const) {
    const t = backlogDeps(rows({ [which]: TIMED_OUT }));
    assert.equal(await run(['claim', '149'], t.deps), 0);
    assert.deepEqual(t.json(), { result: 'failed', write, message: 'timed out; the write may have happened', ...(write === 'status' ? { claim: t.json().claim } : {}) });
  }
});

test('every write has a finite timeout', async () => {
  const t = backlogDeps(rows());
  await run(['claim', '149'], t.deps);
  for (const opts of t.options()) assert.ok(Number.isFinite(opts.timeoutMs));
});

test('a backlog provider with Jira-style keys answers claim PROJ-12', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['claim', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider }), 0);
  assert.equal(t.json().result, 'claimed');
  assert.deepEqual(jira.item('PROJ-12')!.assignees, [LOGIN]);
  assert.equal(jira.item('PROJ-12')!.status, 'In Progress');
  assert.ok(jira.calls().every(([, key]) => key === undefined || key === 'PROJ-12'));
  assert.deepEqual(t.calls(), []);
});
