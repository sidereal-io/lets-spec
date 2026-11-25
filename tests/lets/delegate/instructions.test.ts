import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/instructions.ts';
import { commandDeps, CONFIG, REPO_CONFIG } from './fixtures/command-deps.ts';
import type { FakeResolver } from './fixtures/command-deps.ts';

const review = { strategy: 'review', for: 'code' } as const;
const handoff = { strategy: 'handoff', for: 'apply' } as const;
const step = { strategy: 'step', for: 'plan' } as const;
// commandDeps whose config lists t3, behaving as given, with more under
// delegate beside the chain.
const withT3 = (more = '', t3: FakeResolver = {}) =>
  commandDeps({ config: `version: 3\ndelegate:\n  resolvers: [t3]\n${more.replace(/^(?=.)/gm, '  ')}`, adapters: { t3 } });

test('a resolver whose options fail unexpectedly is exit 4 with the message', async () => {
  const t = withT3();
  t.deps.resolvers.t3.options = async () => {
    throw new Error('manifest unreadable');
  };
  assert.equal(await run(review, t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /manifest unreadable/);
});

test('step instructions skip a resolver that runs no step', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [cli, t3] }\n', adapters: { cli: { steps: false }, t3: {} } });
  assert.equal(await run(step, t.deps), 0);
  assert.equal(JSON.parse(t.stdout()).resolver, 't3');
  assert.deepEqual(t.adapterCalls('options').map(([name]) => name), ['t3']);
});
