// Reading backlog.provider from the user's lets config, which parseDocument
// has checked.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BacklogError } from '../../../lets/src/backlog/adapter.ts';
import { backlogProviderFor } from '../../../lets/src/backlog/config.ts';

const PATH = '/home/u/.config/lets/config.yaml';

const unknown = (document: Record<string, unknown>, pattern: RegExp) => assert.throws(() => backlogProviderFor(document, PATH), (error: unknown) => {
  assert.ok(error instanceof BacklogError);
  assert.equal(error.code, 'unknown-backlog-provider');
  assert.match(error.message, new RegExp(PATH.replaceAll('.', '\\.')));
  assert.match(error.message, pattern);
  return true;
});

test('no backlog section, or no provider, is null', () => {
  assert.equal(backlogProviderFor({ version: 3 }, PATH), null);
  assert.equal(backlogProviderFor({ version: 3, delegate: { resolvers: ['t3'] } }, PATH), null);
  assert.equal(backlogProviderFor({ version: 3, backlog: null }, PATH), null);
  assert.equal(backlogProviderFor({ version: 3, backlog: {} }, PATH), null);
  assert.equal(backlogProviderFor({ version: 3, backlog: { provider: null } }, PATH), null);
});

test('backlog.provider gives its name', () => {
  assert.equal(backlogProviderFor({ version: 3, backlog: { provider: 'github' } }, PATH), 'github');
  assert.equal(backlogProviderFor({ version: 3, backlog: { provider: 'jira', other: 1 } }, PATH), 'jira');
});

test('a backlog that is not a mapping, or a provider that is not a string, is unknown-backlog-provider', () => {
  unknown({ version: 3, backlog: 'jira' }, /backlog must be a mapping/);
  unknown({ version: 3, backlog: ['jira'] }, /backlog must be a mapping/);
  unknown({ version: 3, backlog: { provider: ['jira'] } }, /backlog\.provider must be a backlog provider's name/);
  unknown({ version: 3, backlog: { provider: 7 } }, /backlog\.provider/);
  unknown({ version: 3, backlog: { provider: '' } }, /backlog\.provider/);
});
