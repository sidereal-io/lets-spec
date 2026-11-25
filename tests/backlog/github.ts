// The fixture for the black-box tests of lets backlog: a temporary git
// repository, a stand-in gh that answers from a table, and the user's and
// the repository's lets config. Not named *.test.ts, so node --test does
// not run it.
//
//   const b = backlog(t, [...LOOKUP_ONE, { args: ['issue', 'view', '7'], prefix: true, ...json({...}) }]);
//   const result = await b.lets('item', '7');
//   b.json(result), b.calls()
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';
import { git, type LetsResult, runLets, type StandInRow, standIn, tempDir } from '../support/lets.ts';
import type { Comment, IssueData, IssueState } from './issue.ts';

/** The repository the stand-in `gh` says lets runs in. */
export const REPO = 'acme/app';

/** The one Project linked to `REPO`, as the Project lookup prints it. */
export const PROJECT = { number: 7, title: 'Backlog', url: 'https://github.com/users/acme/projects/7', owner: 'acme' };

/** What a stand-in row prints and how it exits: a row without its `args`. */
export type Answer = Omit<StandInRow, 'args' | 'prefix'>;

/** An answer that prints `value` as JSON and a newline, and exits 0. */
export const json = (value: unknown): Answer => ({ stdout: `${JSON.stringify(value)}\n` });

/** An answer that prints `stderr` on standard error, and exits `code`, 1 when absent. */
export const fail = (stderr: string, code = 1): Answer => ({ stderr, code });

/**
 * The row for the Project lookup, `gh api graphql …`, answering that
 * `REPO` has `projects`. It matches by prefix, so a test need not copy the
 * query, and it matches every `gh api graphql` call.
 */
export const lookup = (projects: unknown[]): StandInRow => ({ args: ['api', 'graphql'], prefix: true, ...json({ repo: REPO, projects }) });

/** The Project lookup finding `PROJECT` alone. */
export const LOOKUP_ONE: StandInRow[] = [lookup([PROJECT])];

/**
 * The row for `gh project item-list …`, by prefix, answering with `items`,
 * Project items as gh prints them.
 */
export const itemList = (items: unknown[]): StandInRow => ({ args: ['project', 'item-list'], prefix: true, ...json({ items, totalCount: items.length }) });

/**
 * The row that answers every `gh` call on the issue `number` through the
 * stand-in issue, `answerIssue` in `issue.ts`, as the user `login`. It
 * matches every call, so it goes last in a table: after `LOOKUP_ONE`, and
 * after any row a test adds to make one call fail or answer otherwise.
 * The issue's state is the stand-in's state: `issueState` makes one.
 */
export function issue({ number = 149, login = 'octocat' }: Partial<IssueData> = {}): StandInRow {
  const data: IssueData = { number, login };
  return { args: [], prefix: true, answer: { module: ISSUE_MODULE, name: 'answerIssue', data } };
}

const ISSUE_MODULE = fileURLToPath(new URL('./issue.ts', import.meta.url));

/**
 * An open issue with no assignees, one empty comment page, `nextId` 1, no
 * Status written, no rivals and `ownDeletesOnly` unset, with `partial` on
 * top.
 */
export function issueState(partial: Partial<IssueState> = {}): IssueState {
  return { assignees: [], pages: [[]], nextId: 1, status: [], state: 'OPEN', rivals: [], posted: false, ...partial };
}

/**
 * A claim comment, as lets posts it, with the claim token `token`. By
 * `octocat`, as `OWNER`, with id 1, unless the options say otherwise.
 */
export function claimComment(token: string, { id = 1, login = 'octocat', association = 'OWNER' }: { id?: number; login?: string; association?: string } = {}): Comment {
  return { id, body: `lets-go claimed this issue.\n\nToken: ${token}`, user: { login, type: 'User' }, author_association: association };
}

/** The lets config files, and other files of the repository, for `backlog`. */
export interface BacklogFiles {
  /** The user's lets config. Absent when not given. */
  config?: string;
  /** The repository's lets config. Absent when not given. */
  repoConfig?: string;
  /** Other files, by their path from the repository's root. */
  files?: Record<string, string>;
}

/** One test's repository, and lets backlog run in it. */
export interface Backlog {
  /**
   * Runs `lets backlog <args>` in the repository, with the stand-in `gh`
   * first on `PATH` and `XDG_CONFIG_HOME` the folder that holds
   * `configFile`. Rejects as `runLets` does.
   */
  lets(...args: string[]): Promise<LetsResult>;
  /**
   * The one JSON object on `result`'s standard output. Throws, naming the
   * output, when standard output is not one line of JSON.
   */
  json(result: LetsResult): any;
  /** The argument list of each `gh` call, in order. Empty before the first. */
  calls(): string[][];
  /** The repository's root, a real path. */
  repo: string;
  /** The user's lets config, `<XDG_CONFIG_HOME>/lets/config.yaml`, written or not. */
  configFile: string;
  /** The repository's lets config, `<repo>/.lets/config.yaml`, written or not. */
  repoConfigFile: string;
}

/**
 * Makes a repository for the test `t`, with `git init`, in a temporary
 * folder removed after the test, and a stand-in `gh` that answers from
 * `rows` in a folder of its own. Writes the user's lets config when
 * `config` is given, the repository's when `repoConfig` is, and each of
 * `files`. A `gh` call no row answers exits 127. Throws when git cannot
 * make the repository.
 */
export function backlog(t: TestContext, rows: StandInRow[], { config, repoConfig, files = {} }: BacklogFiles = {}): Backlog {
  const tmp = tempDir(t);
  const repo = join(tmp, 'repo');
  const bin = join(tmp, 'bin');
  const xdg = join(tmp, 'xdg');
  for (const dir of [repo, bin, xdg]) mkdirSync(dir);
  const init = git(repo, 'init', '--quiet');
  if (init.code !== 0) throw new Error(`git init failed in ${repo}: ${init.stderr}`);
  const gh = standIn(bin, 'gh', rows);
  const configFile = join(xdg, 'lets', 'config.yaml');
  const repoConfigFile = join(repo, '.lets', 'config.yaml');
  const write = (path: string, text: string) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  };
  if (config !== undefined) write(configFile, config);
  if (repoConfig !== undefined) write(repoConfigFile, repoConfig);
  for (const [path, text] of Object.entries(files)) write(join(repo, path), text);
  return {
    lets: (...args) => runLets(['backlog', ...args], { cwd: repo, standIns: bin, env: { XDG_CONFIG_HOME: xdg } }),
    json: (result) => {
      if (!/^[^\n]+\n$/.test(result.stdout)) throw new Error(`expected one line of JSON on stdout, got:\n${result.output}`);
      return JSON.parse(result.stdout);
    },
    calls: gh.calls,
    repo,
    configFile,
    repoConfigFile,
  };
}
