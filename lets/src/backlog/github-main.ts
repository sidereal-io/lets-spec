import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { join } from 'node:path';
import { validateRequest, validateResponse } from './protocol.ts';
import { GitHub, fail } from './github.ts';
import type { Context, Query } from './github.ts';
import { ghQuery } from './gh.ts';
import { AdapterFailure } from './errors.ts';
import type { Mappings } from './items.ts';
export async function dispatch(request: Record<string, any>, query: Query = ghQuery(request.context.cwd)): Promise<any> {
  validateRequest(request);
  const context = request.context as Context;
  const github = new GitHub(context, query);
  const document = parse(readFileSync(join(context.cwd, 'openspec/config.yaml'), 'utf8'));
  const selection = document?.lets?.backlog;
  if (selection && (selection.provider !== context.provider || (context.backlog && selection.id !== context.backlog))) fail('invalid_configuration', 'request differs from repository backlog selection');
  const mappings = selection?.mappings as Mappings | undefined;
  const item = request.input.item;
  if (item && (item.provider !== context.provider || item.backlog !== context.backlog)) fail('invalid_request', 'item scope differs from request context');
  const page = (items: any[]) => ({ items, complete: true, nextCursor: null });
  switch (request.operation) {
    case 'backlog.list': return page(await github.discover());
    case 'backlog.check': await github.project(mappings); return { valid: true, gaps: [] };
    case 'item.read': return { item: await github.read(item.id, mappings) };
    case 'item.search': return page([await github.named(request.input.query, mappings)]);
    case 'candidate.list': return page(await github.candidates(mappings));
    case 'relationship.list': await github.project(mappings); return page(await github.relationships(item.id, request.input.kind));
    case 'capability.read': {
      const config = await github.project(mappings);
      const writable = config.project.viewerCanUpdate && ['WRITE', 'MAINTAIN', 'ADMIN'].includes(await github.authenticate());
      const emulated = (available: boolean, limits: string) => ({ support: available ? 'emulated' : 'unsupported', limits });
      return { capabilities: {
        metadata: { support: 'native', limits: 'Single-select mappings only; setup and shaping writes unsupported.' },
        hierarchy: { support: 'native', limits: 'Existing GitHub parent and sub-issue reads.' },
        blockers: { support: 'native', limits: 'Complete directional GitHub dependency reads required.' },
        claims: { ...emulated(Boolean(writable && config.claimField), 'Best-effort visible Lets claim Project text field; requires Project write and repository assignment permissions. Project writers may replace provenance; verification is a snapshot, not exclusive execution.'), guarantee: 'best-effort' },
        references: emulated(Boolean(writable && config.referenceField), 'Visible Lets reference Project text field; requires Project write permissions.'),
        completion: emulated(Boolean(writable && config.referenceField), 'Requires associated PR merge evidence from the trusted code-host caller and Project write permissions.'),
      } };
    }
    default: fail('unsupported', 'operation is unsupported by the GitHub existing-item adapter');
  }
}
export async function main() {
  let request: any;
  try {
    let input = ''; for await (const chunk of process.stdin) { input += chunk; if (Buffer.byteLength(input) > 1024 * 1024) fail('invalid_request', 'request exceeds input limit'); }
    try { request = JSON.parse(input); validateRequest(request); } catch { fail('invalid_request', 'invalid protocol request'); }
    const response = { protocol: 1, ok: true, result: await dispatch(request) };
    validateResponse(response, 0, request.operation); process.stdout.write(JSON.stringify(response) + '\n');
  } catch (error) {
    const failure = error instanceof AdapterFailure ? error : new AdapterFailure('invalid_configuration', 'none', 'GitHub configuration or response validation failed');
    process.stdout.write(JSON.stringify({ protocol: 1, ok: false, error: { category: failure.category, effects: failure.effects, message: failure.message } }) + '\n'); process.exitCode = 1;
  }
}
