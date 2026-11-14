// Which backlog provider to use: backlog.provider in the user's lets config,
// $XDG_CONFIG_HOME/lets/config.yaml or ~/.config/lets/config.yaml. Only a
// setting that is absent means github: one that lets cannot read is an
// error, never GitHub. lets keeps its settings out of openspec/config.yaml,
// which is OpenSpec's file.
import type { ConfigDeps } from '../delegate/config.ts';
import { configPath, parseDocument } from '../delegate/config.ts';
import { UsageError } from '../resolvers/kit/errors.ts';
import { BacklogError } from './adapter.ts';
import type { Provider, Providers } from './providers.ts';

export const DEFAULT_PROVIDER = 'github';

// The value of backlog.provider in a document parseDocument checked, or null
// when backlog or backlog.provider is absent or null. Throws
// unknown-backlog-provider, naming the file, when backlog is not a mapping
// or provider is not a name. Other keys under backlog are not checked.
export function backlogProviderFor(document: Record<string, unknown>, path: string): string | null {
  const fail = (message: string) => new BacklogError('unknown-backlog-provider', `${path}: ${message}.`);
  const { backlog } = document;
  if (backlog === undefined || backlog === null) return null;
  if (typeof backlog !== 'object' || Array.isArray(backlog)) throw fail(`backlog must be a mapping, got ${JSON.stringify(backlog)}`);
  const { provider } = backlog as Record<string, unknown>;
  if (provider === undefined || provider === null) return null;
  if (typeof provider !== 'string' || provider === '') {
    throw fail(`backlog.provider must be a backlog provider's name, such as github, got ${JSON.stringify(provider)}`);
  }
  return provider;
}

export type Selection = { name: string; provider: Provider; path: string; set: boolean };

// The backlog provider the user's lets config selects. Throws
// unknown-backlog-provider for a config lets cannot read, or a backlog
// provider this release does not ship, before any backend command runs.
export function selectProvider(deps: ConfigDeps, providers: Providers): Selection {
  const path = configPath(deps);
  let text: string | null;
  try {
    text = deps.io.readFile(path);
  } catch (error) {
    // A file that exists but cannot be read, such as a folder or one
    // without read permission, is never taken for absence.
    throw new BacklogError('unknown-backlog-provider', `The backlog provider cannot be read: ${path}: ${(error as Error).message}.`);
  }
  let named: string | null = null;
  if (text !== null) {
    try {
      named = backlogProviderFor(parseDocument(text, path), path);
    } catch (error) {
      if (!(error instanceof UsageError)) throw error;
      throw new BacklogError('unknown-backlog-provider', `The backlog provider cannot be read: ${error.message}`);
    }
  }
  const name = named ?? DEFAULT_PROVIDER;
  const provider = Object.hasOwn(providers, name) ? providers[name] : undefined;
  if (provider === undefined) {
    throw new BacklogError('unknown-backlog-provider', `${path} sets backlog.provider to '${name}', which this release does not ship. The backlog providers it ships: ${Object.keys(providers).join(', ')}.`);
  }
  return { name, provider, path, set: named !== null };
}
