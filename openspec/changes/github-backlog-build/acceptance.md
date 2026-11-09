# Implementation and acceptance evidence

Date: 2026-11-08. Delivery remains issue #136 and draft PR #172.
Implementation follows the reviewed submitted-output plan, including D10,
D12–D15 and the round-four fixes. No capture service or executor was installed.

## Automated checks

The implementation checklist is complete. Each task has local Conventional
Commit history and verification evidence in tasks.md. The final live-query
correction is `74077144`.

After that correction, `pnpm test` passed all 940 Node tests, type checking
and all 387 shell tests. `nix flake check` passed the x86_64-linux command,
module, Node, flow and distribution checks. Other systems were not checked.

The parent-body regression accepts an Epic with only Kind while rejecting
missing story metadata and ambiguous supplied fields. Actual runner acceptance
then exposed GitHub's GraphQL node limit: the original search and candidate
query shapes could request 1,000,000 nodes. Their outer pages now contain 20
items, retaining pagination, total-count checks and nested coverage validation.
Both budget tests failed before that correction; the provider suite then passed
all 49 tests.

## Fresh live scope and configuration

Only these newly created resources were changed in
`mstelz/test-repo-pls-ignore` and
[Project 7](https://github.com/users/mstelz/projects/7):

| Host | Fresh story | Fresh PR | Fixture head |
|---|---|---|---|
| Unchanged T3 session | [#15](https://github.com/mstelz/test-repo-pls-ignore/issues/15) | [#17](https://github.com/mstelz/test-repo-pls-ignore/pull/17) | `fec8fb611265315d68fe020ecbfe41c0a0f299eb` |
| Standalone Codex CLI | [#16](https://github.com/mstelz/test-repo-pls-ignore/issues/16) | [#18](https://github.com/mstelz/test-repo-pls-ignore/pull/18) | `1c49bb0555792530bf78e1960ed0d1eef19f60a2` |

Both used the shipped `github` definition, version 1.0.0, and implicit default
`gh` connection without a connection override. Observed versions were Node
26.13.0, gh 2.100.0 and, for standalone steps, Codex CLI 0.167.0 with
gpt-6.1-sol at medium effort. T3 itself was unchanged.

The sessions explicitly selected the same private machine state directory.
Real operation records proved write and locking access from the native T3
delegated session and actual standalone `lets delegate step run` sessions.
The directory had mode 0700 and records mode 0600. Native T3 delegation here
means a child in the existing session; it does not qualify a separate sidebar
thread or the T3 delegation resolver.

Every backend call used the action's exact arguments, a 30-second command
deadline and a combined 1 MiB output limit. Agent-side execution enforced those
bounds one action at a time and saved complete output for submission. This
accepts submitted observations; it does not independently authenticate them.

Changing the standalone process's XDG configuration directory initially hid
the existing gh login. The read failed without a remote mutation. Explicitly
preserving gh's existing configuration directory resolved that prerequisite.
In both delegated environments, an unavailable selected tool produced
`unsupported`, effects `none`, and no action before issuance.

## Observed lifecycle results

- T3 repository bootstrap and Project discovery returned the exact repository,
  actor and selected Project. No Project selection was inferred from a fixed
  item scan.
- A real T3 claim status write was executed with its submission intentionally
  withheld. A new ownership request found the pending mutation. After the
  scratch continuation was removed, resume by original operation ID issued
  only a verification read, confirmed applied effects and cleared the
  reservation. A separate fresh ownership read then returned `sole-actor` and
  In Progress. No assignment or status write was repeated.
- The standalone CLI read the complete fresh issue thread and directional
  blockers, completed a native best-effort claim, and checked ownership in a
  new worker without adopting historic release authority.
- Both fresh PR creates requested and returned drafts. The T3 creation
  submission expired while the host linking call was pending; read-only resume
  confirmed the existing draft and cleared the reservation without another
  create. The standalone CLI deliberately withheld its creation submission;
  a later real CLI step reconciled the original operation in the same way.
- Both prepared PR-body updates preserved original text and their exact
  `Closes` references, and passed fresh verification reads. The standalone
  step refreshed ownership again after its update.
- The first standalone interrupted-create step omitted its final report fence.
  Lets returned `failed` despite the successful GitHub actions. The separate
  recovery/update step returned a valid `done` report. That later report does
  not rewrite the earlier failure.

The created branches contain only fresh acceptance markers. PR #18 was closed
without merging, retaining its branch to exercise the rejected-PR stop. PR #17
remains a draft. Both issues remain In Progress; no terminal completion update
was requested. No historical issue, fixture or PR was mutated or replayed.

The actual source runner in both a native T3 delegated session and a fresh
standalone CLI invocation followed startup, scoped branch and number lookup,
blocker and packet/thread reads, routing,
branch update and question-mode selection. It checked the working tree before
its fresh branch-scoped PR read returned CLOSED for PR #18, then stopped with
“the change was rejected and there is nothing to resume.” All nine operations
in each successful invocation were reads. No ownership-for-work check, claim,
completion request or workflow step followed the terminal result.

The first terminal attempts exposed the query budget defect described above.
Later attempts stopped because the acceptance clone tracked only main; an
explicit local fetch populated the surviving branch’s remote-tracking ref
without changing its head. A standalone retry also stopped after the agent
chose an unsupported GitHub number qualifier. These attempts do not qualify
the terminal path. The later successful runs used the ordinary scoped query
`repo:mstelz/test-repo-pls-ignore is:issue 16` and reached the stop with fresh
observations after all prerequisites passed.

`openspec validate github-backlog-build --strict` also passed after the final
implementation changes.

## Live check of every GitHub operation

On 2026-11-08 and 2026-11-09, fresh resources in the same repository and
Project ran every operation that the shipped `github` definition maps. Each
used the implicit `gh` connection, and an agent ran each issued action once and
submitted its output, as before. Two builds of this branch were used:

- **The #19 run** used a build of `26a824e0`, which holds the first code
  review's fixes but not the second's. A standalone Codex CLI session
  (gpt-6.1-sol) ran the lets-go runner. A Claude Code session ran the later
  operations directly through `lets backlog`.
- **The final run** used a build of `625244e9`, which holds every fix. The
  Claude Code session ran it directly through `lets backlog`.

| Operation | Build and host | What happened |
|---|---|---|
| `repository.read`, `backlog.list`, `item.search`, `relationship.list`, `claim.read` | #19 run, standalone CLI | Completed with real reads of [#19](https://github.com/mstelz/test-repo-pls-ignore/issues/19), its thread, its blockers and its branch. |
| `item.read` | #19 run, standalone CLI; final run, direct | Read #19 with its thread. On the final build it read #19's Kind and its Done status. |
| `claim.acquire` | #19 run, standalone CLI | Assigned #19 and set it In Progress. |
| `claim.release` | #19 run, standalone CLI | The first run failed to create a branch, because the issue title had no change name. Claim released the issue, and #19 went back to no assignee and Todo. |
| `candidate.list` | #19 run, direct | Listed only the unclaimed Todo stories, and left out the claimed #19. |
| `pull-request.create` | #19 run and final run, direct | Created draft [PR #20](https://github.com/mstelz/test-repo-pls-ignore/pull/20) with `Closes #19`, then draft [PR #21](https://github.com/mstelz/test-repo-pls-ignore/pull/21) on the final build, which also checked the requested base. Fresh reads confirmed both. |
| `pull-request.read` | Both runs | Read the branch PRs, and read PR #20 as `MERGED` after the owner merged it. |
| `pull-request.update` | Final run, direct | Updated PR #21's body, and a fresh read confirmed the exact text. Earlier, PRs #17 and #18 checked it from T3 and the standalone CLI on an older build. |
| `pull-request.ready` | #19 run and final run, direct | Marked PRs #20 and #21 ready, and fresh reads confirmed them. A second request on the ready PR #20 sent the same mutation again, which GitHub treats as a no-op. |

The final run's PR requests carried no Project. The test repository selects no
Project in its configuration, though, so the fix for a configured Project is
checked offline only. These second-review fixes are also checked offline only:
refusing a submission to a failed operation, keeping effects unknown after a
write, rejecting configured mappings, reporting an unshaped issue, and ending a
reservation after one complete reconciliation read.

In the #19 run, three requests that the runner built wrongly failed in Lets
before any action, with effects `none`. A delegated plan step also ran in its
own session and asked for confirmation, as lets-brainstorm requires. Lets-go was
not taken through build and review build: this check covers the GitHub
operations, not the workflow skills.

The repository owner merged PR #20. A fresh `pull-request.read` of its branch
returned it as `MERGED` with merge commit `2b7203a`, the observation lets-go's
merged-PR stop acts on. GitHub closed #19 through `Closes #19`. PR #21 was
closed without merging after the final run.

The shipped definition maps no GitHub action for `item.create`, `item.update`,
`relationship.write`, `backlog.create`, `backlog.check`, `completion.write`,
`capability.read`, `mutation.read` or `reference.write`. They keep their
offline conformance only.

## Remaining qualification and delivery boundaries

The user accepted the live check of every mapped GitHub operation, with the
merged-PR read above, as the qualification for this change. Two things remain
unqualified live: a complete planning, build and review journey through
lets-go, and an MCP-only host. Neither follows from automated checks or from
the evidence above.

The replacement was published to draft PR #172 by a normal fast-forward of
its existing branch, preserving the PR's ownership and history. No competing
delivery PR was created. The test PRs above are disposable acceptance resources, not replacements for
PR #172.

## Code review

An independent Claude Opus 5.5 review of `main..1ea34426` reported ten
findings. Six were confirmed and fixed in their own commits, with tests:
local CLI errors and correctable rejected reads no longer ask for
reconciliation; a preflight that fails before any write releases its
reservation; submit uses the continuation it checked; MCP and `signal: null`
execution reports are accepted; and caller responses name the definition by
digest. Four were refuted against the specs and design. PR #172's Code review
section lists each verdict.

Merging main's plain-language pass (#225) then changed five skills, so the
branch was reviewed again, as `main..021aaaf8`. The resolver fell back from
Gemini to GPT 6.1 Sol, which is independent of the Claude-authored fixes and
merge but not of the GPT-authored original work. It reported six findings. All
six were confirmed and fixed in their own commits, with tests:

- a submission to a failed operation is refused, so it cannot write past a
  newer reservation;
- any read failure after a write keeps effects unknown;
- PR creation and verification check the requested base;
- a repository-only PR request may omit the configured Project;
- configured `mappings` are rejected while no definition applies them;
- `item.read` reports an issue with no Kind, or not on the Project, as
  unshaped instead of failing, so lets-go can route it to shaping.

After those fixes, `pnpm test` passed all 959 Node tests, type checking and
all 387 shell tests, `nix flake check` passed the x86_64-linux checks, and
`openspec validate github-backlog-build --strict` passed. PR #172's Code
review section lists each verdict.
