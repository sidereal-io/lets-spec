// Force both sessions past the empty-assignee read against one fake GitHub.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { commandDeps } from '../delegate/fixtures/command-deps.ts';
import { json, ok, PROJECT, REPO } from './fixtures/fake-gh.ts';

function race(logins: [string, string], releaseDuringCleanup = false) {
  const assigned = new Set<string>();
  const comments: { id: number; body: string; user: { login: string; type: string }; author_association: string }[] = [];
  const tokens: string[] = [];
  const statuses: string[][] = [[], []];
  let nextId = 1;
  let reads = 0;
  let open!: () => void;
  const bothRead = new Promise<void>((resolve) => { open = resolve; });
  const sessions = logins.map((login, session) => {
    const t = commandDeps();
    t.io.execFile = async (program, args) => {
      if (program === 'git') return ok('/repo\n');
      const cmd = args.join(' ');
      if (cmd.startsWith('api graphql')) return json({ repo: REPO, projects: [PROJECT] });
      if (cmd === 'api user') return json({ login });
      if (cmd.startsWith('issue view 149 --json assignees')) {
        reads++;
        if (reads === 2) open();
        await bothRead;
        return json({ assignees: [], url: `https://github.com/${REPO}/issues/149` });
      }
      if (cmd === 'issue view 149 --json url') return json({ url: `https://github.com/${REPO}/issues/149` });
      if (cmd.startsWith('issue edit 149 --add-assignee')) { assigned.add(login); return ok(''); }
      if (cmd.startsWith('issue edit 149 --remove-assignee')) { assigned.delete(login); return ok(''); }
      if (cmd.includes('/issues/149/comments')) {
        if (args.includes('POST')) {
          const body = args.find((a) => a.startsWith('body='))!.slice(5);
          const comment = { id: nextId++, body, user: { login, type: 'User' }, author_association: 'OWNER' };
          tokens[session] = body.split('Token: ')[1];
          comments.push(comment);
          return json(comment);
        }
        return json([comments.slice()]);
      }
      if (cmd.includes('/issues/comments/') && args.includes('DELETE')) {
        const id = Number(args.find((a) => a.includes('/issues/comments/'))!.split('/').at(-1));
        if (releaseDuringCleanup && id === 2) {
          const token = comments.find((c) => c.id === 1)!.body.split('Token: ')[1];
          const winner = tokens.indexOf(token);
          assert.equal(await run(['release', '149', '--claim', token], sessions[winner].deps), 0);
        }
        const i = comments.findIndex((c) => c.id === id);
        assert.equal(comments[i]?.user.login, login, 'delete only your comment');
        comments.splice(i, 1);
        return ok('');
      }
      if (cmd.startsWith('project item-edit')) { statuses[session].push(args.at(-1)!); return ok(''); }
      throw new Error(`unexpected gh ${cmd}`);
    };
    return t;
  });
  return { sessions, comments, assigned, statuses, tokens };
}

test('two logins produce one claim owner', async () => {
  const t = race(['alice', 'bob']);
  await Promise.all(t.sessions.map((s) => run(['claim', '149'], s.deps)));
  const results = t.sessions.map((s) => JSON.parse(s.stdout()));
  assert.equal(results.filter((r) => r.result === 'claimed').length, 1);
  const winner = results.findIndex((r) => r.result === 'claimed');
  const loser = 1 - winner;
  assert.deepEqual(results[loser], { result: 'taken', assignees: [winner === 0 ? 'alice' : 'bob'] });
  assert.deepEqual(t.statuses[winner], ['In Progress']);
  assert.deepEqual(t.statuses[loser], []);
  assert.deepEqual([...t.assigned], [winner === 0 ? 'alice' : 'bob']);
  assert.equal(t.comments.length, 1);
  assert.ok(results[winner].claim);
});

test('sessions sharing a login preserve the winning assignment', async () => {
  const t = race(['alice', 'alice']);
  await Promise.all(t.sessions.map((s) => run(['claim', '149'], s.deps)));
  const results = t.sessions.map((s) => JSON.parse(s.stdout()));
  assert.equal(results.filter((r) => r.result === 'claimed').length, 1);
  assert.deepEqual([...t.assigned], ['alice']);
  assert.equal(t.comments.length, 1);
  assert.deepEqual(t.statuses.flat(), ['In Progress']);
});

test('a repeated loser release preserves a shared-login winner', async () => {
  const t = race(['alice', 'alice']);
  await Promise.all(t.sessions.map((s) => run(['claim', '149'], s.deps)));
  const loser = t.sessions.findIndex((s) => JSON.parse(s.stdout()).result === 'taken');
  assert.equal(await run(['release', '149', '--claim', t.tokens[loser]], t.sessions[loser].deps), 0);
  assert.deepEqual([...t.assigned], ['alice']);
  assert.equal(t.comments.length, 1);
  assert.deepEqual(t.statuses.flat(), ['In Progress']);
});

for (const logins of [['alice', 'alice'], ['alice', 'bob']] as [string, string][]) {
  test(`release while the loser cleans up leaves no owner (${logins.join(', ')})`, async () => {
    const t = race(logins, true);
    await Promise.all(t.sessions.map((s) => run(['claim', '149'], s.deps)));
    assert.deepEqual([...t.assigned], []);
    assert.deepEqual(t.comments, []);
    assert.equal(t.statuses.flat().filter((s) => s === 'Todo').length, 1);
  });
}
