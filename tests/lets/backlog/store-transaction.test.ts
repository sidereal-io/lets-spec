import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {Store} from '../../../lets/src/backlog/store.ts';
import {transaction, randomUUID} from '../../../lets/src/backlog/runtime-context.ts';
test('workflow replay keeps private writes in its transaction', async () => {
  mkdirSync('.workspace',{recursive:true}); const cwd=mkdtempSync(join(process.cwd(),'.workspace/transaction-'));
  try {
    execFileSync('git',['init','--quiet'],{cwd}); const store=new Store(cwd);
    const tx={root:store.root,records:{},seed:'seed',nextId:0};
    await transaction.run(tx, async()=>{new Store(cwd).write('session-test',{value:1});assert.deepEqual(new Store(cwd).read('session-test'),{value:1});});
    assert.equal(existsSync(join(store.root,'session-test.json')),false);
    assert.equal(transaction.run({...tx,nextId:0},randomUUID),transaction.run({...tx,nextId:0},randomUUID));
  } finally {rmSync(cwd,{recursive:true,force:true});}
});
test('scope lock excludes a concurrent process', async () => {
  mkdirSync('.workspace',{recursive:true}); const cwd=mkdtempSync(join(process.cwd(),'.workspace/lock-'));
  try {
    execFileSync('git',['init','--quiet'],{cwd}); const store=new Store(cwd);
    await store.lock('scope',async()=>{
      const script=`import {Store} from ${JSON.stringify(new URL('../../../lets/src/backlog/store.ts',import.meta.url).href)}; try { await new Store(${JSON.stringify(cwd)}).lock('scope',async()=>{}); process.exit(3); } catch(e) { if(e.category!=='conflict')throw e; }`;
      execFileSync(process.execPath,['--input-type=module','-e',script]);
    });
    await store.lock('scope',async()=>{});
  } finally {rmSync(cwd,{recursive:true,force:true});}
});
test('scope lock uses a kernel-released regular lock file', async () => {
  const {lstatSync} = await import('node:fs'); const {hash} = await import('../../../lets/src/backlog/store.ts');
  const cwd=mkdtempSync(join(process.cwd(),'.workspace/kernel-lock-'));
  try {execFileSync('git',['init','--quiet'],{cwd}); const store=new Store(cwd);
    await store.lock('scope',async()=>assert.equal(lstatSync(join(store.root,hash('scope')+'.lock')).isFile(),true));
  } finally {rmSync(cwd,{recursive:true,force:true});}
});
