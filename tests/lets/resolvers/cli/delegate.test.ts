// The cli resolver through lets delegate: each command with the real cli
// adapter, on the kit's fake io, named in the config.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run as handoff } from '../../../../lets/src/delegate/handoff.ts';
import { run as review } from '../../../../lets/src/delegate/review.ts';
import { run as step } from '../../../../lets/src/delegate/step.ts';
import type { ReviewOptions } from '../../../../lets/src/delegate/review.ts';
import type { StepOptions } from '../../../../lets/src/delegate/step.ts';
import { createAdapter } from '../../../../lets/src/resolvers/cli/cli.ts';
import { commandDeps, DONE_REPORT } from '../../delegate/fixtures/command-deps.ts';
import { fakeIo } from '../kit/fixtures/fake-io.ts';
import type { FakeIo } from '../kit/fixtures/fake-io.ts';

const ONLY_CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';

// commandDeps whose config is config, with the real cli adapter on io.
const withCli = (io: FakeIo, config = ONLY_CLI) => commandDeps({ config, real: { cli: createAdapter(io) } });

// A review named x, from a claude author, on the gpt family.
const reviewOptions = (over: Partial<ReviewOptions> = {}): ReviewOptions =>
  ({ for: 'code', name: 'x', promptFile: 'p.md', sourceFamily: 'claude', effort: 'high', models: ['gpt'], ...over });
const handoffOptions = { name: 'fix-login', promptFile: 'p.md', models: ['claude'] };

test('a handoff declines with every family CLI on PATH, starting nothing', async () => {
  const io = fakeIo({ commands: ['codex', 'claude', 'agy'] });
  const t = withCli(io);
  assert.equal(await handoff(handoffOptions, t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /every resolver declined/);
  assert.deepEqual(io.calls, []);
});

const CLI_THEN_DEFAULT = 'version: 3\ndelegate: { resolvers: [cli, subagent] }\n';

test('with no family CLI on PATH, the default answers a step next, starting nothing', async () => {
  const io = fakeIo({ commands: [] });
  const t = withCli(io, CLI_THEN_DEFAULT);
  assert.equal(await step({ for: 'build', name: 'build-x', promptFile: 'p.md', effort: 'high', models: ['claude'] }, t.deps), 3);
  assert.match(t.stderr(), /\.workspace\/lets-delegate\/build-x\.prompt\.md/);
  assert.deepEqual(io.calls, []);
});

// An io with every CLI on PATH, whose one run prints FINDINGS: codex in its
// last-message file, the others on stdout.
const answering = () => {
  const io = fakeIo({ commands: ['codex', 'claude', 'agy'], results: [(cmd, args) => {
    if (cmd === 'codex') io.files.set(args[args.indexOf('-o') + 1], 'FINDINGS\n');
    return { stdout: cmd === 'codex' ? '' : 'FINDINGS\n', stderr: '', code: 0 };
  }] });
  return io;
};
const argsOf = (io: FakeIo) => io.calls.map(([cmd, args]) => [cmd, args]);
// The review's JSON line on stderr.
const metadata = (t: ReturnType<typeof withCli>) => JSON.parse(t.stderr());

// A claude review, from a codex author, with 3 minutes, whose CLI answers
// with result, on io when given.
const claudeReview = async (result: NonNullable<Parameters<typeof fakeIo>[0]>['results'], io = fakeIo({ commands: ['claude'], results: result })) => {
  const t = withCli(io);
  const code = await review(reviewOptions({ sourceFamily: 'gpt', models: ['claude'], timeoutMinutes: 3 }), t.deps);
  return { code, stdout: t.stdout(), stderr: t.stderr() };
};

test('a CLI that ends with an empty message is exit 5', async () => {
  const answer = await claudeReview([{ stdout: '\n', stderr: '', code: 0 }]);
  assert.equal(answer.code, 5);
  assert.match(answer.stderr, /empty final message/);
});

test('a codex review that writes no last message is exit 5', async () => {
  const t = withCli(fakeIo({ commands: ['codex'] }));
  assert.equal(await review(reviewOptions(), t.deps), 5);
  assert.match(t.stderr(), /empty final message/);
});

test('a CLI that runs past the timeout is stopped, and is exit 6', async () => {
  const answer = await claudeReview([{ stdout: '', stderr: '', code: 1, timedOut: true }]);
  assert.equal(answer.code, 6);
  assert.match(answer.stderr, /claude did not finish in 3 minutes/);
});

const LAST_MESSAGE = '/repo/.workspace/lets-delegate/cli-resolver.last-message.md';
// A codex review named cli-resolver, which leaves the tree as gitAfter says.
const codexReview = async (gitAfter = '') => {
  const io = answering();
  const t = commandDeps({ config: ONLY_CLI, real: { cli: createAdapter(io) }, gitAfter });
  const code = await review(reviewOptions({ name: 'cli-resolver' }), t.deps);
  return { code, io };
};

test('a clean review removes its last-message file', async () => {
  const { code, io } = await codexReview();
  assert.equal(code, 0);
  assert.equal(io.exists(LAST_MESSAGE), false);
});

test('a review that changed the tree keeps its last-message file', async () => {
  const { code, io } = await codexReview(' M src/a.js\0');
  assert.equal(code, 7);
  assert.equal(io.exists(LAST_MESSAGE), true);
});

test('a clean claude review, which writes no files, removes nothing', async () => {
  const io = answering();
  assert.equal(await review(reviewOptions({ models: ['claude'] }), withCli(io).deps), 0);
  assert.deepEqual(io.removed, []);
});

// A step named build-x for build, at high effort, on the gpt family.
const stepOptions = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'build', name: 'build-x', promptFile: 'p.md', effort: 'high', models: ['gpt'], ...over });
const STEP_LAST_MESSAGE = '/repo/.workspace/lets-delegate/build-x.last-message.md';
// An io with every CLI on PATH, whose one run ends with message: codex in
// its last-message file, the others on stdout.
const stepping = (message: string) => {
  const io = fakeIo({ commands: ['codex', 'claude', 'agy'], results: [(cmd, args) => {
    if (cmd === 'codex') io.files.set(args[args.indexOf('-o') + 1], message);
    return { stdout: cmd === 'codex' ? '' : message, stderr: '', code: 0 };
  }] });
  return io;
};

test('a step with codex runs it in its write mode, and prints the report from its last message', async () => {
  const io = stepping(DONE_REPORT);
  const t = withCli(io);
  assert.equal(await step(stepOptions({ models: ['gpt/gpt-6-luna'] }), t.deps), 0);
  assert.deepEqual(argsOf(io), [['codex',
    ['exec', '--dangerously-bypass-approvals-and-sandbox', '-c', 'model_reasoning_effort="high"', '-m', 'gpt-6-luna', '-o', STEP_LAST_MESSAGE, '-']]]);
  assert.deepEqual(JSON.parse(t.stdout()), { outcome: 'done', evidence: ['commit 3f2a1c0'], date: '1970-01-01T00:00:00Z' });
  const { resolver, family, model, handle } = metadata(t);
  assert.deepEqual({ resolver, family, model, handle }, { resolver: 'cli', family: 'gpt', model: 'gpt-6-luna', handle: { kind: 'process', id: 'build-x' } });
});

const NEEDS_INPUT_REPORT = 'Stuck.\n\n```step-report\noutcome: needs-input\nquestions:\n  - question: Which base?\n```\n';

test('a step on the bare family claude runs claude in its write mode, with no model, and prints a needs-input report', async () => {
  const io = stepping(NEEDS_INPUT_REPORT);
  const t = withCli(io);
  assert.equal(await step(stepOptions({ models: ['claude'] }), t.deps), 0);
  assert.deepEqual(argsOf(io), [['claude', ['-p', '--permission-mode', 'bypassPermissions', '--effort', 'high']]]);
  assert.equal(JSON.parse(t.stdout()).outcome, 'needs-input');
});

test('a step runs the CLI in the repository, with the prompt on stdin, 120 minutes and no session markers', async () => {
  const io = stepping(DONE_REPORT);
  assert.equal(await step(stepOptions({ models: ['claude'] }), withCli(io).deps), 0);
  const [, , { cwd, input, timeoutMs, env }] = io.calls[0];
  assert.deepEqual([cwd, input, timeoutMs], ['/repo', 'PROMPT TEXT', 120 * 60000]);
  assert.equal(env?.CLAUDECODE, undefined);
});

test('a gemini step at medium effort runs agy in its write mode, with the step\'s time limit', async () => {
  const io = stepping(DONE_REPORT);
  assert.equal(await step(stepOptions({ models: ['gemini/gemini-3.8-flash'], effort: 'medium', timeoutMinutes: 30 }), withCli(io).deps), 0);
  assert.deepEqual(argsOf(io), [['agy', ['--mode', 'accept-edits', '--dangerously-skip-permissions', '--effort', 'medium',
    '--model', 'gemini-3.8-flash-medium', '--print-timeout', '30m', '-p', 'PROMPT TEXT']]]);
});

// A step on models, with 3 minutes, whose CLIs answer with results in order.
const scriptedStep = async (models: string[], results: NonNullable<Parameters<typeof fakeIo>[0]>['results'], commands = ['codex', 'claude']) => {
  const t = withCli(fakeIo({ commands, results }));
  const code = await step(stepOptions({ models, timeoutMinutes: 3 }), t.deps);
  return { code, stdout: t.stdout(), stderr: t.stderr() };
};

test('a step whose CLI prints and then exits non-zero is a failed report, with no handle', async () => {
  const answer = await scriptedStep(['claude'], [{ stdout: 'half an answer', stderr: 'rate limited', code: 2 }]);
  assert.equal(answer.code, 0);
  const { outcome, reason } = JSON.parse(answer.stdout);
  assert.equal(outcome, 'failed');
  assert.match(reason, /claude failed: exit 2: rate limited/);
  assert.equal(JSON.parse(answer.stderr).handle, null);
});

test('a codex step that writes no last message is a failed report naming step-report', async () => {
  const answer = await scriptedStep(['gpt'], [{ stdout: 'working...', stderr: '', code: 0 }]);
  assert.equal(answer.code, 0);
  const { outcome, reason } = JSON.parse(answer.stdout);
  assert.equal(outcome, 'failed');
  assert.match(reason, /step-report/);
});

test('a step whose CLI runs past its time limit is stopped, and is exit 6', async () => {
  const answer = await scriptedStep(['claude'], [{ stdout: '', stderr: '', code: 1, timedOut: true }]);
  assert.deepEqual([answer.code, answer.stdout], [6, '']);
  assert.match(answer.stderr, /claude did not finish in 3 minutes/);
});

test('a codex that refuses a step\'s model hands it to the next --model', async () => {
  const io = fakeIo({ commands: ['codex', 'claude'], results: [
    { stdout: '', stderr: 'error: model gpt-6-astra not available', code: 1 },
    { stdout: DONE_REPORT, stderr: '', code: 0 },
  ] });
  const t = withCli(io);
  assert.equal(await step(stepOptions({ models: ['gpt/gpt-6-astra', 'claude'] }), t.deps), 0);
  assert.deepEqual(io.calls.map(([cmd]) => cmd), ['codex', 'claude']);
  assert.equal(JSON.parse(t.stdout()).outcome, 'done');
  assert.equal(metadata(t).family, 'claude');
});

test('a step whose CLI cannot start is a refusal, exit 3, naming the CLI', async () => {
  const io = fakeIo({ commands: ['claude'], execFile: async (cmd) => {
    throw new Error(`cannot run ${cmd}: spawn ${cmd} EACCES`);
  } });
  const t = withCli(io);
  assert.equal(await step(stepOptions({ models: ['claude'] }), t.deps), 3);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /claude/);
});

test('a done codex step removes its last-message file', async () => {
  const io = stepping(DONE_REPORT);
  assert.equal(await step(stepOptions(), withCli(io).deps), 0);
  assert.equal(io.exists(STEP_LAST_MESSAGE), false);
});

test('a codex step that needs input keeps its last-message file', async () => {
  const io = stepping(NEEDS_INPUT_REPORT);
  assert.equal(await step(stepOptions(), withCli(io).deps), 0);
  assert.equal(io.exists(STEP_LAST_MESSAGE), true);
});

// The adapter itself: the chain only ever finishes a handle the adapter
// made, so these cases cannot be reached through a command.

test('finish removes nothing for a process handle whose id is not a session name', async () => {
  const io = fakeIo({ commands: ['codex'], files: { '/repo/.workspace/lets-delegate/../x.last-message.md': 'X' } });
  await assert.rejects(createAdapter(io).finish({ kind: 'process', id: '../x' }, true, { cwd: '/repo' }), /not a session name/);
  assert.deepEqual(io.removed, []);
});
