import { resolve } from 'node:path';
import { object } from './protocol.ts';
import { validateMappings } from './items.ts';
import type { Mappings } from './items.ts';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
import { AdapterFailure } from './errors.ts';
import { keys, loadDefinition, text } from './definitions.ts';
import type { Connection } from './actions.ts';
import type { LoadedDefinition } from './definitions.ts';

export type Configuration = {
  provider: string;
  connection: Connection;
  backlog?: string;
  mappings?: Mappings;
  storage?: { path: string; tracking: 'tracked' | 'ignored' };
  stateDir: string;
  definition: LoadedDefinition;
};
export type ConfigurationSources = {
  connection?: string;
  repositoryFile: string;
  userFile: string;
  readDefinition?: (path: string) => unknown;
  env?: Record<string, string | undefined>;
  home?: string;
};
// Initial shipped identity. Operation translations are added with the GitHub
// runtime; this object authorizes no backend calls by itself.
export const githubDefinition = {
  schemaVersion: 1, name: 'github', version: '1.0.0', contractVersions: [1],
  backend: { name: 'github', versions: ['graphql-v4'] },
  bindings: { gh: { kind: 'cli', tool: 'gh', versions: ['>=2'] } },
  operations: {},
};
/** Repository selection and machine settings never override one another. */
export function resolveConfiguration(repository: unknown, machine: unknown, sources: ConfigurationSources): Configuration {
  const fail = (path: string, message: string): never => {
    throw new AdapterFailure('invalid_configuration', 'none', `${path}: ${message}; fix the selected configuration; no fallback`);
  };
  const repoPath = `${sources.repositoryFile}: lets.backlog`;
  const userPath = `${sources.userFile}: backlog`;
  let selection: Record<string, unknown>;
  let settings: Record<string, unknown>;
  try {
    const root = object(repository, sources.repositoryFile);
    const lets = root.lets === undefined ? {} : object(root.lets, 'lets');
    selection = lets.backlog === undefined ? {} : object(lets.backlog, 'lets.backlog');
    rejectExecutable(selection, 'lets.backlog');
    keys(selection, ['version', 'provider', 'definition', 'id', 'mappings', 'storage'], 'lets.backlog');
    if (lets.backlog !== undefined && selection.version !== 1) throw new Error('lets.backlog.version must be 1');
    if (selection.provider !== undefined) text(selection.provider, 'lets.backlog.provider');
    if (selection.id !== undefined) text(selection.id, 'lets.backlog.id');
    if (selection.mappings !== undefined) validateMappings(selection.mappings as Mappings);
  } catch (error) { return fail(repoPath, String(error)); }
  try {
    const user = object(machine, sources.userFile);
    if (user.version !== undefined && user.version !== 3) throw new Error('version must be 3');
    settings = user.backlog === undefined ? {} : object(user.backlog, 'backlog');
    rejectExecutable(settings, 'backlog');
    keys(settings, ['connections', 'connection', 'stateDir'], 'backlog');
    if (settings.stateDir !== undefined) {
      text(settings.stateDir, 'backlog.stateDir');
      if (!isAbsolute(settings.stateDir)) throw new Error('backlog.stateDir must be absolute and shared across worktrees');
    }
  } catch (error) { return fail(userPath, String(error)); }
  const provider = selection.provider as string | undefined ?? 'github';
  let loaded: LoadedDefinition;
  try {
    if (selection.definition === undefined) {
      if (provider !== 'github') throw new Error('lets.backlog.definition must explicitly select this provider');
      loaded = loadDefinition([{ source: 'shipped:github', value: githubDefinition }]);
    } else {
      text(selection.definition, 'lets.backlog.definition');
      const path = resolve(dirname(sources.repositoryFile), selection.definition);
      const read = sources.readDefinition ?? ((file: string) => JSON.parse(readFileSync(file, 'utf8')));
      try { loaded = loadDefinition([{ source: path, value: read(path) }]); }
      catch (error) { return fail(path, String(error)); }
    }
    if (loaded.definition.backend.name !== provider) throw new Error('definition backend differs from lets.backlog.provider');
    if (selection.storage !== undefined) {
      const storage = object(selection.storage, 'lets.backlog.storage');
      keys(storage, ['path', 'tracking'], 'lets.backlog.storage');
      text(storage.path, 'lets.backlog.storage.path');
      if (!['tracked', 'ignored'].includes(storage.tracking as string)) throw new Error('lets.backlog.storage.tracking must be tracked or ignored');
    } else if (provider === 'beads') throw new Error('lets.backlog.storage and tracking required for local storage');
  } catch (error) { return fail(repoPath, String(error)); }
  const env = sources.env ?? process.env;
  return {
    provider, definition: loaded,
    connection: selectConnection(settings, loaded, sources.userFile, sources.connection),
    ...(selection.id === undefined ? {} : { backlog: selection.id as string }),
    ...(selection.mappings === undefined ? {} : { mappings: selection.mappings as Mappings }),
    ...(selection.storage === undefined ? {} : { storage: selection.storage as Configuration['storage'] }),
    stateDir: settings.stateDir as string | undefined ?? join(env.XDG_STATE_HOME || join(sources.home ?? homedir(), '.local/state'), 'lets'),
  };
}

function rejectExecutable(settings: Record<string, unknown>, path: string): void {
  for (const key of ['executable', 'adapter', 'path'])
    if (key in settings) throw new Error(`${path}.${key} is obsolete; select an inert definition in lets.backlog.definition and configure tools under backlog.connections`);
}

function selectConnection(settings: Record<string, unknown>, definition: LoadedDefinition,
  file: string, explicit?: string): Connection {
  try {
    const connections = settings.connections === undefined ? { gh: { binding: 'gh' } } : object(settings.connections, 'backlog.connections');
    for (const [name, value] of Object.entries(connections)) {
      text(name, 'backlog.connections name');
      const entry = object(value, `backlog.connections.${name}`);
      keys(entry, ['binding', 'options'], `backlog.connections.${name}`);
      text(entry.binding, `backlog.connections.${name}.binding`);
      if (!Object.hasOwn(definition.definition.bindings, entry.binding))
        throw new Error(`backlog.connections.${name}.binding must belong to the selected definition`);
      if (entry.options !== undefined) {
        const options = object(entry.options, `backlog.connections.${name}.options`);
        keys(options, ['endpoint', 'timeoutMs', 'maxOutputBytes', 'acceptanceMs'], `backlog.connections.${name}.options`);
        if (options.endpoint !== undefined) text(options.endpoint, `backlog.connections.${name}.options.endpoint`);
        for (const key of ['timeoutMs', 'maxOutputBytes', 'acceptanceMs'])
          if (options[key] !== undefined && (!Number.isSafeInteger(options[key]) || (options[key] as number) <= 0 || (options[key] as number) > 2147483647))
            throw new Error(`backlog.connections.${name}.options.${key} must be a finite positive bound`);
      }
    }
    if (settings.connection !== undefined) text(settings.connection, 'backlog.connection');
    const names = Object.keys(connections);
    const name = explicit ?? settings.connection ?? (names.length === 1 ? names[0] : undefined);
    if (typeof name !== 'string' || !Object.hasOwn(connections, name))
      throw new Error('backlog.connection must select a configured name; set a default for several connections');
    const selected = object(connections[name], `backlog.connections.${name}`);
    return { name, binding: selected.binding as string, options: structuredClone(selected.options ?? {}) as Record<string, unknown> };
  } catch (error) {
    throw new AdapterFailure('invalid_configuration', 'none', `${file}: backlog.connection: ${String(error)}; select a compatible named connection; no fallback`);
  }
}

import { digest } from './definitions.ts';
import type { IssuedAction } from './actions.ts';
/** Recovery may use only the original binding and non-secret options. */
export function resolveRecordedConnection(action: IssuedAction, machine: unknown, userFile: string): Connection {
  const document = object(machine, userFile);
  if (document.version !== undefined && document.version !== 3)
    throw new AdapterFailure('invalid_configuration', 'none', `${userFile}: version must be 3`);
  const settings = document.backlog === undefined ? {} : object(document.backlog, 'backlog');
  const connection = selectConnection(settings, action.definition, userFile, action.connection.name);
  if (digest(connection) !== action.connection.digest)
    throw new AdapterFailure('invalid_configuration', 'none', `${userFile}: original operation connection changed; restore original connection options for reconciliation; no fallback`);
  return connection;
}
