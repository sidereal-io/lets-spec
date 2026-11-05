## Context

`lets-standard` has seven artifacts. `review` requires `proposal`, `design`, `adr` and `specs`, and `tasks` requires `review`. The `review` instruction runs `lets-review-plan`, adds five checks to its prompt, and has it write `review.md` from a template with a `VERDICT:` line and a `CHANGES_APPLIED:` line. The `tasks` instruction reads those two lines and stops when they are not approving. `openspec-propose` walks these edges, so today it runs the review in the middle of the plan.

`lets-review-code` is the other shape. A rule in `operations.archive` runs it once every task is done. It writes a **Code review** section in the pull request description, whose first line is `Reviewed: <base> <base-sha>..<head-sha>`, and its *Check an earlier review* reads that line to decide whether a later run needs a new review.

`lets-build`'s *Apply* invokes `openspec-apply-change` and nothing else. `lets-go` runs review plan inside plan: after the plan step reports `done`, it reads `review.md`'s verdict and the commit that wrote it, and prints `Done review plan: review.md says VERDICT: ...`. Its spec and `tests/skill-interfaces.bats` pin those strings. The skills, schemas and README are prose: the bats tests are the only thing that checks them.

This change is the second of six stacked on #177, after `step-names`. #186 makes review plan a step of its own, with a session and a report; this change does not.

## Goals / Non-Goals

**Goals:**
- One shape for both reviews: a section in the pull request, a `Reviewed:` line first, and a check that reads it.
- `openspec-propose` builds the whole plan, brainstorm through tasks, with no review in the middle.
- Build waits for the review on `lets-standard`, through `lets-build`, and nothing waits on `lets-minimal`.
- `lets-go` keeps printing a dated review plan line, read from GitHub and Git.

**Non-Goals:**
- Running the review as its own step, session or report (#186).
- Changing when a review runs, by flow or by config, beyond today's behaviour.
- A spec for `lets-review-plan`, `lets-build` or the schemas. None exists, and the bats tests pin them.
- Touching archived changes or decision records.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. It reads the skills, schemas, templates and README as text, and checks the fixed strings and the names that point at real things.
- **Existing seams reused:** `tests/openspec-compat.bats`, which builds a change from each schema's templates and runs OpenSpec's CLI over it; `tests/release-build.bats` and `nix flake check`, which build both flows.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `schemas/lets-standard/`, four skills, the README and one bats file. Outside the repository: every project on `lets-standard`, whose plans lose an artifact and whose builds gain a gate after `lets sync`.

## Decisions

1. **The section's shape.** The pull request description gets a `## Plan review` section, after **Code review**'s pattern. Its first line is `Reviewed: <sha>`, where `<sha>` is `git rev-parse --short HEAD` at the time of the review, on a clean tree. Then a bullet list: **Reviewer**, as the code review writes it, with the reviewer context (`fresh context, other family`, `fresh context, same family` or `subagent, same family`) and whether it was independent; **Round**, with the prior round's verdict or `none`; **Vocabulary inputs**; **Verdict**, as `- **Verdict:** APPROVE`, `APPROVE_WITH_CHANGES` or `REVISE`; **Findings**, each with its label, its check and CONFIRMED, REFUTED or OUT-OF-SCOPE; **Required changes**, under APPROVE_WITH_CHANGES; and **Rebuttals**, one per finding, `fixed` with its commit or `rebutted` with its evidence. An injection attempt is a finding, so the old heading for it goes. The readers match `Reviewed: ` and `**Verdict:** ` at the start of a line. Alternative: a bare `VERDICT: <value>` line, as `review.md` had. Rejected: the code review's section is a bullet list, and one shape is the point.
2. **One commit, and three staleness rules.** `Reviewed:` names one commit, not a range: the plan is the files under `openspec/changes/<name>/` at that commit, and the reviewer has no diff to make. The new *Check an earlier review* in `lets-review-plan` runs the skill again when: the section or its `Reviewed:` line is missing; its verdict is `REVISE`; `git merge-base --is-ancestor <sha> HEAD` fails; or `git log --oneline <sha>..HEAD -- openspec/changes/<name>/` lists a commit the section's rebuttals do not name as a fix, or names as a fix but whose `git show` touches more than the plan. The code review's base rule stays out: it catches commits that become part of the pull request when the base changes, and a plan review covers no commit range. Alternative: compare contents with `git diff --quiet <sha> HEAD -- openspec/changes/<name>/`. Rejected: a fix commit under APPROVE_WITH_CHANGES changes the folder on purpose, and the rule needs the commit list to exempt it.
3. **The review is finished when build may start.** `APPROVE` is finished. `APPROVE_WITH_CHANGES` is finished when each required change's rebuttal names its fix commit. `REVISE`, or a required change with no fix commit, is not. `CHANGES_APPLIED:` goes: the `tasks` step was its only reader. Alternative: keep the line. Rejected: a second line can disagree with the rebuttals it summarizes.
4. **The gate lives in `lets-build`'s *Apply*, keyed on the schema.** *Apply* reads `schema:` from `openspec/changes/<branch>/.openspec.yaml`, as `lets-go`'s Start does. On `lets-standard` it reads the pull request's body: with no **Plan review** section it runs the `lets-review-plan` skill; otherwise it runs the skill's *Check an earlier review*, and the skill again only when the check says to. It invokes `openspec-apply-change` only when decision 3 says the review is finished. Any other schema goes straight to `openspec-apply-change`. Alternative: a rule under `operations.apply` in the standard flow's config, the mirror of the code review's `operations.archive` rule. Rejected: the epic retires the `operations.archive` rule with `lets-review-build`, and how reviews are switched on is out of this story's scope. Alternative: key on the flow. Rejected: a project on the `standard` flow can route a small story to `lets-minimal`, and that route skips the review today.
5. **`REVISE` is fixed in the reviewing session.** `lets-review-plan`'s *Rounds* says: on `REVISE`, revise the plan with the `openspec-update-change` skill, commit, and run a new round in a fresh context; after two `REVISE` verdicts in a row, stop and ask the user. `lets-build` adds nothing: it runs the skill, and the skill rounds. Alternative: `lets-build` stops on `REVISE` and tells the user to fix the plan. Rejected: the step-names review showed one round of fixes is routine, and a stop would turn every `REVISE` into a second run.
6. **The schema's checks move into the skill.** `lets-review-plan` gets a list, *For an OpenSpec change*, with the five checks the `review` instruction added and one for the tasks: each task names one behavior and a verify command the project has, and the list covers the specs' scenarios. The skill also says which files the plan is: brainstorm.md, proposal.md, specs/, design.md, adr.md and tasks.md. Alternative: `lets-build` passes the checks in. Rejected: `lets-build` would carry review method, and the skill already carries the rest of it.
7. **`lets-go` runs review plan inside build.** The build step runs `lets-build`, whose *Apply* now reviews first, so nothing in the build prompt changes. *Find the first unfinished step* counts review plan done when build is done. *Print the skip lines* and *Read the report* print review plan's line after build: the `Done` form when the build step reported `done` in this run, the `Skipped` form otherwise. The line reads `<sha>` and `<verdict>` from the section: the body read in *Find the first unfinished step* when build was already done, or a fresh `gh pr view <name> --json number,body` after the build step, because the step just wrote it. `<date>` is `git log -1 --format=%as <sha>`: the plan's commit is the latest Git record of the review, and the review ran on or after that day. A body with no section when build is done joins the *Records that disagree* table. Alternative: a date written in the section. Rejected: the shared decision in #148 takes skip dates from records Git and GitHub already keep, and the section's author would have to keep a date right by hand.
8. **The `tasks` step reads no verdict, and the `apply` step points at `lets-build`.** The `tasks` instruction loses its review.md paragraph and its sentence on voiding the review, and says "Break the plan into tasks". The `design` instruction says the plan review reads the tier. The `apply` instruction gains one sentence: start from the `lets-build` skill, which has the plan reviewed before this step on `lets-standard`. `lets-write-tasks`'s description says a plan, not an approved plan.
9. **The tests pin both directions.** The marker test keeps `Confirmed by user:` and drops the review markers. New checks: no file under `schemas/` holds `VERDICT:`, `CHANGES_APPLIED:` or `review.md`, and `schemas/lets-standard/templates/review.md` does not exist; no `skills/*/SKILL.md` says `review.md`; `lets-review-plan` says `Reviewed: <sha>`, `**Plan review**`, `**Verdict:**` and `git merge-base --is-ancestor <sha> HEAD`; `lets-build` says `` `lets-review-plan` skill ``, `` `openspec-apply-change` skill `` and `schema: lets-standard`; `lets-go` pins the two new review plan lines, `git log -1 --format=%as <sha>` and `gh pr view <name> --json number,body`, and no longer says `review.md`, `VERDICT:` or that review plan runs inside plan.

None of these is costly to reverse on its own. Where the review records, in the pull request rather than in the plan, is the one choice that many readers bind to; the ADR step decides whether it needs a record.

## Risks / Trade-offs

- [A project with a `lets-standard` change in flight syncs this release] → `openspec status` stops listing `review`; an existing `review.md` is ignored, and `lets-build` reviews the plan again before build, in the pull request. The proposal marks the schema change **BREAKING**, and the README's flows table shows the new order.
- [The review runs after tasks, so a `REVISE` costs a tasks rewrite too] → `openspec-update-change` keeps the artifacts coherent, and the review now catches task-level defects the old review could not see.
- [Two sessions edit the pull request body] → The skill reads the body right before it writes, and replaces only its own section.
- [`openspec archive` refuses the added scenario in the `lets-go` delta] → `openspec validate --strict` accepts it. The last task rehearses the archive in a throwaway worktree before the real one, as `step-names` did.
- [`lets-build` names `lets-review-plan`, which the `minimal` flow does not ship] → The gate is keyed on `lets-standard`, which no `minimal` project has, and the flow-ships test reads schemas and config, not skills.
- [A plan built outside `lets-build` skips the review] → The `apply` instruction says where to start. The schema cannot enforce the gate once the review is not an artifact; the epic accepts that.

## Migration & Rollback

No data changes shape. A project upgrades with `lets sync`. A change that already has `review.md` keeps the file; nothing reads it, and archive carries it into the archive folder with the rest. Rollback is reverting the branch's commits.
