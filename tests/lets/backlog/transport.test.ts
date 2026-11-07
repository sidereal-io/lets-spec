import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { invoke } from '../../../lets/src/backlog/transport.ts';
const request = { protocol: 1, operation: 'backlog.check', context: { cwd: process.cwd(), provider: 'github', backlog: 'b', repository: 'r', actor: 'a', session: 's' }, input: {} };
async function adapter(source: string, run: (path: string) => Promise<void>) {
  await mkdir(join(process.cwd(), '.workspace'), { recursive: true });
  const dir = await mkdtemp(join(process.cwd(), '.workspace/transport-'));
  try {
    const path = join(dir, 'adapter');
    await writeFile(path, `#!${process.execPath}\n${source}`);
    await chmod(path, 0o700);
    await run(path);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
test('returns a validated response from stdin request', () => adapter(`let s=''; for await (const c of process.stdin) s+=c; const r=JSON.parse(s); console.log(JSON.stringify({protocol:r.protocol,ok:true,result:{valid:process.argv.length===2,gaps:[]}}));`, async path => {
  assert.deepEqual(await invoke(path, request), { protocol: 1, ok: true, result: { valid: true, gaps: [] } });
}));
for (const category of ['permission', 'authentication', 'conflict']) {
  test(`preserves structured ${category} failure`, () => adapter(`console.log(JSON.stringify({protocol:1,ok:false,error:{category:'${category}',effects:'partial',message:'denied'}})); process.exitCode=1;`, async path => {
    await assert.rejects(invoke(path, request), (error: any) => error.category === category && error.effects === 'partial');
  }));
}
for (const source of [`console.error('credential-looking diagnostic'); console.log('bad JSON');`, `process.kill(process.pid,'SIGKILL');`, `console.log(JSON.stringify({protocol:1,ok:true,result:{valid:true,gaps:[]}})); process.exitCode=1;`]) {
  test(`rejects invalid response ${source.slice(0, 30)}`, () => adapter(source, async path => {
    await assert.rejects(invoke(path, request), (error: any) => error.category === 'unknown_outcome' && error.effects === 'unknown' && !error.message.includes('credential-looking'));
  }));
}
test('mutation timeout preserves uncertainty', () => adapter(`setInterval(()=>{},1000);`, async path => {
  await assert.rejects(invoke(path, { ...request, operation: 'claim.acquire', mutationId: 'm', input: { item: { provider: 'github', backlog: 'b', id: 'i' } } }, { timeoutMs: 100 }), (error: any) => error.effects === 'unknown');
}));
test('combined output is bounded', () => adapter(`process.stderr.write('x'.repeat(600)); console.log('x'.repeat(600));`, async path => {
  await assert.rejects(invoke(path, request, { maxBytes: 1000 }), /output limit/);
}));
test('unavailable executable proves no effects', async () => {
  await assert.rejects(invoke('/nonexistent/adapter', request), (error: any) => error.category === 'invalid_configuration' && error.effects === 'none');
});
test('response cannot substitute an item from another backlog', () => adapter(`console.log(JSON.stringify({protocol:1,ok:true,result:{item:{identity:{provider:'github',backlog:'other',id:'i'},reference:'#1',title:'foreign',body:'',owners:[],metadata:{Kind:'Story',Priority:'Must',Size:'S',Status:'Todo'}}}}));`, async path => {
  await assert.rejects(invoke(path, { ...request, operation: 'item.read', input: { item: { provider: 'github', backlog: 'b', id: 'i' } } }), /invalid adapter response/);
}));
test('read timeout reports no mutation effects', () => adapter(`setInterval(()=>{},1000);`, async path => {
  await assert.rejects(invoke(path, request, { timeoutMs: 100 }), (error: any) => error.category === 'transient' && error.effects === 'none');
}));
for (const timeoutMs of [0, Infinity, 3_000_000_000]) {
  test(`invalid production deadline ${timeoutMs} fails before invocation`, async () => {
    await assert.rejects(invoke('/nonexistent/adapter', request, { timeoutMs }), (error: any) => error.category === 'invalid_request' && error.effects === 'none');
  });
}
