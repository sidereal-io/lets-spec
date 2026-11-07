import { createHash } from 'node:crypto';
import { AdapterFailure, NonDispatchFailure } from './errors.ts';

export type TrustedTool = { id: string; digest: string; authentication: string; executable: string; argv: string[] };
export type Action = {
  version: 1; id: string; workflow: string; sequence: number; name: string;
  scope: { provider: string; repository: string; actor: string; session: string; backlog?: string };
  tool: TrustedTool; stdin: Record<string, unknown>; mode: 'read' | 'write';
  issuedAt: number; expiresAt: number; timeoutMs: number; maxBytes: number; digest: string;
};
export type Capture = {
  version: 1; id: string; actionId: string; actionDigest: string;
  tool: TrustedTool; stdin: Record<string, unknown>;
  startedAt: number; finishedAt: number; dispatched: boolean;
  state: 'complete' | 'unknown' | 'rejected'; exitCode: number | null; signal: string | null;
  stdout: string; stderr: string; bytes: number;
};
export interface CaptureReader { settle?(action: Action): Promise<Capture>; read(reference: string, action: Action, options?: { historical?: boolean }): Promise<Capture> }
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return '{' + Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => JSON.stringify(key) + ':' + canonical(item)).join(',') + '}';
}
export function digest(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }
export function sealAction(value: Omit<Action, 'digest'>): Action { return { ...value, digest: digest(value) }; }
function record(value: unknown): value is Record<string, any> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function keys(value: unknown, required: string[], optional: string[] = []): value is Record<string, any> {
  return record(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
const text = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 4096;
const integer = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0;
export function validateAction(value: unknown, now = Date.now()): asserts value is Action {
  const a = value as Action;
  if (!keys(a, ['version', 'id', 'workflow', 'sequence', 'name', 'scope', 'tool', 'stdin', 'mode', 'issuedAt', 'expiresAt', 'timeoutMs', 'maxBytes', 'digest']) ||
      a.version !== 1 || ![a.id, a.workflow, a.name].every(text) || !integer(a.sequence) ||
      !keys(a.scope, ['provider', 'repository', 'actor', 'session'], ['backlog']) || !Object.values(a.scope).every(text) ||
      !keys(a.tool, ['id', 'digest', 'authentication', 'executable', 'argv']) || ![a.tool.id, a.tool.authentication, a.tool.executable].every(text) ||
      !/^[a-f0-9]{64}$/.test(a.tool.digest) || !Array.isArray(a.tool.argv) || !a.tool.argv.every(arg => typeof arg === 'string') ||
      !record(a.stdin) || !['read', 'write'].includes(a.mode) ||
      ![a.issuedAt, a.expiresAt, a.timeoutMs, a.maxBytes].every(integer) || a.issuedAt > now || a.expiresAt <= now ||
      a.timeoutMs < 1 || a.timeoutMs > 180000 || a.expiresAt <= a.issuedAt || a.expiresAt - a.issuedAt > 180000 ||
      a.timeoutMs > a.expiresAt - a.issuedAt || a.maxBytes < 1 || a.maxBytes > 1048576 ||
      Buffer.byteLength(canonical(a.stdin)) > 1048576) throw new AdapterFailure('invalid_request', 'none', 'invalid or expired bounded action');
  const { digest: expected, ...body } = a;
  if (expected !== digest(body)) throw new AdapterFailure('invalid_request', 'none', 'action digest mismatch');
}
export function capturedReadFailure(c: Capture): AdapterFailure {
  let errors:any[]=[];try{const response=JSON.parse(c.stdout);if(Array.isArray(response?.errors))errors=response.errors;}catch{}
  const types=errors.map(error=>error?.type??error?.extensions?.type);
  const category=types.some(type=>['FORBIDDEN','INSUFFICIENT_SCOPES'].includes(type))?'permission':types.includes('NOT_FOUND')?'not_found':types.some(type=>['UNAUTHORIZED','BAD_CREDENTIALS'].includes(type))?'authentication':'unsupported';
  return new AdapterFailure(category,'none','captured backend read failed');
}
export function verifyCapture(action: Action, capture: unknown, reference: string, now = Date.now(), historical = false): Capture {
  const unknown = () => new AdapterFailure('unknown_outcome', 'unknown', 'independent capture is unavailable, mismatched, stale or incomplete; reconcile original action');
  const c = capture as Capture;
  try { validateAction(action, c?.state === 'rejected' && c?.dispatched === false ? action.issuedAt : historical ? c?.startedAt : now); } catch { throw unknown(); }
  if (!keys(c, ['version', 'id', 'actionId', 'actionDigest', 'tool', 'stdin', 'startedAt', 'finishedAt', 'dispatched', 'state', 'exitCode', 'signal', 'stdout', 'stderr', 'bytes']) ||
      c.version !== 1 || c.id !== reference || c.actionId !== action.id || c.actionDigest !== action.digest ||
      canonical(c.tool) !== canonical(action.tool) || canonical(c.stdin) !== canonical(action.stdin) ||
      !integer(c.startedAt) || !integer(c.finishedAt) || c.startedAt < action.issuedAt || c.finishedAt < c.startedAt ||
      c.finishedAt > now || (!(c.state === 'rejected' && c.dispatched === false) && (c.finishedAt > action.expiresAt || c.finishedAt - c.startedAt > action.timeoutMs)) ||
      typeof c.dispatched !== 'boolean' || !['complete', 'unknown', 'rejected'].includes(c.state) ||
      typeof c.stdout !== 'string' || typeof c.stderr !== 'string' || !integer(c.bytes) ||
      c.bytes !== Buffer.byteLength(c.stdout) + Buffer.byteLength(c.stderr) || c.bytes > action.maxBytes) throw unknown();
  if (c.state === 'rejected' && c.dispatched === false && c.exitCode === null && c.signal === null && c.bytes === 0)
    throw new NonDispatchFailure();
  if (c.state !== 'complete' || !c.dispatched || c.exitCode !== 0 || c.signal !== null) {
    if(action.mode==='read'&&c.dispatched)throw capturedReadFailure(c);
    throw unknown();
  }
  return c;
}
