// The unit tests of inAdapter: how an adapter's error is classed. The
// order in which models are tried is tested through lets, in
// tests/delegate/run.test.ts.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inAdapter } from '../../../lets/src/delegate/lookup.ts';
import { Refused, SessionFailed, SpawnError, TimeoutError, UsageError } from '../../../lets/src/resolvers/kit/errors.ts';

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
