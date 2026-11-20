<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#282 epic-run-resume — running lets-go on the epic again goes on with its unfinished stories, https://github.com/sidereal-io/lets-spec/issues/282

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which stories does a resumed epic run take up again? `next` skips a story an earlier run claimed, because it is assigned to this user and In Progress. | An open story of the epic, in this repository, assigned to the signed-in user, whose change's branch exists here or on `origin`. A story assigned to this user with no branch keeps `not built, assigned to <login>`: lets-go cannot tell it from a story the user claimed by hand. | Assumption |
| D2 | What does the run do with a story whose pull request is already open and ready for review? | Settles it at the start of the run, before the first pick, in the epic's order, with the built line `#<story> <story-name>: <pr-url>`, ending `, stacked on #<blocker>` when its pull request's base is another story's branch. It runs none of the story's steps, and counts the story as met. | Assumption |
| D3 | What line does an open story get when its pull request has merged, or was closed without merging? | Merged: `#<story> <story-name>: merged, <pr-url>`. Closed: `#<story> <story-name>: not built, its pull request was closed: <pr-url>`. Neither is resumed. The stories that depend on it get their own `not built, blocked by` line at the end, as today. | Assumption |
| D4 | Does a closed sub-issue get a line, such as a story closed by its merged pull request? | No. The run's stories stay the epic's open sub-issues, and a closed story is done. | Assumption |
| D5 | In what order does the run take started stories and stories nobody has started? | One ranked pick. Started stories join the candidates of `next` and rank like any other story: Must, Should, Could, then the oldest first. The met-blocker rule applies to them too. | Assumption |
| D6 | What line does the run print when it takes up a started story? | `Resumed #<i>: <title>, started in an earlier run, under #<parent>.`, in place of the `Picked` line. | Assumption |
| D7 | What is a stacked story's base when its blocker has merged, and when its blocker is still open? | A blocker whose issue is closed stacks nothing. A story nobody has started branches off the default branch. A started story whose pull request targets the merged blocker's branch gets `gh pr edit <name> --base <default>` before its walk, with no rebase and no `, stacked on`. A started story whose pull request targets an open, met story stays stacked: its step prompts hold `## Stack`, and its line ends `, stacked on #<blocker>`. Restacking after review stays out of scope. | Assumption |
| D8 | Does a blocker whose pull request merged into another story's branch, so its issue is still open, still block its dependents? | Yes, as `lets backlog ready` does today: the dependents get `not built, blocked by #<blocker>`. The base rule of D7 applies once the blocker's issue is closed, because until then its work is not on the default branch. | Assumption |
| D9 | A started story has a branch but no pull request, and its open blocker's pull request is ready for review. Is it stacked, and on which branch? | Stacked on the base that *Stack the story* finds: the open blocker whose branch contains the others. Its step prompts hold `## Stack`, so the plan step opens the pull request on that branch. When no blocker's branch contains the others, it gets `not built, blocked by #<a> and #<b>, on different branches`. | Assumption |
| D10 | A story's pull request is ready for review, and its base is the branch of a blocker whose issue has closed. D2 settles it with no walk; D7 changes a base only before a walk. What happens to its base and line? | D7's rule applies when the story is settled at the start: `gh pr edit <name> --base <default>`, with no rebase, and the plain built line `#<story> <story-name>: <pr-url>`, with no `, stacked on`. Otherwise the user would merge a ready pull request into a branch that has already merged. | Assumption |

## Changes from the story

- **Clarified:** a started story is one assigned to the signed-in user with its change's branch here or on `origin` (D1). The story said "the stories this user claimed in an earlier run"; a claim on GitHub alone cannot be told from a hand assignment.
- **Added:** a `Resumed` line for a started story (D6), and lines for a story whose pull request is ready, merged or closed (D2, D3, D10), which the story's scope named as "report stories already ready, merged or closed".
- **Cut:** closed sub-issues get no line (D4). Showing them would mean changing `lets backlog item` to print closed sub-issues.

Confirmed by user: yes
