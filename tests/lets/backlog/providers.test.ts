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
test('shipped issue search resolves immutable identity from complete scoped matches', () => {
  const issue = { ...structuredClone(githubIssue.data.node), __typename: 'Issue' };
  const output = [{ data: { viewer: { login: 'actor' }, node: { id: 'R1' }, search: {
    nodes: [issue], issueCount: 1, pageInfo: { hasNextPage: false, endCursor: 'last' },
  } } }];
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.search', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' });
  assert.deepEqual((result.items as { identity: unknown }[]).map((item) => item.identity), [{ provider: 'github', backlog: 'P1', id: 'I1' }]);
  assert.equal(result.complete, true);
});
test('shipped issue search refuses truncated search coverage', () => {
  const output = [{ data: { viewer: { login: 'actor' }, node: { id: 'R1' }, search: {
    nodes: [{ ...githubIssue.data.node, __typename: 'Issue' }], issueCount: 2,
    pageInfo: { hasNextPage: false, endCursor: 'last' },
  } } }];
  assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.search', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' }), /coverage/);
});
test('shipped issue search excludes another repository', () => {
  const issue = { ...structuredClone(githubIssue.data.node), __typename: 'Issue' };
  issue.repository.id = 'OTHER';
  const output = [{ data: { viewer: { login: 'actor' }, node: { id: 'R1' }, search: {
    nodes: [issue, { __typename: 'PullRequest', id: 'PR1' }], issueCount: 2,
    pageInfo: { hasNextPage: false, endCursor: 'last' },
  } } }];
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.search', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' });
  assert.deepEqual(result.items, []);
});
test('issue search arguments keep the GraphQL document separate from search text', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['item.search'].actions.read.bindings.gh;
  const args = projectArguments(mapping.arguments, { query: 'repo:fixture/repo is:issue is:open feature in:title' }, { repository: 'R1' }) as string[];
  assert.equal(args.filter((argument) => argument.startsWith('query=')).length, 1);
  assert.ok(args.includes('search=repo:fixture/repo is:issue is:open feature in:title'));
});
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

import { parseActionRequest, issueAction } from '../../../lets/src/backlog/actions.ts';
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
  nodes: [{ id: 'P1', title: 'Fixture Project', closed: false, url: 'https://github.com/users/fixture/projects/1' }],
  totalCount: 1, pageInfo: { hasNextPage: false, endCursor: 'MQ' },
}, owner: { projectsV2: { nodes: [], totalCount: 0, pageInfo: { hasNextPage: false, endCursor: null } } } } } };
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
const githubRepository = JSON.parse(readFileSync(new URL('./fixtures/github-repository.json', import.meta.url), 'utf8'));
const githubPr = JSON.parse(readFileSync(new URL('./fixtures/github-pr.json', import.meta.url), 'utf8'));
const githubScope = { provider: 'github', repository: 'R1', actor: 'actor' };
test('shipped repository mapping translates actual GraphQL fields', () => {
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'repository.read', 'read', 'gh', githubRepository, githubScope);
  assert.deepEqual(result.repository, { id: 'R1', owner: 'fixture', name: 'repo',
    url: 'https://github.com/fixture/repo', defaultBranch: 'main' });
});
test('shipped PR mapping translates actual nullable merge fields', () => {
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'pull-request.read', 'read', 'gh', githubPr, githubScope);
  assert.equal((result.pullRequest as { id: string }).id, 'PR1');
  assert.equal((result.pullRequest as { mergeCommit: null }).mergeCommit, null);
  assert.equal((result.pullRequest as { mergeRef: null }).mergeRef, null);
});
test('shipped PR creation requests a draft', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['pull-request.create']?.actions.create?.bindings.gh;
  assert.ok(mapping, 'shipped create action is required');
  const args = projectArguments(mapping.arguments, { title: 'Draft', base: 'main', head: 'feature', headRepository: 'R1' },
    { ...githubScope, prepared: { body: 'Closes #1' } }) as string[];
  assert.match(args.find((arg) => arg.startsWith('query='))!, /draft:true/);
});
for (const draft of ['missing', false] as const) {
  test(`shipped creation classifies ${draft} draft confirmation as partial effects`, () => {
    const pr = structuredClone(githubPr.data.node);
    if (draft === 'missing') delete pr.isDraft;
    else pr.isDraft = draft;
    assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
      'pull-request.create', 'create', 'gh', { data: { createPullRequest: { pullRequest: pr } } }, githubScope),
      (error: unknown) => error instanceof AdapterFailure && error.effects === 'partial');
  });
}
test('shipped draft creation returns its exact PR identity', () => {
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'pull-request.create', 'create', 'gh', { data: { createPullRequest: { pullRequest: githubPr.data.node } } }, githubScope);
  assert.equal((result.pullRequest as { id: string; isDraft: boolean }).id, 'PR1');
  assert.equal((result.pullRequest as { isDraft: boolean }).isDraft, true);
});
test('shipped branch PR read applies core open-first selection', () => {
  const output = [{ data: { viewer: { login: 'actor' }, node: { id: 'R1', pullRequests: {
    nodes: [{ ...githubPr.data.node, id: 'CLOSED', state: 'CLOSED', createdAt: '2026-11-09T00:00:00Z' }, githubPr.data.node],
    totalCount: 2, pageInfo: { hasNextPage: false, endCursor: 'last' },
  } } } }];
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'pull-request.read', 'read-branch', 'gh', output, { ...githubScope, input: { branch: 'feature' } });
  assert.equal((result.pullRequest as { id: string }).id, 'PR1');
});
test('partial draft confirmation retains the known PR ID', () => {
  const pr = { ...githubPr.data.node, isDraft: false };
  assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'pull-request.create', 'create', 'gh', { data: { createPullRequest: { pullRequest: pr } } }, githubScope),
    (error: unknown) => {
      assert.ok(error instanceof AdapterFailure);
      assert.deepEqual((error as AdapterFailure & { knownRemoteIds?: unknown }).knownRemoteIds, { pullRequest: 'PR1', repository: 'R1' });
      return true;
    });
});

test('shipped bootstrap binds the exact repository before discovering actor', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const request = parseActionRequest(JSON.stringify({ contractVersion: 1, operation: 'repository.read',
    context: { cwd: '/repo', provider: 'github', repository: 'fixture/repo' }, input: { owner: 'fixture', name: 'repo' } }));
  const action = issueAction(request, definition, { name: 'local', binding: 'gh', options: {} }, {
    step: 'bootstrap', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
    timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
  }, 100);
  const output = { data: { viewer: { login: 'actor' }, repository: {
    ...githubRepository.data.node, nameWithOwner: 'fixture/repo',
  } } };
  const projection = definition.definition.operations['repository.read'].actions.bootstrap.bindings.gh.projection;
  assert.deepEqual(validateSubmission(action, submissionFor(action, output), projection, 101), {
    repository: { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' }, actor: 'actor',
  });
  output.data.repository.nameWithOwner = 'other/repo';
  assert.throws(() => validateSubmission(action, submissionFor(action, output), projection, 101), /scope/);
});

test('submitted Project discovery applies configured selection in core', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const action = issueAction({ contractVersion: 1, operation: 'backlog.list', context: {
    cwd: '/repo', provider: 'github', repository: 'R1', actor: 'actor',
  }, input: { selected: 'P1' } }, definition, { name: 'local', binding: 'gh', options: {} }, {
    step: 'read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
    timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
  }, 100);
  const projection = definition.definition.operations['backlog.list'].actions.read.bindings.gh.projection;
  const result = validateSubmission(action, submissionFor(action, linkedProjects), projection, 101);
  assert.equal((result.selectedBacklog as { id: string }).id, 'P1');
});

test('shipped discovery includes reverse-linked user Projects', () => {
  const output = structuredClone(linkedProjects) as any;
  output.data.node.owner = { projectsV2: { nodes: [{ id: 'P2', title: 'Reverse', closed: false,
    url: 'https://github.com/users/fixture/projects/2', repositories: { nodes: [{ id: 'R1' }],
      totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } } }],
    totalCount: 1, pageInfo: { hasNextPage: false, endCursor: null } } };
  assert.deepEqual(discoveredProjects(output).items.map((item) => item.id), ['P1', 'P2']);
});
for (const mode of ['closed', 'unlinked', 'incomplete'] as const) {
  test(`reverse Project discovery handles ${mode} observations`, () => {
    const output = structuredClone(linkedProjects) as any;
    const project = { id: 'P2', title: 'Reverse', closed: mode === 'closed', url: 'https://github.com/users/fixture/projects/2',
      repositories: { nodes: [{ id: mode === 'unlinked' ? 'OTHER' : 'R1' }], totalCount: 1,
        pageInfo: { hasNextPage: mode === 'incomplete', endCursor: 'more' } } };
    output.data.node.owner.projectsV2.nodes = [project];
    output.data.node.owner.projectsV2.totalCount = 1;
    if (mode === 'incomplete') assert.throws(() => discoveredProjects(output), /coverage/);
    else assert.deepEqual(discoveredProjects(output).items.map((item) => item.id), ['P1']);
  });
}

test('shipped parent body read accepts an Epic with only Kind', () => {
  const output = structuredClone(githubIssue);
  const fields = output.data.node.projectItems.nodes[0].fieldValues;
  fields.nodes = fields.nodes.filter((field: any) => field.field?.name === 'Kind');
  fields.nodes[0].name = 'Epic';
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const action = issueAction({ contractVersion: 1, operation: 'item.read', context: {
    cwd: '/repo', provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor',
  }, input: { item: { provider: 'github', backlog: 'P1', id: 'I1' }, includeThread: false } }, definition,
    { name: 'local', binding: 'gh', options: {} }, { step: 'read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 100);
  const result = validateSubmission(action, submissionFor(action, output), definition.definition.operations['item.read'].actions.read.bindings.gh.projection, 101);
  assert.equal((result.item as any).metadata.Kind, 'Epic');
  assert.equal((result.item as any).body, output.data.node.body);
  assert.equal((result.item as any).comments, undefined);
});

for (const field of ['Priority', 'Size', 'Status']) {
  test(`shipped story read rejects missing ${field}`, () => {
    const output = structuredClone(githubIssue);
    const fields = output.data.node.projectItems.nodes[0].fieldValues;
    fields.nodes = fields.nodes.filter((value: any) => value.field?.name !== field);
    assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
      'item.read', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' }),
    new RegExp(`invalid metadata.${field}`));
  });
}

test('shipped Epic read rejects ambiguous optional metadata', () => {
  const output = structuredClone(githubIssue);
  const fields = output.data.node.projectItems.nodes[0].fieldValues;
  fields.nodes.find((field: any) => field.field?.name === 'Kind').name = 'Epic';
  fields.nodes.push(structuredClone(fields.nodes.find((field: any) => field.field?.name === 'Priority')));
  assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.read', 'read', 'gh', output, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' }),
  /exactly one match/);
});
