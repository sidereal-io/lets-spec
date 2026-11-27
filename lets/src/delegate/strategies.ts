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

// The guidance key each strategy reads for each of its intents: the user's
// guidance for that session sits at delegate.<key>.guidance. Typed so that
// a strategy cannot gain an intent without a key.
export const GUIDANCE_KEYS: { review: Record<ReviewIntent, string>; step: Record<StepStrategyIntent, string> } = {
  review: { 'review-plan': 'review-plan', 'review-build': 'review-build' },
  step: {
    shape: 'shape',
    plan: 'plan',
    // Until lets-go starts each reviewer itself (#354, #355), a review
    // step's own session shares the key of the step whose work it reviews.
    'review-plan': 'plan',
    build: 'build',
    'review-build': 'build',
    story: 'story',
  },
};

// Every guidance key lets reads, each once: the steps' keys, then the reviewers'.
export const GUIDANCE_KEY_NAMES: readonly string[] = [...new Set([...Object.values(GUIDANCE_KEYS.step), ...Object.values(GUIDANCE_KEYS.review)])];

// The guidance key a strategy reads for an intent, or undefined when the
// strategy does not take that intent.
export function guidanceKey(strategy: Strategy, intent: Intent): string | undefined {
  return (GUIDANCE_KEYS[strategy] as Record<string, string>)[intent];
}
