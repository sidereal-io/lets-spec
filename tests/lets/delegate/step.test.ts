// lets delegate step run with a fake resolver, for what no real resolver
// can show. tests/delegate/step.test.ts tests step run through lets, with
// the cli and subagent resolvers. A finish that fails cannot be made
// there: cli's finish only removes a file the session wrote, and subagent
// gives no handle to finish. So this test passes a fake t3 adapter whose
// finish throws.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'build', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
// stdout's one line, read as JSON.
const report = (t: ReturnType<typeof commandDeps>) => {
  assert.equal(t.stdout().split('\n').length, 2, 'one line on stdout');
  return JSON.parse(t.stdout());
};

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'build', 'the record still ends stderr');
});

test('a session past its time is exit 6', async () => {
  const t = withT3({ adapters: { t3: { step: new TimeoutError('no answer after 120 minutes') } } });
  assert.equal(await run(options(), t.deps), 6);
  assert.equal(t.stdout(), '');
});
