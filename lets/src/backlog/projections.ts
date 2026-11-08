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
