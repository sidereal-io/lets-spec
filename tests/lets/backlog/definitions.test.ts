import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDefinition, render } from '../../../lets/src/backlog/definitions.ts';
test('shipped definition renders an inert action from scoped inputs', () => {
  const { definition } = loadDefinition({ name: 'github', version: 1 }, 'github', process.cwd());
  const input = { owner: 'owner', name: 'repo' };
  assert.deepEqual(render(definition.facts.Actor.stdin, null, input).variables, input);
});
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const base = () => structuredClone(loadDefinition({name:'github',version:1}, 'github', process.cwd()).definition);
function custom(definition: unknown, run: (path: string) => void) {
  const dir = mkdtempSync(join(process.cwd(), '.workspace/definition-'));
  try { const path = join(dir, 'definition.json'); writeFileSync(path, JSON.stringify(definition)); run(path); }
  finally { rmSync(dir, {recursive:true,force:true}); }
}
for (const [label, edit] of [
  ['policy keys', (d:any) => { d.policy = {claim:true}; }],
  ['missing facts', (d:any) => { delete d.facts.Actor; }],
  ['write disguised as read', (d:any) => { d.facts.Assign.mode = 'read'; }],
  ['fabricated result leaves', (d:any) => { d.facts.Actor.result = {viewer:{login:'me'}}; }],
  ['executable expressions', (d:any) => { d.facts.Actor.stdin = {$eval:'process.env'}; }],
  ['unknown tool selectors', (d:any) => { d.facts.Actor.tool = '../shell'; }],
] as const) test(`definition rejects ${label}`, () => {
  const definition = base(); edit(definition);
  custom(definition, source => assert.throws(() => loadDefinition({name:'github',version:1,source}, 'github', process.cwd()), /invalid|unsupported|definition|template|fact|tool/i));
});
test('definition renders bounded capture-derived arrays', () => {
  assert.deepEqual(render({$each:{path:'/nodes',template:{name:{$path:'/login'}}}}, {nodes:[{login:'a'},{login:'b'}]}), [{name:'a'},{name:'b'}]);
});
test('mapping rejects missing pointer evidence', () => {
  assert.throws(() => render({$path:'/missing'}, {}), /pointer/);
});
test('mapping bounds nesting', () => {
  let template:any = {$path:''}; for(let n=0;n<32;n++) template={value:template};
  assert.throws(() => render(template, {}), /bound/);
});
test('custom definition cannot redirect a bounded mutation',()=>{
  const definition=base();definition.facts.Assign.stdin={query:'mutation Assign { deleteIssue(input:{issueId:"other"}) { clientMutationId } }',variables:{$input:''}};
  custom(definition,source=>assert.throws(()=>loadDefinition({name:'github',version:1,source},'github',process.cwd()),/mutation/));
});
test('custom definition uses the production loader without a core registry entry',()=>{
  const definition=base();definition.name='company-github';
  custom(definition,source=>{
    const selected=loadDefinition({name:'company-github',version:1,source},'github',process.cwd());
    assert.equal(selected.definition.name,'company-github');assert.equal(render(selected.definition.facts.Actor.stdin,null,{owner:'owner',name:'repo'}).variables.owner,'owner');
  });
});
test('custom definition source has a byte bound before parsing',()=>{
  custom(base(),source=>{
    writeFileSync(source,JSON.stringify(base())+' '.repeat(300000));
    assert.throws(()=>loadDefinition({name:'github',version:1,source},'github',process.cwd()),/bound/);
  });
});
