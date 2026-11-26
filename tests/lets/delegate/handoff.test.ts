// handoff run with a fake resolver, for the 5 cases no cli or subagent
// resolver reaches: cli never starts a handoff, and subagent never refuses
// one or fails, so neither gives a handle, a refusal or another failure.
// What cli and subagent do with a handoff is tested through lets, in
// tests/delegate/run.test.ts. #306 retires handoff; whichever of it and
// this file's story merges second deletes this file.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/handoff.ts';
import { SessionFailed, SpawnError, TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const options = { name: 'Fix Login', promptFile: 'p.md', models: ['claude'] };

// commandDeps whose config lists t3, which answers, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const startModels = (calls: Calls) => calls('start').map(([, , input]) => {
  const { family, model } = input as { family: string; model: string | null };
  return model === null ? family : `${family}/${model}`;
});
const subagentAsked = (calls: Calls) => calls().some(([name]) => name === 'subagent');

test('a handoff prints the resolver and its handle as one JSON line', async () => {
  const t = withT3();
  assert.equal(await run(options, t.deps), 0);
  assert.equal(t.stdout(), '{"resolver":"t3","handle":{"kind":"t3","id":"t3-1"}}\n');
  assert.equal(t.stderr(), '');
});

test('a refused model passes to the next one on the same resolver', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra'] } } });
  assert.equal(await run({ ...options, models: ['gpt/gpt-6-astra', 'claude'] }, t.deps), 0);
  assert.deepEqual(startModels(t.adapterCalls), ['gpt/gpt-6-astra', 'claude']);
});

test('a handoff whose every model is refused is exit 3, naming each model', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra', 'claude'] } } });
  assert.equal(await run({ ...options, models: ['gpt/gpt-6-astra', 'claude'] }, t.deps), 3);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /gpt\/gpt-6-astra: refused gpt\/gpt-6-astra\nclaude: refused claude/);
});

test('a refusal never moves down the chain', async () => {
  const t = withT3({ config: 'version: 3\ndelegate: { resolvers: [t3, subagent] }\n', adapters: { t3: { refuse: ['gpt', 'claude'] } } });
  assert.equal(await run({ ...options, models: ['gpt', 'claude'] }, t.deps), 3);
  assert.equal(subagentAsked(t.adapterCalls), false, 'the default was not asked');
});

test('any other failure of the resolver is exit 4 with its message, never 5 or 6', async () => {
  for (const error of [new SessionFailed('harness said no'), new TimeoutError('harness said no'), new SpawnError('harness said no'), new Error('harness said no')]) {
    const t = withT3({ adapters: { t3: { start: error } } });
    assert.equal(await run({ ...options, models: ['claude', 'gpt'] }, t.deps), 4, error.constructor.name);
    assert.equal(t.stdout(), '');
    assert.match(t.stderr(), /harness said no/);
    assert.deepEqual(startModels(t.adapterCalls), ['claude'], 'the next model is not asked');
  }
});
