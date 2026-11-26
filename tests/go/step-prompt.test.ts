// lets go step-prompt, run as a program in a temporary repository. It only
// prints, so each test reads stdout, stderr and the exit code, and the
// repository holds just the plain-language reference the prompt names.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test, type TestContext } from 'node:test';
import { delegateRepo, type DelegateRepo } from '../delegate/repo.ts';
import { agy, claude, codex, git, type LetsResult, standIn } from '../support/lets.ts';

const REFERENCE = '.agents/skills/lets-shape/references/plain-language.md';

/** A repository with the plain-language reference installed, unless `reference` is false. */
function promptRepo(t: TestContext, { reference = true, notInRepo = false } = {}): DelegateRepo {
  const repo = delegateRepo(t, { notInRepo });
  if (reference) {
    const path = join(repo.cwd, REFERENCE);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, '# Plain language\n');
  }
  return repo;
}

const ISSUE_URL = 'https://github.com/o/r/issues/149';

/** The flags a walk step requires, for the change lets-go-chore and issue 149. */
function walk(step: string, overrides: Record<string, string> = {}): string[] {
  const values: Record<string, string> = {
    name: 'lets-go-chore', issue: '149', 'issue-url': ISSUE_URL, schema: 'lets-minimal',
    route: 'Route: lets-minimal, because #149 is a Chore.', questions: 'auto', ...overrides,
  };
  return ['go', 'step-prompt', '--for', step, ...Object.entries(values).flatMap(([flag, value]) => [`--${flag}`, value])];
}

/** Asserts exit 0 and an empty stderr, and returns stdout. */
function printed(result: LetsResult): string {
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stderr, '');
  return result.stdout;
}

/** The `##` headings of a prompt, in order, outside fenced blocks. */
function headings(prompt: string): string[] {
  let fence = false;
  const found: string[] = [];
  for (const line of prompt.split('\n')) {
    if (line.startsWith('```')) fence = !fence;
    else if (!fence && line.startsWith('## ')) found.push(line);
  }
  return found;
}

/** The text of the section headed `heading`, up to the next `##` heading outside a fence. */
function section(prompt: string, heading: string): string {
  const lines = prompt.split('\n');
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, `${heading} in ${prompt}`);
  let fence = false;
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('```')) fence = !fence;
    else if (!fence && line.startsWith('## ')) break;
    body.push(line);
  }
  return body.join('\n').trim();
}

describe('a walk step\'s prompt', () => {
  test('the plan prompt: its two header lines, then the one skill sentence', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run(walk('plan')));
    const [first, second] = prompt.split('\n');
    assert.equal(first, 'You run one step of a lets-go run: plan, for the change lets-go-chore.');
    assert.equal(second, `Issue: #149, ${ISSUE_URL}. Branch: lets-go-chore. Schema: lets-minimal. Route: lets-minimal, because #149 is a Chore.`);
    assert.equal(section(prompt, '## What to run'), 'Invoke the `lets-plan` skill for the change `lets-go-chore`, for issue #149, and stop where it stops.');
  });

  test('each step names its own skill and no other step\'s', async (t) => {
    const repo = promptRepo(t);
    const skills: Record<string, string> = { plan: 'lets-plan', 'review-plan': 'lets-review-plan', build: 'lets-build', 'review-build': 'lets-review-build' };
    for (const [step, skill] of Object.entries(skills)) {
      const prompt = printed(await repo.run(walk(step, { name: 'lets-go-story', issue: '152', schema: 'lets-standard' })));
      assert.equal(prompt.split('\n')[0], `You run one step of a lets-go run: ${step}, for the change lets-go-story.`);
      assert.equal(section(prompt, '## What to run'), `Invoke the \`${skill}\` skill for the change \`lets-go-story\`, for issue #152, and stop where it stops.`);
      for (const other of Object.values(skills).filter((name) => name !== skill)) {
        assert.ok(!prompt.includes(`\`${other}\``), `${step} names ${other}`);
      }
    }
  });

  test('the sections come in order, and the prompt ends in one newline', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run(walk('plan')));
    assert.deepEqual(headings(prompt), ['## What to run', '## Writing', '## Questions', '## The report']);
    assert.ok(prompt.endsWith('\n') && !prompt.endsWith('\n\n'), JSON.stringify(prompt.slice(-20)));
  });

  test('it writes no file and calls no outside program', async (t) => {
    const repo = promptRepo(t);
    const outside = [
      standIn(repo.standIns, 'gh', []), standIn(repo.standIns, 'openspec', []),
      codex(repo.standIns), agy(repo.standIns), claude(repo.standIns),
    ];
    const before = git(repo.cwd, 'status', '--porcelain').stdout;
    printed(await repo.run(walk('build')));
    assert.equal(git(repo.cwd, 'status', '--porcelain').stdout, before);
    assert.equal(existsSync(join(repo.cwd, '.workspace')), false);
    for (const program of outside) assert.deepEqual(program.calls(), []);
  });
});
