**Why:** Fresh agents need backlog guards before commands and reusable PR review instructions without an outstanding completed trial.

## Story

#234 setup-and-pr-review-wording — backlog setup states its guards before its commands, and the PR review skill reads as reusable instructions.
https://github.com/sidereal-io/lets-spec/issues/234

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What changes? | Only SLR-05, SLR-15 and SLR-16 in the two named source skills, with a self-contained test block. | User; #234 packet |
| D2 | How does setup change? | Explain the number binding and stop-on-error rule before commands; exclude Status from generic missing-option replacement. Preserve commands, agreement and cleared-value warning. | Evidence: #234 SLR-05 |
| D3 | What happens to the completed trial directive? | Remove it; retain the distinction between scripted exercises, static checks and live evidence. No new live review or public comment. | Evidence: #234 SLR-15; archived collaborator-pr-review tasks |
| D4 | How does the review overview change? | Introduce bounded exchanges and evidence mediation before the decision pass, then decide on focused passes after both full passes. Preserve early exit, role limits and focused-pass conditions. | Evidence: #234 SLR-16 |
| D5 | Do requirements change? | No; these are wording corrections preserving the existing behavior. Set skip_specs rather than inventing a requirement. | Evidence: #234 scope; collaborator-pr-review spec |

## Changes from the story

None. No issue comments were present. No new glossary terms.

Confirmed by user: yes
