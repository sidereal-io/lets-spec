// The t3 resolver through lets delegate: each command with the real T3
// adapter, on the kit's fake io, named in the config.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { run as instructions } from '../../../../lets/src/delegate/instructions.ts';
import { run as handoff } from '../../../../lets/src/delegate/handoff.ts';
import { run as review } from '../../../../lets/src/delegate/review.ts';
import { run as step } from '../../../../lets/src/delegate/step.ts';
import type { ReviewOptions } from '../../../../lets/src/delegate/review.ts';
import type { StepOptions } from '../../../../lets/src/delegate/step.ts';
import { parentPid } from '../../../../lets/src/resolvers/kit/io.ts';
import type { Db, Io } from '../../../../lets/src/resolvers/kit/io.ts';
import { createAdapter } from '../../../../lets/src/resolvers/t3/t3.ts';
import { commandDeps, HEAD } from '../../delegate/fixtures/command-deps.ts';
import { fakeIo } from '../kit/fixtures/fake-io.ts';

const ONLY_T3 = 'version: 3\ndelegate: { resolvers: [t3] }\n';
const ORIGIN = 'http://127.0.0.1:3773';
const RUNTIME = '/home/u/.t3/userdata/server-runtime.json';
const MANIFEST = '/home/u/.t3/userdata/model-manifest.json';
const TOKEN = '/home/u/.config/lets/t3-token';

// commandDeps whose config lists only t3, the real T3 adapter on io.
const withT3 = (io: Io) => commandDeps({ config: ONLY_T3, real: { t3: createAdapter(io) } });

// An entry of server.getConfig's providers[], enabled and ready unless told
// otherwise. A model is its slug, or the model itself.
type CatalogueModel = string | { slug: string; isDefault?: boolean; isCustom?: boolean };
const provider = (instanceId: string, models: CatalogueModel[], over: Record<string, unknown> = {}) => ({
  instanceId, driver: instanceId, enabled: true, status: 'ready', ...over,
  models: models.map((model) => (typeof model === 'string' ? { slug: model, name: model } : { name: model.slug, ...model })),
});
const ONLY_DISABLED = { providers: [provider('codex', ['gpt-6-luna'], { enabled: false, status: 'disabled' })] };

// The T3 server's WebSocket. It answers server.getConfig with config, or
// never when config is SILENT, and any other request with thread T. It logs
// each request in sent, and shows it to onSend before it answers.
const SILENT = Symbol('silent');
type Frame = { tag: string; payload: { type?: string; threadId?: string; modelSelection?: { model: string } } };
type Sent = Frame[];
function t3Socket(sent: Sent, config: unknown, onSend: (frame: Frame) => void = () => {}): typeof globalThis.WebSocket {
  return class {
    listeners: Record<string, ((event: unknown) => void)[]> = {};
    constructor() {
      queueMicrotask(() => this.emit('open', {}));
    }
    addEventListener(type: string, listener: (event: unknown) => void) {
      (this.listeners[type] ??= []).push(listener);
    }
    emit(type: string, event: unknown) {
      for (const listener of this.listeners[type] ?? []) listener(event);
    }
    send(data: string) {
      const frame = JSON.parse(data);
      sent.push(frame);
      onSend(frame);
      if (frame.tag === 'server.getConfig' && config === SILENT) return;
      const value = frame.tag === 'server.getConfig' ? config : { threadId: 'T' };
      queueMicrotask(() => this.emit('message', { data: JSON.stringify({ _tag: 'Exit', requestId: '1', exit: { _tag: 'Success', value } }) }));
    }
    close() {}
  } as unknown as typeof globalThis.WebSocket;
}
const ticketFetch = (async () => ({ status: 200, ok: true, json: async () => ({ ticket: 'TICKET' }) })) as unknown as typeof globalThis.fetch;

// This process is 100, and the T3 server is 7. T3 answers the catalogue
// request with config.
const io = (parents: Record<number, number>, { config = ONLY_DISABLED as unknown, sent = [] as Sent, files = {}, fetch = ticketFetch, WebSocket = t3Socket(sent, config) } = {}) => fakeIo({
  files: { [RUNTIME]: JSON.stringify({ pid: 7, origin: ORIGIN }), [TOKEN]: 'tok', ...files },
  pid: 100,
  parentPid: (pid) => parents[pid] ?? null,
  processAlive: (pid) => pid === 7,
  env: {},
  fetch,
  WebSocket,
});
const CHAIN = { 100: 50, 50: 7, 7: 1 };
const insideT3 = (options: Parameters<typeof io>[1] = {}) => io(CHAIN, options);

const SCHEMA = readFileSync(new URL('./fixtures/t3-schema.sql', import.meta.url), 'utf8');

const reviewInstructions = { strategy: 'review', for: 'code' } as const;

// Review instructions inside T3 Code: the command's exit, the options it
// lists, and its stderr.
async function listed(adapterIo: Io) {
  const t = withT3(adapterIo);
  const code = await instructions(reviewInstructions, t.deps);
  const answer = JSON.parse(t.stdout());
  assert.equal(answer.resolver, 't3');
  return { code, options: answer.options, stderr: t.stderr() };
}

test('review instructions inside T3 Code with only disabled instances list no options, with no warning', async () => {
  assert.deepEqual(await listed(insideT3()), { code: 0, options: [], stderr: '' });
});

test('review instructions inside T3 Code on a system with no /proc find the T3 server with ps', async () => {
  const parents: Record<string, string> = { 100: '   50\n', 50: '    7\n', 7: '    1\n' };
  // No file exists, as on macOS, and ps prints each process's parent.
  const sys = {
    readFileSync(path: string): string {
      throw new Error(`ENOENT: ${path}`);
    },
    existsSync: () => false,
    spawnSync: (_cmd: string, args: string[]) => ({ stdout: parents[args.at(-1)!] ?? '' }),
  };
  assert.deepEqual(await listed({ ...insideT3(), parentPid: (pid: number) => parentPid(pid, sys) }), { code: 0, options: [], stderr: '' });
});

test('review instructions list the catalogue\'s models, each instance in order, its default first', async () => {
  const config = { providers: [
    provider('codex', ['gpt-6-luna', { slug: 'gpt-5.6-terra', isDefault: true }]),
    provider('claudeAgent', ['claude-opus-5-5', { slug: 'claude-fable-5-1', isDefault: true }]),
    provider('antigravity', ['gemini-4-argon', 'gemini-3.8-flash']),
  ] };
  assert.deepEqual((await listed(insideT3({ config }))).options,
    ['gpt/gpt-5.6-terra', 'gpt/gpt-6-luna', 'claude/claude-fable-5-1', 'claude/claude-opus-5-5', 'gemini/gemini-4-argon', 'gemini/gemini-3.8-flash']);
});

test('review instructions list only the instances t3 can run now', async () => {
  const config = { providers: [
    provider('codex', ['gpt-6-luna'], { enabled: false }),
    provider('claudeAgent', ['claude-opus-5-5'], { status: 'error' }),
    provider('antigravity', ['gemini-4-argon'], { status: 'warning' }),
  ] };
  assert.deepEqual((await listed(insideT3({ config }))).options, ['gemini/gemini-4-argon']);
});

test('review instructions leave out an unavailable instance', async () => {
  const config = { providers: [provider('antigravity', ['gemini-4-argon'], { availability: 'unavailable' })] };
  assert.deepEqual((await listed(insideT3({ config }))).options, []);
});

test('review instructions leave out a model id that cannot run', async () => {
  const config = { providers: [provider('codex', [{ slug: 'my model', isCustom: true }, { slug: '', isCustom: true }, 'gpt-6-luna'])] };
  assert.deepEqual((await listed(insideT3({ config }))).options, ['gpt/gpt-6-luna']);
});

test('review instructions leave out the models the user hid, but not a custom one', async () => {
  const config = {
    providers: [provider('claudeAgent', ['claude-opus-5-5', { slug: 'claude-opus-4-5', isDefault: true }, { slug: 'claude-lab', isCustom: true }])],
    settings: { providerModelPreferences: { claudeAgent: { hiddenModels: ['claude-opus-4-5', 'claude-lab'] } } },
  };
  assert.deepEqual((await listed(insideT3({ config }))).options, ['claude/claude-opus-5-5', 'claude/claude-lab']);
});

test('review instructions leave out an instance t3 does not run', async () => {
  const config = { providers: [provider('cursor', ['auto']), provider('codex_work', ['gpt-6-astra']), provider('codex', ['gpt-6-luna'])] };
  assert.deepEqual((await listed(insideT3({ config }))).options, ['gpt/gpt-6-luna']);
});

test('review instructions list each gemini model once, without its effort', async () => {
  const config = { providers: [provider('antigravity', ['gemini-3.8-flash-high', 'gemini-3.8-flash-low'])] };
  assert.deepEqual((await listed(insideT3({ config }))).options, ['gemini/gemini-3.8-flash']);
});

test('review instructions never read T3\'s model manifest', async () => {
  const manifest = { manifest: { currentModels: { codex: ['gpt-6-astra'] } } };
  const config = { providers: [provider('codex', ['gpt-6-luna'])] };
  assert.deepEqual((await listed(insideT3({ config, files: { [MANIFEST]: JSON.stringify(manifest) } }))).options, ['gpt/gpt-6-luna']);
});

// Let every pending callback but the mocked timers run.
const settle = () => new Promise((resolve) => setImmediate(resolve));

// What review instructions answer when T3 gives no catalogue: exit 0, no
// options, and a warning that says so.
function listsNoneBecause(answer: { code: number; options: unknown; stderr: string }, why: RegExp) {
  assert.equal(answer.code, 0);
  assert.deepEqual(answer.options, []);
  assert.match(answer.stderr, /T3 gave no model catalogue/);
  assert.match(answer.stderr, why);
}

test('review instructions list no options when T3 never replies, within 15 s', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const pending = listed(insideT3({ config: SILENT }));
  await settle();
  t.mock.timers.tick(10_000);
  listsNoneBecause(await pending, /no reply from t3/);
});

test('review instructions list no options when T3 never answers the ticket request, within 15 s', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const fetch = ((_url: string, init?: RequestInit) =>
    new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))))) as unknown as typeof globalThis.fetch;
  const pending = listed(insideT3({ fetch }));
  await settle();
  t.mock.timers.tick(10_000);
  listsNoneBecause(await pending, /did not answer in time/);
});

test('review instructions list no options when T3 refuses the request, saying why', async () => {
  // t3 fails and closes the socket without opening it, and says why at /ws.
  const WebSocket = class {
    listeners: Record<string, ((event: unknown) => void)[]> = {};
    constructor() {
      queueMicrotask(() => {
        for (const type of ['error', 'close']) for (const listener of this.listeners[type] ?? []) listener({ type, code: 1006, reason: '' });
      });
    }
    addEventListener(type: string, listener: (event: unknown) => void) {
      (this.listeners[type] ??= []).push(listener);
    }
    close() {}
  } as unknown as typeof globalThis.WebSocket;
  const fetch = (async (url: string) => (url.endsWith('/ws')
    ? { status: 426, ok: false, json: async () => ({ message: 'unsupported orchestration protocol' }) }
    : { status: 200, ok: true, json: async () => ({ ticket: 'TICKET' }) })) as unknown as typeof globalThis.fetch;
  listsNoneBecause(await listed(insideT3({ fetch, WebSocket })), /unsupported orchestration protocol/);
});

test('review instructions list no options when T3\'s reply has another shape', async () => {
  listsNoneBecause(await listed(insideT3({ config: { instances: [] } })), /no list of providers/);
});

test('review instructions decline when the running T3 server is not an ancestor', async () => {
  const t = withT3(io({ 100: 50, 50: 1 }));
  assert.equal(await instructions(reviewInstructions, t.deps), 2);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /every resolver declined/);
});

type Answer = { stdout: string; stderr: string; code: number };
const ok = (stdout: string): Answer => ({ stdout: `${stdout}\n`, stderr: '', code: 0 });

// Commands run in a checkout of the repository whose main checkout is
// /repo, on branch, whose top level is top. git is answered by its
// arguments; others answers every other command, in order.
function inCheckout(others: Answer[], top = '/repo', branch = 'main') {
  return (cmd: string, args: string[]): Answer => {
    if (cmd !== 'git') return others.shift() ?? ok('');
    const asked = args.slice(2).join(' ');
    if (asked === 'rev-parse --path-format=absolute --git-common-dir') return ok('/repo/.git');
    if (asked === 'rev-parse --show-toplevel') return ok(top);
    if (asked === 'branch --show-current') return ok(branch);
    return { stdout: '', stderr: `no answer for git ${asked}`, code: 1 };
  };
}

// A T3 that is running, with a project for projectRoot and the state in db.
// It answers the catalogue request with config, and every other request
// over the WebSocket with thread T. Each request is logged in sent. results
// answers the commands other than git, in order. git answers from the
// checkout whose top level is top, on branch. onLaunch is called with db
// and the launch's number, from 1, as T3 is asked for each thread.
type Running = {
  projectRoot?: string; config?: unknown; fetch?: typeof globalThis.fetch; results?: Answer[]; top?: string; branch?: string;
  onLaunch?: (db: DatabaseSync, n: number) => void;
};
function runningT3({ projectRoot = '/repo', config = ONLY_DISABLED as unknown, fetch = ticketFetch, results = [], top, branch, onLaunch = () => {} }: Running = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  db.prepare(`insert into projection_projects (project_id, title, workspace_root, scripts_json, created_at, updated_at)
    values ('p1', 'lets-spec', ?, '[]', 'now', 'now')`).run(projectRoot);
  const sent: Sent = [];
  const adapterIo = fakeIo({
    files: { [RUNTIME]: JSON.stringify({ pid: 7, origin: ORIGIN }), [TOKEN]: 'tok' },
    pid: 100,
    parentPid: (pid) => (CHAIN as Record<number, number>)[pid] ?? null,
    processAlive: (pid) => pid === 7,
    env: {},
    results: inCheckout(results, top, branch),
    openDb: () => ({ prepare: (sql: string) => db.prepare(sql), close() {} }) as Db,
    fetch,
    WebSocket: t3Socket(sent, config, ({ tag }) => {
      if (tag === 'orchestration.launchThread') onLaunch(db, launches(sent).length);
    }),
  });
  return { db, sent, adapterIo, t: withT3(adapterIo) };
}
// A review named x on gpt/gpt-6-astra, from a claude author.
const astraReview: ReviewOptions = { for: 'code', name: 'x', promptFile: 'p.md', sourceFamily: 'claude', effort: 'high', timeoutMinutes: 1, models: ['gpt/gpt-6-astra'] };

test('a review T3 fails before any message is exit 3 with its failure, and archives the thread', async () => {
  const { db, sent, t } = runningT3();
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values ('run-1', 'T', 1, 'codex', 'failed', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_turn_items (turn_item_id, thread_id, run_id, ordinal, type, status, updated_at, payload_json)
    values ('e1', 'T', 'run-1', 1, 'error', 'failed', 'now', ?)`).run(JSON.stringify({ failure: { message: 'gpt-6-astra is not available' } }));
  assert.equal(await review(astraReview, t.deps), 3, t.stderr());
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /gpt-6-astra is not available \(thread T\)\n$/);
  assert.deepEqual(sent.map(({ payload }) => payload.type ?? 'launch'), ['launch', 'thread.archive']);
  assert.equal(sent[1].payload.threadId, 'T');
});

test('a review whose run returns a plan is exit 5 with nothing on stdout, and keeps the thread', async () => {
  const { db, sent, t } = runningT3();
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values ('run-1', 'T', 1, 'codex', 'completed', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_turn_items (turn_item_id, thread_id, run_id, ordinal, type, status, updated_at, payload_json)
    values ('plan', 'T', 'run-1', 1, 'proposed_plan', 'completed', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_messages (message_id, thread_id, run_id, role, streaming, created_at, updated_at, payload_json)
    values ('a1', 'T', 'run-1', 'assistant', 0, 'now', 'now', ?)`).run(JSON.stringify({ text: 'Here is my plan.' }));
  assert.equal(await review(astraReview, t.deps), 5, t.stderr());
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /the session returned a plan, not a result \(thread T\)\n$/);
  assert.deepEqual(sent.map(({ payload }) => payload.type ?? 'launch'), ['launch']);
});

// A review whose run T3 completes with findings, in a thread T3 records in
// worktreePath, or in the project's root when it is null. It is asked for
// from the checkout whose top level is top.
async function recordedReview(worktreePath: string | null, top: string) {
  const { db, t } = runningT3({ top });
  db.prepare(`insert into orchestration_v2_projection_threads (thread_id, project_id, title, default_provider, runtime_mode, interaction_mode, created_at, updated_at, payload_json)
    values ('T', 'p1', 'x', 'codex', 'full-access', 'default', 'now', 'now', ?)`).run(JSON.stringify({ worktreePath, branch: 'fix-login' }));
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values ('run-1', 'T', 1, 'codex', 'completed', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_messages (message_id, thread_id, run_id, role, streaming, created_at, updated_at, payload_json)
    values ('a1', 'T', 'run-1', 'assistant', 0, 'now', 'now', ?)`).run(JSON.stringify({ text: 'FINDINGS' }));
  assert.equal(await review(astraReview, t.deps), 0, t.stderr());
  const { checkout, commit } = JSON.parse(t.stderr());
  return { checkout, commit };
}

test('a review T3 runs in the worktree it was asked for names that worktree', async () => {
  assert.deepEqual(await recordedReview('/w/fix-login', '/w/fix-login'), { checkout: '/w/fix-login', commit: HEAD });
});

test('a review T3 runs in the project\'s root instead names the root', async () => {
  assert.deepEqual(await recordedReview(null, '/w/fix-login'), { checkout: '/repo', commit: HEAD });
});

test('a review in a repository T3 has no project for is exit 3, naming it, and creates no thread', async () => {
  const { sent, t } = runningT3({ projectRoot: '/elsewhere' });
  assert.equal(await review(astraReview, t.deps), 3, t.stderr());
  assert.match(t.stderr(), /t3 has no project for \/repo/);
  assert.doesNotMatch(t.stderr(), /\(thread /);
  assert.deepEqual(sent, []);
});

test('a review from a linked worktree of a repository T3 has no project for is exit 3, naming the main checkout', async () => {
  const { sent, t } = runningT3({ projectRoot: '/elsewhere', top: '/w/fix-login' });
  assert.equal(await review(astraReview, t.deps), 3, t.stderr());
  assert.match(t.stderr(), /t3 has no project for \/repo;/);
  assert.deepEqual(sent, []);
});

// The threads T3 was asked to start, by the model each runs.
const launches = (sent: Sent) => sent.filter(({ tag }) => tag === 'orchestration.launchThread').map(({ payload }) => payload.modelSelection);
const handoffOn = (...models: string[]) => ({ name: 'fix-login', promptFile: 'p.md', models });

const CODEX = provider('codex', ['gpt-6-luna', { slug: 'gpt-5.6-terra', isDefault: true }]);

test('a bare-family handoff runs the catalogue\'s default', async () => {
  const { sent, t } = runningT3({ config: { providers: [CODEX] } });
  assert.equal(await handoff(handoffOn('gpt'), t.deps), 0, t.stderr());
  assert.deepEqual(launches(sent), [{ instanceId: 'codex', model: 'gpt-5.6-terra', options: [] }]);
});

test('a bare-family handoff runs the first visible model when the default is hidden', async () => {
  const config = { providers: [provider('codex', [{ slug: 'gpt-5.6-terra', isDefault: true }, 'gpt-6-luna'])],
    settings: { providerModelPreferences: { codex: { hiddenModels: ['gpt-5.6-terra'] } } } };
  const { sent, t } = runningT3({ config });
  assert.equal(await handoff(handoffOn('gpt'), t.deps), 0, t.stderr());
  assert.deepEqual(launches(sent).map((selection) => selection?.model), ['gpt-6-luna']);
});

const GEMINI = { providers: [provider('antigravity', ['gemini-4-argon', { slug: 'gemini-3.8-flash-high', isDefault: true }])] };

test('a bare gemini review runs the default without its effort', async () => {
  const { db, sent, t } = runningT3({ config: GEMINI });
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values ('run-1', 'T', 1, 'antigravity', 'completed', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_messages (message_id, thread_id, run_id, role, streaming, created_at, updated_at, payload_json)
    values ('a1', 'T', 'run-1', 'assistant', 0, 'now', 'now', '{"text":"FINDINGS"}')`).run();
  await review({ ...astraReview, for: 'plan', effort: 'low', models: ['gemini'] }, t.deps);
  assert.deepEqual(launches(sent), [{ instanceId: 'antigravity', model: 'gemini-3.8-flash', options: [] }]);
});

test('a bare gemini handoff runs the default without its effort', async () => {
  const { sent, t } = runningT3({ config: GEMINI });
  assert.equal(await handoff(handoffOn('gemini'), t.deps), 0, t.stderr());
  assert.deepEqual(launches(sent), [{ instanceId: 'antigravity', model: 'gemini-3.8-flash', options: [] }]);
});

test('a bare-family handoff on an instance with no visible model is exit 3, naming it, and starts no thread', async () => {
  const { sent, t } = runningT3({ config: { providers: [provider('codex', [])] } });
  assert.equal(await handoff(handoffOn('gpt'), t.deps), 3);
  assert.match(t.stderr(), /codex/);
  assert.deepEqual(launches(sent), []);
});

test('a bare-family handoff on a failing instance tries the next model', async () => {
  const config = { providers: [provider('claudeAgent', [{ slug: 'claude-fable-5-1', isDefault: true }], { status: 'error' }), provider('codex', ['gpt-6-luna'])] };
  const { sent, t } = runningT3({ config });
  assert.equal(await handoff(handoffOn('claude', 'gpt'), t.deps), 0, t.stderr());
  assert.deepEqual(launches(sent).map((selection) => selection?.model), ['gpt-6-luna']);
});

test('a bare-family handoff with no catalogue is exit 3 within 15 s, and starts no thread', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const { sent, t: command } = runningT3({ config: SILENT });
  const pending = handoff(handoffOn('claude'), command.deps);
  await settle();
  t.mock.timers.tick(10_000);
  assert.equal(await pending, 3);
  assert.match(command.stderr(), /T3 gave no model catalogue/);
  assert.deepEqual(launches(sent), []);
});

test('a bare-family handoff launches with the token the catalogue request issued', async () => {
  const tokens: string[] = [];
  const statuses = [401, 200, 200];
  const fetch = (async (_url: string, init?: RequestInit) => {
    tokens.push((init?.headers as Record<string, string>).authorization);
    const status = statuses.shift()!;
    return { status, ok: status === 200, json: async () => ({ ticket: 'TICKET' }) };
  }) as unknown as typeof globalThis.fetch;
  const { adapterIo, t } = runningT3({ config: { providers: [CODEX] }, fetch, results: [{ stdout: 'fresh\n', stderr: '', code: 0 }] });
  assert.equal(await handoff(handoffOn('gpt'), t.deps), 0, t.stderr());
  assert.deepEqual(tokens, ['Bearer tok', 'Bearer fresh', 'Bearer fresh']);
  assert.equal((adapterIo as ReturnType<typeof fakeIo>).calls.filter(([cmd]) => cmd === 't3').length, 1);
});

// A step named build-x, on gpt/gpt-6-luna at effort high.
const lunaStep: StepOptions = { for: 'build', name: 'build-x', promptFile: 'p.md', effort: 'high', models: ['gpt/gpt-6-luna'] };
// A final message that ends with a step report holding yaml.
const ending = (yaml: string) => `Prose.\n\n\`\`\`step-report\n${yaml}\`\`\`\n`;
const DONE = ending('outcome: done\nevidence:\n  - commit 3f2a1c0\n');

// Run n of thread T, which T3 completes with text as its final message.
function completes(db: DatabaseSync, text: string, n = 1) {
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values (?, 'T', ?, 'codex', 'completed', 'now', '{}')`).run(`run-${n}`, n);
  db.prepare(`insert into orchestration_v2_projection_messages (message_id, thread_id, run_id, role, streaming, created_at, updated_at, payload_json)
    values (?, 'T', ?, 'assistant', 0, 'now', 'now', ?)`).run(`a${n}`, `run-${n}`, JSON.stringify({ text }));
}
// Run n of thread T, which T3 fails with failure before any message.
function refuses(db: DatabaseSync, failure: string, n = 1) {
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values (?, 'T', ?, 'codex', 'failed', 'now', '{}')`).run(`run-${n}`, n);
  db.prepare(`insert into orchestration_v2_projection_turn_items (turn_item_id, thread_id, run_id, ordinal, type, status, updated_at, payload_json)
    values (?, 'T', ?, 1, 'error', 'failed', 'now', ?)`).run(`e${n}`, `run-${n}`, JSON.stringify({ failure: { message: failure } }));
}
const launchPayloads = (sent: Sent) => sent.filter(({ tag }) => tag === 'orchestration.launchThread').map(({ payload }) => payload as Record<string, unknown>);

test('a step from a linked worktree runs in one default-mode thread there, and prints its done report', async () => {
  const { db, sent, t } = runningT3({ top: '/w/feature', branch: 'feature' });
  completes(db, DONE);
  assert.equal(await step(lunaStep, t.deps), 0, t.stderr());
  const [launch, ...others] = launchPayloads(sent);
  assert.deepEqual(others, []);
  assert.deepEqual(
    { workspaceStrategy: launch.workspaceStrategy, interactionMode: launch.interactionMode, modelSelection: launch.modelSelection },
    {
      workspaceStrategy: { type: 'existing_worktree', worktreePath: '/w/feature', branch: 'feature' },
      interactionMode: 'default',
      modelSelection: { instanceId: 'codex', model: 'gpt-6-luna', options: [{ id: 'reasoningEffort', value: 'high' }] },
    },
  );
  assert.equal(JSON.parse(t.stdout()).outcome, 'done');
  const { resolver, family, model, handle } = JSON.parse(t.stderr());
  assert.deepEqual({ resolver, family, model, kind: handle.kind }, { resolver: 't3', family: 'gpt', model: 'gpt-6-luna', kind: 'thread' });
});

test('a bare gemini step runs the catalogue\'s default without its effort', async () => {
  const { db, sent, t } = runningT3({ config: GEMINI });
  completes(db, DONE);
  assert.equal(await step({ ...lunaStep, for: 'plan', effort: 'medium', models: ['gemini'] }, t.deps), 0, t.stderr());
  assert.deepEqual(launches(sent), [{ instanceId: 'antigravity', model: 'gemini-3.8-flash', options: [] }]);
});

// What T3 was asked to do, in order: launch a thread, or the command's type.
const asked = (sent: Sent) => sent.map(({ payload }) => payload.type ?? 'launch');

test('a step whose report is done archives its thread', async () => {
  const { db, sent, t } = runningT3();
  completes(db, DONE);
  assert.equal(await step(lunaStep, t.deps), 0, t.stderr());
  assert.deepEqual(asked(sent), ['launch', 'thread.archive']);
  assert.equal(sent[1].payload.threadId, 'T');
});

test('a step whose report is needs-input keeps its thread', async () => {
  const { db, sent, t } = runningT3();
  completes(db, ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n'));
  assert.equal(await step(lunaStep, t.deps), 0, t.stderr());
  assert.equal(JSON.parse(t.stdout()).outcome, 'needs-input');
  assert.deepEqual(asked(sent), ['launch']);
});

const CLAUDE = { providers: [provider('claudeAgent', [{ slug: 'claude-opus-5-5', isDefault: true }])] };

test('a step whose first model T3 refuses archives that thread, and runs the next model', async () => {
  const onLaunch = (db: DatabaseSync, n: number) => (n === 1 ? refuses(db, 'gpt-6-astra is not available', n) : completes(db, DONE, n));
  const { sent, t } = runningT3({ config: CLAUDE, onLaunch });
  assert.equal(await step({ ...lunaStep, models: ['gpt/gpt-6-astra', 'claude'] }, t.deps), 0, t.stderr());
  assert.deepEqual(asked(sent.filter(({ tag }) => tag !== 'server.getConfig')), ['launch', 'thread.archive', 'launch', 'thread.archive']);
  assert.equal(JSON.parse(t.stderr()).family, 'claude');
});

test('a step whose every model T3 refuses is exit 3, with T3\'s failure', async () => {
  const { sent, t } = runningT3({ onLaunch: (db) => refuses(db, 'gpt-6-astra is not available') });
  assert.equal(await step({ ...lunaStep, models: ['gpt/gpt-6-astra'] }, t.deps), 3);
  assert.equal(t.stdout(), '');
  assert.match(t.stderr(), /gpt-6-astra is not available/);
  assert.deepEqual(asked(sent), ['launch', 'thread.archive']);
});

test('a step thread that stops to ask is a failed report naming the thread, and keeps it', async () => {
  const { db, sent, t } = runningT3();
  db.prepare(`insert into orchestration_v2_projection_runs (run_id, thread_id, ordinal, provider, status, requested_at, payload_json)
    values ('run-1', 'T', 1, 'codex', 'waiting', 'now', '{}')`).run();
  db.prepare(`insert into orchestration_v2_projection_runtime_requests (runtime_request_id, thread_id, node_id, kind, status, created_at, payload_json)
    values ('rq1', 'T', 'n1', 'user_input', 'pending', 'now', '{}')`).run();
  assert.equal(await step(lunaStep, t.deps), 0, t.stderr());
  assert.deepEqual(JSON.parse(t.stdout()), { outcome: 'failed', reason: 'the session stopped to ask (thread T)' });
  assert.equal(JSON.parse(t.stderr()).handle, null);
  assert.deepEqual(asked(sent), ['launch']);
});

test('step instructions inside T3 Code list the catalogue\'s models', async () => {
  const t = withT3(insideT3({ config: { providers: [provider('codex', ['gpt-6-luna'])] } }));
  assert.equal(await instructions({ strategy: 'step', for: 'plan' }, t.deps), 0, t.stderr());
  const { strategy, resolver, options } = JSON.parse(t.stdout());
  assert.deepEqual({ strategy, resolver, options }, { strategy: 'step', resolver: 't3', options: ['gpt/gpt-6-luna'] });
});

test('a step outside T3 Code opens no thread, and the default answers', async () => {
  const sent: Sent = [];
  const t = commandDeps({ config: 'version: 3\ndelegate: { resolvers: [t3, subagent] }\n', real: { t3: createAdapter(io({ 100: 50, 50: 1 }, { sent })) } });
  assert.equal(await step({ ...lunaStep, models: ['claude'] }, t.deps), 3);
  assert.deepEqual(sent, []);
  assert.ok(t.savedFile('.workspace/lets-delegate/build-x.prompt.md'), 'the default saved the prompt');
});
