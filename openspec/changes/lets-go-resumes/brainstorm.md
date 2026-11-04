## Story

#150 lets-go-resumes — lets-go picks up a change at any state, and prints each completed step it skips with its evidence and date. https://github.com/sidereal-io/lets-spec/issues/150

The user delegated this brainstorm to the orchestrating session on 2026-11-04 and asked for a recommendation on every question. Each recommendation is recorded as an `Assumption`, so the plan review checks it. The issue has no comments. The packet was last edited on 2026-11-03.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where does `lets-go` start now? | On the default branch, or on a change's branch. On another branch it says so and stops. The "#150 adds resuming" line goes. | Evidence: #150 packet; `skills/lets-go/SKILL.md` |
| D2 | How does it find the issue on a change's branch? | A given number must be an issue whose title starts with `<branch> — `, else it stops. With no number, it searches open issues for that title prefix; exactly one match is the issue, otherwise it asks for the number and stops. | Assumption |
| D3 | Which parts of Start run on a resume? | *Find the source of demand* for the named issue, *Confirm the packet* with the Kind gate, and *Route*, every time; a stop stands, and the shape skip line prints as today. *Claim* runs only when the change's branch does not exist. | Assumption |
| D4 | What if the change's branch exists when `lets-go` runs on the default branch? | It switches to that branch and resumes as on a change's branch, instead of *Claim*'s stop. It looks for the branch locally and on `origin`. On any change's branch that `origin` has, it fetches first and fast-forwards a local branch that is behind; a diverged branch is a disagreement. | Assumption |
| D5 | Which schema goes in the prompts on a resume? | The `schema:` line of the change's `.openspec.yaml` when the change folder exists; the route's schema when it does not. | Evidence: `openspec/changes/*/.openspec.yaml` |
| D6 | How is the first unfinished step found? | From `openspec instructions apply --change <name> --json`, as `lets-build`'s *Find where you are* reads it: no change folder or `blocked` means propose; `ready` means apply; `all_done` means apply review; an archive folder `<date>-<name>` means every step is done. Steps before it are skipped, and the run goes on from it in the usual order. | Evidence: `skills/lets-build/SKILL.md`; Assumption |
| D7 | What dates a skipped propose? | The commit that added `openspec/changes/<name>/tasks.md`, because propose ends with tasks. This is how the epic's "proposal commit" is read. Read with `git log -1 --diff-filter=A`. | Assumption |
| D8 | What dates a skipped propose review? | On the `lets-minimal` route the line stays `Skipped propose review: not in the lets-minimal route.` On another schema, the last commit that added or changed `review.md`, and the line names its `VERDICT`. The Kind gate means no run reaches this until #152, but the rule ships now so every step is skippable. | Evidence: #148 Shared decisions; Assumption |
| D9 | What dates a skipped apply? | The last commit that modified `tasks.md`: the last task tick. Read with `git log -1 --diff-filter=M`. The same command works after archive, because the old path's history keeps the ticks and the archive is a deletion. | Evidence: `git log` on `lets-go-chore`'s tasks.md |
| D10 | What dates a skipped apply review, and what is its evidence? | The commit that added the archive folder. The evidence is the pull request: not a draft, open or merged, and with a `Code review` section. The section itself carries no date, so the archive commit dates the step. | Evidence: `skills/lets-review-code/SKILL.md`; Assumption |
| D11 | Which commit date? | The author date, `%as`, as `YYYY-MM-DD`. A rebase in a stack rewrites the committer date and the SHA; the author date stays. Each line names the SHA too. | Assumption |
| D12 | What do the new skip lines say? | One form: `Skipped <step>: <evidence>, <date> (<sha>).` The exact strings are fixed in the spec, so the skill-interfaces test can grep them. | Evidence: `tests/skill-interfaces.bats` |
| D13 | When do the records disagree, and what happens? | `lets-go` prints `Records disagree:` and what it found, says what to fix by hand, and stops. It repairs nothing. The cases: files changed outside `.workspace/`; a local branch diverged from `origin`; a change folder and an archive folder for the same name; an archive folder but a pull request that is missing, a draft, or has no `Code review` section; a committed `brainstorm.md` but no open pull request; a `git log` read for a skipped step that finds no commit. | Evidence: #150 packet; Assumption |
| D14 | A closed pull request? | A merged one means the run is finished: `lets-go` says so and stops. One closed without merging means the change was rejected: `lets-go` says so and stops. Neither is a disagreement. | Assumption |
| D15 | An answers file left by an interrupted run? | When `.workspace/lets-go/<name>-<step>-answers.yaml` exists before a step's first round and holds a pair, that round runs with `--answers-file`, so the user does not answer again and the settled-question check stays right. Without the file the step asks again. `lets-go` still keeps no state it needs. | Assumption |
| D16 | What prints when every step is done? | The five lines of *End of the run*, each a `Skipped` line, then the pull request URL. Skip lines print in step order before the first step that runs, and again in the end summary. The interactivity line prints as today, after Start. | Evidence: `skills/lets-go/SKILL.md` |
| D17 | What changes in files? | `skills/lets-go/SKILL.md`: the description, Start, and a new section that finds the first unfinished step. `openspec/specs/lets-go/spec.md`: modified requirements and one added. `tests/skill-interfaces.bats`: one new test for the fixed strings. The README's `lets-go` section says it resumes. `lets-build`, the routing rows and `flows.json` are unchanged. | Evidence: #150 packet; `tests/skill-interfaces.bats` |
| D18 | New glossary terms? | None. "First unfinished step" and "skip line" are plain phrases, used as the skill reads. | Assumption |
| D19 | Can it run here now? | No. The pinned `lets` 0.7.0 has no `step` command. The tests check the skill's prose, as in #149. | Evidence: `mise.toml` |

## Changes from the story

None.

Confirmed by user: yes
