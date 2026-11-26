// Two sessions run lets backlog claim on issue 149 at once, each a lets
// process with a stand-in gh of its own, against one stand-in issue. Both
// are held at the `assign` gate until both have read no assignee, so both
// race for the claim. No test waits for a time to pass.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { LetsResult, StandInRow } from '../support/lets.ts';
import type { IssueState } from './issue.ts';
import { backlog, issue, issueState, LOOKUP_ONE, type Session } from './github.ts';

const ASSIGN = ['issue', 'edit', '149', '--add-assignee', '@me'];
// The loser's claim: the first post gets id 1, and the lowest id wins.
const DELETE_LOSER = ['api', 'repos/acme/app/issues/comments/2', '--method', 'DELETE'];

// A row that holds the call args at gate, then answers it through the stand-in issue.
const held = (args: string[], gate: string, login: string): StandInRow => ({ ...issue({ login }), args, prefix: false, gate });

// Both sessions, the first as `logins[0]`, the second as `logins[1]`. A
// session may delete only its own comments. With `cleanup`, the loser's
// delete of its claim is held at the `cleanup` gate.
function race(t: TestContext, logins: [string, string], cleanup = false) {
  const table = (login: string) => [
    ...LOOKUP_ONE,
    held(ASSIGN, 'assign', login),
    ...(cleanup ? [held(DELETE_LOSER, 'cleanup', login)] : []),
    issue({ login }),
  ];
  const b = backlog(t, table(logins[0]), { state: issueState({ ownDeletesOnly: true }) });
  const sessions: Session[] = [b, b.session(table(logins[1]))];
  return { b, sessions, state: () => b.state() as IssueState };
}

// Starts lets backlog claim 149 in both sessions, and lets them assign
// once both have read no assignee.
async function claimBoth({ b, sessions }: ReturnType<typeof race>): Promise<Promise<LetsResult>[]> {
  const runs = sessions.map((s) => s.lets('claim', '149'));
  await b.waiting('assign', 2);
  b.open('assign');
  return runs;
}

// Each run's JSON, after checking it exited 0.
async function results({ b }: ReturnType<typeof race>, runs: Promise<LetsResult>[]) {
  return Promise.all(runs.map(async (run) => {
    const result = await run;
    assert.equal(result.code, 0, result.output);
    return b.json(result);
  }));
}

const setsStatus = (s: Session) => s.calls().some((args) => args[0] === 'project' && args[1] === 'item-edit');

// The token in the claim that session posted.
const postedToken = (s: Session) => s.calls().find((args) => args.includes('POST'))!.at(-1)!.split('Token: ')[1];

test('two logins produce one claim owner', async (t) => {
  const r = race(t, ['alice', 'bob']);
  const out = await results(r, await claimBoth(r));
  assert.equal(out.filter((o) => o.result === 'claimed').length, 1);
  const winner = out.findIndex((o) => o.result === 'claimed');
  const loser = 1 - winner;
  const winnerLogin = winner === 0 ? 'alice' : 'bob';
  assert.deepEqual(out[loser], { result: 'taken', assignees: [winnerLogin] });
  assert.ok(setsStatus(r.sessions[winner]));
  assert.ok(!setsStatus(r.sessions[loser]));
  assert.deepEqual(r.state().assignees, [winnerLogin]);
  assert.deepEqual(r.state().status, ['In Progress']);
  assert.equal(r.state().pages.flat().length, 1);
  assert.ok(out[winner].claim);
});

test('sessions sharing a login preserve the winning assignment', async (t) => {
  const r = race(t, ['alice', 'alice']);
  const out = await results(r, await claimBoth(r));
  assert.equal(out.filter((o) => o.result === 'claimed').length, 1);
  assert.deepEqual(r.state().assignees, ['alice']);
  assert.equal(r.state().pages.flat().length, 1);
  assert.deepEqual(r.state().status, ['In Progress']);
});

test('a repeated loser release preserves a shared-login winner', async (t) => {
  const r = race(t, ['alice', 'alice']);
  const out = await results(r, await claimBoth(r));
  const loser = out.findIndex((o) => o.result === 'taken');
  assert.notEqual(loser, -1, JSON.stringify(out));
  const release = await r.sessions[loser].lets('release', '149', '--claim', postedToken(r.sessions[loser]));
  assert.equal(release.code, 0, release.output);
  assert.deepEqual(r.b.json(release), { result: 'not-found' });
  assert.deepEqual(r.state().assignees, ['alice']);
  assert.equal(r.state().pages.flat().length, 1);
  assert.deepEqual(r.state().status, ['In Progress']);
});

for (const logins of [['alice', 'alice'], ['alice', 'bob']] as [string, string][]) {
  test(`release while the loser cleans up leaves no owner (${logins.join(', ')})`, async (t) => {
    const r = race(t, logins, true);
    const runs = await claimBoth(r);
    await r.b.waiting('cleanup', 1);
    // The loser is held at cleanup, so the first run to end is the winner's.
    const first = await Promise.race(runs.map((run, i) => run.then((result) => ({ result, i }))));
    assert.equal(first.result.code, 0, first.result.output);
    const won = r.b.json(first.result);
    assert.equal(won.result, 'claimed');
    const release = await r.sessions[first.i].lets('release', '149', '--claim', won.claim);
    assert.equal(release.code, 0, release.output);
    assert.deepEqual(r.b.json(release), { result: 'released' });
    r.b.open('cleanup');
    const lost = await runs[1 - first.i];
    assert.equal(lost.code, 0, lost.output);
    assert.deepEqual(r.b.json(lost).result, 'taken');
    assert.deepEqual(r.state().assignees, []);
    assert.deepEqual(r.state().pages.flat(), []);
    assert.equal(r.state().status.filter((s) => s === 'Todo').length, 1);
  });
}
