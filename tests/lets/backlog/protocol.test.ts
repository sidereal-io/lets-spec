import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest, validateResponse } from '../../../lets/src/backlog/protocol.ts';
const context = {
  cwd: '/repo',
  provider: 'github',
  backlog: 'project',
  repository: 'owner/repo',
  actor: 'user',
  session: 'session',
};
test('request requires supported protocol', () => {
  assert.throws(
    () => validateRequest({ protocol: 99, operation: 'item.read', context, input: {} }),
    /protocol/,
  );
});
test('request rejects unknown operation', () => {
  assert.throws(
    () => validateRequest({ protocol: 1, operation: 'invented', context, input: {} }),
    /operation/,
  );
});
for (const field of ['cwd', 'provider', 'backlog', 'repository', 'actor', 'session']) {
  test(`request requires context ${field}`, () => {
    assert.throws(
      () =>
        validateRequest({
          protocol: 1,
          operation: 'item.read',
          context: { ...context, [field]: '' },
          input: {},
        }),
      new RegExp(field),
    );
  });
}
test('read request requires scoped identity', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'item.read',
        context,
        input: { item: { id: '1' } },
      }),
    /provider/,
  );
});
test('read request accepts URL-free scoped identity', () => {
  assert.doesNotThrow(() =>
    validateRequest({
      protocol: 1,
      operation: 'item.read',
      context,
      input: { item: { provider: 'beads', backlog: 'local', id: 'opaque' } },
    }),
  );
});
test('response requires matching protocol', async () => {
  const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
  assert.throws(() => validateResponse({ protocol: 2, ok: true, result: {} }, 0), /protocol/);
});
for (const [ok, exit] of [
  [true, 1],
  [false, 0],
  ['yes', 0],
] as const) {
  test(`response rejects inconsistent result ${ok}/${exit}`, async () => {
    const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
    assert.throws(() => validateResponse({ protocol: 1, ok, result: {} }, exit), /result/);
  });
}
test('mutation request requires reconciliation key', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'item.create',
        context,
        input: { title: 'Story', body: '' },
      }),
    /mutationId/,
  );
});
test('request checks operation input definition', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'relationship.write',
        mutationId: 'm',
        context,
        input: {},
      }),
    /input/,
  );
});
for (const response of [
  { protocol: 1, ok: true },
  { protocol: 1, ok: false, error: { category: 'oops' } },
  { protocol: 1, ok: false, error: { category: 'unknown_outcome', message: 'lost' } },
]) {
  test(`response validates envelope ${JSON.stringify(response)}`, async () => {
    const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
    assert.throws(() => validateResponse(response, response.ok ? 0 : 1));
  });
}
test('enumeration response requires explicit completeness', async () => {
  const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
  assert.throws(
    () =>
      validateResponse({ protocol: 1, ok: true, result: { items: [] } }, 0, 'candidate.list'),
    /complete/,
  );
});
test('read response validates normalized item fields', async () => {
  const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
  assert.throws(
    () => validateResponse({ protocol: 1, ok: true, result: { item: {} } }, 0, 'item.read'),
    /item/,
  );
});
const identity = { provider: 'github', backlog: 'project', id: 'opaque' };
test('shared update rejects provider field escape hatch', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'item.update',
        context,
        mutationId: 'key',
        input: { item: identity, patch: { customField: 1 } },
      }),
    /patch/,
  );
});
test('metadata update rejects unrecognized shared meaning', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'item.update',
        context,
        mutationId: 'key',
        input: { item: identity, patch: { metadata: { Priority: 'Urgent' } } },
      }),
    /metadata/,
  );
});
for (const status of ['Done', 'In Progress', 'Todo']) {
  test(`generic update cannot set Status ${status}`, () => {
    assert.throws(
      () =>
        validateRequest({
          protocol: 1,
          operation: 'item.update',
          context,
          mutationId: 'm',
          input: { item: identity, patch: { metadata: { Status: status } } },
        }),
      /Status.*claim/,
    );
  });
}
for (const status of ['Done', 'In Progress']) {
  test(`create cannot start at Status ${status}`, () => {
    assert.throws(
      () =>
        validateRequest({
          protocol: 1,
          operation: 'item.create',
          context,
          mutationId: 'm',
          input: {
            title: 'x',
            body: '',
            metadata: { Kind: 'Story', Priority: 'Must', Size: 'S', Status: status },
          },
        }),
      /Todo/,
    );
  });
}
test('completion request requires associated reference', () => {
  assert.throws(
    () =>
      validateRequest({
        protocol: 1,
        operation: 'completion.write',
        context,
        mutationId: 'm',
        input: { item: identity, merge: { merged: true, commit: 'x' } },
      }),
    /reference/,
  );
});
for (const [operation, result] of [
  ['mutation.read', { state: 'done' }],
  ['mutation.read', { state: 'applied' }],
  [
    'relationship.list',
    { items: [{ identity: {}, status: 'Todo' }], complete: true, nextCursor: null },
  ],
  [
    'relationship.list',
    { items: [{ identity, status: 'open' }], complete: true, nextCursor: null },
  ],
  ['backlog.list', { items: [{}], complete: true, nextCursor: null }],
  ['claim.read', { claim: {} }],
  [
    'claim.read',
    {
      claim: {
        actor: null,
        session: null,
        token: null,
        status: 'unknown',
        guarantee: 'exclusive',
      },
    },
  ],
  ['capability.read', { capabilities: { claims: { support: 'native', limits: '' } } }],
] as const) {
  test(`response rejects malformed ${operation}: ${JSON.stringify(result)}`, async () => {
    const { validateResponse } = await import('../../../lets/src/backlog/protocol.ts');
    assert.throws(() => validateResponse({ protocol: 1, ok: true, result }, 0, operation));
  });
}
for (const operation of ['backlog.list', 'backlog.create']) {
  test(`${operation} accepts context before backlog selection`, () => {
    const { backlog, ...unselected } = context;
    assert.doesNotThrow(() =>
      validateRequest({
        protocol: 1,
        operation,
        context: unselected,
        input: operation === 'backlog.create' ? { title: 'New backlog' } : {},
        ...(operation === 'backlog.create' ? { mutationId: 'create-backlog' } : {}),
      }),
    );
  });
}
for (const [operation, input] of [
  ['claim.read', { item: identity }],
  ['candidate.list', {}],
  ['relationship.list', { item: identity, kind: 'blocked_by' }],
]) {
  test(`${operation} rejects a mutation key`, () => {
    assert.throws(
      () =>
        validateRequest({ protocol: 1, operation, input, context, mutationId: 'read-key' }),
      /mutationId.*read/,
    );
  });
}

import { realIo } from '../../../lets/src/io.ts';
import { fileURLToPath } from 'node:url';
for (const [input, category] of [
  ['{', 'invalid_request'],
  [JSON.stringify({ protocol: 99 }), 'unsupported'],
  [JSON.stringify({ protocol: 1, operation: 'invented' }), 'invalid_request'],
] as const) {
  test(`fake classifies raw request ${input}`, async () => {
    const result = await realIo().execFile(
      process.execPath,
      [fileURLToPath(new URL('../../../lets/src/backlog/fake.ts', import.meta.url))],
      { input, timeoutMs: 5000 },
    );
    assert.equal(result.code, 1);
    const response = JSON.parse(result.stdout);
    assert.equal(response.error.category, category);
    assert.equal(response.error.effects, 'none');
  });
}

import { deriveResult } from '../../../lets/src/backlog/projections.ts';
test('optional normalized fields cannot contradict structured output', () => {
  assert.throws(() => deriveResult('claim.read',
    { op: 'path', path: ['data', 'ownership'] },
    { data: { ownership: { claim: { actor: 'other', session: null, token: null, status: 'In Progress', guarantee: 'best-effort' } } } },
    {}, { claim: { actor: 'me', session: null, token: null, status: 'In Progress', guarantee: 'best-effort' } }),
  /normalized.*disagrees/);
});

import { validateSubmission } from '../../../lets/src/backlog/submissions.ts';
import { submittedRead } from './fixtures/submitted.ts';
test('matching tool output qualifies without a capture receipt', () => {
  const { action, submission, projection } = submittedRead();
  assert.deepEqual(validateSubmission(action, submission, projection, 200), { valid: true, gaps: [] });
});

for (const [field, replacement] of [
  ['operationId', 'another-operation'], ['actionId', 'another-action'], ['attemptId', 'another-attempt'],
  ['inputDigest', 'another-input'], ['definitionDigest', 'another-definition'], ['connectionDigest', 'another-connection'],
  ['context', { cwd: '/repo', provider: 'github', repository: 'OTHER', backlog: 'P1', actor: 'me', session: 'worker' }],
  ['tool', { kind: 'cli', name: 'gh', arguments: ['api', 'other'] }],
] as const) {
  test(`submission cannot replace issued ${field}`, () => {
    const { action, submission, projection } = submittedRead();
    assert.throws(() => validateSubmission(action, { ...submission, [field]: replacement }, projection, 200),
      /invalid_request.*binding/);
  });
}

import { parseActionRequest } from '../../../lets/src/backlog/actions.ts';
for (const [name, input, category] of [
  ['malformed JSON', '{', 'invalid_request'],
  ['unsupported contract', JSON.stringify({ contractVersion: 99 }), 'unsupported'],
  ['unknown operation', JSON.stringify({ contractVersion: 1, operation: 'invented', context, input: {} }), 'invalid_request'],
  ['unknown input', JSON.stringify({ contractVersion: 1, operation: 'backlog.check', context, input: { bypass: true } }), 'invalid_request'],
] as const) {
  test(`action request rejects ${name} with a typed error`, () => {
    assert.throws(() => parseActionRequest(input),
      (error: unknown) => error instanceof Error && 'category' in error && error.category === category);
  });
}
test('submission rejects an unsupported contract without inferring no effects', () => {
  const { action, submission, projection } = submittedRead();
  assert.throws(() => validateSubmission(action, { ...submission, contractVersion: 99 }, projection, 200),
    (error: unknown) => error instanceof Error && 'category' in error && error.category === 'unsupported' && 'effects' in error && error.effects === 'unknown');
});

import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
test('output file supplies the structured result without transcription', () => {
  mkdirSync('.workspace', { recursive: true });
  const dir = mkdtempSync('.workspace/submitted-');
  try {
    const { action, submission, projection } = submittedRead();
    const path = join(dir, 'output.json');
    writeFileSync(path, JSON.stringify(submission.output));
    const { output, ...envelope } = submission;
    assert.deepEqual(validateSubmission(action, { ...envelope, outputFiles: [path] }, projection, 200), { valid: true, gaps: [] });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
for (const [name, path, contents] of [
  ['oversized', 'large.json', 'x'.repeat(5000)],
  ['missing', 'missing.json', null],
  ['malformed', 'bad.json', '{'],
] as const) {
  test(`submitted output file rejects ${name} bytes`, () => {
    mkdirSync('.workspace', { recursive: true });
    const dir = mkdtempSync('.workspace/submitted-');
    try {
      const { action, submission, projection } = submittedRead();
      const file = join(dir, path);
      if (contents !== null) writeFileSync(file, contents);
      const { output, ...envelope } = submission;
      assert.throws(() => validateSubmission(action, { ...envelope, outputFiles: [file] }, projection, 200),
        (error: unknown) => error instanceof Error && 'effects' in error && error.effects === 'unknown');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('timely receipt accepts an unreported optional server version', () => {
  const { action, submission, projection } = submittedRead();
  assert.deepEqual(validateSubmission(action, { ...submission, observed: { serverVersion: 'unreported' } }, projection, 200),
    { valid: true, gaps: [] });
});
test('optional tool time cannot rescue a late receipt', () => {
  const { action, submission, projection } = submittedRead();
  assert.throws(() => validateSubmission(action, { ...submission, observed: { finishedAt: 200 } }, projection, 6000),
    /acceptance window/);
});

const repositoryContext = { cwd: '/repo', provider: 'github', repository: 'R1', actor: 'me', session: 'worker' };
test('repository request needs no Project selection', () => {
  assert.equal(parseActionRequest(JSON.stringify({ contractVersion: 1, operation: 'repository.read', context: repositoryContext, input: {} })).operation,
    'repository.read');
});
test('branch PR read is a repository-scoped operation', () => {
  assert.equal(parseActionRequest(JSON.stringify({ contractVersion: 1, operation: 'pull-request.read', context: repositoryContext, input: { branch: 'feature' } })).operation,
    'pull-request.read');
});
test('PR read cannot select both branch and immutable PR', () => {
  assert.throws(() => parseActionRequest(JSON.stringify({ contractVersion: 1, operation: 'pull-request.read', context: repositoryContext,
    input: { branch: 'feature', pullRequest: 'PR1' } })), /exactly one/);
});
test('PR create validates the prepared body input', () => {
  assert.equal(parseActionRequest(JSON.stringify({ contractVersion: 1, operation: 'pull-request.create', context: repositoryContext,
    input: { title: 'Draft', bodyFile: '/repo/.workspace/body.md', base: 'main', head: 'feature', headRepository: 'R1' } })).operation,
    'pull-request.create');
});
test('repository result requires immutable identity', () => {
  assert.throws(() => validateResponse({ protocol: 1, ok: true, result: { repository: { name: 'repo' } } }, 0, 'repository.read'), /repository.id/);
});

const prResult = { id: 'PR1', repository: 'R1', headRepository: 'R1', number: 1,
  url: 'https://github.com/fixture/repo/pull/1', state: 'OPEN', isDraft: true, body: 'Closes #1',
  createdAt: '2026-11-08T12:00:00Z', baseRef: 'main', headRef: 'feature', baseSha: null,
  headSha: null, mergeCommit: null, mergeRef: null };
for (const [name, input, observed] of [
  ['repository', { branch: 'feature' }, { ...prResult, repository: 'OTHER' }],
  ['immutable PR', { pullRequest: 'PR1' }, { ...prResult, id: 'PR2' }],
  ['head branch', { branch: 'feature' }, { ...prResult, headRef: 'other' }],
] as const) {
  test(`PR submission cannot replace scoped ${name}`, () => {
    const { action, submission, projection } = submittedRead();
    const prAction = { ...action, request: { contractVersion: 1 as const, operation: 'pull-request.read' as const,
      context: repositoryContext, input } };
    assert.throws(() => validateSubmission(prAction,
      { ...submission, context: repositoryContext, output: { data: { pullRequest: observed } } }, projection, 200), /scope/);
  });
}
