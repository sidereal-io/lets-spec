// Review plan's done answer. The rule is lets-review-plan's Check an earlier
// review, and the skill's text stays the rule (ADR-031): this applies it
// mechanically, and never judges whether a fix's diff makes the change.
// tests/contracts/review-plan-rule.test.ts fails when the skill's text
// drops a string this code depends on.
import { type Exec, failed, type Run } from './read.ts';

export type PlanReview = {
  // The Reviewed: value and the - **Verdict:** value, as written.
  sha: string;
  verdict: string;
  // How many items the **Required changes** list holds.
  required: number;
  // The hash each fix item of the **Rebuttals** list names, as written.
  fixes: string[];
};

const ITEM = /^\s*\d+\.\s/;
const FIX_ITEM = /^\s*\d+\.\s+Fixed in ([0-9a-f]{4,40}):/;

// The body's ## Plan review section, up to the next ## line, or null when
// its Reviewed: or - **Verdict:** line is missing or empty. A Reviewed:
// line in any other section, such as Code review, is never read.
export function planReview(body: string): PlanReview | null {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trimEnd() === '## Plan review');
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  const section = lines.slice(start + 1, end === -1 ? undefined : end);
  const value = (prefix: string) => section.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim() || null;
  const sha = value('Reviewed: ');
  const verdict = value('- **Verdict:** ');
  if (sha === null || verdict === null) return null;
  const required = items(section, '- **Required changes:**').length;
  const fixes = items(section, '- **Rebuttals:**').flatMap((line) => FIX_ITEM.exec(line)?.[1] ?? []);
  return { sha, verdict, required, fixes };
}

// The items of the list that follows the line that starts heading, up to
// the next - ** line or the end of the section.
function items(section: string[], heading: string): string[] {
  const start = section.findIndex((line) => line.startsWith(heading));
  if (start === -1) return [];
  const rest = section.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('- **'));
  return rest.slice(0, end === -1 ? undefined : end).filter((line) => ITEM.test(line));
}

// The full hash of the commit rev names, or null when git finds none.
// --quiet makes a missing commit exit 1 with no output; a timeout or a
// signal also exits 1, and is a failed read, not a missing commit.
export async function resolveCommit(git: Exec, rev: string): Promise<string | null> {
  const found = await git('git', ['rev-parse', '--verify', '--quiet', '--end-of-options', `${rev}^{commit}`]);
  const missing = found.code === 1 && !found.timedOut && !found.signal && found.stdout.trim() === '' && found.stderr.trim() === '';
  if (missing) return null;
  if (found.code !== 0) throw failed('git rev-parse', found);
  return found.stdout.trim();
}

export type ReviewPlanInput = {
  name: string;
  review: PlanReview | null;
  // The full hash of the reviewed commit, or null when the review-plan
  // record is null.
  oid: string | null;
  // HEAD's tree holds openspec/changes/<name>/tasks.md.
  tasksInHead: boolean;
};

// Whether review plan is done, for a change folder with no archive folder
// on a schema other than lets-minimal: false at the first rule that fails.
export async function reviewPlanDone(git: Exec, run: Run, input: ReviewPlanInput): Promise<boolean> {
  const { name, review, oid } = input;
  // Rule 1: a review-plan record.
  if (review === null || oid === null) return false;
  // Rule 2.
  if (review.verdict !== 'APPROVE' && review.verdict !== 'APPROVE_WITH_CHANGES') return false;
  // Rule 3: git merge-base --is-ancestor <sha> HEAD.
  const ancestor = await git('git', ['merge-base', '--is-ancestor', oid, 'HEAD']);
  if (ancestor.code === 1 && !ancestor.timedOut && !ancestor.signal) return false;
  if (ancestor.code !== 0) throw failed('git merge-base', ancestor);
  // Rule 4: each commit after the review that changes the plan is a fix.
  const plan = [`openspec/changes/${name}/`, 'docs/decisions/'];
  const tasks = `openspec/changes/${name}/tasks.md`;
  const log = async (exclude: boolean) => (await run('git', ['log', '--format=%H', `${oid}..HEAD`, '--', ...plan, ...(exclude ? [`:(exclude)${tasks}`] : [])]))
    .split('\n').filter((line) => line !== '');
  // Once a task is ticked, each task's commit ticks tasks.md, and a tick
  // does not change the plan. The build record is not the test: a planning
  // commit that edits tasks.md sets it before any task is ticked.
  const ticked = input.tasksInHead && /^\s*- \[x\] /m.test(await run('git', ['cat-file', 'blob', `HEAD:${tasks}`]));
  const changed = await log(ticked);
  const fixes = await Promise.all(review.fixes.map(async (hex) => {
    const fix = await resolveCommit(git, hex);
    return fix !== null && await onlyPlan(git, run, fix, plan) ? fix : null;
  }));
  const named = new Set(fixes.filter((fix) => fix !== null));
  if (!changed.every((commit) => named.has(commit))) return false;
  return true;
}

// Whether commit changes only paths under plan. --no-renames, so a move out
// of the plan folders lists its old and its new path. A fix is never a root
// commit, so one with no parent is not a fix.
async function onlyPlan(git: Exec, run: Run, commit: string, plan: string[]): Promise<boolean> {
  const parent = await resolveCommit(git, `${commit}^`);
  if (parent === null) return false;
  const paths = (await run('git', ['diff', '--name-only', '--no-renames', '-z', parent, commit])).split('\0').filter((path) => path !== '');
  return paths.every((path) => plan.some((folder) => path.startsWith(folder)));
}
