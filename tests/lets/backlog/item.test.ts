import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/backlog/commands.ts';
import type { Row } from './fixtures/fake-gh.ts';
import { PROVIDERS } from '../../../lets/src/backlog/providers.ts';
import { backlogDeps, fail, json, LOOKUP_ONE, REPO } from './fixtures/fake-gh.ts';
import { fakeProvider, JIRA_CONFIG, jiraItem } from './fixtures/fake-provider.ts';

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

const rows = (view: Row[], items: unknown[]): Row[] => [
  ...LOOKUP_ONE,
  ...view,
  ['project item-list', json({ items, totalCount: items.length })],
];

test('item reads a shaped story with its Project fields, parent and blockers', async () => {
  const t = backlogDeps(rows([
    ['issue view 136 ', json(issue(136, {
      parent: { id: 'I_52', number: 52, title: 'epic', url: url(52), state: 'OPEN' },
      blockedBy: { nodes: [{ id: 'I_135', number: 135, title: 'contract', url: url(135), state: 'CLOSED', repository: { nameWithOwner: REPO } }], totalCount: 1 },
    }))],
    [`issue view ${url(52)} `, json({ number: 52, title: 'backlog-providers — epic', body: '## Shared decisions\n- D1' })],
  ], [
    projectItem(136, { kind: 'Story', priority: 'Must', size: 'M', status: 'In Progress' }),
    projectItem(136, { kind: 'Chore', priority: 'Could', status: 'Todo' }, 'acme/other'),
  ]));
  assert.equal(await run(['item', '136'], t.deps), 0);
  assert.deepEqual(t.json(), {
    key: '136', label: '#136', title: 'story-136 — outcome', body: 'body of 136', url: url(136), state: 'OPEN',
    kind: 'Story', priority: 'Must', size: 'M', status: 'In Progress',
    assignees: [],
    blockedBy: [{ key: '135', label: '#135', title: 'contract', state: 'CLOSED', url: url(135) }],
    parent: { key: '52', label: '#52', title: 'backlog-providers — epic', url: url(52), body: '## Shared decisions\n- D1' },
    subIssues: [],
  });
  assert.deepEqual(t.calls()[1], ['issue', 'view', '136', '--json', 'number,title,body,url,state,assignees,parent,blockedBy,subIssues']);
  assert.deepEqual(t.calls().at(-1), ['issue', 'view', url(52), '--json', 'number,title,body']);
});

test('item returns each assignee\'s login', async () => {
  const t = backlogDeps(rows([
    ['issue view 192 ', json(issue(192, { assignees: [{ id: 'U1', login: 'octocat', name: 'Octo' }] }))],
  ], [projectItem(192, { kind: 'Story', priority: 'Must', status: 'Todo' })]));
  await run(['item', '192'], t.deps);
  assert.deepEqual(t.json().assignees, ['octocat']);
});

test('item returns an epic\'s open sub-issues only', async () => {
  const t = backlogDeps(rows([
    ['issue view 52 ', json(issue(52, {
      subIssues: { nodes: [
        { number: 135, title: 'closed one', state: 'CLOSED', url: url(135) },
        { number: 136, title: 'open one', state: 'OPEN', url: url(136) },
        { number: 137, title: 'open two', state: 'OPEN', url: url(137) },
      ], totalCount: 3 },
    }))],
  ], [projectItem(52, { kind: 'Epic', priority: 'Must', status: 'Todo' })]));
  await run(['item', '52'], t.deps);
  assert.equal(t.json().kind, 'Epic');
  assert.deepEqual(t.json().subIssues, [{ key: '136', label: '#136', title: 'open one', url: url(136) }, { key: '137', label: '#137', title: 'open two', url: url(137) }]);
});

test('an issue not on the Project has null for every Project field', async () => {
  const t = backlogDeps(rows([['issue view 200 ', json(issue(200))]], [projectItem(7, { kind: 'Story' })]));
  await run(['item', '200'], t.deps);
  const out = t.json();
  assert.equal(out.title, 'story-200 — outcome');
  assert.equal(out.body, 'body of 200');
  assert.deepEqual([out.kind, out.priority, out.size, out.status], [null, null, null, null]);
});

test('an unset field is null', async () => {
  const t = backlogDeps(rows([['issue view 9 ', json(issue(9))]], [projectItem(9, { kind: 'Chore', status: 'Todo' })]));
  await run(['item', '9'], t.deps);
  const out = t.json();
  assert.deepEqual([out.kind, out.priority, out.size, out.status], ['Chore', null, null, 'Todo']);
  assert.equal(out.parent, null);
});

test('a missing issue is not-found, and exits 1', async () => {
  const t = backlogDeps([
    ...LOOKUP_ONE,
    ['issue view 99999', fail('GraphQL: Could not resolve to an issue or pull request with the number of 99999. (repository.issue)')],
  ]);
  assert.equal(await run(['item', '99999'], t.deps), 1);
  assert.equal(t.json().error, 'not-found');
});

test('another failure of the read is backend-failed', async () => {
  const t = backlogDeps([...LOOKUP_ONE, ['issue view 9', fail('HTTP 502: Bad Gateway')]]);
  assert.equal(await run(['item', '9'], t.deps), 1);
  assert.deepEqual(t.json(), { error: 'backend-failed', message: 'HTTP 502: Bad Gateway' });
});

test('item writes nothing', async () => {
  const t = backlogDeps(rows([['issue view 9 ', json(issue(9))]], []));
  await run(['item', '9'], t.deps);
  assert.ok(!t.ran('issue edit'));
  assert.ok(!t.ran('project item-edit'));
});

test('a parent in another repository is read by its URL', async () => {
  const parentUrl = 'https://github.com/acme/other/issues/52';
  const t = backlogDeps(rows([
    ['issue view 136 ', json(issue(136, { parent: { number: 52, title: 'other epic', url: parentUrl, state: 'OPEN', repository: { nameWithOwner: 'acme/other' } } }))],
    [`issue view ${parentUrl} `, json({ number: 52, title: 'other epic', body: 'their decisions' })],
  ], [projectItem(136, { kind: 'Story' })]));
  assert.equal(await run(['item', '136'], t.deps), 0);
  assert.deepEqual(t.json().parent, { key: '52', label: 'acme/other#52', title: 'other epic', url: parentUrl, body: 'their decisions' });
  assert.ok(!t.ran('issue view 52 '));
});

test('a blocker or sub-issue in another repository keeps its URL', async () => {
  const other = (n: number) => `https://github.com/acme/lib/issues/${n}`;
  const t = backlogDeps(rows([
    ['issue view 52 ', json(issue(52, {
      blockedBy: { nodes: [{ number: 7, title: 'lib fix', state: 'OPEN', url: other(7) }], totalCount: 1 },
      subIssues: { nodes: [{ number: 8, title: 'lib story', state: 'OPEN', url: other(8) }], totalCount: 1 },
    }))],
  ], [projectItem(52, { kind: 'Epic' })]));
  await run(['item', '52'], t.deps);
  assert.deepEqual(t.json().blockedBy, [{ key: '7', label: 'acme/lib#7', title: 'lib fix', state: 'OPEN', url: other(7) }]);
  assert.deepEqual(t.json().subIssues, [{ key: '8', label: 'acme/lib#8', title: 'lib story', url: other(8) }]);
});

test('a parent that cannot be read is backend-failed naming the parent, not not-found', async () => {
  const parentUrl = 'https://github.com/acme/private/issues/52';
  const t = backlogDeps(rows([
    ['issue view 136 ', json(issue(136, { parent: { number: 52, title: 'hidden', url: parentUrl, state: 'OPEN' } }))],
    [`issue view ${parentUrl} `, fail('GraphQL: Could not resolve to an issue or pull request with the number of 52. (repository.issue)')],
  ], [projectItem(136, { kind: 'Story' })]));
  assert.equal(await run(['item', '136'], t.deps), 1);
  const out = t.json();
  assert.equal(out.error, 'backend-failed');
  assert.ok(out.message.includes(parentUrl), out.message);
});

test('item with a key GitHub does not use is not-found, and runs no gh command', async () => {
  for (const key of ['PROJ-12', 'abc', '0']) {
    const t = backlogDeps([...LOOKUP_ONE]);
    assert.equal(await run(['item', key], t.deps), 1, key);
    const out = t.json();
    assert.equal(out.error, 'not-found', key);
    assert.match(out.message, new RegExp(key), key);
    assert.deepEqual(t.calls(), [], key);
  }
});

test('item #149 reads issue 149', async () => {
  const t = backlogDeps(rows([['issue view 149 ', json(issue(149))]], []));
  assert.equal(await run(['item', '#149'], t.deps), 0);
  assert.equal(t.json().key, '149');
  assert.equal(t.json().label, '#149');
  assert.deepEqual(t.calls()[1].slice(0, 3), ['issue', 'view', '149']);
});

test('a backlog provider with Jira-style keys answers item PROJ-12', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12', { parent: { key: 'PROJ-1', label: 'PROJ-1', title: 'epic', url: 'u1', body: 'decisions' } })] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['item', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider }), 0);
  const out = t.json();
  assert.equal(out.key, 'PROJ-12');
  assert.equal(out.label, 'PROJ-12');
  assert.equal(out.parent.key, 'PROJ-1');
  assert.deepEqual(jira.calls(), [['create'], ['readItem', 'PROJ-12']]);
  assert.deepEqual(t.calls(), []);
});

test('a key the backlog provider does not use is not-found, and builds no adapter', async () => {
  const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
  const t = backlogDeps([], { config: JIRA_CONFIG });
  assert.equal(await run(['item', '149'], t.deps, { ...PROVIDERS, jira: jira.provider }), 1);
  assert.equal(t.json().error, 'not-found');
  assert.deepEqual(jira.calls(), []);
});

test('a blocker in another repository on a GitHub Enterprise host is labelled with its repository', async () => {
  const ghe = (repo: string, n: number) => `https://acme.ghe.com/${repo}/issues/${n}`;
  const t = backlogDeps(rows([
    ['issue view 52 ', json(issue(52, {
      url: ghe(REPO, 52),
      blockedBy: { nodes: [{ number: 7, title: 'lib fix', state: 'OPEN', url: ghe('acme/lib', 7) }, { number: 6, title: 'own fix', state: 'OPEN', url: ghe(REPO, 6) }], totalCount: 2 },
    }))],
  ], [projectItem(52, { kind: 'Epic' })]));
  await run(['item', '52'], t.deps);
  assert.deepEqual(t.json().blockedBy.map((b: { label: string }) => b.label), ['acme/lib#7', '#6']);
});
