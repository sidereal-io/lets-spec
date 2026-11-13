// Reading lets.backlog.provider from openspec/config.yaml, line by line.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BacklogError } from '../../../lets/src/backlog/adapter.ts';
import { backlogProvider } from '../../../lets/src/backlog/config.ts';

const unknown = (text: string, pattern: RegExp) => assert.throws(() => backlogProvider(text), (error: unknown) => {
  assert.ok(error instanceof BacklogError);
  assert.equal(error.code, 'unknown-backlog-provider');
  assert.match(error.message, pattern);
  return true;
});

test('no lets block is null', () => {
  assert.equal(backlogProvider('schema: lets-standard\n'), null);
  assert.equal(backlogProvider(''), null);
});

test('a lets block that names the backlog provider gives its name', () => {
  assert.equal(backlogProvider('schema: lets-standard\nlets:\n  backlog:\n    provider: github\n'), 'github');
  assert.equal(backlogProvider('lets:\n    backlog:\n        provider: jira   # the team tracker\n'), 'jira');
  assert.equal(backlogProvider('lets:\n  backlog:\n    provider: "linear"\n'), 'linear');
  assert.equal(backlogProvider("lets:\r\n  backlog:\r\n    provider: 'beads'\r\n"), 'beads');
});

test('other keys and comments around the setting are skipped', () => {
  const text = [
    'schema: lets-standard',
    'lets:',
    '  # where the work lives',
    '  flow: standard',
    '  skills:',
    '    provider: not-this-one',
    '',
    '  backlog:',
    '    other: x',
    '    provider: jira',
    'context: |',
    '  provider: nor-this',
  ].join('\n');
  assert.equal(backlogProvider(text), 'jira');
});

test('a lets block with no backlog, or a backlog with no provider, is null', () => {
  assert.equal(backlogProvider('lets:\n  flow: standard\n'), null);
  assert.equal(backlogProvider('lets:\n  backlog:\n    other: x\n'), null);
  assert.equal(backlogProvider('lets:\n'), null);
});

test('a provider outside lets.backlog is not read', () => {
  assert.equal(backlogProvider('backlog:\n  provider: jira\nlets:\n  flow: standard\n'), null);
  assert.equal(backlogProvider('lets:\n  backlog:\nother:\n    provider: jira\n'), null);
});

test('a lets block in flow style is unknown-backlog-provider, and says only block style is read', () => {
  unknown('lets: {backlog: {provider: jira}}\n', /block style/);
  unknown('lets:\n  backlog: {provider: jira}\n', /block style/);
});

test('a provider the reader cannot unquote, or an empty one, is unknown-backlog-provider', () => {
  unknown('lets:\n  backlog:\n    provider: "jira\n', /provider/);
  unknown('lets:\n  backlog:\n    provider:\n', /provider/);
});
