import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkConfig, guidanceFor, mergeDocuments, parseDocument, readConfig, readLetsConfig } from '../../../lets/src/delegate/config.ts';
import { UsageError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps } from './fixtures/command-deps.ts';
import { fakeIo } from './fixtures/fake-io.ts';

const HOME_CONFIG = '/home/u/.config/lets/config.yaml';

// The deps readConfig takes, outside any Git repository, with a user's lets
// config holding text, when given.
const configIn = async (deps: ReturnType<typeof depsWith>) => (await readConfig(deps)).config;
function depsWith(text?: string, env: Record<string, string> = {}) {
  const path = env.XDG_CONFIG_HOME ? `${env.XDG_CONFIG_HOME}/lets/config.yaml` : HOME_CONFIG;
  const files: Record<string, string> = text === undefined ? {} : { [path]: text };
  return { env, cwd: '/repo', io: fakeIo({ files, homedir: () => '/home/u' }) };
}

const CONFIG = '/c/config.yaml';
const withDelegate = (yaml: string) => checkConfig(parseDocument(`version: 3\n${yaml}`, CONFIG), () => CONFIG);

test('guidanceFor gives the guidance for the strategy and the intent', () => {
  const config = withDelegate('delegate:\n  review:\n    code:\n      guidance: Use the strongest gpt model.\n');
  assert.equal(guidanceFor(config, 'review', 'code', () => CONFIG), 'Use the strongest gpt model.');
});

test('guidanceFor gives the guidance for a step', () => {
  const config = withDelegate('delegate:\n  step:\n    build:\n      guidance: Use claude/claude-opus-5-5.\n');
  assert.equal(guidanceFor(config, 'step', 'build', () => CONFIG), 'Use claude/claude-opus-5-5.');
});

test('guidanceFor gives a step no guidance from handoff', () => {
  const config = withDelegate('delegate:\n  handoff:\n    apply:\n      guidance: Prefer claude.\n');
  assert.equal(guidanceFor(config, 'step', 'build', () => CONFIG), null);
});

test('guidanceFor keeps a multi-line block whole', () => {
  const config = withDelegate('delegate:\n  handoff:\n    apply:\n      guidance: |\n        First line.\n        Second line.\n');
  assert.equal(guidanceFor(config, 'handoff', 'apply', () => CONFIG), 'First line.\nSecond line.\n');
});

test('guidanceFor gives null when any level is missing', () => {
  assert.equal(guidanceFor(null, 'review', 'code', () => CONFIG), null);
  for (const yaml of ['', 'delegate:\n', 'delegate:\n  review:\n', 'delegate:\n  handoff:\n    apply:\n      guidance: x\n',
    'delegate:\n  review:\n    plan:\n      guidance: x\n', 'delegate:\n  review:\n    code:\n      other: x\n', 'delegate:\n  review:\n    code: {}\n']) {
    assert.equal(guidanceFor(withDelegate(yaml), 'review', 'code', () => CONFIG), null, yaml);
  }
});

test('guidanceFor rejects a bad level, naming the file and the dotted key', () => {
  const cases: [string, string][] = [
    ['delegate:\n  review: [a]\n', 'delegate.review must be a mapping'],
    ['delegate:\n  review:\n    code: text\n', 'delegate.review.code must be a mapping'],
    ['delegate:\n  review:\n    code:\n      guidance: 42\n', 'delegate.review.code.guidance must be a string'],
  ];
  for (const [yaml, key] of cases) {
    assert.throws(() => guidanceFor(withDelegate(yaml), 'review', 'code', () => CONFIG),
      (error) => error instanceof UsageError && error.message.includes(CONFIG) && error.message.includes(key), yaml);
  }
});

test('guidanceFor ignores a bad entry for another intent or the other strategy', () => {
  assert.equal(guidanceFor(withDelegate('delegate:\n  review:\n    plan:\n      guidance: [a, b]\n'), 'review', 'code', () => CONFIG), null);
  assert.equal(guidanceFor(withDelegate('delegate:\n  handoff: 42\n'), 'review', 'code', () => CONFIG), null);
});

const USER = '/home/u/.config/lets/config.yaml';
const REPO = '/repo/.lets/config.yaml';
// The two files merged, each document given as YAML text, or null for no file.
const merged = (user: string | null, repo: string | null) => mergeDocuments(
  { path: USER, document: user === null ? null : parseDocument(`version: 3\n${user}`, USER) },
  { path: REPO, document: repo === null ? null : parseDocument(`version: 3\n${repo}`, REPO) },
);

test('mergeDocuments merges mappings key by key, at every depth', () => {
  const { document } = merged('delegate:\n  review:\n    plan:\n      guidance: Prefer gpt.\n    code:\n      guidance: Prefer claude.\n',
    'delegate:\n  review:\n    code:\n      guidance: Use gemini.\n');
  assert.deepEqual(document, { version: 3, delegate: { review: { plan: { guidance: 'Prefer gpt.' }, code: { guidance: 'Use gemini.' } } } });
});

test('mergeDocuments lets a repository string, number or list replace the user\'s value whole', () => {
  const { document } = merged('go:\n  questions: ask\nbacklog:\n  provider: jira\ndelegate:\n  resolvers: [t3, subagent]\n  review: { code: { guidance: x } }\n',
    'go:\n  questions: auto\nbacklog: 7\ndelegate:\n  resolvers: [cli]\n  review: [a]\n');
  assert.deepEqual(document, { version: 3, go: { questions: 'auto' }, backlog: 7, delegate: { resolvers: ['cli'], review: ['a'] } });
});

test('fileOf names the repository\'s lets config below a value the repository replaced whole', () => {
  const { fileOf } = merged('delegate:\n  review:\n    code:\n      guidance: x\n', 'delegate:\n  review: [a]\n');
  assert.equal(fileOf('delegate.review.code.guidance'), REPO);
});

test('fileOf names the user\'s lets config for a value the user set, or that neither file sets', () => {
  const { fileOf } = merged('delegate:\n  resolvers: [t3]\n', 'delegate:\n  review:\n    code:\n      guidance: x\n  resolvers: null\n');
  assert.equal(fileOf('delegate.resolvers'), USER);
  assert.equal(fileOf('delegate.review.plan.guidance'), USER);
  assert.equal(fileOf('go.questions'), USER);
  assert.equal(merged(null, null).fileOf('go.questions'), USER);
});

test('readLetsConfig reads the repository\'s lets config at the repository root, over the user\'s', async () => {
  const t = commandDeps({ config: 'version: 3\ngo:\n  questions: ask\ndelegate:\n  resolvers: [t3]\n', repoConfig: 'version: 3\ngo:\n  questions: auto\n' });
  const { document, fileOf } = await readLetsConfig(t.deps);
  assert.deepEqual(document, { version: 3, go: { questions: 'auto' }, delegate: { resolvers: ['t3'] } });
  assert.equal(fileOf('go.questions'), REPO);
  assert.equal(fileOf('delegate.resolvers'), USER);
});
