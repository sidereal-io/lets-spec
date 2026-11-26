// Journey tests: each runs several lets commands in one temporary Git
// repository, in the order lets-go runs them, and takes each value the
// next command needs from what the last one printed. They check the joins
// between the commands, not each command: the tests beside each command
// group do that.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { itemList, issue, issueState, json, LOOKUP_ONE } from '../backlog/github.ts';
import { type DelegateRepo, delegateRepo, PROMPT } from '../delegate/repo.ts';
import { agyWrite, claudeWrite, cleanUpStep, codexWrite, ending, untilGone } from '../delegate/steps.ts';
import { agy, claude, codex, type LetsResult, sharedState, type StandInRow, standIn, tempDir } from '../support/lets.ts';
import { useRelease } from '../sync/project.ts';

const release = useRelease();
const CLI = 'version: 3\ndelegate: { resolvers: [cli] }\n';

/** What `lets delegate step wait` prints when one of its steps ends. */
interface Ended {
  name: string;
  exit: number;
}

/**
 * Checks that `lets <command>` exited `code` (0 when absent). Needs the
 * `result` of that command and the words after `lets`, to name it.
 * Throws an assertion error, holding the command and all it printed,
 * when it did not.
 */
function exited(result: LetsResult, command: string, code = 0): void {
  assert.equal(result.code, code, `lets ${command} exited ${result.code}:\n${result.output}`);
}

/**
 * The one JSON value `lets <command>` printed on stdout. Needs the
 * `result` of that command and the words after `lets`, to name it.
 * Throws an assertion error, holding the command and all it printed,
 * when it exited other than `code` (0 when absent) or when stdout is not
 * exactly one line of JSON.
 */
function printed(result: LetsResult, command: string, code = 0): any {
  exited(result, command, code);
  assert.match(result.stdout, /^[^\n]+\n$/, `lets ${command} printed other than one line on stdout:\n${result.output}`);
  return JSON.parse(result.stdout);
}

/**
 * The session name lets-go gives an item: the text of its `title` before
 * ` — `, then `-<step>`, so `story-149 — outcome` and `plan` give
 * `story-149-plan`. Throws when the title holds no ` — `.
 */
function sessionName(title: string, step: string): string {
  throw new Error('not built yet');
}

/**
 * Runs `lets delegate step wait` in `repo` with a `--name` for each of
 * `names` still running, again and again, until none is, as lets-go
 * does. Returns what each run printed, in the order the steps ended.
 * Throws an assertion error, holding the output, when a run exits other
 * than 0 or names a step that was not still running.
 */
async function waitForAll(repo: DelegateRepo, names: string[]): Promise<Ended[]> {
  throw new Error('not built yet');
}

test('the story journey: sync, then ready, item and claim, then a plan step on the models instructions lists', async (t) => {
  const repo = delegateRepo(t, { user: CLI });
  standIn(repo.standIns, 'openspec', [{ args: ['--version'], stdout: '1.3.0\n' }]);
  // lets sync finds no release without it.
  const env = { WORKFLOW_RELEASE: release() };

  exited(await repo.run(['sync'], { env }), 'sync');
  exited(await repo.run(['sync', '--check'], { env }), 'sync --check');
});
