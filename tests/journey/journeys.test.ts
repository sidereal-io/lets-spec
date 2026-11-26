// Journey tests: each runs several lets commands in one temporary Git
// repository, in the order lets-go runs them, and takes each value the
// next command needs from what the last one printed. They check the joins
// between the commands, not each command: the tests beside each command
// group do that.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { itemList, issue, issueState, json, LOOKUP_ONE, REPO } from '../backlog/github.ts';
import { type DelegateRepo, delegateRepo, PROMPT } from '../delegate/repo.ts';
import { agyWrite, claudeWrite, cleanUpStep, codexWrite, ending, untilGone } from '../delegate/steps.ts';
import { agy, claude, codex, type LetsResult, sharedState, type StandInRow, standIn, tempDir } from '../support/lets.ts';
import { useRelease } from '../sync/project.ts';

const release = useRelease();
const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';

const url = (n: number) => `https://github.com/${REPO}/issues/${n}`;
const title = (n: number) => `story-${n} — outcome`;

// A story on the Project, Todo, as gh project item-list prints it.
const story = (n: number, priority: string) => ({
  id: `PVTI_${n}`, title: title(n), kind: 'Story', priority, size: 'S', status: 'Todo',
  content: { type: 'Issue', number: n, title: title(n), url: url(n), repository: REPO, body: '' },
});

// The exact call lets backlog item makes, so the row never answers the
// other issue view calls on the same issue.
const itemView = (n: number) => ['issue', 'view', String(n), '--json', 'number,title,body,url,state,assignees,parent,blockedBy,subIssues'];

// gh issue view's JSON for an open issue with no assignee, parent or blocker.
const viewed = (n: number, extra: Record<string, unknown> = {}) => ({
  number: n, title: title(n), body: `body of ${n}`, url: url(n), state: 'OPEN', assignees: [], parent: null, blockedBy: [], subIssues: [], ...extra,
});

// The stand-in gh of the story journey: two stories ready, 149 (Must) and
// 150 (Should), and 149 the stand-in issue that claim writes to.
const STORY_GH: StandInRow[] = [
  ...LOOKUP_ONE,
  itemList([story(149, 'Must'), story(150, 'Should')]),
  { args: ['issue', 'list', '--search', 'is:open no:assignee -is:blocked'], prefix: true, ...json([149, 150].map((n) => ({ number: n, createdAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString() }))) },
  { args: itemView(149), ...json(viewed(149)) },
  issue({ number: 149 }),
];

// A final message whose step report is done, with evidence naming what.
const done = (what: string) => ending(`outcome: done\nevidence:\n  - "${what}"\n`);

/** What `lets delegate step wait` prints when one of its steps ends. */
interface Ended {
  name: string;
  exit: number;
}

/**
 * Checks that `lets <command>` exited `code` (0 when absent). Needs the
 * `result` of that command and the words after `lets`, to name it.
 * Throws an assertion error, holding the command and all it printed,
 * when it did not.
 */
function exited(result: LetsResult, command: string, code = 0): void {
  assert.equal(result.code, code, `lets ${command} exited ${result.code}:\n${result.output}`);
}

/**
 * The one JSON value `lets <command>` printed on stdout. Needs the
 * `result` of that command and the words after `lets`, to name it.
 * Throws an assertion error, holding the command and all it printed,
 * when it exited other than `code` (0 when absent) or when stdout is not
 * exactly one line of JSON.
 */
function printed(result: LetsResult, command: string, code = 0): any {
  exited(result, command, code);
  assert.match(result.stdout, /^[^\n]+\n$/, `lets ${command} printed other than one line on stdout:\n${result.output}`);
  return JSON.parse(result.stdout);
}

/**
 * The session name lets-go gives an item: the text of its `title` before
 * ` — `, then `-<step>`, so `story-149 — outcome` and `plan` give
 * `story-149-plan`. Throws when the title holds no ` — `.
 */
function sessionName(title: string, step: string): string {
  const at = title.indexOf(' — ');
  if (at === -1) throw new Error(`the title ${JSON.stringify(title)} holds no " — ", so it names no session`);
  return `${title.slice(0, at)}-${step}`;
}

/**
 * Runs `lets delegate step wait` in `repo` with a `--name` for each of
 * `names` still running, again and again, until none is, as lets-go
 * does. Returns what each run printed, in the order the steps ended.
 * Throws an assertion error, holding the output, when a run exits other
 * than 0 or names a step that was not still running.
 */
async function waitForAll(repo: DelegateRepo, names: string[]): Promise<Ended[]> {
  throw new Error('not built yet');
}

test('the story journey: sync, then ready, item and claim, then a plan step on the models instructions lists', async (t) => {
  const repo = delegateRepo(t, { user: CLI });
  standIn(repo.standIns, 'openspec', [{ args: ['--version'], stdout: '1.3.0\n' }]);
  // lets sync finds no release without it.
  const env = { WORKFLOW_RELEASE: release() };

  exited(await repo.run(['sync'], { env }), 'sync');
  exited(await repo.run(['sync', '--check'], { env }), 'sync --check');

  const shared = sharedState(join(tempDir(t), 'gh-state'), issueState());
  standIn(repo.standIns, 'gh', STORY_GH, { shared });
  const { key } = printed(await repo.run(['backlog', 'ready']), 'backlog ready').issues[0];
  assert.equal(key, '149');
  const item = printed(await repo.run(['backlog', 'item', key]), `backlog item ${key}`);
  assert.equal(item.title, title(149));
  const claimed = printed(await repo.run(['backlog', 'claim', item.key]), `backlog claim ${item.key}`);
  assert.equal(claimed.result, 'claimed', JSON.stringify(claimed));
  assert.equal(typeof claimed.claim, 'string', JSON.stringify(claimed));

  const state = shared.read();
  assert.deepEqual(state.assignees, ['octocat']);
  assert.deepEqual(state.status, ['In Progress']);
  const claims = state.pages.flat().filter((comment: { body: string }) => comment.body.includes('Token: '));
  assert.deepEqual(claims.map((comment: { body: string }) => comment.body.split('Token: ')[1]), [claimed.claim]);

  // Each CLI answers only the write-mode call with the model its listing
  // gives, so other options, or another order, find no row. codex and
  // claude refuse, by exiting 1 having printed nothing, and agy answers.
  const session = sessionName(item.title, 'plan');
  const writes = {
    codex: codexWrite(repo.cwd, { model: 'gpt-6-luna', name: session }),
    claude: claudeWrite(),
    agy: agyWrite('high', '120m', PROMPT, 'gemini-3.8-flash-high'),
  };
  const clis = {
    codex: codex(repo.standIns, [{ slug: 'gpt-6-luna', visibility: 'list' }], { rows: [{ args: writes.codex, code: 1 }] }),
    claude: claude(repo.standIns, { rows: [{ args: writes.claude, code: 1 }] }),
    agy: agy(repo.standIns, ['gemini-3.8-flash-high'], { rows: [{ args: writes.agy, stdout: done(`plan of ${item.key}`) }] }),
  };
  const { options } = printed(await repo.run(['delegate', 'step', 'instructions', '--for', 'plan']), 'delegate step instructions --for plan');
  const step = ['delegate', 'step', 'run', '--for', 'plan', '--name', session, '--prompt-file', 'p.md', '--effort', 'high',
    ...options.flatMap((model: string) => ['--model', model])];
  const ran = await repo.run(step);
  assert.equal(printed(ran, step.join(' ')).outcome, 'done');
  assert.equal(JSON.parse(ran.stderr.trim().split('\n').at(-1)!).family, 'gemini', ran.stderr);

  assert.deepEqual(clis.codex.calls(), [['debug', 'models'], writes.codex]);
  assert.deepEqual(clis.claude.calls(), [writes.claude]);
  assert.deepEqual(clis.agy.calls(), [['models'], writes.agy]);
});
