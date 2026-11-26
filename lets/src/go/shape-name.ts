// lets go shape-name: the name of lets-go's shape step for one input, and
// the path of that step's answers file. The naming rule lives only here, so
// the skill builds no name of its own. Reads no file and asks no resolver:
// the same input always gives the same line.
import { createHash } from 'node:crypto';
import { guarded } from '../delegate/guarded.ts';
import type { Deps } from '../io.ts';
import { EXIT, UsageError } from '../resolvers/kit/errors.ts';

export type ShapeNameOptions = { issue?: string; idea?: string };

const SLUG_WORDS = 5;
// At most 200 bytes in UTF-8, so the longest file named after the step,
// idea-<slug>-<hash>-shape-answers.yaml, stays under the 255-byte limit of
// ext4 and APFS. Words split only on white space, so a pasted URL is one word.
const SLUG_CODE_POINTS = 50;
const HASH_DIGITS = 8;

// The slug and the hash both come from these words, so they never disagree
// on what a word is. toLowerCase ignores the locale, so every machine agrees.
function words(idea: string): string[] {
  return idea.split(/\s+/u)
    .map((word) => [...word.toLowerCase()].filter((char) => /[\p{L}\p{N}]/u.test(char)).join(''))
    .filter((word) => word !== '');
}

function slug(all: string[]): string {
  const points = [...all.slice(0, SLUG_WORDS).join('-')];
  return points.slice(0, SLUG_CODE_POINTS).join('').replace(/-$/u, '');
}

// Words hold no space, so two different word lists never join to the same text.
function hash(all: string[]): string {
  return createHash('sha256').update(all.join(' '), 'utf8').digest('hex').slice(0, HASH_DIGITS);
}

export function shapeName(options: ShapeNameOptions): string {
  if (options.idea !== undefined) {
    const all = words(options.idea);
    if (all.length === 0) throw new UsageError('an idea needs at least one letter or digit');
    return `idea-${slug(all)}-${hash(all)}`;
  }
  // An issue key is opaque to everything but its backlog provider
  // (ADR-025), so it goes into the name unchanged.
  return `issue-${options.issue}`;
}

// The exit code: 0 ok, 2 not exactly one option, or an idea with no letter
// or digit.
export function run(options: ShapeNameOptions, deps: Pick<Deps, 'stdout' | 'stderr'>): Promise<number> {
  return guarded(deps, async () => {
    if ((options.issue === undefined) === (options.idea === undefined)) throw new UsageError('give exactly one of --issue and --idea');
    const name = shapeName(options);
    const answers = `.workspace/lets-go/${name}-shape-answers.yaml`;
    deps.stdout(`${JSON.stringify({ name, answers })}\n`);
    return EXIT.ok;
  }, 'lets go: ');
}
