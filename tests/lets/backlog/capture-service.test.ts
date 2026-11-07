import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sealAction } from '../../../lets/src/backlog/action-contract.ts';
import { startCaptureService } from '../../../lets/src/backlog/capture-service.ts';
import { CaptureClient } from '../../../lets/src/backlog/capture-client.ts';

async function fixture(t: test.TestContext, program?: string, credentialDelay = 0) {
  const directory = await mkdtemp(resolve('.workspace/capture-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const tool = { id: 'fixture', executable: process.execPath, argv: ['-e', program ?? 'process.stdin.resume(); process.stdin.on("end",()=>process.stdout.write("{}"))'], digest: 'a'.repeat(64), authentication: 'fixture' };
  const config = { socket: resolve(directory, 'socket'), stateDirectory: directory, serviceUid: process.getuid!(), tools: { fixture: { ...tool, classifier: 'graphql' as const, credentialsFile: resolve(directory, 'credentials') } } };
  const service = await startCaptureService(config, { verifyPaths: async () => {}, credentials: async () => { if (credentialDelay) await new Promise(resolve=>setTimeout(resolve,credentialDelay)); return {}; } });
  t.after(() => service.close());
  const client = new CaptureClient({socket:config.socket,serviceUid:config.serviceUid,tools:{fixture:tool}}, { verifySocket: async () => {} });
  const now = Date.now();
  const action = sealAction({version: 1, id: 'action-1', workflow: 'workflow', sequence: 0, name: 'fixture', scope: { provider: 'fixture', repository: 'owner/repo', actor: 'actor', session: 'session' }, tool, stdin: { query: '{ viewer { login } }' }, mode: 'read', issuedAt: now, expiresAt: now + 30000, timeoutMs: 10000, maxBytes: 10000 });
  return { directory, config, service, client, action };
}

test('runner returns original capture for an executed action', async t => {
  const { client, action } = await fixture(t);
  const { reference } = await client.execute(action);
  const capture = await client.read(reference, action);
  assert.equal(capture.stdout, '{}');
  assert.equal(capture.dispatched, true);
});

test('duplicate execution returns immutable original receipt', async t => {
  const { client, action, directory } = await fixture(t);
  const first = await client.execute(action);
  const before = await readFile(resolve(directory, `${action.id}.capture.json`), 'utf8');
  assert.deepEqual(await client.execute(action), first);
  assert.equal(await readFile(resolve(directory, `${action.id}.capture.json`), 'utf8'), before);
});

test('changed action cannot reuse a reserved ID', async t => {
  const { client, action } = await fixture(t);
  await client.execute(action);
  const {digest: _, ...body} = action;
  await assert.rejects(client.execute(sealAction({...body, stdin:{query:'{ repository { id } }'}})));
});

for (const query of [
  '# query\nmutation { removeThing }',
  'query { viewer { login } } mutation { removeThing }',
  'query One { viewer { login } } query Two { viewer { login } }',
  'subscription { events }',
  'query { field(arg: "mutation { benign string }") } mutation { removeThing }',
  'not a GraphQL document',
]) test(`read permission rejects document ${JSON.stringify(query)}`, async t => {
  const {client, action} = await fixture(t);
  const {digest: _, ...body} = action;
  await assert.rejects(client.execute(sealAction({...body, stdin:{query}})));
});

for (const field of ['operationName','hostname','jq']) test(`GraphQL input rejects extra field ${field}`, async t => {
  const {client, action} = await fixture(t);
  const {digest: _, ...body} = action;
  await assert.rejects(client.execute(sealAction({...body, stdin:{...body.stdin,[field]:'override'}})));
});

test('GraphQL parser accepts fragments before a read operation', async t => {
  const {client, action} = await fixture(t);
  const {digest: _, ...body} = action;
  const read = sealAction({...body,stdin:{query:'fragment Person on User { login } query { viewer { ...Person } }'}});
  assert.equal((await client.read((await client.execute(read)).reference, read)).state,'complete');
});

test('write permission rejects a query', async t => {
  const {client, action} = await fixture(t);
  const {digest: _, ...body} = action;
  await assert.rejects(client.execute(sealAction({...body,mode:'write'})));
});

test('crash reservation never redispatches on service restart', async t => {
  const {client, config, action, directory, service} = await fixture(t);
  const now = Date.now();
  const capture = {version:1,id:action.id,actionId:action.id,actionDigest:action.digest,tool:action.tool,stdin:action.stdin,startedAt:now,finishedAt:now,dispatched:true,state:'unknown',exitCode:null,signal:null,stdout:'',stderr:'',bytes:0};
  const { canonical } = await import('../../../lets/src/backlog/action-contract.ts');
  await writeFile(resolve(directory, `${action.id}.reservation.json`), JSON.stringify({actionDigest:action.digest,request:canonical(action),capture}));
  await service.close();
  const restarted = await startCaptureService(config, {verifyPaths:async()=>{},credentials:async()=>({})});
  t.after(()=>restarted.close());
  assert.deepEqual(await client.execute(action), {reference:action.id});
  await assert.rejects(client.read(action.id,action));
  await assert.rejects(readFile(resolve(directory, `${action.id}.capture.json`)), {code:'ENOENT'});
});

test('execution timeout retains unknown effects', async t => {
  const {client, action} = await fixture(t, 'setTimeout(()=>process.stdout.write("late"),10000)');
  const {digest: _, ...body} = action;
  const bounded = sealAction({...body,timeoutMs:50});
  const result = await client.execute(bounded);
  await assert.rejects(client.read(result.reference,bounded), (error: any) => error.effects === 'unknown');
});

test('combined output overflow retains unknown effects', async t => {
  const {client, action} = await fixture(t, 'process.stdout.write("123456"); process.stderr.write("789012")');
  const {digest: _, ...body} = action;
  const bounded = sealAction({...body,maxBytes:10});
  const result = await client.execute(bounded);
  await assert.rejects(client.read(result.reference,bounded), (error: any) => error.effects === 'unknown');
});

test('runner clears inherited environment', async t => {
  const {client, action} = await fixture(t, 'process.stdin.resume(); process.stdin.on("end",()=>process.stdout.write(JSON.stringify(process.env)))');
  assert.equal((await client.read((await client.execute(action)).reference,action)).stdout,'{}');
});

test('simultaneous duplicate requests dispatch only once', async t => {
  const { directory } = await fixture(t);
  const counter = resolve(directory,'counter');
  const {client,action} = await fixture(t, `require('node:fs').appendFileSync(${JSON.stringify(counter)},'dispatch\\n'); process.stdin.resume(); process.stdin.on('end',()=>process.stdout.write('{}'))`);
  const references = await Promise.all([client.execute(action),client.execute(action),client.execute(action)]);
  assert.ok(references.every(reference=>reference.reference===action.id));
  assert.equal(await readFile(counter,'utf8'),'dispatch\n');
});

test('expiry during prerequisite validation prevents dispatch', async t => {
  const {directory} = await fixture(t);
  const counter=resolve(directory,'expired-counter');
  const {client,action,directory:runnerDirectory}=await fixture(t,`require('node:fs').writeFileSync(${JSON.stringify(counter)},'dispatched')`,100);
  const {digest:_,...body}=action;
  const now=Date.now();
  const expiring=sealAction({...body,issuedAt:now,expiresAt:now+40,timeoutMs:40});
  await client.execute(expiring).catch(()=>{});
  await assert.rejects(readFile(counter),{code:'ENOENT'});
  try { assert.equal(JSON.parse(await readFile(resolve(runnerDirectory, `${action.id}.capture.json`),'utf8')).dispatched,false); } catch(error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
});

test('GraphQL documents have a token budget',async t=>{
  const {client,action}=await fixture(t);
  const {digest:_,...body}=action;
  await assert.rejects(client.execute(sealAction({...body,stdin:{query:`{ ${'field '.repeat(10001)} }`}})));
});
