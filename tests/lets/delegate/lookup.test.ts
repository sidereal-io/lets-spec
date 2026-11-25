import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Config, ResolverName } from '../../../lets/src/delegate/config.ts';
import { inAdapter, pick, withModels } from '../../../lets/src/delegate/lookup.ts';
import { Refused, SessionFailed, SpawnError, TimeoutError, UsageError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, CONFIG } from './fixtures/command-deps.ts';
import type { FakeResolver } from './fixtures/command-deps.ts';

// A config whose chain is resolvers.
const listing = (...resolvers: ResolverName[]): Config => ({ version: 3, delegate: { resolvers } });
// Lookup deps with these fake adapters, and this config.
function lookup(adapters: Partial<Record<ResolverName, FakeResolver>>, config: Config | null) {
  const t = commandDeps({ adapters });
  return { t, deps: { ...t.deps, config, fileOf: () => CONFIG } };
}

// withModels over models, with answer for each; tried lists the models
// it was asked for, in order.
function tryModels(models: string[], answer: (model: string) => Promise<string>) {
  const tried: string[] = [];
  const result = withModels(models, async (model) => {
    tried.push(model);
    return answer(model);
  });
  return { result, tried };
}

test('withModels asks only for the first model when it is not refused', async () => {
  const { result, tried } = tryModels(['gpt', 'gemini'], async () => 'ran');
  assert.deepEqual(await result, { value: 'ran', model: 'gpt' });
  assert.deepEqual(tried, ['gpt']);
});

test('withModels asks for the next model on a refusal', async () => {
  const { result, tried } = tryModels(['gpt/gpt-6-astra', 'gemini'], async (model) => {
    if (model === 'gpt/gpt-6-astra') throw new Refused('no tokens');
    return 'ran';
  });
  assert.deepEqual(await result, { value: 'ran', model: 'gemini' });
  assert.deepEqual(tried, ['gpt/gpt-6-astra', 'gemini']);
});

test('withModels stops at the first failure that is not a refusal', async () => {
  const { result, tried } = tryModels(['gpt', 'claude', 'gemini'], async (model) => {
    throw model === 'gpt' ? new Refused('no') : new SessionFailed('broke');
  });
  await assert.rejects(result, SessionFailed);
  assert.deepEqual(tried, ['gpt', 'claude']);
});

test('when every model is refused, one Refused names each model and why', async () => {
  const { result } = tryModels(['gpt/gpt-6-astra', 'gemini'], async (model) => {
    throw new Refused(`refused ${model}`);
  });
  await assert.rejects(result, (error) => error instanceof Refused
    && error.message === 'gpt/gpt-6-astra: refused gpt/gpt-6-astra\ngemini: refused gemini');
});

test('an error lets does not know, thrown inside an adapter, is a SpawnError with its message', async () => {
  await assert.rejects(inAdapter(async () => {
    throw new Error('boom');
  }), (error) => error instanceof SpawnError && error.message === 'boom');
  await assert.rejects(inAdapter(async () => {
    throw 'not an error';
  }), (error) => error instanceof SpawnError && error.message === 'not an error');
});

test('a known error thrown inside an adapter keeps its class', async () => {
  for (const known of [new Refused('r'), new SessionFailed('s'), new TimeoutError('t'), new UsageError('u')]) {
    await assert.rejects(inAdapter(async () => {
      throw known;
    }), (error) => error === known);
  }
});

test('an adapter whose detect throws is a SpawnError', async () => {
  const { deps } = lookup({}, listing('t3'));
  deps.resolvers.t3.detect = () => {
    throw new Error('no /proc');
  };
  await assert.rejects(pick('run', deps), (error) => error instanceof SpawnError && error.message === 'no /proc');
});
