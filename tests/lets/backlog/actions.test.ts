import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sealAction, validateAction, verifyCapture } from '../../../lets/src/backlog/action-contract.ts';
import type { Capture } from '../../../lets/src/backlog/action-contract.ts';
const tool = { id: 'github-graphql', digest: 'a'.repeat(64), authentication: 'fixture-login', executable: '/protected/gh', argv: ['api', 'graphql', '--input', '-'] };
const action = () => sealAction({ version: 1, id: 'action-1', workflow: 'workflow-1', sequence: 0, name: 'Actor', scope: { provider: 'github', repository: 'owner/repo', actor: 'me', session: 'original' }, tool, stdin: { query: '{viewer{login}}', variables: {} }, mode: 'read', issuedAt: 1000, expiresAt: 5000, timeoutMs: 3000, maxBytes: 1000 });
const capture = (): Capture => ({ version: 1, id: 'receipt-1', actionId: 'action-1', actionDigest: action().digest, tool, stdin: action().stdin, startedAt: 1200, finishedAt: 1300, dispatched: true, state: 'complete', exitCode: 0, signal: null, stdout: '{"data":{"viewer":{"login":"me"}}}', stderr: '', bytes: 34 });
test('matching independently retrieved capture can establish the returned observation', () => {
  const a = action(); validateAction(a, 2000);
  const record = capture(); record.bytes = Buffer.byteLength(record.stdout);
  assert.equal(verifyCapture(a, record, 'receipt-1', 2000).stdout, '{"data":{"viewer":{"login":"me"}}}');
});
for (const [name, patch] of Object.entries({
  'another action': { actionId: 'other' },
  'another attempt': { actionDigest: 'b'.repeat(64) },
  'another receipt': { id: 'other' },
  'agent-selected tool': { tool: { ...tool, executable: '/workspace/echo' } },
  'changed authentication': { tool: { ...tool, authentication: 'another-login' } },
  'different arguments': { tool: { ...tool, argv: ['auth', 'token'] } },
  'substituted request': { stdin: { query: 'mutation { deleteIssue }' } },
  'stale collection': { startedAt: 999 },
  'future collection': { finishedAt: 3000 },
  'late collection': { finishedAt: 6000 },
  'noncaptured dispatch': { dispatched: false },
  'missing original capture': { state: 'unknown' },
  'reported result body': { result: { claim: 'owned' } },
})) {
  test(`capture cannot authorize progression with ${name}`, () => {
    const original = capture(); original.bytes = Buffer.byteLength(original.stdout);
    assert.throws(() => verifyCapture(action(), { ...original, ...patch }, 'receipt-1', 2000), (error: any) => error.category === 'unknown_outcome' && error.effects === 'unknown');
  });
}
for (const [name, patch] of Object.entries({
  'overflow': { bytes: 1001, stdout: 'x'.repeat(1001) },
  'truncated output': { bytes: 1 },
  'failed process': { exitCode: 1 },
  'signal termination': { signal: 'SIGKILL' },
})) {
  test(`capture cannot authorize progression after ${name}`, () => {
    const c = capture(); c.bytes = Buffer.byteLength(c.stdout);
    assert.throws(() => verifyCapture(action(), { ...c, ...patch }, 'receipt-1', 2000), (e: any) => e.category === 'unknown_outcome' && e.effects === 'unknown');
  });
}
test('late submission cannot reactivate the expired action', () => {
  const c = capture(); c.bytes = Buffer.byteLength(c.stdout);
  assert.throws(() => verifyCapture(action(), c, c.id, 6000), (e: any) => e.effects === 'unknown');
});
test('protected pre-dispatch rejection establishes no effects', () => {
  const c = { ...capture(), state: 'rejected', dispatched: false, exitCode: null, stdout: '', bytes: 0 };
  assert.throws(() => verifyCapture(action(), c, c.id, 2000), (e: any) => e.category === 'invalid_configuration' && e.effects === 'none');
});
for (const patch of [{ timeoutMs: 3_000_000_000 }, { maxBytes: 0 }, { scope: { actor: 'me' } }, { version: 2 }, { arbitrary: true }]) {
  test(`invalid action cannot be issued: ${JSON.stringify(patch)}`, () => {
    const a: any = { ...action(), ...patch }; const { digest: _, ...body } = a;
    assert.throws(() => validateAction(sealAction(body), 2000), (e: any) => e.category === 'invalid_request' && e.effects === 'none');
  });
}
test('protected rejection after expiry still proves non-dispatch',()=>{
  const c={...capture(),state:'rejected',dispatched:false,exitCode:null,stdout:'',bytes:0,startedAt:6000,finishedAt:6000};
  assert.throws(()=>verifyCapture(action(),c,c.id,7000),(e:any)=>e.effects==='none');
});
