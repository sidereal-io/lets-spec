import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('inventory table contains the required responsibility mappings', () => {
  const document = readFileSync(
    new URL('../../../docs/backlog-adapter-contract.md', import.meta.url),
    'utf8',
  );
  for (const behavior of [
    'Project discovery',
    'Project creation',
    'Field validation',
    'Item search',
    'Item creation',
    'Targeted update',
    'Parent-child links',
    'Directional blockers',
    'Packet validation',
    'Schema routing',
    'Ready-work ranking',
    'Claim',
    'Release',
    'Pull request references',
    'Completion',
    'Glossary handoff',
  ]) {
    assert.match(
      document,
      new RegExp(`\\| ${behavior} \\| (shared policy|adapter|code host) \\| [^|]+\\|`),
      behavior,
    );
  }
});

test('provider inventory keeps non-GitHub PR production routing pending', () => {
  const document = readFileSync(new URL('../../../docs/backlog-adapter-contract.md', import.meta.url), 'utf8');
  for (const provider of ['GitHub', 'Jira', 'Linear', 'Beads']) assert.ok(document.includes(provider));
  assert.match(document, /pull-request\.\*.*outside.*non-GitHub production profiles/);
  assert.match(document, /routing decision.*pending/);
});

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { PROVIDERS, profile } from '../../../lets/src/backlog/profiles.ts';
import { submittedReference, submissionFor } from './fixtures/submitted.ts';
import { issueAction } from '../../../lets/src/backlog/actions.ts';
import { loadDefinition } from '../../../lets/src/backlog/definitions.ts';
import { OperationStore } from '../../../lets/src/backlog/operation-store.ts';
for (const provider of PROVIDERS) {
  test(`${provider} inventory retains attributed code-host reference conformance`, () => {
    assert.equal(profile(provider).capabilities.claims.guarantee, 'best-effort');
    const base = submittedReference();
    const identity = { ...base.item.identity, provider };
    const definition = loadDefinition([{ source: `fixture:${provider}`, value: {
      ...base.action.definition.definition, backend: { name: provider, versions: ['fixture'] },
    } }]);
    const action = issueAction({ ...base.action.request, context: { ...base.action.request.context, provider },
      input: { item: identity, reference: 'PR1' } }, definition, base.action.connection, {
      step: 'read', validationOperation: 'item.read', toolArguments: [], allowedEffects: [], requiredCapabilities: [],
      timeoutMs: 1000, maxOutputBytes: 65536, acceptanceMs: 5000,
    }, 100);
    const item = { ...base.item, identity, pullRequestObservation: { ...base.item.pullRequestObservation,
      closingIssues: { items: [identity], complete: true, nextCursor: null } } };
    assert.equal(item.pullRequestObservation.source.provider, 'github');
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/provider-reference-');
    try {
      const store = new OperationStore(join(dir, 'private'));
      const issued = store.issue(action);
      const response = store.submit(issued.continuation, submissionFor(action, { data: { item } }), 101);
      assert.equal(response.state, 'complete');
      if (!('result' in response)) throw new Error('validated reference required');
      assert.deepEqual(response.result, { reference: 'PR1' });
      assert.deepEqual(store.get(action.operationId).action.allowedEffects, []);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

import { submittedCompletion } from './fixtures/submitted.ts';
import { validateExactMerge } from '../../../lets/src/backlog/completion-actions.ts';
for (const provider of PROVIDERS) {
  test(`${provider} inventory retains attributed exact-merge completion proof`, () => {
    const { action, item } = submittedCompletion();
    const identity = { ...item.identity, provider };
    const scoped = { ...action, request: { ...action.request, context: { ...action.request.context, provider },
      input: { ...(action.request.input as Record<string, unknown>), item: identity } } };
    const observation = { ...item, identity, pullRequestObservation: { ...item.pullRequestObservation,
      closingIssues: { items: [identity], complete: true, nextCursor: null },
      pullRequest: { ...item.pullRequestObservation.pullRequest, state: 'MERGED', mergeCommit: 'merge-sha' } } };
    assert.equal(observation.pullRequestObservation.source.provider, 'github');
    assert.doesNotThrow(() => validateExactMerge(scoped, { item: observation }));
    observation.pullRequestObservation.pullRequest.mergeCommit = 'unrelated-merge';
    assert.throws(() => validateExactMerge(scoped, { item: observation }), /exact.*merge/);
  });
}
