## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The plan was written in a Claude session; `gemini/gemini-4-argon` reviewed it through the `t3` resolver, and the meta line says `"independent":true`.
- **Tool restrictions**: read-only: view, grep, glob only. `gitClean` was true after the review.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/lets-go/spec.md, adr.md and ADR-017, at commit 1ef384a, against `skills/lets-go/SKILL.md`, the main `lets-go` spec, `lets-build`, `lets-review-code`, `openspec/config.yaml`, both schemas, the `delegate-step` spec, `tests/skill-interfaces.bats`, ADR-014 to ADR-016, and the archived `lets-go-chore` change with its Git history.

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **A stale local branch is not fetched or fast-forwarded.** The plan said "fetch, then `git switch <name>`" without saying what is fetched, so a local branch behind `origin/<name>` would be read as it is, and steps another machine finished would run again. Check: assumption rows (D4), contradictions with the story's restart requirement. CONFIRMED: `git switch <name>` prefers an existing local branch, and nothing in the plan moved it to `origin/<name>`.
2. **`--diff-filter=M` finds nothing when `tasks.md` was committed with its ticks in.** Then `all_done` skips apply, and the apply date read is empty. Check: the record reads. CONFIRMED as a possible history; see the rebuttal.
3. **The archived skip checks the `Code review` section's presence, not its freshness.** A commit after archive, or a rebase, could leave the section stale. Check: contradictions with `lets-review-code`'s *Check an earlier review*. CONFIRMED as a gap; see the rebuttal.
4. **An empty answers file would make `step run` exit 2.** The plan passed `--answers-file` whenever the file existed. Check: contradictions with the `delegate-step` spec. CONFIRMED: `openspec/specs/delegate-step/spec.md`, *Answers resume a step*, exits 2 on an empty file, and `lets-go` stops on any exit but 0 and 3.
5. **A brainstorm committed without its pull request is never caught.** The disagreement was checked only at `ready` or `all_done`, but the pull request is opened in the brainstorm artifact, and a resumed propose skips that artifact. Check: contradictions with both schemas' brainstorm instruction. CONFIRMED: `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml` open the pull request in the brainstorm step, and `openspec-propose` writes only missing artifacts.

### 📌 Suggestions

6. **Sentences over 30 words.** Twenty-two across the spec, design, adr.md and ADR-017. Check: plain language. CONFIRMED in part; see the rebuttal.
7. **The archive folder match should name the whole folder name.** A glob on `*-<name>` would match `2026-11-04-lets-go-chore` for a change named `go-chore`. Check: contradictions with `lets-build`'s wording. CONFIRMED: `skills/lets-build/SKILL.md` says "whose whole name is `<date>-<branch>`", and the plan did not.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Spec, *Start reuses lets-build*, design D-3, brainstorm D4: on any change's branch that `origin` has, run `git fetch origin <name>` before any record is read; fast-forward a local branch that is behind with `git merge --ff-only origin/<name>`; a diverged branch is a disagreement. Add the two commands to the fixed lines.
2. Spec, *Each step runs through lets delegate step*, design D-5, brainstorm D15: pass `--answers-file` only when the file holds at least one pair; an empty or unreadable file counts as absent. Add a scenario.
3. Spec, *Records that disagree stop the run*, design D-4, brainstorm D13: replace "state `ready` or `all_done` with no open pull request" with "a committed `brainstorm.md` with no open pull request", and add the diverged branch. Update the scenario.
4. Spec, *lets-go finds the first unfinished step*, design D-1: the archive folder's whole name is `<YYYY-MM-DD>-<name>`. Add a scenario for a name that ends another change's name.
5. Split the sentences over 30 words in the spec's requirement prose, the design, adr.md and ADR-017. Lists of commands and fixed strings become bullet lists.

CHANGES_APPLIED: yes

## Rebuttals

- Findings 1, 4, 5 and 7: fixed in commit `docs: apply the plan review's required changes to lets-go-resumes`, as changes 1 to 4. The spec gained the fetch and fast-forward rule with a scenario, the non-empty rule for the answers file with a scenario, the brainstorm and diverged-branch disagreements with scenarios, and the whole-name rule with a scenario. Design D-1, D-3, D-4 and D-5 and brainstorm D4, D13 and D15 say the same.
- Finding 2: rebutted, and the trade-off is now written down in design D-2. Both schemas' apply instruction says "Never tick ahead. Commit each task on its own ... and include the ticked checkbox in the same commit", so a `tasks.md` with ticks and no `M` commit breaks the workflow's own rule. The spec already treats an empty `git log` read as a disagreement that names the command, which is the clear stop the story asks for. No repair, as the story's scope says.
- Finding 3: rebutted as out of this story's scope, and recorded as a non-goal in the design. When the archive folder exists, `lets-build`'s *Find where you are* also stops with "the change is archived and its pull request is ready for review", with no freshness check. A commit after archive is the change-request path in the workflow rules, which reverts the archive commit; the state is then `all_done`, apply review runs *Finish the change*, and its finishing rule runs *Check an earlier review*.
- Finding 6: fixed in the same commit for the requirement prose, the design, adr.md and ADR-017. The lists of commands and fixed strings became bullets. Declined for scenario THEN lines that list the strings a test greps, and for the one-line ledger rows, which `lets-brainstorm` keeps to one line.
