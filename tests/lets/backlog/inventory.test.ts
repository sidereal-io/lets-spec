import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('inventory table contains the required responsibility mappings', () => {
  const document = readFileSync(
    new URL('../../../docs/backlog-adapter-contract.md', import.meta.url),
    'utf8',
  );
  for (const behavior of [
    'Project discovery',
    'Project creation',
    'Field validation',
    'Item search',
    'Item creation',
    'Targeted update',
    'Parent-child links',
    'Directional blockers',
    'Packet validation',
    'Schema routing',
    'Ready-work ranking',
    'Claim',
    'Release',
    'Pull request references',
    'Completion',
    'Glossary handoff',
  ]) {
    assert.match(
      document,
      new RegExp(`\\| ${behavior} \\| (shared policy|adapter|code host) \\| [^|]+\\|`),
      behavior,
    );
  }
});

test('provider inventory keeps non-GitHub PR production routing pending', () => {
  const document = readFileSync(new URL('../../../docs/backlog-adapter-contract.md', import.meta.url), 'utf8');
  for (const provider of ['GitHub', 'Jira', 'Linear', 'Beads']) assert.ok(document.includes(provider));
  assert.match(document, /pull-request\.\*.*outside.*non-GitHub production profiles/);
  assert.match(document, /routing decision.*pending/);
});

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PROVIDERS, profile } from '../../../lets/src/backlog/profiles.ts';
import { submittedReference, submissionFor } from './fixtures/submitted.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
for (const provider of PROVIDERS) {
  test(`${provider} inventory retains attributed code-host reference conformance`, () => {
    assert.equal(profile(provider).capabilities.claims.guarantee, 'best-effort');
    const base = submittedReference();
    const identity = { ...base.item.identity, provider };
    const definition = loadDefinition([{ source: `fixture:${provider}`, value: {
      ...base.action.definition.definition, backend: { name: provider, versions: ['fixture'] },
    } }]);
    const action = issueAction({ ...base.action.request, context: { ...base.action.request.context, provider },
      input: { item: identity, reference: 'PR1' } }, definition, base.action.connection, {
      step: 'read', validationOperation: 'item.read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
    const item = { ...base.item, identity, pullRequestObservation: { ...base.item.pullRequestObservation,
      closingIssues: { items: [identity], complete: true, nextCursor: null } } };
    assert.equal(item.pullRequestObservation.source.provider, 'github');
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/provider-reference-');
    try {
      const store = new OperationStore(join(dir, 'private'));
      const issued = store.issue(action);
      const response = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
      assert.equal(response.state, 'complete');
      if (!('result' in response)) throw new Error('validated reference required');
      assert.deepEqual(response.result, { reference: 'PR1' });
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

import { submittedCompletion } from './fixtures/submitted.ts';
import { validateExactMerge } from '../../../lets/src/backlog/completion-actions.ts';
for (const provider of PROVIDERS) {
  test(`${provider} inventory retains attributed exact-merge completion proof`, () => {
    const { action, item } = submittedCompletion();
    const identity = { ...item.identity, provider };
    const scoped = { ...action, request: { ...action.request, context: { ...action.request.context, provider },
      input: { ...(action.request.input as Record<string, unknown>), item: identity } } };
    const observation = { ...item, identity, pullRequestObservation: { ...item.pullRequestObservation,
      closingIssues: { items: [identity], complete: true, nextCursor: null },
      pullRequest: { ...item.pullRequestObservation.pullRequest, state: 'MERGED', mergeCommit: 'merge-sha' } } };
    assert.equal(observation.pullRequestObservation.source.provider, 'github');
    assert.doesNotThrow(() => validateExactMerge(scoped, { item: observation }));
    observation.pullRequestObservation.pullRequest.mergeCommit = 'unrelated-merge';
    assert.throws(() => validateExactMerge(scoped, { item: observation }), /exact.*merge/);
  });
}

import { withBacklogCli } from './fixtures/cli.ts';
import { writeFileSync, existsSync } from 'node:fs';
test('compatible custom MCP issues bounded actions without gh on PATH', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const path = join(dir, 'provider.json');
  const definition = JSON.parse(readFileSync(path, 'utf8'));
  definition.bindings.fixture = { kind: 'mcp', tool: 'fixture.github', versions: ['unreported'] };
  for (const operation of Object.values(definition.operations) as any[])
    for (const [step, mapping] of Object.entries(operation.actions) as [string, any][])
      mapping.bindings.fixture.arguments = { op: 'literal', value: { step } };
  writeFileSync(path, JSON.stringify(definition));
  const host = join(dir, 'host.json');
  writeFileSync(host, JSON.stringify({ tools: ['fixture.github'], timeoutMs: 1000, maxOutputBytes: 65536 }));
  const response = await call(['repository.read', '--request-file', request('repository.read', {}), '--host-file', host], { PATH: dir });
  assert.equal(response.state, 'action', response.reason);
  assert.deepEqual(response.action.tool, { kind: 'mcp', name: 'fixture.github', arguments: { step: 'read' } });
  assert.equal(existsSync(marker), false);
}));

test('existing-story read inventory completes through MCP without gh', () => withBacklogCli(async ({ dir, call, request }) => {
  const path = join(dir, 'provider.json');
  const definition = JSON.parse(readFileSync(path, 'utf8'));
  definition.bindings.fixture = { kind: 'mcp', tool: 'fixture.github', versions: ['unreported'] };
  for (const operation of Object.values(definition.operations) as any[])
    for (const [step, mapping] of Object.entries(operation.actions) as [string, any][])
      mapping.bindings.fixture.arguments = { op: 'literal', value: { step } };
  writeFileSync(path, JSON.stringify(definition));
  const host = join(dir, 'host.json');
  writeFileSync(host, JSON.stringify({ tools: ['fixture.github'], timeoutMs: 1000, maxOutputBytes: 65536 }));
  const invoke = (args: string[]) => call([...args, '--host-file', host], { PATH: dir });
  const item = { ...submittedReference().item, repository: 'R1', state: 'OPEN', blockers: { complete: true, open: [] } };
  item.metadata.Status = 'Todo';
  const pr = item.pullRequestObservation.pullRequest;
  const reads = [
    ['repository.read', {}, { repository: { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' } }],
    ['backlog.list', {}, { items: [{ provider: 'github', id: 'P1' }], complete: true, nextCursor: null }],
    ['item.search', { query: 'repo:fixture/repo' }, { items: [item], complete: true, nextCursor: null }],
    ['item.read', { item: item.identity }, { item }],
    ['item.read', { item: item.identity, includeThread: true }, { item: { ...item, comments: [], parent: null, createdAt: '2026-01-01T00:00:00Z', lastEditedAt: null } }],
    ['relationship.list', { item: item.identity, kind: 'blocked_by' }, { items: [], complete: true, nextCursor: null }],
    ['candidate.list', {}, { items: [item], complete: true, nextCursor: null }],
    ['claim.read', { item: item.identity }, { claim: { item: item.identity, actor: 'actor', session: null, token: null, status: 'In Progress', guarantee: 'best-effort', assignees: ['actor'], assigneesComplete: true } }],
    ['pull-request.read', { branch: pr.headRef }, { pullRequest: pr }],
  ] as const;
  for (const [operation, input, output] of reads) {
    const requestPath = request(operation, input);
    const body = JSON.parse(readFileSync(requestPath, 'utf8'));
    if (['item.search', 'candidate.list'].includes(operation)) body.context.backlog = 'P1';
    writeFileSync(requestPath, JSON.stringify(body));
    const issued = await invoke([operation, '--request-file', requestPath]);
    assert.equal(issued.state, 'action', `${operation}: ${issued.reason}`);
    assert.equal(issued.action.tool.kind, 'mcp');
    assert.deepEqual(issued.action.allowedEffects, []);
    const outputPath = join(dir, 'observation.json');
    writeFileSync(outputPath, JSON.stringify(submissionFor(issued.action, { data: output })));
    const result = await invoke(['submit', '--continuation-file', issued.continuationFile, '--submission-file', outputPath]);
    assert.equal(result.state, 'complete', `${operation}: ${result.reason}`);
  }
}));

import { nativeClaimFixture } from './fixtures/submitted.ts';
test('existing-story writes complete through MCP without gh', () => withBacklogCli(async ({ dir, call, request }) => {
  const path = join(dir, 'provider.json');
  const definition = JSON.parse(readFileSync(path, 'utf8'));
  definition.bindings.fixture = { kind: 'mcp', tool: 'fixture.github', versions: ['unreported'] };
  for (const operation of Object.values(definition.operations) as any[])
    for (const [step, mapping] of Object.entries(operation.actions) as [string, any][])
      mapping.bindings.fixture.arguments = { op: 'literal', value: { step } };
  writeFileSync(path, JSON.stringify(definition));
  const host = join(dir, 'host.json');
  writeFileSync(host, JSON.stringify({ tools: ['fixture.github'], timeoutMs: 1000, maxOutputBytes: 65536 }));
  const invoke = (args: string[]) => call([...args, '--host-file', host], { PATH: dir });
  const submit = async (response: any, output: unknown) => {
    assert.equal(response.state, 'action', response.reason);
    assert.equal(response.action.tool.kind, 'mcp');
    const outputPath = join(dir, 'observation.json');
    writeFileSync(outputPath, JSON.stringify(submissionFor(response.action, { data: output })));
    return invoke(['submit', '--continuation-file', response.continuationFile, '--submission-file', outputPath]);
  };
  const repository = { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' };
  const pr = { ...submittedReference().item.pullRequestObservation.pullRequest, body: 'Closes #1', isDraft: true };
  const bodyFile = join(dir, 'body.md'); writeFileSync(bodyFile, pr.body);
  for (const operation of ['pull-request.create', 'pull-request.update', 'pull-request.ready']) {
    const input = operation.endsWith('create') ? { title: 'Draft', bodyFile, base: 'main', head: pr.headRef, headRepository: 'R1' }
      : { pullRequest: pr.id, ...(operation.endsWith('update') ? { bodyFile } : {}) };
    let response = await invoke([operation, '--request-file', request(operation, input)]);
    response = await submit(response, { repository });
    response = await submit(response, { pullRequest: operation.endsWith('create') ? null : pr });
    assert.deepEqual(response.action.allowedEffects, [operation]);
    if (operation.endsWith('ready')) pr.isDraft = false;
    response = await submit(response, { pullRequest: pr });
    assert.deepEqual(response.action.allowedEffects, []);
    response = await submit(response, { pullRequest: pr });
    assert.equal(response.state, 'complete', response.reason);
  }
  const item = nativeClaimFixture().item;
  const owned = { ...item, owners: ['actor'], metadata: { ...item.metadata, Status: 'In Progress' } };
  let response = await invoke(['claim.acquire', '--request-file', request('claim.acquire', { item: item.identity })]);
  for (const output of [{ item }, { valid: true, gaps: [] }, { item: { ...item, owners: ['actor'] } },
    { valid: true, gaps: [] }, { item: owned }]) response = await submit(response, output);
  assert.equal(response.state, 'complete', response.reason);
  const token = response.result.claim.token;
  const releasePath = request('claim.release', { item: item.identity, token });
  const release = JSON.parse(readFileSync(releasePath, 'utf8')); release.context.session = response.workerId;
  writeFileSync(releasePath, JSON.stringify(release));
  response = await invoke(['claim.release', '--request-file', releasePath]);
  for (const output of [{ item: owned }, { valid: true, gaps: [] }, { item: { ...item, owners: ['actor'] } },
    { valid: true, gaps: [] }, { item }]) response = await submit(response, output);
  assert.equal(response.state, 'complete', response.reason);
  assert.deepEqual(response.result, { released: true });
}));

test('MCP prerequisite failure precedes backend issuance in a delegated session', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const path = join(dir, 'provider.json');
  const definition = JSON.parse(readFileSync(path, 'utf8'));
  definition.bindings.fixture = { kind: 'mcp', tool: 'fixture.github', versions: ['unreported'] };
  writeFileSync(path, JSON.stringify(definition));
  const host = join(dir, 'host.json');
  writeFileSync(host, JSON.stringify({ tools: [], timeoutMs: 1000, maxOutputBytes: 65536 }));
  const response = await call(['repository.read', '--request-file', request('repository.read', {}), '--host-file', host], { PATH: dir });
  assert.equal(response.state, 'failed');
  assert.equal(response.effects, 'none');
  assert.match(response.reason, /fixture.github unavailable.*no fallback/);
  assert.equal(existsSync(join(dir, 'private', 'operations')), false);
  assert.equal(existsSync(marker), false);
}));

test('contract documents submitted observations and actor-only ordinary resume', () => {
  const document = readFileSync(new URL('../../../docs/backlog-adapter-contract.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  assert.match(document, /Lets owns policy, sequencing, validation and private recovery/);
  assert.match(document, /trusts submitted tool observations/);
  assert.match(document, /Read operations are recorded/);
  assert.match(document, /ordinary resume.*sole assignee.*In Progress/);
  assert.match(document, /original.*worker.*release authority/);
  assert.doesNotMatch(document, /Run the configured executable directly|require matching actor, session, token and In Progress/);
});

test('support status separates offline compatibility from fresh live qualification', () => {
  const document = readFileSync(new URL('../../../docs/backlog-adapter-contract.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  assert.match(document, /unchanged T3.*unqualified/);
  assert.match(document, /standalone CLI.*unqualified/);
  assert.match(document, /CLI acceptance does not qualify MCP/);
  assert.match(document, /actual delegated step.*writable/);
  assert.match(document, /user-directed merge/);
});

test('configuration docs explain defaults shared state and sandbox remedies', () => {
  const document = readFileSync(new URL('../../../docs/backlog-adapter-contract.md', import.meta.url), 'utf8').replace(/\s+/g, ' ');
  for (const term of ['backlog.connection', 'backlog.connections', 'lets.backlog.definition', 'XDG_STATE_HOME', 'backlog.stateDir', '0700', '--host-file'])
    assert.ok(document.includes(term), term);
  assert.match(document, /sole configured connection.*default/);
  assert.match(document, /several.*without.*default.*fail/i);
  assert.match(document, /--connection.*direct.*backlog callers/);
  assert.match(document, /sandbox.*write and lock access/);
});
