import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Answer, Row } from './fixtures/fake-gh.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, ok, REPO } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

const URL_149 = `https://github.com/${REPO}/issues/149`;

const TOKEN = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';
const comment = (token: string, id = 1) => ({ id, body: `lets-go claimed this issue.\n\nToken: ${token}`, user: { login: 'octocat', type: 'User' }, author_association: 'OWNER' });

const rows = ({ unassign = ok('') as Answer, url = json({ url: URL_149 }) as Answer, status = ok('') as Answer } = {}): Row[] => {
  let deleted = false;
  return [
  ...LOOKUP_ONE,
  ['api user', json({ login: 'octocat' })],
  ['api repos/acme/app/issues/149/comments --paginate --slurp', () => json([deleted ? [] : [comment(TOKEN)]])],
  ['api repos/acme/app/issues/comments/1 --method DELETE', () => { deleted = true; return ok(''); }],
  ['issue edit 149 --remove-assignee', unassign],
  ['issue view 149 --json url', url],
  ['project item-edit', status],
  ];
};

test('release removes only the signed-in user, then sets Status to Todo, and returns released', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['release', '149', '--claim', TOKEN], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'released' });
  assert.deepEqual(t.calls().slice(t.calls().findIndex((args) => args[0] === 'issue' && args[1] === 'edit')), [
    ['issue', 'edit', '149', '--remove-assignee', '@me'],
    ['issue', 'view', '149', '--json', 'url'],
    ['project', 'item-edit', '7', '--owner', 'acme', '--url', URL_149, '--field', 'Status', '--value', 'Todo'],
  ]);
  // It names only @me, so another user's assignment stays.
  assert.ok(!t.ran('issue view 149 --json assignees'));
});

test('a failed unassign returns failed with unassign, and sets no Status', async () => {
  const t = backlogDeps(rows({ unassign: fail('not allowed') }));
  assert.equal(await run(['release', '149', '--claim', TOKEN], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', write: 'unassign', message: 'not allowed' });
  assert.ok(!t.ran('project item-edit'));
});

test('a failed Status write returns failed with status', async () => {
  const t = backlogDeps(rows({ status: fail('field not found') }));
  assert.equal(await run(['release', '149', '--claim', TOKEN], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', write: 'status', message: 'field not found' });
});

test('a failed read of the issue\'s URL is a failed Status write', async () => {
  const t = backlogDeps(rows({ url: fail('HTTP 502') }));
  assert.equal(await run(['release', '149', '--claim', TOKEN], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'failed', write: 'status', message: 'HTTP 502' });
  assert.ok(!t.ran('project item-edit'));
});

test('a stale token returns not-found without touching the winner', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['release', '149', '--claim', OTHER], t.deps), 0);
  assert.deepEqual(t.json(), { result: 'not-found' });
  assert.ok(!t.ran('issue edit'));
  assert.ok(!t.ran('project item-edit'));
  assert.ok(!t.ran('api repos/acme/app/issues/comments/'));
});

test('release preserves another claim under the same login', async () => {
  const t = backlogDeps([
    ['api repos/acme/app/issues/149/comments --paginate', json([[comment(TOKEN), comment(OTHER, 2)]])],
    ...rows(),
  ]);
  assert.equal(await run(['release', '149', '--claim', TOKEN], t.deps), 0);
  assert.ok(t.ran('api repos/acme/app/issues/comments/1 --method DELETE'));
  assert.ok(!t.ran('issue edit'));
  assert.ok(!t.ran('project item-edit'));
});

test('release with a key GitHub does not use is not-found, and runs no gh command', async () => {
  const t = backlogDeps(rows());
  assert.equal(await run(['release', 'PROJ-12', '--claim', TOKEN], t.deps), 1);
  assert.equal(t.json().error, 'not-found');
  assert.deepEqual(t.calls(), []);
});

test('a backlog provider with Jira-style keys answers release PROJ-12 --claim <token>', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const providers = { ...PROVIDERS, jira: jira.provider };
  const claimed = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['claim', 'PROJ-12'], claimed.deps, providers), 0);
  const token = claimed.json().claim;
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['release', 'PROJ-12', '--claim', token], t.deps, providers), 0);
  assert.deepEqual(t.json(), { result: 'released' });
  assert.deepEqual(jira.item('PROJ-12')!.assignees, []);
  assert.equal(jira.item('PROJ-12')!.status, 'Todo');
  assert.deepEqual(t.calls(), []);
});
