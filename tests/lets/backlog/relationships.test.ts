import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, story } from './fixtures/adapter.ts';
for (const support of ['native', 'emulated'] as const) {
  test(`${support} directional blocker survives its executable round trip`, () =>
    withAdapter(async ({ call }) => {
      const options = support === 'emulated' ? { fault: 'emulated-blockers' } : {};
      assert.equal(
        (await call('capability.read', {}, undefined, options)).capabilities.blockers.support,
        support,
      );
      const a = (await call('item.create', story, 'a')).item.identity;
      const b = (await call('item.create', story, 'b')).item.identity;
      await call(
        'relationship.write',
        { item: a, target: b, kind: 'blocked_by', present: true },
        'block',
        options,
      );
      await call(
        'relationship.write',
        { item: a, target: b, kind: 'related', present: true },
        'related',
        options,
      );
      assert.deepEqual(
        (
          await call('relationship.list', { item: a, kind: 'blocked_by' }, undefined, options)
        ).items.map((edge) => edge.identity),
        [b],
      );
      assert.deepEqual(
        (await call('relationship.list', { item: b, kind: 'blocked_by' }, undefined, options))
          .items,
        [],
      );
    }));
}
test('unsupported hierarchy stops before writing an edge', () =>
  withAdapter(async ({ call, state }) => {
    const a = (await call('item.create', story, 'a')).item.identity;
    const b = (await call('item.create', story, 'b')).item.identity;
    await assert.rejects(
      call(
        'relationship.write',
        { item: a, target: b, kind: 'child', present: true },
        'parent',
        { fault: 'unsupported-hierarchy' },
      ),
      /unsupported/,
    );
    assert.deepEqual(state().edges, []);
  }));

import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { githubDefinition } from '../../../lets/src/backlog/config.ts';
import { deriveDefinitionResult, projectArguments } from '../../../lets/src/backlog/projections.ts';
const relationshipScope = { provider: 'github', repository: 'R1', backlog: 'P1', actor: 'actor',
  input: { item: { provider: 'github', backlog: 'P1', id: 'I1' }, kind: 'blocked_by' } };
function blockerPage(id: string, next: boolean, cursor: string) {
  return { data: { viewer: { login: 'actor' }, node: { id: 'I1', repository: { id: 'R1' }, links: {
    nodes: [{ id, number: 2, title: 'Prerequisite', state: 'OPEN', repository: { id: 'R1' } }], totalCount: 2,
    pageInfo: { hasNextPage: next, endCursor: cursor },
  } } } };
}
function blockers(output: unknown) {
  return deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'relationship.list', 'read', 'gh', output, relationshipScope);
}
test('shipped relationship read includes every directional blocker page', () => {
  const result = blockers([blockerPage('I2', true, 'c1'), blockerPage('I3', false, 'c2')]);
  assert.deepEqual(result, { items: [
    { identity: { provider: 'github', backlog: 'P1', id: 'I2' }, status: 'Todo' },
    { identity: { provider: 'github', backlog: 'P1', id: 'I3' }, status: 'Todo' },
  ], complete: true, nextCursor: null });
});
for (const fault of ['missing final page', 'missing middle page', 'wrong issue', 'unknown blocker state'] as const) {
  test(`directional readiness rejects ${fault}`, () => {
    const pages = [blockerPage('I2', true, 'c1'), blockerPage('I3', false, 'c2')];
    if (fault === 'missing final page') pages.pop();
    if (fault === 'missing middle page') for (const page of pages) page.data.node.links.totalCount = 3;
    if (fault === 'wrong issue') pages[1].data.node.id = 'OTHER';
    if (fault === 'unknown blocker state') pages[1].data.node.links.nodes[0].state = 'UNAVAILABLE';
    assert.throws(() => blockers(pages), /coverage|scope|enum/);
  });
}
test('shipped blocker query reads blockedBy instead of the reverse direction', () => {
  const definition = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
  const mapping = definition.definition.operations['relationship.list'].actions.read.bindings.gh;
  const args = projectArguments(mapping.arguments, relationshipScope.input, relationshipScope) as string[];
  const query = args.find((arg) => arg.startsWith('query='))!;
  assert.match(query, /links:blockedBy\(/);
  assert.equal(query.includes('links:blocking('), false);
});
test('shipped child read retains closed prerequisite state', () => {
  const page = blockerPage('I2', false, 'c1');
  page.data.node.links.totalCount = 1;
  page.data.node.links.nodes[0].state = 'CLOSED';
  const result = deriveDefinitionResult(loadDefinition([{ source: 'shipped:github', value: githubDefinition }]),
    'relationship.list', 'read-child', 'gh', [page], { ...relationshipScope, input: { ...relationshipScope.input, kind: 'child' } });
  assert.equal((result.items as { status: string }[])[0].status, 'Done');
});
