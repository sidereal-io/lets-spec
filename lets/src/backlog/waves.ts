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
