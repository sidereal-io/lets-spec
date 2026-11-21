# Epic run

Read this file only in an epic run: a run of `lets-go` whose issue is
an epic.

An epic run builds the epic's stories one at a time, each to a pull
request ready for review, and ends with one line per story. In this
version, each story's parts and steps run in the epic run's own session,
not in a child session, and an epic with no open stories is not shaped.

## Run the epic

`#<parent>` is the epic. Its stories are the open sub-issues that
`lets backlog item <parent>` printed in
[Check the issue](../SKILL.md#check-the-issue), in the order it printed
them. They stay the same set for the whole epic run: a sub-issue added
or closed during the run does not change it. Claim nothing on the epic,
and create no branch for it. The epic run claims each story it builds,
as for any picked issue.

1. **Start the epic run,** the first time the run reaches this part.
   When the epic has no open sub-issues, print:

   ```text
   #<parent> has no open stories. lets-go does not shape an empty epic yet: run the lets-shape skill on #<parent>.
   ```

   Then stop, claiming nothing and creating no branch. Otherwise,
   write `.workspace/lets-go/epic-<parent>-lines.txt` afresh, empty, so
   that no line of an earlier epic run mixes into this one:

   ```bash
   mkdir -p .workspace/lets-go
   : > .workspace/lets-go/epic-<parent>-lines.txt
   ```

   Then, before the first pick, read what an earlier epic run left of
   each story, in the epic's order, and settle the stories it finished,
   as [Settle a story](#settle-a-story) says:

   - **A story whose `url` names another repository:** settle it with
     `not built, in another repository`. Never pass a sub-issue in
     another repository in `--only`: its key can name an issue of this
     repository.
   - **Any other story:** look for its change's branch, here and on
     `origin`, with the commands
     [Check the issue](../SKILL.md#check-the-issue) uses.
     `<story-name>` is the story's change name:

     ```bash
     git branch --list <story-name>
     git ls-remote --heads origin refs/heads/<story-name>
     ```

     When either command prints a line, the story has its change's
     branch. Keep that for *Pick the next story*, below. Then read the
     story's pull requests:

     ```bash
     gh pr list --head <story-name> --state all --limit 100 --json number,url,state,isDraft,baseRefName,isCrossRepository,createdAt
     ```

     Drop each entry whose `isCrossRepository` is `true`: a pull
     request from a fork can share the name. The story's pull request
     is the entry whose `state` is `OPEN`; else the one whose `state` is
     `MERGED`; else the `CLOSED` one with the latest `createdAt`. Its
     `url` is `<pr-url>`. Settle the story by its pull request:
     - **Open, and its `isDraft` is `false`:** the pull request is
       ready for review. `<story-pr>` is its `number`, and `<pr-base>`
       its `baseRefName`: run
       [Read a pull request's base](#read-a-pull-requests-base) for the
       story. On `on-story`, settle the story with its stacked line,
       naming the `<blocker>` it carries. On `not-stacked`, settle it
       with its built line. On `edit-failed`, say which pull request's
       base could not be moved, with gh's error, and settle the story
       with `stopped: <reason>`, where the reason is gh's error.
       Either way, the epic run runs none of its steps, and *Pick the
       next story* finds it met while its pull request stays ready.
     - **Merged:** settle the story with its merged line. It is not
       resumed.
     - **Closed:** settle the story with
       `not built, its pull request was closed: <pr-url>`. It is not
       resumed.
     - **An open draft, or no pull request:** settle nothing. The story
       is not finished, and a pick can take it.

   A story settled here that blocks another story leaves that story
   blocked while its issue is open: the blocked story gets its own
   `not built, blocked by #<blocker>` line when no candidate is left.
   The branches found here hold for the whole epic run. A branch created
   later belongs to a story this run claimed, and that story is settled
   before the next pick.
2. **Settle the story whose walk ended,** when the run comes back to
   this part from
   [Walk the step table](../SKILL.md#walk-the-step-table).
   The story's pull request is ready for review. Read its URL as
   `<pr-url>`, and settle the story with its built line, or, while the
   story is stacked, with its stacked line, as
   [Settle a story](#settle-a-story) says:

   ```bash
   gh pr view <name> --json url --jq .url
   ```

   Then go back to the default branch, so the next story's branch is
   created off it:

   ```bash
   git switch <default>
   ```

   After a lost claim, the run comes back from
   [Enter the branch](../SKILL.md#enter-the-branch), which has settled
   the story already: go on to the next step.

   After a stop in a story run, the run comes back from
   [A stop in an epic run](#a-stop-in-an-epic-run), which has settled
   the story and its dependents, and switched to the default branch: go
   on to the next step.
3. **Pick the next story.** First find the met stories: the stories
   whose pull request is ready for review, so a story they block can
   stack on them. Read the open pull requests, and run this once, before
   each pick:

   ```bash
   gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName,isCrossRepository
   ```

   A story of the epic, in this repository, is met when an entry's
   `headRefName` is the story's change name, and that entry's `isDraft`
   and `isCrossRepository` are both `false`. Its change name is the
   part of its title before ` — `, or the whole title when it has none.
   A pull request from a fork can share the name, but its branch is not
   on `origin`, so it is never met. Keep each met story's branch, its
   `headRefName`, and its pull request's `number`:
   [Stack the story](#stack-the-story) uses them. It does not matter
   whether this epic run or an earlier one built the story.

   Run the third case, `next`, of
   [Find the source of demand](../SKILL.md#find-the-source-of-demand),
   with one narrowing: the candidates are the epic's stories that are in
   this repository and not settled yet, and no other issue. Pass the
   keys of the epic's stories in this repository as `--only`, and every
   settled story as `--exclude`. Pass every met story as
   `--met-blockers`. Pass every story not settled yet that has its
   change's branch as `--started`, as *Start the epic run* found it.
   `lets backlog ready` keeps those assigned to the signed-in user, and
   ranks them with the others, such as:

   ```bash
   lets backlog ready --only 279,280,281 --exclude 279 --met-blockers 279 --started 281
   ```

   With no story settled, pass no `--exclude`. With no met story, pass
   no `--met-blockers`. With no such story, pass no `--started`. A
   story with its branch that is assigned to someone else is passed, but
   not listed: it gets `not built, assigned to <login>`, below. When
   every story is settled, the result
   is `nothing-ready`, and you run no command. Rank, check the
   prerequisite and confirm the packet of each candidate as `next` does.
   Rank the stories again for every pick: a story built in this run can
   change what is ready. On an error, act as
   [Backlog errors](../SKILL.md#backlog-errors) says.
4. On its result:
   - **`picked`:** print:

     ```text
     Picked #<i>: <title>, the next ready story under #<parent>.
     ```

     When `<i>` was passed in `--started`, print this line instead of
     the `Picked` line. Its branch exists, so an earlier run started it:

     ```text
     Resumed #<i>: <title>, started in an earlier run, under #<parent>.
     ```

     That story is `<i>`, and `<story>` until it is settled. Go on from
     the blocker read in [Check the issue](../SKILL.md#check-the-issue)
     with it, as for an issue number. The story runs through
     [Check the issue](../SKILL.md#check-the-issue),
     [Route](../SKILL.md#route),
     [Enter the branch](../SKILL.md#enter-the-branch),
     [Set the question mode](../SKILL.md#set-the-question-mode) and
     [Walk the step table](../SKILL.md#walk-the-step-table) in this
     session. Each of its steps runs as
     [Run a step](../SKILL.md#run-a-step) says. Start no other `lets-go`
     session for the story.
   - **`nothing-ready`:** settle each story not settled yet, in the
     epic's order, with its `not built` line, as
     [Settle a story](#settle-a-story) says. Its reason is one of
     these:
     - For a candidate that `next` skipped, why it skipped it:
       `its packet is not complete` or
       `its glossary prerequisite is unresolved`.
     - For a story that `lets backlog ready` did not list, read why
       with `lets backlog item <story>`. On an error, act as
       [Backlog errors](../SKILL.md#backlog-errors) says. The reason is
       `blocked by #<blocker>`, naming each open issue in its
       `blockedBy`; else `assigned to <login>`, naming each login in its
       `assignees`; else its `status`, `kind` or `priority`, such as
       `its Status is Done`.

     Then go to [End of the run](../SKILL.md#end-of-the-run).

### Settle a story

A story is settled once the epic run has given it its line. To settle a
story, print its line, and append it to
`.workspace/lets-go/epic-<parent>-lines.txt`. Print each line as the
story settles, before the next `Picked` line. `<story-name>` is the part
of the story's title before ` — `, or the whole title when it has none.

A story whose pull request is ready for review gets this line, with the
pull request's URL. So does a story whose pull request was ready for
review when the epic run started:

```text
#<story> <story-name>: <pr-url>
```

A built story that [Stack the story](#stack-the-story) stacked on
`#<blocker>` gets this line instead. The lines then show the merge
order: its pull request merges after its blocker's.

```text
#<story> <story-name>: <pr-url>, stacked on #<blocker>
```

A story whose pull request merged gets this line, with the merged pull
request's URL:

```text
#<story> <story-name>: merged, <pr-url>
```

A story that was not built gets this line:

```text
#<story> <story-name>: not built, <reason>
```

The reason says why, such as `in another repository`,
`taken by <login>`, `blocked by #<blocker>`,
`blocked by #<a> and #<b>, on different branches`,
`assigned to <login>`, `its packet is not complete`,
`its pull request was closed: <pr-url>` or
`it depends on #<failed>, which did not finish`.

## Read a pull request's base

[Run the epic](#run-the-epic) runs this procedure at the start, for each
story whose pull request is ready for review.
[Take up a started story](#take-up-a-started-story) runs it for a
resumed story's open pull request. It says whether the pull request
stacks the story on another story, and moves the pull request off the
branch of a blocker that has merged. `<story>` is the story,
`<story-name>` its change name, `<story-pr>` its pull request's
`number`, and `<pr-base>` its pull request's `baseRefName`. The caller
read them from this repository's pull requests, with the forks dropped.
Apply the first of these rules that matches:

1. **`<pr-base>` is `<default>`:** the story is not stacked. Return
   `not-stacked`.
2. **`<pr-base>` is the head branch of a pull request of this
   repository that merged into the default branch:** read the merged
   pull requests from that branch:

   ```bash
   gh pr list --head <pr-base> --state merged --limit 100 --json number,isCrossRepository,baseRefName
   ```

   The rule matches when an entry is one whose `isCrossRepository` is
   `false` and whose `baseRefName` is `<default>`. When none is, go on
   to the next rule. When one is, the blocker has merged: move the pull
   request to the default branch. Rebase nothing: only the pull
   request's target changes.

   ```bash
   gh pr edit <story-pr> --base <default>
   ```

   When the edit fails, return `edit-failed`. Otherwise the story is
   not stacked: return `not-stacked`.

   This rule comes before the next one because the epic's stories are
   the set read at the start: a blocker whose pull request merged
   during the epic run is still one of them, but its work is on the
   default branch.
3. **`<pr-base>` is the change name of an open story of the epic, in
   this repository,** other than `<story>`: the pull request stacks the
   story on that story. `<blocker>` is that story, and
   `<blocker-branch>` is `<pr-base>`. Return `on-story`. A blocker whose
   pull request merged into another story's branch matches here, because
   its issue is still open: its work is not on the default branch yet.
4. **Anything else:** leave the base as it is, and return
   `not-stacked`. A base whose pull request merged into a branch other
   than the default branch is one: moving the pull request to the
   default branch would add commits that are not on it.

It returns one of these results:

- `on-story`: the pull request's base is the branch of another open
  story of the epic. It carries `<blocker>` and `<blocker-branch>`.
- `not-stacked`: the story is not stacked on another story.
- `edit-failed`: the pull request's base could not be moved. It carries
  gh's error.

Return to the part or procedure that ran it, with the result.

## Take up a started story

[Check the issue](../SKILL.md#check-the-issue) runs this procedure in
an epic run, for the story the epic run picked, when its change's branch
exists, here or on `origin`, whether or not the story has an open
blocker. It decides the story's stack from what an earlier run left,
before
[Find the source of demand](../SKILL.md#find-the-source-of-demand)
runs for the story. The story is `<i>` and `<story>`, and `<name>` is
its change name. The open blockers are the entries of the story's
`blockedBy`, from the blocker read, whose `state` is `OPEN`.

1. Read the story's pull request:

   ```bash
   gh pr list --head <name> --state all --limit 100 --json number,state,baseRefName,isCrossRepository,createdAt
   ```

   Drop each entry whose `isCrossRepository` is `true`: a pull request
   from a fork can share the name. The story's pull request is the entry
   whose `state` is `OPEN`; else the one whose `state` is `MERGED`; else
   the `CLOSED` one with the latest `createdAt`. With no entry left, the
   story has none. When the command fails, return `read-failed`.
2. With an open pull request, one whose `state` is `OPEN`, take the
   story's stack from it. `<pr-base>` is its `baseRefName`. Run no
   [Stack the story](#stack-the-story): the branch holds commits made on
   that base, and another blocker's branch may not contain them.
   `<story-pr>` is its `number`. Run
   [Read a pull request's base](#read-a-pull-requests-base) for the
   story, and act on its result:
   - **`on-story`:** read the open pull requests, and find the met
     stories as *Pick the next story*, in
     [Run the epic](#run-the-epic), does:

     ```bash
     gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName,isCrossRepository
     ```

     When the `<blocker>` it carries is met, the story stays stacked on
     it, with `<blocker-branch>`. `<blocker-pr>` is the number of its
     pull request. Return `stacked`. Otherwise leave the base as it is,
     and return `not-stacked`.
   - **`not-stacked`:** return `not-stacked`.
   - **`edit-failed`:** return `edit-failed`.
3. With a pull request whose `state` is `MERGED` or `CLOSED`, return
   `not-stacked`, and run no [Stack the story](#stack-the-story): it is
   for a branch with no pull request.
   [Walk the step table](../SKILL.md#walk-the-step-table) reads the
   pull request again, and acts on its state as for any run.
4. With no pull request and an open blocker, run
   [Stack the story](#stack-the-story), and return its result.
5. With no pull request and no open blocker, return `not-stacked`.

It returns one of these results:

- `stacked`: the story stacks on `<blocker>`. It carries `<blocker>`,
  `<blocker-branch>` and `<blocker-pr>`. Its step prompts hold the
  `## Stack` section, and its line ends `, stacked on #<blocker>`.
- `not-stacked`: the story is not stacked. When its pull request's base
  was a merged blocker's branch, the base is now `<default>`.
- `settled`: [Stack the story](#stack-the-story) settled the story.
- `fetch-failed`: [Stack the story](#stack-the-story) could not fetch a
  blocker's branch. It carries `<blocker-branch>` and Git's error.
- `edit-failed`: the pull request's base could not be moved. It carries
  gh's error.
- `read-failed`: the story's pull request could not be read. It carries
  gh's error.

Return to [Check the issue](../SKILL.md#check-the-issue), with the
result.

## Stack the story

[Check the issue](../SKILL.md#check-the-issue) runs this procedure in
an epic run, for the story the epic run picked, when the story has an
open blocker and no change's branch, here or on `origin`.
[Take up a started story](#take-up-a-started-story) runs it too, for a
story whose change's branch exists and has no pull request. For such a
story, [Claim](../SKILL.md#claim) does not run: the step prompts'
`## Stack` section has the plan step open its pull request on
`<blocker-branch>`. It decides whether the story stacks on a blocker's
branch, before
[Find the source of demand](../SKILL.md#find-the-source-of-demand) runs
for the story. The open blockers are the entries of the story's
`blockedBy`, from the blocker read, whose `state` is `OPEN`.

1. Read the open pull requests again, and find the met stories as
   *Pick the next story*, in [Run the epic](#run-the-epic), does. A
   blocker's pull request can have become a draft since the pick.

   ```bash
   gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName,isCrossRepository
   ```

2. When an open blocker is not met, settle the story, as
   [Settle a story](#settle-a-story) says, with
   `not built, blocked by #<blocker>`, naming each open blocker that is
   not met. A blocker that is not one of the epic's stories is never
   met; name one in another repository by its `url`. Return `settled`.
3. Otherwise every open blocker is met, and its branch is
   `<blocker-branch>`. Fetch each one's branch:

   ```bash
   git fetch origin <blocker-branch>
   ```

   When a fetch fails, return `fetch-failed`.
4. Find the base: the open blocker whose branch contains every other
   open blocker's branch. For each other open blocker, with its branch
   as `<other-branch>`, this command succeeds:

   ```bash
   git merge-base --is-ancestor origin/<other-branch> origin/<blocker-branch>
   ```

   With one open blocker, that blocker is the base. When two blockers'
   branches point at the same commit, the command succeeds both ways:
   the base is the first of them in the epic's order.
5. When no open blocker's branch contains all the others, settle the
   story with
   `not built, blocked by #<a> and #<b>, on different branches`, naming
   every open blocker. Name three or more as `#<a>, #<b> and #<c>`.
   Return `settled`.
6. With a base, `<blocker>` is the base, `<blocker-branch>` its branch
   and `<blocker-pr>` the number of its pull request. Print:

   ```text
   Stacks on #<blocker>: <blocker-branch>, pull request #<blocker-pr>.
   ```

   The story is stacked on `#<blocker>` until it is settled. Return
   `stacked`.

It returns one of these results:

- `stacked`: the story stacks on the base. It carries `<blocker>`,
  `<blocker-branch>` and `<blocker-pr>`. For a story with no branch,
  [Claim](../SKILL.md#claim) creates the story's branch off
  `origin/<blocker-branch>`.
- `settled`: the story has its `not built` line. A settle here claims
  nothing, counts no lost claim and does not end the epic run.
- `fetch-failed`: a blocker's branch could not be fetched. It carries
  `<blocker-branch>` and Git's error.

Return to [Check the issue](../SKILL.md#check-the-issue), with the
result.

## A stop in an epic run

While an epic run is on a story, from its `Picked` line to its line, a
stop ends only that story's run, not the epic run. This holds the same
way for every stop of the parts and procedures the story runs through,
such as a failed step, records that disagree, a pull request that is
merged or closed, a stop of
[Check the prerequisite](glossary-handoff.md#check-the-prerequisite),
a failed claim write, a `lets backlog` error, a `fetch-failed` from
[Stack the story](#stack-the-story), or an `edit-failed` or
`read-failed` from [Take up a started story](#take-up-a-started-story),
except the lost claim:
[Enter the branch](../SKILL.md#enter-the-branch) settles a lost story,
and goes back to [Run the epic](#run-the-epic). A stop between stories,
such as a `lets backlog` error in a pick, still ends the epic run, as
[Backlog errors](../SKILL.md#backlog-errors) says.

On a stop in a story run, take these actions in order.

1. Do what the stop says first, such as print the `Failed` line and the
   pull request's URL.
2. Settle the story, as [Settle a story](#settle-a-story) says. For a
   failed step, `<step name>` is the step's name in plain words, as its
   `Failed` line names it, such as `review build`. For any other stop,
   the reason is what the stop said:

   ```text
   #<story> <story-name>: failed at <step name>: <reason>
   #<story> <story-name>: stopped: <reason>
   ```

   From here on, this story is `<failed>`.
3. Check the checkout for changes that are not committed, outside
   `.workspace/`: staged, unstaged or untracked. Ignored files do not
   count.

   ```bash
   git status --porcelain --untracked-files=all -- . ':(exclude).workspace'
   ```

   When it prints any line, the epic run ends at this story, and
   `<stopped-story>` is `<failed>`. Settle each story not settled yet,
   in the epic's order, with this line, where `#<story>` is the story
   not built:

   ```text
   #<story> <story-name>: not built, the epic run stopped at #<stopped-story>
   ```

   Leave the changes as they are. Print every line of
   `.workspace/lets-go/epic-<parent>-lines.txt`, in order, as
   [End of the run](../SKILL.md#end-of-the-run) does, and stop.

   When it prints nothing, go on to the next action.
4. Find the stories that depend on `<failed>`, and settle them. For
   each story of the epic, in this repository and not settled yet, run
   `lets backlog item <story>`. Keep the `key` of each entry of its
   `blockedBy` whose `state` is `OPEN` and whose `url` is the `url` of
   a story of the epic in this repository. A blocker in another
   repository can share its key with a story here, so a key alone never
   makes a story a dependent.

   Then mark the dependents, through any number of stories. A story not
   settled yet is a dependent when one of its kept keys is `<failed>`
   or a dependent. Repeat until no new story is marked. A link through
   an issue outside the epic, or through a story settled before this
   stop, makes no dependent.

   Settle each dependent, in the epic's order, right after the line of
   `<failed>`, with this line. It names `<failed>` itself, even when
   the dependence goes through other stories:

   ```text
   #<story> <story-name>: not built, it depends on #<failed>, which did not finish
   ```

   With no dependent, settle no story here. A `lets backlog` error in
   this action is a stop between stories, as
   [Backlog errors](../SKILL.md#backlog-errors) says: it ends the epic
   run.
5. Go back to the default branch, so the next story's branch is created
   off it:

   ```bash
   git switch <default>
   ```

   When `git switch` fails, say Git's error, and end the epic run as
   the third action does. Otherwise go back to
   [Run the epic](#run-the-epic). Its *Pick the next story* runs next,
   where every story settled in actions 2 and 4 is passed in
   `--exclude`, so none of them is picked.

The epic run retries no failed step: running `lets-go` again on the
failed story's branch carries on, as for any run. The end of the epic
run prints no count of built, failed or skipped stories: the lines are
its summary.
