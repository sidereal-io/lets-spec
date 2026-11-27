// lets delegate step read against lets delegate step run, with fake deps,
// so both read the same clock. tests/delegate/read.test.ts runs step read
// as a program, where the clock is the real one.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { read } from '../../../lets/src/delegate/read.ts';
import { run } from '../../../lets/src/delegate/step.ts';
import { commandDeps } from './fixtures/command-deps.ts';

const NOW = Date.UTC(2026, 10, 4, 9, 30, 0);

// What step run prints for a t3 session that ends with message, and what
// step read prints for a file that holds it.
async function bothLines(message: string) {
  const ran = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', adapters: { t3: { step: { text: message } } } });
  ran.io.now = () => NOW;
  assert.equal(await run({ for: 'build', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt'] }, ran.deps), 0, ran.stderr());
  const readBack = commandDeps({ files: { '/repo/m.md': message } });
  readBack.io.now = () => NOW;
  assert.equal(await read({ messageFile: 'm.md' }, readBack.deps), 0, readBack.stderr());
  return { run: ran.stdout(), read: readBack.stdout() };
}

test('step read prints the line step run prints for a session that ends with a done report', async () => {
  const lines = await bothLines('Built it.\n\n```step-report\noutcome: done\nevidence:\n  - commit 3f2a1c0\n```\n');
  assert.match(lines.run, /"date":"2026-11-04T09:30:00Z"/);
  assert.equal(lines.read, lines.run);
});

test('step read prints the line step run prints for a session that ends with no block', async () => {
  const lines = await bothLines('Built it, and forgot the block.\n');
  assert.match(lines.run, /"outcome":"failed"/);
  assert.equal(lines.read, lines.run);
});
