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

## Remaining qualification and delivery boundaries

Full live workflow support remains unqualified. These checks do not establish
a complete planning/build/review journey or MCP-only live support. The merged
terminal path requires a user-directed merge of a fresh fixture; none was
requested or performed. Readiness, archive and production support claims do not
follow from automated checks or the partial live evidence above.

The implementation branch has not been published to PR #172. Its existing
prototype head remains `b2ebe6a9f5d594d3d9ad645f0a416721fcec8be6` at the last
read. Transfer must preserve that existing PR's ownership and reconcile its
active contents with this replacement. No competing delivery PR was created.
The test PRs above are disposable acceptance resources, not replacements for
PR #172. Code review and finishing remain with `lets-review-build`; this build
does not archive the change or mark PR #172 ready.
