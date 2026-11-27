// lets delegate <strategy> instructions, run as a program. The cli and
// subagent resolvers are chosen by a real lets config, and PATH holds only
// the stand-in codex, claude and agy a test writes, and git, so no real
// CLI on the developer's machine changes a result.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, type TestContext, test } from 'node:test';
import { agy, claude, codex, type EnvChanges, git, type LetsResult, runLets, tempDir } from '../support/lets.ts';

const CLI = 'version: 4\ndelegate: { resolvers: [cli] }\n';
const CLI_THEN_SUBAGENT = 'version: 4\ndelegate: { resolvers: [cli, subagent] }\n';
const LUNA = [{ slug: 'gpt-6-luna', visibility: 'list' }] as const;

interface Setup {
  /** The text of the user's lets config. None when absent. */
  user?: string;
  /** The text of the repository's `.lets/config.yaml`. None when absent. */
  repo?: string;
  /** Run in a folder that is in no Git repository. */
  notInRepo?: boolean;
  /** Writes the stand-ins into the folder it is given. */
  standIns?: (dir: string) => void;
  env?: EnvChanges;
  timeoutMs?: number;
}

interface Run {
  result: LetsResult;
  /** Where the user's lets config is, whether or not it exists. */
  userConfig: string;
  /** Where the repository's lets config is, whether or not it exists. */
  repoConfig: string;
}

// Runs lets delegate <strategy> instructions --for <intent> in a folder of
// its own, as setup says.
async function instructions(t: TestContext, strategy: string, intent: string, setup: Setup = {}): Promise<Run> {
  const home = tempDir(t);
  const userConfig = join(home, 'lets', 'config.yaml');
  if (setup.user !== undefined) {
    mkdirSync(dirname(userConfig));
    writeFileSync(userConfig, setup.user);
  }
  const cwd = tempDir(t);
  const env: EnvChanges = { XDG_CONFIG_HOME: home };
  if (setup.notInRepo) {
    // A temporary folder may sit inside some repository; git looks no higher.
    env.GIT_CEILING_DIRECTORIES = dirname(cwd);
  } else {
    git(cwd, 'init', '-q');
  }
  const repoConfig = join(cwd, '.lets', 'config.yaml');
  if (setup.repo !== undefined) {
    mkdirSync(dirname(repoConfig));
    writeFileSync(repoConfig, setup.repo);
  }
  const standIns = tempDir(t);
  setup.standIns?.(standIns);
  const result = await runLets(['delegate', strategy, 'instructions', '--for', intent], {
    cwd, standIns, onlyStandIns: true, env: { ...env, ...setup.env }, timeoutMs: setup.timeoutMs,
  });
  return { result, userConfig, repoConfig };
}

// The one JSON line of a run that exited 0.
function line({ result }: Run): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  assert.match(result.stdout, /^[^\n]*\n$/, 'stdout is exactly one line');
  return JSON.parse(result.stdout);
}

// A run that every resolver declined: exit 2, nothing on stdout, and a
// message that names file.
function declined({ result }: Run, file: string) {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /every resolver declined/);
  assert.ok(result.stderr.includes(file), result.stderr);
}

// Every family CLI on PATH, each listing nothing.
const everyCli = (dir: string) => ({ codex: codex(dir), claude: claude(dir), agy: agy(dir) });

test('review instructions from cli print the strategy, the intent, the resolver and its options as one JSON line', async (t) => {
  const run = await instructions(t, 'review', 'review-build', { user: CLI, standIns: (dir) => claude(dir) });
  assert.deepEqual(line(run), { strategy: 'review', for: 'review-build', resolver: 'cli', options: ['claude'], guidance: null });
  assert.equal(run.result.stderr, '');
});

test('step instructions from cli print the step strategy and the models codex lists', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: CLI_THEN_SUBAGENT, standIns: (dir) => codex(dir, [...LUNA]) });
  assert.deepEqual(line(run), { strategy: 'step', for: 'build', resolver: 'cli', options: ['gpt/gpt-6-luna'], guidance: null });
});

test('with no family CLI on PATH, cli declines and subagent answers next', async (t) => {
  for (const [strategy, intent] of [['review', 'review-build'], ['step', 'build']]) {
    const run = await instructions(t, strategy, intent, { user: CLI_THEN_SUBAGENT });
    assert.deepEqual(line(run), { strategy, for: intent, resolver: 'subagent', options: [], guidance: null }, strategy);
  }
});

test('when subagent comes first, it answers, and cli is never asked', async (t) => {
  let stand: ReturnType<typeof codex> | undefined;
  const run = await instructions(t, 'review', 'review-build', {
    user: 'version: 4\ndelegate: { resolvers: [subagent, cli] }\n',
    standIns: (dir) => { stand = codex(dir, [...LUNA]); },
  });
  assert.equal(line(run).resolver, 'subagent');
  assert.deepEqual(stand!.calls(), [], 'codex was not called');
});

test('subagent lists no models and runs no program, even with every family CLI on PATH', async (t) => {
  let clis: ReturnType<typeof everyCli> | undefined;
  const run = await instructions(t, 'review', 'review-build', {
    user: 'version: 4\ndelegate: { resolvers: [subagent] }\n',
    standIns: (dir) => { clis = everyCli(dir); },
  });
  assert.deepEqual(line(run), { strategy: 'review', for: 'review-build', resolver: 'subagent', options: [], guidance: null });
  for (const [name, stand] of Object.entries(clis!)) assert.deepEqual(stand.calls(), [], name);
});

test('instructions run only the model listings, and start no session', async (t) => {
  for (const [strategy, intent] of [['review', 'review-build'], ['review', 'review-plan'], ['step', 'build']]) {
    let clis: ReturnType<typeof everyCli> | undefined;
    const run = await instructions(t, strategy, intent, { user: CLI, standIns: (dir) => { clis = everyCli(dir); } });
    assert.equal(line(run).resolver, 'cli', `${strategy} ${intent}`);
    assert.deepEqual(clis!.codex.calls(), [['debug', 'models']], `${strategy} ${intent}`);
    assert.deepEqual(clis!.agy.calls(), [['models']], `${strategy} ${intent}`);
    assert.deepEqual(clis!.claude.calls(), [], `${strategy} ${intent}`);
  }
});

test('when every resolver in the user\'s lets config declines, it is exit 2, naming that file', async (t) => {
  const run = await instructions(t, 'review', 'review-build', { user: CLI });
  declined(run, run.userConfig);
});

test('when every resolver in the repository\'s lets config declines, it is exit 2, naming that file', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: CLI_THEN_SUBAGENT, repo: CLI });
  declined(run, run.repoConfig);
});

test('an empty chain declines every delegation, and is exit 2, naming the config file', async (t) => {
  const run = await instructions(t, 'review', 'review-build', { user: 'version: 4\ndelegate: { resolvers: [] }\n', standIns: everyCli });
  declined(run, run.userConfig);
});

test('cli lists the families in the order gpt, claude, gemini', async (t) => {
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => { agy(dir, ['gemini-3.8-flash-high']); claude(dir); codex(dir, [...LUNA]); },
  });
  assert.deepEqual(line(run).options, ['gpt/gpt-6-luna', 'claude', 'gemini/gemini-3.8-flash']);
});

test('cli lists only the codex slugs whose visibility is list, in codex\'s order', async (t) => {
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => codex(dir, [{ slug: 'gpt-reserve', visibility: 'hide' }, { slug: 'gpt-6-luna', visibility: 'list' }, { slug: 'gpt-6.1-sol', visibility: 'list' }]),
  });
  assert.deepEqual(line(run).options, ['gpt/gpt-6-luna', 'gpt/gpt-6.1-sol']);
});

test('cli lists each gemini model once, without its effort, and no other maker\'s model', async (t) => {
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => agy(dir, ['gemini-3.8-flash-high', 'gemini-3.8-flash-low', 'claude-sonnet-4-6', 'gemini-3.8-pro-medium']),
  });
  assert.deepEqual(line(run).options, ['gemini/gemini-3.8-flash', 'gemini/gemini-3.8-pro']);
});

test('cli lists claude as its bare family, and runs no listing for it', async (t) => {
  let stand: ReturnType<typeof claude> | undefined;
  const run = await instructions(t, 'review', 'review-build', { user: CLI, standIns: (dir) => { stand = claude(dir); } });
  assert.deepEqual(line(run).options, ['claude']);
  assert.deepEqual(stand!.calls(), []);
});

test('cli answers inside another harness', async (t) => {
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => codex(dir, [...LUNA]),
    env: { T3CODE_HOME: join(tempDir(t), '.t3') },
  });
  const { resolver, options } = line(run);
  assert.deepEqual({ resolver, options }, { resolver: 'cli', options: ['gpt/gpt-6-luna'] });
});

test('a model listing runs without the session markers, and with the rest of the environment', async (t) => {
  let stand: ReturnType<typeof codex> | undefined;
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => { stand = codex(dir, [...LUNA], { logEnv: ['CLAUDECODE', 'LETS_TEST_KEPT'] }); },
    env: { CLAUDECODE: '1', LETS_TEST_KEPT: 'kept' },
  });
  assert.equal(line(run).resolver, 'cli');
  assert.deepEqual(stand!.envs(), [{ CLAUDECODE: undefined, LETS_TEST_KEPT: 'kept' }]);
});

// What each failure's warning says, after it names codex.
const FAILURE_TEXT = {
  'signed-out': /exit 1: not logged in/,
  unreadable: /JSON/,
  'cannot-start': /cannot run codex: /,
} as const;

test('a codex listing that fails lists the bare gpt family, with one warning that names codex', async (t) => {
  for (const failure of ['signed-out', 'unreadable', 'cannot-start'] as const) {
    for (const [strategy, intent] of [['review', 'review-build'], ['step', 'build']]) {
      const what = `${failure}, ${strategy}`;
      const run = await instructions(t, strategy, intent, { user: CLI, standIns: (dir) => { codex(dir, failure); claude(dir); } });
      assert.deepEqual(line(run).options, ['gpt', 'claude'], what);
      const warnings = run.result.stderr.split('\n').filter((text) => text !== '');
      assert.equal(warnings.length, 1, `${what}: ${run.result.stderr}`);
      assert.match(warnings[0], /^lets delegate: .*codex/, what);
      assert.match(warnings[0], FAILURE_TEXT[failure], what);
      assert.ok(run.result.stderr.endsWith('\n'), what);
    }
  }
});

// Each listing has 20 seconds. One after the other, two hanging listings
// would take at least 40, so a run under 40 shows they ran at once, and a
// run of at least 19 shows lets waited out the limit rather than giving up
// at once. The
// run's own limit is above the 52 seconds two in a row could take with
// lets's 5-second kill grace, so a lets that ran them in turn fails the
// time check, not the run.
test('two listings that hang are both stopped at their limit, at the same time, and their families listed bare', async (t) => {
  let clis: { codex: ReturnType<typeof codex>; agy: ReturnType<typeof agy> } | undefined;
  const started = performance.now();
  const run = await instructions(t, 'review', 'review-build', {
    user: CLI,
    standIns: (dir) => { clis = { codex: codex(dir, 'hangs'), agy: agy(dir, 'hangs') }; },
    timeoutMs: 60_000,
  });
  const elapsed = performance.now() - started;
  assert.ok(elapsed >= 19_000 && elapsed < 40_000, `the run took ${elapsed} ms`);
  assert.deepEqual(line(run).options, ['gpt', 'gemini']);
  const warnings = run.result.stderr.split('\n').filter((text) => text !== '');
  assert.equal(warnings.length, 2, run.result.stderr);
  for (const warning of warnings) assert.match(warning, /^lets delegate: .*no answer in 20 s/);
  assert.equal(warnings.filter((text) => /\bcodex\b/.test(text)).length, 1, run.result.stderr);
  assert.equal(warnings.filter((text) => /\bagy\b/.test(text)).length, 1, run.result.stderr);
  assert.deepEqual(clis!.codex.calls(), [['debug', 'models']]);
  assert.deepEqual(clis!.agy.calls(), [['models']]);
});

// A lets config with body under delegate, indented for it. With no chain,
// subagent answers, which runs no program.
const delegate = (body: string) => `version: 4\ndelegate:\n${body.replace(/^(?=.)/gm, '  ')}`;
// The same, with cli first in the chain, so a test can see that no
// listing ran.
const cliDelegate = (body: string) => delegate(`resolvers: [cli]\n${body}`);

test('the guidance for the intent comes from the user\'s lets config', async (t) => {
  const run = await instructions(t, 'review', 'review-build', { user: delegate('review-build:\n  guidance: Use the strongest gpt model.\n') });
  assert.equal(line(run).guidance, 'Use the strongest gpt model.');
});

test('the plan reviewer\'s guidance comes from delegate.review-plan', async (t) => {
  const run = await instructions(t, 'review', 'review-plan', { user: delegate('review-plan:\n  guidance: Prefer gpt.\n') });
  assert.equal(line(run).guidance, 'Prefer gpt.');
});

test('guidance for another intent, or for another strategy, is null', async (t) => {
  const otherIntent = await instructions(t, 'review', 'review-plan', { user: delegate('review-build:\n  guidance: Use gpt.\n') });
  assert.equal(line(otherIntent).guidance, null);
  const otherStrategy = await instructions(t, 'review', 'review-build', { user: delegate('build:\n  guidance: Use gpt.\n') });
  assert.equal(line(otherStrategy).guidance, null);
});

test('the plan step\'s guidance does not reach the plan reviewer', async (t) => {
  const run = await instructions(t, 'review', 'review-plan', { user: delegate('plan:\n  guidance: Prefer claude.\n') });
  assert.equal(line(run).guidance, null);
});

test('a multi-line block keeps its lines', async (t) => {
  const run = await instructions(t, 'review', 'review-build', { user: delegate('review-build:\n  guidance: |\n    Prefer claude.\n    Never gemini.\n') });
  assert.equal(line(run).guidance, 'Prefer claude.\nNever gemini.\n');
});

test('a step\'s guidance comes from its own key, and the story intent\'s from delegate.story', async (t) => {
  const both = delegate('story:\n  guidance: Prefer claude.\nbuild:\n  guidance: Use gpt.\n');
  assert.equal(line(await instructions(t, 'step', 'build', { user: both })).guidance, 'Use gpt.');
  assert.equal(line(await instructions(t, 'step', 'story', { user: both })).guidance, 'Prefer claude.');
});

// Each key holds its own name as guidance, so the guidance shows which key was read.
test('each step reads the key the guidance table gives it, so a review step reads the plan or build key', async (t) => {
  const user = delegate(['shape', 'plan', 'review-plan', 'build', 'review-build', 'story'].map((key) => `${key}:\n  guidance: ${key}\n`).join(''));
  const expected: [string, string][] = [['shape', 'shape'], ['plan', 'plan'], ['review-plan', 'plan'], ['build', 'build'], ['review-build', 'build'], ['story', 'story']];
  for (const [intent, key] of expected) {
    const read = line(await instructions(t, 'step', intent, { user }));
    assert.deepEqual([read.for, read.guidance], [intent, key], intent);
  }
});

test('a step\'s guidance does not reach the story intent, nor the story\'s a step', async (t) => {
  assert.equal(line(await instructions(t, 'step', 'story', { user: delegate('build:\n  guidance: Use gpt.\n') })).guidance, null);
  assert.equal(line(await instructions(t, 'step', 'build', { user: delegate('story:\n  guidance: Prefer claude.\n') })).guidance, null);
});

test('review guidance does not reach a step', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: delegate('review-build:\n  guidance: Prefer claude.\n') });
  assert.equal(line(run).guidance, null);
});

test('the repository\'s guidance for one intent wins, and the user\'s guidance for another stays', async (t) => {
  const user = delegate('review-plan:\n  guidance: Prefer gpt.\nreview-build:\n  guidance: Prefer claude.\n');
  const repo = delegate('review-build:\n  guidance: Use gemini.\n');
  assert.equal(line(await instructions(t, 'review', 'review-build', { user, repo })).guidance, 'Use gemini.');
  assert.equal(line(await instructions(t, 'review', 'review-plan', { user, repo })).guidance, 'Prefer gpt.');
});

test('outside a Git repository, instructions read only the user\'s lets config', async (t) => {
  const run = await instructions(t, 'review', 'review-build', {
    user: delegate('review-build:\n  guidance: Prefer claude.\n'),
    repo: delegate('review-build:\n  guidance: Use gemini.\n'),
    notInRepo: true,
  });
  assert.equal(line(run).guidance, 'Prefer claude.');
});

test('bad guidance for the intent is exit 2, naming the file and the key, and runs no listing', async (t) => {
  const cases: { what: string; strategy?: string; intent?: string; setup: Setup; file: keyof Omit<Run, 'result'>; message: RegExp }[] = [
    { what: 'a number as guidance', setup: { user: cliDelegate('review-build:\n  guidance: 42\n') }, file: 'userConfig', message: /delegate\.review-build\.guidance must be a string/ },
    { what: 'a guidance entry that is not a mapping', setup: { user: cliDelegate('review-build: code\n') }, file: 'userConfig', message: /delegate\.review-build must be a mapping/ },
    { what: 'a number in the repository\'s config', setup: { user: cliDelegate(''), repo: delegate('review-build:\n  guidance: 42\n') }, file: 'repoConfig', message: /delegate\.review-build\.guidance must be a string/ },
    { what: 'a bad entry the review plan step reads', strategy: 'step', intent: 'review-plan', setup: { user: cliDelegate('plan:\n  guidance: 42\n') }, file: 'userConfig', message: /delegate\.plan\.guidance must be a string/ },
  ];
  for (const { what, strategy = 'review', intent = 'review-build', setup, file, message } of cases) {
    let stand: ReturnType<typeof codex> | undefined;
    const run = await instructions(t, strategy, intent, { ...setup, standIns: (dir) => { stand = codex(dir, [...LUNA]); } });
    assert.equal(run.result.code, 2, `${what}: ${run.result.output}`);
    assert.equal(run.result.stdout, '', what);
    assert.ok(run.result.stderr.includes(`${run[file]}: `), `${what}: ${run.result.stderr}`);
    assert.match(run.result.stderr, message, what);
    assert.deepEqual(stand!.calls(), [], `${what}: no listing ran`);
  }
});

test('a bad entry for another intent, or for another strategy, is not checked', async (t) => {
  const otherIntent = await instructions(t, 'review', 'review-build', { user: delegate('review-plan:\n  guidance: [a, b]\n') });
  assert.equal(line(otherIntent).guidance, null);
  const otherStrategy = await instructions(t, 'review', 'review-build', { user: delegate('build: 42\n') });
  assert.equal(line(otherStrategy).guidance, null);
});

// A run rejected for a bad lets config: exit 2, nothing on stdout, and one
// stderr line that starts with file and holds each of named.
function refused({ result }: Run, file: string, ...named: string[]) {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^[^\n]*\n$/, `stderr is exactly one line: ${result.stderr}`);
  const start = `lets delegate: ${file}: `;
  assert.ok(result.stderr.startsWith(start), result.stderr);
  // Only after the file, so a short text such as 7 cannot match the random temporary path.
  const message = result.stderr.slice(start.length);
  for (const text of named) assert.ok(message.includes(text), `${text} in ${result.stderr}`);
}

// subagent's answer to review instructions for code, when nothing else answers.
const SUBAGENT_REVIEW = { strategy: 'review', for: 'review-build', resolver: 'subagent', options: [], guidance: null };

describe('the delegate section of the lets config', () => {
  // The one chain asked here that lists t3. An empty T3CODE_HOME holds no
  // running server, so t3 declines, whatever the developer runs.
  test('t3, cli and subagent are each a valid entry of the chain', async (t) => {
    const run = await instructions(t, 'review', 'review-build', {
      user: 'version: 4\ndelegate:\n  resolvers:\n    - t3\n    - cli\n    - subagent\n',
      env: { T3CODE_HOME: tempDir(t) },
    });
    assert.deepEqual(line(run), SUBAGENT_REVIEW);
  });

  // Every family CLI is on PATH, so a chain that held cli would answer from cli.
  test('a config with no delegate, a null or empty one, or no resolvers, has no chain, so subagent answers', async (t) => {
    for (const user of ['version: 4\n', 'version: 4\ndelegate:\n', 'version: 4\ndelegate: null\n', 'version: 4\ndelegate: {}\n', 'version: 4\ndelegate:\n  resolvers:\n']) {
      let clis: ReturnType<typeof everyCli> | undefined;
      const run = await instructions(t, 'review', 'review-build', { user, standIns: (dir) => { clis = everyCli(dir); } });
      assert.deepEqual(line(run), SUBAGENT_REVIEW, user);
      for (const [name, stand] of Object.entries(clis!)) assert.deepEqual(stand.calls(), [], `${name} for ${user}`);
    }
  });

  test('an entry that is not t3, cli or subagent exits 2, naming the file, the entry and the three names', async (t) => {
    for (const entry of ['codex', 'T3', '7', '/opt/r/old-resolver']) {
      const run = await instructions(t, 'review', 'review-build', { user: `version: 4\ndelegate:\n  resolvers:\n    - t3\n    - ${entry}\n` });
      refused(run, run.userConfig, 'delegate.resolvers[1]', entry, 't3, cli or subagent');
    }
  });

  test('a lets config that is not valid exits 2, naming the user\'s file and the bad value', async (t) => {
    const cases: [string, string][] = [
      ['version: 4\ndelegate: { resolvers: [unclosed\n', 'is not YAML'],
      ['- just\n- a list\n', 'must be a mapping with version'],
      ['version: 2\nresolvers: []\n', 'version must be 4, got 2'],
      ['version: 2\ndelegate: [t3]\n', 'version must be 4, got 2'],
      ['version: "4"\n', 'version must be 4, got "4"'],
      ['delegate: { resolvers: [] }\n', 'version must be 4'],
      ['version: 4\ndelegate: [t3]\n', 'delegate must be a mapping, got ["t3"]'],
      ['version: 4\ndelegate: t3\n', 'delegate must be a mapping, got "t3"'],
      ['version: 4\ndelegate: { resolvers: t3 }\n', 'delegate.resolvers must be a list, got "t3"'],
      ['version: 4\ndelegate:\n  resolvers:\n    - bin/old-resolver\n', '"bin/old-resolver"'],
      ['version: 4\ndelegate:\n  resolvers:\n    - ~/bin/old-resolver\n', '"~/bin/old-resolver"'],
      ['version: 4\ndelegate:\n  resolvers:\n    - 7\n', 'delegate.resolvers[0] must be t3, cli or subagent, got 7'],
    ];
    for (const [user, named] of cases) {
      const run = await instructions(t, 'review', 'review-build', { user });
      refused(run, run.userConfig, named);
    }
  });

  test('a key lets does not know, at the top level and under delegate, is ignored', async (t) => {
    const run = await instructions(t, 'review', 'review-build', { user: 'version: 4\nsync: true\ndelegate:\n  resolvers: [subagent]\n  telemetry: true\n' });
    assert.deepEqual(line(run), SUBAGENT_REVIEW);
  });

  test('a go.questions the delegate commands do not read is ignored, even one lets go would reject', async (t) => {
    const run = await instructions(t, 'review', 'review-build', { user: 'version: 4\ndelegate:\n  resolvers: [subagent]\ngo:\n  questions: loud\n' });
    assert.deepEqual(line(run), SUBAGENT_REVIEW);
  });

  test('a step ignores a bad reviewer entry', async (t) => {
    const run = await instructions(t, 'step', 'build', {
      user: 'version: 4\ndelegate:\n  resolvers: [subagent]\n  review-build:\n    guidance: 42\n',
    });
    assert.deepEqual(line(run), { strategy: 'step', for: 'build', resolver: 'subagent', options: [], guidance: null });
  });

  test('a handoff entry from an earlier lets is not checked, and draws no message', async (t) => {
    const run = await instructions(t, 'step', 'build', { user: 'version: 4\ndelegate:\n  resolvers: [subagent]\n  handoff: 42\n' });
    assert.deepEqual(line(run), { strategy: 'step', for: 'build', resolver: 'subagent', options: [], guidance: null });
    assert.doesNotMatch(run.result.stderr, /handoff/);
  });

  test('the guidance is null when a level is missing', async (t) => {
    for (const body of ['review-build:\n', 'review-build:\n  other: x\n', 'review-build: {}\n', 'handoff:\n  apply:\n    guidance: x\n']) {
      assert.equal(line(await instructions(t, 'review', 'review-build', { user: delegate(body) })).guidance, null, body);
    }
  });

  test('a guidance entry that is not a mapping exits 2, naming the user\'s file and the dotted key, and runs no listing', async (t) => {
    const cases: [string, string][] = [
      ['review-build: [a]\n', 'delegate.review-build must be a mapping, got ["a"]'],
      ['review-build: text\n', 'delegate.review-build must be a mapping, got "text"'],
    ];
    for (const [body, named] of cases) {
      let stand: ReturnType<typeof codex> | undefined;
      const run = await instructions(t, 'review', 'review-build', { user: cliDelegate(body), standIns: (dir) => { stand = codex(dir, [...LUNA]); } });
      refused(run, run.userConfig, named);
      assert.deepEqual(stand!.calls(), [], `${body}: no listing ran`);
    }
  });

  test('a repository\'s list over the user\'s guidance replaces it whole, and exits 2 naming the repository\'s file', async (t) => {
    const run = await instructions(t, 'review', 'review-build', {
      user: delegate('review-build:\n  guidance: Prefer claude.\n'),
      repo: delegate('review-build: [a]\n'),
    });
    refused(run, run.repoConfig, 'delegate.review-build must be a mapping, got ["a"]');
  });

  test('the user\'s chain stays under a repository\'s null resolvers, and its decline names the user\'s file', async (t) => {
    const run = await instructions(t, 'review', 'review-build', {
      user: CLI,
      repo: delegate('resolvers: null\nreview-build:\n  guidance: Use gemini.\n'),
    });
    declined(run, run.userConfig);
    assert.ok(!run.result.stderr.includes(run.repoConfig), run.result.stderr);
  });
});
