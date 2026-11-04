import { accessSync, constants, readFileSync, statSync } from 'node:fs';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { parse } from 'yaml';
import { object } from './protocol.ts';
import { validateMappings } from './items.ts';
import type { Mappings } from './items.ts';
import { AdapterFailure } from './errors.ts';

export type Selection = { provider: string; executable: string; backlog?: string; mappings?: Mappings; storage?: { path: string; tracking: 'tracked' | 'ignored' } };
export function resolveConfiguration(document: unknown, cwd: string, env: NodeJS.ProcessEnv = process.env): Selection {
  try {
    if (!isAbsolute(cwd)) throw new Error('repository cwd must be absolute');
    const root = object(document, 'config');
    const lets = root.lets === undefined ? {} : object(root.lets, 'lets');
    const explicit = lets.backlog !== undefined;
    const selection = explicit ? object(lets.backlog, 'lets.backlog') : { provider: 'github', executable: 'lets-backlog-github' };
    for (const key of Object.keys(selection)) if (!['provider', 'executable', 'id', 'mappings', 'storage'].includes(key)) throw new Error(`unsupported backlog setting ${key}`);
    for (const key of ['provider', 'executable']) if (typeof selection[key] !== 'string' || !selection[key]) throw new Error(`${key} required`);
    if (explicit) {
      if (typeof selection.id !== 'string' || !selection.id) throw new Error('one backlog id required');
      validateMappings(selection.mappings as Mappings);
    }
    let storage: Selection['storage'];
    if (selection.storage !== undefined || selection.provider === 'beads') {
      const value = object(selection.storage, 'storage');
      if (Object.keys(value).some(key => !['path', 'tracking'].includes(key))) throw new Error('unknown storage setting');
      if (typeof value.path !== 'string' || !value.path || !['tracked', 'ignored'].includes(value.tracking as string)) throw new Error('storage path and tracking required');
      storage = { path: value.path, tracking: value.tracking as 'tracked' | 'ignored' };
    }
    const name = selection.executable as string;
    const candidates = name.includes('/') ? [resolve(cwd, name)] : (env.PATH ?? '').split(delimiter).map(dir => resolve(cwd, dir, name));
    const executable = candidates.find(path => {
      try { accessSync(path, constants.X_OK); return statSync(path).isFile(); } catch { return false; }
    });
    if (!executable) throw new Error('executable unavailable; no fallback');
    return { provider: selection.provider as string, executable, ...(explicit ? { backlog: selection.id as string, mappings: selection.mappings as Mappings } : {}), ...(storage ? { storage } : {}) };
  } catch (error) { throw new AdapterFailure('invalid_configuration', 'none', String(error)); }
}
export function readConfiguration(cwd: string, env: NodeJS.ProcessEnv = process.env): Selection {
  let document;
  try { document = parse(readFileSync(join(cwd, 'openspec/config.yaml'), 'utf8')); }
  catch (error) { throw new AdapterFailure('invalid_configuration', 'none', `cannot read OpenSpec configuration: ${String(error)}`); }
  return resolveConfiguration(document, cwd, env);
}
