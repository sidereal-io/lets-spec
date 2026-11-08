import { isDeepStrictEqual } from 'node:util';
import { AdapterFailure } from './errors.ts';
import { object, validateResponse } from './protocol.ts';
import type { LoadedDefinition } from './definitions.ts';

type Path = (string | number)[];
export type Projection =
  | { op: 'path' | 'scope'; path: Path }
  | { op: 'literal'; value: unknown }
  | { op: 'array'; values: Projection[] }
  | { op: 'object'; fields: Record<string, Projection> }
  | { op: 'at' | 'map'; source: Projection; value: Projection }
  | { op: 'select' | 'filter'; source: Projection; path: Path; equals: Projection }
  | { op: 'enum'; source: Projection; values: Record<string, unknown> }
  | { op: 'union'; source: Projection; tag: Path; cases: Record<string, Projection> }
  | { op: 'nullable'; source: Projection; value: Projection }
  | { op: 'text'; source: Projection; prefix: string }
  | { op: 'connection'; source: Projection };
function fieldPath(value: unknown, path: Path, optional = false): unknown {
  for (const key of path) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, key)) {
      if (optional) return undefined;
      throw new AdapterFailure('unknown_outcome', 'unknown', `required output path is missing: ${path.join('.')}`);
    }
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}
function gap(message: string): never { throw new AdapterFailure('unknown_outcome', 'unknown', message); }
/** A closed data projection language: no expressions, scripts or tool execution. */
export function project(projection: Projection, output: unknown, scope: Record<string, unknown> = {}): unknown {
  const read = (child: Projection, source = output) => project(child, source, scope);
  switch (projection.op) {
    case 'path': return fieldPath(output, projection.path);
    case 'scope': return fieldPath(scope, projection.path);
    case 'array': return projection.values.map((value) => read(value));
    case 'literal': return structuredClone(projection.value);
    case 'object': return Object.fromEntries(Object.entries(projection.fields).map(([key, value]) => [key, read(value)]));
    case 'at': return read(projection.value, read(projection.source));
    case 'map': {
      const array = read(projection.source);
      if (!Array.isArray(array)) return gap('projection map requires an array');
      return array.map((value) => read(projection.value, value));
    }
    case 'filter':
    case 'select': {
      const array = read(projection.source);
      if (!Array.isArray(array)) return gap('projection select requires an array');
      const expected = read(projection.equals);
      const selected = array.filter((entry) => isDeepStrictEqual(fieldPath(entry, projection.path, true), expected));
      if (projection.op === 'filter') return selected;
      if (selected.length !== 1) return gap(`projection select requires exactly one match for ${projection.path.join('.')}`);
      return selected[0];
    }
    case 'enum': {
      const value = read(projection.source);
      if ((typeof value !== 'string' && typeof value !== 'number') || !Object.hasOwn(projection.values, value)) return gap('unmapped enum value');
      return structuredClone(projection.values[String(value)]);
    }
    case 'union': {
      const source = read(projection.source);
      const tag = fieldPath(source, projection.tag);
      if (typeof tag !== 'string' || !Object.hasOwn(projection.cases, tag)) return gap('unmapped tagged union member');
      return read(projection.cases[tag], source);
    }
    case 'nullable': {
      const source = read(projection.source);
      return source === null ? null : read(projection.value, source);
    }
    case 'text': {
      const value = read(projection.source);
      if (typeof value !== 'string' && typeof value !== 'number') return gap('text projection requires a string or number');
      return projection.prefix + String(value);
    }
    case 'connection': return connectionNodes(read(projection.source));
    default: throw new AdapterFailure('invalid_configuration', 'none', 'unknown projection operator');
  }
}
export function deriveResult(operation: string, projection: Projection, output: unknown,
  scope: Record<string, unknown>, normalized?: unknown): Record<string, unknown> {
  const result = object(project(projection, output, scope), 'projected result');
  if (normalized !== undefined && !isDeepStrictEqual(normalized, result))
    throw new AdapterFailure('invalid_request', 'unknown', 'normalized result disagrees with submitted tool output');
  validateResponse({ protocol: 1, ok: true, result }, 0, operation);
  return result;
}
function validatePath(value: unknown): void {
  if (!Array.isArray(value) || value.some((part) =>
    (typeof part !== 'string' && (!Number.isSafeInteger(part) || part < 0)) ||
    ['__proto__', 'constructor', 'prototype'].includes(part as string)))
    throw new Error('projection path must contain safe field names or array indexes');
}
export function validateProjection(value: unknown, depth = 0): asserts value is Projection {
  if (depth > 64) throw new Error('projection exceeds nesting bound');
  const projection = object(value, 'projection');
  const shapes: Record<string, string[]> = {
    array: ['values'], path: ['path'], scope: ['path'], literal: ['value'], object: ['fields'], at: ['source', 'value'], map: ['source', 'value'],
    select: ['source', 'path', 'equals'], filter: ['source', 'path', 'equals'], enum: ['source', 'values'], union: ['source', 'tag', 'cases'],
    nullable: ['source', 'value'], text: ['source', 'prefix'], connection: ['source'],
  };
  const fields = shapes[String(projection.op)];
  if (!fields || Object.keys(projection).some((key) => key !== 'op' && !fields.includes(key)) || fields.some((key) => !Object.hasOwn(projection, key)))
    throw new Error('projection has unknown operator or fields');
  for (const key of ['path', 'tag']) if (key in projection) validatePath(projection[key]);
  if ('prefix' in projection && typeof projection.prefix !== 'string') throw new Error('projection prefix must be text');
  for (const key of ['source', 'equals']) if (key in projection) validateProjection(projection[key], depth + 1);
  if ('value' in projection && projection.op !== 'literal') validateProjection(projection.value, depth + 1);
  for (const key of ['fields', 'cases']) if (key in projection)
    for (const child of Object.values(object(projection[key], `projection.${key}`))) validateProjection(child, depth + 1);
  if (projection.op === 'array') {
    if (!Array.isArray(projection.values)) throw new Error('projection array requires values');
    for (const child of projection.values) validateProjection(child, depth + 1);
  } else if ('values' in projection) object(projection.values, 'projection.values');
}
export function deriveDefinitionResult(definition: LoadedDefinition, operation: string,
  action: string, binding: string, output: unknown, scope: Record<string, unknown>, normalized?: unknown): Record<string, unknown> {
  const translation = definition.definition.operations[operation]?.actions[action]?.bindings[binding];
  if (!translation) throw new AdapterFailure('unsupported', 'none', `definition does not map ${operation}/${action}/${binding}`);
  validateObservedScope(translation.observations, output, scope);
  return deriveResult(operation, translation.projection, output, scope, normalized);
}

export function projectArguments(arguments_: Projection | string[], input: unknown, scope: Record<string, unknown> = {}): unknown {
  return Array.isArray(arguments_) ? structuredClone(arguments_) : project(arguments_, input, scope);
}

/** Backend identity mappings are checked against the issued context by core. */
export function validateObservedScope(observations: import('./definitions.ts').ActionTranslation['observations'],
  output: unknown, scope: Record<string, unknown>): void {
  for (const page of Array.isArray(output) ? output : [output])
    for (const [field, projection] of Object.entries(observations ?? {}))
    if (!isDeepStrictEqual(project(projection, page, scope), scope[field]))
      throw new AdapterFailure('invalid_request', 'unknown', `observed ${field} differs from issued scope`);
}

function connectionNodes(value: unknown): unknown[] {
  const pages = Array.isArray(value) ? value : [value];
  if (!pages.length) return gap('connection coverage requires an observed page');
  const nodes: unknown[] = [];
  const cursors = new Set<string>();
  const ids = new Set<string>();
  let total: number | undefined;
  for (const [index, value] of pages.entries()) {
    const source = object(value, 'connection');
    const page = object(source.pageInfo, 'connection.pageInfo');
    const next = index < pages.length - 1;
    if (!Array.isArray(source.nodes) || page.hasNextPage !== next ||
        (page.endCursor !== null && (typeof page.endCursor !== 'string' || !page.endCursor)) ||
        (next && (page.endCursor === null || !source.nodes.length)) ||
        (page.hasPreviousPage !== undefined && page.hasPreviousPage !== (index > 0)))
      return gap('incomplete connection coverage');
    if (typeof page.endCursor === 'string') {
      if (cursors.has(page.endCursor)) return gap('repeated connection cursor coverage');
      cursors.add(page.endCursor);
    }
    if (source.totalCount !== undefined) {
      if (!Number.isSafeInteger(source.totalCount) || (source.totalCount as number) < 0 ||
          (total !== undefined && total !== source.totalCount)) return gap('connection totalCount changed across pages');
      total = source.totalCount as number;
    } else if (total !== undefined) return gap('connection totalCount missing from a later page');
    for (const node of source.nodes) {
      if (node && typeof node === 'object' && typeof node.id === 'string') {
        if (ids.has(node.id)) return gap('duplicate connection node coverage');
        ids.add(node.id);
      }
      nodes.push(node);
    }
  }
  if (total !== undefined && total !== nodes.length) return gap('connection totalCount contradicts observed coverage');
  return nodes;
}
