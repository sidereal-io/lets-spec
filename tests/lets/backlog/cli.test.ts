import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realIo } from '../../../lets/src/io.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submissionFor } from './fixtures/submitted.ts';
const cli = fileURLToPath(new URL('../../../lets/bin/lets', import.meta.url));
test('backlog CLI hands bounded actions to the caller without executing tools', async () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync(join(process.cwd(), '.workspace/backlog-cli-'));
  try {
    mkdirSync(join(dir, 'openspec'));
    mkdirSync(join(dir, 'xdg', 'lets'), { recursive: true });
    const backend = join(dir, 'backend');
    const marker = join(dir, 'executed');
    writeFileSync(backend, `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o700 });
    writeFileSync(join(dir, 'provider.json'), JSON.stringify({ schemaVersion: 1, name: 'github', version: '1',
      contractVersions: [1], backend: { name: 'github', versions: ['fixture'] },
      bindings: { fixture: { kind: 'cli', tool: backend, versions: ['unreported'] } },
      operations: { 'claim.read': { actions: { read: { bindings: { fixture: { arguments: ['ownership'], projection: { op: 'path', path: ['data'] } } } } } }, 'backlog.check': { actions: { read: { bindings: { fixture: {
        arguments: ['read'], projection: { op: 'path', path: ['data'] },
      } } } } } },
    }));
    writeFileSync(join(dir, 'openspec', 'config.yaml'), 'lets:\n  backlog:\n    version: 1\n    definition: ../provider.json\n');
    writeFileSync(join(dir, 'xdg', 'lets', 'config.yaml'), `version: 3\nbacklog:\n  stateDir: ${dir}/private\n  connections:\n    local:\n      binding: fixture\n      options:\n        timeoutMs: 1000\n        maxOutputBytes: 4096\n`);
    const request = join(dir, 'request.json');
    writeFileSync(request, JSON.stringify({ contractVersion: 1, operation: 'backlog.check', context: {
      cwd: dir, provider: 'github', repository: 'R1', backlog: 'P1', actor: 'me',
    }, input: {} }));
    const run = async (args: string[]) => {
      const result = await realIo().execFile(process.execPath, [cli, 'backlog', ...args], {
        cwd: dir, env: { ...process.env, XDG_CONFIG_HOME: join(dir, 'xdg') }, timeoutMs: 10000,
      });
      assert.equal(result.code, 0, result.stderr || result.stdout);
      return JSON.parse(result.stdout);
    };
    const issued = await run(['backlog.check', '--request-file', request]);
    assert.equal(issued.state, 'action');
    assert.equal(existsSync(marker), false);
    assert.equal(issued.action.tool.name, backend);
    assert.equal(JSON.parse(readFileSync(issued.continuationFile, 'utf8')).operationId, issued.operationId);
    const submission = join(dir, 'submission.json');
    writeFileSync(submission, JSON.stringify(submissionFor(issued.action, { data: { valid: true, gaps: [] } })));
    const accepted = await run(['submit', '--continuation-file', issued.continuationFile, '--submission-file', submission]);
    assert.equal(accepted.state, 'complete');
    assert.deepEqual(accepted.result, { valid: true, gaps: [] });
    assert.equal(existsSync(marker), false);
    const definition = loadDefinition([{ source: join(dir, 'provider.json'), value: JSON.parse(readFileSync(join(dir, 'provider.json'), 'utf8')) }]);
    const claim = issueAction({ contractVersion: 1, operation: 'claim.acquire', context: {
      cwd: dir, provider: 'github', repository: 'R1', backlog: 'P1', actor: 'me', session: 'original-worker',
    }, input: { item: { provider: 'github', backlog: 'P1', id: 'I1' } } }, definition,
      { name: 'local', binding: 'fixture', options: { timeoutMs: 1000, maxOutputBytes: 4096 } }, {
        step: 'assign', toolArguments: ['assign'], allowedEffects: ['assignment'], requiredCapabilities: [],
        timeoutMs: 1000, maxOutputBytes: 4096, acceptanceMs: 60000,
      }, Date.now());
    new OperationStore(join(dir, 'private')).issue(claim);
    const resumed = await run(['resume', '--operation-id', claim.operationId]);
    assert.equal(resumed.state, 'action');
    assert.equal(resumed.operationId, claim.operationId);
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.request.operation, 'claim.read');
    assert.equal(existsSync(marker), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { withBacklogCli } from './fixtures/cli.ts';
test('claim CLI starts with read-only eligibility preflight', () => withBacklogCli(async ({ call, request, marker }) => {
  const response = await call(['claim.acquire', '--request-file', request('claim.acquire', {
    item: { provider: 'github', backlog: 'P1', id: 'I1' },
  })]);
  assert.equal(response.state, 'action', response.reason);
  assert.equal(response.action.step, 'preflight');
  assert.deepEqual(response.action.allowedEffects, []);
  assert.equal(existsSync(marker), false);
}));
test('claim release CLI uses the acquired private provenance', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const item = { identity: { provider: 'github', backlog: 'P1', id: 'I1' }, reference: '#1', title: 'Story', body: '', owners: [],
    metadata: { Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' }, repository: 'R1', state: 'OPEN',
    blockers: { complete: true, open: [] }, claimContext: { actorId: 'U1', projectItemId: 'PI1', statusFieldId: 'F1',
      todoOptionId: 'TODO', inProgressOptionId: 'PROGRESS', linkedBacklogs: ['P1'] } };
  let response = await call(['claim.acquire', '--request-file', request('claim.acquire', { item: item.identity })]);
  const submit = async (output: unknown) => {
    const path = join(dir, 'submission.json');
    writeFileSync(path, JSON.stringify(submissionFor(response.action, { data: output })));
    return call(['submit', '--continuation-file', response.continuationFile, '--submission-file', path]);
  };
  const owned = { ...item, owners: ['actor'] };
  const active = { ...owned, metadata: { ...item.metadata, Status: 'In Progress' } };
  for (const output of [{ item }, { valid: true, gaps: [] }, { item: owned }, { valid: true, gaps: [] }, { item: active }])
    response = await submit(output);
  assert.equal(response.state, 'complete', response.reason);
  const claim = response.result.claim;
  const releaseFile = request('claim.release', { item: item.identity, token: claim.token });
  const releaseRequest = JSON.parse(readFileSync(releaseFile, 'utf8'));
  releaseRequest.context.session = claim.session;
  writeFileSync(releaseFile, JSON.stringify(releaseRequest));
  response = await call(['claim.release', '--request-file', releaseFile]);
  assert.equal(response.state, 'action', response.reason);
  assert.deepEqual(response.action.allowedEffects, []);
  for (const output of [{ item: active }, { valid: true, gaps: [] }, { item: owned }, { valid: true, gaps: [] }, { item }])
    response = await submit(output);
  assert.equal(response.state, 'complete', response.reason);
  assert.deepEqual(response.result, { released: true });
  assert.equal(existsSync(marker), false);
}));
test('a claim preflight refuses an item with no Kind before any write', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const item = { identity: { provider: 'github', backlog: 'P1', id: 'I1' }, reference: '#1', title: 'Story', body: '', owners: [],
    metadata: {}, repository: 'R1', state: 'OPEN', blockers: { complete: true, open: [] },
    claimContext: { actorId: 'U1', projectItemId: 'PI1', statusFieldId: 'F1', todoOptionId: 'TODO', inProgressOptionId: 'PROGRESS', linkedBacklogs: ['P1'] } };
  const response = await call(['claim.acquire', '--request-file', request('claim.acquire', { item: item.identity })]);
  assert.equal(response.state, 'action', response.reason);
  const path = join(dir, 'submission.json');
  writeFileSync(path, JSON.stringify(submissionFor(response.action, { data: { item } })));
  const result = await call(['submit', '--continuation-file', response.continuationFile, '--submission-file', path]);
  assert.equal(result.state, 'failed');
  assert.equal(result.effects, 'none');
  assert.match(result.reason, /lacks the selected Project Kind/);
  assert.equal(existsSync(marker), false);
}));
test('PR creation CLI requests repository preflight before any write', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const bodyFile = join(dir, 'body.md');
  writeFileSync(bodyFile, 'Closes #1');
  const result = await call(['pull-request.create', '--request-file', request('pull-request.create', {
    title: 'Draft', bodyFile, base: 'main', head: 'feature', headRepository: 'R1',
  })]);
  assert.equal(result.state, 'action', result.reason ?? JSON.stringify(result));
  assert.equal(result.action.step, 'preflight');
  assert.deepEqual(result.action.allowedEffects, []);
  assert.equal(existsSync(marker), false);
}));
const cliPr = { id: 'PR1', repository: 'R1', headRepository: 'R1', number: 1,
  url: 'https://github.com/fixture/repo/pull/1', state: 'OPEN', isDraft: true, body: 'Closes #1',
  createdAt: '2026-11-08T12:00:00Z', baseRef: 'main', headRef: 'feature', baseSha: null,
  headSha: null, mergeCommit: null, mergeRef: null };
test('PR creation CLI advances only through submitted bounded observations', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const bodyFile = join(dir, 'body.md');
  writeFileSync(bodyFile, 'Closes #1');
  let response = await call(['pull-request.create', '--request-file', request('pull-request.create', {
    title: 'Draft', bodyFile, base: 'main', head: 'feature', headRepository: 'R1',
  })]);
  const operationId = response.operationId;
  const submit = async (output: unknown) => {
    const path = join(dir, 'submission.json');
    writeFileSync(path, JSON.stringify(submissionFor(response.action, { data: output })));
    return call(['submit', '--continuation-file', response.continuationFile, '--submission-file', path]);
  };
  response = await submit({ repository: { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' } });
  assert.equal(response.state, 'action', response.reason ?? JSON.stringify(response));
  assert.equal(response.action.step, 'read-existing');
  const repeated = await call(['submit', '--continuation-file', response.continuationFile, '--submission-file', join(dir, 'submission.json')]);
  assert.equal(repeated.action.actionId, response.action.actionId);
  response = await submit({ pullRequest: null });
  assert.equal(response.action.step, 'create');
  assert.deepEqual(response.action.allowedEffects, ['pull-request.create']);
  assert.equal(response.action.preparedBody.body, 'Closes #1');
  writeFileSync(bodyFile, 'changed after issuance');
  response = await submit({ pullRequest: cliPr });
  assert.equal(response.action.step, 'verify');
  assert.deepEqual(response.action.allowedEffects, []);
  response = await submit({ pullRequest: cliPr });
  assert.equal(response.state, 'complete', response.reason ?? JSON.stringify(response));
  assert.equal(response.operationId, operationId);
  assert.equal(existsSync(marker), false);
}));
test('PR creation CLI stops when a branch PR already exists', () => withBacklogCli(async ({ dir, call, request }) => {
  const bodyFile = join(dir, 'body.md');
  writeFileSync(bodyFile, 'Closes #1');
  let response = await call(['pull-request.create', '--request-file', request('pull-request.create', {
    title: 'Draft', bodyFile, base: 'main', head: 'feature', headRepository: 'R1',
  })]);
  for (const output of [
    { repository: { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' } },
    { pullRequest: cliPr },
  ]) {
    const path = join(dir, 'submission.json');
    writeFileSync(path, JSON.stringify(submissionFor(response.action, { data: output })));
    response = await call(['submit', '--continuation-file', response.continuationFile, '--submission-file', path]);
  }
  assert.equal(response.state, 'failed');
  assert.equal(response.category, 'conflict');
  assert.equal(response.effects, 'none');
}));
test('PR body update CLI confirms the exact prepared body', () => withBacklogCli(async ({ dir, call, request, marker }) => {
  const bodyFile = join(dir, 'body.md');
  const body = 'Closes #1\n\nExisting section\n\nNew review evidence';
  writeFileSync(bodyFile, body);
  let response = await call(['pull-request.update', '--request-file', request('pull-request.update', { pullRequest: 'PR1', bodyFile })]);
  for (const output of [
    { repository: { id: 'R1', owner: 'fixture', name: 'repo', url: 'https://github.com/fixture/repo', defaultBranch: 'main' } },
    { pullRequest: cliPr },
    { pullRequest: { ...cliPr, body } },
    { pullRequest: { ...cliPr, body } },
  ]) {
    assert.equal(response.state, 'action', JSON.stringify(response));
    const path = join(dir, 'submission.json');
    writeFileSync(path, JSON.stringify(submissionFor(response.action, { data: output })));
    response = await call(['submit', '--continuation-file', response.continuationFile, '--submission-file', path]);
  }
  assert.equal(response.state, 'complete', JSON.stringify(response));
  assert.equal(response.result.pullRequest.body, body);
  assert.equal(existsSync(marker), false);
}));

test('repository bootstrap discovers actor without assuming one', () => withBacklogCli(async ({ dir, call, request }) => {
  const path = request('repository.read', { owner: 'fixture', name: 'repo' });
  const body = JSON.parse(readFileSync(path, 'utf8'));
  body.context.repository = 'fixture/repo';
  delete body.context.actor;
  writeFileSync(path, JSON.stringify(body));
  const response = await call(['repository.read', '--request-file', path]);
  assert.equal(response.state, 'action', response.reason);
  assert.equal(response.action.request.context.actor, undefined);
  assert.equal(response.action.step, 'bootstrap');
  assert.deepEqual(response.action.allowedEffects, []);
}));

test('configured Project is selected after discovery without preexisting backlog context', () => withBacklogCli(async ({ dir, call, request }) => {
  const provider = join(dir, 'provider.json');
  const definition = JSON.parse(readFileSync(provider, 'utf8'));
  definition.operations['backlog.list'] = definition.operations['repository.read'];
  writeFileSync(provider, JSON.stringify(definition));
  const config = join(dir, 'openspec', 'config.yaml');
  writeFileSync(config, readFileSync(config, 'utf8') + '    id: P1\n');
  const issued = await call(['backlog.list', '--request-file', request('backlog.list', {})]);
  assert.equal(issued.state, 'action', issued.reason);
  assert.equal(issued.action.request.input.selected, 'P1');
  const path = join(dir, 'projects.json');
  writeFileSync(path, JSON.stringify(submissionFor(issued.action, { data: {
    items: [{ provider: 'github', id: 'P1', title: 'Selected' }], complete: true, nextCursor: null,
  } })));
  const result = await call(['submit', '--continuation-file', issued.continuationFile, '--submission-file', path]);
  assert.equal(result.state, 'complete', result.reason);
  assert.equal(result.result.selectedBacklog.id, 'P1');
}));

test('a configured Project does not block a repository-only PR request', () => withBacklogCli(async ({ dir, call, request }) => {
  const config = join(dir, 'openspec', 'config.yaml');
  writeFileSync(config, readFileSync(config, 'utf8') + '    id: P1\n');
  const issued = await call(['pull-request.read', '--request-file', request('pull-request.read', { pullRequest: 'PR1' })]);
  assert.equal(issued.state, 'action', issued.reason);
  const other = join(dir, 'other.json');
  writeFileSync(other, JSON.stringify({ contractVersion: 1, operation: 'pull-request.read',
    context: { cwd: dir, provider: 'github', repository: 'R1', actor: 'actor', backlog: 'P2' }, input: { pullRequest: 'PR1' } }));
  const mismatched = await call(['pull-request.read', '--request-file', other]);
  assert.equal(mismatched.state, 'failed');
  assert.equal(mismatched.effects, 'none');
  assert.match(mismatched.reason, /scope differs/);
}));

test('no connection config uses shipped gh with declared host bounds', () => withBacklogCli(async ({ dir, call, request }) => {
  writeFileSync(join(dir, 'openspec', 'config.yaml'), '{}\n');
  writeFileSync(join(dir, 'xdg', 'lets', 'config.yaml'), `version: 3\nbacklog:\n  stateDir: ${dir}/private\n`);
  writeFileSync(join(dir, 'gh'), '#!/bin/sh\nexit 99\n', { mode: 0o700 });
  const host = join(dir, 'host.json');
  writeFileSync(host, JSON.stringify({ tools: ['gh'], timeoutMs: 1000, maxOutputBytes: 65536 }));
  const path = request('repository.read', { owner: 'fixture', name: 'repo' });
  const body = JSON.parse(readFileSync(path, 'utf8'));
  body.context.repository = 'fixture/repo'; delete body.context.actor;
  writeFileSync(path, JSON.stringify(body));
  const result = await call(['repository.read', '--request-file', path, '--host-file', host], { PATH: dir });
  assert.equal(result.state, 'action', result.reason);
  assert.equal(result.action.connection.name, 'gh');
  assert.equal(result.action.tool.name, 'gh');
  assert.deepEqual(result.action.limits, { timeoutMs: 1000, maxOutputBytes: 65536 });
  assert.equal(result.action.step, 'bootstrap');
}));
test('submit validates against the continuation it already checked', () => withBacklogCli(async ({ dir, call, request }) => {
  const issued = await call(['item.read', '--request-file', request('item.read', { item: { provider: 'github', backlog: 'P1', id: 'I1' } })]);
  assert.equal(issued.state, 'action', issued.reason);
  const submission = join(dir, 'bad-submission.json');
  writeFileSync(submission, '{');
  const rejected = await call(['submit', '--continuation-file', '-', '--submission-file', submission], {},
    readFileSync(issued.continuationFile, 'utf8'));
  assert.equal(rejected.operationId, issued.operationId);
  assert.match(rejected.reason, /malformed submission JSON/);
}));
for (const [name, args] of [
  ['missing request file', ['item.read', '--request-file', 'missing.json']],
  ['unknown operation ID', ['resume', '--operation-id', '00000000-0000-4000-8000-000000000000']],
  ['truncated continuation file', ['resume', '--continuation-file', 'truncated.json']],
] as const) {
  test(`local ${name} fails without remote effects`, () => withBacklogCli(async ({ dir, call }) => {
    writeFileSync(join(dir, 'truncated.json'), '{"operationId":');
    const response = await call([...args]);
    assert.equal(response.state, 'failed', JSON.stringify(response));
    assert.equal(response.effects, 'none');
    assert.equal(response.operationId, null);
  }));
}
test('an issued action names its definition by digest instead of embedding it', () => withBacklogCli(async ({ dir, call, request }) => {
  const issued = await call(['item.read', '--request-file', request('item.read', { item: { provider: 'github', backlog: 'P1', id: 'I1' } })]);
  assert.equal(issued.state, 'action', issued.reason);
  assert.equal(issued.action.definition.definition, undefined);
  assert.match(issued.action.definition.digest, /^[a-f0-9]{64}$/);
  const submission = join(dir, 'submission.json');
  writeFileSync(submission, JSON.stringify(submissionFor(issued.action, { data: { item: null } })));
  const answered = await call(['submit', '--continuation-file', issued.continuationFile, '--submission-file', submission]);
  assert.notEqual(answered.reason ?? '', 'invalid_request: submission binding differs: definitionDigest');
}));
