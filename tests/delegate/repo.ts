// The setup for black-box tests of the lets delegate run commands: a Git
// repository with a lets config and a prompt file, a user config home, and
// a folder for the stand-ins, with lets run there on only the stand-ins and
// git. Not a *.test.ts file, so the test runner does not run it.
import type { TestContext } from 'node:test';
import type { EnvChanges, LetsResult } from '../support/lets.ts';

/** The prompt `p.md` holds when `DelegateSetup.prompt` is absent: quotes and a newline, so a test can see it arrive whole. */
export const PROMPT = 'Say "hi".\nIt\'s fine.\n';

export interface DelegateSetup {
  /** The text of the user's lets config. No file when absent. */
  user?: string;
  /** The text of the repository's `.lets/config.yaml`. No file when absent. */
  repo?: string;
  /** The text of `p.md`. `PROMPT` when absent. */
  prompt?: string;
  /** Leave the repository with no commit, so `HEAD` cannot be read. */
  noCommit?: boolean;
  /**
   * Make no Git repository, and set `GIT_CEILING_DIRECTORIES` to the
   * folder's parent, so git finds no repository above it. `repo` and
   * `noCommit` are then ignored.
   */
  notInRepo?: boolean;
}

export interface DelegateRunOptions {
  /** The folder lets runs in. The repository's root when absent. */
  cwd?: string;
  /** Applied on top of the setup's environment. */
  env?: EnvChanges;
  /** How long the run may take. `runLets`'s default when absent. */
  timeoutMs?: number;
}

export interface DelegateRepo {
  /** The repository's root, or the plain folder with `notInRepo`. Holds `p.md`. */
  cwd: string;
  /** The folder `XDG_CONFIG_HOME` names for each run. */
  home: string;
  /** The folder for the stand-ins, first on `PATH`. Empty until a test writes one. */
  standIns: string;
  /** Where the user's lets config is, whether or not it exists. */
  userConfig: string;
  /** Where the repository's lets config is, whether or not it exists. */
  repoConfig: string;
  /** The hash of the setup's commit, or null when there is none. */
  head: string | null;
  /**
   * Runs `lets <args>` with `onlyStandIns: true`, so `PATH` holds only the
   * stand-ins and git. Resolves and rejects as `runLets` does.
   */
  run(args: string[], options?: DelegateRunOptions): Promise<LetsResult>;
}

/**
 * Makes the folders for one test, which are removed after it: a user
 * config home, a folder for the stand-ins, and a Git repository that holds
 * `p.md` and, when `setup.repo` is given, `.lets/config.yaml`. Commits
 * everything, so the tree is clean before the run, unless `setup.noCommit`
 * is set. Throws when git fails.
 */
export function delegateRepo(t: TestContext, setup: DelegateSetup = {}): DelegateRepo {
  void t;
  void setup;
  throw new Error('not built yet');
}
