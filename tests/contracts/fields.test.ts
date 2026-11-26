// Each field and value a text reads from `lets backlog` is one that
// `lets backlog --help` prints. A rename in lets then fails here, not in
// an agent that reads the old name. A text marks such a read by the rule
// in AGENTS.md: the `claim` field, or `result: taken`.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { repo, runLets, tempDir } from '../support/lets.ts';
import { type Finding, readTexts } from './texts.ts';

const help = runLets(['backlog', '--help'], { cwd: repo }).then((result) => {
  assert.equal(result.code, 0, result.output);
  return result.stdout;
});

/** Each field the help prints, with the values it gives that field. */
type Fields = Map<string, Set<string>>;

/**
 * The fields and values in a `lets backlog --help` text. A field is each
 * name inside a `{ … }` shape that stands alone or comes before a `:`, and
 * each name anywhere before `: [` or `: {`. A trailing `?` is not part of
 * the name. `name: v1|v2` in a shape gives `name` each value, so a value
 * is never a field. A sentence `where <name> is v1, v2 … or vn.` gives
 * `<name>` each value, without the `( … )` asides.
 */
function backlogFields(help: string): Fields {
  const fields: Fields = new Map();
  const add = (name: string, values: string[] = []) => {
    const known = fields.get(name) ?? new Set<string>();
    for (const value of values) known.add(value);
    fields.set(name, known);
  };
  // The match takes a name's values with it, so a value is never read as
  // a name. A name before `: [` matches alone, and the next match starts
  // inside the brackets.
  for (const shape of shapes(help)) {
    for (const match of shape.matchAll(/([A-Za-z][\w-]*)\??(?:\s*:\s*([\w-]+(?:\|[\w-]+)*))?/g)) add(match[1], match[2]?.split('|'));
  }
  for (const match of help.matchAll(/([A-Za-z][\w-]*)\??:\s*[[{]/g)) add(match[1]);
  const prose = withoutAsides(help.replace(/\s+/g, ' '));
  for (const match of prose.matchAll(/\bwhere ([A-Za-z][\w-]*) is ([^.]*)\./g)) {
    add(match[1], match[2].split(/,|\bor\b/).map((value) => value.trim()).filter((value) => value !== ''));
  }
  return fields;
}

// The text inside each outermost `{ … }` of `help`, across lines.
function shapes(help: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < help.length; i++) {
    if (help[i] === '{' && depth++ === 0) start = i + 1;
    if (help[i] === '}' && depth > 0 && --depth === 0) found.push(help.slice(start, i));
  }
  return found;
}

// `text` without each `( … )`, innermost first, and the space before it.
function withoutAsides(text: string): string {
  let rest = text;
  for (let before = ''; before !== rest;) {
    before = rest;
    rest = rest.replace(/ ?\([^()]*\)/g, '');
  }
  return rest;
}

/**
 * Each field span under `root` whose name `lets backlog --help` does not
 * print. A field span is a code span of one word with no space, followed
 * in its paragraph by the word field or fields.
 */
async function fieldSpanFindings(root: string): Promise<Finding[]> {
  const fields = backlogFields(await help);
  return readTexts(root).flatMap((text) => text.spans
    .filter((span) => /^\S+$/.test(span.text) && (span.next === 'field' || span.next === 'fields') && !fields.has(span.text))
    .map((span) => ({ file: text.path, name: span.text })));
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

// The fields as an object, each with its values sorted, so a test can
// compare the whole result at once.
function plain(fields: Fields): Record<string, string[]> {
  return Object.fromEntries([...fields].map(([name, values]) => [name, [...values].sort()]).sort(([a], [b]) => (a < b ? -1 : 1)));
}

test('the help gives each name in a shape across two lines as a field', () => {
  const fields = backlogFields(['  item <i>   { key, title,', '                 status }'].join('\n'));
  assert.deepEqual(plain(fields), { key: [], status: [], title: [] });
});

test('the help gives a field each value of name: a|b', () => {
  const fields = backlogFields('  claim <i>   { result: claimed } | { result: failed, write: assign|status }');
  assert.deepEqual(plain(fields), { result: ['claimed', 'failed'], write: ['assign', 'status'] });
});

test('the help gives a name with a trailing ? as a field without it', () => {
  const fields = backlogFields('  claim <i>   { message, claim? }');
  assert.deepEqual(plain(fields), { claim: [], message: [] });
});

test('the help gives each name in a nested shape as a field', () => {
  const fields = backlogFields('  ready   { issues: [{ key: null, label }] }');
  assert.deepEqual(plain(fields), { issues: [], key: ['null'], label: [] });
});

test('the help gives a name before : [ outside a shape as a field', () => {
  const fields = backlogFields('An error names its projects: [ the projects ].');
  assert.deepEqual(plain(fields), { projects: [] });
});

test('the help gives a where sentence’s name each value, without its asides', () => {
  const fields = backlogFields(['On an error, where error is no-backlog,', 'several (with a note) or not-found.'].join('\n'));
  assert.deepEqual(plain(fields), { error: ['no-backlog', 'not-found', 'several'] });
});

test('lets backlog --help prints at least one field with a value', async () => {
  const withValues = [...backlogFields(await help)].filter(([, values]) => values.size > 0);
  assert.ok(withValues.length > 0, 'no field in lets backlog --help has a value');
});

test('the fields check names a field span the help does not print', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', ['# Demo', '', 'Read the `nonsense` field, then the `sub-issues` field.']);
  assert.deepEqual(await fieldSpanFindings(dir), [
    { file: 'skills/demo/SKILL.md', name: 'nonsense' },
    { file: 'skills/demo/SKILL.md', name: 'sub-issues' },
  ]);
});

test('the fields check names a field span whose word field is on the next line', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'README.md', ['# Demo', '', 'Read the `nonsense`', 'field.']);
  assert.deepEqual(await fieldSpanFindings(dir), [{ file: 'README.md', name: 'nonsense' }]);
});

test('the fields check passes a field span the help prints', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', [
    '# Demo',
    '',
    'Read the `claim` field and the `claim` field.',
    'Then the `write` and `message` fields, then the `blockedBy`',
    'field.',
  ]);
  assert.deepEqual(await fieldSpanFindings(dir), []);
});

test('the fields check passes a span with no word field right after it', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', ['# Demo', '', 'Read `nonsense`, field by field, then `nonsense` alone.']);
  assert.deepEqual(await fieldSpanFindings(dir), []);
});
