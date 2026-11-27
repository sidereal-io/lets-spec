// lets delegate step run with fake resolvers, for what no real resolver
// can show. tests/delegate/step.test.ts tests step run through lets, with
// the cli and subagent resolvers.
//
// - A step skips a resolver that runs no step: cli, subagent and t3 all
//   run steps (ADR-016), so only a fake adapter can leave step out.
// - A finish that fails: cli's finish only removes a file the session
//   wrote, and subagent gives no handle to finish, so only a fake t3
//   adapter's finish can throw.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { SessionFailed } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, HEAD } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'build', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 4\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
// The resolvers asked to run a step, in order.
const stepsBy = (t: ReturnType<typeof commandDeps>) => t.adapterCalls('step').map(([name]) => name);
// stdout's one line, read as JSON.
const report = (t: ReturnType<typeof commandDeps>) => {
  assert.equal(t.stdout().split('\n').length, 2, 'one line on stdout');
  return JSON.parse(t.stdout());
};

test('a resolver that runs no step passes it down the chain', async () => {
  const t = commandDeps({ config: 'version: 4\ndelegate: { resolvers: [t3, cli] }\n', adapters: { t3: { steps: false }, cli: {} } });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(stepsBy(t), ['cli']);
  assert.equal(report(t).outcome, 'done');
});

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'build', 'the record still ends stderr');
});

// A code review of claude's work, as step run takes it.
const reviewer = (over: Partial<StepOptions> = {}) => options({ for: 'review-build', name: 'X Plan Review', sourceFamily: 'claude', ...over });

test('a reviewer asks a resolver that runs no step for a read-only session', async () => {
  const t = commandDeps({ config: 'version: 4\ndelegate: { resolvers: [t3] }\n', adapters: { t3: { steps: false } } });
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.deepEqual(t.adapterCalls('run').map(([name]) => name), ['t3']);
  assert.deepEqual(report(t).findings, 'FINDINGS');
});

test('a reviewer\'s record names the checkout the resolver ran in, and the commit at its HEAD', async () => {
  const t = withT3({ adapters: { t3: { run: { checkout: '/w/elsewhere' } } } });
  assert.equal(await run(reviewer(), t.deps), 0);
  const { checkout, commit } = JSON.parse(t.stderr());
  assert.deepEqual({ checkout, commit }, { checkout: '/w/elsewhere', commit: HEAD });
  assert.ok(t.io.calls.some(([cmd, args, opts]) => cmd === 'git' && args.join(' ') === 'rev-parse HEAD' && opts.cwd === '/w/elsewhere'), 'HEAD was read in the checkout');
});

test('a resolver that cannot tell a reviewer\'s checkout gives a null commit, and the review is still done', async () => {
  const t = withT3({ adapters: { t3: { run: { checkout: null } } } });
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  const { checkout, commit } = JSON.parse(t.stderr());
  assert.deepEqual({ checkout, commit }, { checkout: null, commit: null });
});

test('a done reviewer\'s session is finished with ok', async () => {
  const t = withT3();
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.deepEqual(t.adapterCalls('finish').map(([, , input]) => (input as { ok: boolean }).ok), [true]);
});

test('a reviewer the resolver reports failed is a failed report with its reason, and no session is finished', async () => {
  const t = withT3({ adapters: { t3: { run: new SessionFailed('the session stopped to ask') } } });
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.deepEqual(report(t), { outcome: 'failed', reason: 'the session stopped to ask' });
  const { handle, checkout, commit } = JSON.parse(t.stderr());
  assert.deepEqual({ handle, checkout, commit }, { handle: null, checkout: null, commit: null });
  assert.deepEqual(t.adapterCalls('finish'), []);
});

test('a tree that cannot be checked after a reviewer that failed with no handle is exit 4, naming no session', async () => {
  const t = withT3({ adapters: { t3: { run: new SessionFailed('boom') } } });
  const { execFile } = t.io;
  let statuses = 0;
  t.io.execFile = async (cmd, args, opts) => {
    // The first git status, before the session, works; the next fails.
    if (cmd === 'git' && args[0] === 'status' && statuses++ > 0) return { stdout: '', stderr: 'index broken', code: 128 };
    return execFile(cmd, args, opts);
  };
  assert.equal(await run(reviewer(), t.deps), 4);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /could not check the tree after the session: git status failed in \/repo: index broken\n$/);
  assert.deepEqual(t.adapterCalls('finish'), []);
});

test('a reviewer that changes the tree is finished without ok', async () => {
  const t = withT3();
  const { execFile } = t.io;
  let statuses = 0;
  t.io.execFile = async (cmd, args, opts) => {
    if (cmd === 'git' && args[0] === 'status' && statuses++ > 0) return { stdout: '?? src/a.ts\0', stderr: '', code: 0 };
    return execFile(cmd, args, opts);
  };
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.equal(report(t).outcome, 'failed');
  assert.deepEqual(t.adapterCalls('finish').map(([, , input]) => (input as { ok: boolean }).ok), [false]);
});

test('a reviewer whose finish fails is reported, and the done report stands', async () => {
  const t = withT3({ adapters: { t3: { run: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(reviewer(), t.deps), 0);
  assert.deepEqual(report(t).findings, 'FINDINGS');
  const lines = t.stderr().trim().split('\n');
  assert.match(lines[0], /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(lines[1]).gitClean, true);
});
