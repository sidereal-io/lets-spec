import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, symlinkSync, readlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AdapterFailure } from './errors.ts';
import type { Context } from './github.ts';
export const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Store {
  readonly root: string;
  constructor(cwd: string) {
    let common;
    try { common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { throw new AdapterFailure('invalid_configuration', 'none', 'backlog mutations require a Git repository'); }
    this.root = resolve(cwd, common, 'lets/backlog');
    mkdirSync(this.root, { recursive: true, mode: 0o700 }); chmodSync(this.root, 0o700);
  }
  read(name: string): any {
    try { return JSON.parse(readFileSync(join(this.root, name + '.json'), 'utf8')); }
    catch (error: any) { if (error.code === 'ENOENT') return undefined; throw new AdapterFailure('conflict', 'none', 'private backlog state is unreadable; reconcile manually'); }
  }
  write(name: string, value: unknown) {
    const path = join(this.root, name + '.json'); const temporary = path + '.' + randomUUID();
    writeFileSync(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' }); renameSync(temporary, path);
  }
  async lock<T>(scope: unknown, run: () => Promise<T>): Promise<T> {
    const path = join(this.root, hash(scope) + '.lock'); const owner = `${process.pid}-${randomUUID()}`;
    try { symlinkSync(owner, path); }
    catch (error: any) {
      if (error.code !== 'EEXIST') throw error;
      const previous = readlinkSync(path); const pid = Number(previous.split('-')[0]);
      let alive = true;
      try { process.kill(pid, 0); } catch (error: any) { if (error.code === 'ESRCH') alive = false; }
      if (alive || !Number.isSafeInteger(pid) || pid <= 0) throw new AdapterFailure('conflict', 'none', 'another local backlog operation holds the scope lock');
      if (readlinkSync(path) === previous) unlinkSync(path);
      try { symlinkSync(owner, path); } catch { throw new AdapterFailure('conflict', 'none', 'scope lock changed; retry after reconciliation'); }
    }
    try { return await run(); } finally { if (readlinkSync(path) === owner) unlinkSync(path); }
  }
}
export const scope = (context: Context) => [context.provider, context.repository, context.backlog];
export const mutationName = (request: Record<string, any>) => 'mutation-' + hash([scope(request.context), request.context.actor, request.context.session, request.mutationId]);
