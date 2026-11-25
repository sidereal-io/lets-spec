// The cli resolver through lets delegate step run, with the real cli
// adapter on the kit's fake io, named in the config. #319 moves these to
// black-box tests. The cli resolver's reviews and handoffs are tested
// through lets, in tests/delegate/run.test.ts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run as step } from '../../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../../lets/src/delegate/step.ts';
import { createAdapter } from '../../../../lets/src/resolvers/cli/cli.ts';
import { commandDeps, DONE_REPORT } from '../../delegate/fixtures/command-deps.ts';
import { fakeIo } from '../kit/fixtures/fake-io.ts';
import type { FakeIo } from '../kit/fixtures/fake-io.ts';

const ONLY_CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';

// commandDeps whose config is config, with the real cli adapter on io.
const withCli = (io: FakeIo, config = ONLY_CLI) => commandDeps({ config, real: { cli: createAdapter(io) } });

const CLI_THEN_DEFAULT = 'version: 3\ndelegate: { resolvers: [cli, subagent] }\n';

const argsOf = (io: FakeIo) => io.calls.map(([cmd, args]) => [cmd, args]);
// The command's JSON line on stderr.
const metadata = (t: ReturnType<typeof withCli>) => JSON.parse(t.stderr());

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

const NEEDS_INPUT_REPORT = 'Stuck.\n\n```step-report\noutcome: needs-input\nquestions:\n  - question: Which base?\n```\n';

// A step on models, with 3 minutes, whose CLIs answer with results in order.
const scriptedStep = async (models: string[], results: NonNullable<Parameters<typeof fakeIo>[0]>['results'], commands = ['codex', 'claude']) => {
  const t = withCli(fakeIo({ commands, results }));
  const code = await step(stepOptions({ models, timeoutMinutes: 3 }), t.deps);
  return { code, stdout: t.stdout(), stderr: t.stderr() };
};

test('a step whose CLI runs past its time limit is stopped, and is exit 6', async () => {
  const answer = await scriptedStep(['claude'], [{ stdout: '', stderr: '', code: 1, timedOut: true }]);
  assert.deepEqual([answer.code, answer.stdout], [6, '']);
  assert.match(answer.stderr, /claude did not finish in 3 minutes/);
});

// The adapter itself: the chain only ever finishes a handle the adapter
// made, so these cases cannot be reached through a command.

test('finish removes nothing for a process handle whose id is not a session name', async () => {
  const io = fakeIo({ commands: ['codex'], files: { '/repo/.workspace/lets-delegate/../x.last-message.md': 'X' } });
  await assert.rejects(createAdapter(io).finish({ kind: 'process', id: '../x' }, true, { cwd: '/repo' }), /not a session name/);
  assert.deepEqual(io.removed, []);
});
