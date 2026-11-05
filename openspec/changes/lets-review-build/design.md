## Context

`lets-build`'s *Finish the change* has four steps. It runs `openspec instructions archive --change <branch> --json` and follows each `operationGuidance` entry as a step. Then it runs `openspec-verify-change`, archives the change with a `chore:` commit, and marks the pull request ready. The standard flow's config overlay holds the one guidance entry lets-spec ships: run `lets-review-code` when the pull request has no **Code review** section, else check that section. `lets sync` writes the overlay as `openspec/config.yaml` once, when the file is missing, and never edits it. So the rule lives in every standard project's config, and this repository's.

`lets-review-code` finds the author, writes a prompt, runs `lets delegate review run --for code`, checks the findings, fixes the confirmed ones, and writes a **Code review** section whose first line is `Reviewed: <base> <base-sha>..<head-sha>`. Its *Check an earlier review* reads that line. `lets-go` reads the section's presence, and its `review-build` step runs `lets-build`'s *Finish the change*.

`lets sync` warns about the config through `checkConfig` in `lets/src/sync/config.ts`. Node has no YAML parser there, so it reads lines: the first top-level `schema:` line. Its warnings join the `problem(s) to fix` list on stderr, with exit 0. `--check` returns before `checkConfig` runs.

The tests pin the skills as text: `tests/skill-interfaces.bats` names `lets-review-code` eight times, `tests/support/release.bash` ships it in the test release, `tests/release-build.bats` checks the overlay holds the rule, and `tests/openspec-compat.bats` checks the CLI returns it.

This change is the third of six stacked on #177, after `plan-review-in-the-pull-request`. #186 gives review build a session of its own. This change does not.

## Goals / Non-Goals

**Goals:**
- One skill, `lets-review-build`, ends a change on the standard flow, and anyone can run it by name.
- The code review runs where it runs today: on the standard flow, for every change in a standard project, and never on the minimal flow.
- The **Code review** section keeps its shape, so `lets-go`'s reads and `lets-review-build`'s own check stand.
- A project that upgrades learns from `lets sync` that its config names a skill the release no longer ships.

**Non-Goals:**
- A session or a step report for review build (#186).
- A config switch for either review, or any change to when they run beyond today's behaviour.
- A spec for the skills, `flows.json`, the overlay or the README. The bats tests pin them.
- Touching archived changes, decision records, `.agents/skills/` or this repository's `openspec/config.yaml` (D7, D13).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. It reads the skills, `flows.json`, the overlay and the README as text, and checks the fixed strings and the names that point at real things.
- **Existing seams reused:** `tests/lets/sync/config.test.ts`, which calls `checkConfig` with a fake file system; `tests/sync-setup.bats`, which runs the real `lets sync` in a throwaway project; `tests/release-build.bats` and `tests/openspec-compat.bats`, which build a release and run OpenSpec's CLI over its config; `nix flake check`, which builds both flows.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** two skills and one new one, `flows.json`, the standard overlay, one function in `lets sync`, its docs, the README and six test files. Outside the repository: every standard project. After `lets sync`, `lets-review-code` is gone from its `.agents/skills/`, its finish runs through `lets-review-build`, and `lets sync` names its stale rule until it deletes it.

## Decisions

1. **The skill is `lets-review-code` with a new door and a new last room.** `skills/lets-review-build/SKILL.md` keeps `lets-review-code`'s sections as they are: *Find the author*, *Run the review*, *Review in a subagent*, *Resolve vocabulary before delegation*, *The prompt*, *Act on the findings*, *Report* and *Check an earlier review*. The prompt file, the `--name` value and the `Reviewed:` line keep their names, so `lets delegate review` and `lets-go` see no change. Its *When to apply* changes: `lets-build`'s *Finish the change* runs it on the standard flow once every task is done, or someone asks for it. A new first section, *Start*, holds what the config rule said: read the pull request's body with `gh pr view --json body`; with no **Code review** section, run the review; with one, run *Check an earlier review*, and review again only when it says to. A new last section, *Finish the change*, holds `lets-build`'s steps: follow the project's `operationGuidance`, run the `openspec-verify-change` skill and stop on a problem, archive with the `openspec-archive-change` skill and commit it alone as `chore:`, then `gh pr ready`. Alternative: keep `lets-review-code` and have `lets-review-build` invoke it. Rejected: the packet folds one into the other, and two skills would mean two names for one step.
2. **`lets-build` decides by the flow, through the config's schema line.** *Finish the change* reads the `schema:` line of `openspec/config.yaml`, which *Route* already calls the flow's schema. On `lets-standard` it invokes the `lets-review-build` skill and stops when that skill is done. On any other schema it keeps today's four steps, without the sentence about the project's rules being where the code review lives. The minimal flow does not ship the skill, so its `lets-build` must finish without it. Alternative: decide by the change's `.openspec.yaml`, as *Apply* does for the plan review. Rejected: today's rule is project-wide, so a `lets-minimal` chore in a standard project gets a code review, and the packet keeps today's behaviour. Alternative: ship the skill in both flows and let it skip the review on the minimal flow. Rejected: the packet says the skill ships where `lets-review-code` did. #186 can revisit this when review build gets a session.
3. **The overlay keeps only its comments.** The `operations.archive` key and the comment above it go from `overlays/openspec/config.d/lets-standard.yaml`. What stays matches the minimal overlay but for the schema line: the schema and OpenSpec's own commented examples. A new project starts with no rule.
4. **`checkConfig` gains a line check.** After the schema warnings, it reads each line of the config. A line that holds `lets-review-code` and does not start with `#`, after any spaces, makes it return the warning from D6, with the config path first, as the schema warnings do. `main.ts` already shortens the path to `openspec/config.yaml`. Alternative: parse the `operations.archive.guidance` list. Rejected: `lets sync` has no YAML parser, and the name is what matters.
5. **The tests pin the rename, the removal and the warning.** In `tests/skill-interfaces.bats`, each `lets-review-code` becomes `lets-review-build`, including the comment on the flow-ships test, which now says `lets-review-build` is reached through `lets-build`'s *Finish the change*. New checks: `lets-review-build` says `**Code review**`, `` `openspec-verify-change` skill ``, `` `openspec-archive-change` skill `` and `gh pr ready`; `lets-build` says `` `lets-review-build` skill `` and reads `openspec/config.yaml` in *Finish the change*; no file under `skills/`, `schemas/` or `overlays/`, and neither `flows.json` nor `README.md`, says `lets-review-code`; and `README.md` has no `#turning-the-code-review-off` link. `tests/support/release.bash`'s fixture ships `lets-review-build`. `tests/release-build.bats` checks that neither release's config has an `operations` key. `tests/openspec-compat.bats`'s three archive-guidance tests become one: the CLI returns no guidance from the standard flow's config. `tests/lets/sync/config.test.ts` covers the four scenarios of the spec at the function; `tests/sync-setup.bats` covers the first, the comment and `--check` through the real command.
6. **The README names the skill and drops the switch.** The flows table's *Skills it adds* row names `lets-review-build`. Its *Independent code review* row says `Yes` and `No`, with no link. Stage 9 says `lets-review-build` has a fresh session review the branch, and stage 10 says the same skill checks the code against the plan, archives the change and marks the pull request ready. The *Turning the code review off* section goes. `docs/lets-sync.md`'s list of what `lets sync` warns about gains the stale rule.

None of these is costly to reverse. ADR-019 already records that a review is a gate a skill runs, not an artifact. The ADR step decides whether the end of the config switch needs a record.

## Risks / Trade-offs

- [A standard project deleted the rule to turn the code review off, and gets it back] → The proposal marks the change **BREAKING**, and the README's flows table says which flow reviews. The minimal flow is the way to no reviews.
- [A project kept its own `operations.archive` guidance beside the rule] → Both finishing paths still follow `operationGuidance` before verify. Only the lets-spec rule goes.
- [`lets-build` names `lets-review-build`, which the minimal flow does not ship] → The flow-ships tests read the schemas and the config for names, not the skills, and `lets-build` invokes the skill only on `lets-standard`. The same holds today for `lets-review-plan`.
- [A config names `lets-review-code` in a comment, or in a `context:` block] → A comment line does not count. A `context:` line does, and the warning tells the user what to delete; a false warning costs one read.
- [`lets-go` expects the section under the same heading] → The **Code review** section and its `Reviewed:` line do not change.

## Migration & Rollback

No data changes shape. A project upgrades with `lets sync`, which removes `.agents/skills/lets-review-code/` and copies `lets-review-build`. Its config keeps the old rule until the user deletes the `operations.archive` entry; `lets sync` names it on every run until then. Rollback is reverting the branch's commits.
