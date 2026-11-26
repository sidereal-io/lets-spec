// The field check reads the word after each code span from texts.ts. Its
// own tests reach only some of the ways a paragraph can go on after a
// span, so each way is shown here once.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { tempDir } from '../support/lets.ts';
import { readText } from './texts.ts';

// The `next` word of each code span in a text of `lines`.
function nextWords(t: TestContext, lines: string[]): string[] {
  const dir = tempDir(t);
  writeFileSync(join(dir, 'demo.md'), `${lines.join('\n')}\n`);
  return readText(dir, 'demo.md').spans.map((span) => span.next);
}

test('a span is followed by the first word after it on its line', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim` field now.']), ['field']);
});

test('the word after a span leaves off the punctuation after it', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim` field.', 'Read the `claim` fields, then stop.']), ['field', 'fields']);
});

test('a span with punctuation right after it has no next word', (t) => {
  assert.deepEqual(nextWords(t, ['Read `claim`, field and `key`) then `a` `b`.']), ['', '', '', '']);
});

test('a span that ends its line is followed by the first word of the next line', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim`  ', 'field and stop.']), ['field']);
});

test('a span that ends its paragraph has no next word', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim`', '', 'field and stop.']), ['']);
});

test('a span before a fence has no next word', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim`', '```text', 'field', '```']), ['']);
});

test('a span that ends the file has no next word', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `claim`']), ['']);
});

test('a span that crosses a line break is followed by the word after its close', (t) => {
  assert.deepEqual(nextWords(t, ['Read the `lets backlog', 'claim` result now.']), ['result']);
});
