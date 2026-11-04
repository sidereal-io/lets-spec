**Why:** `lets-go` now runs the whole workflow and names six sections of `lets-build` as it goes; deciding now whether `lets-build` is retired or trimmed keeps the two skills from drifting apart, and settles the `handoff` strategy, whose one caller is `lets-build`.

## Story

#157 lets-build-after-lets-go — decide whether lets-build is retired or trimmed, in a decision record, https://github.com/sidereal-io/lets-spec/issues/157

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does this chore deliver? | One decision record, ADR-018 in `docs/decisions/`, that builds on ADR-016. No skill, code or spec changes, so the change sets `skip_specs: true`. The edits the record calls for are follow-up work. | Evidence: #157 packet; `skills/lets-write-adrs/SKILL.md` |
| D2 | Is `lets-build` retired? | No. It stays as the skill that does one session's share of the workflow. `lets-go` names *Find the source of demand*, *Confirm the packet*, *Route*, *Claim*, *Import the glossary checkpoint* and *Finish the change*, repeats none of them, and its apply and apply-review prompts run `lets-build` on the branch. Retiring it would move every section into `lets-go` and its step prompts. | Assumption |
| D3 | What does `lets-build` do that `lets-go` does not? | Three things, all kept: `next`, picking the next ready issue, which `lets-go` does not take; carrying a change on by hand in the current session, which `lets-go` names as the way on after a failed step; and finishing a change in the session that built it. | Evidence: `skills/lets-build/SKILL.md`; `skills/lets-go/SKILL.md` (*Start* step 2, *Read the report*) |
| D4 | What is trimmed? | The handoff offer at the end of *Propose*: the question whether to build the plan in a fresh session, and the `lets delegate handoff` commands behind it. `lets-go` on the change's branch does the same, with a step report, question relay and resume. After `ready`, `lets-build` says to build the plan here with `lets-build`, or in fresh sessions with `lets-go`. | Assumption |
| D5 | What happens to the `handoff` strategy? | It loses its one caller, so it goes, as ADR-016 foresaw: the `lets delegate handoff` commands, the `start` adapter method, the `delegate.handoff` config key, and their specs and tests. That removal is its own change, after the trim. | Assumption |
| D6 | Does the record supersede ADR-016? | No. It builds on it: review and step stay apart as ADR-016 decided, and the handoff's removal plays out the consequence ADR-016 named. ADR-016 keeps its status. | Evidence: `docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md` |
| D7 | Does the routing table change? | No. Both rows stay: `lets-build` for the next story or the current branch's change, `lets-go` for one issue in one run. | Evidence: `overlays/AGENTS.md`; `README.md` |
| D8 | Which files change with the trim, later? | `skills/lets-build/SKILL.md`, the README's `lets-build` section and its *Reviews in a fresh session* section, `docs/resolvers.md`, and the two skill-interfaces tests that pin the handoff text. The record names them as consequences; none changes in this chore. | Evidence: `README.md`; `tests/skill-interfaces.bats` |
| D9 | Any new glossary terms? | None. *Step* keeps its meaning: a stage `lets-go` runs in its own session. `lets-build` by hand does a step's work in the current session, and the record says it that way. | Evidence: `openspec/glossary.md` |

## Changes from the story

None.

Confirmed by user: no
