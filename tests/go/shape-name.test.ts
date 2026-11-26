// lets go shape-name, run as a program. It reads no file and asks no
// resolver, so each test runs it in an empty temporary folder, which is
// also outside any Git repository.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { git, type LetsResult, runLets, tempDir } from '../support/lets.ts';

/**
 * The `{ name, answers }` of a run that succeeded. Asserts exit 0, an
 * empty stderr and exactly one line on stdout, whose keys are `name` then
 * `answers`. Fails the test, with the run's output, when any of these does
 * not hold.
 */
function printed(result: LetsResult): { name: string; answers: string } {
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /^[^\n]*\n$/, 'stdout is exactly one line');
  const value = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(value), ['name', 'answers'], result.stdout);
  return value;
}

function shapeName(cwd: string, ...args: string[]): Promise<LetsResult> {
  return runLets(['go', 'shape-name', ...args], { cwd });
}

describe('an issue', () => {
  test('--issue 180 prints issue-180 and its answers file', async (t) => {
    const result = await shapeName(tempDir(t), '--issue', '180');
    printed(result);
    assert.equal(result.stdout, '{"name":"issue-180","answers":".workspace/lets-go/issue-180-shape-answers.yaml"}\n');
  });

  test('a key of another backlog provider is kept unchanged', async (t) => {
    const result = await shapeName(tempDir(t), '--issue', 'PROJ-12');
    assert.deepEqual(printed(result), { name: 'issue-PROJ-12', answers: '.workspace/lets-go/issue-PROJ-12-shape-answers.yaml' });
  });

  test('a run inside a Git repository prints the same line as one outside', async (t) => {
    const outside = await shapeName(tempDir(t), '--issue', '180');
    const repo = tempDir(t);
    git(repo, 'init', '--quiet');
    const inside = await shapeName(repo, '--issue', '180');
    printed(inside);
    assert.equal(inside.stdout, outside.stdout);
  });
});
