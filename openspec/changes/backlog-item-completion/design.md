## Context

`lets backlog` runs each command through `run()` in `lets/src/backlog/commands.ts`. That function selects the backlog provider, turns the typed key into the provider's key (an unknown key is `not-found` before any backend call), builds the adapter, and prints one JSON object. The adapter (`adapter.ts`) holds only the primitives a backend does differently. Reads throw `BacklogError`, and writes throw `WriteFailed`. `policy.ts` turns a `WriteFailed` into a `{ result: failed, ... }` result.

The GitHub adapter finds the one linked Project before anything else (`createGithub`), so every command except `key` needs that Project. `complete` inherits this.

## Goals / Non-Goals

**Goals:**
- One new adapter primitive that each backlog provider can implement in its own terms of "done".
- `lets backlog complete <key>` follows the existing command shape: the same key parsing, errors and exit codes.

**Non-Goals:**
- No caller: no skill, schema or CI job runs `complete`.
- Finding the pull request, or checking that it merged.
- Writing a Project field on GitHub.

## Test Seams

- **Primary test seam:** `run()` in `commands.ts`, driven by the existing fake `gh` (`tests/lets/backlog/fixtures/fake-gh.ts`). The tests assert the printed JSON, the exit code and the `gh` calls, just as `release.test.ts` does.
- **Existing seams reused:** `fake-provider.ts`, which gains a `complete` so it still implements `Adapter`, and a test that a non-GitHub key reaches its adapter.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. It adds a primitive to the `Adapter` contract that every later backlog provider (#138, #140, #142) must implement.
- **Blast radius:** `lets/src/backlog/` (`adapter.ts`, `github.ts`, `policy.ts`, `commands.ts`) and its tests. No skill, schema or config changes.

## Decisions

1. **The primitive is `complete(key): Promise<void>`, and it is idempotent inside the adapter.** The adapter reads whether the item is already done and writes only when it is not. What "done" means is the provider's own business: a closed issue on GitHub, and a status in the Done category on Jira. *Alternative:* policy reads `readItem().state` and calls a bare `close` write. That fails because `state` is provider text that policy would have to interpret for each provider, and `readItem` on GitHub also reads the whole Project. This choice keeps policy provider-neutral.
2. **GitHub reads with `gh issue view <n> --json state`, and writes with `gh issue close <n> --reason completed`.** The read goes through the existing `read()`, so a missing issue is `not-found` and any other read error is `backend-failed`. The write goes through `write()`, so a failure or timeout is `WriteFailed`. No Project field is written (D3). The Project's built-in workflow moves Status on close.
3. **`policy.ts` gets `complete(adapter, key)`,** which returns `{ result: 'completed' }`, or `{ result: 'failed', message }` when `WriteFailed` is thrown. There is no `write` field, because there is only one write. The catch lives with the claim and release sequences, so every command turns a failed write into a result in one place.
4. **`commands.ts` registers `complete <i>`,** using `itemKey` and the `typed` path. A GitHub key that isn't a number is then `not-found` before `createGithub` runs. The help text adds `complete <i>  { result: completed } | { result: failed, message }`, and the program description becomes "Read, claim and complete work…".

## Risks / Trade-offs

- [The issue closes between the read and the write] → `gh issue close` on a closed issue exits 0 with a warning, so the result is still `completed`. If it doesn't, the result is `failed` with `gh`'s message, which is safe to retry.
- [A CI job needs the GitHub Project as well as the issue, because `createGithub` looks it up first] → This is accepted. It matches every other command, and CI was out of scope (D1). A later CI story can move the lookup if it matters.
- [A new primitive is a contract every later adapter must meet] → It is small: one method, one meaning. The fake provider implements it now, so the tests show its shape.

## Migration & Rollback

N/A. It is a new command. Reverting the commits removes it. Nothing stores state.
