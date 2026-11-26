// lets delegate step run with fake resolvers, for what no real resolver
// can show. tests/delegate/step.test.ts tests step run through lets, with
// the cli and subagent resolvers.
//
// - A step skips a resolver that runs no step: cli, subagent and t3 all
//   run steps (ADR-016), so only a fake adapter can leave step out.
// - A finish that fails: cli's finish only removes a file the session
//   wrote, and subagent gives no handle to finish, so only a fake t3
//   adapter's finish can throw.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'build', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
// The resolvers asked to run a step, in order.
const stepsBy = (t: ReturnType<typeof commandDeps>) => t.adapterCalls('step').map(([name]) => name);
// stdout's one line, read as JSON.
const report = (t: ReturnType<typeof commandDeps>) => {
  assert.equal(t.stdout().split('\n').length, 2, 'one line on stdout');
  return JSON.parse(t.stdout());
};

test('a resolver that runs no step passes it down the chain', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3, cli] }\n', adapters: { t3: { steps: false }, cli: {} } });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(stepsBy(t), ['cli']);
  assert.equal(report(t).outcome, 'done');
});

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'build', 'the record still ends stderr');
});
