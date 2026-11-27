// The intents of lets delegate: what a session is for. The intent alone
// decides the kind of session asked for, and picks the user's guidance.
import type { Kind } from './lookup.ts';

// The five steps, in the order they run.
export const STEP_INTENTS = ['shape', 'plan', 'review-plan', 'build', 'review-build'] as const;
// Every intent: the five steps, then story, which runs a story run in a
// child lets-go session. A story run is not a step.
export const INTENTS = [...STEP_INTENTS, 'story'] as const;
export type Intent = (typeof INTENTS)[number];
// The intents that start a reviewer: a read-only session that reviews a
// plan or a branch's code.
export const REVIEWER_INTENTS = ['review-plan', 'review-build'] as const;
export type ReviewerIntent = (typeof REVIEWER_INTENTS)[number];

export const isReviewer = (intent: Intent): intent is ReviewerIntent => (REVIEWER_INTENTS as readonly string[]).includes(intent);
// A reviewer asks for a read-only session; every other intent for one that
// may write files.
export const kindFor = (intent: Intent): Kind => (isReviewer(intent) ? 'run' : 'step');

// The guidance key each intent reads: the user's guidance for that session
// sits at delegate.<key>.guidance. A table, not a rule, so the help text and
// the README's contract test read the keys from one place.
export const GUIDANCE_KEYS: Record<Intent, string> = {
  shape: 'shape',
  plan: 'plan',
  'review-plan': 'review-plan',
  build: 'build',
  'review-build': 'review-build',
  story: 'story',
};

// Every guidance key lets reads, each once.
export const GUIDANCE_KEY_NAMES: readonly string[] = [...new Set(Object.values(GUIDANCE_KEYS))];
