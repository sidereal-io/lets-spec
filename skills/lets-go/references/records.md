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

The records disagree in two ways. `lets go records <name>` lists each
row it finds under `disagreements`, as an entry with a `row` and a
`found`. For each entry, print its `found`, and the fix for its `row`
from the table. [Enter the branch](../SKILL.md#enter-the-branch) finds
the other way, a diverged branch, when it cannot fast-forward.

| Row | What was found | What to fix by hand |
|---|---|---|
| `dirty-tree` | A path outside `.workspace/` is not committed | Commit or discard the path. |
| A diverged branch | The branch and `origin/<name>` have diverged. *Enter the branch* finds this | Reconcile the two, and push. |
| `change-and-archive` | A change folder and an archive folder for the same name | Keep the folder that is right, and remove the other. |
| `archive-not-ready` | An archive folder, and the pull request is missing or a draft, or has no **Code review** section on `lets-standard` | Open the pull request, review it, or mark it ready, as `lets-review-build` does. Or revert the archive commit. |
| `brainstorm-without-pull-request` | `brainstorm.md` is committed, and the branch has no pull request | Push the branch, and open the draft pull request. |
| `archive-without-plan-review` | An archived change on a schema other than `lets-minimal`, and the pull request has no **Plan review** section | Review the plan with the `lets-review-plan` skill, which writes the section. Or revert the archive commit. |
| `null-record` | A step is done, and its record is `null` | Name the record, such as the `plan` record of `lets go records <name>`, and find out why the step's record is missing. |

`found` names what the command found, such as a path, or
`isDraft: true`. A built change that is not archived, and whose pull
request has no **Plan review** section, is not a disagreement. The walk
reaches review plan first, and runs it.
