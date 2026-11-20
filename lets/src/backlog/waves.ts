// The waves of an epic run: which of the named items may be built at the
// same time. An item waits for each of its blockers, and for any item whose
// packet names an overlapping path under Relevant code. Pure functions; the
// waves command in commands.ts reads the items and prints the result.

const RELEVANT_CODE = /^(\s*)[-*] \*\*Relevant code\*\*:(.*)$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/;

// The paths an item's packet names: the code spans of its first Relevant
// code list item, and of the indented lines that continue it, that look like
// a path. Section names and other code spans, such as `ready --only`, are
// left out. An empty list means the packet names no path.
export function relevantPaths(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => RELEVANT_CODE.test(line));
  if (start === -1) return [];
  const [, indent, rest] = RELEVANT_CODE.exec(lines[start])!;
  const text = [rest];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith(`${indent} `) && !line.startsWith(`${indent}\t`)) break;
    if (line.trim() === '' || LIST_ITEM.test(line)) break;
    text.push(line);
  }
  return [...text.join('\n').matchAll(/`([^`]+)`/g)]
    .map(([, span]) => span.trim())
    .filter((span) => !/\s/.test(span) && (span.includes('/') || /\.[A-Za-z0-9]+$/.test(span)))
    .map((span) => span.replace(/^\.\//, ''));
}

// How path a relates to path b: the same path, a folder that holds the
// other, or null. A trailing / does not count, and case does, as in Git.
function relation(a: string, b: string): 'same' | 'a holds b' | 'b holds a' | null {
  const [x, y] = [a.replace(/\/+$/, ''), b.replace(/\/+$/, '')];
  if (x === y) return 'same';
  if (y.startsWith(`${x}/`)) return 'a holds b';
  if (x.startsWith(`${y}/`)) return 'b holds a';
  return null;
}

export type Named = { label: string; paths: string[] };

// Why item overlaps other, as the text the epic run prints after
// "waits for #<other>:", or null when they do not overlap. An item that
// names no path overlaps every item.
export function overlap(item: Named, other: Named): string | null {
  if (item.paths.length === 0) return 'its packet names no Relevant code';
  if (other.paths.length === 0) return `${other.label}'s packet names no Relevant code`;
  for (const path of item.paths) {
    for (const theirs of other.paths) {
      const how = relation(path, theirs);
      if (how === 'same') return `both name ${path}`;
      if (how === 'a holds b') return `${path} holds ${theirs}`;
      if (how === 'b holds a') return `${theirs} holds ${path}`;
    }
  }
  return null;
}

// An item to place: its key and label, the paths its packet names, and the
// keys of its blockers among the items placed with it.
export type WaveItem = Named & { key: string; blockers: string[] };

// One story of a wave. A story in the first wave waits for nothing, so its
// waitsFor and reason are null. Any other names the story it waits for, and
// why, as the epic run prints it.
export type WaveStory = { key: string; label: string; waitsFor: { key: string; label: string } | null; reason: string | null };

// The items, in waves. Each round places the first item, in the given order,
// whose blockers are all placed, in the earliest wave after its blockers'
// that holds no item it overlaps. Items whose blockers form a loop, or
// depend on one, can never be placed so; each gets a wave of its own at the
// end. Within a wave the items keep the given order.
export function placeWaves(items: WaveItem[]): WaveStory[][] {
  const waves: WaveItem[][] = [];
  const waveOf = new Map<string, number>();
  const left = [...items];
  for (;;) {
    const next = left.findIndex(({ blockers }) => blockers.every((key) => waveOf.has(key)));
    if (next === -1) break;
    const [placing] = left.splice(next, 1);
    let wave = Math.max(-1, ...placing.blockers.map((key) => waveOf.get(key)!)) + 1;
    while (waves[wave]?.some((story) => overlap(placing, story) !== null)) wave += 1;
    (waves[wave] ??= []).push(placing);
    waveOf.set(placing.key, wave);
  }
  const order = new Map(items.map(({ key }, index) => [key, index]));
  for (const wave of waves) wave.sort((a, b) => order.get(a.key)! - order.get(b.key)!);

  const sorted = waves.map((wave, index) => wave.map((story) => storyIn(story, waves[index - 1])));
  const looped = left.map((story) => {
    if (sorted.length === 0 && story === left[0]) return { ...ref(story), waitsFor: null, reason: null };
    const blocker = left.find(({ key }) => story.blockers.includes(key))!;
    return { ...ref(story), waitsFor: ref(blocker), reason: `blocked by ${blocker.label}, through a loop of blocked-by links` };
  });
  return [...sorted, ...looped.map((story) => [story])];
}

const ref = ({ key, label }: { key: string; label: string }) => ({ key, label });

// A placed story, with what it waits for in the wave before its own. That
// wave holds its latest blocker, or else an item it overlaps, which pushed
// it out of that wave.
function storyIn(story: WaveItem, before: WaveItem[] | undefined): WaveStory {
  if (before === undefined) return { ...ref(story), waitsFor: null, reason: null };
  const blocker = before.find(({ key }) => story.blockers.includes(key));
  if (blocker !== undefined) return { ...ref(story), waitsFor: ref(blocker), reason: `blocked by ${blocker.label}` };
  for (const other of before) {
    const reason = overlap(story, other);
    if (reason !== null) return { ...ref(story), waitsFor: ref(other), reason };
  }
  throw new Error(`${story.label} is in a later wave with nothing to wait for`);
}
