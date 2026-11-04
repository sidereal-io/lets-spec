// The strategies of lets delegate. A strategy fixes how a session runs: its
// options, its output, its exit codes, and the kind of session it asks for. Each
// takes the intents it serves, and the intent picks the user's guidance.
import type { Kind } from './lookup.ts';

export type Strategy = 'review' | 'handoff' | 'step';
export type Intent = 'plan' | 'code' | 'apply' | 'shape' | 'propose' | 'propose-review' | 'apply-review';

export const STRATEGIES: Record<Strategy, { intents: readonly Intent[]; verb: Kind }> = {
  // Read-only, and waits for the final message.
  review: { intents: ['plan', 'code'], verb: 'run' },
  // Interactive, and returns at once.
  handoff: { intents: ['apply'], verb: 'start' },
  // May write files, waits for the final message, and reads its step report.
  step: { intents: ['shape', 'propose', 'propose-review', 'apply', 'apply-review'], verb: 'step' },
};
