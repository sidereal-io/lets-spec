import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, story } from './fixtures/adapter.ts';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submittedReference, submissionFor } from './fixtures/submitted.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
test('GitHub reference conformance refuses remote write permission before issuance', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/reference-effects-');
  try {
    const { action } = submittedReference();
    const write = issueAction(action.request, action.definition, action.connection, { step: 'read', validationOperation: 'item.read',
      toolArguments: [], allowedEffects: ['reference.write'], requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 100);
    assert.throws(() => new OperationStore(join(dir, 'private')).issue(write), /without a remote write/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('submitted GitHub reference conformance validates the existing association read-only', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/reference-conformance-');
  try {
    const { action, item } = submittedReference();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const response = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
    assert.equal(response.state, 'complete');
    if (!('result' in response)) throw new Error('association result required');
    assert.deepEqual(response.result, { reference: 'PR1' });
    assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    assert.equal(store.get(action.operationId).attempts.length, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const fault of ['wrong PR', 'wrong repository', 'wrong issue', 'incomplete relationships'] as const) {
  test(`submitted association conformance refuses ${fault}`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/reference-mismatch-');
    try {
      const { action, item } = submittedReference();
      const observation = item.pullRequestObservation;
      if (fault === 'wrong PR') observation.pullRequest.id = 'OTHER';
      if (fault === 'wrong repository') observation.source.repository = 'OTHER';
      if (fault === 'wrong issue') observation.closingIssues.items[0].id = 'OTHER';
      if (fault === 'incomplete relationships') observation.closingIssues.complete = false;
      const store = new OperationStore(join(dir, 'private'));
      const issued = store.issue(action);
      assert.throws(() => store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101), /associated|associate|repository|incomplete/);
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
const merge = { reference: 'host/pr/1', merged: true, commit: 'merge-sha' };
test('unmerged reference cannot complete an item', () =>
  withAdapter(async ({ call }) => {
    const item = (await call('item.create', story, 'create')).item.identity;
    await call('claim.acquire', { item }, 'claim');
    await call('reference.write', { item, reference: merge.reference }, 'reference');
    await assert.rejects(
      call('completion.write', { item, merge: { ...merge, merged: false } }, 'done'),
      /unmerged/,
    );
    assert.equal((await call('item.read', { item })).item.metadata.Status, 'In Progress');
  }));
test('lost completion response is retried without duplicate effects', () =>
  withAdapter(async ({ call, state }) => {
    const item = (await call('item.create', story, 'create')).item.identity;
    await call('reference.write', { item, reference: merge.reference }, 'reference');
    await assert.rejects(
      call('completion.write', { item, merge }, 'done', { fault: 'error-unknown_outcome' }),
      /unknown_outcome/,
    );
    await call('completion.write', { item, merge }, 'done');
    await call('completion.write', { item, merge }, 'already-done');
    assert.equal((await call('item.read', { item })).item.metadata.Status, 'Done');
    assert.equal(
      Object.values(state().items).reduce(
        (sum, entry) => sum + (entry.completionEffects ?? 0),
        0,
      ),
      1,
    );
  }));
for (const evidence of [
  { merged: true, commit: 'x' },
  { ...merge, merged: 'no' },
  { ...merge, commit: 1 },
]) {
  test(`completion rejects malformed merge ${JSON.stringify(evidence)}`, () =>
    withAdapter(async ({ call }) => {
      const item = (await call('item.create', story, 'create')).item.identity;
      await assert.rejects(call('completion.write', { item, merge: evidence }, 'done'));
      assert.equal((await call('item.read', { item })).item.metadata.Status, 'Todo');
    }));
}
