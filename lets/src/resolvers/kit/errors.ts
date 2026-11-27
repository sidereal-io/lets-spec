// The exit codes of lets delegate, and the errors that map to them. A command
// catches only these classes; anything else is a bug and propagates.

export const EXIT = { ok: 0, usage: 2, noSession: 3, spawn: 4, timeout: 6 } as const;

// The command line or the config is malformed.
export class UsageError extends Error {}
// No fresh session can run here: the harness or the account said no before
// the model gave any output. The harness is not running or not set up,
// there are no tokens left, or it cannot run the model.
export class Refused extends Error {}
// An outcome lets cannot know, such as no reply from the harness, or an
// error an adapter did not expect.
export class SpawnError extends Error {}
// The session started and failed: an error, or it stopped to ask. The
// message is the reason. It has no exit code: lets delegate step run turns
// it into a failed report, and anywhere else it is an outcome lets cannot
// tell, which exits 4.
export class SessionFailed extends Error {}
// The session did not finish in time.
export class TimeoutError extends Error {}

// The exit code for one of the errors above, or null for any other error.
export function exitCodeOf(error: unknown): number | null {
  if (error instanceof UsageError) return EXIT.usage;
  if (error instanceof Refused) return EXIT.noSession;
  if (error instanceof SpawnError) return EXIT.spawn;
  if (error instanceof TimeoutError) return EXIT.timeout;
  return null;
}
