// lets delegate step read: print the step report a session's final message
// ends with, as lets delegate step run prints it. It is for a step that ran
// outside lets, such as in a subagent after step run exited 3, so it starts
// no session and reads no lets config. No process access here; everything
// comes through deps.
import { resolve } from 'node:path';
import type { Deps } from '../io.ts';
import { EXIT, UsageError } from '../resolvers/kit/errors.ts';
import { guarded } from './guarded.ts';
import { printedReport, readReport } from './report.ts';

// messageFile: the final message, read from the working directory.
export type ReadOptions = { messageFile: string };

// The exit code: 0 a report is on stdout, whatever its outcome, 2 usage.
export function read({ messageFile }: ReadOptions, deps: Deps): Promise<number> {
  return guarded(deps, async () => {
    const text = readMessage(messageFile, deps);
    deps.stdout(printedReport(readReport(text), deps.io.now()));
    return EXIT.ok;
  });
}

// The text of messageFile. io.readFile gives null for a file that does not
// exist, and throws for others, such as a folder; each is a usage error.
function readMessage(messageFile: string, { cwd, io }: Pick<Deps, 'cwd' | 'io'>): string {
  const fail = () => new UsageError(`cannot read --message-file ${messageFile}`);
  let text: string | null;
  try {
    text = io.readFile(resolve(cwd, messageFile));
  } catch {
    throw fail();
  }
  if (text === null) throw fail();
  return text;
}
