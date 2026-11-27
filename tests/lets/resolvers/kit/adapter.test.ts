import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeName } from '../../../../lets/src/resolvers/kit/adapter.ts';

test('names are normalized, not refused', () => {
  assert.equal(normalizeName('Add CSV Parser Tests'), 'add-csv-parser-tests');
  assert.equal(normalizeName('9lives'), 'x9lives');
  assert.equal(normalizeName('a'.repeat(40)).length, 32);
  assert.equal(normalizeName('weird__name--'), 'weird__name');
  assert.equal(normalizeName('My Change'), 'my-change');
});
