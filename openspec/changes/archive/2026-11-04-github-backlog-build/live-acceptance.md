# Fresh native GitHub acceptance

Status: complete. All fresh pre-merge checks, exact merged completion and
idempotent replay passed. The user merged test PR #14 at
`35fc0721258503871211b572a76e81e8af0ec86d` on 2026-11-04 at 17:57:22 UTC.
Earlier reused-fixture evidence is superseded; it remains
in legacy-live-acceptance.md for history only.

Runtime: built from the reviewed implementation at `75d4b24` (the later reopen
commit changes planning artifacts only). Test repository:
https://github.com/mstelz/test-repo-pls-ignore. Project:
https://github.com/users/mstelz/projects/7.

The Project was inspected: it contained only the six earlier acceptance issues.
The acceptance-owned Lets claim and Lets reference fields were removed. No
other Project field was deleted. Six new issues now use only shared metadata,
native assignments, native blocked-by links and PR closing links. Private
journals live only in a fresh checkout's Git directory.

| Case | Fresh issue | State |
|---|---|---|
| Blocked | #8 | Todo; native blocker #9 |
| Prerequisite exclusion | #9 | Todo; Priority Wont |
| Owned exclusion | #10 | Todo; assigned to mstelz |
| Branch-failure release | #11 | Actual duplicate-main branch failure; release restored unassigned Todo |
| Lost-response recovery | #12 | Successful native claim response discarded; original handle recovered it; release restored Todo |
| Full lifecycle | #13 | Claimed, bound, resumed and linked natively to PR #14; after user merge, closed and Done; repeated completion returned Done |

Fresh fixtures remain available for inspection. Issues #8–#12 remain open;
GitHub closed #13 through PR #14's native closing link. Its Project Status is
Done and its native assignee remains mstelz. No test PR was merged by the agent.
These are live acceptance runs; checked-in process tests remain separate from
GitHub access.

The built caller rejected blocked #8 and owned #10 and selected #11 as `next`.
PR [#14](https://github.com/mstelz/test-repo-pls-ignore/pull/14), head `8d1ead1`,
contains a normal test document and immutable backlog identity. GitHub reports
its native closing link to fresh issue #13. No private handle, claim token or
session state was committed.

Before merge, normal `complete` rejected the open PR with conflict/effects none
and made no Done transition. After the user merged, the original continuation
verified the exact PR merge commit and returned Done. A second invocation also
returned Done. Independent Project inspection confirmed Done and confirmed the
legacy machine-state fields remain absent. Private handles and raw journals
remain local; the report contains only public identities and outcomes.
