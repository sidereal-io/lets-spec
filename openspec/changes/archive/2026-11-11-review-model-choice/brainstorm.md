## Story

[#229 review-model-choice](https://github.com/sidereal-io/lets-spec/issues/229): A review skill whose guidance rules out every model stops and asks, and its report names the authors and inputs it really had.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What happens when guidance excludes all discovered models? | Keep listed and allowed models separate. Stop, show guidance and listed models, and ask the user to choose a model or the subagent step. Fallback must respect exclusions. | User: #226 Shared decisions, SLR-10 |
| D2 | How does build review handle several author families? | Rank against every author family; pass the session's own family as the CLI compatibility value; report reviewer overlap separately from CLI metadata. No CLI change. | User: #226 Shared decisions, SLR-11 |
| D3 | What does the provenance report name? | The actual evidenced subagent family, with independence requiring tool evidence; specifically name REVIEW.md when absent. | Evidence: #229, SLR-14 |

## Changes from the story

None. Findings assigned to #220 and #230 stay outside this change.

Confirmed by user: yes
