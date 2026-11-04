## Story

#136 github-backlog-build — Take an existing GitHub story through the shared backlog boundary

https://github.com/sidereal-io/lets-spec/issues/136

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does this story deliver? | Implement the GitHub build lifecycle through the shared executable backlog boundary; keep setup/shaping and other providers outside this story. | Evidence: #136 packet |
| D2 | Which contract governs behavior? | Follow protocol 1, configuration, identity, capabilities, claim guarantees, transport and recovery from the agreed adapter contract; preserve GitHub as the default without provider fallback. | Evidence: docs/backlog-adapter-contract.md |
| D3 | Which workflow decisions remain shared? | Keep packet validation, candidate filtering/ranking, schema routing and glossary preflight in shared policy; branches, pull requests and merge verification remain code-host responsibilities. | Evidence: docs/backlog-adapter-contract.md |
| D4 | What establishes safe progression? | Verify current claim ownership before work; reconcile uncertain mutations; release only this worker's claim after branch creation fails; leave review-ready work In Progress and complete only after confirmed merge. | Evidence: docs/backlog-adapter-contract.md |
| D5 | Where will live acceptance run? | Use mstelz/test-repo-pls-ignore and its linked user-owned Project https://github.com/users/mstelz/projects/7. | User |
| D6 | What counts as acceptance evidence? | Exercise the implemented flow for story selection, claiming, planning/resumption identity, PR reference and merge-gated completion; include automated checks and live GitHub evidence for blocked/owned work, uncertain outcomes and branch failure. Preparing fixtures with existing commands does not prove the new flow. | Evidence: #136 packet; User clarification |

## Changes from the story

None. The test repository and Project are acceptance fixtures; their manual setup does not count as evidence that the new flow works.

Confirmed by user: yes
