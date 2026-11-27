// The timeout of lets delegate review run, run as a program. It takes a
// minute, the shortest --timeout-minutes, so it has a file of its own,
// which Node runs beside the other test files.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { claude } from '../support/lets.ts';
import { delegateRepo } from './repo.ts';

test('a session past its time is stopped, and is exit 6 with no findings', async (t) => {
  const repo = delegateRepo(t, { user: 'version: 4\ndelegate: { resolvers: [cli] }\n' });
  claude(repo.standIns, { rows: [{ args: ['-p', '--permission-mode', 'plan', '--effort', 'low'], hang: true }] });
  const started = performance.now();
  const result = await repo.run(['delegate', 'review', 'run', '--for', 'review-build', '--name', 'slow', '--prompt-file', 'p.md',
    '--source-family', 'gpt', '--effort', 'low', '--model', 'claude', '--timeout-minutes', '1'], { timeoutMs: 100_000 });
  const elapsed = performance.now() - started;
  assert.equal(result.code, 6, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^lets delegate: claude did not finish in 1 minutes$/m);
  // A hanging stand-in ends by itself after 120 seconds, so a run this
  // short shows that lets stopped it, and one this long that lets waited
  // the whole minute.
  assert.ok(elapsed >= 55_000 && elapsed < 90_000, `the run took ${elapsed} ms`);
});
