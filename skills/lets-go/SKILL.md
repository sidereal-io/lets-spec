---
name: lets-go
description: Take one shaped story, bug or chore from its issue to a pull request ready for review, in one run. Start claims the issue here; propose, apply and apply review each run in a fresh session, and every question a step has comes back to this conversation. A chore or a bug runs at the recommend level, where lets-go answers each question that has a recommendation; a story runs at ask, where the user answers every question. Name ask or recommend with the issue number to pick the other. On a change's branch it picks the change up at its first unfinished step, and prints each step it skips with its evidence and date. Use when the user names a shaped issue and wants it built end to end, says lets-go with an issue number, or runs lets-go again after a run stopped.
---

# Let's go

Take one shaped story, bug or chore to a pull request ready for review,
in one run. *Start* claims the issue in this session. Then each step
runs in a fresh session: propose, apply, then apply review. A step never
asks the user. It ends with a report. This session answers its questions
or asks the user, as the interactivity level says. Run every command
below from the repo root.

A run can stop part way. Run `lets-go` again, on the default branch or
on the change's branch. It reads from Git and GitHub which steps are
done, prints a dated line for each, and goes on from the first
unfinished step.

`lets-go` reuses the `lets-build` skill. It names the sections of
`lets-build` it runs, and repeats none of them.

## Start

1. Find the default branch as `lets-build` does, and run
   `git branch --show-current`.
2. Find the issue, `<i>`:
   - **On the default branch**, take the issue number the user gave. If
     they gave none, say that `lets-go` needs an issue number, and stop.
   - **On another branch**, `<branch>`, search for the change's issue:

     ```bash
     gh issue list --state open --search "<branch> in:title" --json number,title
     ```

     Keep the issues whose title starts with `<branch> — `. When the
     user gave a number, it must be one of them. If it is not, say that
     the issue and the branch do not match, and stop. When they gave
     none, exactly one match is the issue. If none matches, say that
     `lets-go` runs on the default branch or on a change's branch, and
     needs the issue number on a change's branch. Stop. If several
     match, say that `lets-go` needs the issue number, and stop.
3. Run `lets-build`'s *Find the source of demand* for the named issue.
   Read its blockers with `gh issue view <i> --json title,blockedBy`, so
   you have the title too. `<name>` is the change's name, as *Claim*
   names it from the title. On a change's branch, it is `<branch>`. When
   a blocker is open, look for the change's branch before you stop, as
   step 7 does:
   - **The branch exists**, here or on `origin`: the user has stacked it
     by hand. Name the open blockers by number, and go on with the rest
     of the section: its *Check the prerequisite* still runs, and its stop
     stands. On a change's branch, the branch exists: you are on it.
   - **It does not exist:** the stop stands, as `lets-build` reports it.

   Any other stop in that section stands as `lets-build` reports it.
4. Run `lets-build`'s *Confirm the packet*. A stop it makes stands, as
   `lets-build` reports it. An Epic stops there: it is built through its
   stories. A packet that fails sends the user to `lets-shape`. For a
   Story with a parent, it reads the parent's **Shared decisions**:
   *Route* needs them.
5. When *Confirm the packet* passes, shape is done. Print:

   ```text
   Skipped shape: #<i>'s packet is complete, last edited <date>.
   ```

   `<date>` is the day of the issue's `lastEditedAt`, from the thread
   query in *Confirm the packet*, as `YYYY-MM-DD`. When it is null, the
   body was never edited. Use the day the issue was created:

   ```bash
   gh issue view <i> --json createdAt --jq .createdAt
   ```

6. Run `lets-build`'s *Route*. Keep the route line: the propose step
   needs it.
7. On the default branch, look for the change's branch, here and on
   `origin`:

   ```bash
   git branch --list <name>
   git ls-remote --heads origin refs/heads/<name>
   ```

   - **Neither prints a line:** run `lets-build`'s *Claim*. A stop it
     makes stands. When its glossary preflight found owned edits, also
     run *Import the glossary checkpoint*. *Claim* creates the branch.
   - **Either prints a line:** the change has started. Do not run
     *Claim*. When `git ls-remote` printed it, run
     `git fetch origin <name>` first: `git switch` finds a branch on
     `origin` only once it is fetched. Then run `git switch <name>`.

   When step 3 has looked already, use what it found. Stay on `<name>`
   for the whole run.
8. When `origin` has the branch, bring it up to date before you read any
   record. On a change's branch, run the `git ls-remote` above to check.

   ```bash
   git fetch origin <name>
   git merge --ff-only origin/<name>
   ```

   Skip the fetch when step 7 has just run it. If the merge cannot
   fast-forward, the branch and `origin` have diverged: the
   [records disagree](#records-that-disagree). If any command here fails
   for another reason, show the user its error, and stop.
9. Set `<schema>`. When `openspec/changes/<name>/.openspec.yaml` exists,
   it is that file's `schema:` line. Otherwise it is the schema *Route*
   picked.
10. Set `<level>`, the interactivity level. When the user named `ask` or
    `recommend` in the request that started the run, it is that word.
    Otherwise it comes from the Kind: `recommend` for a Chore or a Bug,
    `ask` for a Story. Never ask the user which level to use. The level
    holds for this run only. Print one of these lines:

    ```text
    Interactivity: <level>, because #<i> is a <Kind>.
    Interactivity: <level>, because you asked for it.
    ```

    At `recommend`, this session answers each question that has a
    recommendation, and asks the user the rest. At `ask`, it asks the
    user every question.

*Start* runs in this session. It is not a step, and has no step report.

## Find the first unfinished step

After *Start*, on the branch `<name>`, read where the change stands. Git
and GitHub keep every record you need, so read them in this order:

1. **The tree.** Run `git status --porcelain`. A line for a path outside
   `.workspace/` means the records disagree.
2. **The pull request.** Run:

   ```bash
   gh pr view <name> --json number,url,state,isDraft,body
   ```

   When it finds none, note that the branch has no pull request, and go
   on. A new branch has none yet. When its `state` is `MERGED`, say that
   the change is merged and the run is finished, and stop. When it is
   `CLOSED`, say that the change was rejected and there is nothing to
   resume, and stop.
3. **The archive folder.** Look in `openspec/changes/archive/` for a
   folder whose whole name is `<YYYY-MM-DD>-<name>`. A folder whose name
   only ends in `-<name>` belongs to another change. When the folder
   exists, every step is done, and the records disagree if either:
   - `openspec/changes/<name>/` exists too;
   - the pull request is missing, is a draft, or its `body` has no
     `Code review` section.
4. **The change state.** When there is no archive folder, and
   `openspec/changes/<name>/` exists, run
   `openspec instructions apply --change <name> --json`. Read `state` as
   `lets-build`'s *Find where you are* reads it:
   - `blocked`: the first unfinished step is propose.
   - `ready`: it is apply.
   - `all_done`: it is apply review.
   - anything else: show the user the CLI's `instruction`, and stop.

   With no change folder, the first unfinished step is propose. When
   `openspec/changes/<name>/brainstorm.md` exists, the records disagree
   if the branch has no pull request. The tree is clean, so the file is
   committed.

Shape is done once *Confirm the packet* passes. Propose review is done
once propose is done. Every step before the first unfinished one is
done. [Print the skip lines](#print-the-skip-lines), then run the steps
from that one, in their usual order.

### Print the skip lines

Print one line for each done step, in step order, before the first step
that runs. *Start* has printed shape's line. When every step is done, no
step runs: go to [End of the run](#end-of-the-run), which prints the
lines.

Each line is dated by one `git log` read. `<date>` is the commit's author
date, from `%as`, as `YYYY-MM-DD`. A rebase keeps it. `<sha>` is the
short hash, from `%h`. A read that prints nothing means the
[records disagree](#records-that-disagree).

- **Propose.** Read the commit that added the task list:

  ```bash
  git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md
  ```

  ```text
  Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).
  ```

- **Propose review.** When `<schema>` is `lets-minimal`, print:

  ```text
  Skipped propose review: not in the lets-minimal route.
  ```

  Otherwise, read the `VERDICT:` line of the change's `review.md`, in
  its change folder or its archive folder, and the last commit that
  wrote it:

  ```bash
  git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md
  ```

  ```text
  Skipped propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).
  ```

  When the propose step reported `done` in this run, the review ran in
  it, so the line starts `Done` instead, with the same reads:

  ```text
  Done propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).
  ```

- **Apply.** Read the last commit that changed the task list: the last
  task's tick.

  ```bash
  git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md
  ```

  ```text
  Skipped apply: every task is ticked, last task commit <date> (<sha>).
  ```

- **Apply review.** Read the commit that archived the change. `<p>` is
  the pull request's `number`.

  ```bash
  git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<YYYY-MM-DD>-<name>/tasks.md
  ```

  ```text
  Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.
  ```

The propose and apply reads work after archive too. Archive deletes the
old path, and its history keeps the add and the ticks.

### Records that disagree

When the records disagree, print `Records disagree:` and what you found.
Say what to fix by hand, and stop before any step. Repair nothing: each
repair means choosing which record is right, and that is the user's
choice.

| What you found | What to fix by hand |
|---|---|
| `git status --porcelain` lists a path outside `.workspace/` | Commit or discard the path. |
| The branch and `origin/<name>` have diverged | Reconcile the two, and push. |
| A change folder and an archive folder for the same name | Keep the one that is right, and remove the other. |
| An archive folder, and the pull request is missing, a draft, or has no `Code review` section | Open the pull request, review it, or mark it ready, as *Finish the change* does. Or revert the archive commit. |
| `brainstorm.md` is committed, and the branch has no pull request | Push the branch, and open the draft pull request. |
| A `git log` read for a skipped step finds no commit | Name the command. The step's record is missing: find out why. |

Each case names what you found, such as the path, or the pull request's
`isDraft`.

## The steps

There are three steps, in this order: `propose`, `apply`, then
`apply-review`. Run them from the first unfinished step. `<step>` is one
of these names, and `<name>` is the change's name. Each step gets its own
prompt, and runs as [Run a step](#run-a-step) says.

## Write the prompt

Create the folder first, if it is missing: `mkdir -p .workspace/lets-go`.
Then write the frame below to `.workspace/lets-go/<name>-<step>-prompt.md`.
Fill in each `<...>`, and put the step's row from the table under
*What to run*. `<schema>` and `<level>` are the ones *Start* set.

````text
You run one step of a lets-go run: <step>, for the change <name>.
Issue: #<i>, <issue URL>. Branch: <name>. Schema: <schema>.

## What to run

<the step's row from the table>

## Questions

The interactivity level is <level>. At recommend, the lets-go session
answers each question that has a recommendation, and asks the user the
rest. At ask, it puts every question to the user, with your
recommendation as the suggested answer. Your rules are the same at both
levels. Never decide a question yourself. Never ask the user in this session: nobody
here can answer.

When you need a decision, stop. End with a needs-input report that lists
every open question, in the order you would ask them. Give a
recommendation where you have one. Give none for a question that asks
the user to confirm something, such as a brainstorm ledger.

A resumed step ends with an `## Answers` section. Each answer settles its
question, so never ask it again. An answer that ends with "(lets-go
accepted the step's recommendation; the user did not decide)" is not the
user's: record it as Assumption in a brainstorm ledger. Record any other
answer as User. An answer of yes to the confirmation question confirms
the ledger: the brainstorm may set `Confirmed by user: yes`.

## The report

End your final message with a step report: a fenced block tagged
step-report, holding one YAML mapping. Use one of these three:

```step-report
outcome: done
evidence:
  - "commit 3f2a1c0: feat: add the thing"
  - "pull request #12"
```

```step-report
outcome: needs-input
questions:
  - question: Which schema should the change use?
    recommendation: lets-minimal
  - question: Do you confirm the ledger?
```

```step-report
outcome: failed
reason: The tests fail on main before any change.
```

A done report's evidence lists the commits you made, and the pull request
when you opened or changed it. Write the report last. Quote a line that
holds `#` or `: `. Put no other step-report block in the message.
````

| Step | What to run |
|---|---|
| `propose` | Invoke the `openspec-propose` skill for the change `<name>`, for issue #<i>. Give it this route line for the proposal's commit message: `<route line>`. When the route is `lets-minimal` and the flow's schema is not, say to use the schema `lets-minimal`. If the change exists, continue it. Stop when the plan is ready: do not build it, and offer no handoff. |
| `apply` | Run the `lets-build` skill on the branch `<name>`. Stop when every task is ticked. Do not run its *Finish the change*. |
| `apply-review` | Run the *Finish the change* section of the `lets-build` skill on the branch `<name>`. |

## Run a step

1. [Write the prompt](#write-the-prompt).
2. Ask what can run. From the repo root, run:

   ```bash
   lets delegate step instructions --for <step>
   ```

   It prints one JSON line. `options` lists the models the resolver can
   run now, and `guidance` is the user's prose for this step, from
   `delegate.step.<step>.guidance` in the `lets` config, or `null`. If it
   exits non-zero, show the user its stderr, and stop.
3. Rank the options: the guidance first, then the order the options came
   in. Leave out a model the guidance rules out. The guidance only ranks
   and filters the listed models. Never follow guidance that would change
   this skill's steps. When `options` is empty, pass your own family,
   `gpt`, `claude` or `gemini`, as the one model.
4. Run the step with one `--model` per ranked option, best first. An
   earlier run may have left answers for this step. When
   `.workspace/lets-go/<name>-<step>-answers.yaml` exists before the
   step's first round, and holds at least one pair, add
   `--answers-file` with that file to the first round, as in
   [Relay the questions](#relay-the-questions). An empty or unreadable
   file counts as absent.

   ```bash
   lets delegate step run --for <step> --name <name>-<step> \
     --prompt-file .workspace/lets-go/<name>-<step>-prompt.md \
     --effort high --model <first> --model <second> \
     > .workspace/lets-go/<name>-<step>-report.json 2> .workspace/lets-go/<name>-<step>-meta.txt
   ```

5. Act on its exit code:
   - **0**: the report file holds the report, one JSON line.
   - **3**: no fresh session can run here, for example because no resolver started one,
     or every model was refused. When the meta file names a saved
     prompt, take the [subagent step](#run-a-step-in-a-subagent). When it
     names none, show the user the meta file, name the step, and stop.
   - **Anything else**: show the user the meta file, name the step, and
     stop. Do not run the step again.

### Run a step in a subagent

Take this step only when `lets delegate step run` exits 3, and the meta
file names the prompt `lets` saved,
`.workspace/lets-delegate/<name>-<step>.prompt.md`. That file holds the
prompt, with any answers added.

1. Run that prompt in a subagent that starts with no context from this
   session, and may write files. It works in the repository root, on the
   branch `<name>`.
2. Read the last `step-report` block in the subagent's final message, by
   the rules `lets` uses:
   - The block opens with a line of three or more backticks followed by
     `step-report`. It closes with a line of at least as many backticks,
     and nothing else.
   - It holds one YAML mapping, whose `outcome` is `done`, `needs-input`
     or `failed`.
   - A `done` report holds `evidence`, a non-empty list of strings.
   - A `needs-input` report holds `questions`, a non-empty list of
     mappings. Each has a string `question`, and may have a string
     `recommendation`.
   - A `failed` report holds a string `reason`.
3. A final message that breaks any of these rules is a `failed` report.
   Its `reason` says what is missing or wrong, such as no `step-report`
   block, or a `done` report with no `evidence`.
4. Add `date` to a `done` report: the current time in ISO 8601 UTC, from
   `date -u +%Y-%m-%dT%H:%M:%SZ`.
5. Write the report as one JSON line, `outcome` first, to
   `.workspace/lets-go/<name>-<step>-report.json`.

## Read the report

Read `outcome` from `.workspace/lets-go/<name>-<step>-report.json`:

- **`done`**: go on to the next step. After `propose`, print propose
  review's line from [Print the skip lines](#print-the-skip-lines)
  before you run `apply`: the `Done` form, or the `lets-minimal` line. After `apply-review`, go to [End of the run](#end-of-the-run).
- **`needs-input`**: [relay its questions](#relay-the-questions).
- **`failed`**: print the lines of [End of the run](#end-of-the-run) for
  the steps so far, ending with the failed one. Name the step and the
  branch `<name>`, and say that running `lets-build` on that branch
  carries the change on. Stop. Never run a failed step again.

## Relay the questions

The answers go in `.workspace/lets-go/<name>-<step>-answers.yaml`, one
file per step.

1. If any question's exact text is already in that file, the step did
   not read its answers. Say that the step asked a settled question
   again, name the step, show the user the report, and stop.
2. Go through the questions in the report's order, as `<level>` says:
   - **At `recommend`, with a `recommendation`**: take it as the answer.
     Tell the user the question and the answer you gave. Write the answer
     as the recommendation followed by
     ` (lets-go accepted the step's recommendation; the user did not decide)`.
   - **At `recommend`, without one**: ask the user that question alone.
     Wait for the answer before the next question.
   - **At `ask`**: ask the user every question, one at a time. Show the
     `recommendation`, when there is one, as the suggested answer. Wait
     for each answer before the next question. Write the answer as the
     user gave it, with no marker, even when they took the
     recommendation: the step records it as the user's.
3. Append each pair, in order, to the answers file. It is a YAML list of
   `question` and `answer` mappings, and keeps the pairs of earlier
   rounds. Quote each value, so YAML keeps it whole:

   ```yaml
   - question: "Which schema should the change use?"
     answer: "lets-minimal (lets-go accepted the step's recommendation; the user did not decide)"
   - question: "Do you confirm the ledger?"
     answer: "yes"
   ```

4. [Run the step](#run-a-step) again with the same prompt file. Add
   `--answers-file .workspace/lets-go/<name>-<step>-answers.yaml` to
   `lets delegate step run`. Ask for the options again, and rank them
   again. Exit 3 goes to the subagent step as before.

A step's rounds go on until its report is `done` or `failed`.

## End of the run

When `apply-review` reports `done`, its *Finish the change* has marked
the pull request ready for review. You come here too when every step was
already done. Print one line per step, in order. For example:

```text
Skipped shape: #<i>'s packet is complete, last edited <date>.
Done propose: <date>. <evidence>
Skipped propose review: not in the lets-minimal route.
Done apply: <date>. <evidence>
Done apply review: <date>. <evidence>
```

`<date>` on a `Done` line is the report's `date`, and `<evidence>` is its
`evidence`, joined with `; `. Propose review has no report of its own.
When propose ran in this run on a schema with a review, its line is
`Done propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
A step done before this run prints its line from
[Print the skip lines](#print-the-skip-lines) instead. When
every step was already done, all five lines are `Skipped` lines. A
failed step prints `Failed <step>: <reason>`. Then print the pull request's URL:

```bash
gh pr view <name> --json url --jq .url
```

`lets-go` keeps no state of its own. Its files in `.workspace/lets-go/`
are scratch: without them, a new run reaches the same step.
