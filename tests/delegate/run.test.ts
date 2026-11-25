// lets delegate review run and handoff run, run as a program in a real Git
// repository. The cli and subagent resolvers are chosen by a real lets
// config, and PATH holds only the stand-in codex, claude and agy a test
// writes, and git, so no real CLI on the developer's machine changes a
// result. Each test gives a stand-in the exact command it expects, so the
// command lets gives each CLI is checked too.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { agy, claude, codex, type LetsResult } from '../support/lets.ts';
import { delegateRepo, PROMPT } from './repo.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
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
});
