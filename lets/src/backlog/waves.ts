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
