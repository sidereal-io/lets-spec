import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkConfiguration } from '../../../lets/src/backlog/config.ts';
test('omitted selection defaults to GitHub', () => {
  assert.equal(checkConfiguration({}, process.cwd(), () => '/bin/adapter').provider, 'github');
});
for (const [name, document, finder] of [
  ['multiple backlogs', { lets: { backlog: [] } }, () => '/bin/fake'],
  [
    'missing executable',
    { lets: { backlog: { provider: 'linear', executable: 'missing', id: 'team' } } },
    () => undefined,
  ],
  [
    'missing mappings',
    { lets: { backlog: { provider: 'jira', executable: 'jira', id: 'project' } } },
    () => '/bin/fake',
  ],
  [
    'committed secret',
    {
      lets: {
        backlog: { provider: 'github', executable: 'gh', token: 'fixture-placeholder' },
      },
    },
    () => '/bin/fake',
  ],
] as const) {
  test(`invalid selection rejects ${name}`, () =>
    assert.throws(() => checkConfiguration(document, process.cwd(), finder), /config/));
}
import { METADATA } from '../../../lets/src/backlog/items.ts';
const mappings = Object.fromEntries(
  Object.entries(METADATA).map(([field, values]) => [
    field,
    {
      field,
      cardinality: 'one' as const,
      values: Object.fromEntries(values.map((value) => [value, value])),
    },
  ]),
);
const local = {
  lets: {
    backlog: {
      provider: 'beads',
      executable: './bin/local',
      id: 'local',
      mappings,
      storage: { path: '.beads', tracking: 'ignored' },
    },
  },
};
test('local selection resolves executable relative to repository', () => {
  let searched = '';
  checkConfiguration(local, '/repo', (name) => {
    searched = name;
    return name;
  });
  assert.equal(searched, '/repo/bin/local');
});
test('explicit missing executable never falls back', () => {
  assert.throws(() => checkConfiguration(local, '/repo', () => undefined), /no fallback/);
});
test('local selection requires tracking policy', () => {
  const bad = structuredClone(local);
  const { tracking, ...storage } = bad.lets.backlog.storage;
  const invalid = { lets: { backlog: { ...bad.lets.backlog, storage } } };
  assert.throws(() => checkConfiguration(invalid, '/repo', (name) => name), /tracking/);
});
test('validated selection retains backlog scope', () => {
  assert.equal(checkConfiguration(local, '/repo', (name) => name).backlog, 'local');
});

import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
const definition = {
  schemaVersion: 1,
  name: 'github',
  version: '1.0.0',
  contractVersions: [1],
  backend: { name: 'github', versions: ['graphql-v4'] },
  bindings: { gh: { kind: 'cli', tool: 'gh', versions: ['>=2'] } },
  operations: {},
};
for (const [name, sources] of [
  ['incompatible schema', [{ ...definition, schemaVersion: 2 }]],
  ['incompatible contract', [{ ...definition, contractVersions: [2] }]],
  ['conflicting sources', [definition, definition]],
  ['executable load hook', [{ ...definition, load: './hook.js' }]],
] as const) {
  test(`definition rejects ${name} before tool issuance`, () => {
    assert.throws(() => loadDefinition(sources.map((value) => ({ source: '/repo/provider.json', value }))),
      /invalid_configuration.*provider.json/);
  });
}
test('compatible inert definition has a stable content binding', () => {
  const loaded = loadDefinition([{ source: '/repo/provider.json', value: definition }]);
  assert.equal(loaded.definition.name, 'github');
  assert.match(loaded.digest, /^[a-f0-9]{64}$/);
  assert.equal(loaded.source, '/repo/provider.json');
});
