import { closeSync, constants, fsyncSync, lstatSync, mkdirSync, openSync,
  readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AdapterFailure } from './errors.ts';

/** Prove access to this configured store. Never relocate on failure. */
export function preflightStore(path: string): void {
  const nonce = `.preflight-${randomUUID()}`;
  const lock = join(path, `${nonce}.lock`);
  const temporary = join(path, `${nonce}.tmp`);
  const target = join(path, nonce);
  let lockOwned = false;
  try {
    mkdirSync(path, { recursive: true, mode: 0o700 });
    const stat = lstatSync(path);
    if (!stat.isDirectory() || (stat.mode & 0o077) !== 0 ||
        (process.getuid && stat.uid !== process.getuid())) throw new Error('store must be a user-owned private directory (mode 0700)');
    const fd = openSync(lock, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    lockOwned = true;
    closeSync(fd);
    // A second owner must not acquire an existing exclusive lock.
    try {
      const duplicate = openSync(lock, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
      closeSync(duplicate);
      throw new Error('exclusive lock creation failed');
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    const data = openSync(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
    try { writeFileSync(data, nonce); fsyncSync(data); } finally { closeSync(data); }
    renameSync(temporary, target);
    const directory = openSync(path, constants.O_RDONLY | constants.O_DIRECTORY);
    try { fsyncSync(directory); } finally { closeSync(directory); }
    if (readFileSync(target, 'utf8') !== nonce) throw new Error('atomic replacement verification failed');
  } catch (error) {
    throw new AdapterFailure('invalid_configuration', 'none', `${path}: private recovery unavailable (${String(error)}); configure machine backlog.stateDir or grant this session write and lock access to that shared directory`);
  } finally {
    for (const file of [temporary, target, ...(lockOwned ? [lock] : [])]) {
      try { unlinkSync(file); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && (error as NodeJS.ErrnoException).code !== 'ENOTDIR') { /* Retain original prerequisite failure. */ } }
    }
  }
}
