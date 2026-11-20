import assert from 'node:assert/strict';
import { test } from 'node:test';
import { relevantPaths } from '../../../lets/src/backlog/waves.ts';

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
