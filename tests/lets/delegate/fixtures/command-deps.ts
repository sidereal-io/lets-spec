// Deps for the delegate commands. git is scripted; the resolvers built into
// lets are fake adapters, but for subagent, which is the real one, writing
// to a fake io. Every adapter records each call it takes.
//
// options:
//   adapters:  how each resolver built into lets behaves, by name, as a
//              FakeResolver; t3 and cli decline by default, and subagent is
//              the real one
//   real:      a real adapter to use in place of a fake, by name, such as
//              the cli adapter on the kit's fake io
//   gitBefore: what `git status -z` prints before the session
//   gitAfter:  what it prints after; default gitBefore
//   gitAfterFails: true when `git status` fails after the session
//   head:      what `git rev-parse HEAD` prints; default HEAD
//   files:     the files there are; default the prompt file /repo/p.md
//   config:    the text of the delegate config, CONFIG, when there is one
import type { ResolverName } from '../../../../lets/src/delegate/config.ts';
import type { Deps } from '../../../../lets/src/io.ts';
import type { Adapter, Handle, RunInput, StartInput, StepInput } from '../../../../lets/src/resolvers/kit/adapter.ts';
import { Refused } from '../../../../lets/src/resolvers/kit/errors.ts';
import { createAdapter as subagentAdapter } from '../../../../lets/src/resolvers/subagent/subagent.ts';
import { fakeIo as fakeResolverIo } from '../../resolvers/kit/fixtures/fake-io.ts';
import { fakeIo } from './fake-io.ts';

export const PROMPT_FILE = '/repo/p.md';
export const CONFIG = '/home/u/.config/lets/config.yaml';
// The commit at HEAD, unless a test gives another.
export const HEAD = '0123456789abcdef0123456789abcdef01234567';
// The final message of a step that went well.
export const DONE_REPORT = 'All done.\n\n```step-report\noutcome: done\nevidence:\n  - commit 3f2a1c0\n```\n';

// How a fake resolver behaves. By default it detects, starts sessions,
// runs steps, lists gpt/fake-model, and answers run with FINDINGS on handle
// <name> <name>-1 in the checkout it was asked for, start with handle <name> <name>-1, and step with a done
// report on handle <name> <name>-1.
//   declines: detect() is false
//   headless: it has no start
//   steps:    false when it has no step
//   options:  the models options lists
//   warnings: what options warns, in order
//   refuse:   the models run and start refuse, as --model gives them
//   run, start, step: the answer, or the error to throw
//   finish:   the error finish throws
export type FakeResolver = {
  declines?: boolean;
  headless?: boolean;
  options?: string[];
  warnings?: string[];
  refuse?: string[];
  run?: { text?: string; handle?: Handle; checkout?: string | null } | Error;
  start?: Handle | { instructions: string } | Error;
  steps?: boolean;
  step?: { text?: string; handle?: Handle } | Error;
  finish?: Error;
};

// One call an adapter took: the resolver, the method, and its input.
export type AdapterCall = [ResolverName, string, unknown];

// The model an input asks for, as --model gives it.
const modelOf = ({ family, model }: { family: string; model: string | null }) => (model === null ? family : `${family}/${model}`);

export function fakeAdapter(name: ResolverName, behaviour: FakeResolver = {}): Adapter {
  const handle = { kind: name, id: `${name}-1` };
  const answer = <T>(value: T | Error): T => {
    if (value instanceof Error) throw value;
    return value;
  };
  const refuses = (input: RunInput | StartInput) => {
    if (behaviour.refuse?.includes(modelOf(input))) throw new Refused(`refused ${modelOf(input)}`);
  };
  return {
    name,
    detect: () => behaviour.declines !== true,
    async options(warn) {
      for (const message of behaviour.warnings ?? []) warn(message);
      return behaviour.options ?? ['gpt/fake-model'];
    },
    async run(input) {
      refuses(input);
      const { text = 'FINDINGS', handle: made = handle, checkout = input.cwd } = answer(behaviour.run ?? {});
      return { text, handle: made, checkout };
    },
    ...(behaviour.headless ? {} : {
      async start(input: StartInput) {
        refuses(input);
        return answer(behaviour.start ?? handle);
      },
    }),
    ...(behaviour.steps === false ? {} : {
      async step(input: StepInput) {
        refuses(input);
        const { text = DONE_REPORT, handle: made = handle } = answer(behaviour.step ?? {});
        return { text, handle: made };
      },
    }),
    async finish() {
      if (behaviour.finish) throw behaviour.finish;
    },
  };
}

// adapter, recording each call it takes in calls.
function recorded(adapter: Adapter, calls: AdapterCall[]): Adapter {
  const name = adapter.name as ResolverName;
  const log = (method: string, input: unknown) => calls.push([name, method, input]);
  const { start, step } = adapter;
  return {
    ...adapter,
    detect: () => {
      log('detect', null);
      return adapter.detect();
    },
    options: (warn) => {
      log('options', null);
      return adapter.options(warn);
    },
    run: (input, options) => {
      log('run', { input, options });
      return adapter.run(input, options);
    },
    ...(start === undefined ? {} : {
      start: (input: StartInput) => {
        log('start', input);
        return start(input);
      },
    }),
    ...(step === undefined ? {} : {
      step: (input: StepInput, options: { timeoutMs: number }) => {
        log('step', { input, options });
        return step(input, options);
      },
    }),
    finish: (handle, ok, options) => {
      log('finish', { handle, ok, options });
      return adapter.finish(handle, ok, options);
    },
  };
}

type Options = {
  adapters?: Partial<Record<ResolverName, FakeResolver>>;
  real?: Partial<Record<ResolverName, Adapter>>;
  gitBefore?: string;
  gitAfter?: string;
  gitAfterFails?: boolean;
  head?: string;
  files?: Record<string, string>;
  config?: string;
};

export function commandDeps({
  adapters = {}, real = {}, gitBefore = '', gitAfter = gitBefore, gitAfterFails = false, head = HEAD, files = { [PROMPT_FILE]: 'PROMPT TEXT' }, config,
}: Options = {}) {
  const io = fakeIo({ files: { ...files, ...(config === undefined ? {} : { [CONFIG]: config }) } });
  let statusCalls = 0;
  io.execFile = async (cmd, args, opts = {}) => {
    io.calls.push([cmd, args, opts]);
    if (cmd === 'git' && args.join(' ') === 'rev-parse HEAD') return { stdout: `${head}\n`, stderr: '', code: 0 };
    if (cmd === 'git' && args[0] === 'rev-parse') return { stdout: '/repo\n', stderr: '', code: 0 };
    if (cmd === 'git') {
      if (statusCalls++ === 0) return { stdout: gitBefore, stderr: '', code: 0 };
      return gitAfterFails ? { stdout: '', stderr: 'index.lock exists', code: 128 } : { stdout: gitAfter, stderr: '', code: 0 };
    }
    throw new Error(`no program but git runs here: ${cmd}`);
  };

  // What the real subagent writes, by its path under /repo.
  const resolverIo = fakeResolverIo();
  const calls: AdapterCall[] = [];
  const built = (name: ResolverName, fallback: () => Adapter) =>
    recorded(real[name] ?? (adapters[name] === undefined ? fallback() : fakeAdapter(name, adapters[name])), calls);
  const resolvers = {
    t3: built('t3', () => fakeAdapter('t3', { declines: true })),
    cli: built('cli', () => fakeAdapter('cli', { declines: true })),
    subagent: built('subagent', () => subagentAdapter(resolverIo)),
  };

  const out: string[] = [];
  const err: string[] = [];
  const deps: Deps = {
    env: {},
    cwd: '/repo',
    packageRoot: '/pkg',
    resolvers,
    io,
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
  };

  // Each call the adapters took, or only those of one method.
  const adapterCalls = (method?: string) => calls.filter(([, m]) => method === undefined || m === method);
  // A file the real subagent wrote, by its path under /repo, or null.
  const savedFile = (path: string) => resolverIo.files.get(`/repo/${path}`) ?? null;

  return { deps, io, stdout: () => out.join(''), stderr: () => err.join(''), adapterCalls, savedFile };
}
