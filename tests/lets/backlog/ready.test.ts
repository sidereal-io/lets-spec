import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Row } from './fixtures/fake-gh.ts';
import { backlogDeps, json, LOOKUP_ONE, REPO } from './fixtures/fake-gh.ts';

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

// The rows for a Project holding items, where free are the unassigned,
// unblocked open issues.
const rows = (items: Spec[], free: number[]): Row[] => [
  ...LOOKUP_ONE,
  ['project item-list', json({ items: items.map(item), totalCount: items.length })],
  ['issue list --search is:open no:assignee -is:blocked', json(free.map((number) => ({ number })))],
];

const keys = (t: ReturnType<typeof backlogDeps>) => t.json().issues.map((i: { key: string }) => i.key);

test('ready ranks Must, Should, Could, then the lowest number', async () => {
  const t = backlogDeps(rows([
    { number: 160, priority: 'Should' }, { number: 120, priority: 'Must' }, { number: 110, priority: 'Should' }, { number: 105, priority: 'Could' },
  ], [160, 120, 110, 105]));
  assert.equal(await run(['ready'], t.deps), 0);
  assert.deepEqual(keys(t), ['120', '110', '160', '105']);
});

test('ready leaves out an assigned or blocked issue, a Wont, an Epic, and an issue not in Todo', async () => {
  const t = backlogDeps(rows([
    { number: 149 }, { number: 150 }, { number: 151, priority: 'Wont' }, { number: 152, kind: 'Epic' },
    { number: 153, status: 'In Progress' }, { number: 154, priority: null }, { number: 155 },
  ], [151, 152, 153, 154, 155]));
  await run(['ready'], t.deps);
  assert.deepEqual(keys(t), ['155']);
});

test('ready never lists an issue from another repository on the Project', async () => {
  const t = backlogDeps(rows([{ number: 1, repo: 'acme/other' }, { number: 2 }], [1, 2]));
  await run(['ready'], t.deps);
  assert.deepEqual(keys(t), ['2']);
});

test('each ready issue carries key, label, title, url, kind, priority and size', async () => {
  const t = backlogDeps(rows([{ number: 7, kind: 'Bug', priority: 'Should', size: 'M' }], [7]));
  await run(['ready'], t.deps);
  assert.deepEqual(t.json(), {
    issues: [{ key: '7', label: '#7', title: 'story-7 — outcome', url: `https://github.com/${REPO}/issues/7`, kind: 'Bug', priority: 'Should', size: 'M' }],
  });
});

test('ready --only keeps only the issues named that are ready', async () => {
  const t = backlogDeps(rows([{ number: 120 }, { number: 191 }, { number: 192 }, { number: 193 }], [120, 191, 193]));
  await run(['ready', '--only', '191,192,193'], t.deps);
  assert.deepEqual(keys(t), ['191', '193']);
});

test('ready --exclude leaves out the issues named', async () => {
  const t = backlogDeps(rows([{ number: 149 }, { number: 150 }, { number: 151 }], [149, 150, 151]));
  await run(['ready', '--exclude', '149,151'], t.deps);
  assert.deepEqual(keys(t), ['150']);
});

test('ready --only and --exclude together', async () => {
  const t = backlogDeps(rows([{ number: 191 }, { number: 192 }, { number: 193 }], [191, 192, 193]));
  await run(['ready', '--only', '191,192,193', '--exclude', '191'], t.deps);
  assert.deepEqual(keys(t), ['192', '193']);
});

test('nothing ready is an empty list, and exits 0', async () => {
  const t = backlogDeps(rows([{ number: 149 }], []));
  assert.equal(await run(['ready'], t.deps), 0);
  assert.deepEqual(t.json(), { issues: [] });
});

test('ready passes today\'s 500-item limits to gh, and writes nothing', async () => {
  const t = backlogDeps(rows([], []));
  await run(['ready'], t.deps);
  const [, items, free] = t.calls();
  assert.deepEqual(items, ['project', 'item-list', '7', '--owner', 'acme', '--format', 'json', '--limit', '500']);
  assert.deepEqual(free, ['issue', 'list', '--search', 'is:open no:assignee -is:blocked', '--limit', '500', '--json', 'number']);
  assert.equal(t.calls().length, 3);
});
