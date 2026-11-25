import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/go/questions.ts';
import { commandDeps, REPO_CONFIG } from '../delegate/fixtures/command-deps.ts';

test('questions prints the repository\'s question mode over the user\'s', async () => {
  const t = commandDeps({ config: 'version: 3\ngo:\n  questions: ask\n', repoConfig: 'version: 3\ngo:\n  questions: auto\n' });
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"questions":"auto"}\n');
});

test('questions prints the user\'s question mode when the repository\'s lets config has no go', async () => {
  const t = commandDeps({ config: 'version: 3\ngo:\n  questions: ask\n', repoConfig: 'version: 3\n' });
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"questions":"ask"}\n');
});

test('a bad question mode in the repository\'s lets config exits 2, naming that file, the key and the value', async () => {
  const t = commandDeps({ config: 'version: 3\ngo:\n  questions: ask\n', repoConfig: 'version: 3\ngo:\n  questions: loud\n' });
  assert.equal(await run(t.deps), 2);
  assert.equal(t.stdout(), '');
  for (const named of [REPO_CONFIG, 'go.questions', 'loud']) assert.ok(t.stderr().includes(named), named);
});

test('a question mode that is a mapping in the repository\'s lets config exits 2, naming that file', async () => {
  const t = commandDeps({ repoConfig: 'version: 3\ngo:\n  questions: {}\n' });
  assert.equal(await run(t.deps), 2);
  assert.ok(t.stderr().includes(REPO_CONFIG), t.stderr());
});
