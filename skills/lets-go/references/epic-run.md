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

   Then settle each story whose `url` names another repository with
   `not built, in another repository`, as
   [Settle a story](#settle-a-story) says. Never pass a sub-issue in
   another repository in `--only`: its key can name an issue of this
   repository.
2. **Settle the story whose walk ended,** when the run comes back to
   this part from
   [Walk the step table](../SKILL.md#walk-the-step-table).
   The story's pull request is ready for review. Read its URL as
   `<pr-url>`, and settle the story with its built line, as
   [Settle a story](#settle-a-story) says:

   ```bash
   gh pr view <name> --json url --jq .url
   ```

   Then go back to the default branch, so the next story's branch is
   created off it:

   ```bash
   git switch <default>
   ```
3. **Pick the next story.** Run the third case, `next`, of
   [Find the source of demand](../SKILL.md#find-the-source-of-demand),
   with one narrowing: the candidates are the epic's stories that are in
   this repository and not settled yet, and no other issue. Pass the
   keys of the epic's stories in this repository as `--only`, and every
   settled story as `--exclude`, such as
   `lets backlog ready --only 279,280,281 --exclude 279`. With no story
   settled, pass no `--exclude`. When every story is settled, the result
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
pull request's URL:

```text
#<story> <story-name>: <pr-url>
```

A story that was not built gets this line:

```text
#<story> <story-name>: not built, <reason>
```

The reason says why, such as `in another repository`,
`taken by <login>`, `blocked by #<blocker>`, `assigned to <login>` or
`its packet is not complete`.
