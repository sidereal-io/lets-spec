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

describe('an idea', () => {
  test('the name is the first five words and a hash of all the words', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', 'add a --quiet flag to lets sync');
    assert.deepEqual(printed(result), {
      name: 'idea-add-a-quiet-flag-to-f1ade72f',
      answers: '.workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-answers.yaml',
    });
  });

  test('two ideas that share their first five words get different hashes', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', 'add a --quiet flag to lets status');
    assert.equal(printed(result).name, 'idea-add-a-quiet-flag-to-cb62daa9');
  });

  test('case and punctuation do not change the name', async (t) => {
    const dir = tempDir(t);
    const dashed = await shapeName(dir, '--idea', 'fix lets-sync — quiet output');
    const plain = await shapeName(dir, '--idea', 'Fix letssync quiet output');
    assert.equal(printed(dashed).name, 'idea-fix-letssync-quiet-output-ef93442d');
    assert.equal(printed(plain).name, 'idea-fix-letssync-quiet-output-ef93442d');
  });

  test('letters in another script are kept', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', 'ログを直す');
    assert.equal(printed(result).name, 'idea-ログを直す-bffc2164');
  });

  test('a slug longer than 50 code points is cut, and the hash covers the whole word', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', 'https://github.com/sidereal-io/lets-spec/issues/180#issuecomment-1234567890');
    assert.equal(printed(result).name, 'idea-httpsgithubcomsiderealioletsspecissues180issuecomm-48aab992');
  });

  test('a hyphen left at the end of a cut slug is dropped', async (t) => {
    // 49 letters, a hyphen, then b: the cut at 50 ends on the hyphen.
    const result = await shapeName(tempDir(t), '--idea', `${'a'.repeat(49)} b`);
    assert.match(printed(result).name, /^idea-a{49}-[0-9a-f]{8}$/);
  });
});

/**
 * Asserts that a run was rejected: exit 2, an empty stdout, and exactly
 * one line on stderr. Returns that line, without its newline. Fails the
 * test, with the run's output, when any of these does not hold.
 */
function rejected(result: LetsResult): string {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^[^\n]*\n$/, `stderr is exactly one line: ${result.stderr}`);
  return result.stderr.slice(0, -1);
}

describe('an idea it cannot name', () => {
  test('an idea with no letter or digit is rejected', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', '???');
    assert.equal(rejected(result), 'lets go: an idea needs at least one letter or digit');
  });

  test('an idea of white space only is rejected', async (t) => {
    const result = await shapeName(tempDir(t), '--idea', '   ');
    assert.equal(rejected(result), 'lets go: an idea needs at least one letter or digit');
  });
});

describe('options it cannot take', () => {
  test('no option is rejected, naming --issue and --idea', async (t) => {
    const line = rejected(await shapeName(tempDir(t)));
    assert.ok(line.includes('--issue') && line.includes('--idea'), line);
  });

  test('both options are rejected, naming --issue and --idea', async (t) => {
    const line = rejected(await shapeName(tempDir(t), '--issue', '180', '--idea', 'fix the typo'));
    assert.ok(line.includes('--issue') && line.includes('--idea'), line);
  });

  test('--issue given twice is rejected, naming --issue', async (t) => {
    const line = rejected(await shapeName(tempDir(t), '--issue', '180', '--issue', '181'));
    assert.ok(line.includes('--issue'), line);
  });

  test('--idea given twice is rejected, naming --idea', async (t) => {
    const line = rejected(await shapeName(tempDir(t), '--idea', 'fix the typo', '--idea', 'fix the link'));
    assert.ok(line.includes('--idea'), line);
  });
});
