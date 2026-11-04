import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GitHub } from '../../../lets/src/backlog/github.ts';

test('discovery deduplicates Projects linked in either direction', async () => {
  const github = new GitHub({ cwd: process.cwd(), repository: 'owner/repo', actor: 'me', session: 's', provider: 'github' }, async (query, variables) => {
    if (query === 'Actor') return { viewer: { login: 'me' }, repository: { nameWithOwner: 'owner/repo', viewerPermission: 'WRITE' } };
    if (query === 'RepositoryProjects') return { repository: { projectsV2: page([{ id: 'P', title: 'Backlog', url: 'https://github.com/users/owner/projects/1', closed: false }]) } };
    if (query === 'OwnerProjects') return { repositoryOwner: { projectsV2: page([{ id: 'P', title: 'Backlog', url: 'https://github.com/users/owner/projects/1', closed: false }]) } };
    if (query === 'ProjectRepositories') return { node: { repositories: page([{ nameWithOwner: 'owner/repo' }]) } };
    throw new Error(`unexpected ${query}`);
  });
  assert.deepEqual(await github.discover(), [{ provider: 'github', id: 'P', title: 'Backlog', url: 'https://github.com/users/owner/projects/1' }]);
});
function page(nodes: any[], hasNextPage = false, endCursor: string | null = null) { return { nodes, pageInfo: { hasNextPage, endCursor } }; }
import { METADATA } from '../../../lets/src/backlog/items.ts';
const fields = Object.entries(METADATA).map(([name, values]) => ({ id: `F-${name}`, name, dataType: 'SINGLE_SELECT', options: values.map(name => ({ id: `V-${name}`, name })) }));
function packetQuery(overrides: Record<string, any> = {}) {
  return async (name: string, variables: Record<string, unknown>) => {
    if (name in overrides) return typeof overrides[name] === 'function' ? overrides[name](variables) : overrides[name];
    const results: Record<string, any> = {
      Actor: { viewer: { login: 'me' }, repository: { nameWithOwner: 'owner/repo', viewerPermission: 'WRITE' } },
      Project: { node: { id: 'P', closed: false, viewerCanUpdate: true } },
      ProjectRepositories: { node: { repositories: page([{ nameWithOwner: 'owner/repo' }]) } },
      ProjectFields: { node: { fields: page(fields) } },
      Issue: { node: { id: 'I', number: 2, title: 'story', body: 'full packet', url: 'https://github.com/owner/repo/issues/2', repository: { nameWithOwner: 'owner/repo' }, closed: false, lastEditedAt: '2026-01-01', parent: { id: 'parent', body: 'shared decisions' } } },
      IssueOwners: { node: { assignees: page([{ login: 'alice' }, { login: 'bob' }]) } },
      IssueProjects: { node: { projectItems: page([{ id: 'PI', project: { id: 'P' } }]) } },
      ItemValues: { node: { fieldValues: page(Object.entries({ Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' }).map(([field, value]) => ({ field: { id: `F-${field}` }, optionId: `V-${value}` }))) } },
      IssueComments: { node: { comments: page([{ id: 'C', body: 'evidence', createdAt: '2026-01-02', updatedAt: '2026-01-03', author: { login: 'reader' } }]) } },
      IssueBlockers: { node: { blockedBy: page([{ id: 'B', closed: false, repository: { nameWithOwner: 'owner/repo' } }]) } },
    };
    if (!(name in results)) throw new Error(`unexpected ${name}`);
    return results[name];
  };
}
const context = { cwd: process.cwd(), provider: 'github', repository: 'owner/repo', actor: 'me', session: 's', backlog: 'P' };
test('packet reads retain complete body and supplemental evidence', async () => {
  const github = new GitHub(context, packetQuery());
  const packet = await github.packet('I');
  assert.equal(packet.item.body, 'full packet');
  assert.deepEqual(packet.item.owners, ['alice', 'bob']);
  assert.deepEqual(packet.item.metadata, { Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' });
  assert.equal(packet.parent.body, 'shared decisions');
  assert.equal(packet.comments[0].body, 'evidence');
  assert.equal(packet.lastEditedAt, '2026-01-01');
});
test('directional blockers traverse every page', async () => {
  const github = new GitHub(context, packetQuery({ IssueBlockers: ({ cursor }: any) => ({ node: { blockedBy: cursor ? page([{ id: 'closed', closed: true }]) : page([{ id: 'open', closed: false }], true, 'next') } }) }));
  assert.deepEqual(await github.relationships('I', 'blocked_by'), [
    { identity: { provider: 'github', backlog: 'P', id: 'open' }, status: 'Todo' },
    { identity: { provider: 'github', backlog: 'P', id: 'closed' }, status: 'Done' },
  ]);
});
for (const [name, overrides, category] of [
  ['actor mismatch', { Actor: { viewer: { login: 'someone' } } }, 'authentication'],
  ['foreign repository', { Issue: { node: { id: 'I', repository: { nameWithOwner: 'other/repo' } } } }, 'not_found'],
  ['missing membership', { IssueProjects: { node: { projectItems: page([]) } } }, 'not_found'],
  ['unsupported mapping type', { ProjectFields: { node: { fields: page(fields.map(field => ({ ...field, dataType: 'TEXT' }))) } } }, 'invalid_configuration'],
  ['missing value', { ItemValues: { node: { fieldValues: page([]) } } }, 'invalid_configuration'],
] as const) {
  test(`packet rejects ${name}`, async () => {
    await assert.rejects(new GitHub(context, packetQuery(overrides)).packet('I'), category === 'invalid_configuration' ? /invalid_configuration/ : (error: any) => error.category === category);
  });
}
test('repeated blockers cursor stops readiness', async () => {
  const github = new GitHub(context, packetQuery({ IssueBlockers: { node: { blockedBy: page([], true, 'loop') } } }));
  await assert.rejects(github.relationships('I', 'blocked_by'), /repeated/);
});
test('unavailable provenance is declared unsupported', async () => {
  const { dispatch } = await import('../../../lets/src/backlog/github-main.ts');
  const result = await dispatch({ protocol: 1, operation: 'capability.read', context, input: {} }, packetQuery());
  assert.equal(result.capabilities.claims.support, 'unsupported');
});
test('setup mutation is rejected before provider effects', async () => {
  const { dispatch } = await import('../../../lets/src/backlog/github-main.ts');
  let calls = 0;
  await assert.rejects(dispatch({ protocol: 1, operation: 'backlog.create', mutationId: 'm', context: { ...context, backlog: undefined }, input: { title: 'no' } }, async () => { calls++; }), /unsupported/);
  assert.equal(calls, 0);
});
import { withGithub, item as identity } from './fixtures/github.ts';
test('executable normalizes a complete GitHub item', () => withGithub(async ({ call, state }) => {
  const { item } = await call('item.read', { item: identity });
  assert.equal(item.reference, '#2');
  assert.equal(item.body, 'full packet');
  assert.equal(item.metadata.Status, 'Todo');
  assert.ok(state().calls.some((call: any) => call.name === 'ItemValues'));
}));
