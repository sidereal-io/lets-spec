import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { loadDefinition } from './definitions.ts';
import type { Definition } from './definitions.ts';
import { parse } from 'yaml';
import { object } from './protocol.ts';
import { validateMappings } from './items.ts';
import type { Mappings } from './items.ts';
import { AdapterFailure } from './errors.ts';

export type Selection = { provider: string; definition: Definition; definitionDigest: string; backlog?: string; mappings?: Mappings; storage?: { path: string; tracking: 'tracked' | 'ignored' } };
export function resolveConfiguration(document: unknown, cwd: string, env: NodeJS.ProcessEnv = process.env): Selection {
  try {
    if (!isAbsolute(cwd)) throw new Error('repository cwd must be absolute');
    const root = object(document ?? {}, 'config');
    const lets = root.lets === undefined ? {} : object(root.lets, 'lets');
    const explicit = lets.backlog !== undefined;
    const selection = explicit ? object(lets.backlog, 'lets.backlog') : { provider: 'github', definition: {name:'github',version:1} };
    if (Object.hasOwn(selection,'executable')) throw new Error('openspec/config.yaml: lets.backlog.executable is obsolete; replace it with lets.backlog.version 1 and a versioned definition selection');
    for (const key of Object.keys(selection)) if (!['version', 'provider', 'definition', 'id', 'mappings', 'storage'].includes(key)) throw new Error(`unsupported backlog setting ${key}`);
    for (const key of ['provider']) if (typeof selection[key] !== 'string' || !selection[key]) throw new Error(`${key} required`);
    if (explicit) {
      if (selection.version !== 1) throw new Error('openspec/config.yaml: lets.backlog.version must be 1');
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
    const selected = object(selection.definition, 'definition');
    if (Object.keys(selected).some(key => !['name','version','source'].includes(key)) || typeof selected.name !== 'string' || (selected.source !== undefined && (typeof selected.source !== 'string' || !selected.source))) throw new Error('invalid definition selection');
    const loaded = loadDefinition(selected as {name:string;version:number;source?:string}, selection.provider as string, cwd);
    return { provider: selection.provider as string, definition: loaded.definition, definitionDigest: loaded.digest, ...(explicit ? { backlog: selection.id as string, mappings: selection.mappings as Mappings } : {}), ...(storage ? { storage } : {}) };
  } catch (error) { throw new AdapterFailure('invalid_configuration', 'none', String(error)); }
}
export function readConfiguration(cwd: string, env: NodeJS.ProcessEnv = process.env): Selection {
  let document;
  try { document = parse(readFileSync(join(cwd, 'openspec/config.yaml'), 'utf8')); }
  catch (error) { throw new AdapterFailure('invalid_configuration', 'none', `cannot read OpenSpec configuration: ${String(error)}`); }
  return resolveConfiguration(document, cwd, env);
}
