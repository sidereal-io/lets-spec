# Fresh native GitHub acceptance

Status: in progress. Earlier reused-fixture evidence is superseded; it remains
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
| Branch-failure release | #11 | Pending runtime check |
| Lost-response recovery | #12 | Pending runtime check |
| Full lifecycle | #13 | Pending runtime check and new test PR |

The fresh issues remain open and visible for user inspection. Completion must
remain pending until the user merges the new test PR. No test PR is merged by
the agent. These are live acceptance runs; checked-in process tests remain
separate from GitHub access.
