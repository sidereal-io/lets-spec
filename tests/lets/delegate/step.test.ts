import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { SessionFailed } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'apply', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const steps = (calls: Calls) => calls('step').map(([name, , call]) => ({ name, ...(call as { input: object; options: object }) }));
const finishes = (calls: Calls) => calls('finish').map(([name, , call]) => ({ name, ...(call as { handle: object; ok: boolean; options: object }) }));
// A final message that ends with a step-report block holding yaml.
const ending = (yaml: string) => `Prose.\n\n\`\`\`step-report\n${yaml}\`\`\`\n`;
const NEEDS_INPUT = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n  - question: Split it?\n    recommendation: no\n');
// stdout's one line, read as JSON.
const report = (t: ReturnType<typeof commandDeps>) => {
  assert.equal(t.stdout().split('\n').length, 2, 'one line on stdout');
  return JSON.parse(t.stdout());
};

test('the resolver is asked for a step session with the normalized name, the prompt, the root, the model and the effort', async () => {
  const t = withT3();
  await run(options(), t.deps);
  assert.deepEqual(steps(t.adapterCalls), [{
    name: 't3',
    input: { name: 'build-x', prompt: 'PROMPT TEXT', cwd: '/repo', family: 'gpt', model: 'gpt-6-luna', effort: 'high' },
    options: { timeoutMs: 120 * 60000 },
  }]);
});

test('a step has 120 minutes at every effort', async () => {
  for (const effort of ['low', 'medium', 'high'] as const) {
    const t = withT3();
    await run(options({ effort }), t.deps);
    assert.deepEqual(steps(t.adapterCalls)[0].options, { timeoutMs: 120 * 60000 }, effort);
  }
});

test('--timeout-minutes sets the step\'s time limit', async () => {
  const t = withT3();
  await run(options({ timeoutMinutes: 30 }), t.deps);
  assert.deepEqual(steps(t.adapterCalls)[0].options, { timeoutMs: 30 * 60000 });
});

test('a done report is printed with the clock\'s date', async () => {
  const t = withT3();
  t.io.now = () => Date.parse('2026-11-04T09:30:00Z');
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"done",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'done', evidence: ['commit 3f2a1c0'], date: '2026-11-04T09:30:00Z' });
});

test('the record on stderr names the session that ran the step', async () => {
  const t = withT3();
  assert.equal(await run(options({ for: 'propose', models: ['claude/claude-opus-5-5'] }), t.deps), 0);
  assert.equal(t.stderr().split('\n').length, 2, 'one line on stderr');
  assert.ok(t.stderr().startsWith('{"for":"propose",'), t.stderr());
  assert.deepEqual(JSON.parse(t.stderr()), {
    for: 'propose', resolver: 't3', family: 'claude', model: 'claude-opus-5-5', handle: { kind: 't3', id: 't3-1' }, durationSeconds: 0,
  });
  assert.deepEqual(Object.keys(JSON.parse(t.stderr())), ['for', 'resolver', 'family', 'model', 'handle', 'durationSeconds']);
});

test('a bare family is the record\'s model', async () => {
  const t = withT3();
  await run(options({ models: ['claude'] }), t.deps);
  assert.equal(JSON.parse(t.stderr()).model, 'claude');
});

test('a needs-input report is printed at exit 0, its questions in order', async () => {
  const t = withT3({ adapters: { t3: { step: { text: NEEDS_INPUT } } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"needs-input",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'needs-input', questions: [{ question: 'Which schema?' }, { question: 'Split it?', recommendation: 'no' }] });
});

test('a failed report from the session is printed at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: { text: ending('outcome: failed\nreason: tests fail on main\n') } } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"failed",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'failed', reason: 'tests fail on main' });
});

test('a final message with no report is a failed report holding the message, at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: { text: 'I stopped.' } } } });
  assert.equal(await run(options(), t.deps), 0);
  const { outcome, reason, message } = report(t);
  assert.deepEqual({ outcome, message }, { outcome: 'failed', message: 'I stopped.' });
  assert.match(reason, /step-report/);
});

test('a session the resolver reports failed is a failed report with its reason, at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: new SessionFailed('the session stopped to ask') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(report(t), { outcome: 'failed', reason: 'the session stopped to ask' });
});

test('a session the resolver reports failed has no handle to finish', async () => {
  const t = withT3({ adapters: { t3: { step: new SessionFailed('the session stopped to ask') } } });
  await run(options(), t.deps);
  assert.deepEqual(t.adapterCalls('finish'), []);
  assert.equal(JSON.parse(t.stderr()).handle, null);
});

test('a done step is finished with ok, by the resolver that made it', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } } } } });
  await run(options(), t.deps);
  assert.deepEqual(finishes(t.adapterCalls), [{ name: 't3', handle: { kind: 'thread', id: 't-1' }, ok: true, options: { cwd: '/repo' } }]);
});

test('a step that did not end done is finished without ok', async () => {
  for (const text of [NEEDS_INPUT, ending('outcome: failed\nreason: no\n'), 'no report']) {
    const t = withT3({ adapters: { t3: { step: { text } } } });
    await run(options(), t.deps);
    assert.deepEqual(finishes(t.adapterCalls).map(({ ok }) => ok), [false], text);
  }
});

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'apply', 'the record still ends stderr');
});
