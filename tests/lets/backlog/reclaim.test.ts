import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, ok, REPO } from './fixtures/fake-gh.ts';

for (const oldLogin of ['octocat', 'abandoned']) {
  test(`release after reclaiming an abandoned issue by ${oldLogin}`, async () => {
    const comments = [{ id: 1, body: 'lets-go claimed this issue.\n\nToken: 00000000-0000-4000-8000-000000000001', user: { login: oldLogin, type: 'User' }, author_association: 'OWNER' }];
    let assigned = false;
    let status = 'Todo';
    const t = backlogDeps([
      ...LOOKUP_ONE,
      ['api user', json({ login: 'octocat' })],
      ['issue view 149', () => json({ assignees: assigned ? [{ login: 'octocat' }] : [], url: `https://github.com/${REPO}/issues/149` })],
      ['issue edit 149 --add-assignee', () => { assigned = true; return ok(''); }],
      ['issue edit 149 --remove-assignee', () => { assigned = false; return ok(''); }],
      ['api repos/acme/app/issues/149/comments --method POST', (args) => {
        const body = args.find((a) => a.startsWith('body='))!.slice(5);
        comments.push({ id: 2, body, user: { login: 'octocat', type: 'User' }, author_association: 'OWNER' });
        return ok('');
      }],
      ['api repos/acme/app/issues/149/comments --paginate', () => json([comments])],
      ['api repos/acme/app/issues/comments/', (args) => {
        const id = Number(args[1].split('/').at(-1));
        comments.splice(comments.findIndex((c) => c.id === id), 1);
        return ok('');
      }],
      ['project item-edit', (args) => { status = args.at(-1)!; return ok(''); }],
    ]);
    assert.equal(await run(['claim', '149'], t.deps), 0);
    const claim = t.json().claim;
    assert.equal(t.json().result, 'claimed');
    assert.equal(await run(['release', '149', '--claim', claim], t.deps), 0);
    assert.equal(JSON.parse(t.stdout().trim().split('\n').at(-1)!).result, 'released');
    assert.equal(assigned, false);
    assert.equal(status, 'Todo');
    assert.deepEqual(comments, []);
  });
}

test('failure to delete an abandoned claim stops with the new recovery token', async () => {
  let body = '';
  const old = { id: 1, body: 'lets-go claimed this issue.\n\nToken: 00000000-0000-4000-8000-000000000001', user: { login: 'abandoned', type: 'User' }, author_association: 'OWNER' };
  const t = backlogDeps([
    ...LOOKUP_ONE,
    ['api user', json({ login: 'octocat' })],
    ['issue view 149', json({ assignees: [], url: `https://github.com/${REPO}/issues/149` })],
    ['issue edit 149 --add-assignee', ok('')],
    ['api repos/acme/app/issues/149/comments --method POST', (args) => { body = args.find((a) => a.startsWith('body='))!.slice(5); return ok(''); }],
    ['api repos/acme/app/issues/149/comments --paginate', () => json([[old, ...(body ? [{ ...old, id: 2, body, user: { login: 'octocat', type: 'User' } }] : [])]])],
    ['api repos/acme/app/issues/comments/1 --method DELETE', fail('not allowed')],
    ['project item-edit', ok('')],
  ]);
  assert.equal(await run(['claim', '149'], t.deps), 0);
  assert.equal(t.json().write, 'delete-claim');
  assert.equal(t.json().claim, body.split('Token: ')[1]);
  assert.ok(!t.ran('project item-edit'));
});
