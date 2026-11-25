// lets backlog ready, run as a program against a stand-in gh.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import { backlog, itemList, json, LOOKUP_ONE, REPO } from './github.ts';

type Spec = { number: number; priority?: string | null; kind?: string; status?: string; size?: string; repo?: string };

// A Project item as gh project item-list prints it.
const item = ({ number, priority = 'Must', kind = 'Story', status = 'Todo', size = 'S', repo = REPO }: Spec) => ({
  id: `PVTI_${number}`,
  title: `story-${number} — outcome`,
  content: { type: 'Issue', number, title: `story-${number} — outcome`, url: `https://github.com/${repo}/issues/${number}`, repository: repo, body: '' },
  kind,
  ...(priority === null ? {} : { priority }),
  size,
  status,
});

// When an issue was created: by default in the order of its number.
const createdAt = (number: number) => new Date(Date.UTC(2026, 0, 1) + number * 60_000).toISOString();

const search = (query: string, value: unknown): StandInRow => ({ args: ['issue', 'list', '--search', query], prefix: true, ...json(value) });

// The rows for a Project holding items, where free are the unassigned,
// unblocked open issues, each created at created(number).
const rows = (items: Spec[], free: number[], created: (number: number) => string = createdAt): StandInRow[] => [
  ...LOOKUP_ONE,
  itemList(items.map(item)),
  search('is:open no:assignee -is:blocked', free.map((number) => ({ number, createdAt: created(number) }))),
];

// A blockedBy node as gh issue list --json blockedBy prints it.
const blocker = (number: number, { repo = REPO, state = 'OPEN' }: { repo?: string; state?: string } = {}) => ({
  number, state, title: `story-${number} — outcome`, url: `https://github.com/${repo}/issues/${number}`,
});

type Blocked = [number, ReturnType<typeof blocker>[]][];

const withBlockers = (found: Blocked, created: (number: number) => string) =>
  found.map(([number, nodes]) => ({ number, createdAt: created(number), blockedBy: { nodes, totalCount: nodes.length } }));

// The rows for ready --met-blockers: rows(), and the search for the
// unassigned blocked open issues, each with its blockedBy nodes.
const stackRows = (items: Spec[], free: number[], blocked: Blocked, created: (number: number) => string = createdAt): StandInRow[] => [
  ...rows(items, free, created),
  search('is:open no:assignee is:blocked', withBlockers(blocked, created)),
];

// The rows for ready --started: the rows given, and the search for the open
// issues assigned to the signed-in user, each with its blockedBy nodes.
const mineRows = (base: StandInRow[], mine: Blocked, created: (number: number) => string = createdAt): StandInRow[] => [
  ...base,
  search('is:open assignee:@me', withBlockers(mine, created)),
];

// The keys lets backlog ready prints, after checking it exited 0.
async function readyKeys(t: TestContext, table: StandInRow[], ...args: string[]): Promise<string[]> {
  const b = backlog(t, table);
  const result = await b.lets('ready', ...args);
  assert.equal(result.code, 0, result.output);
  return b.json(result).issues.map((i: { key: string }) => i.key);
}

test('ready ranks Must, Should, Could, then the oldest first', async (t) => {
  const keys = await readyKeys(t, rows([
    { number: 160, priority: 'Should' }, { number: 120, priority: 'Must' }, { number: 110, priority: 'Should' }, { number: 105, priority: 'Could' },
  ], [160, 120, 110, 105]));
  assert.deepEqual(keys, ['120', '110', '160', '105']);
});

test('ready leaves out an assigned or blocked issue, a Wont, an Epic, and an issue not in Todo', async (t) => {
  const keys = await readyKeys(t, rows([
    { number: 149 }, { number: 150 }, { number: 151, priority: 'Wont' }, { number: 152, kind: 'Epic' },
    { number: 153, status: 'In Progress' }, { number: 154, priority: null }, { number: 155 },
  ], [151, 152, 153, 154, 155]));
  assert.deepEqual(keys, ['155']);
});

test('ready never lists an issue from another repository on the Project', async (t) => {
  assert.deepEqual(await readyKeys(t, rows([{ number: 1, repo: 'acme/other' }, { number: 2 }], [1, 2])), ['2']);
});

test('each ready issue carries key, label, title, url, kind, priority and size', async (t) => {
  const b = backlog(t, rows([{ number: 7, kind: 'Bug', priority: 'Should', size: 'M' }], [7]));
  const result = await b.lets('ready');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.json(result), {
    issues: [{ key: '7', label: '#7', title: 'story-7 — outcome', url: `https://github.com/${REPO}/issues/7`, kind: 'Bug', priority: 'Should', size: 'M' }],
  });
});

test('ready --only keeps only the issues named that are ready', async (t) => {
  const keys = await readyKeys(t, rows([{ number: 120 }, { number: 191 }, { number: 192 }, { number: 193 }], [120, 191, 193]), '--only', '191,192,193');
  assert.deepEqual(keys, ['191', '193']);
});

test('ready --exclude leaves out the issues named', async (t) => {
  const keys = await readyKeys(t, rows([{ number: 149 }, { number: 150 }, { number: 151 }], [149, 150, 151]), '--exclude', '149,151');
  assert.deepEqual(keys, ['150']);
});

test('ready --only and --exclude together', async (t) => {
  const keys = await readyKeys(t, rows([{ number: 191 }, { number: 192 }, { number: 193 }], [191, 192, 193]), '--only', '191,192,193', '--exclude', '191');
  assert.deepEqual(keys, ['192', '193']);
});

test('nothing ready is an empty list, and exits 0', async (t) => {
  const b = backlog(t, rows([{ number: 149 }], []));
  const result = await b.lets('ready');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.json(result), { issues: [] });
});

test('ready passes today\'s 500-item limits to gh, and writes nothing', async (t) => {
  const b = backlog(t, rows([], []));
  const result = await b.lets('ready');
  assert.equal(result.code, 0, result.output);
  const [, items, free] = b.calls();
  assert.deepEqual(items, ['project', 'item-list', '7', '--owner', 'acme', '--format', 'json', '--limit', '500']);
  assert.deepEqual(free, ['issue', 'list', '--search', 'is:open no:assignee -is:blocked', '--limit', '500', '--json', 'number,createdAt']);
  assert.equal(b.calls().length, 3);
});

test('ties break by creation time, not by number', async (t) => {
  const created: Record<number, string> = { 10: '2026-03-01T00:00:00Z', 9: '2026-02-01T00:00:00Z', 200: '2026-01-01T00:00:00Z' };
  const keys = await readyKeys(t, rows([{ number: 9 }, { number: 10 }, { number: 200 }], [9, 10, 200], (n) => created[n]));
  assert.deepEqual(keys, ['200', '9', '10']);
});

test('ready ranks ties by creation time, oldest first, across time zones', async (t) => {
  // 3 was created at 23:30 on 31 January in UTC, so before 2, though its
  // text sorts after 2's.
  const created: Record<number, string> = { 1: '2026-03-01T00:00:00Z', 2: '2026-02-01T00:00:00Z', 3: '2026-02-01T00:30:00+01:00' };
  const keys = await readyKeys(t, rows([{ number: 1 }, { number: 2 }, { number: 3 }], [1, 2, 3], (n) => created[n]));
  assert.deepEqual(keys, ['3', '2', '1']);
});

test('issues created at the same time keep the lowest number first, as listed in any order', async (t) => {
  const keys = await readyKeys(t, rows([{ number: 100 }, { number: 9 }, { number: 10 }], [9, 10, 100], () => '2026-01-01T00:00:00Z'));
  assert.deepEqual(keys, ['9', '10', '100']);
});

test('ready --only and --exclude take #<n> too, and leave out a key GitHub does not use', async (t) => {
  const keys = await readyKeys(t, rows([{ number: 191 }, { number: 192 }, { number: 193 }], [191, 192, 193]), '--only', '#191,192,PROJ-1', '--exclude', '#192');
  assert.deepEqual(keys, ['191']);
});

test('ready --met-blockers lists an issue whose only open blocker is named', async (t) => {
  const keys = await readyKeys(t, stackRows([{ number: 279, status: 'In Progress' }, { number: 280 }], [], [[280, [blocker(279)]]]), '--met-blockers', '279');
  assert.deepEqual(keys, ['280']);
});

test('ready --met-blockers runs the blocked search with the 500-item limit', async (t) => {
  const b = backlog(t, stackRows([], [], []));
  const result = await b.lets('ready', '--met-blockers', '279');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.calls()[3], ['issue', 'list', '--search', 'is:open no:assignee is:blocked', '--limit', '500', '--json', 'number,createdAt,blockedBy']);
  assert.equal(b.calls().length, 4);
});

test('ready --met-blockers ranks a stacked issue by the creation time of the blocked search', async (t) => {
  const created: Record<number, string> = { 280: '2026-01-01T00:00:00Z', 100: '2026-02-01T00:00:00Z' };
  const keys = await readyKeys(t, stackRows([{ number: 100 }, { number: 280 }], [100], [[280, [blocker(279)]]], (n) => created[n]), '--met-blockers', '279');
  assert.deepEqual(keys, ['280', '100']);
});

test('ready --met-blockers leaves out an issue with one open blocker not named', async (t) => {
  const keys = await readyKeys(t, stackRows([{ number: 281 }], [], [[281, [blocker(279), blocker(280)]]]), '--met-blockers', '279');
  assert.deepEqual(keys, []);
});

test('ready --met-blockers ignores a closed blocker', async (t) => {
  const keys = await readyKeys(t, stackRows([{ number: 281 }], [], [[281, [blocker(279), blocker(270, { state: 'CLOSED' })]]]), '--met-blockers', '279');
  assert.deepEqual(keys, ['281']);
});

test('ready --met-blockers leaves out an assigned issue that the blocked search does not return', async (t) => {
  assert.deepEqual(await readyKeys(t, stackRows([{ number: 282 }], [], []), '--met-blockers', '279'), []);
});

test('ready --met-blockers never counts a blocker in another repository as met', async (t) => {
  const keys = await readyKeys(t, stackRows([{ number: 283 }], [], [[283, [blocker(279, { repo: 'other-org/tools' })]]]), '--met-blockers', '279');
  assert.deepEqual(keys, []);
});

test('a met blocker does not skip the Status, Kind or Priority filters', async (t) => {
  const keys = await readyKeys(t, stackRows(
    [{ number: 290, status: 'In Progress' }, { number: 291, kind: 'Epic' }, { number: 292, priority: 'Wont' }],
    [],
    [[290, [blocker(279)]], [291, [blocker(279)]], [292, [blocker(279)]]],
  ), '--met-blockers', '279');
  assert.deepEqual(keys, []);
});

test('ready --started lists a started issue of the signed-in user, ranked with the others', async (t) => {
  const keys = await readyKeys(t, mineRows(rows([{ number: 282, priority: 'Should', status: 'In Progress' }, { number: 283 }], [283]), [[282, []]]), '--started', '282');
  assert.deepEqual(keys, ['283', '282']);
});

test('ready --started runs the signed-in user\'s search with the 500-item limit', async (t) => {
  const b = backlog(t, mineRows(rows([], []), []));
  const result = await b.lets('ready', '--started', '282');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(b.calls()[3], ['issue', 'list', '--search', 'is:open assignee:@me', '--limit', '500', '--json', 'number,createdAt,blockedBy']);
  assert.equal(b.calls().length, 4);
});

test('ready --started ranks a started issue by the creation time of the signed-in user\'s search', async (t) => {
  const created: Record<number, string> = { 282: '2026-01-01T00:00:00Z', 100: '2026-02-01T00:00:00Z' };
  const keys = await readyKeys(t, mineRows(rows([{ number: 100 }, { number: 282, status: 'In Progress' }], [100], (n) => created[n]), [[282, []]], (n) => created[n]), '--started', '282');
  assert.deepEqual(keys, ['282', '100']);
});

test('ready --started lists a started issue still in Todo', async (t) => {
  assert.deepEqual(await readyKeys(t, mineRows(rows([{ number: 282 }], []), [[282, []]]), '--started', '282'), ['282']);
});

test('ready --started leaves out an issue of the signed-in user that is not named, even in Todo with no blocker', async (t) => {
  assert.deepEqual(await readyKeys(t, mineRows(rows([{ number: 282 }], []), [[282, []]]), '--started', '281'), []);
});

test('ready --started leaves out a started issue with Status Done', async (t) => {
  assert.deepEqual(await readyKeys(t, mineRows(rows([{ number: 282, status: 'Done' }], []), [[282, []]]), '--started', '282'), []);
});

test('ready --started leaves out a started issue whose open blocker is not met', async (t) => {
  assert.deepEqual(await readyKeys(t, mineRows(rows([{ number: 282, status: 'In Progress' }], []), [[282, [blocker(281)]]]), '--started', '282'), []);
});

test('ready --started --met-blockers lists a started issue whose open blocker is named', async (t) => {
  const keys = await readyKeys(t, mineRows(stackRows([{ number: 282, status: 'In Progress' }], [], []), [[282, [blocker(281)]]]), '--started', '282', '--met-blockers', '281');
  assert.deepEqual(keys, ['282']);
});

test('ready --started leaves out an issue assigned only to someone else', async (t) => {
  assert.deepEqual(await readyKeys(t, mineRows(rows([{ number: 285, status: 'In Progress' }], []), []), '--started', '285'), []);
});

test('ready --started never counts a blocker in another repository as met', async (t) => {
  const keys = await readyKeys(t, mineRows(stackRows([{ number: 282, status: 'In Progress' }], [], []), [[282, [blocker(281, { repo: 'other-org/tools' })]]]), '--started', '282', '--met-blockers', '281');
  assert.deepEqual(keys, []);
});

test('ready --started still needs the Kind and Priority filters', async (t) => {
  const keys = await readyKeys(t, mineRows(rows([{ number: 290, kind: 'Epic', status: 'In Progress' }, { number: 291, priority: 'Wont', status: 'In Progress' }], []), [[290, []], [291, []]]), '--started', '290,291');
  assert.deepEqual(keys, []);
});
