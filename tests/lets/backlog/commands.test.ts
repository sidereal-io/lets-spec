import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, json, LOOKUP_ONE, TIMED_OUT } from './fixtures/fake-gh.ts';

const FIND: [string, ReturnType<typeof json>] = ['issue list --state open --search', json([])];

// Kept in process: lets gives gh 60 seconds, so a black-box test would wait
// that long. tests/backlog/shared.test.ts checks a gh that cannot start.
test('gh that times out is backend-failed', async () => {
  const t = backlogDeps([['api graphql', TIMED_OUT]]);
  assert.equal(await run(['ready'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'backend-failed');
  assert.ok(out.message.length > 0);
});

test('every gh call has a finite timeout', async () => {
  const t = backlogDeps([...LOOKUP_ONE, FIND]);
  await run(['find', 'fix-typo'], t.deps);
  for (const opts of t.options()) assert.ok(Number.isFinite(opts.timeoutMs) && opts.timeoutMs! > 0);
});

test('the help text names the backlog provider in use', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['--help'], t.deps), 0);
  assert.match(t.stdout(), /backlog provider is github/i);
  assert.doesNotMatch(t.stdout(), /gh-failed/);
  assert.match(t.stdout(), /backend-failed/);
  assert.match(t.stdout(), /unknown-backlog-provider/);
});

test('lets backlog ready --help names --met-blockers with an example', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['ready', '--help'], t.deps), 0);
  assert.match(t.stdout(), /--met-blockers <keys>.*279,280/);
});

test('the command list names ready --met-blockers with an example', async () => {
  const t = backlogDeps([]);
  await run(['--help'], t.deps);
  assert.match(t.stdout(), /ready \[--met-blockers <keys>\][^]*?such as 279,280/);
});

test('lets backlog ready --help names --started with an example', async () => {
  const t = backlogDeps([]);
  assert.equal(await run(['ready', '--help'], t.deps), 0);
  assert.match(t.stdout(), /--started <keys>[^]*?281,282/);
});

test('the command list names ready --started with an example', async () => {
  const t = backlogDeps([]);
  await run(['--help'], t.deps);
  assert.match(t.stdout(), /ready \[--started <keys>\][^]*?such as 281,282/);
});
