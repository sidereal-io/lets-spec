import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, runWorkflow, story } from './fixtures/adapter.ts';
test('shared executable lifecycle satisfies contract outcomes', () => runWorkflow());
for (const provider of ['github', 'jira', 'linear', 'beads']) {
  test(`${provider} variation preserves metadata and identity`, () =>
    withAdapter(async ({ call, state }) => {
      const { item } = await call('item.create', story, 'create');
      assert.equal(item.identity.provider, provider);
      assert.equal(item.url === undefined, provider === 'beads');
      assert.equal(
        Array.isArray(Object.values(state().items).map((entry) => entry.data)[0].labels),
        provider === 'linear' || provider === 'beads',
      );
      if (provider === 'github') assert.match(item.reference, /^#\d+$/);
      await call(
        'item.update',
        { item: item.identity, patch: { metadata: { Size: 'M' } } },
        'update',
      );
      assert.deepEqual((await call('item.read', { item: item.identity })).item.metadata, {
        ...story.metadata,
        Size: 'M',
      });
    }, provider));
}
for (const [fault, outcome] of [
  ['duplicate', /duplicate creation/],
  ['ignore-blocker', /blocker silently ignored/],
  ['overstate-claim', /declared claim guarantee/],
  ['overwrite-owner', /another session/],
  ['erase-unrelated', /unrelated provider data/],
] as const) {
  test(`conformance detects ${fault} fixture`, () =>
    assert.rejects(runWorkflow(fault), outcome));
}

import { readFileSync } from 'node:fs';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { deriveDefinitionResult } from '../../../lets/src/backlog/projections.ts';
import { githubDefinition } from '../../../lets/src/backlog/config.ts';
const githubIssue = JSON.parse(readFileSync(new URL('./fixtures/github-issue.json', import.meta.url), 'utf8'));
test('shipped GitHub projection selects scoped Project field unions', () => {
  const output = structuredClone(githubIssue);
  const correct = output.data.node.projectItems.nodes[0];
  const other = structuredClone(correct);
  other.id = 'PI-OTHER';
  other.project.id = 'OTHER';
  other.fieldValues.nodes.find((node: { name: string }) => node.name === 'Must').name = 'Could';
  output.data.node.projectItems.nodes.unshift(other);
  correct.fieldValues.nodes.unshift(null);
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const result = deriveDefinitionResult(definition, 'item.read', 'read', 'gh', output,
    { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' });
  assert.deepEqual(result, { item: { identity: { provider: 'github', backlog: 'P1', id: 'I1' },
    reference: '#1', url: 'https://github.com/fixture/repo/issues/1', title: 'story — fixture', body: 'Fixture packet',
    metadata: { Kind: 'Story', Priority: 'Must', Size: 'M', Status: 'In Progress' }, owners: ['actor'], createdAt: '2026-11-03T04:33:18Z', lastEditedAt: null, parent: null } });
});
for (const name of ['missing page', 'unknown union', 'count mismatch']) {
  test(`shipped GitHub mapping rejects ${name}`, () => {
    const output = structuredClone(githubIssue);
    const issue = output.data.node;
    if (name === 'missing page') issue.projectItems.pageInfo.hasNextPage = true;
    if (name === 'unknown union') issue.projectItems.nodes[0].fieldValues.nodes.push({ __typename: 'UnknownFutureValue' });
    if (name === 'count mismatch') issue.assignees.totalCount = 2;
    assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
      'item.read', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' }),
      /coverage|union/);
  });
}

import { projectArguments } from '../../../lets/src/backlog/projections.ts';
test('shipped query arguments bind the immutable input ID without shell interpolation', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['item.read'].actions.read.bindings.gh;
  const args = projectArguments(mapping.arguments, { item: { id: 'I1' } });
  assert.equal((args as string[]).at(-1), 'id=I1');
});

import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { validateSubmission } from '../../../lets/src/backlog/submissions.ts';
import { submissionFor } from './fixtures/submitted.ts';
import { AdapterFailure } from '../../../lets/src/backlog/errors.ts';
for (const [type, category, effects] of [
  ['FORBIDDEN', 'permission', 'none'],
  ['FUTURE_ERROR', 'unknown_outcome', 'unknown'],
] as const) {
  test(`shipped partial GraphQL ${type} stops result progression`, () => {
    const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
    const mapping = definition.definition.operations['item.read'].actions.read.bindings.gh;
    const action = issueAction({ contractVersion: 1, operation: 'item.read', context: {
      cwd: '/repo', provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor',
    }, input: { item: { provider: 'github', backlog: 'P1', id: 'I1' } } }, definition,
    { name: 'local', binding: 'gh', options: {} }, { toolArguments: [], allowedEffects: [],
      requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 100);
    const output = { ...structuredClone(githubIssue), errors: [{ type, path: ['node', 'projectItems'] }] };
    assert.throws(() => validateSubmission(action, submissionFor(action, output), mapping.projection, 101),
      (error: unknown) => error instanceof AdapterFailure && error.category === category && error.effects === effects);
  });
}

import { selectBacklog } from '../../../lets/src/backlog/selection.ts';
const linkedProjects = { data: { viewer: { login: 'actor' }, node: { id: 'R1', projectsV2: {
  nodes: [{ id: 'P1', title: 'Fixture Project', url: 'https://github.com/users/fixture/projects/1' }],
  totalCount: 1, pageInfo: { hasNextPage: false, endCursor: 'MQ' },
} } } };
function discoveredProjects(output: unknown = linkedProjects) {
  return deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'backlog.list', 'read', 'gh', output, { provider: 'github', repository: 'R1', actor: 'actor' }) as unknown as
    import('../../../lets/src/backlog/types.ts').Page<import('../../../lets/src/backlog/types.ts').LinkedBacklog>;
}
test('shipped discovery resolves the sole repository-linked Project', () => {
  assert.equal(selectBacklog(discoveredProjects(), 'github').id, 'P1');
});
for (const mode of ['ambiguous', 'unlinked', 'incomplete'] as const) {
  test(`Project discovery rejects ${mode} selection`, () => {
    const page = discoveredProjects();
    if (mode === 'ambiguous') page.items.push({ provider: 'github', id: 'P2' });
    if (mode === 'incomplete') { page.complete = false; page.nextCursor = 'next'; }
    assert.throws(() => selectBacklog(page, 'github', mode === 'unlinked' ? 'OTHER' : undefined),
      /several|not linked|finish/);
  });
}
test('explicit Project selection resolves several linked Projects', () => {
  const page = discoveredProjects();
  page.items.push({ provider: 'github', id: 'P2' });
  assert.equal(selectBacklog(page, 'github', 'P2').id, 'P2');
});
for (const field of ['actor', 'repository'] as const) {
  test(`shipped discovery rejects raw ${field} scope mismatch`, () => {
    const output = structuredClone(linkedProjects);
    if (field === 'actor') output.data.viewer.login = 'other';
    else output.data.node.id = 'OTHER';
    assert.throws(() => discoveredProjects(output), /scope/);
  });
}
