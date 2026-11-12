## Story

#221 t3-review-session-fit — a t3 review runs in default mode, has time to finish, and names the checkout and commit it read.
https://github.com/sidereal-io/lets-spec/issues/221

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which sessions open in default mode? | Reviews (`run`). Handoffs (`start`) already open in default mode. `t3` runs no step yet (#155). | Evidence: `launchThread` in `lets/src/resolvers/t3/t3.ts` |
| D2 | What keeps a default-mode review read-only? | The tree check that exists today: a review that changes files outside `.workspace/` exits 7. The thread keeps `runtimeMode: full-access`, so the reviewer can run tests. | Evidence: #221 Expected, `lets/src/delegate/review.ts` |
| D3 | When is a finished run "a plan, not a result"? | When the run holds any `proposed_plan` item. A review never needs one, and T3 writes one only in plan mode. | Evidence: T3's `orchestration_v2_projection_turn_items`: all 22 `proposed_plan` items are in plan-mode threads, and thread `502978b0-…` ended with one |
| D4 | What does such a run do? | Exit 5, with stderr `the session returned a plan, not a result (thread <id>)`. The thread stays, as for every exit 5, so a person can read it. | Assumption |
| D5 | Does the proposed-plan check go further, such as reading a brief `waiting` as final? | No. That is #102, which builds on the same `waitForText`. This story adds one check to it and changes nothing else there. | Evidence: #221 Scope, #227 Shared decisions |
| D6 | What is the new default time limit? | 30 minutes at effort `low` and `medium`, 45 at `high`. `--timeout-minutes` still sets it. This is twice the 15 minutes the Gemini 4 Argon review took. | Assumption |
| D7 | Does the new limit apply to every resolver, or only `t3`? | Every resolver. `DEFAULT_TIMEOUT_MINUTES` is shared, and a `cli` review runs the same models for as long. | Evidence: `lets/src/resolvers/kit/adapter.ts` |
| D8 | Which fields name the checkout and commit? | Two new fields on the review's JSON line: `checkout`, the absolute path of the checkout the session ran in, and `commit`, the full hash at that checkout's `HEAD` when the session ended. | Assumption |
| D9 | Where does `t3` learn the checkout? | From T3's own record of the thread after the run: its worktree, or else the project's root. Not from what `t3` asked for, so a thread T3 put elsewhere shows up. | Evidence: thread `4792cb3b-…` recorded `worktreePath: null` in T3's state |
| D10 | Does `cli` name the checkout and commit too? | Yes. It runs the CLI in the command's checkout, so `checkout` is that checkout. The JSON line is shared, so every resolver that reviews fills both fields. | Evidence: `openspec/specs/delegate-review/spec.md` |
| D11 | Why read `HEAD` after the session, not before? | A reviewer that commits leaves a clean tree, which the tree check cannot see. Its new `HEAD` then differs from the caller's, so the caller's comparison catches it. | Assumption |
| D12 | Does `lets` itself compare `checkout` with the caller's checkout? | No. The line names them, and the review skills compare. This keeps the command's contract as the packet states it. | Evidence: #221 Expected |
| D13 | What do the review prompts say? | `lets-review-plan` and `lets-review-build` put the checkout's absolute path and `HEAD` at the top of the prompt. They ask the reviewer to report the path and commit it read. | Evidence: #221 Expected; #203's session read the right checkout because its prompt named it |
| D14 | What does a skill do when they differ? | It records no review. When the meta line's `checkout` or `commit`, or the reviewer's report, differs from the caller's own top level and the `HEAD` it noted before the review, the skill stops and shows the user, as for any other failed exit. | Assumption |
| D15 | Which skill files change? | Only `skills/lets-review-plan/SKILL.md` and `skills/lets-review-build/SKILL.md`. `skills/lets-review-pr` is a collaborator review of a pull request and is out. | Evidence: #221 Relevant code, epic #227 brief (skills only as strictly needed) |
| D16 | How is the fix accepted? | Unit tests at the resolver and the review command, and a bats check of the two skills' text. In `delegate-resolvers`: a new requirement, *The T3 resolver runs a review in default mode*, with a scenario for the mode and one for the proposed plan. In `delegate-review`: the JSON line requirement gains `checkout` and `commit`, and a new requirement sets the time limits. | Evidence: #227 Shared decisions |
| D17 | Do the docs change? | Yes. `docs/resolvers.md` says that a `t3` review runs in default mode, and names the two new fields. The command's `--help` text names the new limit and the new fields. | Assumption |

## Changes from the story

- Narrowed: the packet says "a final turn that ends with a proposed plan". D3 checks for any `proposed_plan` item in the run instead. It is simpler, and a review never needs one.
- Added: the `cli` resolver fills `checkout` and `commit` too (D10). The packet names only `t3`, but the JSON line is shared.
- Added: `HEAD` is read after the session, so a reviewer that commits is caught (D11).
- Added: the `docs/resolvers.md` and `--help` updates (D17).
- No split: about eight tasks.

The user delegated the brainstorm for epic #227: the agent decides and records its recommendations, and asks only where it has none. Every question here had a recommendation, so no question went to the user. The thread's only comment was folded into the packet by `lets-shape` and is covered by its read marker.

Confirmed by user: yes
