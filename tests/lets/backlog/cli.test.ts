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
