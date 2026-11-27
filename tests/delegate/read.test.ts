// lets delegate step read, run as a program: it reads a session's final
// message from a file and prints the step report lets delegate step run
// would print for it. It starts no session, so no stand-in is written.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import type { LetsResult } from '../support/lets.ts';
import { delegateRepo } from './repo.ts';
import { assertClockDate, ending } from './steps.ts';

const DONE = ending('outcome: done\nevidence:\n  - "commit 3f2a1c0"\n');

const READ = ['delegate', 'step', 'read', '--message-file', 'm.md'];

// The repository with m.md holding message, at its root.
function withMessage(t: Parameters<typeof delegateRepo>[0], message: string, setup: Parameters<typeof delegateRepo>[1] = {}) {
  const repo = delegateRepo(t, setup);
  writeFileSync(join(repo.cwd, 'm.md'), message);
  return repo;
}

// The step report of a run that exited 0: stdout's one line, as JSON, with
// nothing on stderr.
function reportOf(result: LetsResult): Record<string, unknown> {
  assert.equal(result.code, 0, result.output);
  assert.match(result.stdout, /^[^\n]+\n$/, 'stdout is exactly one line');
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

// A run that failed with exit 2: nothing on stdout, and stderr that names
// --message-file and each of names.
function usageError(result: LetsResult, ...names: string[]) {
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  for (const name of ['--message-file', ...names]) assert.ok(result.stderr.includes(name), result.stderr);
}

describe('step read', () => {
  test('a done report is printed with its evidence and the date it was printed', async (t) => {
    const repo = withMessage(t, `First paragraph.\n\nSecond paragraph.\n\n${DONE}`);
    const before = Date.now();
    const result = await repo.run(READ);
    const after = Date.now();
    assert.ok(result.stdout.startsWith('{"outcome":"done",'), result.stdout);
    const { date, ...rest } = reportOf(result);
    assert.deepEqual(rest, { outcome: 'done', evidence: ['commit 3f2a1c0'] });
    assertClockDate(date, before, after);
  });

  test('a needs-input report keeps ask: true on its question and drops ask: false', async (t) => {
    const repo = withMessage(t, ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n    recommendation: lets-minimal\n    ask: true\n  - question: Which base?\n    ask: false\n'));
    const result = await repo.run(READ);
    assert.ok(result.stdout.startsWith('{"outcome":"needs-input",'), result.stdout);
    assert.deepEqual(reportOf(result).questions, [
      { question: 'Which schema?', recommendation: 'lets-minimal', ask: true },
      { question: 'Which base?' },
    ]);
  });

  test('a failed report is printed as the session wrote it', async (t) => {
    const repo = withMessage(t, ending('outcome: failed\nreason: tests fail on main\n'));
    const result = await repo.run(READ);
    reportOf(result);
    assert.equal(result.stdout, '{"outcome":"failed","reason":"tests fail on main"}\n');
  });

  test('a message with no block is a failed report that holds the message', async (t) => {
    const message = 'I built it, but forgot the block.\n';
    const report = reportOf(await withMessage(t, message).run(READ));
    assert.equal(report.outcome, 'failed');
    assert.match(report.reason as string, /step-report/);
    assert.equal(report.message, message);
  });

  test('a done report with no evidence is a failed report that names evidence', async (t) => {
    const report = reportOf(await withMessage(t, ending('outcome: done\n')).run(READ));
    assert.equal(report.outcome, 'failed');
    assert.match(report.reason as string, /evidence/);
  });

  test('a relative --message-file is read from the working directory', async (t) => {
    const repo = delegateRepo(t);
    const docs = join(repo.cwd, 'docs');
    mkdirSync(docs);
    writeFileSync(join(docs, 'm.md'), DONE);
    assert.equal(reportOf(await repo.run(READ, { cwd: docs })).outcome, 'done');
  });

  test('a lets config that is not valid YAML does not stop it', async (t) => {
    const repo = withMessage(t, DONE, { repo: 'delegate: [unclosed\n' });
    assert.equal(reportOf(await repo.run(READ)).outcome, 'done');
  });

  test('no --message-file is a usage error', async (t) => {
    usageError(await delegateRepo(t).run(['delegate', 'step', 'read']));
  });

  test('a --message-file that does not exist is a usage error that names it', async (t) => {
    usageError(await delegateRepo(t).run(['delegate', 'step', 'read', '--message-file', 'missing.md']), 'missing.md');
  });

  test('a --message-file that is a folder is a usage error that names it', async (t) => {
    const repo = delegateRepo(t);
    mkdirSync(join(repo.cwd, 'notes'));
    usageError(await repo.run(['delegate', 'step', 'read', '--message-file', 'notes']), 'notes');
  });
});
