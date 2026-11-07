import type { ERRORS } from './protocol.ts';
export type ErrorCategory = (typeof ERRORS)[number];
/** Structured failures remain inspectable across process and recovery helpers. */
export class AdapterFailure extends Error {
  category: ErrorCategory;
  effects: 'none' | 'partial' | 'unknown';
  constructor(category: ErrorCategory, effects: AdapterFailure['effects'], message: string) {
    super(`${category}: ${message}`);
    this.name = 'AdapterFailure';
    this.category = category;
    this.effects = effects;
  }
}

/** Produced only after validating protected, immutable non-dispatch evidence. */
export class NonDispatchFailure extends AdapterFailure {
  constructor() { super('invalid_configuration', 'none', 'trusted runner cancelled or rejected the action before dispatch'); }
}
