import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/go/questions.ts';
import { commandDeps } from '../delegate/fixtures/command-deps.ts';

test('questions prints the question mode the config sets as one JSON line', async () => {
  for (const questions of ['ask', 'auto']) {
    const t = commandDeps({ config: `version: 3\ngo:\n  questions: ${questions}\n` });
    assert.equal(await run(t.deps), 0);
    assert.equal(t.stdout(), `{"questions":"${questions}"}\n`, questions);
  }
});

test('questions prints a null question mode when no config file exists', async () => {
  const t = commandDeps();
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"questions":null}\n');
});

test('questions prints a null question mode when the config sets none', async () => {
  for (const yaml of ['delegate:\n  resolvers: [subagent]\n', 'go:\n', 'go:\n  questions: null\n', 'go:\n  verbose: true\n', 'go:\n  level: recommend\n']) {
    const t = commandDeps({ config: `version: 3\n${yaml}` });
    assert.equal(await run(t.deps), 0, yaml);
    assert.equal(t.stdout(), '{"questions":null}\n', yaml);
  }
});

test('questions reads the file under XDG_CONFIG_HOME', async () => {
  const t = commandDeps({ files: { '/cfg/lets/config.yaml': 'version: 3\ngo:\n  questions: auto\n' } });
  t.deps.env = { XDG_CONFIG_HOME: '/cfg' };
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"questions":"auto"}\n');
});

test('questions ignores a delegate chain the delegate commands would reject', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate:\n  resolvers: [codex]\ngo:\n  questions: ask\n  verbose: true\n' });
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"questions":"ask"}\n');
});

test('questions asks no resolver', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate:\n  resolvers: [t3]\ngo:\n  questions: auto\n', adapters: { t3: {} } });
  await run(t.deps);
  assert.deepEqual(t.adapterCalls(), []);
});

test('a bad config exits 2 with one lets go line that names the file and the key', async () => {
  const cases: [string, string][] = [
    ['version: 3\ngo:\n  questions: loud\n', 'go.questions must be ask or auto, got "loud"'],
    ['version: 3\ngo:\n  questions: [ask]\n', 'go.questions'],
    ['version: 3\ngo: auto\n', 'go must be a mapping'],
    ['version: 2\ngo:\n  questions: ask\n', 'version must be 3'],
  ];
  for (const [config, named] of cases) {
    const t = commandDeps({ config });
    assert.equal(await run(t.deps), 2, config);
    assert.equal(t.stdout(), '', config);
    assert.match(t.stderr(), /^lets go: \/home\/u\/\.config\/lets\/config\.yaml: [^\n]*\n$/, config);
    assert.ok(t.stderr().includes(named), config);
  }
});
