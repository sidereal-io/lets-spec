// How lets go records runs an outside command: in one folder, with one
// timeout, and with a failure that becomes exit 4 on one stderr line.
import type { ExecResult, Io } from '../io.ts';
import { SpawnError } from '../resolvers/kit/errors.ts';

export type Run = (cmd: string, args: string[]) => Promise<string>;
export type Exec = (cmd: string, args: string[]) => Promise<ExecResult>;

export const READ_TIMEOUT_MS = 60_000;

// cmd in cwd, with every exit code returned as it is.
export function exec(io: Pick<Io, 'execFile'>, cwd: string): Exec {
  return (cmd, args) => io.execFile(cmd, args, { cwd, timeoutMs: READ_TIMEOUT_MS });
}

// A runner for cmd in cwd: its stdout, or a SpawnError that names it.
export function runner(io: Pick<Io, 'execFile'>, cwd: string): Run {
  return async (cmd, args) => {
    const result = await exec(io, cwd)(cmd, args);
    if (result.code === 0) return result.stdout;
    throw failed(`${cmd} ${args.slice(0, 2).join(' ')}`, result);
  };
}

// The error for command, which ended as result.
export function failed(command: string, result: ExecResult): SpawnError {
  return new SpawnError(`${command}: ${failure(result, command)}`);
}

function failure(result: ExecResult, command: string): string {
  if (result.timedOut) return `timed out after ${READ_TIMEOUT_MS / 1000} seconds`;
  if (result.signal) return `killed by ${result.signal}`;
  const message = oneLine(result.stderr);
  return message || (result.code === null ? `${command.split(' ')[0]} could not start` : `exited ${result.code}`);
}

// text on one line, so guarded prints one line on stderr.
export function oneLine(text: string): string {
  return text.trim().replace(/\s*\n\s*/g, ' ');
}
