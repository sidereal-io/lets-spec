// Find and validate the release: the folder of files lets sync copies from.
import { join } from 'node:path';
import type { Deps, Io } from '../io.ts';
import { schemaOf } from './config.ts';
import { UsageError } from './errors.ts';

export const SKILLS_DST = '.agents/skills';
export const SCHEMAS_DST = 'openspec/schemas';
export const AGENTS = 'AGENTS.md';

// The config the release creates in a project, in its init/ folder.
const CONFIG = 'init/openspec/config.yaml';

// Where the release is: WORKFLOW_RELEASE when set, else the release this
// package ships for the flow.
export function findRelease(env: Deps['env'], packageRoot: string, io: Io) {
  if ((env.WORKFLOW_RELEASE ?? '') !== '') return env.WORKFLOW_RELEASE!;
  const flow = env.LETS_SPEC_FLOW || 'standard';
  const release = join(packageRoot, 'releases', flow);
  if (!io.isDir(release)) {
    throw new UsageError(`there is no release for flow '${flow}' at ${release}. Set LETS_SPEC_FLOW to a flow this release ships, or WORKFLOW_RELEASE to a release folder.`);
  }
  return release;
}

const VERSION = /\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?/;

// -1, 0 or 1 as a is older than, the same as or newer than b, by semver
// precedence. Both are versions VERSION matched.
export function compareVersions(a: string, b: string) {
  const [coreA, preA] = parts(a);
  const [coreB, preB] = parts(b);
  for (let i = 0; i < 3; i++) {
    if (coreA[i] !== coreB[i]) return coreA[i] < coreB[i] ? -1 : 1;
  }
  if (preA.length === 0 || preB.length === 0) return Math.sign(preB.length - preA.length);
  for (let i = 0; i < Math.min(preA.length, preB.length); i++) {
    const order = compareIdentifiers(preA[i], preB[i]);
    if (order !== 0) return order;
  }
  return Math.sign(preA.length - preB.length);
}

// The numeric core and the prerelease identifiers, without build metadata.
function parts(version: string): [number[], string[]] {
  const [withPre] = version.split('+');
  const dash = withPre.indexOf('-');
  const core = dash === -1 ? withPre : withPre.slice(0, dash);
  const pre = dash === -1 ? [] : withPre.slice(dash + 1).split('.');
  return [core.split('.').map(Number), pre];
}

// Numeric identifiers compare as numbers and sort before text ones.
function compareIdentifiers(a: string, b: string) {
  const numA = /^\d+$/.test(a);
  const numB = /^\d+$/.test(b);
  if (numA && numB) return Math.sign(Number(a) - Number(b));
  if (numA !== numB) return numA ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

export const OPENSPEC_MISSING = 'the OpenSpec CLI is not on PATH, and the openspec-* skills need it. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".';

// Whether the OpenSpec CLI is installed, and its version when it prints one.
// It runs in the project's root because the project installs the CLI: a mise
// shim picks its tool by the working directory's mise config, and the release
// folder has none.
export async function probeOpenspec(root: string, io: Io) {
  const result = await io.execFile('openspec', ['--version'], { cwd: root });
  if (result.code !== 0) return { installed: false, version: null };
  return { installed: true, version: result.stdout.match(VERSION)?.[0] ?? null };
}

// A warning when the OpenSpec CLI's version is older than the one that
// generated the release's openspec-* skills, as the package's release.json
// records it. Null when either version is unknown.
export function openspecVersionWarning({ packageRoot, version, io }: { packageRoot: string; version: string | null; io: Io }) {
  const text = io.readFile(join(packageRoot, 'release.json'));
  if (text === null || version === null) return null;
  let pinned;
  try {
    pinned = String(JSON.parse(text)?.openspec ?? '').match(VERSION)?.[0];
  } catch {
    return null;
  }
  if (pinned === undefined || compareVersions(version, pinned) >= 0) return null;
  return `the OpenSpec CLI on PATH is ${version}, older than ${pinned}, which this release's openspec-* skills were generated from. Upgrade it to ${pinned} or later.`;
}

// Fail unless the folder holds a release of lets-spec.
export function requireRelease(release: string, io: Io) {
  if (!io.isDir(join(release, 'overlay', SKILLS_DST)) || !io.isDir(join(release, 'init')) ||
    io.readFile(join(release, 'fragments', AGENTS)) === null) {
    throw new UsageError(`${release} is not a release of lets-spec: it lacks overlay/${SKILLS_DST}/, init/ or fragments/${AGENTS}.`);
  }
}

// The schema folders the release holds, sorted. A release holds at least one.
export function releaseSchemas(release: string, io: Io) {
  const dir = join(release, 'overlay', SCHEMAS_DST);
  const names = io.isDir(dir) ? [...io.listDirs(dir)].sort() : [];
  if (names.length === 0) throw new UsageError(`${release} holds no schema in overlay/${SCHEMAS_DST}/.`);
  return names;
}

// The schema the release's own config names: the default for a project.
// It must be one the release ships.
export function defaultSchema(release: string, io: Io) {
  const name = schemaOf(io.readFile(join(release, CONFIG)) ?? '');
  if (name === null) throw new UsageError(`${release}'s ${CONFIG} names no schema.`);
  if (!releaseSchemas(release, io).includes(name)) {
    throw new UsageError(`${release}'s ${CONFIG} names '${name}', which the release does not ship.`);
  }
  return name;
}
