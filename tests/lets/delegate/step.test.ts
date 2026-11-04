import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'apply', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const steps = (calls: Calls) => calls('step').map(([name, , call]) => ({ name, ...(call as { input: object; options: object }) }));
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
