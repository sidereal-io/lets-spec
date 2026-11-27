// Journey tests: each runs several lets commands in one temporary Git
// repository, in the order lets-go runs them, and takes each value the
// next command needs from what the last one printed. They check the joins
// between the commands, not each command: the tests beside each command
// group do that.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemList, issue, issueState, json, LOOKUP_ONE, REPO } from '../backlog/github.ts';
import { type DelegateRepo, delegateRepo, PROMPT } from '../delegate/repo.ts';
import { agyWrite, assertClockDate, claudeWrite, cleanUpStep, codexWrite, ending, stepRun, stepStart, untilGone } from '../delegate/steps.ts';
import { agy, claude, codex, type LetsResult, sharedState, type StandInReply, type StandInRow, standIn, tempDir } from '../support/lets.ts';
import { useRelease } from '../sync/project.ts';

const release = useRelease();
const TRIED_MODULE = fileURLToPath(new URL('./tried.ts', import.meta.url));
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

// gh issue view's JSON for a story whose Relevant code names path, as
// lets backlog waves reads it.
const waveStory = (n: number, path: string, blockedBy: number[] = []): StandInRow => ({
  args: ['issue', 'view', String(n)], prefix: true, ...json(viewed(n, {
    body: `## Context\n\n- **Relevant code**: \`${path}\` (*a section*)\n`,
    blockedBy: blockedBy.map((b) => ({ number: b, title: title(b), state: 'OPEN', url: url(b), repository: { nameWithOwner: REPO } })),
  })),
});

// The stand-in gh of the epic-wave journey: epic 52, whose open stories
// are 53, 54 and 55. 53 and 54 touch different code, and 55 is blocked by
// 53, so the first wave is 53 and 54.
const EPIC_GH: StandInRow[] = [
  ...LOOKUP_ONE,
  itemList([{ ...story(52, 'Must'), kind: 'Epic' }]),
  { args: itemView(52), ...json(viewed(52, {
    subIssues: { nodes: [53, 54, 55].map((n) => ({ number: n, title: title(n), state: 'OPEN', url: url(n) })), totalCount: 3 },
  })) },
  waveStory(53, 'lets/src/one.ts'),
  waveStory(54, 'lets/src/two.ts'),
  waveStory(55, 'lets/src/three.ts', [53]),
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
  const ended: Ended[] = [];
  let running = [...names];
  while (running.length > 0) {
    const args = ['delegate', 'step', 'wait', ...running.flatMap((name) => ['--name', name])];
    const one: Ended = printed(await repo.run(args), args.join(' '));
    assert.ok(running.includes(one.name), `lets ${args.join(' ')} named ${one.name}, which was not still running`);
    ended.push(one);
    running = running.filter((name) => name !== one.name);
  }
  return ended;
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
  // gives. A call with another model finds no row and exits 127, which
  // lets takes as a refusal, so the calls checks below catch it. codex and
  // claude refuse, by exiting 1 having printed nothing, and agy answers.
  // Each write notes its family in one shared state, which shows the
  // order the CLIs were tried in.
  const session = sessionName(item.title, 'plan');
  const writes = {
    codex: codexWrite(repo.cwd, { model: 'gpt-6-luna', name: session }),
    claude: claudeWrite(),
    agy: agyWrite('high', '120m', PROMPT, 'gemini-3.8-flash-high'),
  };
  const order = sharedState(join(tempDir(t), 'cli-state'));
  const noting = (args: string[], family: string, reply: StandInReply): StandInRow => ({
    args, answer: { module: TRIED_MODULE, name: 'noteFamily', data: { family, reply } },
  });
  const clis = {
    codex: codex(repo.standIns, [{ slug: 'gpt-6-luna', visibility: 'list' }], { rows: [noting(writes.codex, 'gpt', { code: 1 })], shared: order }),
    claude: claude(repo.standIns, { rows: [noting(writes.claude, 'claude', { code: 1 })], shared: order }),
    agy: agy(repo.standIns, ['gemini-3.8-flash-high'], { rows: [noting(writes.agy, 'gemini', { stdout: done(`plan of ${item.key}`) })], shared: order }),
  };
  const { options } = printed(await repo.run(['delegate', 'step', 'instructions', '--for', 'plan']), 'delegate step instructions --for plan');
  const step = stepRun({ for: 'plan', name: session, promptFile: 'p.md', effort: 'high', models: options });
  const ran = await repo.run(step);
  assert.equal(printed(ran, step.join(' ')).outcome, 'done');
  assert.equal(JSON.parse(ran.stderr.trim().split('\n').at(-1)!).family, 'gemini', ran.stderr);

  assert.deepEqual(clis.codex.calls(), [['debug', 'models'], writes.codex]);
  assert.deepEqual(clis.claude.calls(), [writes.claude]);
  assert.deepEqual(clis.agy.calls(), [['models'], writes.agy]);
  assert.deepEqual(order.read().tried, options.map((option: string) => option.split('/')[0]));
});

test('the subagent journey: step run with no config exits 3 and saves the prompt, then step read reads the subagent\'s message', async (t) => {
  const repo = delegateRepo(t);
  const session = 'story-149-build';
  const step = stepRun({ for: 'build', name: session });
  const refused = await repo.run(step);
  exited(refused, step.join(' '), 3);
  assert.equal(refused.stdout, '');
  assert.match(refused.stderr, /lets delegate step read/);
  // The subagent runs the prompt that stderr names.
  const saved = /(\.workspace\/lets-delegate\/\S+\.prompt\.md)/.exec(refused.stderr)?.[1];
  assert.ok(saved !== undefined, `stderr names no saved prompt:\n${refused.stderr}`);
  assert.equal(readFileSync(join(repo.cwd, saved), 'utf8'), PROMPT);

  // lets-go saves the subagent's final message, then has lets read it.
  const message = join('.workspace', 'lets-go', `${session}-message.md`);
  mkdirSync(join(repo.cwd, '.workspace', 'lets-go'), { recursive: true });
  writeFileSync(join(repo.cwd, message), `Built it.\n\n${done('commit 3f2a1c0')}`);
  const args = ['delegate', 'step', 'read', '--message-file', message];
  const before = Date.now();
  const read = await repo.run(args);
  const after = Date.now();
  const { date, ...report } = printed(read, args.join(' '));
  assert.deepEqual(report, { outcome: 'done', evidence: ['commit 3f2a1c0'] });
  assertClockDate(date, before, after);
  assert.equal(read.stderr, '');
});

test('the epic-wave journey: item and waves, then a story run for each story of the first wave, waited on', async (t) => {
  const repo = delegateRepo(t, { user: CLI });
  standIn(repo.standIns, 'gh', EPIC_GH);

  const epic = printed(await repo.run(['backlog', 'item', '52']), 'backlog item 52');
  const keys = epic.subIssues.map((sub: { key: string }) => sub.key);
  assert.deepEqual(keys, ['53', '54', '55']);
  const only = keys.join(',');
  const { waves } = printed(await repo.run(['backlog', 'waves', '--only', only]), `backlog waves --only ${only}`);
  const wave = waves[0].stories.map((s: { key: string }) => s.key);
  assert.deepEqual(wave, ['53', '54']);

  // codex answers each story's session, told apart by the file its last
  // message goes to.
  const titles = new Map<string, string>(epic.subIssues.map((sub: { key: string; title: string }) => [sub.key, sub.title]));
  const sessions = wave.map((key: string) => ({ key, name: sessionName(titles.get(key)!, 'story') }));
  codex(repo.standIns, [], { rows: sessions.map(({ key, name }: { key: string; name: string }) => ({
    args: codexWrite(repo.cwd, { name }),
    files: { [join(repo.cwd, '.workspace', 'lets-delegate', `${name}.last-message.md`)]: done(`story ${key}`) },
  })) });

  const started: { key: string; name: string; pid: number }[] = [];
  for (const { key, name } of sessions) {
    const args = stepStart({ for: 'story', name, models: ['gpt'], reportFile: `${name}-report.json`, metaFile: `${name}-meta.txt` });
    const result = await repo.run(args);
    const step = printed(result, args.join(' '));
    // Before any assertion, so a failing test still stops the step.
    if (typeof step.pid === 'number') cleanUpStep(t, step.pid);
    assert.equal(typeof step.pid, 'number', result.output);
    started.push({ key, name: step.name, pid: step.pid });
  }

  const ended = await waitForAll(repo, started.map(({ name }) => name));
  const byName = (a: Ended, b: Ended) => a.name.localeCompare(b.name);
  assert.deepEqual(ended.sort(byName), started.map(({ name }) => ({ name, exit: 0 })).sort(byName));
  for (const { key, name } of started) {
    const text = readFileSync(join(repo.cwd, `${name}-report.json`), 'utf8');
    assert.match(text, /^[^\n]+\n$/, `the report file of ${name} holds other than one line:\n${text}`);
    const report = JSON.parse(text);
    assert.equal(report.outcome, 'done', text);
    assert.deepEqual(report.evidence, [`story ${key}`], text);
  }
  for (const { pid } of started) await untilGone(pid);
});
