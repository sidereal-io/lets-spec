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
3. A kept parent is this input's discovery in either of two states:
   - **It says `Discovery status: in-progress`.** The discovery stopped
     between rounds, or before [Claim](../SKILL.md#claim).
   - **It has no status line, and an earlier shape round of this input
     left answers.** That is,
     `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least
     one pair, and, for an idea,
     `.workspace/lets-go/<shape-name>-shape-prompt.md` holds this idea.
     Stopping during Finalize leaves this state: Finalize removes the
     status line before it asks its own questions, and
     [Read the report](../SKILL.md#read-the-report) removes the answers
     file only when shape reports `done` or `failed`.

   A kept parent in neither state is not this input's discovery: for
   example, an open epic whose discovery finished.

Return to the part that ran it, with each discovery it found, or none.

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

1. Check the discovery maps:

   ```bash
   git status --porcelain -uall -- openspec/discovery.md openspec/discovery
   ```

   It names each changed map, new files included, and works when the
   `openspec/discovery/` folder does not exist. When it lists a path,
   take this input's discovery from
   [Find the input's discovery](#find-the-inputs-discovery). For an
   idea, use what [Start from an idea](#start-from-an-idea) found. For
   an epic whose stopped discovery
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
3. For an idea, check that the answers file is this idea's. Two ideas
   can share their first five words, and so their `<shape-name>`. When
   `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds
   another idea, an earlier run stopped before it finished, on that
   other idea. In that case, remove
   `.workspace/lets-go/<shape-name>-shape-answers.yaml` before you write
   the prompt.
4. Run the shape step, as [Run a step](../SKILL.md#run-a-step) says.
5. When it reports `done`,
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
   - **A parent and its stories, when the parent is the run's issue
     `<i>`:** discovery shaped the run's epic in place. Go on from the
     blocker read in [Check the issue](../SKILL.md#check-the-issue) with
     `<i>`, not to
     [Pick the first ready story](../SKILL.md#pick-the-first-ready-story).
     That read finds the epic's new stories, and its `epic` case starts
     the epic run on them.
   - **Any other parent and its stories:**
     [pick the first ready story](../SKILL.md#pick-the-first-ready-story).

## Pick the first ready story

Discovery filed a parent issue, `#<parent>`, and its stories. Build one
of them in this run.

1. Run the third case, `next`, of
   [Find the source of demand](../SKILL.md#find-the-source-of-demand),
   with one narrowing: the candidates are the stories the report named,
   and no other issue. Pass their keys to `lets backlog ready` with
   `--only`, as the section says. Rank as it does: Must, then Should,
   then Could, then the oldest issue first. Run
   [Check the prerequisite](glossary-handoff.md#check-the-prerequisite)
   and [Confirm the packet](../SKILL.md#confirm-the-packet) on each
   candidate, in rank order. A ready story is one that `next` would
   take.
2. On its result:
   - **`picked`:** print:

     ```text
     Picked #<i>: <title>, the first ready story under #<parent>.
     ```

     That story is `<i>`. Go on from the blocker read in
     [Check the issue](../SKILL.md#check-the-issue) with it, as for an
     issue number.
   - **`nothing-ready`:** print the `Done shape` line, as
     [The step lines](../SKILL.md#the-step-lines) says. Say
     that no story under `#<parent>` is
     ready. Name each story, and why it was left out, as the result
     carries it: for example, its blocker, its assignee, an unresolved
     prerequisite, or a packet that is not complete. For a story that
     `lets backlog ready` did not list, read why with
     `lets backlog item <story>`: the `assignees` it names, an open
     issue in its `blockedBy`, or its `status`, `kind` or `priority`.
     On an error, act as [Backlog errors](../SKILL.md#backlog-errors)
     says. Say to run `lets-go` with a story's number once it is ready.
     Then stop. Claim nothing, and create no branch.

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

Return to the part that ran it.

## The shape step's name

`<name>` is the change's name. Shape runs before there is one, so it
has a name of its own, `<shape-name>`, from what it shapes:

- **An issue:** `issue-<i>`, such as `issue-180`.
- **An idea:** `idea-<slug>`. To make `<slug>`, split the idea on white
  space. Lower-case each word, and keep only its letters and digits.
  Drop a word left empty. Join the first five words with hyphens, or all
  of them when there are fewer. `fix lets-sync — quiet output` becomes
  `idea-fix-letssync-quiet-output`. The same idea typed again gets the
  same name, so it finds its answers file.
  [Read the request](../SKILL.md#read-the-request) has already stopped
  an idea with no letter or digit, so `<slug>` is never empty, and no
  shape step is named `idea-`.
