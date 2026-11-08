import { validateItem } from '../../../lets/src/backlog/items.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recoverMutation } from '../../../lets/src/backlog/recovery.ts';
import { withAdapter, story } from './fixtures/adapter.ts';
test('lost creation is reconciled without creating another item', () =>
  withAdapter(async ({ call }) => {
    const result = await recoverMutation<{
      item: import('../../../lets/src/backlog/items.ts').Item;
    }>(
      () => call('item.create', story, 'create', { fault: 'error-unknown_outcome' }),
      async () => {
        const recovered = await call('mutation.read', { mutationId: 'create' });
        if (recovered.state === 'applied') {
          assert.ok(recovered.result);
          validateItem(recovered.result.item);
          return { state: 'applied', result: { item: recovered.result.item } };
        }
        return { state: recovered.state };
      },
      'item.create',
    );
    assert.equal(result.item.title, story.title);
    assert.equal((await call('candidate.list')).items.length, 1);
  }));
test('persisted mutation key cannot be rebound to different input', () =>
  withAdapter(async ({ call }) => {
    await call('item.create', story, 'create');
    await assert.rejects(
      call('item.create', { ...story, title: 'Different' }, 'create'),
      /invalid_request/,
    );
    assert.equal((await call('candidate.list')).items.length, 1);
  }));
test('targeted update retry preserves provider data', () =>
  withAdapter(async ({ call, state }) => {
    const { item } = await call('item.create', story, 'create');
    const patch = { item: item.identity, patch: { metadata: { Size: 'M' } } };
    await assert.rejects(
      call('item.update', patch, 'update', { fault: 'error-unknown_outcome' }),
      /unknown_outcome/,
    );
    const before = state();
    await call('item.update', patch, 'update');
    assert.deepEqual(state(), before);
    assert.equal((await call('item.read', { item: item.identity })).item.metadata.Size, 'M');
  }));
test('relationship retry leaves exactly one directional edge', () =>
  withAdapter(async ({ call }) => {
    const a = (await call('item.create', story, 'a')).item.identity;
    const b = (await call('item.create', story, 'b')).item.identity;
    const input = { item: a, target: b, kind: 'blocked_by', present: true };
    await assert.rejects(
      call('relationship.write', input, 'edge', { fault: 'error-unknown_outcome' }),
      /unknown_outcome/,
    );
    await call('relationship.write', input, 'edge');
    assert.deepEqual(
      (await call('relationship.list', { item: a, kind: 'blocked_by' })).items.map(
        (edge) => edge.identity,
      ),
      [b],
    );
  }));
test('unresolved reconciliation prevents another write', async () => {
  let writes = 0;
  await assert.rejects(
    recoverMutation(
      () => ++writes,
      () => ({ state: 'unknown' }),
      'item.create',
    ),
    /unknown_outcome/,
  );
  assert.equal(writes, 0);
});
for (const phase of ['before', 'after']) {
  test(`recovered creation result is validated ${phase} apply`, async () => {
    let reads = 0;
    await assert.rejects(
      recoverMutation(
        () => {
          throw Object.assign(new Error('lost'), { category: 'unknown_outcome' });
        },
        () =>
          ++reads === 1 && phase === 'after'
            ? { state: 'absent' }
            : { state: 'applied', result: {} },
        'item.create',
      ),
      /item/,
    );
  });
}

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submittedClaim, submissionFor } from './fixtures/submitted.ts';
test('uncertain claim resumes through a fresh read of original scope', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/reconcile-');
  try {
    const { action } = submittedClaim();
    const store = new OperationStore(join(dir, 'private'));
    store.issue(action, ['item:R1:P1:I1']);
    const resumed = new OperationStore(join(dir, 'private')).resume(action.operationId, 6000);
    assert.equal(resumed.state, 'action');
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.operationId, action.operationId);
    assert.notEqual(resumed.action.actionId, action.actionId);
    assert.equal(resumed.action.request.operation, 'claim.read');
    const confirmed = store.submit(resumed.continuation, submissionFor(resumed.action, { data: { claim: {
      actor: 'me', session: null, token: null, status: 'In Progress', guarantee: 'best-effort',
    } } }), 6100);
    assert.notEqual(confirmed.state, 'action');
    if (!('result' in confirmed)) throw new Error('reconciliation must finish');
    assert.equal(confirmed.result.reconciliation, 'applied');
    assert.equal(store.get(action.operationId).pending, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('rejected write cannot regain authority through corrected output', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/rejected-write-');
  try {
    const { action } = submittedClaim();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action, ['item:R1:P1:I1']);
    assert.throws(() => store.submit(issued.continuation, '{', 200));
    assert.equal(store.get(action.operationId).state, 'needs-reconciliation');
    assert.equal(store.get(action.operationId).pending, true);
    assert.throws(() => store.submit(issued.continuation, submissionFor(action, { data: { claim: {
      actor: 'me', session: 'worker', token: 'original', status: 'In Progress', guarantee: 'best-effort',
    } } }), 300), /reconciliation.*required/);
    assert.equal(store.get(action.operationId).attempts.length, 2);
    const resumed = store.resume(action.operationId, 400);
    assert.deepEqual(resumed.action.allowedEffects, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { requireOriginalWorker } from '../../../lets/src/backlog/operation-store.ts';
test('reconciliation preserves original worker provenance for release', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/provenance-');
  try {
    const { action } = submittedClaim();
    const store = new OperationStore(join(dir, 'private'));
    store.issue(action, []);
    const resumed = new OperationStore(join(dir, 'private')).resume(action.operationId, 6000);
    assert.equal(resumed.workerId, action.workerId);
    assert.throws(() => requireOriginalWorker(store.get(action.operationId), {
      ...action.request.context, session: 'new-worker',
    }), /original.*worker/);
    assert.doesNotThrow(() => requireOriginalWorker(store.get(action.operationId), action.request.context));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { writeFileSync } from 'node:fs';
test('operation ID recovers its original continuation after scratch loss', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/scratch-loss-');
  try {
    const { action } = submittedClaim();
    const statePath = join(dir, 'private');
    const store = new OperationStore(statePath);
    const original = store.issue(action, []);
    const scratch = join(dir, 'continuation.json');
    writeFileSync(scratch, JSON.stringify(original.continuation));
    rmSync(scratch);
    const { action: later } = submittedClaim();
    const found = new OperationStore(statePath).issue(later, []);
    assert.equal(found.operationId, action.operationId);
    const resumed = new OperationStore(statePath).resume(found.operationId, 6000);
    assert.deepEqual(resumed.continuation, original.continuation);
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.request.context.repository, 'R1');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { submittedPr } from './fixtures/submitted.ts';
import { readFileSync } from 'node:fs';
const rawPr = JSON.parse(readFileSync(new URL('./fixtures/github-pr.json', import.meta.url), 'utf8')).data.node;
function branchPrOutput(pr: unknown = rawPr) {
  return [{ data: { viewer: { login: 'actor' }, node: { id: 'R1', pullRequests: {
    nodes: pr === null ? [] : [pr], totalCount: pr === null ? 0 : 1, pageInfo: { hasNextPage: false, endCursor: pr === null ? null : 'last' },
  } } } }];
}
test('new step recovers uncertain PR creation through the original read-only continuation', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pr-recovery-');
  try {
    const first = submittedPr();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(first);
    const second = submittedPr('pull-request.create', { session: 'new-step', cwd: '/another-worktree' });
    const blocked = new OperationStore(join(dir, 'private')).issue(second);
    assert.equal(blocked.state, 'needs-reconciliation');
    assert.deepEqual(blocked.continuation, issued.continuation);
    const resumed = store.resume(blocked.operationId, 6000);
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.step, 'read-existing');
    const result = store.submit(resumed.continuation, submissionFor(resumed.action, branchPrOutput()), 6100);
    assert.notEqual(result.state, 'action');
    if (!('result' in result)) throw new Error('reconciliation cannot request a write');
    assert.equal(result.result.reconciliation, 'applied');
    assert.equal(result.result.reservationCleared, true);
    assert.equal(store.get(first.operationId).pending, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('known created PR ID stays reserved until fresh confirmation', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pr-known-id-');
  try {
    const action = submittedPr();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const verifying = store.submit(issued.continuation, submissionFor(action, {
      data: { createPullRequest: { pullRequest: rawPr } },
    }), 200);
    assert.equal(verifying.state, 'action');
    const blocked = new OperationStore(join(dir, 'private')).issue(submittedPr('pull-request.ready'));
    assert.equal(blocked.state, 'needs-reconciliation');
    assert.equal(blocked.operationId, action.operationId);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
import { prAction } from '../../../lets/src/backlog/pr-actions.ts';
test('duplicate pre-write submission does not reissue the pending write', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pr-duplicate-');
  try {
    const action = prAction(submittedPr(), 'preflight', 100);
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const repository = JSON.parse(readFileSync(new URL('./fixtures/github-repository.json', import.meta.url), 'utf8'));
    const read = store.submit(issued.continuation, submissionFor(action, repository), 200);
    assert.equal(read.state, 'action');
    if (read.state !== 'action') throw new Error('branch read required');
    const observation = submissionFor(read.action, branchPrOutput(null));
    const write = store.submit(read.continuation, observation, 300);
    assert.equal(write.state, 'action');
    const repeated = store.submit(read.continuation, observation, 400);
    assert.equal(repeated.state, 'needs-reconciliation');
    assert.equal(repeated.operationId, action.operationId);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const [name, pr, verdict] of [
  ['absent PR', null, 'unresolved'],
  ['different prepared body', { ...rawPr, body: 'Unrelated body' }, 'unresolved'],
  ['missing draft effect', { ...rawPr, isDraft: false }, 'partial'],
] as const) {
  test(`uncertain creation retains reservation for ${name}`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/pr-unresolved-');
    try {
      const action = submittedPr();
      const store = new OperationStore(join(dir, 'private'));
      store.issue(action);
      const resumed = store.resume(action.operationId, 6000);
      const result = store.submit(resumed.continuation, submissionFor(resumed.action, branchPrOutput(pr)), 6100);
      assert.equal(result.state, 'needs-reconciliation');
      if (!('result' in result)) throw new Error('read observation required');
      assert.equal(result.result.reconciliation, verdict);
      assert.equal(store.get(action.operationId).pending, true);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
test('creation reconciliation reads the known PR after partial confirmation', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pr-partial-id-');
  try {
    const action = submittedPr();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    assert.throws(() => store.submit(issued.continuation, submissionFor(action, {
      data: { createPullRequest: { pullRequest: { ...rawPr, isDraft: false } } },
    }), 200), /draft confirmation/);
    const resumed = store.resume(action.operationId, 6000);
    assert.equal(resumed.action.targetPullRequest, 'PR1');
    assert.equal(resumed.action.step, 'verify');
    assert.deepEqual(resumed.action.allowedEffects, []);
    const refreshed = new OperationStore(join(dir, 'private')).resume(action.operationId, 7000);
    assert.equal(refreshed.action.targetPullRequest, 'PR1');
    const result = store.submit(refreshed.continuation, submissionFor(refreshed.action, {
      data: { viewer: { login: 'actor' }, node: rawPr },
    }), 7100);
    assert.equal(result.state, 'complete');
    if (!('result' in result)) throw new Error('reconciliation must return observations');
    assert.equal(result.result.reconciliation, 'applied');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('uncertain PR body update reconciles the recorded prepared bytes', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/pr-body-recovery-');
  try {
    const body = 'Closes #1\n\n## Existing section\nKeep this\n\n## Plan review\nNew evidence';
    const action = submittedPr('pull-request.update', { body });
    const store = new OperationStore(join(dir, 'private'));
    store.issue(action);
    const resumed = new OperationStore(join(dir, 'private')).resume(action.operationId, 6000);
    assert.deepEqual(resumed.action.allowedEffects, []);
    assert.equal(resumed.action.targetPullRequest, 'PR1');
    const result = store.submit(resumed.continuation, submissionFor(resumed.action, {
      data: { viewer: { login: 'actor' }, node: { ...rawPr, body } },
    }), 6100);
    assert.equal(result.state, 'complete');
    if (!('result' in result)) throw new Error('read-only reconciliation required');
    assert.equal(result.result.reconciliation, 'applied');
    assert.equal(store.get(action.operationId).pending, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const [name, observed] of [
  ['missing PR', null],
  ['unrelated remote edits', { ...rawPr, body: 'Closes #1\n\nUnrelated new text\n\n## Plan review\nNew evidence' }],
] as const) {
  test(`uncertain body update preserves ${name} without a repair write`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/pr-body-conflict-');
    try {
      const action = submittedPr('pull-request.update', { body: 'Closes #1\n\n## Plan review\nNew evidence' });
      const store = new OperationStore(join(dir, 'private'));
      store.issue(action);
      const resumed = store.resume(action.operationId, 6000);
      const result = store.submit(resumed.continuation, submissionFor(resumed.action, {
        data: { viewer: { login: 'actor' }, node: observed },
      }), 6100);
      assert.equal(result.state, 'needs-reconciliation');
      if (!('result' in result)) throw new Error('read-only observation required');
      assert.equal(result.result.reconciliation, 'unresolved');
      assert.equal(store.get(action.operationId).pending, true);
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
