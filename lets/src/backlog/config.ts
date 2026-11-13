// Which backlog provider the repository uses: lets.backlog.provider in
// openspec/config.yaml. Node has no YAML parser, so this reads block-style
// lines, with the same rules as the schema: line. Only a setting that is
// absent means github: one this reader cannot read is an error, never
// GitHub.
import { join } from 'node:path';
import type { Io } from '../io.ts';
import { unquote, withoutComment } from '../sync/config.ts';
import { BacklogError } from './adapter.ts';
import type { Provider, Providers } from './providers.ts';

export const CONFIG_PATH = 'openspec/config.yaml';
export const DEFAULT_PROVIDER = 'github';
const ROOT_TIMEOUT_MS = 10_000;

const BLOCK_STYLE = `Only block style is read, such as:
lets:
  backlog:
    provider: github`;

// A line's indent, key and value, or null for a blank or comment line.
function parse(line: string) {
  const content = withoutComment(line);
  if (content.trim() === '') return null;
  const indent = content.length - content.trimStart().length;
  const match = /^([^\s:#][^:]*):(?:\s(.*)|)$/.exec(content.trim());
  return { indent, key: match?.[1].trim() ?? null, value: (match?.[2] ?? '').trim() };
}

// The value of lets.backlog.provider, or null when the file has no top-level
// lets:, or the block has no backlog: or no provider:. Throws
// unknown-backlog-provider for a lets: or backlog: in flow style, and for a
// provider: that is empty or cannot be unquoted.
export function backlogProvider(text: string): string | null {
  const lines = text.split(/\r?\n/).map(parse).filter((line) => line !== null);
  const start = lines.findIndex((line) => line.indent === 0 && line.key === 'lets');
  if (start === -1) return null;
  const flow = (key: string) => new BacklogError('unknown-backlog-provider', `${CONFIG_PATH} holds ${key}: with a value on the same line, which lets cannot read. ${BLOCK_STYLE}`);
  if (lines[start].value !== '') throw flow('lets');

  // The lines of a block: those after start, indented deeper than it.
  const block = (from: number) => {
    const end = lines.findIndex((line, i) => i > from && line.indent <= lines[from].indent);
    return lines.slice(from + 1, end === -1 ? undefined : end).map((line, i) => ({ line, at: from + 1 + i }));
  };
  // The child of a block with this key: a line at the block's first indent.
  const child = (from: number, key: string) => {
    const children = block(from);
    const indent = children[0]?.line.indent;
    return children.find(({ line }) => line.indent === indent && line.key === key) ?? null;
  };

  const backlog = child(start, 'backlog');
  if (backlog === null) return null;
  if (backlog.line.value !== '') throw flow('lets.backlog');
  const provider = child(backlog.at, 'provider');
  if (provider === null) return null;
  const raw = provider.line.value;
  const quote = raw[0];
  const value = unquote(raw);
  if (value === '' || ((quote === '"' || quote === "'") && raw.indexOf(quote, 1) === -1)) {
    throw new BacklogError('unknown-backlog-provider', `${CONFIG_PATH} sets lets.backlog.provider to '${raw}', which lets cannot read. Give a backlog provider's name, such as github.`);
  }
  return value;
}

// The repository's root, as git finds it, or cwd when git finds none, which
// is where gh looks for the repository too.
async function repoRoot(io: Pick<Io, 'execFile'>, cwd: string) {
  const result = await io.execFile('git', ['rev-parse', '--show-toplevel'], { cwd, timeoutMs: ROOT_TIMEOUT_MS });
  const root = result.code === 0 && !result.timedOut ? result.stdout.trim() : '';
  return root === '' ? cwd : root;
}

export type Selection = { name: string; provider: Provider };

// The backlog provider the repository selects. Throws
// unknown-backlog-provider for one this release does not ship, before any
// backend command runs.
export async function selectProvider(io: Pick<Io, 'execFile' | 'readFile'>, cwd: string, providers: Providers): Promise<Selection> {
  const text = io.readFile(join(await repoRoot(io, cwd), CONFIG_PATH));
  const name = (text === null ? null : backlogProvider(text)) ?? DEFAULT_PROVIDER;
  const provider = Object.hasOwn(providers, name) ? providers[name] : undefined;
  if (provider === undefined) {
    throw new BacklogError('unknown-backlog-provider', `${CONFIG_PATH} sets lets.backlog.provider to '${name}', which this release does not ship. The backlog providers it ships: ${Object.keys(providers).join(', ')}.`);
  }
  return { name, provider };
}
