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
