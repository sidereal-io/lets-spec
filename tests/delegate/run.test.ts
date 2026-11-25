// lets delegate review run and handoff run, run as a program in a real Git
// repository. The cli and subagent resolvers are chosen by a real lets
// config, and PATH holds only the stand-in codex, claude and agy a test
// writes, and git, so no real CLI on the developer's machine changes a
// result. Each test gives a stand-in the exact command it expects, so the
// command lets gives each CLI is checked too.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, test } from 'node:test';
import { agy, claude, codex, type LetsResult, snapshot, unstartable } from '../support/lets.ts';
import { delegateRepo, PROMPT } from './repo.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
const CLI_THEN_SUBAGENT = 'version: 3\ndelegate: { resolvers: [cli, subagent] }\n';
const FINDINGS = 'FINDINGS\n';
// The session name lets makes of the review's --name.
const SESSION = 'x-plan-review';

interface Review {
  for?: 'code' | 'plan';
  name?: string;
  promptFile?: string;
  sourceFamily?: string;
  effort?: 'low' | 'medium' | 'high';
  models?: readonly string[];
  timeoutMinutes?: number;
}

// The arguments of lets delegate review run: a code review named
// X Plan Review of claude's work, at high effort, on gpt/gpt-6-luna,
// unless over says otherwise.
function review(over: Review = {}): string[] {
  const { for: intent = 'code', name = 'X Plan Review', promptFile = 'p.md', sourceFamily = 'claude', effort = 'high', models = ['gpt/gpt-6-luna'], timeoutMinutes } = over;
  return ['delegate', 'review', 'run', '--for', intent, '--name', name, '--prompt-file', promptFile, '--source-family', sourceFamily, '--effort', effort,
    ...models.flatMap((model) => ['--model', model]), ...(timeoutMinutes === undefined ? [] : ['--timeout-minutes', String(timeoutMinutes)])];
}

// Where codex writes the last message of the session named name, in cwd.
const lastMessage = (cwd: string, name = SESSION) => join(cwd, '.workspace', 'lets-delegate', `${name}.last-message.md`);

// The arguments lets gives codex for a review: read-only, at effort, on
// model, with the last message in the scratch folder.
const codexExec = (cwd: string, { effort = 'high', model = 'gpt-6-luna' as string | null, name = SESSION } = {}) =>
  ['exec', '-s', 'read-only', '-c', `model_reasoning_effort="${effort}"`, ...(model === null ? [] : ['-m', model]), '-o', lastMessage(cwd, name), '-'];

// A codex row that writes message as its last message, and the files given.
const codexAnswers = (cwd: string, message = FINDINGS, files: Record<string, string> = {}, over: Parameters<typeof codexExec>[1] = {}) =>
  ({ args: codexExec(cwd, over), files: { [lastMessage(cwd, over.name)]: message, ...files } });

// The arguments lets gives claude and agy for a review.
const claudeP = (effort = 'high', model?: string) => ['-p', '--permission-mode', 'plan', '--effort', effort, ...(model === undefined ? [] : ['--model', model])];
const agyP = (effort: string, timeout: string, model?: string) =>
  ['--mode', 'plan', '--effort', effort, ...(model === undefined ? [] : ['--model', model]), '--print-timeout', timeout, '-p', PROMPT];

const KEYS = ['for', 'resolver', 'family', 'model', 'independent', 'handle', 'checkout', 'commit', 'gitClean', 'durationSeconds'];

// The metadata line of a review that exited 0: the last line of stderr.
function metadata(result: LetsResult): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  const lines = result.stderr.split('\n').filter((line) => line !== '');
  return JSON.parse(lines.at(-1)!);
}

// A run that failed with code: nothing on stdout, and stderr that starts
// with lets's prefix.
function failed(result: LetsResult, code: number) {
  assert.equal(result.code, code, result.output);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /^lets delegate: /);
}

// Every family CLI on PATH, each answering only its model listing.
const everyCli = (dir: string) => ({ codex: codex(dir), claude: claude(dir), agy: agy(dir) });

describe('review run', () => {
  test('a codex review prints the last message, then one metadata line with its 10 keys in order', async (t) => {
    // reviewers: is the old config's, and the run request never carries it.
    const repo = delegateRepo(t, { user: `${CLI}reviewers:\n  - family: gpt\n    model: gpt-6-luna\n` });
    // The default listing is empty: lets runs a model codex never listed.
    const stand = codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    const result = await repo.run(review());
    const meta = metadata(result);
    assert.equal(result.stdout, FINDINGS);
    assert.deepEqual(Object.keys(meta), KEYS);
    const { durationSeconds, ...rest } = meta;
    assert.deepEqual(rest, {
      for: 'code', resolver: 'cli', family: 'gpt', model: 'gpt-6-luna', independent: true,
      handle: { kind: 'process', id: SESSION }, checkout: repo.cwd, commit: repo.head, gitClean: true,
    });
    assert.equal(typeof durationSeconds, 'number');
    assert.equal(result.stderr.split('\n').filter((line) => line !== '').length, 1, result.stderr);
    // The stand-in makes no folder, so lets made the scratch folder first.
    // lets lists no models for a run.
    assert.deepEqual(stand.calls(), [codexExec(repo.cwd)]);
    assert.deepEqual(stand.inputs(), [PROMPT]);
    assert.deepEqual(stand.cwds(), [repo.cwd]);
  });

  test('a plan review\'s metadata line says for: plan', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    assert.equal(metadata(await repo.run(review({ for: 'plan' }))).for, 'plan');
  });

  test('a session that commits gives the commit it made, not the one before it', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeP(), commit: 'a session commit', stdout: FINDINGS }] });
    const { commit } = metadata(await repo.run(review({ models: ['claude'] })));
    assert.notEqual(commit, repo.head);
    assert.match(String(commit), /^[0-9a-f]{40}$/);
  });

  test('a repository with no commit gives a null commit, and the review still succeeds', async (t) => {
    const repo = delegateRepo(t, { user: CLI, noCommit: true });
    claude(repo.standIns, { rows: [{ args: claudeP(), stdout: FINDINGS }] });
    const result = await repo.run(review({ models: ['claude'] }));
    assert.equal(metadata(result).commit, null);
    assert.equal(result.stdout, FINDINGS);
  });

  test('claude runs -p in plan mode in the repository, with the prompt on stdin and no session markers', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = claude(repo.standIns, { logEnv: ['CLAUDECODE'], rows: [{ args: claudeP('low', 'claude-fable-5-1'), stdout: FINDINGS }] });
    const result = await repo.run(review({ effort: 'low', models: ['claude/claude-fable-5-1'], sourceFamily: 'gpt' }), { env: { CLAUDECODE: '1' } });
    const { family, model, independent } = metadata(result);
    assert.deepEqual({ family, model, independent }, { family: 'claude', model: 'claude-fable-5-1', independent: true });
    assert.equal(result.stdout, FINDINGS);
    assert.deepEqual(stand.calls(), [claudeP('low', 'claude-fable-5-1')]);
    assert.deepEqual(stand.inputs(), [PROMPT]);
    assert.deepEqual(stand.cwds(), [repo.cwd]);
    assert.deepEqual(stand.envs(), [{ CLAUDECODE: undefined }]);
  });

  test('a bare family runs its CLI with no model, and a family equal to the source is not independent', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = claude(repo.standIns, { rows: [{ args: claudeP(), stdout: FINDINGS }] });
    const { model, independent } = metadata(await repo.run(review({ models: ['claude'], sourceFamily: 'claude' })));
    assert.deepEqual({ model, independent }, { model: 'claude', independent: false });
    assert.deepEqual(stand.calls(), [claudeP()]);
  });

  test('agy runs in plan mode, with the prompt as the argument of -p and the effort on the model', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const rows = [
      { args: agyP('high', '7m', 'gemini-3.8-flash-high'), stdout: FINDINGS },
      { args: agyP('medium', '30m', 'gemini-3.8-flash-medium'), stdout: FINDINGS },
      { args: agyP('high', '45m'), stdout: FINDINGS },
    ];
    const stand = agy(repo.standIns, [], { rows });
    // --print-timeout is the one given, else the default by effort.
    for (const [over, model] of [
      [{ models: ['gemini/gemini-3.8-flash'], timeoutMinutes: 7 }, 'gemini-3.8-flash'],
      [{ models: ['gemini/gemini-3.8-flash'], effort: 'medium' }, 'gemini-3.8-flash'],
      [{ models: ['gemini'] }, 'gemini'],
    ] as const) {
      const result = await repo.run(review(over));
      assert.equal(metadata(result).model, model, JSON.stringify(over));
      assert.equal(result.stdout, FINDINGS);
    }
    assert.deepEqual(stand.calls(), rows.map(({ args }) => args));
    assert.deepEqual(stand.inputs(), ['', '', '']);
    assert.deepEqual(stand.cwds(), [repo.cwd, repo.cwd, repo.cwd]);
  });

  test('the first model that answers is the only one asked', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = { codex: codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] }), claude: claude(repo.standIns) };
    assert.equal(metadata(await repo.run(review({ models: ['gpt/gpt-6-luna', 'claude'] }))).family, 'gpt');
    assert.deepEqual(clis.codex.calls(), [codexExec(repo.cwd)]);
    assert.deepEqual(clis.claude.calls(), []);
  });

  test('when every resolver in the chain declines, a review is exit 2, naming the config, with nothing on stdout', async (t) => {
    // No CLI on PATH, so cli declines.
    const repo = delegateRepo(t, { user: CLI });
    const result = await repo.run(review());
    failed(result, 2);
    assert.match(result.stderr, /every resolver declined/);
    assert.ok(result.stderr.includes(repo.userConfig), result.stderr);
  });

  test('when cli declines, subagent answers next, and a cli that answers comes before subagent', async (t) => {
    const declines = delegateRepo(t, { user: CLI_THEN_SUBAGENT });
    const result = await declines.run(review());
    failed(result, 3);
    assert.match(result.stderr, /no resolver started a session.*subagent/);
    const answers = delegateRepo(t, { user: CLI_THEN_SUBAGENT });
    codex(answers.standIns, [], { rows: [codexAnswers(answers.cwd)] });
    assert.equal(metadata(await answers.run(review())).resolver, 'cli');
  });

  test('with no lets config, subagent is the only resolver asked: exit 3, and nothing on stdout', async (t) => {
    const repo = delegateRepo(t);
    const clis = everyCli(repo.standIns);
    const result = await repo.run(review());
    failed(result, 3);
    assert.match(result.stderr, /no resolver started a session/);
    assert.match(result.stderr, /subagent/);
    assert.doesNotMatch(result.stderr, /installed/);
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });

  test('subagent runs no program but git, even with every family CLI on PATH', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate: { resolvers: [subagent] }\n' });
    const clis = everyCli(repo.standIns);
    failed(await repo.run(review()), 3);
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });

  test('a review ignores the guidance, even one that is not a string', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate:\n  resolvers: [cli]\n  review:\n    code:\n      guidance: 42\n' });
    const stand = codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    const result = await repo.run(review());
    assert.equal(metadata(result).resolver, 'cli');
    assert.equal(result.stdout, FINDINGS);
    assert.deepEqual(stand.inputs(), [PROMPT]);
  });

  test('a bad --model is exit 2, naming it, and no CLI runs', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = everyCli(repo.standIns);
    const result = await repo.run(review({ models: ['gpt', 'llama/llama-4'] }));
    // lets's option parser rejects it, before review run starts.
    assert.equal(result.code, 2, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /--model .*llama\/llama-4/);
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });

  test('a resolver lets does not know is exit 2, naming the file, the entry and the three names', async (t) => {
    for (const entry of ['/opt/r/old-resolver', 'bin/old-resolver']) {
      const repo = delegateRepo(t, { user: `version: 3\ndelegate:\n  resolvers:\n    - ${entry}\n` });
      const clis = everyCli(repo.standIns);
      const result = await repo.run(review());
      failed(result, 2);
      for (const named of [repo.userConfig, entry, 't3', 'cli', 'subagent']) assert.ok(result.stderr.includes(named), `${entry}: ${named}`);
      for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], `${entry}: ${name}`);
    }
  });

  test('a prompt file that cannot be read is exit 2, naming it, and no CLI runs', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = everyCli(repo.standIns);
    const result = await repo.run(review({ promptFile: 'gone.md' }));
    failed(result, 2);
    assert.match(result.stderr, /gone\.md/);
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });

  test('a review outside a Git repository is exit 2, naming the folder', async (t) => {
    const repo = delegateRepo(t, { user: CLI, notInRepo: true });
    const clis = everyCli(repo.standIns);
    const result = await repo.run(review());
    failed(result, 2);
    assert.ok(result.stderr.includes(`${repo.cwd} is not inside a git repo`), result.stderr);
    for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
  });

  test('the repository\'s chain replaces the user\'s whole', async (t) => {
    // Merged, the user's subagent would answer with exit 3.
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate: { resolvers: [subagent] }\n', repo: CLI });
    const result = await repo.run(review());
    failed(result, 2);
    assert.match(result.stderr, /every resolver declined/);
    assert.ok(result.stderr.includes(repo.repoConfig), result.stderr);
  });

  test('a null chain in the repository\'s lets config keeps the user\'s chain', async (t) => {
    const repo = delegateRepo(t, { user: CLI, repo: 'version: 3\ndelegate: { resolvers: null }\n' });
    codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    assert.equal(metadata(await repo.run(review())).resolver, 'cli');
  });

  test('a bad user\'s chain that the repository replaces does not stop a review', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate: { resolvers: [codex] }\n', repo: CLI });
    codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    assert.equal(metadata(await repo.run(review())).resolver, 'cli');
  });

  test('a bad resolver in the repository\'s lets config is exit 2, naming that file and not the user\'s', async (t) => {
    const repo = delegateRepo(t, { user: CLI, repo: 'version: 3\ndelegate: { resolvers: [codex] }\n' });
    const result = await repo.run(review());
    failed(result, 2);
    assert.ok(result.stderr.includes(repo.repoConfig), result.stderr);
    assert.match(result.stderr, /codex/);
    assert.ok(!result.stderr.includes(repo.userConfig), result.stderr);
  });

  test('a repository\'s lets config with the old version is exit 2, naming it', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\n', repo: 'version: 2\n' });
    const result = await repo.run(review());
    failed(result, 2);
    assert.ok(result.stderr.includes(`${repo.repoConfig}: `), result.stderr);
    assert.match(result.stderr, /version must be 3/);
  });

  test('a repository\'s lets config that is a folder is exit 2, naming it', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    mkdirSync(repo.repoConfig, { recursive: true });
    const result = await repo.run(review());
    failed(result, 2);
    assert.ok(result.stderr.includes(repo.repoConfig), result.stderr);
  });

  test('a review run from a subfolder reads the repository\'s lets config at the root, and runs the CLI there', async (t) => {
    const repo = delegateRepo(t, { repo: CLI });
    const docs = join(repo.cwd, 'docs');
    mkdirSync(docs);
    const stand = codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    const meta = metadata(await repo.run(review({ promptFile: '../p.md' }), { cwd: docs }));
    assert.deepEqual([meta.resolver, meta.checkout], ['cli', repo.cwd]);
    assert.deepEqual(stand.cwds(), [repo.cwd]);
  });

  test('a refused model passes to the next one on the same resolver', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = {
      codex: codex(repo.standIns, [], { rows: [{ args: codexExec(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'error: model gpt-6-astra not available\n', code: 1 }] }),
      agy: agy(repo.standIns, [], { rows: [{ args: agyP('high', '45m', 'gemini-3-pro-high'), stdout: FINDINGS }] }),
    };
    const result = await repo.run(review({ models: ['gpt/gpt-6-astra', 'gemini/gemini-3-pro'] }));
    const { family, model } = metadata(result);
    assert.deepEqual({ family, model }, { family: 'gemini', model: 'gemini-3-pro' });
    assert.equal(result.stdout, FINDINGS);
    assert.equal(clis.codex.calls().length, 1);
    assert.equal(clis.agy.calls().length, 1);
  });

  test('when every model is refused, a review is exit 3 with one line per model, and never moves down the chain', async (t) => {
    const repo = delegateRepo(t, { user: CLI_THEN_SUBAGENT });
    codex(repo.standIns, [], { rows: [{ args: codexExec(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'error: model gpt-6-astra not available\n', code: 1 }] });
    claude(repo.standIns, { rows: [{ args: claudeP(), stderr: 'model not found\n', code: 1 }] });
    const result = await repo.run(review({ models: ['gpt/gpt-6-astra', 'claude'] }));
    failed(result, 3);
    assert.match(result.stderr, /^lets delegate: gpt\/gpt-6-astra: codex refused: exit 1: error: model gpt-6-astra not available\n+claude: claude refused: exit 1: model not found\n+$/);
    // subagent would say that no resolver started a session.
    assert.doesNotMatch(result.stderr, /no resolver started a session/);
  });

  test('a codex refusal after an earlier review with the same name is exit 3, not 5', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    mkdirSync(dirname(lastMessage(repo.cwd)), { recursive: true });
    writeFileSync(lastMessage(repo.cwd), 'OLD FINDINGS\n');
    codex(repo.standIns, [], { rows: [{ args: codexExec(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'model not available\n', code: 1 }] });
    failed(await repo.run(review({ models: ['gpt/gpt-6-astra'] })), 3);
  });

  test('a session that prints and then fails is exit 5, and the next model is not asked', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = {
      claude: claude(repo.standIns, { rows: [{ args: claudeP(), stdout: 'half a review', stderr: 'rate limited\n', code: 2 }] }),
      codex: codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] }),
    };
    const result = await repo.run(review({ models: ['claude', 'gpt/gpt-6-luna'] }));
    failed(result, 5);
    assert.match(result.stderr, /claude failed: exit 2: rate limited/);
    assert.equal(clis.claude.calls().length, 1);
    assert.deepEqual(clis.codex.calls(), []);
  });

  test('a CLI that cannot start is a refusal, exit 3, naming the CLI', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    unstartable(repo.standIns, 'claude');
    const result = await repo.run(review({ models: ['claude'] }));
    failed(result, 3);
    assert.match(result.stderr, /^lets delegate: claude: cannot run claude: /m);
  });

  test('a blank final message is exit 5, and codex\'s last-message file stays', async (t) => {
    const blankClaude = delegateRepo(t, { user: CLI });
    claude(blankClaude.standIns, { rows: [{ args: claudeP(), stdout: ' \n' }] });
    const fromClaude = await blankClaude.run(review({ models: ['claude'] }));
    failed(fromClaude, 5);
    assert.match(fromClaude.stderr, new RegExp(`cli gave an empty final message \\(process ${SESSION}\\)`));
    const blankCodex = delegateRepo(t, { user: CLI });
    codex(blankCodex.standIns, [], { rows: [codexAnswers(blankCodex.cwd, ' \n')] });
    const fromCodex = await blankCodex.run(review());
    failed(fromCodex, 5);
    assert.match(fromCodex.stderr, /empty final message/);
    assert.equal(readFileSync(lastMessage(blankCodex.cwd), 'utf8'), ' \n');
  });

  test('a codex review that writes no last message is exit 5', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    codex(repo.standIns, [], { rows: [{ args: codexExec(repo.cwd), stdout: 'working...\n' }] });
    const result = await repo.run(review());
    failed(result, 5);
    assert.match(result.stderr, /empty final message/);
  });

  test('a folder where the last message goes is exit 4, with the error, and codex does not run', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    mkdirSync(lastMessage(repo.cwd), { recursive: true });
    const stand = codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    const result = await repo.run(review());
    failed(result, 4);
    assert.match(result.stderr, /EISDIR/);
    assert.deepEqual(stand.calls(), []);
  });

  test('a clean codex review removes its last-message file', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    codex(repo.standIns, [], { rows: [codexAnswers(repo.cwd)] });
    assert.equal((await repo.run(review())).code, 0);
    assert.equal(existsSync(lastMessage(repo.cwd)), false);
  });

  test('a clean claude review adds only the scratch folder to the repository', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeP(), stdout: FINDINGS }] });
    const before = snapshot(repo.cwd).split('\n');
    assert.equal((await repo.run(review({ models: ['claude'] }))).code, 0);
    const after = snapshot(repo.cwd).split('\n');
    assert.deepEqual(before.filter((line) => !after.includes(line)), [], 'nothing changed or went');
    assert.deepEqual(after.filter((line) => !before.includes(line)).map((line) => line.split(' ')[0]), ['./.workspace/', './.workspace/lets-delegate/']);
  });
});
