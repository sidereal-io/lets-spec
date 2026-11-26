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

/** Asserts exit 2, an empty stdout, and one stderr line after `lets go: ` that holds each of `named`. Returns stderr. */
function rejected(result: LetsResult, ...named: string[]): string {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^lets go: [^\n]*\n$/, result.stderr);
  for (const text of named) assert.ok(result.stderr.includes(text), `${text} in ${result.stderr}`);
  return result.stderr;
}

describe('the plain-language reference', () => {
  test('## Writing names the installed reference under the repository root, run from a subfolder', async (t) => {
    const repo = promptRepo(t);
    const sub = join(repo.cwd, 'a', 'b');
    mkdirSync(sub, { recursive: true });
    const prompt = printed(await repo.run(walk('plan'), { cwd: sub }));
    assert.ok(section(prompt, '## Writing').startsWith(`Plain-language method: ${join(repo.cwd, REFERENCE)}.\n`), prompt);
  });

  test('with no installed reference, it exits 2 and names the path', async (t) => {
    const repo = promptRepo(t, { reference: false });
    rejected(await repo.run(walk('build')), REFERENCE);
  });

  test('outside a git repository, it exits 2 and says so', async (t) => {
    const repo = promptRepo(t, { notInRepo: true });
    rejected(await repo.run(walk('plan')), 'is not in a git repository');
  });
});

describe('how the step asks and reports', () => {
  test('at auto, ## Questions names the mode and the rules for needs-input and ## Answers', async (t) => {
    const repo = promptRepo(t);
    const questions = section(printed(await repo.run(walk('plan', { questions: 'auto' }))), '## Questions');
    assert.ok(questions.startsWith('The question mode is auto.'), questions);
    for (const text of ['needs-input', 'recommendation', '`## Answers`', 'Assumption', 'User', '`Confirmed by user: yes`', '(lets-go\naccepted the step\'s recommendation; the user did not decide)']) {
      assert.ok(questions.includes(text), `${text} in ${questions}`);
    }
  });

  test('at ask, the session puts every question to the user, and the step still lists them with recommendations', async (t) => {
    const repo = promptRepo(t);
    const questions = section(printed(await repo.run(walk('plan', { questions: 'ask' }))), '## Questions');
    assert.ok(questions.startsWith('The question mode is ask.'), questions);
    assert.ok(questions.includes('At ask, it puts every question to the user'), questions);
    assert.ok(questions.includes('lists\nevery open question') && questions.includes('Give a\nrecommendation where you have one.'), questions);
  });

  test('a confirmation carries no recommendation', async (t) => {
    const repo = promptRepo(t);
    const questions = section(printed(await repo.run(walk('plan'))), '## Questions');
    assert.ok(questions.includes('Give none for a question that asks\nthe user to confirm something, such as a brainstorm ledger, an issue\npacket or a discovery phase.'), questions);
  });

  test('## The report shows the three outcomes and the evidence and quoting rules', async (t) => {
    const repo = promptRepo(t);
    const report = section(printed(await repo.run(walk('review-plan'))), '## The report');
    const blocks = [...report.matchAll(/```step-report\n([\s\S]*?)```/g)].map((match) => match[1].split('\n')[0]);
    assert.deepEqual(blocks, ['outcome: done', 'outcome: needs-input', 'outcome: failed']);
    for (const text of ['evidence:', 'questions:', 'reason:', '`Plan review: <verdict> for <sha>`', '`issue #<i>: <title>`', '`epic #<parent>: <title>`', '`story #<story>: <title>`', 'Write the report last.', 'Quote a line that\nholds `#` or `: `.', 'Put no other step-report block in the message.']) {
      assert.ok(report.includes(text), `${text} in ${report}`);
    }
  });
});

const IDEA = 'add a --quiet flag to lets sync';
const shapeIssue = ['go', 'step-prompt', '--for', 'shape', '--issue', '180', '--issue-url', 'https://github.com/o/r/issues/180', '--branch', 'main', '--questions', 'ask'];
const shapeIdea = ['go', 'step-prompt', '--for', 'shape', '--idea', IDEA, '--branch', 'main', '--questions', 'auto'];

describe('the shape prompt', () => {
  test('for an issue: its header lines and the lets-shape sentence', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run(shapeIssue));
    const [first, second] = prompt.split('\n');
    assert.equal(first, 'You run one step of a lets-go run: shape, for issue #180.');
    assert.equal(second, 'Issue: #180, https://github.com/o/r/issues/180. Branch: main.');
    assert.equal(section(prompt, '## What to run'), 'Invoke the `lets-shape` skill for issue #180, and stop where it stops.');
    assert.deepEqual(headings(prompt), ['## What to run', '## Writing', '## Questions', '## The report']);
  });

  test('for an idea: the idea word for word, and no schema or route', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run(shapeIdea));
    const [first, second] = prompt.split('\n');
    assert.equal(first, 'You run one step of a lets-go run: shape, for an idea.');
    assert.equal(second, `Issue: none yet. The idea is: ${IDEA}. Branch: main.`);
    assert.equal(section(prompt, '## What to run'), 'Invoke the `lets-shape` skill for the idea above, and stop where it stops.');
    assert.ok(!prompt.includes('Schema:') && !prompt.includes('Route:'), prompt);
  });

  test('for an idea whose search ran, the second line says so', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run([...shapeIdea, '--searched']));
    assert.equal(prompt.split('\n')[1], `Issue: none yet. The idea is: ${IDEA}. Branch: main. Open issues were searched, and none is the same work.`);
  });

  test('neither form names a part of lets-shape', async (t) => {
    const repo = promptRepo(t);
    for (const args of [shapeIssue, shapeIdea]) {
      const prompt = printed(await repo.run(args));
      for (const text of ['Resume mode', 'Shape one issue', 'Discovery status: in-progress', 'Run discovery on it?', 'Schema:', 'Route:']) {
        assert.ok(!prompt.includes(text), `${text} in ${prompt}`);
      }
    }
  });
});

const WORKTREE = '.workspace/lets-go/worktrees/story-run-child-sessions';

/** The flags the story prompt requires, for #284 under #278. */
function story(overrides: Record<string, string> = {}): string[] {
  const values: Record<string, string> = {
    name: 'story-run-child-sessions', issue: '284', 'issue-url': 'https://github.com/o/r/issues/284', parent: '278',
    checkout: WORKTREE, schema: 'lets-standard', route: 'Route: lets-standard, because #284 is a Size M Story.', questions: 'auto', ...overrides,
  };
  return ['go', 'step-prompt', '--for', 'story', ...Object.entries(values).flatMap(([flag, value]) => [`--${flag}`, value])];
}

describe('the story prompt', () => {
  test('its header lines, the worktree, the schema and the question mode', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run(story()));
    const [first, second] = prompt.split('\n');
    assert.equal(first, 'You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.');
    assert.equal(second, 'Issue: #284, https://github.com/o/r/issues/284. Branch: story-run-child-sessions. Schema: lets-standard. Route: lets-standard, because #284 is a Size M Story.');
    const what = section(prompt, '## What to run');
    for (const text of ['`lets-go`', 'already claimed #284', `\`${WORKTREE}\``, 'Claim nothing, route nothing']) {
      assert.ok(what.includes(text), `${text} in ${what}`);
    }
    const questions = section(prompt, '## Questions');
    assert.ok(questions.startsWith('The question mode is auto. The epic run applies it'), questions);
    assert.ok(questions.includes('Never ask the user in\nthis session'), questions);
    const report = section(prompt, '## The report');
    assert.ok(report.includes('Its outcome is done, with the pull request as its first\nevidence line; needs-input'), report);
  });

  test('its sections are What to run, Questions and The report, with no Writing', async (t) => {
    const repo = promptRepo(t);
    assert.deepEqual(headings(printed(await repo.run(story()))), ['## What to run', '## Questions', '## The report']);
  });

  test('it needs no plain-language reference', async (t) => {
    const repo = promptRepo(t, { reference: false });
    printed(await repo.run(story()));
  });
});

const stacked = (blocker: string, branch: string, pr: string) => ['--blocker', blocker, '--blocker-branch', branch, '--blocker-pr', pr];

describe('a stacked story\'s Stack section', () => {
  test('the plan step: right after ## What to run, naming the blocker, the base and the merge order', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run([...walk('plan', { name: 'epic-run-failures', issue: '280' }), ...stacked('279', 'epic-run-skeleton', '290')]));
    assert.deepEqual(headings(prompt), ['## What to run', '## Stack', '## Writing', '## Questions', '## The report']);
    const stack = section(prompt, '## Stack');
    for (const text of ['#279', '`--base epic-run-skeleton`', '`Stacked on #290; merge that first.`', '`Closes #280`', '`gh pr edit epic-run-failures --base epic-run-skeleton`']) {
      assert.ok(stack.includes(text), `${text} in ${stack}`);
    }
  });

  test('the story prompt: right after ## What to run', async (t) => {
    const repo = promptRepo(t);
    const prompt = printed(await repo.run([...story(), ...stacked('282', 'epic-run-resume', '293')]));
    assert.deepEqual(headings(prompt), ['## What to run', '## Stack', '## Questions', '## The report']);
    const stack = section(prompt, '## Stack');
    assert.ok(stack.includes('`--base epic-run-resume`') && stack.includes('`Stacked on #293; merge that first.`'), stack);
  });

  test('the same text in every prompt of the story', async (t) => {
    const repo = promptRepo(t);
    const values = { name: 'epic-run-resume-child', issue: '300' };
    const stack = stacked('282', 'epic-run-resume', '293');
    const sections = [];
    for (const args of [story(values), walk('plan', values), walk('build', values), walk('review-build', values)]) {
      sections.push(section(printed(await repo.run([...args, ...stack])), '## Stack'));
    }
    for (const other of sections.slice(1)) assert.equal(other, sections[0]);
  });

  test('a story that is not stacked has no ## Stack', async (t) => {
    const repo = promptRepo(t);
    assert.ok(!headings(printed(await repo.run(walk('build')))).includes('## Stack'));
    assert.ok(!headings(printed(await repo.run(story()))).includes('## Stack'));
  });

  test('part of a stack exits 2, naming the missing flags', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run([...walk('plan'), '--blocker', '279']), '--blocker-branch', '--blocker-pr');
    rejected(await repo.run([...walk('plan'), '--blocker', '279', '--blocker-pr', '290']), '--blocker-branch');
  });
});

describe('flags that do not fit the step', () => {
  const rest = ['--name', 'x', '--issue', '1', '--issue-url', 'u', '--schema', 's', '--route', 'r', '--questions', 'ask'];
  const shape = ['go', 'step-prompt', '--for', 'shape', '--branch', 'main', '--questions', 'ask'];

  test('an unknown step names --for and the value', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run(['go', 'step-prompt', '--for', 'review', ...rest]), '--for', 'review');
  });

  test('no step names --for', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run(['go', 'step-prompt', ...rest]), '--for');
  });

  test('a missing flag is named', async (t) => {
    const repo = promptRepo(t);
    const args = walk('plan');
    args.splice(args.indexOf('--route'), 2);
    rejected(await repo.run(args), '--route');
    rejected(await repo.run(story().slice(0, -4)), '--route', '--questions');
  });

  test('a flag the step does not take is named', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run([...shapeIssue, '--schema', 'lets-standard']), '--schema');
    rejected(await repo.run([...shapeIssue, ...stacked('1', 'b', '2')]), '--blocker');
    rejected(await repo.run([...walk('plan'), '--idea', 'x']), '--idea');
    rejected(await repo.run([...walk('build'), '--parent', '278']), '--parent');
  });

  test('shape with both an issue and an idea, or neither, names both flags', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run([...shape, '--issue', '180', '--issue-url', 'u', '--idea', 'x']), '--issue', '--idea');
    rejected(await repo.run(shape), '--issue', '--idea');
  });

  test('shape with an issue but no URL names --issue-url', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run([...shape, '--issue', '180']), '--issue-url');
  });

  test('a search without an idea names --searched and --idea', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run([...shape, '--issue', '180', '--issue-url', 'u', '--searched']), '--searched', '--idea');
  });

  test('a question mode lets does not know names --questions and the value', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run(walk('plan', { questions: 'loud' })), '--questions', 'loud');
  });

  test('a line break in any value but the idea is named', async (t) => {
    const repo = promptRepo(t);
    rejected(await repo.run(walk('plan', { route: 'Route: lets-minimal,\nbecause #149 is a Chore.' })), '--route');
    rejected(await repo.run(walk('build', { name: 'a\r\nb' })), '--name');
    const idea = printed(await repo.run([...shape, '--idea', 'two\nlines']));
    assert.ok(idea.includes('The idea is: two\nlines. Branch: main.'), idea);
  });
});
