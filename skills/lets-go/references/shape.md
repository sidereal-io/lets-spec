# Shape

Read this file when the run starts from an idea, runs the shape step,
looks for an epic's stopped discovery, or commits the discovery map.

## Find the input's discovery

An earlier run may have started a discovery of this input and stopped.
This lookup finds it, so the run resumes that discovery instead of
searching issue titles or stopping on the discovery maps' edits. The
input is an idea, or an issue `#<i>`.

1. List the open parent issues with `lets-shape`'s own query:

   ```bash
   gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body
   ```

2. Keep each parent whose `Input:` line names this input: the idea word
   for word, or `#<i>` or the issue's URL. When the input is an issue
   `#<i>` that is itself in that list, keep it too, whatever its
   `Input:` line names. An epic that discovery shaped in place names
   itself, and an epic that an idea's discovery filed names the idea.
3. A kept parent is this input's discovery in any of three states:
   - **It says `Discovery status: in-progress`.** The discovery stopped
     between rounds, or before [Claim](../SKILL.md#claim).
   - **It has no status line, and an earlier shape round of this input
     left answers.** That is, this input's answers file,
     `.workspace/lets-go/<shape-name>-shape-answers.yaml`, holds at
     least one pair. It is the `answers` that `lets go shape-name`
     printed for this input:
     [Read the request](../SKILL.md#read-the-request) ran it for an
     idea, and [Check the issue](../SKILL.md#check-the-issue) for an
     issue. Stopping during Finalize leaves this state: Finalize removes the
     status line before it asks its own questions, and
     [Read the report](../SKILL.md#read-the-report) removes the answers
     file only when shape reports `done` or `failed`.
   - **It is the input itself, has no status line, and an earlier shape
     round of the input its `Input:` line names left answers.** This is
     the case when the input is an issue `#<i>` kept because it is
     itself in that list, and its `Input:` line names another input: an
     epic that discovery filed from an idea, or from another issue that
     it split. Stopping during Finalize leaves the answers under that
     named input's `<shape-name>`, not under `issue-<i>`. Take the
     named input. An `Input:` line that holds an issue, as `#` and its
     number or as its URL, names that issue; any other text names an
     idea, word for word. Name that input's shape step with
     `lets go shape-name`. For an issue, pass its number: for a URL,
     the number at its end, never the URL, because a `/` in the name
     would make the answers file's path a folder. For an idea, quote
     it as [Read the request](../SKILL.md#read-the-request) does, with
     the idea from the `Input:` line in place of `<idea>`:

     ```bash
     # for Input: #180, or Input: https://github.com/sidereal-io/lets-spec/issues/180
     lets go shape-name --issue 180
     # for an idea
     lets go shape-name --idea '<idea>'
     ```

     The epic is this input's discovery when the `answers` it prints
     names a file that holds at least one pair. When the command exits
     non-zero, this state finds nothing. Beside that command, which
     reads no file, read no other file and run no other query for this
     state: the parent list already holds the `Input:` line. The answers file
     exists only on the machine where that round ran, so on another
     machine this state finds nothing.

   When a parent is in both the second and the third state, take the
   state whose answers file changed last, and only that one. Rounds of
   one discovery under two inputs can each leave answers, and the round
   that stopped last is the one to resume: its answers hold what
   Finalize needs.

   A kept parent in none of these states is not this input's discovery:
   for example, an open epic whose discovery finished.

Return to the part that ran it, with each discovery it found, or none.
Return each discovery with its *shape input*, the input whose shape
round resumes it: the named input for a discovery found in the third
state, and this input for every other one.

## Start from an idea

1. Look for a discovery of this idea that an earlier run started: run
   [Find the input's discovery](#find-the-inputs-discovery) for the
   idea. On its result:
   - **One or more:** say that a discovery of this idea is in progress
     at each `#<parent>` it found. Skip the search below, and
     [run the shape step](../SKILL.md#run-the-shape-step) for the idea.
     Its round resumes the discovery, or finishes its Finalize. When
     several match, `lets-shape` asks which one; ask nothing here.
   - **None:** go on to the search below.
2. Run the second case of
   [Find the source of demand](../SKILL.md#find-the-source-of-demand):
   the run has described work, but no issue. It searches open issue
   titles for the idea's words. On its result:
   - **`matches`:** show the user the matches it carries, and ask
     whether one is the same work. Ask in either mode: a wrong yes
     builds someone else's issue.
   - **`no-match`:**
     [run the shape step](../SKILL.md#run-the-shape-step) for the idea.
3. On a yes, that issue is `<i>`. Go on from the blocker read in
   [Check the issue](../SKILL.md#check-the-issue).
4. On a no, [run the shape step](../SKILL.md#run-the-shape-step) for the
   idea.

## Run the shape step

The shape step turns an idea, or an issue whose packet is not complete,
into one shaped issue. When the work is too large for one issue, it runs
discovery instead, which files a parent issue and its stories. It runs
on the default branch, before any branch or change exists, and at most
once per run. [Check the issue](../SKILL.md#check-the-issue) decides
when it runs.

The step's input is the idea, or the issue `#<i>`. For an epic whose
stopped discovery [Check the issue](../SKILL.md#check-the-issue) found,
it is the shape input that
[Find the input's discovery](#find-the-inputs-discovery) returned,
which can be the idea or the issue that the epic's `Input:` line names:

- **An idea:** run the step as for an idea, with the idea from the
  `Input:` line as `<idea>`. Its `<shape-name>` is the `name` that
  `lets go shape-name` printed for that idea in
  [Find the input's discovery](#find-the-inputs-discovery). The idea
  also sets the idea form of the prompt in
  [Write the prompt](step-prompt.md#write-the-prompt).
- **Another issue:** run the step as for an issue, with that issue in
  place of `#<i>`: its `<shape-name>` is the `name` that
  `lets go shape-name` printed for that issue's number in
  [Find the input's discovery](#find-the-inputs-discovery), such as
  `issue-180`, and the issue form of the prompt names that issue's
  number and URL. The URL is the one the `Input:` line holds, or else the
  epic's `<issue-url>` with that issue's number in place of the epic's.

[Read the report](../SKILL.md#read-the-report) then, once the step
reports `done` or `failed`, removes that input's answers file, the one
the step used; for an epic whose `Input:` line names another input,
that input's too; and, on `done` for an epic, the epic's own, under
`issue-<parent>`. A `done` report names the epic and its stories, so
the run goes back to [Check the issue](../SKILL.md#check-the-issue) with
the epic.

1. Check the discovery maps:

   ```bash
   git status --porcelain -uall -- openspec/discovery.md openspec/discovery
   ```

   It names each changed map, new files included, and works when the
   `openspec/discovery/` folder does not exist. When it lists a path,
   take this input's discovery from
   [Find the input's discovery](#find-the-inputs-discovery). For an
   idea, use what [Start from an idea](#start-from-an-idea) found. For
   an epic, or the one story an epic became, whose stopped discovery
   [Check the issue](../SKILL.md#check-the-issue) found, use what it
   found. For any other issue `#<i>`, run the lookup now.
   - **There is one or more:** the edits are that discovery's confirmed
     phases. Go on: the step resumes the discovery or finishes its
     Finalize, and its map commit takes the edits. When several match,
     `lets-shape` asks which one.
   - **There is none:** say that the maps have uncommitted edits, name
     each path it lists, and say to commit or discard them. Stop, and
     run no step. If the run went on, a discovery's commit could sweep
     those edits in.
2. Set `<mode>` and print its line, as
   [Set the question mode](../SKILL.md#set-the-question-mode)
   says for a question mode before a shape step. Then go on here, with
   the next step.
3. Run the shape step, as [Run a step](../SKILL.md#run-a-step) says.
4. When it reports `done`,
   [Read the report](../SKILL.md#read-the-report) says what it shaped.
   Check one case first. When the check of the discovery maps above went
   on only because one or more parents with no status line were this
   input's discovery, and the step shaped none of those parents, the
   maps' edits may be another discovery's. The step shaped none of them
   when its one issue, or its parent, is not one of them. Print the
   `Done shape` line, as [The step lines](../SKILL.md#the-step-lines)
   says. Name each path that check listed, say to commit or discard
   them, and stop here, before
   [Check the issue](../SKILL.md#check-the-issue). Claim nothing, and
   create no branch. Otherwise:
   - **One issue:** that issue is `<i>`. Go on from the blocker read in
     [Check the issue](../SKILL.md#check-the-issue) with it, as for an
     issue number.
   - **A parent and its stories:** the parent is `<i>`. Go on from the
     blocker read in [Check the issue](../SKILL.md#check-the-issue) with
     it. That read finds the parent's new open stories, and its `epic`
     case starts the epic run on them.

### Name the maps' edits

A run that stops after discovery and before [Claim](../SKILL.md#claim),
for any reason, leaves the maps' edits on the default branch. When the
status command in [Commit the discovery map](#commit-the-discovery-map)
lists a path, name each one, and say that they hold the discovery's
edits, uncommitted on the default branch. While
[Find the input's discovery](#find-the-inputs-discovery) still takes the
parent as this input's discovery, say to leave the maps as they are:
running `lets-go` again with the same idea, or `#<i>`, resumes the
discovery and keeps its edits. Otherwise, say to commit or discard them
before the next run, because the next run stops on them.

## Commit the discovery map

Discovery edits the discovery maps on the default branch:
`openspec/discovery.md`, and in a repository with several products the
files under `openspec/discovery/`. The new branch carries the edits with
it. When a shape step ran in this run, list the changed maps on the new
branch, before [Walk the step table](../SKILL.md#walk-the-step-table)
reads the tree:

```bash
git status --porcelain -uall -- openspec/discovery.md openspec/discovery
```

Each line is two status letters, a space, then a path. When it lists no
path, make no commit. Otherwise take each path, new files included, as
`<paths>`, and commit them:

```bash
git add -- <paths>
git commit -m "docs: the discovery map from #<parent>" -- <paths>
```

Never pass the `openspec/discovery` folder itself to `git add` or
`git commit`: both fail on a path that matches no file.
`<parent>` is the parent's number, or the story's when the parent
became the one story. Commit no other path. This is the one commit
`lets-go` makes itself, beside the glossary import.

In an epic run, use the form below instead.

Return to the part that ran it.

### Commit the map in an epic run

In an epic run, the story's branch is checked out in its own worktree,
`<path>`. [Claim](../SKILL.md#claim) created it from the committed
default branch, so the edits stay behind in the epic run's own
checkout. Carry them into the first story the epic run claims, then
return the checkout to clean. Run this after
[The story's worktree](../SKILL.md#the-storys-worktree) has prepared
`<path>`. Run this for the first story the epic run claims, and for no
later one.

1. List the changed maps in the epic run's own checkout:

   ```bash
   git status --porcelain -uall -- openspec/discovery.md openspec/discovery
   ```

   When it lists no path, make no commit. Return `committed`: there is
   nothing to carry. Otherwise the listed paths are `<paths>`.
2. Carry each listed path, `<map>`, into the worktree:
   - **A path that exists** in the checkout: copy it to the same path
     in `<path>`. Create its folder first, because the worktree may
     have no `openspec/discovery/` folder:

     ```bash
     mkdir -p -- "$(dirname -- <path>/<map>)"
     cp -- <map> <path>/<map>
     ```

   - **A path that no longer exists**, marked ` D` or `D `, which
     discovery removed: remove it in the worktree too.

     ```bash
     git -C <path> rm -q -- <map>
     ```

   The paths you copied are `<copied paths>`.
3. Commit them in the worktree. `git add` takes only the copied paths,
   because it fails on a path that `git rm` has removed. The commit
   takes them all:

   ```bash
   git -C <path> add -- <copied paths>
   git -C <path> commit -m "docs: the discovery map from #<parent>" -- <paths>
   ```

   When a command fails, leave the checkout's edits as they are, and
   return `commit-failed`, with Git's error.
4. Only once the commit succeeds, return the epic run's checkout to its
   committed state, so it stays clean on `<default>`. The paths not
   marked `??` are `<tracked paths>`: restore them, when there are any.
   Then remove each path marked `??`, a map discovery created:

   ```bash
   git restore --source=HEAD --staged --worktree -- <tracked paths>
   rm -- <map>
   ```

   The edits are safe in the story's commit, so the restore loses
   nothing. When a command fails, return `restore-failed`, with Git's
   error: the story's commit already holds the edits. Otherwise return
   `committed`.

Never pass the `openspec/discovery` folder itself to a Git command.
`<parent>` is the epic's number.

It returns one of these results:

- `committed`: the story's branch holds the maps' edits, and the epic
  run's checkout is clean; or no map had changed.
- `commit-failed`: a copy, removal or commit in `<path>` failed. It
  carries Git's error. The edits are still in the epic run's checkout.
- `restore-failed`: the commit succeeded, but the restore of the epic
  run's checkout failed. It carries Git's error. The story's commit
  holds the edits, and the checkout still has them too.

Return to the part that ran it.
