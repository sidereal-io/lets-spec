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
    if (confirmed.state === 'action') throw new Error('reconciliation must finish');
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
