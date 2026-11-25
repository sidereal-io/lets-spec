import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SpawnError } from '../../../lets/src/resolvers/kit/errors.ts';
import { findRepoRoot, isTreeClean, treeStatus } from '../../../lets/src/delegate/git.ts';
import { fakeIo } from './fixtures/fake-io.ts';

// An io whose git status answers stdout, with the exit code given.
function gitIo(stdout: string, code = 0) {
  return fakeIo({
    results: [(cmd, args, opts) => {
      assert.equal(cmd, 'git');
      assert.deepEqual(args, ['status', '--porcelain', '-z', '--untracked-files=all']);
      assert.deepEqual(opts, { cwd: '/r' });
      return { stdout, stderr: 'fatal: index locked', code };
    }],
  });
}
const z = (...entries: string[]) => entries.map((e) => `${e}\0`).join('');

test('treeStatus lists each entry, keeps paths with spaces whole, and skips a rename source', async () => {
  assert.deepEqual(await treeStatus('/r', gitIo('')), []);
  assert.deepEqual(await treeStatus('/r', gitIo(z(' M a b.md', '?? .workspace/x y', 'R  new', 'old'))),
    [' M a b.md', '?? .workspace/x y', 'R  new']);
});

test('treeStatus fails loudly when git fails', async () => {
  await assert.rejects(treeStatus('/r', gitIo('', 128)), (error) => error instanceof SpawnError && /index locked/.test(error.message));
});

test('isTreeClean ignores .workspace/ and anything that was already there', async () => {
  assert.equal(await isTreeClean('/r', gitIo('')), true);
  assert.equal(await isTreeClean('/r', gitIo(z(' M .workspace/x', '?? .workspace/lets-delegate/y z'))), true);
  assert.equal(await isTreeClean('/r', gitIo(z(' M README.md'))), false);
  assert.equal(await isTreeClean('/r', gitIo(z(' M README.md', '?? .envrc')), [' M README.md', '?? .envrc']), true);
  assert.equal(await isTreeClean('/r', gitIo(z(' M README.md', '?? new.js')), [' M README.md']), false);
});

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
