// The lets config: the user's lets config, merged with the repository's
// lets config, .lets/config.yaml at the repository root, whose values win.
// It holds the chain, the resolvers lets asks, in order, the guidance for
// each kind of delegation, and the settings of lets go and lets backlog.
// People write both files by hand, and lets is the only reader. Keys this
// lets does not know are ignored, so a later lets can add one beside them.
import { join } from 'node:path';
import { parse } from 'yaml';
import { configDir } from '../config-dir.ts';
import type { Deps, Io } from '../io.ts';
import { findRepoRoot } from './git.ts';
import { UsageError } from '../resolvers/kit/errors.ts';
import type { Intent, Strategy } from './strategies.ts';

export const CONFIG_VERSION = 3;
// The resolvers built into lets, by the names the chain lists them under.
export const RESOLVER_NAMES = ['t3', 'cli', 'subagent'] as const;
export type ResolverName = (typeof RESOLVER_NAMES)[number];
// The question modes go.questions may set for lets-go.
export const QUESTION_MODES = ['ask', 'auto'] as const;
export type QuestionMode = (typeof QUESTION_MODES)[number];

// The file's shape, with the keys this lets does not know dropped. delegate
// is {} when the file has none. Each resolver is one of RESOLVER_NAMES.
// review, handoff and step are as the user wrote them: only lets delegate
// <strategy> instructions reads them, through guidanceFor, so a bad entry
// never stops a run.
export type Config = {
  version: typeof CONFIG_VERSION;
  delegate: { resolvers?: ResolverName[]; review?: unknown; handoff?: unknown; step?: unknown };
};

export type ConfigDeps = { env: Deps['env']; io: Io };

// config.yaml in the lets config folder.
export function configPath({ env, io }: ConfigDeps): string {
  return join(configDir(env, io.homedir()), 'config.yaml');
}

// The repository's lets config, under the repository root.
export const REPO_CONFIG_PATH = '.lets/config.yaml';

// The lets config in effect where cwd is: the user's lets config, merged
// with the repository's lets config when cwd is in a Git repository whose
// root holds one. Each file is checked whole first, with parseDocument.
// Throws a UsageError that names the file when one cannot be read or is
// not a valid document.
export async function readLetsConfig(deps: ConfigDeps & { cwd: string }): Promise<LetsConfig> {
  const userPath = configPath(deps);
  const root = await findRepoRoot(deps.cwd, deps.io);
  const repoPath = root === null ? null : join(root, REPO_CONFIG_PATH);
  const read = (path: string | null): Record<string, unknown> | null => {
    if (path === null) return null;
    let text: string | null;
    try {
      text = deps.io.readFile(path);
    } catch (error) {
      // A file that exists but cannot be read, such as a folder or one
      // without read permission, is never taken for absence.
      throw new UsageError(`${path}: cannot be read: ${(error as Error).message}.`);
    }
    return text === null ? null : parseDocument(text, path);
  };
  const user = read(userPath);
  const repo = read(repoPath);
  return mergeDocuments({ path: userPath, document: user }, { path: repoPath ?? join(deps.cwd, REPO_CONFIG_PATH), document: repo });
}

// The delegate config in effect where cwd is, or null when there is
// neither file, and the file each value came from. Throws a UsageError that
// names the file and the bad value when either file, or the delegate
// section in effect, is not valid.
export async function readConfig(deps: ConfigDeps & { cwd: string }): Promise<{ config: Config | null; fileOf: FileOf }> {
  const { document, fileOf } = await readLetsConfig(deps);
  return { config: document === null ? null : checkConfig(document, fileOf), fileOf };
}

// The document in text, read from path, with every key as written. Throws a
// UsageError that names the file when it is not YAML, not a mapping, or not
// version 3. Each command group checks only its own section of it.
export function parseDocument(text: string, path: string): Record<string, unknown> {
  const fail = (message: string) => new UsageError(`${path}: ${message}.`);
  let value: unknown;
  try {
    value = parse(text);
  } catch (error) {
    throw fail(`is not YAML: ${(error as Error).message.split('\n')[0].replace(/:$/, '')}`);
  }
  if (!isObject(value)) throw fail(`must be a mapping with version, got ${show(value)}`);
  if (value.version !== CONFIG_VERSION) throw fail(`version must be ${CONFIG_VERSION}, got ${show(value.version)}`);
  return value;
}

// The delegate section of a document parseDocument checked, or of the two
// files merged. Throws a UsageError that names the file fileOf gives for the
// bad key, and the bad value.
export function checkConfig(value: Record<string, unknown>, fileOf: FileOf): Config {
  const fail = (key: string, message: string) => new UsageError(`${fileOf(key)}: ${message}.`);
  const delegate = value.delegate ?? {};
  if (!isObject(delegate)) throw fail('delegate', `delegate must be a mapping, got ${show(delegate)}`);
  const config: Config = { version: CONFIG_VERSION, delegate: {} };
  const { resolvers } = delegate;
  if (resolvers !== undefined && resolvers !== null) {
    if (!Array.isArray(resolvers)) throw fail('delegate.resolvers', `delegate.resolvers must be a list, got ${show(resolvers)}`);
    resolvers.forEach((entry: unknown, i: number) => {
      if (!(RESOLVER_NAMES as readonly unknown[]).includes(entry)) throw fail('delegate.resolvers', `delegate.resolvers[${i}] must be t3, cli or subagent, got ${show(entry)}`);
    });
    config.delegate.resolvers = resolvers;
  }
  for (const strategy of ['review', 'handoff', 'step'] as const) {
    if (delegate[strategy] !== undefined) config.delegate[strategy] = delegate[strategy];
  }
  return config;
}

// The guidance for an intent, from delegate.<strategy>.<intent>.guidance,
// or null when there is no config or any level is missing. Throws a
// UsageError that names the file fileOf gives for the dotted key, and the
// key, when a level has the wrong type. Other strategies' and other
// intents' entries are not checked.
export function guidanceFor(config: Config | null, strategy: Strategy, intent: Intent, fileOf: FileOf): string | null {
  const fail = (key: string, expected: string, value: unknown) =>
    new UsageError(`${fileOf(key)}: ${key} must be ${expected}, got ${JSON.stringify(value) ?? String(value)}.`);
  const entry = config?.delegate[strategy];
  if (entry === undefined || entry === null) return null;
  if (!isObject(entry)) throw fail(`delegate.${strategy}`, 'a mapping', entry);
  const forIntent = entry[intent];
  if (forIntent === undefined || forIntent === null) return null;
  if (!isObject(forIntent)) throw fail(`delegate.${strategy}.${intent}`, 'a mapping', forIntent);
  const { guidance } = forIntent;
  if (guidance === undefined || guidance === null) return null;
  if (typeof guidance !== 'string') throw fail(`delegate.${strategy}.${intent}.guidance`, 'a string', guidance);
  return guidance;
}

// The default question mode, from go.questions in a document parseDocument
// checked, or null when go or go.questions is missing or null. Throws a
// UsageError that names the file fileOf gives for the key, and the key,
// when either has the wrong type or value. Other keys under go are not
// checked.
export function questionModeFor(document: Record<string, unknown>, fileOf: FileOf): QuestionMode | null {
  const fail = (key: string, expected: string, value: unknown) => new UsageError(`${fileOf(key)}: ${key} must be ${expected}, got ${show(value)}.`);
  const { go } = document;
  if (go === undefined || go === null) return null;
  if (!isObject(go)) throw fail('go', 'a mapping', go);
  const { questions } = go;
  if (questions === undefined || questions === null) return null;
  if (!(QUESTION_MODES as readonly unknown[]).includes(questions)) throw fail('go.questions', QUESTION_MODES.join(' or '), questions);
  return questions as QuestionMode;
}

// One lets config file: where it is, and its document, as parseDocument
// checked it, or null when there is no file.
export type ConfigSource = { path: string; document: Record<string, unknown> | null };

// The path of the file that holds the value in effect at a dotted key, such
// as delegate.resolvers.
export type FileOf = (key: string) => string;

// The lets config in effect: the two files merged, or null when there is
// neither, and the file each value came from.
export type LetsConfig = { document: Record<string, unknown> | null; fileOf: FileOf };

// The user's lets config and the repository's, merged leaf by leaf, the
// repository's value winning. Where both hold a mapping at a key, the two
// merge key by key. Any other repository value replaces the user's whole.
// A repository key that is null counts as absent. fileOf answers the
// repository's path for a value that came from it, or for a key below a
// value it replaced whole, and the user's path otherwise, even for a key
// neither file sets.
export function mergeDocuments(user: ConfigSource, repo: ConfigSource): LetsConfig {
  const fromRepo = new Set<string>();
  const merge = (base: Record<string, unknown>, over: Record<string, unknown>, prefix: string) => {
    const out: Record<string, unknown> = {};
    const set = (key: string, value: unknown) => Object.defineProperty(out, key, { value, enumerable: true, writable: true, configurable: true });
    for (const [key, value] of Object.entries(base)) set(key, value);
    for (const [key, value] of Object.entries(over)) {
      if (value === null || value === undefined) continue;
      const at = `${prefix}${key}`;
      if (isObject(value)) {
        const mine = Object.hasOwn(base, key) && isObject(base[key]) ? base[key] : {};
        set(key, merge(mine, value, `${at}.`));
      } else {
        set(key, value);
        fromRepo.add(at);
      }
    }
    return out;
  };
  const document = user.document === null && repo.document === null ? null : merge(user.document ?? {}, repo.document ?? {}, '');
  const fileOf: FileOf = (key) => {
    const parts = key.split('.');
    for (let n = parts.length; n > 0; n--) if (fromRepo.has(parts.slice(0, n).join('.'))) return repo.path;
    return user.path;
  };
  return { document, fileOf };
}

function show(value: unknown): string {
  return JSON.stringify(value) ?? String(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
