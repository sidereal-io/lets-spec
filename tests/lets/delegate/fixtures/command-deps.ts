// Deps for the delegate commands. git is scripted: the repository root is
// /repo, HEAD is HEAD, and the tree is clean. The resolvers built into lets
// are fake adapters, but for subagent, which is the real one, writing to a
// fake io. Every adapter records each call it takes.
//
// options:
//   adapters:  how each resolver built into lets behaves, by name, as a
//              FakeResolver; t3 and cli decline by default, and subagent is
//              the real one
//   real:      a real adapter to use in place of a fake, by name, such as
//              the T3 adapter on a fake io
//   files:     the files there are; default the prompt file /repo/p.md
//   config:    the text of the user's lets config, CONFIG, when there is one
//   repoConfig: the text of the repository's lets config, REPO_CONFIG, when
//              there is one
//   notInRepo: true when `git rev-parse --show-toplevel` fails, as outside a
//              Git repository
import type { ResolverName } from '../../../../lets/src/delegate/config.ts';
import type { Deps } from '../../../../lets/src/io.ts';
import type { Adapter, Handle, RunInput, StepInput } from '../../../../lets/src/resolvers/kit/adapter.ts';
import { Refused } from '../../../../lets/src/resolvers/kit/errors.ts';
import { createAdapter as subagentAdapter } from '../../../../lets/src/resolvers/subagent/subagent.ts';
import { fakeIo as fakeResolverIo } from '../../resolvers/kit/fixtures/fake-io.ts';
import { fakeIo } from './fake-io.ts';

const PROMPT_FILE = '/repo/p.md';
export const CONFIG = '/home/u/.config/lets/config.yaml';
export const REPO_CONFIG = '/repo/.lets/config.yaml';
// The commit at HEAD.
export const HEAD = '0123456789abcdef0123456789abcdef01234567';
// The final message of a step that went well.
const DONE_REPORT = 'All done.\n\n```step-report\noutcome: done\nevidence:\n  - commit 3f2a1c0\n```\n';

// How a fake resolver behaves. By default it detects, runs steps, lists
// gpt/fake-model, and answers run with FINDINGS on handle <name> <name>-1
// in the checkout it was asked for, and step with a done report on handle
// <name> <name>-1.
//   declines: detect() is false
//   steps:    false when it has no step
//   refuse:   the models run and step refuse, as --model gives them
//   run, step: the answer, or the error to throw
//   finish:   the error finish throws
type FakeResolver = {
  declines?: boolean;
  refuse?: string[];
  run?: { text?: string; handle?: Handle; checkout?: string | null } | Error;
  steps?: boolean;
  step?: { text?: string; handle?: Handle } | Error;
  finish?: Error;
};

// One call an adapter took: the resolver, the method, and its input.
type AdapterCall = [ResolverName, string, unknown];

// The model an input asks for, as --model gives it.
const modelOf = ({ family, model }: { family: string; model: string | null }) => (model === null ? family : `${family}/${model}`);

function fakeAdapter(name: ResolverName, behaviour: FakeResolver = {}): Adapter {
  const handle = { kind: name, id: `${name}-1` };
  const answer = <T>(value: T | Error): T => {
    if (value instanceof Error) throw value;
    return value;
  };
  const refuses = (input: RunInput) => {
    if (behaviour.refuse?.includes(modelOf(input))) throw new Refused(`refused ${modelOf(input)}`);
  };
  return {
    name,
    detect: () => behaviour.declines !== true,
    options: async () => ['gpt/fake-model'],
    async run(input) {
      refuses(input);
      const { text = 'FINDINGS', handle: made = handle, checkout = input.cwd } = answer(behaviour.run ?? {});
      return { text, handle: made, checkout };
    },
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
  const { step } = adapter;
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
  files?: Record<string, string>;
  config?: string;
  repoConfig?: string;
  notInRepo?: boolean;
};

export function commandDeps({
  adapters = {}, real = {}, files = { [PROMPT_FILE]: 'PROMPT TEXT' }, config, repoConfig, notInRepo = false,
}: Options = {}) {
  const io = fakeIo({ files: { ...files, ...(config === undefined ? {} : { [CONFIG]: config }), ...(repoConfig === undefined ? {} : { [REPO_CONFIG]: repoConfig }) } });
  const calls: AdapterCall[] = [];
  io.execFile = async (cmd, args, opts = {}) => {
    io.calls.push([cmd, args, opts]);
    if (cmd === 'git' && args.join(' ') === 'rev-parse HEAD') return { stdout: `${HEAD}\n`, stderr: '', code: 0 };
    if (cmd === 'git' && args[0] === 'rev-parse' && notInRepo) return { stdout: '', stderr: 'fatal: not a git repository', code: 128 };
    if (cmd === 'git' && args[0] === 'rev-parse') return { stdout: '/repo\n', stderr: '', code: 0 };
    // git status: a clean tree.
    if (cmd === 'git') return { stdout: '', stderr: '', code: 0 };
    throw new Error(`no program but git runs here: ${cmd}`);
  };

  // What the real subagent writes, by its path under /repo.
  const resolverIo = fakeResolverIo();
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
