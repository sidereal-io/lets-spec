import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STEP_INTENTS, STRATEGIES } from '../../../lets/src/delegate/strategies.ts';

test('review is for plan or code, and sends run', () => {
  assert.deepEqual(STRATEGIES.review, { intents: ['plan', 'code'], verb: 'run' });
});

test('handoff is for apply, and sends start', () => {
  assert.deepEqual(STRATEGIES.handoff, { intents: ['apply'], verb: 'start' });
});

test('the five steps are shape, plan, review plan, build and review build', () => {
  assert.deepEqual(STEP_INTENTS, ['shape', 'plan', 'review-plan', 'build', 'review-build']);
});

test('step is for the five steps, and sends step', () => {
  assert.deepEqual(STRATEGIES.step, { intents: STEP_INTENTS, verb: 'step' });
});
