# Records

Read this file when the records disagree.

## Records that disagree

When the records disagree, print `Records disagree:` and what you found.
Say what to fix by hand, and stop before any step. In an epic run, this
stop ends only its story's run, as
[A stop in an epic run](epic-run.md#a-stop-in-an-epic-run)
says. Repair nothing: each
repair means choosing which record is right, and that is the user's
choice.

| What you found | What to fix by hand |
|---|---|
| `git status --porcelain` lists a path outside `.workspace/` | Commit or discard the path. |
| The branch and `origin/<name>` have diverged | Reconcile the two, and push. |
| A change folder and an archive folder for the same name | Keep the folder that is right, and remove the other. |
| An archive folder, and the pull request is missing or a draft, or has no **Code review** section on `lets-standard` | Open the pull request, review it, or mark it ready, as `lets-review-build` does. Or revert the archive commit. |
| `brainstorm.md` is committed, and the branch has no pull request | Push the branch, and open the draft pull request. |
| An archived change on a schema other than `lets-minimal`, and the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line | Review the plan with the `lets-review-plan` skill, which writes the section. Or revert the archive commit. |
| `lets go records <name>` prints `null` for the record of a row the walk settles as done, other than review plan on `lets-minimal` | Name the record, such as the `plan` record of `lets go records <name>`, and find out why the step's record is missing. |

The printed line names what you found, such as the path, or the pull
request's `isDraft`. A built change that is not archived,
and whose pull request has no **Plan review** section, is not a
disagreement. The walk reaches review plan first, and runs it.
