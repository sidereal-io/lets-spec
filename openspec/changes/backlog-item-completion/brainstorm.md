## Story

#258 backlog-item-completion — a merged pull request completes its work item on any backlog provider.
https://github.com/sidereal-io/lets-spec/issues/258

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | When does completion run? | A `complete` adapter primitive and a `lets backlog complete <key>` command, which a person or a later CI job can run. Nothing in `lets-go` or any other skill calls it, and no CI job is built. | User |
| D2 | Does the pull request reference stay in this story? | No. The adapter-supplied reference that replaces the fixed `Closes #<n>` moves to a new issue. | User |
| D3 | What does `complete` do on GitHub? | It closes the issue as completed when it is open, and changes nothing when it is already closed. Either way the result is `{ result: completed }`. lets writes no Status; the Project's own workflow does. | User |
| D4 | Does `complete` check anything before it acts? | Only that the key names an item: a key the backlog provider does not use, or an item that does not exist, is `not-found`. It does not look for a merged pull request. | User |
| D5 | How does a failed write show? | `{ result: failed, message }`, exit 0, as `claim` and `release` report a failed write. | Evidence: `lets/src/backlog/commands.ts` |
| D6 | Does `complete` refuse an epic, or an item someone else has claimed? | No. It completes any item its key names; the caller decides. | User |

## Changes from the story

- **Cut: the point where `lets-go` calls `complete` after the merge.** A `lets-go` run ends when the pull request is ready for review, so no run is active when the user merges. Wiring it in is not worth the cost yet (D1).
- **Split out: the pull request's work-item reference** (D2), filed as #261. It covers the schemas, `lets-review-build`, `lets-review-plan` and `overlays/AGENTS.md`. #142 depends on it as well.
- **Added: the GitHub adapter closes an open issue** (D3), where the story had `complete` do nothing on GitHub.

Confirmed by user: yes
