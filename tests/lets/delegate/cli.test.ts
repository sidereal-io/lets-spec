import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ENTRY = fileURLToPath(new URL('../../../lets/bin/lets', import.meta.url));

// Runs the dev entry and resolves with its output and exit code.
function lets(...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return letsIn({}, ...args);
}

// Runs the dev entry in a folder, with more in its environment.
function letsIn({ cwd, env = {} }: { cwd?: string; env?: Record<string, string> }, ...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((done) => {
    execFile(process.execPath, [ENTRY, ...args], { cwd, env: { ...process.env, ...env } }, (error, stdout, stderr) => {
      done({ stdout, stderr, code: error ? (error.code as number) : 0 });
    });
  });
}

// A code reviewer, as step run starts one.
const REVIEW = ['delegate', 'step', 'run', '--for', 'review-build', '--name', 'x', '--prompt-file', 'p.md', '--source-family', 'claude', '--effort', 'low', '--model', 'gpt'];
// The retired handoff command, as a caller of an earlier lets ran it.
const HANDOFF = ['delegate', 'handoff', 'run', '--for', 'apply', '--name', 'build-x', '--prompt-file', 'p.md', '--model', 'claude'];
const STEP = ['delegate', 'step', 'run', '--for', 'plan', '--name', 'x', '--prompt-file', 'p.md', '--effort', 'high', '--model', 'claude'];

test('every old command is rejected by name', async () => {
  for (const command of ['critique', 'detect', 'setup', 'conformance', 'verify']) {
    const { code, stderr } = await lets('delegate', command);
    assert.equal(code, 2, command);
    assert.match(stderr, new RegExp(`unknown command '${command}'`));
  }
});

test('the review command is gone: run and instructions exit 2, naming it as unknown, and ask no resolver', async () => {
  for (const argv of [
    ['delegate', 'review', 'run', '--for', 'review-build', '--name', 'x', '--prompt-file', 'p.md', '--source-family', 'claude', '--effort', 'low', '--model', 'gpt'],
    ['delegate', 'review', 'instructions', '--for', 'review-build'],
  ]) {
    const r = repo();
    const { code, stdout, stderr } = await letsIn(r, ...argv);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(stdout, '', argv.join(' '));
    assert.match(stderr, /unknown command 'review'/, argv.join(' '));
    assert.equal(existsSync(join(r.cwd, '.workspace')), false, argv.join(' '));
  }
});

test('every old flag is rejected by name', async () => {
  const flags = ['--author', '--source', '--code-review', '--base', '--unattended', '--timeout', '--prompt'];
  const runs = flags.flatMap((flag) => [REVIEW, STEP].map(async (argv) => {
    const { code, stderr } = await lets(...argv, flag, 'v');
    assert.equal(code, 2, `${argv[1]} ${flag}`);
    assert.match(stderr, new RegExp(`unknown option '${flag}'`), `${argv[1]} ${flag}`);
  }));
  await Promise.all(runs);
});

test('a bad family, effort or timeout is a usage error that names it', async () => {
  const cases: [string[], RegExp][] = [
    [['--source-family', 'openai'], /openai/],
    [['--effort', 'max'], /max/],
    [['--timeout-minutes', 'soon'], /whole number of minutes/],
  ];
  await Promise.all(cases.map(async ([extra, message]) => {
    const { code, stderr } = await lets(...REVIEW, ...extra);
    assert.equal(code, 2, extra.join(' '));
    assert.match(stderr, message);
  }));
});

test('each run without --model is a usage error that names it', async () => {
  for (const argv of [REVIEW, STEP]) {
    const { code, stderr } = await lets(...argv.slice(0, -2));
    assert.equal(code, 2, argv[1]);
    assert.match(stderr, /--model/, argv[1]);
  }
});

test('a --model that is not <family> or <family>/<model> is a usage error that names it', async () => {
  for (const argv of [REVIEW, STEP]) {
    for (const model of ['llama/llama-4', 'gpt/', 'GPT']) {
      const { code, stderr } = await lets(...argv.slice(0, -2), '--model', model);
      assert.equal(code, 2, `${argv[1]} ${model}`);
      assert.match(stderr, /--model/, `${argv[1]} ${model}`);
    }
  }
});

test('a missing option is a usage error that names it', async () => {
  const { code, stderr } = await lets('delegate', 'step', 'run', '--for', 'review-build', '--name', 'x');
  assert.equal(code, 2);
  assert.match(stderr, /--prompt-file|--effort|--model/);
});

test('step run --help names --model, and says exit 3 is every model refused and exit 4 an unknown outcome', async () => {
  const text = (await lets('delegate', 'step', 'run', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /--model <family\[\/model\]>/);
  assert.match(text, /3 no fresh session can run here on any model given: the harness or the account said no/);
  assert.match(text, /4 the outcome is unknown/);
  assert.doesNotMatch(text, /broke the contract/);
});

test('neither delegate --help nor step run --help says the default runs codex, claude or agy', async () => {
  for (const argv of [['delegate', '--help'], ['delegate', 'step', 'run', '--help']]) {
    const { stdout } = await lets(...argv);
    assert.doesNotMatch(stdout, /\b(codex|agy)\b/, argv.join(' '));
    assert.doesNotMatch(stdout, /from another model family when one is available/, argv.join(' '));
  }
});

test('delegate --help describes the chain in config.yaml, and names neither setup nor a PATH lookup', async () => {
  const { stdout } = await lets('delegate', '--help');
  const text = stdout.replace(/\s+/g, ' ');
  assert.match(text, /config\.yaml/);
  assert.match(text, /resolvers/);
  assert.match(text, /\bsubagent\b/);
  assert.doesNotMatch(text, /setup/);
  assert.doesNotMatch(text, /lets-delegate-resolver/);
});

test('delegate --help gives the lets config path and a version 4 example', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /\$XDG_CONFIG_HOME\/lets\/config\.yaml/);
  assert.match(text, /~\/\.config\/lets\/config\.yaml/);
  assert.match(text, /version: 4 delegate: resolvers: - t3 - subagent review-build: guidance: .* build: guidance: /);
  assert.doesNotMatch(text, /lets-delegate\/|version: [23]|delegations|delegate\.step|delegate\.<strategy>/);
});

test('delegate --help says the plan reviewer and the review plan step take different keys, and points to the README', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /delegate\.review-plan steers the plan reviewer, while the review plan step's own session takes delegate\.plan; delegate\.review-build and delegate\.build pair the same way\./);
  assert.match(text, /"Set up delegation" in the lets-spec README/);
});

test('delegate --help says review-plan and review-build start a read-only reviewer', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /--for review-plan and --for review-build start a reviewer: a read-only session/);
});

test('delegate --help names story among the intents', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /one of the five steps, or story for a story run/);
});

test('delegate --help lists the resolvers by name, not by path', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /- t3 - subagent/);
  assert.match(text, /t3, cli or subagent/);
  assert.doesNotMatch(text, /absolute path|\/absolute/);
});

test('instructions --help says exit 4 is an unknown outcome', async () => {
  const text = (await lets('delegate', 'step', 'instructions', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /4 the outcome is unknown/);
  assert.doesNotMatch(text, /broke the contract/);
});

test('each run and instructions --help says exit 2 covers every resolver in the config declining', async () => {
  for (const argv of [['delegate', 'step', 'run', '--help'], ['delegate', 'step', 'instructions', '--help']]) {
    const { stdout } = await lets(...argv);
    assert.match(stdout.replace(/\s+/g, ' '), /2 usage error, or every resolver in the config declined/, argv.join(' '));
  }
});

// A git repo with a prompt file, and an empty config folder, so the
// default, subagent, answers. config, when given, is the delegate config.
function repo(config?: string) {
  const cwd = mkdtempSync(join(tmpdir(), 'lets-cli-'));
  execFileSync('git', ['init', '--quiet'], { cwd });
  writeFileSync(join(cwd, 'p.md'), 'PROMPT');
  const home = mkdtempSync(join(tmpdir(), 'lets-cfg-'));
  if (config !== undefined) {
    mkdirSync(join(home, 'lets'));
    writeFileSync(join(home, 'lets', 'config.yaml'), config);
  }
  return { cwd, env: { XDG_CONFIG_HOME: home } };
}

test('with no config, step instructions --for review-plan prints one JSON line from subagent, with no strategy', async () => {
  const { code, stdout } = await letsIn(repo(), 'delegate', 'step', 'instructions', '--for', 'review-plan');
  assert.equal(code, 0);
  assert.equal(stdout, '{"for":"review-plan","resolver":"subagent","options":[],"guidance":null}\n');
});

test('run takes --model more than once, in order', async () => {
  const { code, stderr } = await letsIn(repo(), ...REVIEW.slice(0, -2), '--model', 'gpt/gpt-6-astra', '--model', 'gemini');
  assert.equal(code, 3);
  assert.match(stderr, /gpt\/gpt-6-astra: .*\ngemini: /);
});

test('a run without --for is a usage error that names it', async () => {
  const { code, stdout, stderr } = await letsIn(repo(), 'delegate', 'step', 'run', '--name', 'build-x', '--prompt-file', 'p.md', '--effort', 'high', '--model', 'claude');
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /--for/);
});

test('the old review intent code is a usage error that names --for and the new intents', async () => {
  for (const argv of [['delegate', 'step', 'instructions', '--for', 'code'], [...REVIEW.slice(0, 3), '--for', 'code', ...REVIEW.slice(5)]]) {
    const { code, stdout, stderr } = await letsIn(repo(), ...argv);
    assert.equal(code, 2, argv.join(' '));
    assert.equal(stdout, '', argv.join(' '));
    assert.match(stderr, /--for/, argv.join(' '));
    assert.match(stderr, /review-plan/, argv.join(' '));
    assert.match(stderr, /review-build/, argv.join(' '));
  }
});

test('a resolver listed by path is exit 2, naming it and the config file', async () => {
  const example = '/opt/r/old-resolver';
  const r = repo(`version: 4\ndelegate:\n  resolvers:\n    - ${example}\n    - subagent\n`);
  const { code, stdout, stderr } = await letsIn(r, 'delegate', 'step', 'instructions', '--for', 'review-build');
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.ok(stderr.includes(example), stderr);
  assert.ok(stderr.includes(join(r.env.XDG_CONFIG_HOME, 'lets', 'config.yaml')), stderr);
});

test('a name lets does not know is exit 2, naming it and the three names', async () => {
  const { code, stdout, stderr } = await letsIn(repo('version: 4\ndelegate: { resolvers: [codex] }\n'), ...REVIEW);
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /codex/);
  assert.match(stderr, /t3, cli or subagent/);
});

test('instructions --help names its output and exit codes', async () => {
  const text = (await lets('delegate', 'step', 'instructions', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /one JSON line with for, resolver, options and guidance/);
  assert.doesNotMatch(text, /strategy/);
  assert.match(text, /Exit codes: 0 ok 2 usage error/);
});

test('instructions --help names the guidance key for each intent', async () => {
  const lines = ['--for shape: delegate.shape.guidance', '--for plan: delegate.plan.guidance', '--for review-plan: delegate.review-plan.guidance',
    '--for build: delegate.build.guidance', '--for review-build: delegate.review-build.guidance', '--for story: delegate.story.guidance'];
  const text = (await lets('delegate', 'step', 'instructions', '--help')).stdout;
  for (const named of lines) assert.match(text, new RegExp(`^ +${named.replaceAll('.', '\\.')}$`, 'm'), named);
  assert.doesNotMatch(text, /delegate\.<strategy>/);
});

test('step --help names instructions, run, start and wait', async () => {
  const { code, stdout } = await lets('delegate', 'step', '--help');
  assert.equal(code, 0);
  for (const command of ['instructions', 'run', 'start', 'wait']) assert.match(stdout, new RegExp(`^ {2}${command}\\b`, 'm'), command);
});

test('step --help says review-plan and review-build start a read-only reviewer', async () => {
  const text = (await lets('delegate', 'step', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /review-plan and review-build start a reviewer: a read-only session/);
});

test('step --help names the five steps', async () => {
  const text = (await lets('delegate', 'step', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /shape, plan, review-plan, build and review-build/);
});

test('step --help says story runs a story run, not a step', async () => {
  const text = (await lets('delegate', 'step', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /story runs a story run, not a step/);
});

test('step run and step instructions take the five steps and story as intents', async () => {
  for (const argv of [['delegate', 'step', 'run', '--help'], ['delegate', 'step', 'instructions', '--help']]) {
    assert.match((await lets(...argv)).stdout.replace(/\s+/g, ' '), /choices: "shape", "plan", "review-plan", "build", "review-build", "story"/, argv.join(' '));
  }
});

test('with no config, step instructions --for story prints one JSON line for story', async () => {
  const { code, stdout } = await letsIn(repo(), 'delegate', 'step', 'instructions', '--for', 'story');
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(stdout), { for: 'story', resolver: 'subagent', options: [], guidance: null });
});

test('step run --help lists exit codes 0, 2, 3, 4 and 6, and says exit 0 carries a report whatever its outcome', async () => {
  const { code, stdout } = await lets('delegate', 'step', 'run', '--help');
  assert.equal(code, 0);
  const text = stdout.replace(/\s+/g, ' ');
  assert.match(text, /0 a report is on stdout, whatever its outcome/);
  assert.match(text, /2 usage error, or every resolver in the config declined/);
  assert.match(text, /3 no fresh session can run here on any model given/);
  assert.match(text, /4 the outcome is unknown/);
  assert.match(text, /6 the session did not finish in time/);
  assert.doesNotMatch(text, / [57] {1,2}the session/);
});

test('step run --help gives the 120-minute default and --answers-file', async () => {
  const text = (await lets('delegate', 'step', 'run', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /--timeout-minutes <minutes> .*default: 120/);
  assert.match(text, /--answers-file <path>/);
});

test('step run --help names the optional ask on a question', async () => {
  const text = (await lets('delegate', 'step', 'run', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /an optional ask: true/);
});

test('step run --help describes a reviewer\'s done and failed reports, and its record line', async () => {
  const text = (await lets('delegate', 'step', 'run', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /A reviewer's done report holds findings: its final message, unchanged/);
  assert.match(text, /A reviewer that fails, gives an empty final message, or changes files outside \.workspace\/ is a failed report/);
  assert.match(text, /for, resolver, family, model, independent, handle, checkout, commit, gitClean and durationSeconds/);
});

test('step run --help gives a reviewer 30 minutes, or 45 at effort high', async () => {
  const text = (await lets('delegate', 'step', 'run', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /A step has 120 minutes, a story 600, and a reviewer 30, or 45 at effort high, unless --timeout-minutes says otherwise/);
  assert.match(text, /--timeout-minutes <minutes> .*\(default: 120 for a step, 600 for a story, 30 for a reviewer, or 45 at --effort high\)/);
});

test('step run without --model or with a bad one is a usage error that names it', async () => {
  for (const extra of [[], ['--model', 'llama/llama-4']]) {
    const { code, stderr } = await lets(...STEP.slice(0, -2), ...extra);
    assert.equal(code, 2, extra.join(' '));
    assert.match(stderr, /--model/, extra.join(' '));
  }
});

test('delegate --help names step, and neither review, handoff nor a strategy', async () => {
  const { stdout } = await lets('delegate', '--help');
  assert.match(stdout, /^ {2}step\b/m);
  assert.doesNotMatch(stdout, /^ {2}review\b/m);
  assert.doesNotMatch(stdout, /handoff/);
  assert.doesNotMatch(stdout, /strateg/);
});

test('the handoff command is gone: exit 2, naming it as unknown, and no prompt is saved', async () => {
  const r = repo();
  const { code, stdout, stderr } = await letsIn(r, ...HANDOFF);
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /unknown command 'handoff'/);
  assert.equal(existsSync(join(r.cwd, '.workspace', 'lets-delegate')), false);
});

test('with no config, step run saves the prompt and is exit 3', async () => {
  const r = repo();
  const { code, stdout, stderr } = await letsIn(r, ...STEP.slice(0, 6), 'plan-x', ...STEP.slice(7));
  assert.equal(code, 3);
  assert.equal(stdout, '');
  assert.match(stderr, /\.workspace\/lets-delegate\/plan-x\.prompt\.md/);
  assert.equal(readFileSync(join(r.cwd, '.workspace/lets-delegate/plan-x.prompt.md'), 'utf8'), 'PROMPT');
});

test('with no config, step instructions prints one JSON line from subagent', async () => {
  for (const intent of ['build', 'plan']) {
    const { code, stdout } = await letsIn(repo(), 'delegate', 'step', 'instructions', '--for', intent);
    assert.equal(code, 0, intent);
    assert.deepEqual(JSON.parse(stdout), { for: intent, resolver: 'subagent', options: [], guidance: null });
  }
});

test('an old step name is a usage error that names --for', async () => {
  const { code, stdout, stderr } = await letsIn(repo(), 'delegate', 'step', 'instructions', '--for', 'apply');
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /--for/);
});

test('go --help names questions and no level', async () => {
  const { code, stdout } = await lets('go', '--help');
  assert.equal(code, 0);
  assert.match(stdout, /\bquestions\b/);
  assert.doesNotMatch(stdout, /\blevel\b/);
});

test('go questions --help names the config file, the key, its two values and the exit codes', async () => {
  const { code, stdout } = await lets('go', 'questions', '--help');
  assert.equal(code, 0);
  for (const named of ['config.yaml', 'go.questions', 'ask', 'auto']) assert.ok(stdout.includes(named), named);
  assert.match(stdout, /^ +0 /m);
  assert.match(stdout, /^ +2 /m);
});

test('go questions with a question mode lets does not know is exit 2, naming the config file and go.questions', async () => {
  const r = repo('version: 4\ngo:\n  questions: loud\n');
  const { code, stdout, stderr } = await letsIn(r, 'go', 'questions');
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /^lets go: /);
  assert.ok(stderr.includes(join(r.env.XDG_CONFIG_HOME, 'lets', 'config.yaml')), stderr);
  assert.ok(stderr.includes('go.questions'), stderr);
});

test('go level is no longer a command', async () => {
  const { code } = await lets('go', 'level');
  assert.equal(code, 2);
});

test('delegate --help names the repository\'s lets config, and says its value wins, leaf by leaf', async () => {
  const text = (await lets('delegate', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /\$XDG_CONFIG_HOME\/lets\/config\.yaml/);
  assert.match(text, /\.lets\/config\.yaml/);
  assert.match(text, /repository's value wins, leaf by leaf/);
});

test('go questions --help names the repository\'s lets config, and says its value wins, leaf by leaf', async () => {
  const text = (await lets('go', 'questions', '--help')).stdout.replace(/\s+/g, ' ');
  assert.match(text, /\$XDG_CONFIG_HOME\/lets\/config\.yaml/);
  assert.match(text, /\.lets\/config\.yaml/);
  assert.match(text, /repository's value wins, leaf by leaf/);
});

// lets delegate step start and step wait
const START = ['delegate', 'step', 'start', '--for', 'plan', '--name', 'plan-x', '--prompt-file', 'p.md', '--report-file', 'out/r.json', '--meta-file', 'out/m.txt', '--effort', 'high', '--model', 'claude'];

test('step --help names start and wait', async () => {
  const { stdout } = await lets('delegate', 'step', '--help');
  assert.match(stdout, /^ {2}start\b/m);
  assert.match(stdout, /^ {2}wait\b/m);
});

test('step start --help names its three options and exit codes 0 and 2, and says step wait tells when the step ends', async () => {
  const { code, stdout } = await lets('delegate', 'step', 'start', '--help');
  assert.equal(code, 0);
  const text = stdout.replace(/\s+/g, ' ');
  for (const flag of ['--checkout', '--report-file', '--meta-file', '--answers-file']) assert.match(text, new RegExp(flag), flag);
  assert.match(text, /0 the step has started/);
  assert.match(text, /2 usage error/);
  assert.match(text, /lets delegate step wait --name <name> tells when the step ends/);
  assert.doesNotMatch(text, /exit-file/);
});

test('step wait --help lists exit codes 0, 2 and 6, and says the report is in the report file step start was given', async () => {
  const { code, stdout } = await lets('delegate', 'step', 'wait', '--help');
  assert.equal(code, 0);
  const text = stdout.replace(/\s+/g, ' ');
  assert.match(text, /0 a step has ended, and stdout names it/);
  assert.match(text, /2 usage error/);
  assert.match(text, /6 none of the steps ended within --timeout-minutes/);
  assert.match(text, /the step's report is in the report file lets delegate step start was given/);
});

test('step start without --report-file is a usage error that names it, and starts nothing', async () => {
  const r = repo();
  const at = START.indexOf('--report-file');
  const { code, stdout, stderr } = await letsIn(r, ...START.slice(0, at), ...START.slice(at + 2));
  assert.equal(code, 2);
  assert.equal(stdout, '');
  assert.match(stderr, /--report-file/);
  assert.throws(() => readFileSync(join(r.cwd, '.workspace/lets-delegate/plan-x.run.json')));
});

test('with only subagent, step start returns at once, and step wait names the step with exit 3', async () => {
  const r = repo();
  const started = await letsIn(r, ...START);
  assert.equal(started.code, 0, started.stderr);
  assert.match(started.stdout, /^\{"name":"plan-x","pid":\d+\}\n$/);
  const waited = await letsIn(r, 'delegate', 'step', 'wait', '--name', 'plan-x', '--timeout-minutes', '1');
  assert.equal(waited.code, 0, waited.stderr);
  assert.equal(waited.stdout, '{"name":"plan-x","exit":3}\n');
  assert.equal(readFileSync(join(r.cwd, 'out/r.json'), 'utf8'), '');
  assert.match(readFileSync(join(r.cwd, 'out/m.txt'), 'utf8'), /\.workspace\/lets-delegate\/plan-x\.prompt\.md/);
  assert.equal(readFileSync(join(r.cwd, '.workspace/lets-delegate/plan-x.prompt.md'), 'utf8'), 'PROMPT');
});
