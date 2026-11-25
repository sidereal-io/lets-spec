// The fixture for the black-box tests of lets sync: a small test release,
// built once per test file, and a fresh project per test. Not named
// *.test.ts, so node --test does not run it.
import type { TestContext } from 'node:test';
import type { EnvChanges, LetsResult, RunResult } from '../support/lets.ts';

/**
 * The skills a test release ships. A fixture, not a copy of flows.json: it
 * needs one entry point of each kind, and a skill that only some flows ship.
 */
export const fixtureSkills = ['lets-build', 'lets-shape', 'lets-verify-contracts', 'lets-review-build'];

/** A fresh git repository for one test, and lets sync run in it. */
export interface Project {
  /** The project's root folder. */
  path: string;
  /** The text of a file, by its path from the root. Throws when it is missing. */
  read(file: string): string;
  /** Writes a file, by its path from the root, making its folders. */
  write(file: string, text: string): void;
  /** Runs git in the root, as the helper module's `git` does. */
  git(...args: string[]): RunResult;
  /**
   * Runs `lets sync <args>` with `WORKFLOW_RELEASE` set to the file's
   * release, unless `env` sets it, and the stand-in `openspec` on `PATH`.
   * Runs in the root, unless `cwd` names another folder.
   */
  sync(args?: string[], env?: EnvChanges, cwd?: string): Promise<LetsResult>;
  /**
   * Runs `lets sync` once, so the project has its files and a test sees
   * only the problem it sets up. Rejects, with lets's output, unless it
   * exits 0.
   */
  init(env?: EnvChanges): Promise<void>;
}

/**
 * Builds a release of the standard flow in `dir` with the fixture skills,
 * a script with mode 755 in `lets-verify-contracts`, and each of
 * `extraSkills` as a one-line skill, to stand for an earlier release.
 * Then makes the whole release read-only, as in the Nix store. `dir` must
 * not exist yet. Throws when the build fails.
 */
export function makeRelease(dir: string, extraSkills: string[] = []): void {
  throw new Error('not built yet');
}

/**
 * Registers a `before` hook that builds one release for the test file,
 * in a temporary folder removed after the file. Call it once, at the top
 * of the file. Returns `release()`, which gives the release's path, and
 * throws when called before the hook has run.
 */
export function useRelease(): () => string {
  throw new Error('not built yet');
}

/**
 * Makes a fresh project for the test `t`: a git repository in a temporary
 * folder removed after the test, holding only `openspec/config.yaml` set
 * to `schema: lets-standard`, and a stand-in `openspec` that prints a
 * version. Needs `useRelease` to have run.
 */
export function project(t: TestContext): Project {
  throw new Error('not built yet');
}

/**
 * The lines between the lets-spec rules markers in `text`, without the
 * markers, joined by newlines. Empty when there are no markers.
 */
export function rulesIn(text: string): string {
  throw new Error('not built yet');
}

/** The release's rules, as lets sync writes them between the markers. */
export function fragment(release?: string): string {
  throw new Error('not built yet');
}

/** Every skill the release ships, by folder name, sorted. */
export function shippedSkills(release?: string): string[] {
  throw new Error('not built yet');
}

/** Every file the release ships, by its path from the overlay, sorted. */
export function releaseFiles(release?: string): string[] {
  throw new Error('not built yet');
}

/**
 * `text`, a config, with its top-level `schema:` line set to `value`, or
 * removed when `value` is null. A text without the line gains one at the
 * top. Stands in for `yq`.
 */
export function setSchema(text: string, value: string | null): string {
  throw new Error('not built yet');
}
