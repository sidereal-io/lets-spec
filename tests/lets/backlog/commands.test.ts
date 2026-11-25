// Kept in process: lets gives each gh call 60 seconds, so a black-box test
// of the timeout would wait that long. tests/backlog/ runs every other
// test of these rules through the command.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import { backlogDeps, json, LOOKUP_ONE, TIMED_OUT } from './fixtures/fake-gh.ts';

const FIND: [string, ReturnType<typeof json>] = ['issue list --state open --search', json([])];

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
