// lets go questions, run as a program, with a real user's lets config and a
// real repository's lets config. It reads only version and go, and asks no
// resolver, so it shows where each file is, what a file must be and how the
// two merge with the fewest moving parts.
import type { LetsResult } from '../support/lets.ts';

/**
 * The `questions` value of a run that succeeded. Asserts exit 0, an empty
 * stderr and exactly one line on stdout, `{"questions":<value>}`, and
 * returns `<value>`. Fails the test, with the run's output, when any of
 * these does not hold.
 */
function printed(result: LetsResult): unknown {
  throw new Error('not built yet');
}

/**
 * Asserts that a run was rejected for a bad lets config: exit 2, an empty
 * stdout, and exactly one line on stderr that starts `lets go: <file>: `
 * and holds each of `named`. Returns nothing. Fails the test, with the
 * run's output, when any of these does not hold.
 */
function rejected(result: LetsResult, file: string, ...named: string[]): void {
  throw new Error('not built yet');
}
