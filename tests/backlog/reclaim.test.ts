// lets backlog claim takes over an issue with an abandoned claim, then
// lets backlog release gives it back, in one repository and stand-in issue.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { IssueState } from './issue.ts';
import { backlog, claimComment, fail, issue, issueState, LOOKUP_ONE } from './github.ts';

const ABANDONED = '00000000-0000-4000-8000-000000000001';

for (const oldLogin of ['octocat', 'abandoned']) {
  test(`release after reclaiming an abandoned issue by ${oldLogin}`, async (t) => {
    const b = backlog(t, [...LOOKUP_ONE, issue()], { state: issueState({ pages: [[claimComment(ABANDONED, { login: oldLogin })]], nextId: 2 }) });
    const claimed = await b.lets('claim', '149');
    assert.equal(claimed.code, 0, claimed.output);
    const { result, claim } = b.json(claimed);
    assert.equal(result, 'claimed');
    const released = await b.lets('release', '149', '--claim', claim);
    assert.equal(released.code, 0, released.output);
    assert.equal(b.json(released).result, 'released');
    const state = b.state() as IssueState;
    assert.deepEqual(state.assignees, []);
    assert.deepEqual(state.pages.flat(), []);
    assert.equal(state.status.at(-1), 'Todo');
  });
}

test('failure to delete an abandoned claim stops with the new recovery token', async (t) => {
  const b = backlog(t, [
    ...LOOKUP_ONE,
    { args: ['api', 'repos/acme/app/issues/comments/1', '--method', 'DELETE'], ...fail('not allowed') },
    issue(),
  ], { state: issueState({ pages: [[claimComment(ABANDONED, { login: 'abandoned' })]], nextId: 2 }) });
  const result = await b.lets('claim', '149');
  assert.equal(result.code, 0, result.output);
  const out = b.json(result);
  assert.equal(out.write, 'delete-claim');
  const kept = (b.state() as IssueState).pages.flat().find((c) => c.id === 2)!;
  assert.equal(out.claim, kept.body.split('Token: ')[1]);
  assert.ok(!b.calls().some((args) => args[0] === 'project' && args[1] === 'item-edit'));
});
