// A known error's exit code and its line, after the prefix, are tested
// through lets, in tests/delegate/run.test.ts. No command reaches an error
// lets does not know, so that case stays here.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { guarded } from '../../../lets/src/delegate/guarded.ts';

// Deps that keep what the command printed on stderr.
function setup() {
  const err: string[] = [];
  return { deps: { stderr: (text: string) => err.push(text) }, stderr: () => err.join('') };
}

test('guarded rethrows an error it does not know', async () => {
  const t = setup();
  await assert.rejects(guarded(t.deps, async () => { throw new TypeError('a bug'); }), TypeError);
  assert.equal(t.stderr(), '');
});
