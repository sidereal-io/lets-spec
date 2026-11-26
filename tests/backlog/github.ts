// The fixture for the black-box tests of lets backlog: a temporary git
// repository, a stand-in gh that answers from a table, and the user's and
// the repository's lets config. Not named *.test.ts, so node --test does
// not run it.
//
//   const b = backlog(t, [...LOOKUP_ONE, { args: ['issue', 'view', '7'], prefix: true, ...json({...}) }]);
//   const result = await b.lets('item', '7');
//   b.json(result), b.calls()
//
// The write commands answer from a stand-in issue, whose state the
// stand-in keeps between calls:
//
//   const b = backlog(t, [...LOOKUP_ONE, issue()], { state: issueState({ assignees: ['hubot'] }) });
//   await b.lets('claim', '149');
//   b.state().assignees
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';
import { git, type LetsResult, runLets, sharedState, type StandInRow, standIn, tempDir } from '../support/lets.ts';
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

/** The lets config files, other files of the repository, and the stand-in's state, for `backlog`. */
export interface BacklogFiles {
  /** The user's lets config. Absent when not given. */
  config?: string;
  /** The repository's lets config. Absent when not given. */
  repoConfig?: string;
  /** Other files, by their path from the repository's root. */
  files?: Record<string, string>;
  /** The state the stand-in `gh` starts with, such as an `issueState`. `{}` when absent. */
  state?: unknown;
}

/** One session of lets backlog in a test's repository, with a stand-in `gh` of its own. */
export interface Session {
  /** Runs `lets backlog <args>`, as `Backlog.lets` does, with this session's `gh`. */
  lets(...args: string[]): Promise<LetsResult>;
  /** The argument list of each call to this session's `gh`, in order. Empty before the first. */
  calls(): string[][];
}

/** One test's repository, and lets backlog run in it. */
export interface Backlog extends Session {
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
  /** The state the stand-ins left, which every session shares. */
  state(): any;
  /** Resolves once `count` calls came to `gate`, in any session. Rejects as `SharedState.waiting` does. */
  waiting(gate: string, count: number): Promise<void>;
  /** Lets every call at `gate` go on, in every session, now and later. */
  open(gate: string): void;
  /**
   * Another session in the same repository, with the same lets config and
   * the same state, and a stand-in `gh` of its own, which answers from
   * `rows` and logs its own calls.
   */
  session(rows: StandInRow[]): Session;
}

/**
 * Makes a repository for the test `t`, with `git init`, in a temporary
 * folder removed after the test, and a stand-in `gh` that answers from
 * `rows` in a folder of its own, from a state that starts as `state`.
 * Writes the user's lets config when `config` is given, the repository's
 * when `repoConfig` is, and each of `files`. A `gh` call no row answers
 * exits 127. Throws when git cannot make the repository.
 */
export function backlog(t: TestContext, rows: StandInRow[], { config, repoConfig, files = {}, state = {} }: BacklogFiles = {}): Backlog {
  const tmp = tempDir(t);
  const repo = join(tmp, 'repo');
  const xdg = join(tmp, 'xdg');
  for (const dir of [repo, xdg]) mkdirSync(dir);
  const init = git(repo, 'init', '--quiet');
  if (init.code !== 0) throw new Error(`git init failed in ${repo}: ${init.stderr}`);
  const shared = sharedState(join(tmp, 'shared'), state);
  const session = (table: StandInRow[]): Session => {
    const bin = mkdtempSync(join(tmp, 'bin-'));
    const gh = standIn(bin, 'gh', table, { shared });
    return {
      lets: (...args) => runLets(['backlog', ...args], { cwd: repo, standIns: bin, env: { XDG_CONFIG_HOME: xdg } }),
      calls: gh.calls,
    };
  };
  const first = session(rows);
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
    ...first,
    json: (result) => {
      if (!/^[^\n]+\n$/.test(result.stdout)) throw new Error(`expected one line of JSON on stdout, got:\n${result.output}`);
      return JSON.parse(result.stdout);
    },
    repo,
    configFile,
    repoConfigFile,
    state: shared.read,
    waiting: shared.waiting,
    open: shared.open,
    session,
  };
}
