// What lets-go's walk decides on: whether each step is done, and which
// records disagree. Pure functions of the facts lets go records read.

export const STEPS = ['plan', 'review-plan', 'build', 'review-build'] as const;
export type Step = typeof STEPS[number];

export type Done = Record<Step, boolean>;

export type Disagreement = { row: string; found: string };

export type Facts = {
  name: string;
  // The folders in openspec/changes/archive/ whose whole name is
  // <YYYY-MM-DD>-<name>, by name.
  archives: string[];
  // openspec/changes/<name>/ exists.
  changeFolder: boolean;
  // The change state openspec printed: null when it was not read, because
  // there is no change folder or there is an archive folder.
  state: string | null;
  // The schema: line of the change's .openspec.yaml, then of the first
  // archive folder's; null when neither file names one.
  changeSchema: string | null;
  // The schema: line of openspec/config.yaml, or null.
  flowSchema: string | null;
  // Review plan's answer by the rules of Check an earlier review, for a
  // change folder with no archive folder on a schema other than lets-minimal.
  reviewPlan: boolean;
};

// Each step's answer, by the first rule that matches: an archived change is
// done; with no change folder nothing is; otherwise the change state says.
export function done(facts: Facts): Done {
  if (facts.archives.length > 0) return { plan: true, 'review-plan': true, build: true, 'review-build': true };
  if (!facts.changeFolder) return { plan: false, 'review-plan': false, build: false, 'review-build': false };
  return {
    plan: facts.state === 'ready' || facts.state === 'all_done',
    'review-plan': facts.changeSchema === 'lets-minimal' || facts.reviewPlan,
    build: facts.state === 'all_done',
    'review-build': false,
  };
}

export function disagreements(_facts: Facts, _done: Done): Disagreement[] {
  return [];
}
