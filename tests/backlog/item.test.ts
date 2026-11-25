// lets backlog item, run as a program against a stand-in gh.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import { type Answer, backlog, fail, itemList, json, LOOKUP_ONE, REPO } from './github.ts';

const url = (n: number) => `https://github.com/${REPO}/issues/${n}`;

// gh issue view's JSON for an issue. gh prints assignees as a list, and the
// newer connections either as a list or as { nodes, totalCount }.
const issue = (number: number, extra: Record<string, unknown> = {}) => ({
  number, title: `story-${number} — outcome`, body: `body of ${number}`, url: url(number), state: 'OPEN',
  assignees: [], parent: null, blockedBy: [], subIssues: [], ...extra,
});

const projectItem = (number: number, fields: Record<string, string>, repo = REPO) => ({
  id: `PVTI_${number}`, title: '', content: { type: 'Issue', number, title: '', url: url(number), repository: repo }, ...fields,
});

// The row for gh issue view <which> …, by prefix: which is an issue number
// or URL, and a whole argument, so 136 never answers 1360.
const view = (which: string | number, answer: Answer): StandInRow => ({ args: ['issue', 'view', String(which)], prefix: true, ...answer });

const rows = (views: StandInRow[], items: unknown[]): StandInRow[] => [...LOOKUP_ONE, ...views, itemList(items)];

// lets backlog item <key>, and the JSON it printed, after checking its exit code.
async function item(t: TestContext, table: StandInRow[], key: string, code = 0) {
  const b = backlog(t, table);
  const result = await b.lets('item', key);
  assert.equal(result.code, code, result.output);
  return { out: b.json(result), calls: b.calls() };
}

test('item reads a shaped story with its Project fields, parent and blockers', async (t) => {
  const { out, calls } = await item(t, rows([
    view(136, json(issue(136, {
      parent: { id: 'I_52', number: 52, title: 'epic', url: url(52), state: 'OPEN' },
      blockedBy: { nodes: [{ id: 'I_135', number: 135, title: 'contract', url: url(135), state: 'CLOSED', repository: { nameWithOwner: REPO } }], totalCount: 1 },
    }))),
    view(url(52), json({ number: 52, title: 'backlog-providers — epic', body: '## Shared decisions\n- D1' })),
  ], [
    projectItem(136, { kind: 'Story', priority: 'Must', size: 'M', status: 'In Progress' }),
    projectItem(136, { kind: 'Chore', priority: 'Could', status: 'Todo' }, 'acme/other'),
  ]), '136');
  assert.deepEqual(out, {
    key: '136', label: '#136', title: 'story-136 — outcome', body: 'body of 136', url: url(136), state: 'OPEN',
    kind: 'Story', priority: 'Must', size: 'M', status: 'In Progress',
    assignees: [],
    blockedBy: [{ key: '135', label: '#135', title: 'contract', state: 'CLOSED', url: url(135) }],
    parent: { key: '52', label: '#52', title: 'backlog-providers — epic', url: url(52), body: '## Shared decisions\n- D1' },
    subIssues: [],
    closedSubIssues: [],
  });
  assert.deepEqual(calls[1], ['issue', 'view', '136', '--json', 'number,title,body,url,state,assignees,parent,blockedBy,subIssues']);
  assert.deepEqual(calls.at(-1), ['issue', 'view', url(52), '--json', 'number,title,body']);
});

test('item returns each assignee\'s login', async (t) => {
  const { out } = await item(t, rows([
    view(192, json(issue(192, { assignees: [{ id: 'U1', login: 'octocat', name: 'Octo' }] }))),
  ], [projectItem(192, { kind: 'Story', priority: 'Must', status: 'Todo' })]), '192');
  assert.deepEqual(out.assignees, ['octocat']);
});

test('item returns an epic\'s open sub-issues only', async (t) => {
  const { out } = await item(t, rows([
    view(52, json(issue(52, {
      subIssues: { nodes: [
        { number: 135, title: 'closed one', state: 'CLOSED', url: url(135) },
        { number: 136, title: 'open one', state: 'OPEN', url: url(136) },
        { number: 137, title: 'open two', state: 'OPEN', url: url(137) },
      ], totalCount: 3 },
    }))),
  ], [projectItem(52, { kind: 'Epic', priority: 'Must', status: 'Todo' })]), '52');
  assert.equal(out.kind, 'Epic');
  assert.deepEqual(out.subIssues, [{ key: '136', label: '#136', title: 'open one', url: url(136) }, { key: '137', label: '#137', title: 'open two', url: url(137) }]);
});

test('item returns an epic\'s closed sub-issues apart from its open ones', async (t) => {
  const { out } = await item(t, rows([
    view(52, json(issue(52, {
      subIssues: { nodes: [
        { number: 135, title: 'closed one', state: 'CLOSED', url: url(135) },
        { number: 136, title: 'open one', state: 'OPEN', url: url(136) },
      ], totalCount: 2 },
    }))),
  ], [projectItem(52, { kind: 'Epic', priority: 'Must', status: 'Todo' })]), '52');
  assert.deepEqual(out.closedSubIssues, [{ key: '135', label: '#135', title: 'closed one', url: url(135) }]);
});

test('an epic with no sub-issues returns two empty lists', async (t) => {
  const { out } = await item(t, rows([view(60, json(issue(60)))], [projectItem(60, { kind: 'Epic', priority: 'Must', status: 'Todo' })]), '60');
  assert.deepEqual([out.subIssues, out.closedSubIssues], [[], []]);
});

test('an epic whose sub-issues are all closed lists them as closed only', async (t) => {
  const { out } = await item(t, rows([
    view(61, json(issue(61, {
      subIssues: { nodes: [
        { number: 62, title: 'first', state: 'CLOSED', url: url(62) },
        { number: 63, title: 'second', state: 'CLOSED', url: url(63) },
      ], totalCount: 2 },
    }))),
  ], [projectItem(61, { kind: 'Epic', priority: 'Must', status: 'Todo' })]), '61');
  assert.deepEqual([out.subIssues, out.closedSubIssues], [[], [
    { key: '62', label: '#62', title: 'first', url: url(62) },
    { key: '63', label: '#63', title: 'second', url: url(63) },
  ]]);
});

test('an issue not on the Project has null for every Project field', async (t) => {
  const { out } = await item(t, rows([view(200, json(issue(200)))], [projectItem(7, { kind: 'Story' })]), '200');
  assert.equal(out.title, 'story-200 — outcome');
  assert.equal(out.body, 'body of 200');
  assert.deepEqual([out.kind, out.priority, out.size, out.status], [null, null, null, null]);
});

test('an unset field is null', async (t) => {
  const { out } = await item(t, rows([view(9, json(issue(9)))], [projectItem(9, { kind: 'Chore', status: 'Todo' })]), '9');
  assert.deepEqual([out.kind, out.priority, out.size, out.status], ['Chore', null, null, 'Todo']);
  assert.equal(out.parent, null);
});

test('a missing issue is not-found, and exits 1', async (t) => {
  const { out } = await item(t, [
    ...LOOKUP_ONE,
    view(99999, fail('GraphQL: Could not resolve to an issue or pull request with the number of 99999. (repository.issue)')),
  ], '99999', 1);
  assert.equal(out.error, 'not-found');
});

test('another failure of the read is backend-failed', async (t) => {
  const { out } = await item(t, [...LOOKUP_ONE, view(9, fail('HTTP 502: Bad Gateway'))], '9', 1);
  assert.deepEqual(out, { error: 'backend-failed', message: 'HTTP 502: Bad Gateway' });
});

test('item writes nothing', async (t) => {
  const { calls } = await item(t, rows([view(9, json(issue(9)))], []), '9');
  const reads = [['api', 'graphql'], ['issue', 'view'], ['issue', 'list'], ['project', 'item-list']];
  for (const call of calls) assert.ok(reads.some((read) => read.every((arg, i) => call[i] === arg)), call.join(' '));
});

test('a parent in another repository is read by its URL', async (t) => {
  const parentUrl = 'https://github.com/acme/other/issues/52';
  const { out, calls } = await item(t, rows([
    view(136, json(issue(136, { parent: { number: 52, title: 'other epic', url: parentUrl, state: 'OPEN', repository: { nameWithOwner: 'acme/other' } } }))),
    view(parentUrl, json({ number: 52, title: 'other epic', body: 'their decisions' })),
  ], [projectItem(136, { kind: 'Story' })]), '136');
  assert.deepEqual(out.parent, { key: '52', label: 'acme/other#52', title: 'other epic', url: parentUrl, body: 'their decisions' });
  assert.ok(!calls.some((call) => call[0] === 'issue' && call[1] === 'view' && call[2] === '52'), JSON.stringify(calls));
});

test('a blocker or sub-issue in another repository keeps its URL', async (t) => {
  const other = (n: number) => `https://github.com/acme/lib/issues/${n}`;
  const { out } = await item(t, rows([
    view(52, json(issue(52, {
      blockedBy: { nodes: [{ number: 7, title: 'lib fix', state: 'OPEN', url: other(7) }], totalCount: 1 },
      subIssues: { nodes: [{ number: 8, title: 'lib story', state: 'OPEN', url: other(8) }], totalCount: 1 },
    }))),
  ], [projectItem(52, { kind: 'Epic' })]), '52');
  assert.deepEqual(out.blockedBy, [{ key: '7', label: 'acme/lib#7', title: 'lib fix', state: 'OPEN', url: other(7) }]);
  assert.deepEqual(out.subIssues, [{ key: '8', label: 'acme/lib#8', title: 'lib story', url: other(8) }]);
});

test('a parent that cannot be read is backend-failed naming the parent, not not-found', async (t) => {
  const parentUrl = 'https://github.com/acme/private/issues/52';
  const { out } = await item(t, rows([
    view(136, json(issue(136, { parent: { number: 52, title: 'hidden', url: parentUrl, state: 'OPEN' } }))),
    view(parentUrl, fail('GraphQL: Could not resolve to an issue or pull request with the number of 52. (repository.issue)')),
  ], [projectItem(136, { kind: 'Story' })]), '136', 1);
  assert.equal(out.error, 'backend-failed');
  assert.ok(out.message.includes(parentUrl), out.message);
});

test('item with a key GitHub does not use is not-found, and runs no gh command', async (t) => {
  for (const key of ['PROJ-12', 'abc', '0']) {
    const { out, calls } = await item(t, [...LOOKUP_ONE], key, 1);
    assert.equal(out.error, 'not-found', key);
    assert.match(out.message, new RegExp(key), key);
    assert.deepEqual(calls, [], key);
  }
});

test('item #149 reads issue 149', async (t) => {
  const { out, calls } = await item(t, rows([view(149, json(issue(149)))], []), '#149');
  assert.equal(out.key, '149');
  assert.equal(out.label, '#149');
  assert.deepEqual(calls[1].slice(0, 3), ['issue', 'view', '149']);
});

test('a blocker in another repository on a GitHub Enterprise host is labelled with its repository', async (t) => {
  const ghe = (repo: string, n: number) => `https://acme.ghe.com/${repo}/issues/${n}`;
  const { out } = await item(t, rows([
    view(52, json(issue(52, {
      url: ghe(REPO, 52),
      blockedBy: { nodes: [{ number: 7, title: 'lib fix', state: 'OPEN', url: ghe('acme/lib', 7) }, { number: 6, title: 'own fix', state: 'OPEN', url: ghe(REPO, 6) }], totalCount: 2 },
    }))),
  ], [projectItem(52, { kind: 'Epic' })]), '52');
  assert.deepEqual(out.blockedBy.map((b: { label: string }) => b.label), ['acme/lib#7', '#6']);
});
