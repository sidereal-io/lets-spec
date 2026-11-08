import { AdapterFailure } from './errors.ts';
import { validateResponse } from './protocol.ts';
import type { LinkedBacklog, Page } from './types.ts';

/** Selection is core policy; definitions only supply repository-linked facts. */
export function selectBacklog(page: Page<LinkedBacklog>, provider: string, selected?: string): LinkedBacklog {
  validateResponse({ protocol: 1, ok: true, result: page }, 0, 'backlog.list');
  if (!page.complete) throw new AdapterFailure('unknown_outcome', 'unknown', 'finish linked backlog discovery before selection');
  if (page.items.some((item) => item.provider !== provider) || new Set(page.items.map((item) => item.id)).size !== page.items.length)
    throw new AdapterFailure('invalid_request', 'none', 'linked backlog discovery has conflicting scope or duplicate IDs');
  const choices = selected === undefined ? page.items : page.items.filter((item) => item.id === selected);
  if (!choices.length) throw new AdapterFailure('not_found', 'none', selected === undefined
    ? 'repository has no linked backlog; configure one with lets-setup-backlog'
    : `selected backlog ${selected} is not linked to this repository; correct lets.backlog.id`);
  if (choices.length !== 1) throw new AdapterFailure('invalid_configuration', 'none',
    `repository has several linked backlogs (${choices.map((item) => item.id).join(', ')}); select lets.backlog.id`);
  return choices[0];
}
