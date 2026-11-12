## Context

This change builds on `t3-worktree-sessions` (#123, pull request #248), which `launchThread` in `lets/src/resolvers/t3/t3.ts` already carries: a review from a linked worktree asks T3 for `existing_worktree`.

- `launchThread(input, { readOnly, effort })` sets `interactionMode: readOnly ? 'plan' : 'default'`. `readOnly` is used for nothing else. `run` passes `true`, and `start` passes `false`.
- `waitForText` polls T3's database. A completed run returns its newest assistant message. A pending request or a `waiting` run throws `SessionFailed('the session stopped to ask')`. #102 changes the `waiting` branch next, so this change leaves that branch alone.
- `run` catches every error from `waitForText`. It archives the thread only on `Refused`, and appends ` (thread <id>)` to every kit error. A `SessionFailed` therefore exits 5 and keeps the thread.
- T3 records a run's items in `orchestration_v2_projection_turn_items`, with a `type` column. A plan is type `proposed_plan`. It records a thread in `orchestration_v2_projection_threads`. Its `payload_json` holds `worktreePath` (null for the project's root) and `branch`. A project's root is `workspace_root` in `projection_projects`.
- `Adapter.run` in `lets/src/resolvers/kit/adapter.ts` returns `{ handle, text }`. `review.ts` passes the top level of the caller's checkout as `cwd`, and prints the JSON line from the handle, the family and the timing. `DEFAULT_TIMEOUT_MINUTES` is `{ low: 15, medium: 15, high: 45 }`, and only `review.ts` reads it.
- `cli` runs the CLI with `cwd` as its working directory. `subagent`'s `run` always throws `Refused`.

## Goals / Non-Goals

**Goals:**

- Every `t3` review thread opens in default mode, and no `t3` review exits 0 on a plan.
- The JSON line names where the session ran and the commit it left there, and `t3` takes the checkout from T3, not from its own request.
- The change to `waitForText` is one check in its `completed` branch, so #102 can rework the `waiting` branch without meeting it.

**Non-Goals:**

- `lets` comparing the checkout with the caller's own (D12). The skills compare.
- Changing how a handoff opens, or the JSON line of a handoff or a step.
- `lets-review-pr`, and every other skill but the two review skills (D15).

## Test Seams

- **Primary test seam:** `lets delegate review run`, through `run(options, deps)` in `tests/lets/delegate/review.test.ts`, with the scripted adapters and git of `tests/lets/delegate/fixtures/command-deps.ts`. It covers the time limits, the two new fields and their order, and a `HEAD` that cannot be read.
- **Existing seams reused:**
  - The `t3` adapter, through `createAdapter(io).run(...)` in `tests/lets/resolvers/t3/t3.test.ts`, with its in-memory T3 database (`addThread`, `addRun`, `addMessage`) and the fake WebSocket's launch log. It covers the mode, the proposed plan and the checkout T3 records.
  - The `review` command with the real `cli` adapter, in `tests/lets/resolvers/cli/delegate.test.ts`. It covers `checkout` being the command's checkout, and its commit.
  - `tests/skill-interfaces.bats` (`skill_says`) for the two skills' text.
- **Fixtures to update:**
  - `command-deps.ts` answers every `git rev-parse` with `/repo`. It gains an answer for `rev-parse HEAD`: a fixed hash, a failure when asked, and a new hash after the session when asked. Its fake adapters return `checkout: input.cwd` unless the test gives another.
  - `addThread` in `t3.test.ts` writes `interaction_mode` `plan` and `payload_json` `{}`. It gains a `worktreePath` option, and a helper adds a turn item of a given type.
  - The existing test *run launches a plan-mode thread…* becomes a default-mode one. The key-order test in `review.test.ts` gains the two keys.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the `t3` and `cli` resolvers, the kit's `Adapter.run` result and default limits, the `review` command's JSON line and help text, two skills, and `docs/resolvers.md`. The JSON line only gains fields. A review thread now opens in a mode that lets the model write files, so the tree check carries the read-only guarantee alone. No config, schema or stored data changes.

## Decisions

1. **`buildLaunch` always sends `interactionMode: 'default'`.** `LaunchInput` drops `interactionMode`, and `launchThread` drops `readOnly`, which then has no other use. *Alternative:* keep the option and pass `'default'` from `run`. That leaves a plan-mode path that nothing should take. A test asserts the mode on both `run` and `start`.
2. **The read-only guarantee stays the tree check.** The thread keeps `runtimeMode: 'full-access'`, so a reviewer can run the tests and read the diff, as the delegated review in the #221 comment did (D2). *Alternative:* an approval-required runtime mode. Every command would then raise a pending request, which `waitForText` reads as "stopped to ask", and the review would exit 5. This decision moves a trust boundary, so the ADR step records it.
3. **A proposed plan is one query, in the `completed` branch.** A new exported `hasProposedPlan(db, runId)` counts the run's items of type `proposed_plan`. `waitForText` calls it after a run is `completed`, before it reads the message, and throws `SessionFailed('the session returned a plan, not a result')`. `run` appends the thread, and keeps the thread because the error is not `Refused` (D3, D4). *Alternatives:* add a field to `readRun`, whose result #102 also reads, so both changes would touch one shape. Or check only the run's last item. Its order then depends on ordinals that T3 assigns, and a checkpoint item can follow the plan.
4. **`Adapter.run` returns `checkout: string | null`.** It is required in the type, so each resolver must say where the session ran. `cli` returns its `cwd`. `t3` reads its checkout after `waitForText` returns: the thread's `worktreePath`, else the root of the thread's project, else `null` when T3 has no row or the payload does not parse (D9, D10). *Alternative:* put it in the handle. `review.ts` would then have to know the shape of each resolver's handle.
5. **`review.ts` reads the commit.** After the empty-text check and before the tree check, it runs `git rev-parse HEAD` in `checkout`. A failure, or a null checkout, gives `commit: null` (D8, D11). The read lives in `lets/src/delegate/git.ts` beside `repoRoot`. *Alternative:* each resolver reads it. That repeats one git call in every resolver.
6. **The new keys follow `handle`.** The line is `for, resolver, family, model, independent, handle, checkout, commit, gitClean, durationSeconds`. The help text in `lets/src/main.ts` lists them in that order.
7. **The limits change in the kit.** `DEFAULT_TIMEOUT_MINUTES` becomes `{ low: 30, medium: 30, high: 45 }`. The `--timeout-minutes` help says `default: 30, or 45 with --effort high` (D6, D7).
8. **The skills use one fixed report line.** Before it writes the prompt, the skill notes its own top level and full `HEAD`. A reviewer that commits moves `HEAD`, so a `HEAD` read after the review would match it. Each prompt starts with that path, the branch and that `HEAD`, and tells the reviewer to read files only there. It ends by asking for a last line `Read: <absolute path> <full commit>`, from `git rev-parse --show-toplevel` and `git rev-parse HEAD`. After an exit 0, the skill compares the meta line's `checkout` and `commit`, and the reviewer's `Read:` line, with the path and `HEAD` it noted before the review. Any difference, a `null`, or a missing `Read:` line means the review saw other code. The skill then records no review, shows the user the meta file and the line, and stops (D13, D14). The subagent path checks the `Read:` line only, since it has no meta line. *Alternative:* free-form reporting. A skill could not compare it reliably.
9. **Docs.** `docs/resolvers.md` says that a `t3` review runs in default mode, that a plan exits 5, and that the JSON line names the checkout and commit. Its smoke test's step 2 also expects `"checkout"` to be the checkout you ran it from (D17).

## Risks / Trade-offs

- [A default-mode reviewer writes or commits in the checkout.] → The tree check exits 7 on a changed file. A commit leaves the tree clean, but moves `HEAD`, so `commit` differs from the caller's and the skill records no review (D11).
- [A reviewer changes what neither check sees: files inside `.git/`, such as hooks or config, or another branch's ref.] → Not caught. `git status` ignores `.git/`, and `commit` reads only the checkout's `HEAD`. ADR-024 records the limit. In plan mode, the thread already ran with `runtimeMode: 'full-access'`, so this limit is not new.
- [A reviewer writes in another checkout, which the tree check does not watch.] → `checkout` then names that checkout, and the skill's comparison fails. #123 already opens the thread in the caller's worktree.
- [T3 renames `proposed_plan`, or stops writing `worktreePath`.] → Each is one query in `t3.ts`, tested against T3's schema fixture. A missing `worktreePath` reads as the project's root, so the comparison fails safe in a worktree. The smoke test's step 2 shows the checkout after each T3 update.
- [A 30-minute limit holds a stuck caller longer.] → A session that stops to ask still exits 5 at once. Only a session that keeps working runs to the limit.
- [Callers that compare the whole JSON line break on new keys.] → The two skills read it by key. The spec already lists the fields by name.

## Migration & Rollback

N/A. Nothing stored changes shape. The JSON line gains two keys, which readers by key ignore. To roll back, revert the change. Threads that already exist are not affected.
