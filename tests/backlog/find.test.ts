// lets backlog find, run as a program against a stand-in gh.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import { backlog, json, LOOKUP_ONE } from './github.ts';

// lets backlog find <args>, with a title search that finds found.
async function find(t: TestContext, args: string[], found: unknown[] = []) {
  const b = backlog(t, [...LOOKUP_ONE, { args: ['issue', 'list', '--state', 'open', '--search'], prefix: true, ...json(found) }]);
  const result = await b.lets('find', ...args);
  assert.equal(result.code, 0, result.output);
  return { out: b.json(result), calls: b.calls() };
}

test('find returns the open issues whose titles match, unfiltered', async (t) => {
  const found = [
    { number: 136, title: 'github-backlog-build — Take an existing GitHub story through the shared backlog boundary' },
    { number: 236, title: 'config backlogs follow github-backlog-build' },
  ];
  const { out, calls } = await find(t, ['github-backlog-build'], found);
  assert.deepEqual(out, { issues: [
    { key: '136', label: '#136', title: found[0].title },
    { key: '236', label: '#236', title: found[1].title },
  ] });
  assert.deepEqual(calls[1], ['issue', 'list', '--state', 'open', '--search', 'github-backlog-build in:title', '--json', 'number,title']);
});

test('find joins several words into one search', async (t) => {
  const { calls } = await find(t, ['add', 'a', '--quiet', 'flag']);
  assert.equal(calls[1][5], 'add a --quiet flag in:title');
});

test('no match is an empty list, and exits 0', async (t) => {
  const { out } = await find(t, ['nothing-like-this']);
  assert.deepEqual(out, { issues: [] });
});

test('find searches words after -- as words, even one that looks like a flag', async (t) => {
  const { out, calls } = await find(t, ['--', '--help']);
  assert.deepEqual(out, { issues: [] });
  assert.deepEqual(calls[1], ['issue', 'list', '--state', 'open', '--search', '--help in:title', '--json', 'number,title']);
});

test('--version inside lets backlog find is a word, not the version flag', async (t) => {
  const { out, calls } = await find(t, ['fix', '--version', 'bump']);
  assert.deepEqual(out, { issues: [] });
  assert.deepEqual(calls[1], ['issue', 'list', '--state', 'open', '--search', 'fix --version bump in:title', '--json', 'number,title']);
});
