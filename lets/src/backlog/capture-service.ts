import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, open, realpath, chmod } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { parse, Kind } from 'graphql';
import { canonical, validateAction } from './action-contract.ts';
import type { Action, Capture, TrustedTool } from './action-contract.ts';

export type CaptureTool = TrustedTool & { classifier: 'graphql'; credentialsFile: string };
export type CaptureServiceConfig = { socket: string; stateDirectory: string; serviceUid: number; tools: Record<string, CaptureTool> };
export type ServiceBoundary = { verifyPaths?: (config: CaptureServiceConfig) => Promise<void>; credentials?: (file: string) => Promise<Record<string, string>> };
export function exactKeys(value: unknown, names: string[]): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
}
export function validateTool(value: unknown): asserts value is TrustedTool {
  if (!exactKeys(value, ['id', 'digest', 'authentication', 'executable', 'argv']) || ![value.id, value.authentication, value.executable].every(v => typeof v === 'string' && v.length > 0) || !isAbsolute(value.executable) || !/^[a-f0-9]{64}$/.test(value.digest) || !Array.isArray(value.argv) || !value.argv.every(v => typeof v === 'string')) throw new Error('invalid pinned tool');
}
/** Every component must be a real protected path; symlinks and writable ancestors fail closed. */
export async function protectedPath(path: string, owners: number[], leaf: 'file' | 'directory' | 'socket', privateLeaf = false): Promise<void> {
  if (!isAbsolute(path)) throw new Error('capture paths must be absolute');
  let current = path;
  while (true) {
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || !owners.includes(stat.uid) || (stat.mode & (current === path && leaf === 'socket' ? 0o002 : 0o022)) !== 0 || (current === path && privateLeaf && (stat.mode & 0o077) !== 0)) throw new Error('capture path is editable or has an untrusted owner');
    if (current === path && !(leaf === 'file' ? stat.isFile() : leaf === 'socket' ? stat.isSocket() : stat.isDirectory())) throw new Error('unexpected capture path type');
    const parent = dirname(current);
    if (current === parent) break;
    current = parent;
  }
}
export async function readCaptureServiceConfig(path: string): Promise<CaptureServiceConfig> {
  await protectedPath(path, [0], 'file');
  return JSON.parse(await readFile(path, 'utf8'));
}
async function verifyPaths(config: CaptureServiceConfig): Promise<void> {
  if (config.serviceUid === 0 || config.serviceUid !== process.getuid?.()) throw new Error('capture runner requires its separate service account');
  await protectedPath(config.stateDirectory, [0, config.serviceUid], 'directory', true);
  if ((await lstat(config.stateDirectory)).uid !== config.serviceUid) throw new Error('state directory must belong to service account');
  await protectedPath(dirname(config.socket), [0, config.serviceUid], 'directory');
  for (const tool of Object.values(config.tools)) {
    await protectedPath(tool.executable, [0], 'file');
    if (await realpath(tool.executable) !== tool.executable || createHash('sha256').update(await readFile(tool.executable)).digest('hex') !== tool.digest) throw new Error('pinned executable digest mismatch');
    await protectedPath(tool.credentialsFile, [0, config.serviceUid], 'file', true);
  }
}
function validateConfig(config: CaptureServiceConfig): void {
  if (!exactKeys(config, ['socket', 'stateDirectory', 'serviceUid', 'tools']) || !isAbsolute(config.socket) || !isAbsolute(config.stateDirectory) || !Number.isSafeInteger(config.serviceUid) || config.serviceUid < 0 || !config.tools || typeof config.tools !== 'object' || Array.isArray(config.tools) || !Object.keys(config.tools).length) throw new Error('invalid capture service configuration');
  for (const [id, tool] of Object.entries(config.tools)) {
    if (!exactKeys(tool, ['id', 'digest', 'authentication', 'executable', 'argv', 'classifier', 'credentialsFile']) || tool.classifier !== 'graphql' || typeof tool.credentialsFile !== 'string' || !isAbsolute(tool.credentialsFile)) throw new Error('invalid capture tool rule');
    const { classifier: _, credentialsFile: __, ...identity } = tool;
    validateTool(identity);
    if (id !== tool.id) throw new Error('tool ID does not match rule');
  }
}
function permission(action: Action, tool: CaptureTool): void {
  const { classifier: _, credentialsFile: __, ...identity } = tool;
  if (canonical(identity) !== canonical(action.tool)) throw new Error('untrusted tool identity');
  if (!action.stdin || Object.keys(action.stdin).some(key => !['query', 'variables'].includes(key)) || typeof action.stdin.query !== 'string' || (action.stdin.variables !== undefined && (!action.stdin.variables || typeof action.stdin.variables !== 'object' || Array.isArray(action.stdin.variables)))) throw new Error('invalid GraphQL input');
  const document = parse(action.stdin.query, { maxTokens: 10000 });
  const operations = document.definitions.filter(definition => definition.kind === Kind.OPERATION_DEFINITION);
  if (operations.length !== 1 || operations[0]!.operation !== (action.mode === 'read' ? 'query' : 'mutation')) throw new Error('GraphQL operation violates action permission');
}
async function durableCreate(path: string, value: unknown, directory: string): Promise<boolean> {
  let file;
  try { file = await open(path, 'wx', 0o600); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return false; throw error; }
  try { await file.writeFile(JSON.stringify(value)); await file.sync(); } finally { await file.close(); }
  const parent = await open(directory, 'r');
  try { await parent.sync(); } finally { await parent.close(); }
  return true;
}
async function run(action: Action, environment: Record<string, string>, cwd: string): Promise<Capture> {
  const startedAt = Date.now();
  const base: Capture = { version: 1, id: action.id, actionId: action.id, actionDigest: action.digest, tool: action.tool, stdin: action.stdin, startedAt, finishedAt: startedAt, dispatched: true, state: 'unknown', exitCode: null, signal: null, stdout: '', stderr: '', bytes: 0 };
  if (startedAt >= action.expiresAt) return {...base,dispatched:false,state:'rejected'};
  return new Promise(resolve => {
    let settled = false;
    const child = spawn(action.tool.executable, action.tool.argv, { cwd, env: environment, shell: false, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks: { stdout: Buffer[]; stderr: Buffer[] } = { stdout: [], stderr: [] };
    let bytes = 0;
    const finish = (complete: boolean, code: number | null, signal: string | null) => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      resolve({ ...base, finishedAt: Date.now(), state: complete ? 'complete' : 'unknown', exitCode: code, signal, stdout: Buffer.concat(chunks.stdout).toString('utf8'), stderr: Buffer.concat(chunks.stderr).toString('utf8'), bytes });
    };
    const kill = () => { try { if (child.pid) process.kill(-child.pid, 'SIGKILL'); } catch {} };
    const timer = setTimeout(() => { kill(); finish(false, null, 'SIGKILL'); }, Math.max(1, Math.min(action.timeoutMs, action.expiresAt - startedAt)));
    const collect = (stream: 'stdout' | 'stderr', chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > action.maxBytes) { kill(); finish(false, null, 'SIGKILL'); return; }
      chunks[stream].push(chunk);
    };
    child.stdout.on('data', chunk => collect('stdout', chunk));
    child.stderr.on('data', chunk => collect('stderr', chunk));
    child.on('error', () => finish(false, null, null));
    child.on('close', (code, signal) => finish(code === 0 && signal === null, code, signal));
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(action.stdin));
  });
}
export async function startCaptureService(config: CaptureServiceConfig, boundary: ServiceBoundary = {}) {
  validateConfig(config);
  await (boundary.verifyPaths ?? verifyPaths)(config);
  const credentials = boundary.credentials ?? (async (file: string) => {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.entries(value).every(([key, item]) => /^[A-Z_][A-Z0-9_]*$/.test(key) && typeof item === 'string' && !['NODE_OPTIONS', 'LD_PRELOAD', 'LD_LIBRARY_PATH', 'DYLD_INSERT_LIBRARIES'].includes(key))) throw new Error('invalid protected credential environment');
    return value as Record<string, string>;
  });
  const inFlight = new Map<string, string>();
  const server = createServer(async (request, response) => {
    let activeId: string | undefined;
    const reply = (status: number, body: unknown) => { response.writeHead(status, {'content-type': 'application/json'}); response.end(JSON.stringify(body)); };
    try {
      if (request.method === 'POST' && request.url === '/execute') {
        const chunks: Buffer[] = []; let size = 0;
        for await (const chunk of request) { size += chunk.length; if (size > 2 * 1048576) { reply(413, {error: 'request too large'}); return; } chunks.push(chunk); }
        const action: Action = JSON.parse(Buffer.concat(chunks).toString());
        // Existing reservations are authoritative even after expiry; never redispatch.
        if (!action || typeof action.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(action.id)) { reply(400, {error:'invalid action ID'}); return; }
        const existing = inFlight.get(action.id);
        if (existing !== undefined) { reply(existing === canonical(action) ? 200 : 409, existing === canonical(action) ? {reference:action.id} : {error:'action ID conflict'}); return; }
        inFlight.set(action.id, canonical(action)); activeId = action.id;
        const reservationPath = join(config.stateDirectory, `${action.id}.reservation.json`);
        try { const previous = JSON.parse(await readFile(reservationPath, 'utf8')); if (previous.actionDigest !== action.digest || previous.request !== canonical(action)) { reply(409, {error:'action ID conflict'}); return; } reply(200, {reference: action.id}); return; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
        validateAction(action);
        const tool = config.tools[action.tool.id];
        if (!tool) throw new Error('untrusted tool');
        permission(action, tool);
        await (boundary.verifyPaths ?? verifyPaths)(config);
        const environment = await credentials(tool.credentialsFile);
        validateAction(action);
        const now = Date.now();
        const unknown: Capture = {version:1,id:action.id,actionId:action.id,actionDigest:action.digest,tool:action.tool,stdin:action.stdin,startedAt:now,finishedAt:now,dispatched:true,state:'unknown',exitCode:null,signal:null,stdout:'',stderr:'',bytes:0};
        if (!await durableCreate(reservationPath, { actionDigest: action.digest, request: canonical(action), capture: unknown }, config.stateDirectory)) {
          const previous = JSON.parse(await readFile(reservationPath, 'utf8'));
          reply(previous.request === canonical(action) ? 200 : 409, previous.request === canonical(action) ? {reference:action.id} : {error:'action ID conflict'}); return;
        }
        const capture = await run(action, environment, config.stateDirectory);
        await durableCreate(join(config.stateDirectory, `${action.id}.capture.json`), capture, config.stateDirectory);
        reply(200, {reference: action.id}); return;
      }
      const match = /^\/receipts\/([A-Za-z0-9_-]{1,128})$/.exec(request.url ?? '');
      if (request.method === 'GET' && match) {
        try { reply(200, JSON.parse(await readFile(join(config.stateDirectory, `${match[1]}.capture.json`), 'utf8'))); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; const reservation = JSON.parse(await readFile(join(config.stateDirectory, `${match[1]}.reservation.json`), 'utf8')); reply(200, reservation.capture); }
        return;
      }
      reply(404, {error:'capture unavailable'});
    } catch { reply(400, {error:'capture request rejected; reconcile any previously issued action'}); }
    finally { if (activeId !== undefined) inFlight.delete(activeId); }
  });
  server.requestTimeout = 190000; server.headersTimeout = 10000;
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(config.socket, () => { server.off('error', reject); resolve(); }); });
  await chmod(config.socket, 0o660);
  let closing: Promise<void> | undefined;
  return { server, close: () => closing ??= new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}
