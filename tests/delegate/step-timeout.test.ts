// The time limits of lets delegate step run and step wait, run as a
// program. Each takes a minute, the shortest --timeout-minutes, so they
// have a file of their own, which Node runs beside the other test files,
// and they run at the same time.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'node:test';
import { claude } from '../support/lets.ts';
import { delegateRepo } from './repo.ts';
import { claudeWrite, cleanUpStep, stepRun, stepStart, stopStep, untilCalled, untilGone } from './steps.ts';

const CLI = 'version: 4\ndelegate: { resolvers: [cli] }\n';
const LETS_LIMIT_MS = 100_000;

// A hanging stand-in ends by itself after 120 seconds, so a run this short
// shows that lets stopped waiting, and one this long that it waited the
// whole minute.
const tookAMinute = (elapsed: number) => assert.ok(elapsed >= 55_000 && elapsed < 90_000, `the run took ${elapsed} ms`);

describe('step time limits', { concurrency: true }, () => {
  test('step run past its time is stopped, and is exit 6 with no report, in its exit file too', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    claude(repo.standIns, { rows: [{ args: claudeWrite('low'), hang: true }] });
    const started = performance.now();
    const result = await repo.run(stepRun({ effort: 'low', timeoutMinutes: 1, exitFile: 'e.json' }), { timeoutMs: LETS_LIMIT_MS });
    tookAMinute(performance.now() - started);
    assert.equal(result.code, 6, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^lets delegate: claude did not finish in 1 minutes$/m);
    assert.equal(JSON.parse(readFileSync(join(repo.cwd, 'e.json'), 'utf8')).exit, 6);
  });

  test('step wait past its time is exit 6, naming the step, which still runs', async (t) => {
    const repo = delegateRepo(t, { user: CLI });
    const stand = claude(repo.standIns, { rows: [{ args: claudeWrite(), hang: true }] });
    const start = await repo.run(stepStart());
    assert.equal(start.code, 0, start.output);
    const { pid } = JSON.parse(start.stdout);
    cleanUpStep(t, pid);
    await untilCalled(stand);
    const wait = ['delegate', 'step', 'wait', '--name', 'build-x'];
    const started = performance.now();
    const result = await repo.run([...wait, '--timeout-minutes', '1'], { timeoutMs: LETS_LIMIT_MS });
    tookAMinute(performance.now() - started);
    assert.equal(result.code, 6, result.output);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^lets delegate: none of build-x ended in 1 minutes; each still runs\.$/m);
    assert.doesNotThrow(() => process.kill(pid, 0), 'the step still runs');
    assert.equal(existsSync(join(repo.cwd, '.workspace', 'lets-delegate', 'build-x.exit.json')), false);
    stopStep(pid);
    await untilGone(pid);
    const after = await repo.run(wait);
    assert.equal(after.code, 0, after.output);
    assert.equal(after.stdout, '{"name":"build-x","exit":4}\n');
  });
});
