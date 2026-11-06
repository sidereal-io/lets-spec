## Story

#195 collaborator-pr-review — review an existing PR and publish grounded, ranked feedback

https://github.com/sidereal-io/lets-spec/issues/195

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Must the examiner and challenger use different model families? | No. When the implementer's model is known, prefer a model different from it when available; model differences are a preference, not a prerequisite for review. | User |
| D2 | What happens if the PR advances during review? | Record the PR's latest commit SHA at the start, review that revision, and identify it in the published comment. If the PR advances, publish against the recorded revision and state that newer commits were not reviewed. | User |
| D3 | What is the first live test after review and implementation? | Use https://github.com/sidereal-io/sidereal/pull/472 and capture its latest head when the trial begins; do not count planning or static checks as that trial. | User |

## Changes from the story

None.

Confirmed by user: yes
