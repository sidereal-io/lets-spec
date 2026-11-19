// Which backlog provider to use: backlog.provider in the lets config in
// effect, the repository's lets config, .lets/config.yaml at the repository
// root, merged over the user's lets config, $XDG_CONFIG_HOME/lets/config.yaml
// or ~/.config/lets/config.yaml. Only a setting that is absent from both
// means github: one that lets cannot read is an error, never GitHub. lets
// keeps its settings out of openspec/config.yaml, which is OpenSpec's file.
import type { ConfigDeps, FileOf, LetsConfig } from '../delegate/config.ts';
import { readLetsConfig } from '../delegate/config.ts';
import { UsageError } from '../resolvers/kit/errors.ts';
import { BacklogError } from './adapter.ts';
import type { Provider, Providers } from './providers.ts';

export const DEFAULT_PROVIDER = 'github';

// The value of backlog.provider in a document parseDocument checked, or in
// the two files merged, or null when backlog or backlog.provider is absent
// or null. Throws unknown-backlog-provider, naming the file fileOf gives for
// the key, when backlog is not a mapping or provider is not a name. Other
// keys under backlog are not checked.
export function backlogProviderFor(document: Record<string, unknown>, fileOf: FileOf): string | null {
  const fail = (key: string, message: string) => new BacklogError('unknown-backlog-provider', `${fileOf(key)}: ${message}.`);
  const { backlog } = document;
  if (backlog === undefined || backlog === null) return null;
  if (typeof backlog !== 'object' || Array.isArray(backlog)) throw fail('backlog', `backlog must be a mapping, got ${JSON.stringify(backlog)}`);
  const { provider } = backlog as Record<string, unknown>;
  if (provider === undefined || provider === null) return null;
  if (typeof provider !== 'string' || provider === '') {
    throw fail('backlog.provider', `backlog.provider must be a backlog provider's name, such as github, got ${JSON.stringify(provider)}`);
  }
  return provider;
}

// path: the file that set the backlog provider, when set is true.
export type Selection = { name: string; provider: Provider; path: string; set: boolean };

// The backlog provider the lets config in effect selects. Throws
// unknown-backlog-provider for a config lets cannot read, or a backlog
// provider this release does not ship, before any backend command runs.
export async function selectProvider(deps: ConfigDeps & { cwd: string }, providers: Providers): Promise<Selection> {
  let config: LetsConfig;
  try {
    config = await readLetsConfig(deps);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    throw new BacklogError('unknown-backlog-provider', `The backlog provider cannot be read: ${error.message}`);
  }
  const { document, fileOf } = config;
  const named = document === null ? null : backlogProviderFor(document, fileOf);
  const path = fileOf('backlog.provider');
  const name = named ?? DEFAULT_PROVIDER;
  const provider = Object.hasOwn(providers, name) ? providers[name] : undefined;
  if (provider === undefined) {
    throw new BacklogError('unknown-backlog-provider', `${path} sets backlog.provider to '${name}', which this release does not ship. The backlog providers it ships: ${Object.keys(providers).join(', ')}.`);
  }
  return { name, provider, path, set: named !== null };
}
