import { AdapterFailure } from './errors.ts';
import type { BacklogRequest, BacklogResponse } from './types.ts';
import { validateItem, METADATA } from './items.ts';
import { isAbsolute } from 'node:path';
/** Offline contract definitions; not a production dispatcher. */
export const PROTOCOL = 1;
export const MUTATIONS: string[] = [
  'pull-request.create', 'pull-request.update', 'pull-request.ready',
  'backlog.create',
  'item.create',
  'item.update',
  'relationship.write',
  'claim.acquire',
  'claim.release',
  'reference.write',
  'completion.write',
];
export const OPERATIONS = [
  'repository.read', 'pull-request.read', 'pull-request.create', 'pull-request.update', 'pull-request.ready',
  'backlog.list',
  'backlog.create',
  'backlog.check',
  'item.search',
  'item.read',
  'item.create',
  'item.update',
  'relationship.write',
  'relationship.list',
  'candidate.list',
  'claim.acquire',
  'claim.read',
  'claim.release',
  'reference.write',
  'completion.write',
  'mutation.read',
  'capability.read',
] as const;
export function validateRequest(value: unknown): asserts value is BacklogRequest {
  if (
    typeof value !== 'object' ||
    value === null ||
    (value as Record<string, unknown>).protocol !== PROTOCOL
  )
    throw new Error('unsupported protocol');
  const request = value as Record<string, unknown>;
  if (!(OPERATIONS as readonly unknown[]).includes(request.operation))
    throw new Error('unknown operation');
  const context = request.context as Record<string, unknown> | undefined;
  const bootstrap = request.operation === 'repository.read' &&
    ((request.input as Record<string, unknown>)?.owner !== undefined || (request.input as Record<string, unknown>)?.name !== undefined);
  if (bootstrap && context?.actor !== undefined) throw new Error('bootstrap must not assume an actor');
  const discovery =
    request.operation === 'backlog.list' || request.operation === 'backlog.create';
  for (const field of [
    'cwd',
    'provider',
    'repository',
    ...(bootstrap ? [] : ['actor']),
    'session',
    ...(discovery || request.operation === 'repository.read' || String(request.operation).startsWith('pull-request.') || request.operation === 'mutation.read' ? [] : ['backlog']),
  ]) {
    if (!context || typeof context[field] !== 'string' || context[field] === '')
      throw new Error(`context.${field} is required`);
  }
  if (bootstrap) {
    const input = request.input as Record<string, unknown>;
    if (typeof input.owner !== 'string' || !input.owner || typeof input.name !== 'string' || !input.name ||
        context?.repository !== `${input.owner}/${input.name}`) throw new Error('bootstrap requires exact repository owner/name');
  }
  if (discovery && context?.backlog !== undefined)
    throw new Error('context.backlog must be omitted for discovery/create');
  if (
    request.operation === 'mutation.read' &&
    context?.backlog !== undefined &&
    (typeof context.backlog !== 'string' || !context.backlog)
  )
    throw new Error('context.backlog must be omitted or nonempty');
  if (!MUTATIONS.includes(request.operation as string) && request.mutationId !== undefined)
    throw new Error('mutationId is forbidden on reads');
  if (
    MUTATIONS.includes(request.operation as string) &&
    (typeof request.mutationId !== 'string' || request.mutationId === '')
  )
    throw new Error('mutationId is required');
  if (request.operation === 'item.read')
    validateIdentity((request.input as Record<string, unknown>)?.item);
  fields(request.input, INPUTS[request.operation as string], 'input');
  const input = request.input as Record<string, unknown>;
  if (request.operation === 'pull-request.read' &&
      (Number(input.branch !== undefined) + Number(input.pullRequest !== undefined) !== 1))
    throw new Error('PR read requires exactly one branch or pullRequest');
  if (request.operation === 'completion.write')
    fields(
      input.merge,
      { reference: 'text', merged: 'boolean', commit: 'string' },
      'input.merge',
    );
  if (request.operation === 'item.update')
    fields(
      input.patch,
      { 'title?': 'text', 'body?': 'string', 'metadata?': 'object' },
      'input.patch',
    );
  const metadata =
    request.operation === 'item.create'
      ? input.metadata
      : request.operation === 'item.update'
        ? (input.patch as Record<string, unknown>).metadata
        : undefined;
  if (metadata !== undefined) {
    const values = object(metadata, 'input.metadata');
    if (request.operation === 'item.update' && 'Status' in values)
      throw new Error('Status belongs to claim and completion operations');
    if (request.operation === 'item.create' && values.Status !== 'Todo')
      throw new Error('new items must start Todo');
    for (const [field, value] of Object.entries(values))
      if (
        !(field in METADATA) ||
        !(METADATA[field as keyof typeof METADATA] as readonly unknown[]).includes(value)
      )
        throw new Error(`invalid input.metadata.${field}`);
    if (request.operation === 'item.create')
      for (const field of Object.keys(METADATA))
        if (!(field in values)) throw new Error(`input.metadata.${field} required`);
  }
  if (!isAbsolute(context!.cwd as string)) throw new Error('context.cwd must be absolute');
}

export type Identity = { provider: string; backlog: string; id: string };
export function validateIdentity(value: unknown): asserts value is Identity {
  const item = value as Record<string, unknown> | undefined;
  for (const field of ['provider', 'backlog', 'id']) {
    if (!item || typeof item[field] !== 'string' || item[field] === '')
      throw new Error(`item.${field} is required`);
  }
}
export const ERRORS = [
  'invalid_request',
  'invalid_configuration',
  'authentication',
  'permission',
  'not_found',
  'unsupported',
  'conflict',
  'transient',
  'unknown_outcome',
] as const;
export function validateResponse(
  value: unknown,
  exitCode: number,
  operation?: string,
): asserts value is BacklogResponse {
  const response = value as Record<string, unknown> | null;
  if (!response || response.protocol !== PROTOCOL)
    throw new Error('unsupported response protocol');
  if (typeof response.ok !== 'boolean' || response.ok !== (exitCode === 0))
    throw new Error('inconsistent exit/result');
  if (response.ok) {
    const result = object(response.result, 'result');
    if (operation) {
      if (!(operation in OUTPUTS)) throw new Error('unknown response operation');
      fields(result, OUTPUTS[operation], 'result');
      if (['item.read', 'item.create', 'item.update'].includes(operation))
        validateItem(result.item);
      if (['item.search', 'candidate.list'].includes(operation))
        for (const item of result.items as unknown[]) validateItem(item);
      validateNestedResult(operation, result);
      if (
        'complete' in result &&
        (result.complete === true
          ? result.nextCursor !== null
          : typeof result.nextCursor !== 'string' || !result.nextCursor)
      )
        throw new Error('invalid pagination completeness/cursor');
    }
    if ('error' in response) throw new Error('successful result cannot contain error');
  } else {
    if ('result' in response) throw new Error('failed result cannot contain result');
    const error = object(response.error, 'error');
    if (!(ERRORS as readonly unknown[]).includes(error.category))
      throw new Error('unknown error category');
    if (typeof error.message !== 'string' || !error.message)
      throw new Error('error.message required');
    if (!['none', 'partial', 'unknown'].includes(error.effects as string))
      throw new Error('error.effects required');
    if (error.category === 'unknown_outcome' && error.effects === 'none')
      throw new Error('unknown outcome cannot promise no effects');
  }
}

// Required field definitions are executable and shared with the fake harness.
// Optional fields use a trailing ?. Unknown fields are rejected.
export const INPUTS: Record<string, Record<string, string>> = {
  'repository.read': { 'owner?': 'text', 'name?': 'text' },
  'pull-request.read': { 'pullRequest?': 'text', 'branch?': 'text' },
  'pull-request.create': { title: 'text', bodyFile: 'text', base: 'text', head: 'text', headRepository: 'text', 'item?': 'identity' },
  'pull-request.update': { pullRequest: 'text', bodyFile: 'text', 'item?': 'identity' },
  'pull-request.ready': { pullRequest: 'text', 'item?': 'identity' },
  'backlog.list': { 'cursor?': 'text', 'selected?': 'text' },
  'backlog.create': { title: 'text' },
  'backlog.check': {},
  'item.search': { query: 'text', 'cursor?': 'text' },
  'item.read': { item: 'identity', 'includeThread?': 'boolean' },
  'item.create': { title: 'text', body: 'string', metadata: 'object' },
  'item.update': { item: 'identity', patch: 'object' },
  'relationship.write': {
    item: 'identity',
    target: 'identity',
    kind: 'text',
    present: 'boolean',
  },
  'relationship.list': { item: 'identity', kind: 'text', 'cursor?': 'text' },
  'candidate.list': { 'cursor?': 'text' },
  'claim.acquire': { item: 'identity' },
  'claim.read': { item: 'identity' },
  'claim.release': { item: 'identity', token: 'text' },
  'reference.write': { item: 'identity', reference: 'text' },
  'completion.write': { item: 'identity', merge: 'object' },
  'mutation.read': { mutationId: 'text' },
  'capability.read': {},
};
export function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path} must be an object`);
  return value as Record<string, unknown>;
}
function fields(value: unknown, shape: Record<string, string>, path: string): void {
  const record = object(value, path);
  for (const key of Object.keys(record))
    if (!(key in shape) && !(`${key}?` in shape)) throw new Error(`${path}.${key} is unknown`);
  for (const [raw, type] of Object.entries(shape)) {
    const key = raw.replace(/\?$/, '');
    if (raw.endsWith('?') && record[key] === undefined) continue;
    const entry = record[key];
    if (type === 'identity') {
      try {
        validateIdentity(entry);
      } catch (error) {
        throw new Error(`${path}.${key}: ${String(error)}`);
      }
    } else if (type === 'array') {
      if (!Array.isArray(entry)) throw new Error(`${path}.${key} must be array`);
    } else if (type === 'nullableText') {
      if (entry !== null && (typeof entry !== 'string' || !entry))
        throw new Error(`${path}.${key} must be text or null`);
    } else if (type === 'nullableObject') {
      if (entry !== null) object(entry, `${path}.${key}`);
    } else if (type === 'object') object(entry, `${path}.${key}`);
    else if (
      type === 'text' ? typeof entry !== 'string' || entry === '' : typeof entry !== type
    )
      throw new Error(`${path}.${key} must be ${type}`);
  }
}

const page = { items: 'array', complete: 'boolean', nextCursor: 'nullableText' };
export const OUTPUTS: Record<string, Record<string, string>> = {
  'repository.read': { repository: 'object', 'actor?': 'text' },
  'pull-request.read': { pullRequest: 'nullableObject' },
  'pull-request.create': { pullRequest: 'object' },
  'pull-request.update': { pullRequest: 'object' },
  'pull-request.ready': { pullRequest: 'object' },
  'backlog.list': page,
  'backlog.create': { backlog: 'text' },
  'backlog.check': { valid: 'boolean', gaps: 'array' },
  'item.search': page,
  'candidate.list': page,
  'relationship.list': page,
  'item.read': { item: 'object' },
  'item.create': { item: 'object' },
  'item.update': { item: 'object' },
  'relationship.write': { present: 'boolean' },
  'claim.acquire': { claim: 'object' },
  'claim.read': { claim: 'object' },
  'claim.release': { released: 'boolean' },
  'reference.write': { reference: 'text' },
  'completion.write': { status: 'text' },
  'mutation.read': { state: 'text', 'result?': 'object' },
  'capability.read': { capabilities: 'object' },
};

function oneOf(value: unknown, allowed: readonly unknown[], path: string): void {
  if (!allowed.includes(value)) throw new Error(`invalid ${path}`);
}
function validateNestedResult(operation: string, result: Record<string, unknown>): void {
  if (operation === 'repository.read')
    fields(result.repository, { id: 'text', owner: 'text', name: 'text', url: 'text', defaultBranch: 'text' }, 'repository');
  if (operation.startsWith('pull-request.') && result.pullRequest !== null) {
    fields(result.pullRequest, { id: 'text', repository: 'text', headRepository: 'text',
      number: 'number', url: 'text', state: 'text', isDraft: 'boolean', body: 'string', createdAt: 'text',
      baseRef: 'text', headRef: 'text', baseSha: 'nullableText', headSha: 'nullableText',
      mergeCommit: 'nullableText', mergeRef: 'nullableText' }, 'pullRequest');
    const pr = result.pullRequest as Record<string, unknown>;
    oneOf(pr.state, ['OPEN', 'CLOSED', 'MERGED'], 'pullRequest.state');
    if (!Number.isSafeInteger(pr.number) || (pr.number as number) <= 0) throw new Error('invalid pullRequest.number');
    if (!Number.isFinite(Date.parse(pr.createdAt as string))) throw new Error('invalid pullRequest.createdAt');
  }
  if (operation === 'backlog.list')
    for (const item of result.items as unknown[])
      fields(
        item,
        { provider: 'text', id: 'text', 'title?': 'text', 'url?': 'text' },
        'backlog',
      );
  if (operation === 'relationship.list')
    for (const item of result.items as unknown[]) {
      fields(item, { identity: 'identity', status: 'text' }, 'relationship');
      oneOf((item as Record<string, unknown>).status, METADATA.Status, 'relationship.status');
    }
  if (operation === 'claim.read' || operation === 'claim.acquire') {
    fields(
      result.claim,
      {
        actor: 'nullableText',
        session: 'nullableText',
        token: 'nullableText',
        status: operation === 'claim.read' ? 'nullableText' : 'text',
        guarantee: 'text',
        'assignees?': 'array',
        'assigneesComplete?': 'boolean',
        'item?': 'identity',
        'verdict?': 'text',
      },
      'claim',
    );
    const claim = result.claim as Record<string, unknown>;
    if (claim.status !== null) oneOf(claim.status, METADATA.Status, 'claim.status');
    oneOf(claim.guarantee, ['atomic', 'best-effort'], 'claim.guarantee');
    if (
      operation === 'claim.acquire' &&
      (claim.actor === null ||
        claim.session === null ||
        claim.token === null ||
        claim.status !== 'In Progress')
    )
      throw new Error('claim.acquire requires verified ownership and In Progress');
  }
  if (operation === 'completion.write') oneOf(result.status, ['Done'], 'completion.status');
  if (operation === 'mutation.read') {
    oneOf(result.state, ['applied', 'absent', 'unknown'], 'mutation.state');
    if (result.state === 'applied') object(result.result, 'mutation.result');
    else if ('result' in result)
      throw new Error('unresolved mutation cannot include confirmed result');
  }
  if (operation === 'capability.read')
    for (const [name, value] of Object.entries(
      result.capabilities as Record<string, unknown>,
    )) {
      fields(
        value,
        { support: 'text', limits: 'string', 'guarantee?': 'text' },
        `capabilities.${name}`,
      );
      const capability = value as Record<string, unknown>;
      oneOf(
        capability.support,
        ['native', 'emulated', 'unsupported'],
        `capabilities.${name}.support`,
      );
      if (capability.support === 'emulated' && !capability.limits)
        throw new Error(`capabilities.${name}.limits required`);
      if (
        capability.guarantee !== undefined ||
        (name === 'claims' && capability.support !== 'unsupported')
      )
        oneOf(
          capability.guarantee,
          ['atomic', 'best-effort'],
          `capabilities.${name}.guarantee`,
        );
    }
}

// Adapter-side stdin boundary. Caller-side validation remains independent.
export function parseRequest(text: string): BacklogRequest {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AdapterFailure('invalid_request', 'none', 'malformed request JSON');
  }
  if (
    !value ||
    typeof value !== 'object' ||
    (value as Record<string, unknown>).protocol !== PROTOCOL
  ) {
    throw new AdapterFailure('unsupported', 'none', 'unsupported protocol');
  }
  try {
    validateRequest(value);
  } catch (error) {
    throw new AdapterFailure('invalid_request', 'none', String(error));
  }
  return value;
}
