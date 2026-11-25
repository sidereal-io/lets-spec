// lets backlog key, run as a program: whether text is one of the backlog
// provider's keys, decided from the text alone. The stand-in gh answers
// nothing, so any gh call would exit 127, and it logs every call.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import { backlog, type BacklogFiles } from './github.ts';

async function key(t: TestContext, args: string[], files: BacklogFiles = {}) {
  const b = backlog(t, [], files);
  const result = await b.lets('key', ...args);
  return { result, out: result.code === 0 ? b.json(result) : null, calls: b.calls() };
}

test('a GitHub number is a key, labelled with its hash', async (t) => {
  for (const text of ['149', '#149']) {
    const { result, out } = await key(t, [text]);
    assert.equal(result.code, 0, text);
    assert.deepEqual(out, { key: '149', label: '#149' }, text);
  }
});

test('words, and numbers GitHub does not use, are not keys', async (t) => {
  for (const text of ['refactor', 'PROJ-12', '0', '#0', '012', '1.5', '#', '##149', '149#', ' 149', "can't"]) {
    const { result, out } = await key(t, [text]);
    assert.equal(result.code, 0, text);
    assert.deepEqual(out, { key: null, label: null }, text);
  }
});

test('text after -- is the text, even when it looks like an option, and runs no gh command', async (t) => {
  for (const text of ['--help', '-V', '--version', '-149']) {
    const { result, out, calls } = await key(t, ['--', text]);
    assert.equal(result.code, 0, text);
    assert.deepEqual(out, { key: null, label: null }, text);
    assert.doesNotMatch(result.stdout, /Usage:/, text);
    assert.deepEqual(calls, [], text);
  }
  assert.deepEqual((await key(t, ['--', '#149'])).out, { key: '149', label: '#149' });
});

test('key runs no gh command, so it needs no Project', async (t) => {
  const { result, out, calls } = await key(t, ['149']);
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(out, { key: '149', label: '#149' });
  assert.deepEqual(calls, []);
});

test('key with an unknown backlog provider is unknown-backlog-provider', async (t) => {
  const { result } = await key(t, ['149'], { config: 'version: 3\nbacklog:\n  provider: jria\n' });
  assert.equal(result.code, 1, result.output);
  assert.equal(JSON.parse(result.stdout).error, 'unknown-backlog-provider');
});

test('key takes exactly one text', async (t) => {
  for (const args of [[], ['149', '150']]) {
    const { result } = await key(t, args);
    assert.equal(result.code, 2, args.join(' '));
    assert.equal(result.stdout, '');
  }
});
