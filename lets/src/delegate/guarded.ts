// How a command fails. A known error becomes its exit code and one line on
// stderr, after the command's prefix; anything else is a bug, and is thrown on.
import type { Deps } from '../io.ts';
import { exitCodeOf } from '../resolvers/kit/errors.ts';

// fn's exit code, or the exit code of the known error it threw.
export async function guarded(deps: Pick<Deps, 'stderr'>, fn: () => Promise<number>, prefix = 'lets delegate: '): Promise<number> {
  try {
    return await fn();
  } catch (error) {
    const code = exitCodeOf(error);
    if (code === null) throw error;
    deps.stderr(`${prefix}${(error as Error).message}\n`);
    return code;
  }
}
