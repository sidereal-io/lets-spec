import { closeSync, constants, fsyncSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { AdapterFailure } from './errors.ts';

function bootId(): string | null {
  try { return readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(); } catch { return null; }
}
function start(pid: number): string | null {
  try { return readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ').at(-1)!.split(' ')[19] ?? null; }
  catch { return null; }
}
function provenGone(owner: Record<string, unknown>): boolean {
  if (owner.host !== hostname() || typeof owner.bootId !== 'string' || typeof owner.processStart !== 'string' ||
      !Number.isSafeInteger(owner.pid) || (owner.pid as number) <= 0 || typeof owner.nonce !== 'string') return false;
  const boot = bootId();
  if (!boot) return false;
  if (boot !== owner.bootId) return true;
  try { process.kill(owner.pid as number, 0); }
  catch (error) { return (error as NodeJS.ErrnoException).code === 'ESRCH'; }
  const observedStart = start(owner.pid as number);
  return observedStart !== null && observedStart !== owner.processStart;
}
/** A short acquisition guard prevents two stale reapers from deleting a new lock. */
export function acquireResourceLock(path: string, key: string): () => void {
  const guard = `${path}.acquiring`;
  const busy = (): never => { throw new AdapterFailure('conflict', 'none', `local lock busy for ${key}; retry when the live holder finishes; ambiguous ownership requires local inspection`); };
  let gate: number;
  try { gate = openSync(guard, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return busy(); throw error; }
  closeSync(gate);
  const nonce = randomUUID();
  try {
    try {
      const owner = JSON.parse(readFileSync(path, 'utf8'));
      if (!owner || !provenGone(owner)) return busy();
      unlinkSync(path);
    } catch (error) {
      if (error instanceof AdapterFailure) throw error;
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return busy();
    }
    const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try { writeFileSync(fd, JSON.stringify({ nonce, host: hostname(), bootId: bootId(), pid: process.pid, processStart: start(process.pid) })); fsyncSync(fd); }
    finally { closeSync(fd); }
  } finally { unlinkSync(guard); }
  return () => {
    const owner = JSON.parse(readFileSync(path, 'utf8'));
    if (owner.nonce === nonce) unlinkSync(path);
  };
}
