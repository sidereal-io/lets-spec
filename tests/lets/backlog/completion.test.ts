import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAdapter, story } from './fixtures/adapter.ts';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
import { submittedReference, submittedCompletion, submissionFor } from './fixtures/submitted.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
test('explicit completion refuses an unmerged native PR despite supplied merge assertions', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/unmerged-submitted-completion-');
  try {
    const { action, item } = submittedCompletion();
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    assert.throws(() => store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101), /exact.*merge|unmerged/);
    assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    assert.equal(store.get(action.operationId).state, 'failed');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('exact submitted merge gates bounded completion followed by fresh verification', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/merged-submitted-completion-');
  try {
    const { action, item } = submittedCompletion();
    Object.assign(item.pullRequestObservation.pullRequest, { state: 'MERGED', isDraft: false, mergeCommit: 'merge-sha' });
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    let response = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
    assert.equal(response.state, 'action');
    if (response.state !== 'action') throw new Error('bounded completion required');
    assert.equal(response.action.step, 'complete');
    assert.deepEqual(response.action.allowedEffects, ['completion.write']);
    const completedItem = { ...item, metadata: { ...item.metadata, Status: 'Done' } };
    response = store.submit(response.continuation, submissionFor(response.action, { data: { item: completedItem } }), 102);
    if (response.state !== 'action') throw new Error('fresh verification required');
    assert.equal(response.action.step, 'verify');
    assert.deepEqual(response.action.allowedEffects, []);
    response = store.submit(response.continuation, submissionFor(response.action, { data: { item: completedItem } }), 103);
    assert.equal(response.state, 'complete');
    if (!('result' in response)) throw new Error('completion result required');
    assert.deepEqual(response.result, { status: 'Done' });
    assert.equal(store.get(action.operationId).pending, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('explicit completion cannot begin with a status write before merge validation', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/completion-first-read-');
  try {
    const { action } = submittedCompletion();
    const write = issueAction(action.request, action.definition, action.connection, { step: 'complete', validationOperation: 'item.read',
      toolArguments: [], allowedEffects: ['completion.write'], requiredCapabilities: [], timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000 }, 100);
    assert.throws(() => new OperationStore(join(dir, 'private')).issue(write), /fresh.*read/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('uncertain explicit completion reconciles without another status write', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/reconcile-submitted-completion-');
  try {
    const { action, item } = submittedCompletion();
    Object.assign(item.pullRequestObservation.pullRequest, { state: 'MERGED', isDraft: false, mergeCommit: 'merge-sha' });
    const store = new OperationStore(join(dir, 'private'));
    const issued = store.issue(action);
    const write = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
    if (write.state !== 'action') throw new Error('completion action required');
    const resumed = new OperationStore(join(dir, 'private')).resume(action.operationId, 200);
    assert.deepEqual(resumed.action.allowedEffects, []);
    const completedItem = { ...item, metadata: { ...item.metadata, Status: 'Done' } };
    const result = store.submit(resumed.continuation, submissionFor(resumed.action, { data: { item: completedItem } }), 201);
    assert.equal(result.state, 'complete');
    if (!('result' in result)) throw new Error('reconciliation result required');
    assert.equal(result.result.reconciliation, 'applied');
    assert.equal(result.result.reservationCleared, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('native Done with exact merge proof completes without another status write', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/native-completed-item-');
  try {
    const store = new OperationStore(join(dir, 'private'));
    for (let invocation = 0; invocation < 2; invocation++) {
      const { action, item } = submittedCompletion();
      item.metadata.Status = 'Done';
      Object.assign(item.pullRequestObservation.pullRequest, { state: 'MERGED', isDraft: false, mergeCommit: 'merge-sha' });
      const issued = store.issue(action);
      const submission = submissionFor(action, { data: { item } });
      const response = store.submit(issued.continuation, submission, 101);
      assert.equal(response.state, 'complete');
      if (!('result' in response)) throw new Error('completion result required');
      assert.deepEqual(response.result, { status: 'Done' });
      assert.equal(store.get(action.operationId).attempts.length, 1);
      assert.equal(store.get(action.operationId).pending, false);
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
      assert.deepEqual(store.submit(issued.continuation, submission, 102), response);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const fault of ['wrong merge commit', 'feature merge without closing relationship', 'already Done but unmerged'] as const) {
  test(`explicit completion refuses ${fault}`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/completion-proof-');
    try {
      const { action, item } = submittedCompletion();
      const pr = item.pullRequestObservation.pullRequest;
      Object.assign(pr, { state: 'MERGED', isDraft: false, mergeCommit: 'merge-sha' });
      if (fault === 'wrong merge commit') Object.assign(pr, { mergeCommit: 'OTHER' });
      if (fault === 'feature merge without closing relationship') {
        pr.baseRef = 'another-feature'; item.pullRequestObservation.closingIssues.items = [];
      }
      if (fault === 'already Done but unmerged') { item.metadata.Status = 'Done'; pr.state = 'OPEN'; pr.mergeCommit = null; }
      const store = new OperationStore(join(dir, 'private'));
      const issued = store.issue(action);
      assert.throws(() => store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101), /exact|associate/);
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
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
