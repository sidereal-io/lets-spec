import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfiguration } from '../../../lets/src/backlog/repository-config.ts';
import { METADATA } from '../../../lets/src/backlog/items.ts';
const mappings = Object.fromEntries(Object.entries(METADATA).map(([field, values]) => [field, {field, cardinality:'one',values:Object.fromEntries(values.map(value => [value,value]))}]));
test('implicit configuration selects shipped inert definition', () => {
  const selected = resolveConfiguration({}, process.cwd());
  assert.equal(selected.provider, 'github');
  assert.equal(selected.definition.name, 'github');
  assert.match(selected.definitionDigest, /^[a-f0-9]{64}$/);
});
test('explicit selection retains mappings', () => {
  const selected = resolveConfiguration({lets:{backlog:{provider:'github',definition:{name:'github',version:1},id:'P',mappings}}}, process.cwd());
  assert.deepEqual(selected.mappings, mappings);
  assert.equal(selected.backlog,'P');
});
for (const patch of [{executable:'lets-backlog-github'}, {definition:{name:'missing',version:1}}, {definition:{name:'github',version:2}}, {mappings:{}}, {id:''}, {token:'forbidden'}]) {
  test(`explicit configuration rejects ${JSON.stringify(patch)}`, () => {
    assert.throws(() => resolveConfiguration({lets:{backlog:{provider:'github',definition:{name:'github',version:1},id:'P',mappings,...patch}}}, process.cwd()), (error:any) => error.category === 'invalid_configuration' && error.effects === 'none');
  });
}
