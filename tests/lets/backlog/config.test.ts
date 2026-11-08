import { test } from 'node:test';
import assert from 'node:assert/strict';
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

import { resolveConfiguration } from '../../../lets/src/backlog/config.ts';
const repositoryConfig = { lets: { backlog: { version: 1, provider: 'github', id: 'P1', definition: './provider.json' } } };
const machineConfig = { version: 3, backlog: { stateDir: '/private/lets' } };
test('repository selection resolves custom source relative to its config file', () => {
  let read = '';
  const configured = resolveConfiguration(repositoryConfig, machineConfig, {
    repositoryFile: '/repo/openspec/config.yaml', userFile: '/user/config.yaml',
    readDefinition: (path) => { read = path; return definition; },
  });
  assert.equal(read, '/repo/openspec/provider.json');
  assert.equal(configured.provider, 'github');
  assert.equal(configured.backlog, 'P1');
  assert.equal(configured.stateDir, '/private/lets');
});
test('machine options cannot override repository provider', () => {
  assert.throws(() => resolveConfiguration(repositoryConfig,
    { version: 3, backlog: { provider: 'linear' } }, {
      repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml', readDefinition: () => definition,
    }), /user\/config.yaml.*backlog.provider/);
});
test('missing explicit definition never selects shipped fallback', () => {
  assert.throws(() => resolveConfiguration(repositoryConfig, machineConfig, {
    repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml',
    readDefinition: () => { throw new Error('missing file'); },
  }), /provider.json.*no fallback/);
});

for (const key of ['executable', 'adapter', 'path']) {
  test(`obsolete repository ${key} names its migration remedy`, () => {
    assert.throws(() => resolveConfiguration({ lets: { backlog: { version: 1, [key]: './old' } } }, {}, {
      repositoryFile: '/repo/openspec/config.yaml', userFile: '/user/config.yaml',
    }), new RegExp(`openspec/config.yaml.*lets.backlog.${key}.*inert definition.*backlog.connections`));
  });
}
test('obsolete machine executable names its migration remedy', () => {
  assert.throws(() => resolveConfiguration({}, { version: 3, backlog: { executable: 'old' } }, {
    repositoryFile: '/repo/openspec/config.yaml', userFile: '/user/config.yaml',
  }), /user\/config.yaml.*backlog.executable.*inert definition.*backlog.connections/);
});

test('omitted repository selection uses the shipped GitHub definition', () => {
  assert.equal(resolveConfiguration({}, {}, {
    repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml',
  }).definition.source, 'shipped:github');
});
test('local definition selection retains required tracking policy', () => {
  assert.throws(() => resolveConfiguration({ lets: { backlog: {
    version: 1, provider: 'beads', definition: './beads.json', storage: { path: '.beads' },
  } } }, {}, {
    repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml',
    readDefinition: () => ({ ...definition, name: 'beads', backend: { name: 'beads', versions: ['1'] } }),
  }), /storage.tracking/);
});

import { deriveDefinitionResult } from '../../../lets/src/backlog/projections.ts';
const customDefinition = {
  ...definition,
  operations: { 'claim.read': { actions: { read: { bindings: {
    gh: { arguments: ['api', 'graphql'], projection: { op: 'path', path: ['data', 'ownership'] } },
  } } } } },
};
test('custom definition cannot bypass the claim operation validator', () => {
  const selected = resolveConfiguration(repositoryConfig, machineConfig, {
    repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml', readDefinition: () => customDefinition,
  });
  assert.throws(() => deriveDefinitionResult(selected.definition, 'claim.read', 'read', 'gh', {
    data: { ownership: { claim: { actor: 'me', session: null, token: null, status: 'wrong', guarantee: 'exclusive' } } },
  }, {}), /claim.status/);
});
test('custom definition rejects an unknown projection operator at load', () => {
  const invalid = structuredClone(customDefinition);
  invalid.operations['claim.read'].actions.read.bindings.gh.projection.op = 'eval';
  assert.throws(() => loadDefinition([{ source: '/repo/custom.json', value: invalid }]), /projection.*operator/);
});
