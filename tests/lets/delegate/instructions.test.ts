// The few behaviours of lets delegate <strategy> instructions that no real
// resolver reaches, so they need fake adapters. Every other behaviour is
// tested through lets itself, in tests/delegate/instructions.test.ts.
//
// - A step skips a resolver that runs no step: cli and subagent both run
//   steps (ADR-016), so only a fake adapter can leave step out.
// - An options call that fails unexpectedly exits 4: cli and subagent catch
//   every failure of their listings, so only a fake adapter can throw.
// - A detect that throws exits 4: cli and subagent only look at PATH, or
//   answer true, so only a fake adapter can throw.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/instructions.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const review = { strategy: 'review', for: 'review-build' } as const;
const step = { strategy: 'step', for: 'plan' } as const;
// commandDeps whose config lists only t3, which detects, as a fake adapter.
const withT3 = () => commandDeps({ config: 'version: 4\ndelegate:\n  resolvers: [t3]\n', adapters: { t3: {} } });

test('step instructions skip a resolver that runs no step', async () => {
  const deps = () => commandDeps({ config: 'version: 4\ndelegate: { resolvers: [cli, t3] }\n', adapters: { cli: { steps: false }, t3: {} } });
  const t = deps();
  assert.equal(await run(step, t.deps), 0);
  assert.equal(JSON.parse(t.stdout()).resolver, 't3');
  assert.deepEqual(t.adapterCalls('options').map(([name]) => name), ['t3']);
  // It still answers a review.
  const r = deps();
  assert.equal(await run(review, r.deps), 0);
  assert.equal(JSON.parse(r.stdout()).resolver, 'cli');
});

test('a resolver whose options fail unexpectedly is exit 4 with the message', async () => {
  const t = withT3();
  t.deps.resolvers.t3.options = async () => {
    throw new Error('manifest unreadable');
  };
  assert.equal(await run(review, t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /manifest unreadable/);
});

test('a resolver whose detect throws is exit 4 with the message', async () => {
  const t = withT3();
  t.deps.resolvers.t3.detect = () => {
    throw new Error('no /proc');
  };
  assert.equal(await run(review, t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /no \/proc/);
});
