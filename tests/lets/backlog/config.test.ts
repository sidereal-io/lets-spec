import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkConfiguration} from '../../../lets/src/backlog/config.ts';
import {METADATA} from '../../../lets/src/backlog/items.ts';
const mappings=Object.fromEntries(Object.entries(METADATA).map(([field,values])=>[field,{field,cardinality:'one',values:Object.fromEntries(values.map(value=>[value,value]))}]));
const explicit={lets:{backlog:{version:1,provider:'github',definition:{name:'github',version:1},id:'P',mappings}}};
test('configuration validates logical tool prerequisites',()=>{
  const tools:string[]=[];const selection=checkConfiguration({},process.cwd(),tool=>{tools.push(tool);return true;});
  assert.equal(selection.provider,'github');assert.deepEqual(tools,['github-graphql']);
});
test('missing trusted tool never falls back',()=>assert.throws(()=>checkConfiguration(explicit,process.cwd(),()=>false),/no fallback/));
test('configuration retains explicit backlog scope',()=>assert.equal(checkConfiguration(explicit,process.cwd(),()=>true).backlog,'P'));
for(const patch of [{executable:'gh'},{token:'fixture'},{id:''},{mappings:{}},{definition:{name:'github',version:2}},{provider:'unsupported'}])test(`configuration rejects ${JSON.stringify(patch)}`,()=>assert.throws(()=>checkConfiguration({lets:{backlog:{...explicit.lets.backlog,...patch}}},process.cwd(),()=>true),/configuration/));
