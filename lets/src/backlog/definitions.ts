import { validateProjection } from './projections.ts';
import type { Projection } from './projections.ts';
import { createHash } from 'node:crypto';
import { AdapterFailure } from './errors.ts';
import { object, OPERATIONS, ERRORS } from './protocol.ts';

export type ToolBinding = { kind: 'cli' | 'mcp'; tool: string; versions: string[] };
export type ActionTranslation = { arguments: Projection | string[]; projection: Projection; observations?: Partial<Record<'actor' | 'repository' | 'backlog', Projection>> };
export type OperationDefinition = { actions: Record<string, { bindings: Record<string, ActionTranslation> }> };
export type ProviderDefinition = {
  schemaVersion: 1;
  name: string;
  version: string;
  contractVersions: number[];
  backend: { name: string; versions: string[]; errorTypes?: Record<string, import('./errors.ts').ErrorCategory> };
  bindings: Record<string, ToolBinding>;
  operations: Record<string, OperationDefinition>;
};
export type LoadedDefinition = { source: string; digest: string; definition: ProviderDefinition };
export function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function keys(record: Record<string, unknown>, allowed: string[], path: string): void {
  for (const key of Object.keys(record))
    if (!allowed.includes(key)) throw new Error(`${path}.${key} is unsupported`);
}
export function text(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value) throw new Error(`${path} must be nonempty text`);
}
function strings(value: unknown, path: string): void {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${path} must be a nonempty list`);
  for (const entry of value) text(entry, path);
}
/** Load data only. Neither provider discovery nor executable hooks are supported. */
export function loadDefinition(sources: readonly { source: string; value: unknown }[]): LoadedDefinition {
  const location = sources.map((entry) => entry.source).join(', ') || 'definition';
  try {
    if (sources.length !== 1) throw new Error('select exactly one definition source; remove conflicting sources');
    const { source, value } = sources[0];
    const definition = object(value, 'definition');
    keys(definition, ['schemaVersion', 'name', 'version', 'contractVersions', 'backend', 'bindings', 'operations'], 'definition');
    if (definition.schemaVersion !== 1) throw new Error('schemaVersion must be 1');
    text(definition.name, 'name');
    text(definition.version, 'version');
    if (!Array.isArray(definition.contractVersions) || !definition.contractVersions.includes(1) ||
        definition.contractVersions.some((entry) => !Number.isInteger(entry)))
      throw new Error('contractVersions must support operation contract 1');
    const backend = object(definition.backend, 'backend');
    keys(backend, ['name', 'versions', 'errorTypes'], 'backend');
    text(backend.name, 'backend.name');
    strings(backend.versions, 'backend.versions');
    if (backend.errorTypes !== undefined)
      for (const category of Object.values(object(backend.errorTypes, 'backend.errorTypes')))
        if (!(ERRORS as readonly unknown[]).includes(category)) throw new Error('backend.errorTypes contains an unknown category');
    const bindings = object(definition.bindings, 'bindings');
    if (!Object.keys(bindings).length) throw new Error('bindings must declare a tool');
    for (const [name, value] of Object.entries(bindings)) {
      const binding = object(value, `bindings.${name}`);
      keys(binding, ['kind', 'tool', 'versions'], `bindings.${name}`);
      if (!['cli', 'mcp'].includes(binding.kind as string)) throw new Error(`bindings.${name}.kind must be cli or mcp`);
      text(binding.tool, `bindings.${name}.tool`);
      strings(binding.versions, `bindings.${name}.versions`);
    }
    const operations = object(definition.operations, 'operations');
    for (const [name, value] of Object.entries(operations)) {
      if (!(OPERATIONS as readonly string[]).includes(name)) throw new Error(`operations.${name} is unknown`);
      const operation = object(value, `operations.${name}`);
      keys(operation, ['actions'], `operations.${name}`);
      for (const [step, value] of Object.entries(object(operation.actions, 'actions'))) {
        const action = object(value, `actions.${step}`);
        keys(action, ['bindings'], `actions.${step}`);
        const translations = object(action.bindings, `actions.${step}.bindings`);
        if (!Object.keys(translations).length) throw new Error(`actions.${step} must map a binding`);
        for (const [binding, value] of Object.entries(translations)) {
          if (!Object.hasOwn(bindings, binding)) throw new Error(`actions.${step} names undeclared binding ${binding}`);
          const translation = object(value, `actions.${step}.${binding}`);
          keys(translation, ['arguments', 'projection', 'observations'], `actions.${step}.${binding}`);
          if (!Object.hasOwn(translation, 'arguments')) throw new Error('tool arguments required');
          if (Array.isArray(translation.arguments)) {
            if (translation.arguments.some((entry) => typeof entry !== 'string')) throw new Error('literal tool arguments must be strings');
          } else validateProjection(translation.arguments);
          validateProjection(translation.projection);
          if (translation.observations !== undefined) {
            const observations = object(translation.observations, 'observations');
            keys(observations, ['actor', 'repository', 'backlog'], 'observations');
            for (const mapping of Object.values(observations)) validateProjection(mapping);
          }
        }
      }
    }
    return { source, digest: digest(value), definition: value as ProviderDefinition };
  } catch (error) {
    throw new AdapterFailure('invalid_configuration', 'none', `${location}: ${String(error)}; select a compatible inert definition, no fallback`);
  }
}
