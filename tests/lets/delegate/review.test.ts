import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/review.ts';
import type { ReviewOptions } from '../../../lets/src/delegate/review.ts';
import { SessionFailed, SpawnError, TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, HEAD } from './fixtures/command-deps.ts';

const options = (over: Partial<ReviewOptions> = {}): ReviewOptions =>
  ({ for: 'code', name: 'X Plan Review', promptFile: 'p.md', sourceFamily: 'claude', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which answers, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const runs = (calls: Calls) => calls('run').map(([name, , call]) => ({ name, ...(call as { input: object; options: object }) }));
const finishes = (calls: Calls) => calls('finish').map(([name, , call]) => ({ name, ...(call as { handle: object; ok: boolean; options: object }) }));
const runModels = (calls: Calls) => runs(calls).map(({ input }) => {
  const { family, model } = input as { family: string; model: string | null };
  return model === null ? family : `${family}/${model}`;
});

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

test('finish goes to the same resolver with the handle, with ok after a clean tree', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [cli, t3] }\n', adapters: { t3: {}, cli: {} } });
  await run(options(), t.deps);
  assert.deepEqual(finishes(t.adapterCalls), [{ name: 'cli', handle: { kind: 'cli', id: 'cli-1' }, ok: true, options: { cwd: '/repo' } }]);
});

test('a refused model passes to the next one on the same resolver', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra'] } } });
  assert.equal(await run(options({ models: ['gpt/gpt-6-astra', 'gemini/gemini-3-pro'] }), t.deps), 0);
  assert.deepEqual(runModels(t.adapterCalls), ['gpt/gpt-6-astra', 'gemini/gemini-3-pro']);
  assert.equal(t.stdout(), 'FINDINGS\n');
  assert.equal(JSON.parse(t.stderr()).model, 'gemini-3-pro');
});

test('a review whose every model is refused is exit 3, naming each model', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra', 'gemini'] } } });
  assert.equal(await run(options({ models: ['gpt/gpt-6-astra', 'gemini'] }), t.deps), 3);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /gpt\/gpt-6-astra: refused gpt\/gpt-6-astra\ngemini: refused gemini/);
});

test('a refusal never moves down the chain', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3, cli] }\n', adapters: { t3: { refuse: ['gpt', 'gemini'] }, cli: {} } });
  assert.equal(await run(options({ models: ['gpt', 'gemini'] }), t.deps), 3);
  assert.equal(t.adapterCalls().some(([name]) => name === 'cli'), false, 'cli was not asked');
});

test('a failed session is exit 5, and the next model is not asked', async () => {
  const t = withT3({ adapters: { t3: { run: new SessionFailed('the session stopped to ask') } } });
  assert.equal(await run(options({ models: ['gpt', 'gemini'] }), t.deps), 5);
  assert.match(t.stderr(), /stopped to ask/);
  assert.deepEqual(runModels(t.adapterCalls), ['gpt']);
});

test('a session past its time is exit 6, and a known outcome-unknown error exit 4', async () => {
  for (const [error, code] of [[new TimeoutError('no result in 45 minutes'), 6], [new SpawnError('T3 did not answer'), 4]] as const) {
    const t = withT3({ adapters: { t3: { run: error } } });
    assert.equal(await run(options(), t.deps), code, error.message);
    assert.match(t.stderr(), new RegExp(error.message));
    assert.equal(t.stdout(), '');
  }
});

test('an unexpected failure inside the resolver is exit 4 with its message', async () => {
  const t = withT3({ adapters: { t3: { run: new Error('boom') } } });
  assert.equal(await run(options(), t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /boom/);
});

test('an empty final message is exit 5, with finish ok false', async () => {
  const t = withT3({ adapters: { t3: { run: { text: ' \n' } } } });
  assert.equal(await run(options(), t.deps), 5);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /empty final message \(t3 t3-1\)/);
  assert.deepEqual(finishes(t.adapterCalls).map(({ ok }) => ok), [false]);
});

test('a tree the session changed is exit 7, with finish ok false and no findings', async () => {
  const t = withT3({ gitBefore: '', gitAfter: ' M src/a.js\0' });
  assert.equal(await run(options(), t.deps), 7);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /changed files outside \.workspace\/ \(t3 t3-1\)/);
  assert.deepEqual(finishes(t.adapterCalls).map(({ ok }) => ok), [false]);
});

test('a git status that fails after the session is exit 4, with finish ok false', async () => {
  const t = withT3({ gitAfterFails: true });
  assert.equal(await run(options(), t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /could not check the tree after the session: git status failed in \/repo: index.lock exists \(t3 t3-1\)/);
  assert.deepEqual(finishes(t.adapterCalls).map(({ ok }) => ok), [false]);
});

test('files the user had already changed, and scratch files, do not count', async () => {
  const t = withT3({ gitBefore: ' M src/a.js\0?? .envrc\0', gitAfter: ' M src/a.js\0?? .envrc\0?? .workspace/x\0' });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(t.stdout(), 'FINDINGS\n');
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
