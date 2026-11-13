// The backlog providers this release ships, by the name
// lets.backlog.provider gives. Each builds its adapter. One place lists them;
// commands.ts takes the list through its arguments, so tests add a fake.
import type { Io } from '../io.ts';
import type { Adapter } from './adapter.ts';
import { createGithub, parseGithubKey } from './github.ts';

export type Provider = {
  // What the help text says the backlog is.
  description: string;
  // The key and label text names, when it is one of this backlog provider's
  // keys, or null. Decides from the text alone, with no backend call.
  parseKey(text: string): { key: string; label: string } | null;
  // The adapter. It may read the backend, such as to find the backlog.
  create(io: Pick<Io, 'execFile'>, cwd: string): Promise<Adapter>;
};

export type Providers = Record<string, Provider>;

export const PROVIDERS: Providers = {
  github: {
    description: 'the backlog is the one open GitHub Project linked to this repository, and lets calls gh',
    parseKey: parseGithubKey,
    create: createGithub,
  },
};
