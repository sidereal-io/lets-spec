## Story

#149 lets-go-chore — lets-go takes a shaped chore to a ready pull request, relaying each step's questions to the user. https://github.com/sidereal-io/lets-spec/issues/149

The user delegated this brainstorm to the orchestrating session on 2026-11-04 and asked for a recommendation on every question. Each recommendation is recorded as an `Assumption`, so the plan review checks it. The issue has no comments.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does `lets-go` take? | One issue number. Without one it says so and stops. Ideas are #153. | Evidence: #149 packet |
| D2 | Which Kinds does it run in this story? | A Chore. The Kind is checked where *Confirm the packet* reads the Project fields. For a Story or a Bug `lets-go` says that #152 adds them, points to `lets-build`, and stops. | Assumption |
| D3 | Where does it run? | On the default branch only. On any other branch it says that `lets-build` carries a change on, and that #150 adds resuming, and stops. | Assumption |
| D4 | How does Start work? | It runs `lets-build`'s *Find the source of demand* for a named issue, *Confirm the packet*, *Route* and *Claim*, in the `lets-go` session, by naming those sections. Start is not a step: it has no step report. | Evidence: #149 packet; `skills/lets-build/SKILL.md` |
| D5 | When is shape skipped, and how is the skip dated? | A packet that passes *Confirm the packet* means shape is done. The skip line's date is the issue's `lastEditedAt` from the thread query, else its `createdAt` from `gh issue view <i> --json createdAt`, the one command `lets-go` adds. A packet that fails sends the user to `lets-shape`, as `lets-build` does; shape does not run as a step in this story. | Evidence: #149 packet; `skills/lets-shape/references/issue-comments.md` |
| D6 | What does a skip line look like? | `Skipped <step>: <reason>, <date>.` printed when the step would have run. Propose review is `Skipped propose review: not in the lets-minimal route.` with no date. | Evidence: #148 Shared decisions; #149 packet |
| D7 | Which interactivity level, and how is it reported? | A Chore gets `recommend`. Before the first step, `lets-go` prints `Interactivity: recommend, because #<i> is a Chore.` The level goes into every step prompt. | Evidence: #148 Shared decisions |
| D8 | How does a step run? | For propose, apply and apply review in turn: write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`; ask `lets delegate step instructions --for <step>`; rank the options by the guidance, then the order given, as the handoff does; run `lets delegate step run --for <step> --name <name>-<step>` at effort `high`, with stdout to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `-meta.txt`. | Assumption |
| D9 | What happens when `step run` exits 3? | `lets-go` runs the step in a subagent that may write files, with no context from this session, using the prompt `lets` saved in `.workspace/lets-delegate/<name>-<step>.prompt.md`. It reads the `step-report` block from the subagent's final message by the same rules as `lets`, and stamps the date of a `done` report itself. Any other non-zero exit shows stderr and stops. | Evidence: #149 packet; `docs/resolvers.md` |
| D10 | What does a step prompt say? | The step, the change name, the issue, the branch and the schema; what to run (propose: `openspec-propose` for the change, with the route line, continuing the change if it exists; apply: `lets-build` on the branch, stopping when every task is ticked, without finishing the change; apply review: `lets-build`'s *Finish the change*); the interactivity level; never to ask in the session, but to end with a `needs-input` report listing every open question, with a recommendation where the step has one and none for a confirmation; the report rules from `docs/resolvers.md`; and what counts as `done` evidence. | Assumption |
| D11 | Who answers a question with a recommendation at `recommend`? | `lets-go`. It takes the recommendation as the answer, marks it in the answers file as accepted by `lets-go`, tells the user what it answered, and asks the user each question without one, one at a time, in the report's order. The step records a marked answer as `Assumption` and the user's as `User`. The step itself never decides a question. | Evidence: #149 packet |
| D12 | How is a step resumed? | All answers so far go to `.workspace/lets-go/<name>-<step>-answers.yaml`, as `question` and `answer` pairs in order, and the step runs again with the same prompt file and `--answers-file`. The file grows across rounds. | Evidence: `openspec/specs/delegate-step/spec.md` |
| D13 | How many rounds? | Until the report is `done` or `failed`. A report that repeats a question already in the answers file stops the run: the step did not read its answers. | Assumption |
| D14 | What happens on a `failed` report? | `lets-go` shows the reason, names the step and the branch, and says that `lets-build` on the branch carries on. It retries nothing. | Assumption |
| D15 | What does apply review cover? | `lets-build`'s *Finish the change*: the project's finishing rules, which run the code review, then verify, archive, and mark the pull request ready. The run ends there. | Evidence: #148 Shared decisions |
| D16 | What does `lets-go` print at the end? | One line per step: skipped with its reason and date, done with its date and evidence, or failed with its reason. Then the pull request URL. It keeps no state of its own. | Evidence: #148 Shared decisions |
| D17 | Where does the skill ship? | `skills/lets-go/SKILL.md`, listed in both flows in `flows.json`, as an entry point in `tests/skill-interfaces.bats`, with a row in the routing table of `overlays/AGENTS.md` and in the README's usage tables. `lets-build` is unchanged; #157 decides its future. | Evidence: #149 packet; `flows.json`; `README.md` |
| D18 | Can `lets-go` run on this repository now? | No. The pinned `lets` 0.7.0 has no `step` command; this branch's source does. The tests check the skill's prose, not a run. It runs here after the next release. | Evidence: `mise.toml` |
| D19 | New glossary terms? | None. *Step*, *step report* and *interactivity level* are defined. The relay and the skip line are described in the skill. | Assumption |

## Changes from the story

None.

Confirmed by user: yes
