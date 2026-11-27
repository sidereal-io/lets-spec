// The strategies of lets delegate. A strategy fixes how a session runs: its
// options, its output, its exit codes, and the kind of session it asks for. Each
// takes the intents it serves, and the intent picks the user's guidance.
import type { Kind } from './lookup.ts';

export type Strategy = 'review' | 'step';
// The five steps, in the order they run.
export const STEP_INTENTS = ['shape', 'plan', 'review-plan', 'build', 'review-build'] as const;
// The step strategy's intents: the five steps, then story, which runs a
// story run in a child lets-go session. A story run is not a step.
export const STEP_STRATEGY_INTENTS = [...STEP_INTENTS, 'story'] as const;
export type StepStrategyIntent = (typeof STEP_STRATEGY_INTENTS)[number];
// The review strategy's intents: the two review steps whose read-only
// reviewer it starts.
export const REVIEW_INTENTS = ['review-plan', 'review-build'] as const;
export type ReviewIntent = (typeof REVIEW_INTENTS)[number];
export type Intent = ReviewIntent | StepStrategyIntent;

export const STRATEGIES: Record<Strategy, { intents: readonly Intent[]; verb: Kind }> = {
  // Read-only, and waits for the final message.
  review: { intents: REVIEW_INTENTS, verb: 'run' },
  // May write files, waits for the final message, and reads its step report.
  step: { intents: STEP_STRATEGY_INTENTS, verb: 'step' },
};
