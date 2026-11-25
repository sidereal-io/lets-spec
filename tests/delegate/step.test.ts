// lets delegate step run, run as a program in a real Git repository. The
// cli and subagent resolvers are chosen by a real lets config, and PATH
// holds only the stand-in codex, claude and agy a test writes, and git, so
// no real CLI on the developer's machine changes a result. Each test gives
// a stand-in the exact command it expects, so the write-mode command lets
// gives each CLI is checked too.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { agy, claude, codex, git, type LetsResult, unstartable } from '../support/lets.ts';
import { delegateRepo, PROMPT } from './repo.ts';
import { agyWrite, assertClock, claudeWrite, codexWrite, ending, stepRun, type StepArgs } from './steps.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
const CLI_THEN_SUBAGENT = 'version: 3\ndelegate: { resolvers: [cli, subagent] }\n';
const DONE = ending('outcome: done\nevidence:\n  - "commit 3f2a1c0"\n');
const NEEDS_INPUT = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n');
const FAILED = ending('outcome: failed\nreason: tests fail on main\n');
const RECORD_KEYS = ['for', 'resolver', 'family', 'model', 'handle', 'durationSeconds'];

// Where codex writes the last message of the step named name, in the root.
const lastMessage = (root: string, name = 'build-x') => join(root, '.workspace', 'lets-delegate', `${name}.last-message.md`);

// The step report of a run that exited 0: stdout's one line, as JSON.
function reportOf(result: LetsResult): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  assert.match(result.stdout, /^[^\n]+\n$/, 'stdout is exactly one line');
  return JSON.parse(result.stdout);
}

// The record line of a run that exited 0: the last line of stderr.
function recordOf(result: LetsResult): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  return JSON.parse(result.stderr.trim().split('\n').at(-1)!);
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
const noCalls = (clis: ReturnType<typeof everyCli>) => {
  for (const [name, stand] of Object.entries(clis)) assert.deepEqual(stand.calls(), [], name);
};

describe('step run', () => {
  test('codex runs in its write mode with -m, in the root, with the prompt on stdin, from a subfolder', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const docs = join(repo.cwd, 'docs');
    mkdirSync(docs);
    const args = codexWrite(repo.cwd, { model: 'gpt-6-luna' });
    const stand = codex(repo.standIns, [], { rows: [{ args, files: { [lastMessage(repo.cwd)]: DONE } }] });
    const result = await repo.run(stepRun({ name: 'Build X', promptFile: '../p.md', models: ['gpt/gpt-6-luna'] }), { cwd: docs });
    assert.equal(reportOf(result).outcome, 'done');
    // The stand-in makes no folder, so lets made the scratch folder first.
    assert.deepEqual(stand.calls(), [args]);
    assert.deepEqual(stand.inputs(), [PROMPT]);
    assert.deepEqual(stand.cwds(), [repo.cwd]);
  });

  test('codex on a bare family gets no -m', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const args = codexWrite(repo.cwd);
    const stand = codex(repo.standIns, [], { rows: [{ args, files: { [lastMessage(repo.cwd)]: DONE } }] });
    assert.equal(reportOf(await repo.run(stepRun({ models: ['gpt'] }))).outcome, 'done');
    assert.deepEqual(stand.calls(), [args]);
  });

  test('claude runs in bypassPermissions mode, with --model when given, the prompt on stdin and no session markers', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const rows = [{ args: claudeWrite('low', 'claude-fable-5-1'), stdout: DONE }, { args: claudeWrite(), stdout: DONE }];
    const stand = claude(repo.standIns, { logEnv: ['CLAUDECODE'], rows });
    for (const over of [{ effort: 'low', models: ['claude/claude-fable-5-1'] }, {}] as const) {
      assert.equal(reportOf(await repo.run(stepRun(over), { env: { CLAUDECODE: '1' } })).outcome, 'done', JSON.stringify(over));
    }
    assert.deepEqual(stand.calls(), rows.map(({ args }) => args));
    assert.deepEqual(stand.inputs(), [PROMPT, PROMPT]);
    assert.deepEqual(stand.cwds(), [repo.cwd, repo.cwd]);
    assert.deepEqual(stand.envs(), [{ CLAUDECODE: undefined }, { CLAUDECODE: undefined }]);
  });

  test('agy runs in accept-edits mode with permissions skipped, the effort on the model, and the prompt as the argument of -p', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const rows = [{ args: agyWrite('high', '120m', PROMPT, 'gemini-3.8-flash-high'), stdout: DONE }, { args: agyWrite('high', '120m', PROMPT), stdout: DONE }];
    const stand = agy(repo.standIns, [], { rows });
    for (const models of [['gemini/gemini-3.8-flash'], ['gemini']]) {
      assert.equal(reportOf(await repo.run(stepRun({ models }))).outcome, 'done', models[0]);
    }
    assert.deepEqual(stand.calls(), rows.map(({ args }) => args));
    assert.deepEqual(stand.cwds(), [repo.cwd, repo.cwd]);
  });

  test('a step has 120 minutes at every effort, a story 600, and --timeout-minutes sets either', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    // agy is told the time limit lets chose, so its arguments show it.
    const cases: [StepArgs, string][] = [
      [{ effort: 'low' }, '120m'],
      [{ effort: 'medium' }, '120m'],
      [{ effort: 'high' }, '120m'],
      [{ effort: 'medium', timeoutMinutes: 30 }, '30m'],
      [{ for: 'story' }, '600m'],
      [{ for: 'story', timeoutMinutes: 900 }, '900m'],
    ];
    const rows = cases.map(([over, timeout]) => ({ args: agyWrite(over.effort ?? 'high', timeout, PROMPT, `gemini-3.8-flash-${over.effort ?? 'high'}`), stdout: DONE }));
    const stand = agy(repo.standIns, [], { rows });
    for (const [over] of cases) {
      assert.equal(reportOf(await repo.run(stepRun({ ...over, models: ['gemini/gemini-3.8-flash'] }))).outcome, 'done', JSON.stringify(over));
    }
    assert.deepEqual(stand.calls(), rows.map(({ args }) => args));
  });

  test('a done report is printed at exit 0 with its evidence and the date it was printed', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    const before = Date.now();
    const result = await repo.run(stepRun());
    const after = Date.now();
    assert.ok(result.stdout.startsWith('{"outcome":"done",'), result.stdout);
    const { date, ...rest } = reportOf(result);
    assert.deepEqual(rest, { outcome: 'done', evidence: ['commit 3f2a1c0'] });
    assertClock(date as string, before, after);
  });

  test('the record line on stderr names the session that ran the step, its keys in order', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite('high', 'claude-opus-5-5'), stdout: DONE }] });
    const result = await repo.run(stepRun({ for: 'plan', models: ['claude/claude-opus-5-5'] }));
    const record = recordOf(result);
    assert.match(result.stderr, /^[^\n]+\n$/, 'stderr is exactly one line');
    assert.deepEqual(Object.keys(record), RECORD_KEYS);
    const { durationSeconds, ...rest } = record;
    assert.deepEqual(rest, { for: 'plan', resolver: 'cli', family: 'claude', model: 'claude-opus-5-5', handle: { kind: 'process', id: 'build-x' } });
    assert.ok(Number.isInteger(durationSeconds) && (durationSeconds as number) >= 0, String(durationSeconds));
  });

  test('a bare family is the record\'s model', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    assert.equal(recordOf(await repo.run(stepRun({ models: ['claude'] }))).model, 'claude');
  });

  test('a needs-input report is printed at exit 0, its questions in order, with ask: true kept and ask: false dropped', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const text = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n    ask: true\n  - question: Split it?\n    recommendation: no\n    ask: false\n');
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: text }] });
    const result = await repo.run(stepRun());
    assert.ok(result.stdout.startsWith('{"outcome":"needs-input",'), result.stdout);
    assert.deepEqual(reportOf(result), { outcome: 'needs-input', questions: [{ question: 'Which schema?', ask: true }, { question: 'Split it?', recommendation: 'no' }] });
  });

  test('a failed report from the session is printed at exit 0, as given', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: FAILED }] });
    const result = await repo.run(stepRun());
    assert.ok(result.stdout.startsWith('{"outcome":"failed",'), result.stdout);
    assert.deepEqual(reportOf(result), { outcome: 'failed', reason: 'tests fail on main' });
  });

  test('a final message with no report is a failed report holding the message, at exit 0', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: 'I stopped.' }] });
    const { outcome, reason, message } = reportOf(await repo.run(stepRun()));
    assert.deepEqual({ outcome, message }, { outcome: 'failed', message: 'I stopped.' });
    assert.match(String(reason), /step-report/);
  });

  test('a CLI that prints and then exits non-zero is a failed report with its reason, and no handle', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: 'half an answer', stderr: 'rate limited\n', code: 2 }] });
    const result = await repo.run(stepRun());
    const { outcome, reason } = reportOf(result);
    assert.equal(outcome, 'failed');
    assert.match(String(reason), /claude failed: exit 2: rate limited/);
    assert.equal(recordOf(result).handle, null);
  });

  test('a codex step that writes no last message is a failed report naming step-report', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd), stdout: 'working...\n' }] });
    const { outcome, reason } = reportOf(await repo.run(stepRun({ models: ['gpt'] })));
    assert.equal(outcome, 'failed');
    assert.match(String(reason), /step-report/);
  });

  test('a done codex step removes its last-message file, and any other outcome keeps it', async (t) => {
    for (const [message, outcome, kept] of [[DONE, 'done', false], [NEEDS_INPUT, 'needs-input', true], [FAILED, 'failed', true], ['no report', 'failed', true]] as const) {
      const repo = delegateRepo(t, { user: CLI });
      codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd), files: { [lastMessage(repo.cwd)]: message } }] });
      assert.equal(reportOf(await repo.run(stepRun({ models: ['gpt'] }))).outcome, outcome, message);
      assert.equal(existsSync(lastMessage(repo.cwd)), kept, message);
    }
  });

  test('files the session changes, and commits it makes, do not count: the step is done', async (t) => {
    const writes = delegateRepo(t, { user: CLI });
    claude(writes.standIns, { rows: [{ args: claudeWrite(), files: { 'notes.md': 'a note\n' }, stdout: DONE }] });
    assert.equal(reportOf(await writes.run(stepRun())).outcome, 'done');
    assert.equal(git(writes.cwd, 'status', '--porcelain').stdout, '?? notes.md\n');
    const commits = delegateRepo(t, { user: CLI });
    claude(commits.standIns, { rows: [{ args: claudeWrite(), files: { 'a.md': 'a\n' }, commit: 'a session commit', stdout: DONE }] });
    assert.equal(reportOf(await commits.run(stepRun())).outcome, 'done');
    assert.notEqual(git(commits.cwd, 'rev-parse', 'HEAD').stdout.trim(), commits.head);
  });

  test('when every resolver in the chain declines, a step is exit 2, naming the config', async (t) => {
    // No CLI on PATH, so cli declines.
    const repo = delegateRepo(t, { user: CLI });
    const result = await repo.run(stepRun());
    failed(result, 2);
    assert.match(result.stderr, /every resolver declined/);
    assert.ok(result.stderr.includes(repo.userConfig), result.stderr);
  });

  test('a resolver that runs no step passes it down the chain: with no CLI, subagent answers with exit 3', async (t) => {
    const repo = delegateRepo(t, { user: CLI_THEN_SUBAGENT });
    const result = await repo.run(stepRun());
    failed(result, 3);
    assert.match(result.stderr, /no resolver started a session.*subagent.*\.workspace\/lets-delegate\/build-x\.prompt\.md/);
  });

  test('a resolver lets does not know is exit 2, naming the file and the entry, and no CLI runs', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate: { resolvers: [codex] }\n' });
    const clis = everyCli(repo.standIns);
    const result = await repo.run(stepRun());
    failed(result, 2);
    assert.match(result.stderr, new RegExp(`${repo.userConfig}.*codex`));
    noCalls(clis);
  });

  test('a step ignores the guidance, even one that is not a string', async (t) => {
    const repo = delegateRepo(t, { user: 'version: 3\ndelegate:\n  resolvers: [cli]\n  step:\n    build:\n      guidance: 42\n' });
    claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    assert.equal(reportOf(await repo.run(stepRun())).outcome, 'done');
  });

  test('a bad --model is exit 2, naming it, and no CLI runs', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = everyCli(repo.standIns);
    const result = await repo.run(stepRun({ models: ['gpt', 'llama/llama-4'] }));
    // lets's option parser rejects it, before step run starts.
    assert.equal(result.code, 2, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /--model .*llama\/llama-4/);
    noCalls(clis);
  });

  test('a refused model passes to the next one on the same resolver', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const clis = {
      codex: codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'error: model gpt-6-astra not available\n', code: 1 }] }),
      claude: claude(repo.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] }),
    };
    const result = await repo.run(stepRun({ models: ['gpt/gpt-6-astra', 'claude'] }));
    assert.equal(reportOf(result).outcome, 'done');
    assert.equal(recordOf(result).family, 'claude');
    assert.equal(clis.codex.calls().length, 1);
    assert.equal(clis.claude.calls().length, 1);
  });

  test('a step whose every model is refused is exit 3, with one line per model', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'error: model gpt-6-astra not available\n', code: 1 }] });
    agy(repo.standIns, [], { rows: [{ args: agyWrite('high', '120m', PROMPT), stderr: 'model not found\n', code: 1 }] });
    const result = await repo.run(stepRun({ models: ['gpt/gpt-6-astra', 'gemini'] }));
    failed(result, 3);
    assert.match(result.stderr, /^lets delegate: gpt\/gpt-6-astra: codex refused: exit 1: error: model gpt-6-astra not available\n+gemini: agy refused: exit 1: model not found\n+$/);
  });

  test('a refusal never moves down the chain: subagent saves no prompt', async (t) => {
    const repo = delegateRepo(t, { user: CLI_THEN_SUBAGENT });
    codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd, { model: 'gpt-6-astra' }), stderr: 'model not available\n', code: 1 }] });
    const result = await repo.run(stepRun({ models: ['gpt/gpt-6-astra'] }));
    failed(result, 3);
    assert.match(result.stderr, /codex refused: exit 1: model not available/);
    assert.doesNotMatch(result.stderr, /no resolver started a session/);
    assert.equal(existsSync(join(repo.cwd, '.workspace', 'lets-delegate', 'build-x.prompt.md')), false);
  });

  test('a CLI that cannot start is a refusal, exit 3, naming the CLI', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    unstartable(repo.standIns, 'claude');
    const result = await repo.run(stepRun());
    failed(result, 3);
    assert.match(result.stderr, /^lets delegate: claude: cannot run claude: /m);
  });

  test('a folder where the last message goes is exit 4, with the error, and codex does not run', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    mkdirSync(lastMessage(repo.cwd), { recursive: true });
    const stand = codex(repo.standIns, [], { rows: [{ args: codexWrite(repo.cwd), files: { [lastMessage(repo.cwd)]: DONE } }] });
    const result = await repo.run(stepRun({ models: ['gpt'] }));
    failed(result, 4);
    assert.match(result.stderr, /EISDIR/);
    assert.deepEqual(stand.calls(), []);
  });

  test('the repository\'s chain replaces the user\'s, and a bad resolver there is exit 2, naming that file', async (t) => {
    const wins = delegateRepo(t, { user: 'version: 3\ndelegate: { resolvers: [subagent] }\n', repo: CLI });
    claude(wins.standIns, { rows: [{ args: claudeWrite(), stdout: DONE }] });
    assert.equal(recordOf(await wins.run(stepRun())).resolver, 'cli');
    const bad = delegateRepo(t, { user: CLI, repo: 'version: 3\ndelegate: { resolvers: [codex] }\n' });
    const clis = everyCli(bad.standIns);
    const result = await bad.run(stepRun());
    failed(result, 2);
    assert.match(result.stderr, new RegExp(`${bad.repoConfig}.*codex`));
    noCalls(clis);
  });
});
