// lets delegate step run, run as a program in a real Git repository. The
// cli and subagent resolvers are chosen by a real lets config, and PATH
// holds only the stand-in codex, claude and agy a test writes, and git, so
// no real CLI on the developer's machine changes a result. Each test gives
// a stand-in the exact command it expects, so the write-mode command lets
// gives each CLI is checked too.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { agy, claude, codex, type LetsResult } from '../support/lets.ts';
import { delegateRepo, PROMPT } from './repo.ts';
import { agyWrite, assertClock, claudeWrite, codexWrite, ending, stepRun, type StepArgs } from './steps.ts';

const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';
const DONE = ending('outcome: done\nevidence:\n  - "commit 3f2a1c0"\n');
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
});
