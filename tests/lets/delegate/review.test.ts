import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/review.ts';
import type { ReviewOptions } from '../../../lets/src/delegate/review.ts';
import { SpawnError, TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, HEAD } from './fixtures/command-deps.ts';

const options = (over: Partial<ReviewOptions> = {}): ReviewOptions =>
  ({ for: 'code', name: 'X Plan Review', promptFile: 'p.md', sourceFamily: 'claude', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which answers, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const finishes = (calls: Calls) => calls('finish').map(([name, , call]) => ({ name, ...(call as { handle: object; ok: boolean; options: object }) }));

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

test('a session past its time is exit 6, and a known outcome-unknown error exit 4', async () => {
  for (const [error, code] of [[new TimeoutError('no result in 45 minutes'), 6], [new SpawnError('T3 did not answer'), 4]] as const) {
    const t = withT3({ adapters: { t3: { run: error } } });
    assert.equal(await run(options(), t.deps), code, error.message);
    assert.match(t.stderr(), new RegExp(error.message));
    assert.equal(t.stdout(), '');
  }
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
