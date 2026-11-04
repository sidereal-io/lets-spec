import assert from 'node:assert/strict';
import { test } from 'node:test';
import { run } from '../../../lets/src/delegate/step.ts';
import type { StepOptions } from '../../../lets/src/delegate/step.ts';
import { SessionFailed, SpawnError, TimeoutError } from '../../../lets/src/resolvers/kit/errors.ts';
import { commandDeps, CONFIG, PROMPT_FILE } from './fixtures/command-deps.ts';

const options = (over: Partial<StepOptions> = {}): StepOptions =>
  ({ for: 'apply', name: 'Build X', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'], ...over });

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

test('the resolver is asked for a step session with the normalized name, the prompt, the root, the model and the effort', async () => {
  const t = withT3();
  await run(options(), t.deps);
  assert.deepEqual(steps(t.adapterCalls), [{
    name: 't3',
    input: { name: 'build-x', prompt: 'PROMPT TEXT', cwd: '/repo', family: 'gpt', model: 'gpt-6-luna', effort: 'high' },
    options: { timeoutMs: 120 * 60000 },
  }]);
});

test('a step has 120 minutes at every effort', async () => {
  for (const effort of ['low', 'medium', 'high'] as const) {
    const t = withT3();
    await run(options({ effort }), t.deps);
    assert.deepEqual(steps(t.adapterCalls)[0].options, { timeoutMs: 120 * 60000 }, effort);
  }
});

test('--timeout-minutes sets the step\'s time limit', async () => {
  const t = withT3();
  await run(options({ timeoutMinutes: 30 }), t.deps);
  assert.deepEqual(steps(t.adapterCalls)[0].options, { timeoutMs: 30 * 60000 });
});

test('a done report is printed with the clock\'s date', async () => {
  const t = withT3();
  t.io.now = () => Date.parse('2026-11-04T09:30:00Z');
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"done",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'done', evidence: ['commit 3f2a1c0'], date: '2026-11-04T09:30:00Z' });
});

test('the record on stderr names the session that ran the step', async () => {
  const t = withT3();
  assert.equal(await run(options({ for: 'propose', models: ['claude/claude-opus-5-5'] }), t.deps), 0);
  assert.equal(t.stderr().split('\n').length, 2, 'one line on stderr');
  assert.ok(t.stderr().startsWith('{"for":"propose",'), t.stderr());
  assert.deepEqual(JSON.parse(t.stderr()), {
    for: 'propose', resolver: 't3', family: 'claude', model: 'claude-opus-5-5', handle: { kind: 't3', id: 't3-1' }, durationSeconds: 0,
  });
  assert.deepEqual(Object.keys(JSON.parse(t.stderr())), ['for', 'resolver', 'family', 'model', 'handle', 'durationSeconds']);
});

test('a bare family is the record\'s model', async () => {
  const t = withT3();
  await run(options({ models: ['claude'] }), t.deps);
  assert.equal(JSON.parse(t.stderr()).model, 'claude');
});

test('a needs-input report is printed at exit 0, its questions in order', async () => {
  const t = withT3({ adapters: { t3: { step: { text: NEEDS_INPUT } } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"needs-input",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'needs-input', questions: [{ question: 'Which schema?' }, { question: 'Split it?', recommendation: 'no' }] });
});

test('a failed report from the session is printed at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: { text: ending('outcome: failed\nreason: tests fail on main\n') } } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.ok(t.stdout().startsWith('{"outcome":"failed",'), t.stdout());
  assert.deepEqual(report(t), { outcome: 'failed', reason: 'tests fail on main' });
});

test('a final message with no report is a failed report holding the message, at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: { text: 'I stopped.' } } } });
  assert.equal(await run(options(), t.deps), 0);
  const { outcome, reason, message } = report(t);
  assert.deepEqual({ outcome, message }, { outcome: 'failed', message: 'I stopped.' });
  assert.match(reason, /step-report/);
});

test('a session the resolver reports failed is a failed report with its reason, at exit 0', async () => {
  const t = withT3({ adapters: { t3: { step: new SessionFailed('the session stopped to ask') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(report(t), { outcome: 'failed', reason: 'the session stopped to ask' });
});

test('a session the resolver reports failed has no handle to finish', async () => {
  const t = withT3({ adapters: { t3: { step: new SessionFailed('the session stopped to ask') } } });
  await run(options(), t.deps);
  assert.deepEqual(t.adapterCalls('finish'), []);
  assert.equal(JSON.parse(t.stderr()).handle, null);
});

test('a done step is finished with ok, by the resolver that made it', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } } } } });
  await run(options(), t.deps);
  assert.deepEqual(finishes(t.adapterCalls), [{ name: 't3', handle: { kind: 'thread', id: 't-1' }, ok: true, options: { cwd: '/repo' } }]);
});

test('a step that did not end done is finished without ok', async () => {
  for (const text of [NEEDS_INPUT, ending('outcome: failed\nreason: no\n'), 'no report']) {
    const t = withT3({ adapters: { t3: { step: { text } } } });
    await run(options(), t.deps);
    assert.deepEqual(finishes(t.adapterCalls).map(({ ok }) => ok), [false], text);
  }
});

test('a finish that fails is reported, and the report stands', async () => {
  const t = withT3({ adapters: { t3: { step: { handle: { kind: 'thread', id: 't-1' } }, finish: new Error('thread gone') } } });
  assert.equal(await run(options(), t.deps), 0);
  assert.equal(report(t).outcome, 'done');
  assert.match(t.stderr(), /could not finish thread t-1: thread gone/);
  assert.equal(JSON.parse(t.stderr().trim().split('\n').at(-1)!).for, 'apply', 'the record still ends stderr');
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
  const t = withT3({ config: 'version: 3\ndelegate:\n  resolvers: [t3]\n  step:\n    apply:\n      guidance: 42\n' });
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

test('a step runs no git status, and files the session changed do not count', async () => {
  const t = withT3({ gitAfter: ' M lets/src/main.ts\0' });
  assert.equal(await run(options(), t.deps), 0);
  assert.deepEqual(t.io.calls.map(([, args]) => (args as string[])[0]), ['rev-parse']);
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
  const t = commandDeps({ files: { [PROMPT_FILE]: 'Run propose on x', '/repo/a.yaml': '- question: Which schema?\n  answer: lets-minimal\n' } });
  assert.equal(await run(options({ for: 'propose', name: 'plan-x', models: ['claude'], answersFile: 'a.yaml' }), t.deps), 3);
  assert.equal(t.stdout(), '');
  const saved = t.savedFile('.workspace/lets-delegate/plan-x.prompt.md');
  assert.ok(saved?.startsWith('Run propose on x\n') && saved.includes('Which schema?') && saved.includes('lets-minimal'), saved ?? 'no file');
  assert.match(t.stderr(), /no resolver.*subagent.*\.workspace\/lets-delegate\/plan-x\.prompt\.md/);
  assert.doesNotMatch(t.stderr(), /installed/);
});
