// The fixture for the black-box tests of lets sync: a small test release,
// built once per test file, and a fresh project per test. Not named
// *.test.ts, so node --test does not run it.
import { chmodSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { before, type TestContext } from 'node:test';
import { buildRelease, type EnvChanges, git, type LetsResult, type RunResult, runLets, standIn, tempDir } from '../support/lets.ts';

const RULES_BEGIN = '<!-- BEGIN lets-spec rules';
const RULES_END = '<!-- END lets-spec rules -->';
// Any version will do: the source tree has no release.json to compare it with.
const OPENSPEC_VERSION = '1.3.0\n';

let current: string | undefined;

function fileRelease(): string {
  if (current === undefined) throw new Error('the test release is not built: call useRelease() at the top of the file');
  return current;
}

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
  buildRelease(dir, ['lets-standard'], fixtureSkills);
  const skills = join(dir, 'overlay', '.agents', 'skills');
  // No skill ships a script, so give one a script, to check that lets sync
  // keeps its executable bit.
  const scripts = join(skills, 'lets-verify-contracts', 'scripts');
  mkdirSync(scripts, { recursive: true });
  writeFileSync(join(scripts, 'check.sh'), '#!/bin/sh\n');
  chmodSync(join(scripts, 'check.sh'), 0o755);
  for (const skill of extraSkills) {
    mkdirSync(join(skills, skill), { recursive: true });
    writeFileSync(join(skills, skill, 'SKILL.md'), `${skill}\n`);
  }
  makeReadOnly(dir);
}

/**
 * Registers a `before` hook that builds one release for the test file,
 * in a temporary folder removed after the file. Call it once, at the top
 * of the file. Returns `release()`, which gives the release's path, and
 * throws when called before the hook has run.
 */
export function useRelease(): () => string {
  before(() => {
    const dir = join(tempDir(), 'release');
    makeRelease(dir);
    current = dir;
  });
  return fileRelease;
}

/**
 * Makes a fresh project for the test `t`: a git repository in a temporary
 * folder removed after the test, holding only `openspec/config.yaml` set
 * to `schema: lets-standard`, and a stand-in `openspec` that prints a
 * version. Needs `useRelease` to have run.
 */
export function project(t: TestContext): Project {
  const tmp = tempDir(t);
  const root = join(tmp, 'project');
  const bin = join(tmp, 'bin');
  mkdirSync(join(root, 'openspec'), { recursive: true });
  mkdirSync(bin);
  standIn(bin, 'openspec', [{ args: ['--version'], stdout: OPENSPEC_VERSION }]);
  const init = git(root, 'init', '--quiet');
  if (init.code !== 0) throw new Error(`git init failed: ${init.stderr}`);
  writeFileSync(join(root, 'openspec', 'config.yaml'), 'schema: lets-standard\n');
  const sync = (args: string[] = [], env: EnvChanges = {}, cwd = root) =>
    runLets(['sync', ...args], { cwd, standIns: bin, env: { WORKFLOW_RELEASE: fileRelease(), ...env } });
  return {
    path: root,
    read: (file) => readFileSync(join(root, file), 'utf8'),
    write: (file, text) => {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      writeFileSync(join(root, file), text);
    },
    git: (...args) => git(root, ...args),
    sync,
    init: async (env) => {
      const result = await sync([], env);
      if (result.code !== 0) throw new Error(`lets sync exited ${result.code}:\n${result.output}`);
    },
  };
}

/**
 * The lines between the lets-spec rules markers in `text`, without the
 * markers, joined by newlines with no final one, as `$(sed ...)` gives
 * them. Empty when there is no begin marker; to the end of `text` when
 * there is no end marker.
 */
export function rulesIn(text: string): string {
  const lines = text.split('\n');
  const begin = lines.findIndex((line) => line.startsWith(RULES_BEGIN));
  if (begin === -1) return '';
  const end = lines.indexOf(RULES_END, begin + 1);
  return lines.slice(begin + 1, end === -1 ? undefined : end).join('\n');
}

/**
 * The release's rules, as lets sync writes them between the markers, without
 * the final newline, so it compares with `rulesIn`. Defaults to the file's
 * release.
 */
export function fragment(release?: string): string {
  return readFileSync(join(release ?? fileRelease(), 'fragments', 'AGENTS.md'), 'utf8').replace(/\n+$/, '');
}

/** Every skill the release ships, by folder name, sorted. Defaults to the file's release. */
export function shippedSkills(release?: string): string[] {
  return readdirSync(join(release ?? fileRelease(), 'overlay', '.agents', 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Every file the release ships, by its path from the overlay, sorted. Defaults to the file's release. */
export function releaseFiles(release?: string): string[] {
  const overlay = join(release ?? fileRelease(), 'overlay');
  return readdirSync(overlay, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name).slice(overlay.length + 1))
    .sort();
}

/**
 * `text`, a config, with its top-level `schema:` line set to `value`, or
 * removed when `value` is null. A text without the line gains one at the
 * top. Stands in for `yq`.
 */
export function setSchema(text: string, value: string | null): string {
  const line = /^schema:.*(\n|$)/m;
  if (value === null) return text.replace(line, '');
  return line.test(text) ? text.replace(line, `schema: ${value}$1`) : `schema: ${value}\n${text}`;
}

// Read-only, as in the Nix store.
function makeReadOnly(path: string) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) for (const entry of readdirSync(path)) makeReadOnly(join(path, entry));
  chmodSync(path, stat.mode & ~0o222);
}
