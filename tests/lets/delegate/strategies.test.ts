import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STRATEGIES } from '../../../lets/src/delegate/strategies.ts';

test('review is for plan or code, and sends run', () => {
  assert.deepEqual(STRATEGIES.review, { intents: ['plan', 'code'], verb: 'run' });
});

test('handoff is for apply, and sends start', () => {
  assert.deepEqual(STRATEGIES.handoff, { intents: ['apply'], verb: 'start' });
});

test('step is for the five steps, and sends step', () => {
  assert.deepEqual(STRATEGIES.step, { intents: ['shape', 'propose', 'propose-review', 'apply', 'apply-review'], verb: 'step' });
});
