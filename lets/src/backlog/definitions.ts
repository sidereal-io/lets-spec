import shipped from './definitions/github.json' with { type: 'json' };
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonical, digest } from './action-contract.ts';
import { AdapterFailure } from './errors.ts';
export type Fact = { tool: string; mode: 'read' | 'write'; stdin: unknown; result: unknown };
export type Definition = { version: 1; name: string; provider: string; contract: 1; backendVersions: string[]; facts: Record<string, Fact> };
export function loadDefinition(selection: { name: string; version: number; source?: string }, provider: string, cwd: string): { definition: Definition; digest: string } {
  try {
    if (selection.version !== 1) throw new Error('unsupported definition version');
    const source = selection.source ? resolve(cwd, selection.source) : undefined;
    if (source && statSync(source).size > 262144) throw new Error('definition source exceeds byte bound');
    const definition = source ? JSON.parse(readFileSync(source, 'utf8')) : shipped;
    if (definition.version !== 1 || definition.contract !== 1 || definition.name !== selection.name || definition.provider !== provider) throw new Error('incompatible definition selection');
    validateDefinition(definition);
    return { definition, digest: digest(definition) };
  } catch (error) { throw new AdapterFailure('invalid_configuration', 'none', String(error)); }
}
const writes = new Set(['Assign', 'Unassign', 'FieldStatus', 'UpdateIssueBody', 'UpdatePRBody']);
const invalid = (message: string): never => { throw new Error(`invalid definition: ${message}`); };
function record(value: unknown): value is Record<string, any> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function pointer(value: unknown): asserts value is string {
  if (typeof value !== 'string' || (value !== '' && !value.startsWith('/')) || /~(?![01])/u.test(value)) invalid('template pointer');
}
function template(value: unknown, result: boolean, depth = 0, budget = {nodes:0}) {
  if (++budget.nodes > 10000 || depth > 16) invalid('template bound');
  if (Array.isArray(value)) {
    if (result) invalid('result arrays must derive from capture');
    for (const child of value) template(child, result, depth + 1, budget);
  } else if (record(value)) {
    const keys = Object.keys(value);
    if (keys.some(key => key.startsWith('$'))) {
      if (keys.length !== 1) invalid('template expression');
      if (keys[0] === '$path' || (!result && keys[0] === '$input')) pointer(value[keys[0]]);
      else if (keys[0] === '$each' && result && record(value.$each) && Object.keys(value.$each).sort().join(',') === 'path,template') {
        pointer(value.$each.path); template(value.$each.template, true, depth + 1, budget);
      } else invalid('unsupported template expression');
    } else {
      for (const [key, child] of Object.entries(value)) {
        if (['__proto__','constructor','prototype'].includes(key)) invalid('unsafe template key');
        template(child, result, depth + 1, budget);
      }
    }
  } else if (result) invalid('result leaves must derive from capture');
}
function validateDefinition(definition: Definition) {
  if (Object.keys(definition).sort().join(',') !== 'backendVersions,contract,facts,name,provider,version') invalid('unsupported definition keys');
  if (!Array.isArray(definition.backendVersions) || !definition.backendVersions.length || definition.backendVersions.some(value => typeof value !== 'string' || !value)) invalid('backend versions');
  if (!record(definition.facts) || Object.keys(definition.facts).sort().join(',') !== Object.keys(shipped.facts).sort().join(',')) invalid('fact inventory');
  for (const [name, fact] of Object.entries(definition.facts)) {
    if (!record(fact) || Object.keys(fact).sort().join(',') !== 'mode,result,stdin,tool') invalid('fact keys');
    if (fact.mode !== (writes.has(name) ? 'write' : 'read')) invalid('fact mode');
    if (fact.tool !== 'github-graphql') invalid('tool selector');
    template(fact.stdin, false); template(fact.result, true);
    // Contract v1 exposes these exact bounded GitHub mutation shapes. A data
    // override cannot add effects or replace the core-owned mutation inputs.
    if (writes.has(name) && canonical(fact.stdin) !== canonical((shipped.facts as Record<string, Fact>)[name].stdin)) invalid('mutation translation differs from bounded contract');
  }
  if (JSON.stringify(definition).length > 262144) invalid('definition bound');
}
export function render(value: unknown, source: unknown, input: unknown = source): any {
  let nodes = 0;
  function lookup(root: any, path: unknown) {
    pointer(path);
    for (const part of path.split('/').slice(1)) {
      const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
      if (!root || typeof root !== 'object' || !Object.hasOwn(root, key)) invalid('missing pointer evidence');
      root = root[key];
    }
    if (root === undefined) invalid('missing pointer evidence');
    return structuredClone(root);
  }
  function visit(value: any, current: unknown, depth: number): any {
    if (++nodes > 10000 || depth > 16) invalid('mapping bound');
    if (record(value)) {
      if ('$input' in value) return lookup(input, value.$input);
      if ('$path' in value) return lookup(current, value.$path);
      if ('$each' in value) {
        const items = lookup(current, value.$each.path);
        if (!Array.isArray(items) || items.length > 1000) invalid('mapping array bound');
        return items.map((item: unknown) => visit(value.$each.template, item, depth + 1));
      }
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child, current, depth + 1)]));
    }
    return Array.isArray(value) ? value.map(child => visit(child, current, depth + 1)) : value;
  }
  const result = visit(value, source, 0);
  if (JSON.stringify(result).length > 1048576) invalid('mapping output bound');
  return result;
}
