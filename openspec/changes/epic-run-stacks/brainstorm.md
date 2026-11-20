<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#280 epic-run-stacks — a story blocked by another story in the epic stacks on its blocker's branch and pull request.
https://github.com/sidereal-io/lets-spec/issues/280

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | How does an epic run build blockers first? | It already does: `lets backlog ready` lists only stories with no open blocker, and the epic run ranks again after each story. A blocker is always built before the story it blocks. | Evidence: `lets/src/backlog/policy.ts` (`ready`); `skills/lets-go/references/epic-run.md` (*Run the epic*, step 3) |
| D2 | What happens to a story whose open blocker is outside the epic? | It is not built, as today: `not built, blocked by #<blocker>`. | Evidence: #280 Scope |
| D3 | Does a run on a single story, outside an epic run, stack too? | No. Outside an epic run, an open blocker with no branch still stops the run, and the user stacks by hand. | Evidence: #280 Scope ("a blocker in the epic") |
| D4 | Does this change restack a branch after its blocker changes in review? | No. Restacking stays manual. | Evidence: #280 Scope; #278 Won't |
| D5 | Do the review steps need changes for a stacked pull request? | No. `lets-review-plan` and `lets-review-build` already review against the pull request's base, from `gh pr view --json baseRefName`. | Evidence: `skills/lets-review-build/SKILL.md` (`<base>`); `skills/lets-review-plan/SKILL.md` |
| D6 | Which open blocker inside the epic counts as met, so the story stacks on it? | A story of this epic whose pull request is open and ready for review, built in this epic run or an earlier one. A blocker whose pull request is a draft, or that has no pull request, leaves the story `not built, blocked by #<blocker>`. | Assumption |
| D7 | When a story has several open blockers in the epic, when does it stack? | On the one met blocker whose branch already contains every other open blocker's branch. If none does, the line is `not built, blocked by #<a> and #<b>, on different branches`. If any open blocker is not met, the line is `not built, blocked by #<blocker>`. | Assumption |
| D8 | Does a stacked story's draft pull request say what it stacks on? | Yes: one line, `Stacked on #<blocker-pr>; merge that first.`, beside `Closes #<i>`. The pull request targets the blocker's branch. | Assumption |
| D9 | Do the epic run's printed lines show the stack? | Yes. On picking a stacked story it prints `Stacks on #<blocker>: <blocker-branch>, pull request #<blocker-pr>.` A built stacked story's line ends with `, stacked on #<blocker>`. | Assumption |

## Changes from the story

- Narrowed: the packet says a story stacks "when a blocker in the epic has a branch". It stacks only on a blocker with an open pull request ready for review, so it never stacks on unfinished work in a draft (D6).
- Clarified: a story with several open blockers in the epic still stacks when one blocker's branch contains the others. Only blockers on different branches are reported, not built, as the packet's *out* scope says (D7).
- Added: the stacked pull request names the pull request to merge first (D8), and the epic run's lines show each stack (D9).

Confirmed by user: yes
