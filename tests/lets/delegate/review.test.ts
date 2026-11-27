// review run with a fake resolver, for the 3 cases no cli or subagent
// resolver reaches: cli always runs in the repository root, so it never
// reports another checkout or none, and its finish fails only for a handle
// it never makes. Everything else review run does is tested through lets,
// in tests/delegate/run.test.ts and review-timeout.test.ts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/review.ts';
import type { ReviewOptions } from '../../../lets/src/delegate/review.ts';
import { SpawnError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, HEAD } from './fixtures/command-deps.ts';

const options = (over: Partial<ReviewOptions> = {}): ReviewOptions =>
  ({ for: 'review-build', name: 'X Plan Review', promptFile: 'p.md', sourceFamily: 'claude', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which answers, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 4\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });

test('the metadata line names the checkout the resolver ran in, and the commit at its HEAD', async () => {
  const t = withT3({ adapters: { t3: { run: { checkout: '/w/elsewhere' } } } });
  assert.equal(await run(options(), t.deps), 0);
  const { checkout, commit } = JSON.parse(t.stderr());
  assert.deepEqual({ checkout, commit }, { checkout: '/w/elsewhere', commit: HEAD });
  assert.ok(t.io.calls.some(([cmd, args, opts]) => cmd === 'git' && args.join(' ') === 'rev-parse HEAD' && opts.cwd === '/w/elsewhere'), 'HEAD was read in the checkout');
});

test('a resolver that cannot tell the checkout gives a null commit, and the review still succeeds', async () => {
  const t = withT3({ adapters: { t3: { run: { checkout: null } } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(t.stdout(), 'FINDINGS\n');
  const { checkout, commit } = JSON.parse(t.stderr());
  assert.deepEqual({ checkout, commit }, { checkout: null, commit: null });
});

test('a finish that fails is reported, and the review still succeeds', async () => {
  for (const error of [new SpawnError('thread gone'), new Error('thread gone')]) {
    const t = withT3({ adapters: { t3: { finish: error } } });
    assert.equal(await run(options(), t.deps), 0);
    assert.equal(t.stdout(), 'FINDINGS\n');
    const lines = t.stderr().trim().split('\n');
    assert.match(lines[0], /could not finish t3 t3-1: thread gone/);
    assert.equal(JSON.parse(lines[1]).gitClean, true);
  }
});
