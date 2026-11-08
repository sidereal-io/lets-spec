import { mkdirSync, mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realIo } from '../../../../lets/src/io.ts';
export async function withBacklogCli(run: (fixture: {
  dir: string; marker: string; call: (args: string[]) => Promise<Record<string, any>>;
  request: (operation: string, input: unknown) => string;
}) => Promise<void>) {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync(join(process.cwd(), '.workspace/backlog-cli-'));
  try {
    mkdirSync(join(dir, 'openspec'));
    mkdirSync(join(dir, 'xdg', 'lets'), { recursive: true });
    const marker = join(dir, 'executed');
    const backend = join(dir, 'backend');
    writeFileSync(backend, `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o700 });
    const binding = (step: string) => ({ bindings: { fixture: { arguments: [step], projection: { op: 'path', path: ['data'] } } } });
    const steps = Object.fromEntries(['preflight', 'read-existing', 'create', 'update', 'ready', 'verify', 'read', 'read-branch', 'assign', 'read-assignment', 'status', 'reset-status', 'read-before-unassign', 'unassign', 'verify-release'].map((step) => [step, binding(step)]));
    const operations = Object.fromEntries(['claim.acquire', 'claim.release', 'claim.read', 'repository.read', 'pull-request.read', 'pull-request.create', 'pull-request.update', 'pull-request.ready'].map((operation) => [operation, { actions: steps }]));
    writeFileSync(join(dir, 'provider.json'), JSON.stringify({ schemaVersion: 1, name: 'github', version: '1', contractVersions: [1],
      backend: { name: 'github', versions: ['fixture'] }, bindings: { fixture: { kind: 'cli', tool: backend, versions: ['unreported'] } }, operations }));
    writeFileSync(join(dir, 'openspec', 'config.yaml'), 'lets:\n  backlog:\n    version: 1\n    definition: ../provider.json\n');
    writeFileSync(join(dir, 'xdg', 'lets', 'config.yaml'), `version: 3\nbacklog:\n  stateDir: ${dir}/private\n  connections:\n    local:\n      binding: fixture\n      options:\n        timeoutMs: 1000\n        maxOutputBytes: 65536\n`);
    const call = async (args: string[]) => {
      const result = await realIo().execFile(process.execPath, [fileURLToPath(new URL('../../../../lets/bin/lets', import.meta.url)), 'backlog', ...args], {
        cwd: dir, env: { ...process.env, XDG_CONFIG_HOME: join(dir, 'xdg') }, timeoutMs: 10000,
      });
      if (!result.stdout) throw new Error(result.stderr);
      return JSON.parse(result.stdout);
    };
    const request = (operation: string, input: unknown) => {
      const path = join(dir, 'request.json');
      writeFileSync(path, JSON.stringify({ contractVersion: 1, operation, context: { cwd: dir, provider: 'github', repository: 'R1', actor: 'actor', ...((input as { item?: { backlog: string } }).item ? { backlog: (input as { item: { backlog: string } }).item.backlog } : {}) }, input }));
      return path;
    };
    await run({ dir, marker, call, request });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
