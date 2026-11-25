// The cli adapter itself, on the kit's fake io. The cli resolver's
// reviews and steps are tested through lets, in tests/delegate/. The
// chain only ever finishes a handle the adapter made, so the case here
// cannot be reached through a command.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAdapter } from '../../../../lets/src/resolvers/cli/cli.ts';
import { fakeIo } from '../kit/fixtures/fake-io.ts';

test('finish removes nothing for a process handle whose id is not a session name', async () => {
  const io = fakeIo({ commands: ['codex'], files: { '/repo/.workspace/lets-delegate/../x.last-message.md': 'X' } });
  await assert.rejects(createAdapter(io).finish({ kind: 'process', id: '../x' }, true, { cwd: '/repo' }), /not a session name/);
  assert.deepEqual(io.removed, []);
});
