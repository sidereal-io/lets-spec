// What lets-go's walk decides on: whether each step is done, and which
// records disagree. Pure functions of the facts lets go records read.

export const STEPS = ['plan', 'review-plan', 'build', 'review-build'] as const;
export type Step = typeof STEPS[number];

export type Done = Record<Step, boolean>;

export type Disagreement = { row: string; found: string };

export type Facts = {
  name: string;
};

export function done(_facts: Facts): Done {
  return { plan: false, 'review-plan': false, build: false, 'review-build': false };
}

export function disagreements(_facts: Facts, _done: Done): Disagreement[] {
  return [];
}
