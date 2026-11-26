// lets backlog waves, run as a program against a stand-in gh.
import assert from 'node:assert/strict';
import { type TestContext, test } from 'node:test';
import type { StandInRow } from '../support/lets.ts';
import { backlog, fail, itemList, json, LOOKUP_ONE, REPO } from './github.ts';

const url = (n: number, repo = REPO) => `https://github.com/${repo}/issues/${n}`;
// A blocker as gh issue view prints it, open unless said otherwise.
const blocker = (n: number, { state = 'OPEN', repo = REPO } = {}) => ({ number: n, title: `story-${n}`, state, url: url(n, repo), repository: { nameWithOwner: repo } });
// gh's answer to issue view <n>, for an issue whose Relevant code names paths.
const view = (n: number, paths: string[], blockedBy: unknown[] = []): StandInRow => ({
  args: ['issue', 'view', String(n)], prefix: true, ...json({
    number: n, title: `story-${n} — outcome`, url: url(n), state: 'OPEN', assignees: [], parent: null, subIssues: [], blockedBy,
    body: `## Context\n\n- **Relevant code**: ${paths.length === 0 ? 'new' : paths.map((path) => `\`${path}\``).join(', ')} (*a section*)\n`,
  }),
});
const keysOf = (out: { waves: { stories: { key: string }[] }[] }) => out.waves.map(({ stories }) => stories.map(({ key }) => key));

// lets backlog waves <args>, where gh answers views, and the Project holds no item.
async function waves(t: TestContext, views: StandInRow[], ...args: string[]) {
  const b = backlog(t, [...LOOKUP_ONE, ...views, itemList([])]);
  const result = await b.lets('waves', ...args);
  return { result, calls: b.calls(), out: () => b.json(result) };
}

test('waves prints two independent items in one wave', async (t) => {
  const { result } = await waves(t, [view(283, ['skills/lets-shape/SKILL.md']), view(285, ['lets/src/backlog/commands.ts'])], '--only', '283,285');
  assert.equal(result.code, 0, result.output);
  assert.equal(result.stdout, '{"waves":[{"stories":[{"key":"283","label":"#283","waitsFor":null,"reason":null},{"key":"285","label":"#285","waitsFor":null,"reason":null}]}]}\n');
});

test('waves reads each named item once, in --only\'s order', async (t) => {
  const { result, calls } = await waves(t, [view(283, ['a/one.ts']), view(285, ['b/two.ts'])], '--only', '285,283,285');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(calls.filter((args) => args[1] === 'view').map((args) => args[2]), ['285', '283']);
});

test('waves holds a key named twice once', async (t) => {
  const { out } = await waves(t, [view(283, ['a/one.ts'])], '--only', '283,283');
  assert.deepEqual(keysOf(out()), [['283']]);
});

test('waves with no --only is a usage error', async (t) => {
  const { result } = await waves(t, []);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
});

test('waves with an empty key is a usage error', async (t) => {
  const { result } = await waves(t, [], '--only', '283,');
  assert.equal(result.code, 2);
  assert.equal(result.stdout, '');
});

test('waves on an item that does not exist is not-found', async (t) => {
  const { result, out } = await waves(t, [
    view(283, ['a/one.ts']),
    { args: ['issue', 'view', '99999'], prefix: true, ...fail('GraphQL: Could not resolve to an issue or pull request with the number of 99999. (repository.issue)') },
  ], '--only', '283,99999');
  assert.equal(result.code, 1, result.output);
  assert.equal(out().error, 'not-found');
});

test('waves on text that is not a key is not-found', async (t) => {
  const { result, out } = await waves(t, [view(283, ['a/one.ts'])], '--only', '283,abc');
  assert.equal(result.code, 1, result.output);
  assert.equal(out().error, 'not-found');
});

test('waves writes nothing', async (t) => {
  const { result, calls } = await waves(t, [view(1, ['a/one.ts']), view(2, ['b/two.ts'], [blocker(1)])], '--only', '1,2');
  assert.equal(result.code, 0, result.output);
  const reads = [['api', 'graphql'], ['issue', 'view'], ['issue', 'list'], ['project', 'item-list']];
  for (const call of calls) assert.ok(reads.some((read) => read.every((arg, i) => call[i] === arg)), call.join(' '));
});

test('waves orders a chain of blockers', async (t) => {
  const { out } = await waves(t, [view(1, ['a/one.ts']), view(2, ['b/two.ts'], [blocker(1)]), view(3, ['c/three.ts'], [blocker(2)])], '--only', '1,2,3');
  assert.deepEqual(keysOf(out()), [['1'], ['2'], ['3']]);
  assert.deepEqual(out().waves[1].stories[0], { key: '2', label: '#2', waitsFor: { key: '1', label: '#1' }, reason: 'blocked by #1' });
});

test('waves orders nothing through an issue it does not name', async (t) => {
  const { out } = await waves(t, [view(1, ['a/one.ts']), view(3, ['c/three.ts'], [blocker(2)])], '--only', '1,3');
  assert.deepEqual(keysOf(out()), [['1', '3']]);
});

test('waves does not count a closed blocker', async (t) => {
  const { out } = await waves(t, [view(1, ['a/one.ts']), view(2, ['b/two.ts'], [blocker(1, { state: 'CLOSED' })])], '--only', '1,2');
  assert.deepEqual(keysOf(out()), [['1', '2']]);
});

test('waves does not count a blocker in another repository with the same number', async (t) => {
  const { out } = await waves(t, [view(7, ['a/seven.ts']), view(9, ['b/nine.ts'], [blocker(7, { repo: 'acme/lib' })])], '--only', '7,9');
  assert.deepEqual(keysOf(out()), [['7', '9']]);
});

test('waves reads the paths from each item\'s Relevant code', async (t) => {
  const { out } = await waves(t, [view(283, ['skills/lets-go/references/shape.md']), view(287, ['skills/lets-go/references/shape.md'])], '--only', '283,287');
  assert.deepEqual(out().waves[1].stories[0].reason, 'both name skills/lets-go/references/shape.md');
});
