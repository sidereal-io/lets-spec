<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#269 lets-go-shape-name — lets go shape-name names the shape step, and lets-go drops its slug rules, https://github.com/sidereal-io/lets-spec/issues/269

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | The story keeps `idea-<slug>` (first five words) but also wants two ideas that share those words never to share an answers file. How are such ideas kept apart? | The idea name gains a short hash of the whole idea: `idea-<slug>-<hash>`. Every file named after the shape step (prompt, answers, report, meta, session label) is then unique to its idea, and `lets-go` drops all four of its checks that the prompt file holds this idea. Issue names stay `issue-<i>`. A run stopped before this change, on the same machine, no longer finds its answers file. | Assumption |
| D2 | What counts as the same idea for the hash? | All of the idea's words after the slug's clean-up (split on white space, lower-cased, only letters and digits in any script kept, empty words dropped), not only the first five. Retyping an idea in another case or with other punctuation still finds its answers. | Assumption |
| D3 | What does the command look like? | `lets go shape-name --issue <i>` or `lets go shape-name --idea <text>`, exactly one. On success it exits 0 and prints one JSON line with a `name` and an `answers` path relative to the repository root. It exits 2 with a message when neither or both options are given, or when the idea has no letter or digit. | Assumption |
| D4 | Does the "idea needs a letter or digit" check move into the command? | Yes. *Read the request* runs `lets go shape-name --idea` and stops on its error, with the same message as today. The slug rule is written only in the `lets` CLI. | Assumption |
| D5 | Does the new name change any line a run prints? | No. The shape name appears only in file paths and the `--name` given to `lets delegate step run`; the `Done shape` and `Failed shape` lines do not hold it, so epic #263's "the run does not change" holds. | Evidence: `skills/lets-go/SKILL.md` (*The step lines*, *Run a step*) |
| D6 | Which tests does the story update? | The Node tests under `tests/`, since `tests/skill-interfaces.bats`, which the issue names, no longer exists. | Evidence: `tests/` (bats removed in #336) |

## Changes from the story

- **Changed: the idea name format.** The story kept `idea-<slug>` and put "changing the name format" out of scope only for issues. Idea names become `idea-<slug>-<hash>` (D1), because the old name cannot also give two ideas that share their first five words separate answers files.
- **Added: the letter-or-digit check moves into the command** (D4), so the slug rule is written in one place.
- **Changed: tests.** The story names `tests/skill-interfaces.bats`; the Node tests replace it (D6).

Confirmed by user: yes
