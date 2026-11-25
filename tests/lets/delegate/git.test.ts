// findRepoRoot, which config reading uses. #320 moves these with the config
// tests. The tree check and the repository root of a run are tested
// through lets, in tests/delegate/run.test.ts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findRepoRoot } from '../../../lets/src/delegate/git.ts';
import { fakeIo } from './fixtures/fake-io.ts';

test('findRepoRoot runs git rev-parse --show-toplevel in cwd, with a timeout, and gives the top level', async () => {
  const io = fakeIo({ results: [{ stdout: '/r\n', stderr: '', code: 0 }] });
  assert.equal(await findRepoRoot('/r/sub', io), '/r');
  const [[cmd, args, opts]] = io.calls;
  assert.equal(cmd, 'git');
  assert.deepEqual(args, ['rev-parse', '--show-toplevel']);
  assert.equal(opts.cwd, '/r/sub');
  assert.ok(Number.isFinite(opts.timeoutMs) && opts.timeoutMs! > 0);
});

test('findRepoRoot is null when git exits non-zero, cannot start, or times out', async () => {
  for (const answer of [{ stdout: '', stderr: 'fatal: not a git repository', code: 128 }, { stdout: '', stderr: 'spawn git ENOENT', code: null },
    { stdout: '', stderr: '', code: 1, timedOut: true }]) {
    assert.equal(await findRepoRoot('/tmp', fakeIo({ results: [answer] })), null, JSON.stringify(answer));
  }
});
