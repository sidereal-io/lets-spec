// The README's "Set up delegation" section holds one table with a row for
// each guidance key lets reads. The keys come from GUIDANCE_KEYS, so a key
// lets gains or drops without a README row fails here, not in a reader who
// cannot tell which session a key steers.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { GUIDANCE_KEY_NAMES } from '../../lets/src/delegate/intents.ts';
import { repo, tempDir } from '../support/lets.ts';
import { type Finding, readText } from './texts.ts';

const README = 'README.md';
const SECTION = 'Set up delegation';

/**
 * Each guidance key the README's table under `root` lacks, and each row
 * for a key lets does not read. The table is the first one in the
 * "Set up delegation" section, up to the next heading of the same or a
 * higher level, whose header row's first cell is `Key`. A row's key is the
 * code span in its first cell. Each finding names `README.md` and the key,
 * as `delegate.<key>`. A missing section, or a section with no such table,
 * is one finding that names what is missing.
 */
function guidanceTableFindings(root: string): Finding[] {
  const text = readText(root, README);
  const at = text.headings.findIndex((heading) => heading.text === SECTION);
  if (at === -1) return [{ file: README, name: `the "${SECTION}" section` }];
  const { line, level } = text.headings[at];
  const end = text.headings.slice(at + 1).find((heading) => heading.level <= level)?.line ?? Infinity;
  const lines = text.source.split('\n').slice(line, end - 1);
  const header = lines.findIndex((row) => /^\|\s*Key\s*\|/.test(row));
  if (header === -1) return [{ file: README, name: `the guidance table in "${SECTION}"` }];
  const rows = lines.slice(header + 2);
  const last = rows.findIndex((row) => !row.startsWith('|'));
  const listed = (last === -1 ? rows : rows.slice(0, last)).map((row) => /^\|\s*`([^`]+)`/.exec(row)?.[1] ?? row);
  const read = GUIDANCE_KEY_NAMES.map((key) => `delegate.${key}`);
  return [
    ...read.filter((key) => !listed.includes(key)),
    ...listed.filter((key) => !read.includes(key)),
  ].map((name) => ({ file: README, name }));
}

// A README under a folder of its own, whose guidance table lists keys.
function smallReadme(t: Parameters<typeof tempDir>[0], keys: string[] | null): string {
  const dir = tempDir(t);
  mkdirSync(dir, { recursive: true });
  const table = keys === null ? [] : ['| Key | Session it steers |', '|---|---|', ...keys.map((key) => `| \`${key}\` | a session |`)];
  writeFileSync(join(dir, README), ['# Tool', '', `### ${SECTION}`, '', ...table, '', '### Later', '', '| Key | Other |', '|---|---|', '| `delegate.other` | x |', ''].join('\n'));
  return dir;
}

const EVERY_KEY = GUIDANCE_KEY_NAMES.map((key) => `delegate.${key}`);

test('the README\'s guidance table has a row for each key lets reads, and no other', () => {
  assert.deepEqual(guidanceTableFindings(repo), []);
});

test('the guidance table check passes a small README with every key', (t) => {
  assert.deepEqual(guidanceTableFindings(smallReadme(t, EVERY_KEY)), []);
});

test('a table without a row for a key lets reads names that key', (t) => {
  assert.deepEqual(guidanceTableFindings(smallReadme(t, EVERY_KEY.filter((key) => key !== 'delegate.story'))), [{ file: README, name: 'delegate.story' }]);
});

test('a row for a key lets does not read names that key', (t) => {
  assert.deepEqual(guidanceTableFindings(smallReadme(t, [...EVERY_KEY, 'delegate.review.code'])), [{ file: README, name: 'delegate.review.code' }]);
});

test('a section with no guidance table is a finding', (t) => {
  assert.deepEqual(guidanceTableFindings(smallReadme(t, null)), [{ file: README, name: `the guidance table in "${SECTION}"` }]);
});

test('a README with no "Set up delegation" section is a finding', (t) => {
  const dir = tempDir(t);
  writeFileSync(join(dir, README), '# Tool\n');
  assert.deepEqual(guidanceTableFindings(dir), [{ file: README, name: `the "${SECTION}" section` }]);
});
