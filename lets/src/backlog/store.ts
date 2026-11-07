import { transaction } from './runtime-context.ts';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync, openSync, closeSync, fsyncSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AdapterFailure } from './errors.ts';
import type { Context } from './github.ts';
export const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export class Store {
  readonly root: string;
  constructor(cwd: string) {
    const active = transaction.getStore();
    if (active) { this.root = active.root; return; }
    let common;
    try { common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
    catch { throw new AdapterFailure('invalid_configuration', 'none', 'backlog mutations require a Git repository'); }
    this.root = resolve(cwd, common, 'lets/backlog');
    mkdirSync(this.root, { recursive: true, mode: 0o700 }); chmodSync(this.root, 0o700);
  }
  read(name: string): any {
    const active = transaction.getStore();
    if (active) return structuredClone(active.records[name]);
    try { return JSON.parse(readFileSync(join(this.root, name + '.json'), 'utf8')); }
    catch (error: any) { if (error.code === 'ENOENT') return undefined; throw new AdapterFailure('conflict', 'none', 'private backlog state is unreadable; reconcile manually'); }
  }
  write(name: string, value: unknown) {
    const active = transaction.getStore();
    if (active) { active.records[name] = structuredClone(value); return; }
    const path = join(this.root, name + '.json'); const temporary = path + '.' + randomUUID();
    const file = openSync(temporary, 'wx', 0o600);
    try { writeFileSync(file, JSON.stringify(value)); fsyncSync(file); } finally { closeSync(file); }
    renameSync(temporary, path);
    const directory = openSync(this.root, 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
  remove(name: string) {
    const active = transaction.getStore();
    if (active) { delete active.records[name]; return; }
    try { unlinkSync(join(this.root, name + '.json')); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    const directory = openSync(this.root, 'r');
    try { fsyncSync(directory); } finally { closeSync(directory); }
  }
  async lock<T>(scope: unknown, run: () => Promise<T>): Promise<T> {
    if (transaction.getStore()) return run();
    const path = join(this.root, hash(scope) + '.lock');
    // The kernel releases this lock when the helper exits. EOF also releases it
    // if the caller dies; no PID guessing or stale-lock takeover is necessary.
    const helper = spawn('flock', ['--exclusive', '--nonblock', path, process.execPath, '-e',
      "process.stdout.write('locked\\n');process.stdin.resume();process.stdin.on('end',()=>process.exit(0));"],
      { stdio: ['pipe', 'pipe', 'ignore'], env: { PATH: process.env.PATH } });
    await new Promise<void>((resolve, reject) => {
      helper.once('error', () => reject(new AdapterFailure('invalid_configuration', 'none', 'required OS flock helper is unavailable')));
      helper.once('exit', () => reject(new AdapterFailure('conflict', 'none', 'another local backlog operation holds the scope lock')));
      helper.stdout.once('data', () => resolve());
    });
    try { const result=await run(); if(helper.exitCode!==null||helper.signalCode!==null)throw new AdapterFailure('unknown_outcome','unknown','scope lock helper exited during the operation; reconcile before progression'); return result; } finally { await new Promise<void>(resolve => { if(helper.exitCode!==null||helper.signalCode!==null){helper.stdin.destroy();resolve();return;} helper.once('exit', () => resolve()); helper.stdin.end(); }); }

  }
}
export const scope = (context: Context) => [context.provider, context.repository, context.backlog];
export const mutationName = (request: Record<string, any>) => 'mutation-' + hash([scope(request.context), request.context.actor, request.context.session, request.mutationId]);
