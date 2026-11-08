import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { object, validateResponse } from './protocol.ts';

export type Projection = { op: 'path'; path: (string | number)[] };
/** Field paths are data. Missing fields fail rather than becoming assertions. */
export function project(projection: Projection, output: unknown): unknown {
  if (projection.op !== 'path' || !Array.isArray(projection.path))
    throw new AdapterFailure('invalid_configuration', 'none', 'unknown projection operator');
  let value = output;
  for (const key of projection.path) {
    if (value === null || typeof value !== 'object' ||
        !Object.hasOwn(value, key))
      throw new AdapterFailure('unknown_outcome', 'unknown', `required output path is missing: ${projection.path.join('.')}`);
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}
export function deriveResult(operation: string, projection: Projection, output: unknown,
  _scope: Record<string, unknown>, normalized?: unknown): Record<string, unknown> {
  const result = object(project(projection, output), 'projected result');
  if (normalized !== undefined && !isDeepStrictEqual(normalized, result))
    throw new AdapterFailure('invalid_request', 'unknown', 'normalized result disagrees with submitted tool output');
  validateResponse({ protocol: 1, ok: true, result }, 0, operation);
  return result;
}

import type { LoadedDefinition } from './definitions.ts';
export function validateProjection(value: unknown): asserts value is Projection {
  const projection = object(value, 'projection');
  if (projection.op !== 'path') throw new Error('projection has unknown operator');
  if (Object.keys(projection).some((key) => !['op', 'path'].includes(key)) ||
      !Array.isArray(projection.path) || projection.path.some((part) =>
        (typeof part !== 'string' && !Number.isSafeInteger(part)) ||
        ['__proto__', 'constructor', 'prototype'].includes(part as string)))
    throw new Error('projection path must contain safe field names or array indexes');
}
export function deriveDefinitionResult(definition: LoadedDefinition, operation: string,
  action: string, binding: string, output: unknown, scope: Record<string, unknown>, normalized?: unknown): Record<string, unknown> {
  const translation = definition.definition.operations[operation]?.actions[action]?.bindings[binding];
  if (!translation) throw new AdapterFailure('unsupported', 'none', `definition does not map ${operation}/${action}/${binding}`);
  return deriveResult(operation, translation.projection, output, scope, normalized);
}
