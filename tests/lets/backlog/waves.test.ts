import assert from 'node:assert/strict';
import { test } from 'node:test';
import { overlap, placeWaves, relevantPaths } from '../../../lets/src/backlog/waves.ts';

// A packet body whose Relevant code list item is line.
const packet = (line: string) => `## Context\n\n- **Outcome**: something\n${line}\n- **Not in scope**: \`other/file.ts\`\n`;

test('relevantPaths keeps only the paths among Relevant code\'s code spans', () => {
  const body = packet('- **Relevant code**: `skills/lets-go/SKILL.md` (*Check the issue*), `lets/src/backlog/commands.ts` (`ready --only`, `subIssues`)');
  assert.deepEqual(relevantPaths(body), ['skills/lets-go/SKILL.md', 'lets/src/backlog/commands.ts']);
});

test('relevantPaths finds no path in a Relevant code of new', () => {
  assert.deepEqual(relevantPaths(packet('- **Relevant code**: new')), []);
});

test('relevantPaths finds no path in a body with no Relevant code list item', () => {
  assert.deepEqual(relevantPaths('## Context\n\nSee `lets/src/main.ts`.\n'), []);
});

test('relevantPaths keeps a file name with an extension and no folder', () => {
  assert.deepEqual(relevantPaths(packet('- **Relevant code**: `README.md`, `v2`')), ['README.md']);
});

test('relevantPaths drops a leading ./ from a path', () => {
  assert.deepEqual(relevantPaths(packet('- **Relevant code**: `./README.md`')), ['README.md']);
});

test('relevantPaths ignores a code span that holds whitespace', () => {
  assert.deepEqual(relevantPaths(packet('- **Relevant code**: `lets backlog/ready`, `a.ts`')), ['a.ts']);
});

test('relevantPaths reads a star list item', () => {
  assert.deepEqual(relevantPaths('* **Relevant code**: `lets/src/main.ts`\n'), ['lets/src/main.ts']);
});

test('relevantPaths reads the indented lines that continue the list item', () => {
  const body = '  - **Relevant code**: `lets/src/main.ts`,\n    `lets/src/io.ts`\n    and `README.md`\n  - **Not in scope**: `other.ts`\n';
  assert.deepEqual(relevantPaths(body), ['lets/src/main.ts', 'lets/src/io.ts', 'README.md']);
});

test('relevantPaths stops at a line that is not indented more than the list item', () => {
  const body = '- **Relevant code**: `lets/src/main.ts`\n`lets/src/io.ts`\n';
  assert.deepEqual(relevantPaths(body), ['lets/src/main.ts']);
});

test('relevantPaths reads only the first Relevant code list item', () => {
  const body = '- **Relevant code**: `a/one.ts`\n- **Relevant code**: `b/two.ts`\n';
  assert.deepEqual(relevantPaths(body), ['a/one.ts']);
});

test('relevantPaths reads a body with CRLF line ends', () => {
  assert.deepEqual(relevantPaths('- **Relevant code**: `a/one.ts`,\r\n  `b/two.ts`\r\n'), ['a/one.ts', 'b/two.ts']);
});

// An item with this label that names these paths.
const named = (label: string, ...paths: string[]) => ({ label, paths });

test('two items that name the same file overlap', () => {
  assert.equal(overlap(named('#287', 'skills/lets-go/references/shape.md'), named('#283', 'skills/lets-shape/SKILL.md', 'skills/lets-go/references/shape.md')), 'both name skills/lets-go/references/shape.md');
});

test('a path with a trailing slash names the same folder as one without', () => {
  assert.equal(overlap(named('#2', 'lets/src/backlog'), named('#1', 'lets/src/backlog/')), 'both name lets/src/backlog');
});

test('a folder that holds the other item\'s path overlaps it', () => {
  assert.equal(overlap(named('#6', 'lets/src/backlog/commands.ts'), named('#5', 'lets/src/backlog/')), 'lets/src/backlog/ holds lets/src/backlog/commands.ts');
});

test('an item\'s folder that holds the other item\'s path overlaps it', () => {
  assert.equal(overlap(named('#5', 'lets/src/backlog/'), named('#6', 'lets/src/backlog/commands.ts')), 'lets/src/backlog/ holds lets/src/backlog/commands.ts');
});

test('a folder name that only starts another name does not overlap it', () => {
  assert.equal(overlap(named('#6', 'skills/lets-go-extra/SKILL.md'), named('#5', 'skills/lets-go')), null);
});

test('items with no path in common do not overlap', () => {
  assert.equal(overlap(named('#3', 'lets/src/main.ts'), named('#1', 'README.md')), null);
});

test('an item that names no path overlaps every item', () => {
  assert.equal(overlap(named('#2'), named('#1', 'README.md')), 'its packet names no Relevant code');
});

test('an item overlaps the item before it that names no path', () => {
  assert.equal(overlap(named('#2', 'README.md'), named('#1')), '#1\'s packet names no Relevant code');
});

test('the reason names the item\'s first overlapping path, in its packet\'s order', () => {
  assert.equal(overlap(named('#2', 'a.ts', 'lib/x.ts', 'lib/y.ts'), named('#1', 'lib/y.ts', 'lib/')), 'lib/ holds lib/x.ts');
});

test('a case difference makes two different paths', () => {
  assert.equal(overlap(named('#2', 'README.md'), named('#1', 'readme.md')), null);
});

// An item for placeWaves: its number, the paths it names, and the numbers
// of its named blockers.
const item = (n: number, paths: string[], blockers: number[] = []) => ({ key: String(n), label: `#${n}`, paths, blockers: blockers.map(String) });
const first = (n: number) => ({ key: String(n), label: `#${n}`, waitsFor: null, reason: null });
const waits = (n: number, other: number, reason: string) => ({ key: String(n), label: `#${n}`, waitsFor: { key: String(other), label: `#${other}` }, reason });

test('placeWaves sorts the stories of an epic into waves', () => {
  assert.deepEqual(placeWaves([
    item(283, ['skills/lets-shape/SKILL.md', 'skills/lets-go/references/shape.md']),
    item(285, ['lets/src/backlog/commands.ts']),
    item(286, ['lets/src/delegate/step.ts'], [285]),
    item(287, ['skills/lets-go/references/shape.md']),
  ]), [
    [first(283), first(285)],
    [waits(286, 285, 'blocked by #285'), waits(287, 283, 'both name skills/lets-go/references/shape.md')],
  ]);
});

test('placeWaves puts a blocker first when the order gives it later', () => {
  assert.deepEqual(placeWaves([item(10, ['a/ten.ts'], [11]), item(11, ['b/eleven.ts'])]), [
    [first(11)],
    [waits(10, 11, 'blocked by #11')],
  ]);
});

test('placeWaves puts an item in an earlier wave when it fits there', () => {
  assert.deepEqual(placeWaves([item(1, ['README.md']), item(2, ['README.md']), item(3, ['lets/src/main.ts'])]), [
    [first(1), first(3)],
    [waits(2, 1, 'both name README.md')],
  ]);
});

test('placeWaves gives an item whose packet names no path a wave of its own', () => {
  assert.deepEqual(placeWaves([item(1, ['a/one.ts']), item(2, []), item(3, ['c/three.ts'])]), [
    [first(1), first(3)],
    [waits(2, 1, 'its packet names no Relevant code')],
  ]);
});

test('placeWaves puts an item after one whose packet names no path', () => {
  assert.deepEqual(placeWaves([item(1, []), item(2, ['b/two.ts'])]), [
    [first(1)],
    [waits(2, 1, '#1\'s packet names no Relevant code')],
  ]);
});

test('placeWaves puts an item after a folder that holds its path', () => {
  assert.deepEqual(placeWaves([item(5, ['lets/src/backlog/']), item(6, ['lets/src/backlog/commands.ts'])])[1], [
    waits(6, 5, 'lets/src/backlog/ holds lets/src/backlog/commands.ts'),
  ]);
});

test('placeWaves gives each item of a loop of blockers a wave of its own', () => {
  assert.deepEqual(placeWaves([item(7, ['a/seven.ts'], [8]), item(8, ['b/eight.ts'], [7])]), [
    [first(7)],
    [waits(8, 7, 'blocked by #7, through a loop of blocked-by links')],
  ]);
});

test('placeWaves puts a loop of blockers after the items it placed', () => {
  assert.deepEqual(placeWaves([item(1, ['a/one.ts']), item(7, ['b/seven.ts'], [8]), item(8, ['c/eight.ts'], [7])]), [
    [first(1)],
    [waits(7, 8, 'blocked by #8, through a loop of blocked-by links')],
    [waits(8, 7, 'blocked by #7, through a loop of blocked-by links')],
  ]);
});

test('placeWaves orders each item of a chain after its blocker', () => {
  assert.deepEqual(placeWaves([item(1, ['a/one.ts']), item(2, ['b/two.ts'], [1]), item(3, ['c/three.ts'], [2])]), [
    [first(1)],
    [waits(2, 1, 'blocked by #1')],
    [waits(3, 2, 'blocked by #2')],
  ]);
});

test('placeWaves keeps the given order within a wave', () => {
  assert.deepEqual(placeWaves([item(10, ['a/ten.ts'], [12]), item(11, ['b/eleven.ts']), item(12, ['c/twelve.ts'])]).map((wave) => wave.map(({ key }) => key)), [
    ['11', '12'],
    ['10'],
  ]);
});

test('placeWaves gives an item behind a loop its first blocker in the loop', () => {
  assert.deepEqual(placeWaves([item(7, ['a/seven.ts'], [8]), item(8, ['b/eight.ts'], [7]), item(9, ['c/nine.ts'], [8])]).at(-1), [
    waits(9, 8, 'blocked by #8, through a loop of blocked-by links'),
  ]);
});
