# Fresh native GitHub acceptance

Status: all fresh pre-merge checks passed, including native PR association and
unmerged completion refusal. Merge-gated completion is pending the user's merge
of test PR #14.
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
| Full lifecycle | #13 | Claimed, bound and resumed; assigned to mstelz, In Progress; native link to PR #14 |

The fresh issues remain open and visible for user inspection. Completion must
remain pending until the user merges the new test PR. No test PR is merged by
the agent. These are live acceptance runs; checked-in process tests remain
separate from GitHub access.

The built caller rejected blocked #8 and owned #10 and selected #11 as `next`.
PR [#14](https://github.com/mstelz/test-repo-pls-ignore/pull/14), head `8d1ead1`,
contains a normal test document and immutable backlog identity. GitHub reports
its native closing link to fresh issue #13. No private handle, claim token or
session state was committed.

Normal `complete` rejected the open PR with conflict/effects none and made no
Done transition. Fresh issue #13 remains In Progress. After user merge, run the
original continuation to verify the exact PR merge commit, Done and idempotent
replay. Keep fixture state visible until the user has inspected it.
