## Why

Mo runs three skills to move one issue, and answers each one in a different session. Epic #148 wants one entry point, `lets-go`, that takes an issue and carries it to a ready pull request, asking Mo only in the conversation where they started. #162 built the step strategy and its report. This change builds the thinnest path over them: one shaped chore, from Start to apply review, with every step's questions relayed to the user.

## What Changes

- A new skill, `lets-go`, in both flows. It takes one issue number (D1) and runs for a Chore (D2) on the default branch (D3).
- Start reuses `lets-build`'s find, confirm, route and claim, in the `lets-go` session (D4). A complete packet means shape is done, and `lets-go` prints a skip line dated from the packet's last edit (D5, D6).
- `lets-go` picks the `recommend` interactivity level for a Chore and says why (D7).
- Propose, apply and apply review each run through `lets delegate step run`, with the model chosen as the handoff chooses it (D8). When the resolver exits 3, `lets-go` runs the step in a subagent with the prompt `lets` saved, and reads the step report itself (D9). Each step's prompt says what to run, the level, and how to report (D10).
- The relay: at `recommend`, `lets-go` answers a question that has a recommendation and says so, asks the user the rest one at a time, and resumes the step with every answer so far (D11, D12). It stops on a repeated question or a `failed` report (D13, D14).
- Propose review is reported as not in the `lets-minimal` route. Apply review runs `lets-build`'s *Finish the change*, and the run ends when the pull request is ready (D6, D15, D16).
- The routing table in `overlays/AGENTS.md`, the README's usage tables and `tests/skill-interfaces.bats` learn the new entry point (D17).

No breaking change. `lets-build` is unchanged (D17). `lets` is unchanged. No new glossary term (D19).

## Capabilities

### New Capabilities
- `lets-go`: what the `lets-go` skill does for a shaped chore: where it starts, the skip line, the interactivity level, how it runs each step and reads its report, the relay, and how the run ends.

### Modified Capabilities
None. The `delegate-*` specs already say what `lets delegate step` does, and `issue-comments` already says how `lets-build` confirms a packet. `lets-go` calls both and changes neither.

## Impact

- `skills/lets-go/SKILL.md`: new.
- `flows.json`: `lets-go` in both flows' skills.
- `overlays/AGENTS.md`: a routing row. `README.md`: the skill list, the usage table, a short section.
- `tests/skill-interfaces.bats`: `lets-go` as an entry point, and checks on its prose, as the other delegating skills have.
- No code in `lets/`. No new dependency.
- This repository runs the pinned `lets` 0.7.0, which has no `step` command, so `lets-go` runs here only after the next release (D18).
