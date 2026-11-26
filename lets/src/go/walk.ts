// What lets-go's walk decides on: whether each step is done, and which
// records disagree. Pure functions of the facts lets go records read.

export const STEPS = ['plan', 'review-plan', 'build', 'review-build'] as const;
export type Step = typeof STEPS[number];

export type Done = Record<Step, boolean>;

export type Disagreement = { row: string; found: string };

export type Facts = {
  name: string;
  // The paths git status lists outside .workspace/.
  dirty: string[];
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
  // The branch's pull request, or null when it has none. planReview: the
  // body has a Plan review section with a Reviewed: and a - **Verdict:** line.
  pr: { isDraft: boolean; codeReview: boolean; planReview: boolean } | null;
  // HEAD's tree holds openspec/changes/<name>/brainstorm.md.
  brainstorm: boolean;
  // Each step's record is not null.
  recorded: Record<Step, boolean>;
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

// The rows of lets-go's Records that disagree that match, in the table's
// order. A branch that has diverged from origin is not here: lets-go finds
// it when it fast-forwards the branch.
export function disagreements(facts: Facts, answers: Done): Disagreement[] {
  const { name, pr } = facts;
  const change = `openspec/changes/${name}/`;
  const archived = facts.archives.length > 0;
  const minimal = facts.changeSchema === 'lets-minimal';
  const found: Disagreement[] = [];
  const add = (row: string, things: string[]) => {
    if (things.length > 0) found.push({ row, found: things.join(', ') });
  };
  add('dirty-tree', facts.dirty);
  if (archived && facts.changeFolder) add('change-and-archive', [change, ...facts.archives.map((folder) => `openspec/changes/archive/${folder}/`)]);
  if (archived) {
    if (pr === null) add('archive-not-ready', ['no pull request']);
    else add('archive-not-ready', [
      ...(pr.isDraft ? ['isDraft: true'] : []),
      ...(facts.flowSchema === 'lets-standard' && !pr.codeReview ? ['no Code review section'] : []),
    ]);
  }
  if (facts.brainstorm && pr === null) add('brainstorm-without-pull-request', [`${change}brainstorm.md`]);
  const noPlanReview = archived && !minimal && (pr === null || !pr.planReview);
  if (noPlanReview) add('archive-without-plan-review', ['no Plan review section']);
  // On lets-minimal, review plan never runs, so it leaves no record.
  const skip = (step: Step) => step === 'review-plan' && (minimal || noPlanReview);
  add('null-record', STEPS.filter((step) => answers[step] && !facts.recorded[step] && !skip(step)));
  return found;
}
