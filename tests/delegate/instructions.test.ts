// lets delegate <strategy> instructions, run as a program. The cli and
// subagent resolvers are chosen by a real lets config, and PATH holds only
// the stand-in codex, claude and agy a test writes, and git, so no real
// CLI on the developer's machine changes a result.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, type TestContext, test } from 'node:test';
import { agy, claude, codex, type EnvChanges, git, type LetsResult, runLets, tempDir } from '../support/lets.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
const CLI_THEN_SUBAGENT = 'version: 3\ndelegate: { resolvers: [cli, subagent] }\n';
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
  const run = await instructions(t, 'review', 'code', { user: CLI, standIns: (dir) => claude(dir) });
  assert.deepEqual(line(run), { strategy: 'review', for: 'code', resolver: 'cli', options: ['claude'], guidance: null });
  assert.equal(run.result.stderr, '');
});

test('step instructions from cli print the step strategy and the models codex lists', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: CLI, standIns: (dir) => codex(dir, [...LUNA]) });
  assert.deepEqual(line(run), { strategy: 'step', for: 'build', resolver: 'cli', options: ['gpt/gpt-6-luna'], guidance: null });
});

test('with no family CLI on PATH, cli declines and subagent answers next', async (t) => {
  for (const [strategy, intent] of [['review', 'code'], ['step', 'build']]) {
    const run = await instructions(t, strategy, intent, { user: CLI_THEN_SUBAGENT });
    assert.deepEqual(line(run), { strategy, for: intent, resolver: 'subagent', options: [], guidance: null }, strategy);
  }
});

test('when subagent comes first, it answers, and cli is never asked', async (t) => {
  let stand: ReturnType<typeof codex> | undefined;
  const run = await instructions(t, 'review', 'code', {
    user: 'version: 3\ndelegate: { resolvers: [subagent, cli] }\n',
    standIns: (dir) => { stand = codex(dir, [...LUNA]); },
  });
  assert.equal(line(run).resolver, 'subagent');
  assert.deepEqual(stand!.calls(), [], 'codex was not called');
});

test('subagent lists no models and runs no program, even with every family CLI on PATH', async (t) => {
  let clis: ReturnType<typeof everyCli> | undefined;
  const run = await instructions(t, 'review', 'code', {
    user: 'version: 3\ndelegate: { resolvers: [subagent] }\n',
    standIns: (dir) => { clis = everyCli(dir); },
  });
  assert.deepEqual(line(run), { strategy: 'review', for: 'code', resolver: 'subagent', options: [], guidance: null });
  for (const [name, stand] of Object.entries(clis!)) assert.deepEqual(stand.calls(), [], name);
});

test('instructions run only the model listings, and start no session', async (t) => {
  for (const [strategy, intent] of [['review', 'code'], ['review', 'plan'], ['step', 'build']]) {
    let clis: ReturnType<typeof everyCli> | undefined;
    const run = await instructions(t, strategy, intent, { user: CLI, standIns: (dir) => { clis = everyCli(dir); } });
    assert.equal(line(run).resolver, 'cli', `${strategy} ${intent}`);
    assert.deepEqual(clis!.codex.calls(), [['debug', 'models']], `${strategy} ${intent}`);
    assert.deepEqual(clis!.agy.calls(), [['models']], `${strategy} ${intent}`);
    assert.deepEqual(clis!.claude.calls(), [], `${strategy} ${intent}`);
  }
});

test('when every resolver in the user\'s lets config declines, it is exit 2, naming that file', async (t) => {
  const run = await instructions(t, 'review', 'code', { user: CLI });
  declined(run, run.userConfig);
});

test('when every resolver in the repository\'s lets config declines, it is exit 2, naming that file', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: CLI_THEN_SUBAGENT, repo: CLI });
  declined(run, run.repoConfig);
});

test('an empty chain declines every delegation, and is exit 2, naming the config file', async (t) => {
  const run = await instructions(t, 'review', 'code', { user: 'version: 3\ndelegate: { resolvers: [] }\n', standIns: everyCli });
  declined(run, run.userConfig);
});

test('cli lists the families in the order gpt, claude, gemini', async (t) => {
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => { agy(dir, ['gemini-3.8-flash-high']); claude(dir); codex(dir, [...LUNA]); },
  });
  assert.deepEqual(line(run).options, ['gpt/gpt-6-luna', 'claude', 'gemini/gemini-3.8-flash']);
});

test('cli lists only the codex slugs whose visibility is list, in codex\'s order', async (t) => {
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => codex(dir, [{ slug: 'gpt-reserve', visibility: 'hide' }, { slug: 'gpt-6-luna', visibility: 'list' }, { slug: 'gpt-6.1-sol', visibility: 'list' }]),
  });
  assert.deepEqual(line(run).options, ['gpt/gpt-6-luna', 'gpt/gpt-6.1-sol']);
});

test('cli lists each gemini model once, without its effort, and no other maker\'s model', async (t) => {
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => agy(dir, ['gemini-3.8-flash-high', 'gemini-3.8-flash-low', 'claude-sonnet-4-6', 'gemini-3.8-pro-medium']),
  });
  assert.deepEqual(line(run).options, ['gemini/gemini-3.8-flash', 'gemini/gemini-3.8-pro']);
});

test('cli lists claude as its bare family, and runs no listing for it', async (t) => {
  let stand: ReturnType<typeof claude> | undefined;
  const run = await instructions(t, 'review', 'code', { user: CLI, standIns: (dir) => { stand = claude(dir); } });
  assert.deepEqual(line(run).options, ['claude']);
  assert.deepEqual(stand!.calls(), []);
});

test('cli answers inside another harness', async (t) => {
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => codex(dir, [...LUNA]),
    env: { T3CODE_HOME: join(tempDir(t), '.t3') },
  });
  const { resolver, options } = line(run);
  assert.deepEqual({ resolver, options }, { resolver: 'cli', options: ['gpt/gpt-6-luna'] });
});

test('a model listing runs without the session markers, and with the rest of the environment', async (t) => {
  let stand: ReturnType<typeof codex> | undefined;
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => { stand = codex(dir, [...LUNA], { logEnv: ['CLAUDECODE', 'LETS_TEST_KEPT'] }); },
    env: { CLAUDECODE: '1', LETS_TEST_KEPT: 'kept' },
  });
  assert.equal(line(run).resolver, 'cli');
  assert.deepEqual(stand!.envs(), [{ CLAUDECODE: undefined, LETS_TEST_KEPT: 'kept' }]);
});

test('a codex listing that fails lists the bare gpt family, with one warning that names codex', async (t) => {
  for (const failure of ['signed-out', 'unreadable', 'cannot-start'] as const) {
    for (const [strategy, intent] of [['review', 'code'], ['step', 'build']]) {
      const what = `${failure}, ${strategy}`;
      const run = await instructions(t, strategy, intent, { user: CLI, standIns: (dir) => { codex(dir, failure); claude(dir); } });
      assert.deepEqual(line(run).options, ['gpt', 'claude'], what);
      const warnings = run.result.stderr.split('\n').filter((text) => text !== '');
      assert.equal(warnings.length, 1, `${what}: ${run.result.stderr}`);
      assert.match(warnings[0], /^lets delegate: .*codex/, what);
      assert.ok(run.result.stderr.endsWith('\n'), what);
    }
  }
});

// Each listing has 20 seconds. One after the other, two hanging listings
// would take at least 40, so a run under 40 shows they ran at once. The
// run's own limit is above the 52 seconds two in a row could take with
// lets's 5-second kill grace, so a lets that ran them in turn fails the
// time check, not the run.
test('two listings that hang are both stopped at their limit, at the same time, and their families listed bare', async (t) => {
  let clis: { codex: ReturnType<typeof codex>; agy: ReturnType<typeof agy> } | undefined;
  const started = Date.now();
  const run = await instructions(t, 'review', 'code', {
    user: CLI,
    standIns: (dir) => { clis = { codex: codex(dir, 'hangs'), agy: agy(dir, 'hangs') }; },
    timeoutMs: 60_000,
  });
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 40_000, `the run took ${elapsed} ms`);
  assert.deepEqual(line(run).options, ['gpt', 'gemini']);
  const warnings = run.result.stderr.split('\n').filter((text) => text !== '');
  assert.equal(warnings.length, 2, run.result.stderr);
  for (const warning of warnings) assert.match(warning, /^lets delegate: /);
  assert.equal(warnings.filter((text) => /\bcodex\b/.test(text)).length, 1, run.result.stderr);
  assert.equal(warnings.filter((text) => /\bagy\b/.test(text)).length, 1, run.result.stderr);
  assert.deepEqual(clis!.codex.calls(), [['debug', 'models']]);
  assert.deepEqual(clis!.agy.calls(), [['models']]);
});

// A lets config with body under delegate, indented for it. With no chain,
// subagent answers, which runs no program.
const delegate = (body: string) => `version: 3\ndelegate:\n${body.replace(/^(?=.)/gm, '  ')}`;
// The same, with cli first in the chain, so a test can see that no
// listing ran.
const cliDelegate = (body: string) => delegate(`resolvers: [cli]\n${body}`);

test('the guidance for the intent comes from the user\'s lets config', async (t) => {
  const run = await instructions(t, 'review', 'code', { user: delegate('review:\n  code:\n    guidance: Use the strongest gpt model.\n') });
  assert.equal(line(run).guidance, 'Use the strongest gpt model.');
});

test('guidance for another intent, or for another strategy, is null', async (t) => {
  const otherIntent = await instructions(t, 'review', 'plan', { user: delegate('review:\n  code:\n    guidance: Use gpt.\n') });
  assert.equal(line(otherIntent).guidance, null);
  const otherStrategy = await instructions(t, 'review', 'code', { user: delegate('step:\n  build:\n    guidance: Use gpt.\n') });
  assert.equal(line(otherStrategy).guidance, null);
});

test('a multi-line block keeps its lines', async (t) => {
  const run = await instructions(t, 'review', 'code', { user: delegate('review:\n  code:\n    guidance: |\n      Prefer claude.\n      Never gemini.\n') });
  assert.equal(line(run).guidance, 'Prefer claude.\nNever gemini.\n');
});

test('a step\'s guidance comes from delegate.step, and the story intent\'s from delegate.step.story', async (t) => {
  const both = delegate('step:\n  story:\n    guidance: Prefer claude.\n  build:\n    guidance: Use gpt.\n');
  assert.equal(line(await instructions(t, 'step', 'build', { user: both })).guidance, 'Use gpt.');
  assert.equal(line(await instructions(t, 'step', 'story', { user: both })).guidance, 'Prefer claude.');
});

test('a step\'s guidance does not reach the story intent, nor the story\'s a step', async (t) => {
  assert.equal(line(await instructions(t, 'step', 'story', { user: delegate('step:\n  build:\n    guidance: Use gpt.\n') })).guidance, null);
  assert.equal(line(await instructions(t, 'step', 'build', { user: delegate('step:\n  story:\n    guidance: Prefer claude.\n') })).guidance, null);
});

test('review guidance does not reach a step', async (t) => {
  const run = await instructions(t, 'step', 'build', { user: delegate('review:\n  code:\n    guidance: Prefer claude.\n') });
  assert.equal(line(run).guidance, null);
});

test('the repository\'s guidance for one intent wins, and the user\'s guidance for another stays', async (t) => {
  const user = delegate('review:\n  plan:\n    guidance: Prefer gpt.\n  code:\n    guidance: Prefer claude.\n');
  const repo = delegate('review:\n  code:\n    guidance: Use gemini.\n');
  assert.equal(line(await instructions(t, 'review', 'code', { user, repo })).guidance, 'Use gemini.');
  assert.equal(line(await instructions(t, 'review', 'plan', { user, repo })).guidance, 'Prefer gpt.');
});

test('outside a Git repository, instructions read only the user\'s lets config', async (t) => {
  const run = await instructions(t, 'review', 'code', {
    user: delegate('review:\n  code:\n    guidance: Prefer claude.\n'),
    repo: delegate('review:\n  code:\n    guidance: Use gemini.\n'),
    notInRepo: true,
  });
  assert.equal(line(run).guidance, 'Prefer claude.');
});

test('bad guidance for the intent is exit 2, naming the file and the key, and runs no listing', async (t) => {
  const cases: { what: string; setup: Setup; file: keyof Omit<Run, 'result'>; message: RegExp }[] = [
    { what: 'a number as guidance', setup: { user: cliDelegate('review:\n  code:\n    guidance: 42\n') }, file: 'userConfig', message: /delegate\.review\.code\.guidance must be a string/ },
    { what: 'a strategy entry that is not a mapping', setup: { user: cliDelegate('review: code\n') }, file: 'userConfig', message: /delegate\.review must be a mapping/ },
    { what: 'a number in the repository\'s config', setup: { user: cliDelegate(''), repo: delegate('review:\n  code:\n    guidance: 42\n') }, file: 'repoConfig', message: /delegate\.review\.code\.guidance must be a string/ },
  ];
  for (const { what, setup, file, message } of cases) {
    let stand: ReturnType<typeof codex> | undefined;
    const run = await instructions(t, 'review', 'code', { ...setup, standIns: (dir) => { stand = codex(dir, [...LUNA]); } });
    assert.equal(run.result.code, 2, `${what}: ${run.result.output}`);
    assert.equal(run.result.stdout, '', what);
    assert.ok(run.result.stderr.includes(`${run[file]}: `), `${what}: ${run.result.stderr}`);
    assert.match(run.result.stderr, message, what);
    assert.deepEqual(stand!.calls(), [], `${what}: no listing ran`);
  }
});

test('a bad entry for another intent, or for another strategy, is not checked', async (t) => {
  const otherIntent = await instructions(t, 'review', 'code', { user: delegate('review:\n  plan:\n    guidance: [a, b]\n') });
  assert.equal(line(otherIntent).guidance, null);
  const otherStrategy = await instructions(t, 'review', 'code', { user: delegate('step: 42\n') });
  assert.equal(line(otherStrategy).guidance, null);
});

// #306 retires handoff. Whichever of it and this file's story merges
// second deletes this block.
describe('handoff instructions', () => {
  test('cli answers a review, but declines a handoff without running a CLI, and subagent answers it', async (t) => {
    const review = await instructions(t, 'review', 'code', { user: CLI_THEN_SUBAGENT, standIns: everyCli });
    assert.equal(line(review).resolver, 'cli');
    let clis: ReturnType<typeof everyCli> | undefined;
    const handoff = await instructions(t, 'handoff', 'apply', { user: CLI_THEN_SUBAGENT, standIns: (dir) => { clis = everyCli(dir); } });
    assert.deepEqual(line(handoff), { strategy: 'handoff', for: 'apply', resolver: 'subagent', options: [], guidance: null });
    for (const [name, stand] of Object.entries(clis!)) assert.deepEqual(stand.calls(), [], name);
  });

  test('the guidance for a handoff comes from delegate.handoff', async (t) => {
    const run = await instructions(t, 'handoff', 'apply', { user: delegate('handoff:\n  apply:\n    guidance: Prefer claude.\n') });
    assert.equal(line(run).guidance, 'Prefer claude.');
  });
});
