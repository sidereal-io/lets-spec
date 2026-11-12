## Story

[#231: shape-checkpoints](https://github.com/sidereal-io/lets-spec/issues/231), part of #226.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | How does confirmed Stories resume? | Write `next phase: finalize`; Resume and the parent template recognize it; Finalize removes it. | User, #226 Shared decisions, SLR-06 |
| D2 | When can single-issue shaping write definitions? | Check size first. Oversized work keeps meanings tentative for the parent of a discovery run only if the user starts one. | User, #226 Shared decisions, SLR-08 |
| D3 | What happens after removing a closed issue link? | Classify the stage from code; incomplete code remains partial regardless of issue availability. | Evidence: #231 SLR-07 |
| D4 | What does the blocker command's owner mean? | The recorded glossary owner issue number, distinct from account login and PR number. | Evidence: #231 SLR-09 |

## Changes from the story

None

Confirmed by user: yes
