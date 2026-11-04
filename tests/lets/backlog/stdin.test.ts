import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStdin } from '../../../lets/src/backlog/stdin.ts';
test('stdin preserves Unicode split across byte chunks', async () => {
  const bytes = Buffer.from('{"body":"handoff — 日本語 🦉"}');
  async function* chunks() { for (const byte of bytes) yield Buffer.from([byte]); }
  assert.equal(await readStdin(chunks()), '{"body":"handoff — 日本語 🦉"}');
});
test('stdin bounds raw bytes before decoding', async () => {
  async function* chunks() { yield Buffer.alloc(1024 * 1024 + 1); }
  await assert.rejects(readStdin(chunks()), (error: any) => error.category === 'invalid_request' && error.effects === 'none');
});
