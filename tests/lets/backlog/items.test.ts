import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  identityKey,
  validateItem,
  updateMapped,
  validateMappings,
  readMapped,
} from '../../../lets/src/backlog/items.ts';
const item = {
  identity: { provider: 'beads', backlog: 'local', id: 'bd-a' },
  reference: 'bd-a',
  title: 'Example',
  body: '',
  metadata: { Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' },
  owners: [],
};
test('local normalized item needs no URL', () =>
  assert.doesNotThrow(() => validateItem(item)));
test('same local ID in different scopes stays distinct', () => {
  assert.notEqual(
    identityKey(item.identity),
    identityKey({ ...item.identity, backlog: 'other' }),
  );
});
import { METADATA } from '../../../lets/src/backlog/items.ts';
const mappings = Object.fromEntries(
  Object.entries(METADATA).map(([field, values]) => [
    field,
    {
      field: field.toLowerCase(),
      cardinality: 'one' as const,
      values: Object.fromEntries(values.map((value) => [value, `${field}:${value}`])),
    },
  ]),
);
test('mapping rejects ambiguous values', () => {
  const bad = structuredClone(mappings);
  bad.Priority.values.Must = bad.Priority.values.Should;
  assert.throws(() => validateMappings(bad), /ambiguous/);
});
test('targeted mapping update preserves unrelated provider data', () => {
  const data = { status: 'Status:Todo', custom: { keep: true }, labels: ['customer'] };
  assert.deepEqual(updateMapped(data, { Status: 'In Progress' }, mappings), {
    ...data,
    status: 'Status:In Progress',
  });
  assert.equal(data.status, 'Status:Todo');
});
test('label mappings round trip shared metadata', async () => {
  const { readMapped } = await import('../../../lets/src/backlog/items.ts');
  const labels = Object.fromEntries(
    Object.entries(mappings).map(([key, mapping]) => [
      key,
      { ...mapping, cardinality: 'many' as const, field: 'labels' },
    ]),
  );
  const data = updateMapped({ labels: ['customer'] }, item.metadata, labels);
  assert.deepEqual(readMapped(data, labels), item.metadata);
  assert.ok((data.labels as string[]).includes('customer'));
});
test('empty label storage retains all shared meanings', () => {
  const labels = Object.fromEntries(
    Object.entries(mappings).map(([key, mapping]) => [
      key,
      { ...mapping, cardinality: 'many' as const, field: 'labels' },
    ]),
  );
  assert.deepEqual(readMapped(updateMapped({}, item.metadata, labels), labels), item.metadata);
});
test('two shared meanings cannot share scalar storage', () => {
  const bad = structuredClone(mappings);
  bad.Priority.field = bad.Kind.field;
  assert.throws(() => validateMappings(bad), /cardinality/);
});
for (const stored of ['Priority:Must', 'Priority:P0']) {
  test(`mapping rejects extra shared meaning ${stored}`, () => {
    const bad = structuredClone(mappings);
    bad.Priority.values.Urgent = stored;
    assert.throws(() => validateMappings(bad), /invalid_configuration.*Urgent/);
  });
}
test('mapping rejects an unknown shared field', () => {
  assert.throws(
    () => validateMappings({ ...mappings, Custom: mappings.Priority }),
    /invalid_configuration.*Custom/,
  );
});
for (const cardinality of ['one', 'many'] as const) {
  test(`mapping read enforces ${cardinality} cardinality`, () => {
    const configured = { ...mappings, Priority: { ...mappings.Priority, cardinality } };
    const data = updateMapped({}, item.metadata, configured);
    data.priority = cardinality === 'one' ? ['Priority:Must'] : 'Priority:Must';
    assert.throws(() => readMapped(data, configured), /cardinality/);
  });
}

import { deriveDefinitionResult } from '../../../lets/src/backlog/projections.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { githubDefinition } from '../../../lets/src/backlog/config.ts';
import { readFileSync } from 'node:fs';
const issueOutput = JSON.parse(readFileSync(new URL('./fixtures/github-issue.json', import.meta.url), 'utf8'));
function candidatePage(id: string, next: boolean, cursor: string) {
  const issue = structuredClone(issueOutput.data.node);
  issue.id = id;
  return { data: { viewer: { login: 'actor' }, node: { id: 'P1', items: {
    nodes: [{ id: `PI-${id}`, content: { ...issue, __typename: 'Issue' } }], totalCount: 2,
    pageInfo: { hasNextPage: next, endCursor: cursor },
  } } } };
}
function candidates(pages: unknown) {
  return deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'candidate.list', 'read', 'gh', pages, { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' });
}
test('shipped candidate enumeration covers all Project pages', () => {
  const result = candidates([candidatePage('I1', true, 'c1'), candidatePage('I2', false, 'c2')]);
  assert.deepEqual((result.items as { identity: { id: string } }[]).map((item) => item.identity.id), ['I1', 'I2']);
  assert.equal(result.complete, true);
});
for (const fault of ['missing final page', 'missing middle page', 'repeated cursor', 'missing metadata', 'duplicate node'] as const) {
  test(`shipped candidate enumeration rejects ${fault}`, () => {
    const pages = [candidatePage('I1', true, 'c1'), candidatePage('I2', false, 'c2')];
    if (fault === 'missing final page') pages.pop();
    if (fault === 'missing middle page') for (const page of pages) page.data.node.items.totalCount = 3;
    if (fault === 'repeated cursor') pages[1].data.node.items.pageInfo.endCursor = 'c1';
    if (fault === 'missing metadata') pages[1].data.node.items.nodes[0].content.projectItems.nodes[0].fieldValues.nodes = [];
    if (fault === 'duplicate node') pages[1] = candidatePage('I1', false, 'c2');
    assert.throws(() => candidates(pages), /coverage|match/);
  });
}
test('candidate enumeration excludes another repository in the Project', () => {
  const pages = [candidatePage('I1', true, 'c1'), candidatePage('I2', false, 'c2')];
  pages[1].data.node.items.nodes[0].content.repository.id = 'OTHER';
  assert.equal((candidates(pages).items as unknown[]).length, 1);
});
test('candidate enumeration rejects a page for another Project', () => {
  const pages = [candidatePage('I1', true, 'c1'), candidatePage('I2', false, 'c2')];
  pages[1].data.node.id = 'OTHER';
  assert.throws(() => candidates(pages), /scope/);
});
test('candidate submission rejects a structured error on a later page', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['candidate.list'].actions.read.bindings.gh;
  const action = issueAction({ contractVersion: 1, operation: 'candidate.list', context: {
    cwd: '/repo', provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor',
  }, input: {} }, definition, { name: 'local', binding: 'gh', options: {} }, {
    toolArguments: [], allowedEffects: [], requiredCapabilities: [],
    timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
  }, 100);
  const pages = [candidatePage('I1', true, 'c1'), { ...candidatePage('I2', false, 'c2'), errors: [{ type: 'FORBIDDEN' }] }];
  assert.throws(() => validateSubmission(action, submissionFor(action, pages), mapping.projection, 101), /permission/);
});
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { validateSubmission } from '../../../lets/src/backlog/submissions.ts';
import { submissionFor } from './fixtures/submitted.ts';
function threadPage(id: string, next: boolean, cursor: string) {
  const output = structuredClone(issueOutput);
  output.data.node.parent = null;
  output.data.node.comments = { nodes: [{ id, url: `https://github.com/fixture/repo/issues/1#${id}`,
    author: { __typename: 'User', login: 'actor' }, authorAssociation: 'OWNER',
    createdAt: '2026-11-01T00:00:00Z', lastEditedAt: null, body: id === 'C2' ? 'Later unread evidence' : 'First comment' }],
    totalCount: 2, pageInfo: { hasNextPage: next, endCursor: cursor } };
  return output;
}
test('thread read retains unread evidence from a later page', () => {
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.read', 'read-thread', 'gh', [threadPage('C1', true, 'c1'), threadPage('C2', false, 'c2')],
    { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' });
  const item = result.item as { comments: { body: string }[]; createdAt: string; lastEditedAt: null; parent: null };
  assert.equal(item.comments[1].body, 'Later unread evidence');
  assert.equal(item.lastEditedAt, null);
  assert.equal(item.parent, null);
});
test('parent body read arguments omit comment fetching', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['item.read'].actions.read.bindings.gh;
  const args = projectArguments(mapping.arguments, { item: { id: 'I1' } }) as string[];
  assert.equal(args.some((arg) => arg.includes('comments(')), false);
  assert.equal(args.some((arg) => arg.includes('item-list')), false);
});
import { projectArguments } from '../../../lets/src/backlog/projections.ts';
test('thread read rejects a missing final comment page', () => {
  assert.throws(() => deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.read', 'read-thread', 'gh', [threadPage('C1', true, 'c1')],
    { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor' }), /coverage/);
});
test('requested thread facts cannot be omitted by a custom mapping', () => {
  const definition = loadDefinition([{ source: 'custom', value: { ...githubDefinition, operations: {
    'item.read': { actions: { 'read-thread': { bindings: { gh: { arguments: [], projection: { op: 'path', path: ['data'] } } } } } },
  } } }]);
  const action = issueAction({ contractVersion: 1, operation: 'item.read', context: {
    cwd: '/repo', provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor',
  }, input: { item: { provider: 'github', backlog: 'P1', id: 'I1' }, includeThread: true } }, definition,
    { name: 'local', binding: 'gh', options: {} }, { step: 'read-thread', toolArguments: [], allowedEffects: [],
      requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 100);
  const item = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'item.read', 'read', 'gh', issueOutput, action.request.context).item;
  assert.throws(() => validateSubmission(action, submissionFor(action, { data: { item } }),
    { op: 'path', path: ['data'] }, 101), /thread/);
});
