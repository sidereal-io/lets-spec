## Why

When its pull request merges, a work item should be marked done on whatever backlog provider holds it. Today only GitHub does this, through `Closes #<n>` in the pull request. A backlog provider such as Jira Cloud (#142) has no way to do it, and `lets backlog` has no command for it. This change adds the command, so a person or a later CI job can complete any item after a merge.

## What Changes

- **A new command, `lets backlog complete <key>`.** It completes the item on the backlog provider in use, and returns `{ result: completed }` (D1). Nothing in the skills calls it, and no CI job is added (D1).
- **A new `complete` primitive on the backlog adapter.** Each backlog provider says what completing an item means.
- **GitHub:** `complete` closes the issue as completed when it is open, and changes nothing when it is already closed. lets writes no Status; the Project's own workflow sets it on close (D3).
- `complete` checks only that the key names an item. A key the backlog provider does not use, or an item that does not exist, gives `not-found`. It does not look for a merged pull request, and it does not refuse an epic or an item someone has claimed (D4, D6).
- A failed write gives `{ result: failed, message }` and exits 0, like `claim` and `release` (D5).
- The help text lists `complete`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-backlog`: adds the requirement that `complete` closes the work item on the backlog provider in use.

## Impact

- **Code:** `lets/src/backlog/adapter.ts` (the new primitive), `github.ts` (GitHub's `complete`), `commands.ts` (the command and help text), and `policy.ts` if the shared result shape lives there.
- **Tests:** a new `tests/lets/backlog/complete.test.ts` with the fake adapter, and the command tests.
- **Skills and schemas:** none. Calling `complete` after a merge is cut, and the pull request reference is #261.
- **Dependencies:** stacked on #259 (#257), which brings string keys and the provider setting.
