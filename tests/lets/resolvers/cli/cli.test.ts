import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runCommand } from '../../../../lets/src/resolvers/cli/cli.ts';

const TRICKY = 'Say "hi".\nIt\'s fine.';
const LAST = '/r/.workspace/lets-delegate/x.last-message.md';

// The write-mode commands a step runs. The read-only ones a review runs are
// tested through lets, in tests/delegate/run.test.ts.
const command = (over: Partial<Parameters<typeof runCommand>[0]>) =>
  runCommand({ mode: 'read-only', family: 'gpt', model: null, effort: 'high', prompt: TRICKY, lastMessagePath: LAST, timeoutMinutes: 45, ...over });

test('codex writes in its bypass mode, with no sandbox, the prompt on stdin and its last message in a file', () => {
  assert.deepEqual(command({ mode: 'write' }), {
    cmd: 'codex',
    args: ['exec', '--dangerously-bypass-approvals-and-sandbox', '-c', 'model_reasoning_effort="high"', '-o', LAST, '-'],
    input: TRICKY,
    readResultFrom: LAST,
  });
});
test('codex takes the step\'s model with -m', () => {
  assert.deepEqual(command({ mode: 'write', model: 'gpt-6-luna' }).args,
    ['exec', '--dangerously-bypass-approvals-and-sandbox', '-c', 'model_reasoning_effort="high"', '-m', 'gpt-6-luna', '-o', LAST, '-']);
});
test('claude writes in bypassPermissions mode, with the prompt on stdin and its answer on stdout', () => {
  assert.deepEqual(command({ mode: 'write', family: 'claude', effort: 'low' }),
    { cmd: 'claude', args: ['-p', '--permission-mode', 'bypassPermissions', '--effort', 'low'], input: TRICKY, readResultFrom: 'stdout' });
});
test('claude takes the step\'s model with --model', () => {
  assert.deepEqual(command({ mode: 'write', family: 'claude', effort: 'low', model: 'claude-fable-5-1' }).args,
    ['-p', '--permission-mode', 'bypassPermissions', '--effort', 'low', '--model', 'claude-fable-5-1']);
});
test('agy writes in accept-edits mode with permissions skipped, the prompt as the argument of -p', () => {
  assert.deepEqual(command({ mode: 'write', family: 'gemini', effort: 'medium', timeoutMinutes: 120 }), {
    cmd: 'agy',
    args: ['--mode', 'accept-edits', '--dangerously-skip-permissions', '--effort', 'medium', '--print-timeout', '120m', '-p', TRICKY],
    input: undefined,
    readResultFrom: 'stdout',
  });
});
test('agy takes the step\'s model with the effort added', () => {
  assert.deepEqual(command({ mode: 'write', family: 'gemini', effort: 'high', model: 'gemini-3.8-flash', timeoutMinutes: 30 }).args,
    ['--mode', 'accept-edits', '--dangerously-skip-permissions', '--effort', 'high', '--model', 'gemini-3.8-flash-high', '--print-timeout', '30m', '-p', TRICKY]);
});
