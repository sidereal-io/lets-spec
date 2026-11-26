// lets-go carries the glossary's entries for its own terms in
// references/terms.md, since an installed skill cannot link the project's
// glossary. A copy that drifts gives installed agents old definitions.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { repo, tempDir } from '../support/lets.ts';
import { type Finding, readText, type Text } from './texts.ts';

const TERMS = 'skills/lets-go/references/terms.md';
const GLOSSARY = 'openspec/glossary.md';

// The text of each `##` entry, by its heading: the lines after the
// heading, up to the next heading, with each run of whitespace one space.
function entries(text: Text): Map<string, string> {
  const lines = text.source.split('\n');
  return new Map(text.headings.flatMap((heading, index) => {
    if (heading.level !== 2) return [];
    const end = text.headings[index + 1]?.line ?? lines.length + 1;
    return [[heading.text, lines.slice(heading.line, end - 1).join(' ').replace(/\s+/g, ' ').trim()]];
  }));
}

/**
 * Each term of `terms` that `glossary` does not hold word for word. The
 * terms are the `##` headings of `terms` outside code. A term is found
 * when the glossary has no `##` heading of the same text, or when the two
 * entries' texts differ once whitespace is collapsed. Each finding names
 * `terms`'s path and the term. A term the copy leaves out is not found.
 */
function termFindings(terms: Text, glossary: Text): Finding[] {
  const known = entries(glossary);
  return [...entries(terms)]
    .filter(([term, entry]) => known.get(term) !== entry)
    .map(([term]) => ({ file: terms.path, name: term }));
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

// A glossary with one more entry than the copy, and a copy that wraps its
// lines differently and shows a heading in fenced code: none is a finding.
function smallPair(dir: string) {
  smallText(dir, GLOSSARY, ['# Glossary', '', '## Part', '', 'One named piece of a run.', '', '## Procedure', '', 'A section that a part runs.', '', '## Wave', '', 'Stories that can start together.']);
  smallText(dir, TERMS, ['# Terms', '', 'Copied word for word, as:', '', '```markdown', '## Not a term', '```', '', '## Part', '', 'One named piece', 'of a run.', '', '## Procedure', '', 'A section that a part runs.']);
}

test("terms.md holds the glossary's entries word for word", () => {
  const terms = readText(repo, TERMS);
  assert.ok(entries(terms).size > 0, `${TERMS} holds no ## entry`);
  assert.deepEqual(termFindings(terms, readText(repo, GLOSSARY)), []);
});

test('the terms check passes a small copy that matches its glossary', (t) => {
  const dir = tempDir(t);
  smallPair(dir);
  assert.deepEqual(termFindings(readText(dir, TERMS), readText(dir, GLOSSARY)), []);
});

test('the terms check names an entry whose text differs from the glossary', (t) => {
  const dir = tempDir(t);
  smallPair(dir);
  smallText(dir, TERMS, ['# Terms', '', '## Part', '', 'One named piece of a run.', '', '## Procedure', '', 'A section that a part or another procedure runs.']);
  assert.deepEqual(termFindings(readText(dir, TERMS), readText(dir, GLOSSARY)), [{ file: TERMS, name: 'Procedure' }]);
});

test('the terms check names a term the glossary lacks', (t) => {
  const dir = tempDir(t);
  smallPair(dir);
  smallText(dir, TERMS, ['# Terms', '', '## Part', '', 'One named piece of a run.', '', '## Packet', '', 'The body of a work item.']);
  assert.deepEqual(termFindings(readText(dir, TERMS), readText(dir, GLOSSARY)), [{ file: TERMS, name: 'Packet' }]);
});
