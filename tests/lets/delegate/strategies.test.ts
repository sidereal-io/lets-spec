import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STEP_INTENTS, STEP_STRATEGY_INTENTS, STRATEGIES } from '../../../lets/src/delegate/strategies.ts';

test('review is for plan or code, and sends run', () => {
  assert.deepEqual(STRATEGIES.review, { intents: ['plan', 'code'], verb: 'run' });
});

test('handoff is for apply, and sends start', () => {
  assert.deepEqual(STRATEGIES.handoff, { intents: ['apply'], verb: 'start' });
});

test('the five steps are shape, plan, review plan, build and review build', () => {
  assert.deepEqual(STEP_INTENTS, ['shape', 'plan', 'review-plan', 'build', 'review-build']);
});

test('the step strategy\'s intents are the five steps, then story', () => {
  assert.deepEqual(STEP_STRATEGY_INTENTS, [...STEP_INTENTS, 'story']);
});

test('step is for the five steps and story, and sends step', () => {
  assert.deepEqual(STRATEGIES.step, { intents: STEP_STRATEGY_INTENTS, verb: 'step' });
});
