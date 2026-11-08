import { prepareBody, prAction } from './pr-actions.ts';
import { claimAction } from './claim-actions.ts';
import { projectArguments } from './projections.ts';
import { accessSync, closeSync, constants, lstatSync, mkdirSync, openSync, readFileSync, readSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { Command } from 'commander';
import { configDir } from '../config-dir.ts';
import { AdapterFailure } from './errors.ts';
import { resolveConfiguration, recoveryStateDirectory, resolveRecordedConnection } from './config.ts';
import { issueAction, parseActionRequest } from './actions.ts';
import { OPERATIONS, MUTATIONS } from './protocol.ts';
import { checkActionPrerequisites } from './capabilities.ts';
import { object } from './protocol.ts';
import { keys } from './definitions.ts';
import { OperationStore } from './operation-store.ts';
import type { Continuation } from './operation-store.ts';

const INPUT_LIMIT = 16 * 1024 * 1024;
function readInput(path: string): string {
  const fd = path === '-' ? 0 : openSync(path, constants.O_RDONLY);
  const chunks: Buffer[] = [];
  let total = 0;
  try {
    while (total <= INPUT_LIMIT) {
      const chunk = Buffer.alloc(Math.min(65536, INPUT_LIMIT + 1 - total));
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (!count) break;
      total += count;
      chunks.push(chunk.subarray(0, count));
    }
  } finally { if (fd !== 0) closeSync(fd); }
  if (total > INPUT_LIMIT) throw new AdapterFailure('invalid_request', 'unknown', 'input exceeds 16 MiB bound');
  return Buffer.concat(chunks).toString('utf8');
}
function yamlFile(path: string): unknown {
  try { return parse(readFileSync(path, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw new AdapterFailure('invalid_configuration', 'none', `${path}: ${String(error)}`); }
}
function available(tool: string): boolean {
  for (const path of tool.includes('/') ? [resolve(tool)] : (process.env.PATH ?? '').split(delimiter).map((dir) => join(dir, tool))) {
    try { accessSync(path, constants.X_OK); if (lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) return true; } catch { /* Try the next PATH entry. */ }
  }
  return false;
}
function emit(response: Record<string, unknown>): void {
  if (response.continuation && typeof response.operationId === 'string') {
    const path = join(process.cwd(), '.workspace', 'lets-backlog', response.operationId);
    mkdirSync(path, { recursive: true, mode: 0o700 });
    const file = join(path, 'continuation.json');
    writeFileSync(file, JSON.stringify(response.continuation), { mode: 0o600 });
    response = { ...response, continuationFile: file };
  }
  process.stdout.write(`${JSON.stringify(response)}\n`);
}
type HostObservations = { tools: string[]; timeoutMs: number; maxOutputBytes: number };
function hostObservations(path?: string): HostObservations | undefined {
  if (!path) return undefined;
  const host = object(JSON.parse(readInput(path)), 'host observations');
  keys(host, ['tools', 'timeoutMs', 'maxOutputBytes'], 'host observations');
  if (!Array.isArray(host.tools) || host.tools.some((tool) => typeof tool !== 'string' || !tool))
    throw new AdapterFailure('invalid_request', 'none', 'host.tools must list this session’s available tool names');
  for (const field of ['timeoutMs', 'maxOutputBytes'])
    if (!Number.isSafeInteger(host[field]) || (host[field] as number) <= 0 || (host[field] as number) > 2147483647)
      throw new AdapterFailure('unsupported', 'none', `host.${field} must declare a finite positive execution bound`);
  return host as HostObservations;
}
function toolAvailable(binding: { kind: string; tool: string }, host?: HostObservations): boolean {
  return binding.kind === 'cli' ? available(binding.tool) && (!host || host.tools.includes(binding.tool))
    : host?.tools.includes(binding.tool) === true;
}

type Options = { hostFile?: string; requestFile?: string; submissionFile?: string; continuationFile?: string; operationId?: string; connection?: string };
async function run(operation: string, options: Options): Promise<void> {
  let store: OperationStore | undefined;
  let continuation: Continuation | undefined;
  try {
    const host = hostObservations(options.hostFile);
    const userFile = join(configDir(process.env, homedir()), 'config.yaml');
    const machine = yamlFile(userFile);
    if (operation === 'submit' || operation === 'resume') {
      if (operation === 'resume' && Number(Boolean(options.continuationFile)) + Number(Boolean(options.operationId)) !== 1)
        throw new AdapterFailure('invalid_request', 'none', 'resume requires exactly one continuation-file or operation-id');
      store = new OperationStore(recoveryStateDirectory(machine, userFile));
      if (options.continuationFile) continuation = JSON.parse(readInput(options.continuationFile));
      const id = options.operationId ?? continuation?.operationId;
      if (!id) throw new AdapterFailure('invalid_request', 'none', 'supply the original continuation or operation ID');
      const original = store.get(id);
      const recorded = original.originalAction ?? original.action;
      resolveRecordedConnection(recorded, machine, userFile);
      const binding = recorded.definition.definition.bindings[recorded.connection.binding];
      checkActionPrerequisites(binding.tool, { toolAvailable: toolAvailable(binding, host), ...recorded.limits }, true);
      if (host && (host.timeoutMs < recorded.limits.timeoutMs || host.maxOutputBytes < recorded.limits.maxOutputBytes))
        throw new AdapterFailure('unsupported', 'none', 'this session cannot enforce the original action bounds; expose compatible execution/output limits before resume or submit');
      if (continuation && JSON.stringify(continuation) !== JSON.stringify(original.continuation))
        throw new AdapterFailure('invalid_request', 'unknown', 'continuation differs from original operation');
      continuation = original.continuation;
      if (operation === 'resume') emit(store.resume(id, Date.now()));
      else emit(store.submit(continuation, readInput(options.submissionFile!), Date.now()));
      return;
    }
    const repositoryFile = join(process.cwd(), 'openspec', 'config.yaml');
    const config = resolveConfiguration(yamlFile(repositoryFile), machine, { repositoryFile, userFile, connection: options.connection });
    const request = parseActionRequest(readInput(options.requestFile!));
    if (request.operation !== operation) throw new AdapterFailure('invalid_request', 'none', 'request operation differs from command');
    if (request.context.cwd !== process.cwd() || request.context.provider !== config.provider ||
        (config.backlog !== undefined && !['backlog.list', 'repository.read'].includes(operation) && request.context.backlog !== config.backlog))
      throw new AdapterFailure('invalid_request', 'none', 'request scope differs from selected repository/backlog');
    if (operation === 'backlog.list' && config.backlog !== undefined)
      (request.input as { selected?: string }).selected = config.backlog;
    const prWrite = ['pull-request.create', 'pull-request.update', 'pull-request.ready'].includes(operation);
    const claimWrite = ['claim.acquire', 'claim.release'].includes(operation);
    if (MUTATIONS.includes(operation) && !prWrite && !claimWrite) throw new AdapterFailure('unsupported', 'none', 'production mutation sequencing is not available yet');
    const relationshipKind = (request.input as { kind?: string }).kind;
    const step = operation === 'repository.read' && (request.input as { owner?: string }).owner !== undefined ? 'bootstrap' : operation === 'relationship.list' && relationshipKind !== 'blocked_by' ? `read-${relationshipKind}` : prWrite || claimWrite ? 'preflight' : operation === 'pull-request.read' && (request.input as { branch?: string }).branch !== undefined ? 'read-branch' : operation === 'item.read' && (request.input as { includeThread?: boolean }).includeThread === true ? 'read-thread' : 'read';
    const mapping = config.definition.definition.operations[operation]?.actions[step]?.bindings[config.connection.binding];
    if (!mapping) throw new AdapterFailure('unsupported', 'none', `selected definition does not map ${operation}/${step}`);
    const binding = config.definition.definition.bindings[config.connection.binding];
    const bounds: Record<string, unknown> = { ...config.connection.options,
      timeoutMs: host ? Math.min(host.timeoutMs, config.connection.options.timeoutMs as number ?? host.timeoutMs) : config.connection.options.timeoutMs,
      maxOutputBytes: host ? Math.min(host.maxOutputBytes, config.connection.options.maxOutputBytes as number ?? host.maxOutputBytes) : config.connection.options.maxOutputBytes,
    };
    checkActionPrerequisites(binding.tool, { toolAvailable: toolAvailable(binding, host),
      timeoutMs: bounds.timeoutMs as number | undefined, maxOutputBytes: bounds.maxOutputBytes as number | undefined }, true);
    store = new OperationStore(config.stateDir);
    const bodyFile = (request.input as { bodyFile?: string }).bodyFile;
    const preparedBody = bodyFile === undefined ? undefined : prepareBody(bodyFile, bounds.maxOutputBytes as number);
    let action = issueAction(request, config.definition, config.connection, {
      step, preparedBody, toolArguments: prWrite || claimWrite ? [] : projectArguments(mapping.arguments, request.input, request.context), allowedEffects: [], requiredCapabilities: [],
      timeoutMs: bounds.timeoutMs as number, maxOutputBytes: bounds.maxOutputBytes as number,
      acceptanceMs: bounds.acceptanceMs as number | undefined ?? 60000,
    }, Date.now());
    if (prWrite) action = prAction(action, 'preflight', Date.now());
    if (claimWrite) action = claimAction(action, 'preflight', Date.now());
    emit(store.issue(action));
  } catch (error) {
    const failure = error instanceof AdapterFailure ? error : new AdapterFailure('invalid_request', 'unknown', String(error));
    const response = { contractVersion: 1, operationId: continuation?.operationId ?? null, workerId: null,
      state: failure.effects === 'none' ? 'failed' : 'needs-reconciliation', category: failure.category,
      effects: failure.effects, reason: failure.message, ...(failure.knownRemoteIds ? { knownRemoteIds: failure.knownRemoteIds } : {}), ...(continuation ? { continuation } : {}) };
    emit(response);
    process.exitCode = 1;
  }
}
export function registerBacklog(program: Command): void {
  const backlog = program.command('backlog').description('Request bounded backend actions, validate submissions, and reconcile private recovery. Executes no provider tools.');
  for (const operation of OPERATIONS)
    backlog.command(operation).requiredOption('--request-file <path>', 'JSON request file, or - for stdin')
      .option('--host-file <path>', 'session tool availability and enforceable bounds as JSON')
      .option('--connection <name>', 'explicit configured connection for this operation')
      .action((options: Options) => run(operation, options));
  backlog.command('submit').option('--host-file <path>', 'session tool availability and enforceable bounds as JSON').requiredOption('--continuation-file <path>', 'original operation continuation')
    .requiredOption('--submission-file <path>', 'submitted tool JSON, or - for stdin')
    .action((options: Options) => run('submit', options));
  backlog.command('resume').option('--host-file <path>', 'session tool availability and enforceable bounds as JSON').option('--continuation-file <path>', 'original operation continuation')
    .option('--operation-id <id>', 'original durable operation ID, after scratch loss')
    .action((options: Options) => run('resume', options));
}
