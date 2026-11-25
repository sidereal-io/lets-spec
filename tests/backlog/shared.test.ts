// The rules every lets backlog command shares, run as a program against a
// stand-in gh: one JSON object on stdout, the Project lookup first, the
// errors when the backlog cannot answer, and the usage errors.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runLets, type StandInRow, tempDir } from '../support/lets.ts';
import { backlog, fail, json, lookup, LOOKUP_ONE, PROJECT } from './github.ts';

const FIND: StandInRow = { args: ['issue', 'list', '--state', 'open', '--search'], prefix: true, ...json([]) };

test('a result is one JSON object and a newline, and exits 0', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND]);
  const result = await b.lets('find', 'fix-typo');
  assert.equal(result.code, 0, result.output);
  assert.match(result.stdout, /^\{.*\}\n$/);
  assert.deepEqual(b.json(result), { issues: [] });
});

test('the Project lookup runs first, as the skills ran it', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE, FIND]);
  const result = await b.lets('find', 'fix-typo');
  assert.equal(result.code, 0, result.output);
  const [first] = b.calls();
  assert.deepEqual(first.slice(0, 6), ['api', 'graphql', '-F', 'owner={owner}', '-F', 'name={repo}']);
  const query = first[first.indexOf('-f') + 1];
  assert.ok(query.startsWith('query=query($owner: String!, $name: String!) {'));
  assert.ok(query.includes('projectsV2(first: 100) { nodes { number title url closed'));
  assert.ok(query.includes('repositories(first: 100) { nodes { nameWithOwner } }'));
  const jq = first[first.indexOf('--jq') + 1];
  assert.ok(jq.includes('select(.closed | not)'));
  assert.ok(jq.includes('unique_by(.owner, .number)'));
});

test('no Project is no-backlog, names lets-setup-backlog, and exits 1', async (t) => {
  const b = backlog(t, [lookup([]), FIND]);
  const result = await b.lets('find', 'fix-typo');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'no-backlog');
  assert.match(out.message, /lets-setup-backlog/);
  assert.equal(b.calls().length, 1);
});

test('two Projects are several-backlogs, with each title and URL, and nothing else runs', async (t) => {
  const other = { number: 9, title: 'Roadmap', url: 'https://github.com/orgs/acme/projects/9', owner: 'acme' };
  const b = backlog(t, [lookup([PROJECT, other]), { args: ['issue'], prefix: true, ...json({}) }]);
  const result = await b.lets('claim', '136');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'several-backlogs');
  assert.deepEqual(out.projects, [
    { title: 'Backlog', url: PROJECT.url },
    { title: 'Roadmap', url: other.url },
  ]);
  assert.match(out.message, /unlink/i);
  assert.equal(b.calls().length, 1);
});

test('gh failing is backend-failed with gh\'s error, and exits 1', async (t) => {
  const b = backlog(t, [{ args: ['api', 'graphql'], prefix: true, ...fail('To get started with GitHub CLI, please run:  gh auth login') }]);
  const result = await b.lets('ready');
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'backend-failed');
  assert.match(out.message, /gh auth login/);
});

test('gh that cannot start is backend-failed', async (t) => {
  // With an empty PATH, git cannot start either, so lets finds no
  // repository and reads only the user's lets config, which is absent.
  const b = backlog(t, []);
  const result = await runLets(['backlog', 'ready'], { cwd: b.repo, env: { PATH: tempDir(t) } });
  assert.equal(result.code, 1, result.output);
  const out = b.json(result);
  assert.equal(out.error, 'backend-failed');
  assert.match(out.message, /gh/);
});

test('a read that gh answers with something other than JSON is backend-failed', async (t) => {
  const b = backlog(t, [{ args: ['api', 'graphql'], prefix: true, stdout: 'not json' }]);
  const result = await b.lets('ready');
  assert.equal(result.code, 1, result.output);
  assert.equal(b.json(result).error, 'backend-failed');
});

test('a usage error exits 2 and prints nothing on stdout', async (t) => {
  const cases = [
    ['item'],
    ['item', ''],
    ['claim', ''],
    ['claim'],
    ['release', '149'],
    ['release', '1.5'],
    ['find'],
    ['ready', '--bogus'],
    ['ready', '--only', ''],
    ['ready', '--exclude', '1,,2'],
    ['ready', 'extra'],
    ['frobnicate'],
    [],
  ];
  for (const args of cases) {
    const b = backlog(t, [...LOOKUP_ONE]);
    const result = await b.lets(...args);
    assert.equal(result.code, 2, args.join(' '));
    assert.equal(result.stdout, '', args.join(' '));
    assert.deepEqual(b.calls(), [], args.join(' '));
  }
});

test('-V inside a lets backlog command is a word, not the version flag', async (t) => {
  const b = backlog(t, [...LOOKUP_ONE]);
  const result = await b.lets('item', '5', '-V');
  assert.equal(result.code, 2, result.output);
  assert.equal(result.stdout, '');
  assert.deepEqual(b.calls(), []);
});
