import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/go/level.ts';
import { commandDeps } from '../delegate/fixtures/command-deps.ts';

test('level prints the level the config sets as one JSON line', async () => {
  for (const level of ['ask', 'recommend']) {
    const t = commandDeps({ config: `version: 3\ngo:\n  level: ${level}\n` });
    assert.equal(await run(t.deps), 0);
    assert.equal(t.stdout(), `{"level":"${level}"}\n`, level);
  }
});

test('level prints a null level when no config file exists', async () => {
  const t = commandDeps();
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"level":null}\n');
});

test('level prints a null level when the config sets none', async () => {
  for (const yaml of ['delegate:\n  resolvers: [subagent]\n', 'go:\n', 'go:\n  level: null\n', 'go:\n  verbose: true\n']) {
    const t = commandDeps({ config: `version: 3\n${yaml}` });
    assert.equal(await run(t.deps), 0, yaml);
    assert.equal(t.stdout(), '{"level":null}\n', yaml);
  }
});

test('level reads the file under XDG_CONFIG_HOME', async () => {
  const t = commandDeps({ files: { '/cfg/lets/config.yaml': 'version: 3\ngo:\n  level: recommend\n' } });
  t.deps.env = { XDG_CONFIG_HOME: '/cfg' };
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"level":"recommend"}\n');
});

test('level ignores a delegate chain the delegate commands would reject', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate:\n  resolvers: [codex]\ngo:\n  level: ask\n  verbose: true\n' });
  assert.equal(await run(t.deps), 0);
  assert.equal(t.stdout(), '{"level":"ask"}\n');
});

test('level asks no resolver', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate:\n  resolvers: [t3]\ngo:\n  level: recommend\n', adapters: { t3: {} } });
  await run(t.deps);
  assert.deepEqual(t.adapterCalls(), []);
});

test('a bad config exits 2 with one lets go line that names the file and the key', async () => {
  const cases: [string, string][] = [
    ['version: 3\ngo:\n  level: loud\n', 'go.level must be ask or recommend, got "loud"'],
    ['version: 3\ngo:\n  level: [ask]\n', 'go.level'],
    ['version: 3\ngo: recommend\n', 'go must be a mapping'],
    ['version: 2\ngo:\n  level: ask\n', 'version must be 3'],
  ];
  for (const [config, named] of cases) {
    const t = commandDeps({ config });
    assert.equal(await run(t.deps), 2, config);
    assert.equal(t.stdout(), '', config);
    assert.match(t.stderr(), /^lets go: \/home\/u\/\.config\/lets\/config\.yaml: [^\n]*\n$/, config);
    assert.ok(t.stderr().includes(named), config);
  }
});
