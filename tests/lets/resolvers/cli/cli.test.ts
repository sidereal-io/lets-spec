import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { RunInput } from '../../../../lets/src/resolvers/kit/adapter.ts';
import { createAdapter, runCommand } from '../../../../lets/src/resolvers/cli/cli.ts';
import { fakeIo } from '../kit/fixtures/fake-io.ts';

const TRICKY = 'Say "hi".\nIt\'s fine.';
const LAST = '/r/.workspace/lets-delegate/x.last-message.md';
const OK = { stdout: '', stderr: '', code: 0 };

const command = (over: Partial<Parameters<typeof runCommand>[0]>) =>
  runCommand({ mode: 'read-only', family: 'gpt', model: null, effort: 'high', prompt: TRICKY, lastMessagePath: LAST, timeoutMinutes: 45, ...over });

test('codex runs exec in its read-only sandbox, with the prompt on stdin and its last message in a file', () => {
  assert.deepEqual(command({}), {
    cmd: 'codex',
    args: ['exec', '-s', 'read-only', '-c', 'model_reasoning_effort="high"', '-o', LAST, '-'],
    input: TRICKY,
    readResultFrom: LAST,
  });
});
test('codex takes the reviewer\'s model with -m', () => {
  assert.deepEqual(command({ model: 'gpt-6.1-sol' }).args,
    ['exec', '-s', 'read-only', '-c', 'model_reasoning_effort="high"', '-m', 'gpt-6.1-sol', '-o', LAST, '-']);
});
test('claude runs -p in plan mode, with the prompt on stdin and its answer on stdout', () => {
  assert.deepEqual(command({ family: 'claude', effort: 'low' }),
    { cmd: 'claude', args: ['-p', '--permission-mode', 'plan', '--effort', 'low'], input: TRICKY, readResultFrom: 'stdout' });
});
test('claude takes the reviewer\'s model with --model', () => {
  assert.deepEqual(command({ family: 'claude', effort: 'low', model: 'claude-fable-5-1' }).args,
    ['-p', '--permission-mode', 'plan', '--effort', 'low', '--model', 'claude-fable-5-1']);
});
test('agy runs in plan mode, with the prompt as the argument of -p', () => {
  assert.deepEqual(command({ family: 'gemini', effort: 'medium', timeoutMinutes: 15 }), {
    cmd: 'agy',
    args: ['--mode', 'plan', '--effort', 'medium', '--print-timeout', '15m', '-p', TRICKY],
    input: undefined,
    readResultFrom: 'stdout',
  });
});
test('agy takes the reviewer\'s model with the effort added', () => {
  assert.deepEqual(command({ family: 'gemini', effort: 'high', model: 'gemini-3.8-flash' }).args,
    ['--mode', 'plan', '--effort', 'high', '--model', 'gemini-3.8-flash-high', '--print-timeout', '45m', '-p', TRICKY]);
});

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

const run: RunInput = { name: 'x', prompt: TRICKY, cwd: '/r', family: 'gpt', model: null, effort: 'high' };

test('a run\'s handle is a process named after the session', async () => {
  const io = fakeIo({ commands: ['claude'], results: [{ stdout: 'FINDINGS\n', stderr: '', code: 0 }] });
  const { handle } = await createAdapter(io).run({ ...run, family: 'claude' }, { timeoutMs: 60000 });
  assert.deepEqual(handle, { kind: 'process', id: 'x' });
});

test('a codex run answers with the last message codex wrote', async () => {
  const io = fakeIo({ commands: ['codex'], results: [(cmd, args) => {
    io.files.set(args[args.indexOf('-o') + 1], 'FINDINGS\n');
    return OK;
  }] });
  const { text } = await createAdapter(io).run(run, { timeoutMs: 45 * 60000 });
  assert.equal(text, 'FINDINGS\n');
  assert.ok(io.dirs.includes('/r/.workspace/lets-delegate'), 'the scratch folder exists before codex writes to it');
});

test('the CLI runs in the request\'s folder, with the prompt, the timeout and no session markers', async () => {
  const io = fakeIo({ commands: ['claude'], results: [{ stdout: 'FINDINGS\n', stderr: '', code: 0 }] });
  const { text } = await createAdapter(io).run({ ...run, family: 'claude' }, { timeoutMs: 15 * 60000 });
  assert.equal(text, 'FINDINGS\n');
  const [cmd, , options] = io.calls[0];
  assert.equal(cmd, 'claude');
  assert.deepEqual([options.cwd, options.input, options.timeoutMs], ['/r', TRICKY, 15 * 60000]);
  assert.equal(options.env?.CLAUDECODE, undefined);
  assert.equal(options.env?.PATH, '/bin');
});
