import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { SessionFailed, SpawnError, TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, CONFIG, PROMPT_FILE, REPO_CONFIG } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'build', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

// commandDeps whose config lists t3, which runs steps, and more as given.
const withT3 = (over: Parameters<typeof commandDeps>[0] = {}) =>
  commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', ...over, adapters: { t3: {}, ...over.adapters } });
type Calls = ReturnType<typeof commandDeps>['adapterCalls'];
const steps = (calls: Calls) => calls('step').map(([name, , call]) => ({ name, ...(call as { input: object; options: object }) }));
const finishes = (calls: Calls) => calls('finish').map(([name, , call]) => ({ name, ...(call as { handle: object; ok: boolean; options: object }) }));
// A final message that ends with a step-report block holding yaml.
const ending = (yaml: string) => `Prose.\n\n\`\`\`step-report\n${yaml}\`\`\`\n`;
const NEEDS_INPUT = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n  - question: Split it?\n    recommendation: no\n');
// stdout's one line, read as JSON.
const report = (t: ReturnType<typeof commandDeps>) => {
  assert.equal(t.stdout().split('\n').length, 2, 'one line on stdout');
  return JSON.parse(t.stdout());
};

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'build', 'the record still ends stderr');
});

test('a bad --model is exit 2, naming it, and no resolver is asked', async () => {
  const t = withT3();
  assert.equal(await run(options({ models: ['gpt', 'llama/llama-4'] }), t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /llama\/llama-4/);
  assert.deepEqual(t.adapterCalls(), []);
});

test('a name lets does not know in the config is exit 2, naming it and the file', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [codex] }\n' });
  assert.equal(await run(options(), t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), new RegExp(`${CONFIG}.*codex`));
  assert.deepEqual(t.adapterCalls(), []);
});

test('the step guidance is not read by run, even one that is not a string', async () => {
  const t = withT3({ config: 'version: 3\ndelegate:\n  resolvers: [t3]\n  step:\n    build:\n      guidance: 42\n' });
  assert.equal(await run(options(), t.deps), 0);
});

test('a chain where every resolver declines a step is exit 2, naming the config file', async () => {
  const t = withT3({ adapters: { t3: { steps: false } } });
  assert.equal(await run(options(), t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), new RegExp(`every resolver declined.*${CONFIG}`));
});

test('a resolver that runs no step passes it down the chain', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3, cli] }\n', adapters: { t3: { steps: false }, cli: {} } });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(steps(t.adapterCalls).map(({ name }) => name), ['cli']);
});

test('a refused model passes to the next one on the same resolver', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra'] } } });
  assert.equal(await run(options({ models: ['gpt/gpt-6-astra', 'gemini'] }), t.deps), 0);
  assert.deepEqual(steps(t.adapterCalls).map(({ input }) => (input as { family: string }).family), ['gpt', 'gemini']);
  assert.equal(report(t).outcome, 'done');
});

test('a step whose every model is refused is exit 3, naming each model', async () => {
  const t = withT3({ adapters: { t3: { refuse: ['gpt/gpt-6-astra', 'gemini'] } } });
  assert.equal(await run(options({ models: ['gpt/gpt-6-astra', 'gemini'] }), t.deps), 3);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /^lets delegate: gpt\/gpt-6-astra: .*\ngemini: /m);
});

test('a refusal never moves down the chain', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3, cli] }\n', adapters: { t3: { refuse: ['gpt/gpt-6-luna'] }, cli: {} } });
  assert.equal(await run(options(), t.deps), 3);
  assert.deepEqual(steps(t.adapterCalls).map(({ name }) => name), ['t3']);
});

test('an unexpected failure inside the resolver is exit 4 with its message', async () => {
  for (const error of [new Error('boom'), new SpawnError('boom')]) {
    const t = withT3({ adapters: { t3: { step: error } } });
    assert.equal(await run(options(), t.deps), 4);
    assert.equal(t.stdout(), '');
    assert.match(t.stderr(), /boom/);
  }
});

test('a session past its time is exit 6', async () => {
  const t = withT3({ adapters: { t3: { step: new TimeoutError('no answer after 120 minutes') } } });
  assert.equal(await run(options(), t.deps), 6);
  assert.equal(t.stdout(), '');
});

// commandDeps with t3, the prompt file, and an answers file /repo/a.yaml
// holding answers, when given.
const withAnswersFile = (answers?: string) =>
  withT3({ files: { [PROMPT_FILE]: 'PROMPT TEXT', ...(answers === undefined ? {} : { '/repo/a.yaml': answers }) } });
const sentPrompt = (t: ReturnType<typeof commandDeps>) => (steps(t.adapterCalls)[0].input as { prompt: string }).prompt;

test('--answers-file sends the prompt followed by the answers section', async () => {
  const t = withAnswersFile('- question: Which schema?\n  answer: lets-minimal\n');
  assert.equal(await run(options({ answersFile: 'a.yaml' }), t.deps), 0);
  assert.equal(sentPrompt(t),
    'PROMPT TEXT\n\n## Answers\n\nThese questions from the last step report are settled. Do not ask them again.\n\n- Q: Which schema?\n  A: lets-minimal\n');
});

test('without --answers-file, the prompt is sent unchanged', async () => {
  const t = withAnswersFile();
  await run(options(), t.deps);
  assert.equal(sentPrompt(t), 'PROMPT TEXT');
});

for (const [name, answers] of [['missing', undefined], ['a mapping', 'question: Which?\nanswer: x\n'], ['empty', '[]\n'], ['blank', '- question: Which?\n  answer: "  "\n']] as const) {
  test(`an answers file that is ${name} is exit 2, naming --answers-file, and no resolver is asked`, async () => {
    const t = withAnswersFile(answers);
    assert.equal(await run(options({ answersFile: 'a.yaml' }), t.deps), 2);
    assert.equal(t.stdout(), '');
    assert.match(t.stderr(), /--answers-file a\.yaml/);
    assert.deepEqual(t.adapterCalls(), []);
  });
}

test('with no config, the default saves the composed prompt and is exit 3', async () => {
  const t = commandDeps({ files: { [PROMPT_FILE]: 'Run plan on x', '/repo/a.yaml': '- question: Which schema?\n  answer: lets-minimal\n' } });
  assert.equal(await run(options({ for: 'plan', name: 'plan-x', models: ['claude'], answersFile: 'a.yaml' }), t.deps), 3);
  assert.equal(t.stdout(), '');
  const saved = t.savedFile('.workspace/lets-delegate/plan-x.prompt.md');
  assert.ok(saved?.startsWith('Run plan on x\n') && saved.includes('Which schema?') && saved.includes('lets-minimal'), saved ?? 'no file');
  assert.match(t.stderr(), /no resolver.*subagent.*\.workspace\/lets-delegate\/plan-x\.prompt\.md/);
  assert.doesNotMatch(t.stderr(), /installed/);
});

test('a step asks the repository\'s chain in place of the user\'s', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', repoConfig: 'version: 3\ndelegate: { resolvers: [cli] }\n', adapters: { t3: {}, cli: {} } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(JSON.parse(t.stderr()).resolver, 'cli');
});

test('a bad resolver in the repository\'s lets config stops a step, naming that file', async () => {
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3] }\n', repoConfig: 'version: 3\ndelegate: { resolvers: [codex] }\n' });
  assert.equal(await run(options(), t.deps), 2);
  assert.match(t.stderr(), new RegExp(`${REPO_CONFIG}.*codex`));
});

// --exit-file: how a background step ended, for lets delegate step wait.
const EXIT_FILE = '/repo/.workspace/lets-delegate/build-x.exit.json';

test('--exit-file records exit 0 and the clock once a done report is printed', async () => {
  const t = withT3();
  t.io.now = () => 1700;
  assert.equal(await run(options({ exitFile: EXIT_FILE }), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.equal(t.io.files.get(EXIT_FILE), '{"exit":0,"endedAt":1700}\n');
});

test('--exit-file records exit 2 when the prompt file cannot be read', async () => {
  const t = withT3({ files: {} });
  assert.equal(await run(options({ exitFile: EXIT_FILE }), t.deps), 2);
  assert.equal(t.io.files.get(EXIT_FILE), '{"exit":2,"endedAt":0}\n');
});

test('--exit-file is read from the working directory', async () => {
  const t = withT3();
  await run(options({ exitFile: 'e.json' }), t.deps);
  assert.equal(t.io.files.get('/repo/e.json'), '{"exit":0,"endedAt":0}\n');
});

test('without --exit-file, no exit file is written', async () => {
  const t = withT3();
  await run(options(), t.deps);
  assert.deepEqual([...t.io.files.keys()].filter((path) => path.endsWith('.exit.json')), []);
});

test('step run --help does not name --exit-file', async () => {
  const entry = fileURLToPath(new URL('../../../lets/bin/lets', import.meta.url));
  const help = execFileSync(process.execPath, [entry, 'delegate', 'step', 'run', '--help'], { encoding: 'utf8' });
  assert.match(help, /--answers-file/);
  assert.doesNotMatch(help, /exit-file/);
});
