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

const sourceFiles = { repositoryFile: '/repo/config.yaml', userFile: '/user/config.yaml' };
for (const [name, backlog, expected] of [
  ['implicit gh', {}, 'gh'],
  ['sole entry', { connections: { local: { binding: 'gh', options: {} } } }, 'local'],
  ['named default', { connection: 'second', connections: { first: { binding: 'gh', options: {} }, second: { binding: 'gh', options: {} } } }, 'second'],
] as const) {
  test(`connection default resolves ${name}`, () => {
    assert.equal(resolveConfiguration({}, { version: 3, backlog }, sourceFiles).connection.name, expected);
  });
}
for (const [name, backlog, connection] of [
  ['several without default', { connections: { a: { binding: 'gh' }, b: { binding: 'gh' } } }, undefined],
  ['invalid explicit name', {}, 'missing'],
  ['undeclared binding', { connections: { local: { binding: 'mcp' } } }, undefined],
  ['invalid named default', { connection: 'absent' }, undefined],
] as const) {
  test(`connection selection rejects ${name}`, () => {
    assert.throws(() => resolveConfiguration({}, { version: 3, backlog }, { ...sourceFiles, connection }),
      /user\/config.yaml.*backlog.connection.*no fallback/);
  });
}
test('direct caller can explicitly select another declared connection', () => {
  assert.equal(resolveConfiguration({}, { version: 3, backlog: { connection: 'a', connections: {
    a: { binding: 'gh' }, b: { binding: 'gh' },
  } } }, { ...sourceFiles, connection: 'b' }).connection.name, 'b');
});

import { resolveRecordedConnection } from '../../../lets/src/backlog/config.ts';
import { submittedRead } from './fixtures/submitted.ts';
test('recovery uses its original connection after the default changes', () => {
  const { action } = submittedRead();
  const connection = resolveRecordedConnection(action, { version: 3, backlog: { connection: 'other', connections: {
    local: { binding: 'gh' }, other: { binding: 'gh' },
  } } }, '/user/config.yaml');
  assert.equal(connection.name, 'local');
});
for (const [name, connections] of [
  ['removed original', { other: { binding: 'gh' } }],
  ['changed original options', { local: { binding: 'gh', options: { endpoint: 'other' } } }],
] as const) {
  test(`recovery rejects ${name} instead of adopting the default`, () => {
    const { action } = submittedRead();
    assert.throws(() => resolveRecordedConnection(action, { version: 3, backlog: { connections } }, '/user/config.yaml'),
      /original.*connection.*reconcil|connection.*no fallback/);
  });
}

for (const host of ['unchanged T3', 'standalone CLI']) {
  test(`${host} resolves the same explicit compatible MCP connection policy`, () => {
    const custom = { ...definition, bindings: { githubMcp: { kind: 'mcp', tool: 'github.read', versions: ['unreported'] } } };
    const configured = resolveConfiguration(repositoryConfig, { version: 3, backlog: {
      connection: 'team', connections: { team: { binding: 'githubMcp', options: { timeoutMs: 1000, maxOutputBytes: 65536 } } },
    } }, { repositoryFile: '/repo/openspec/config.yaml', userFile: '/user/config.yaml', readDefinition: () => custom });
    assert.equal(configured.provider, 'github');
    assert.equal(configured.definition.definition.bindings.githubMcp.kind, 'mcp');
    assert.deepEqual(configured.connection, { name: 'team', binding: 'githubMcp', options: { timeoutMs: 1000, maxOutputBytes: 65536 } });
    assert.equal(configured.backlog, 'P1');
  });
}

test('shipped public GitHub binding rejects an unimplemented endpoint override', () => {
  assert.throws(() => resolveConfiguration({}, { version: 3, backlog: { connections: {
    enterprise: { binding: 'gh', options: { endpoint: 'https://github.example/api/graphql' } },
  } } }, sourceFiles), /endpoint.*custom definition.*no fallback/);
});
