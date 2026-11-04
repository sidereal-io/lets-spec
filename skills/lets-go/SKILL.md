---
name: lets-go
description: Take one shaped chore from its issue to a pull request ready for review, in one run. Start claims the issue here; propose, apply and apply review each run in a fresh session, and every question a step has comes back to this conversation. Use when the user names a chore issue and wants it built end to end, or says lets-go with an issue number.
---

# Let's go

Take one shaped chore to a pull request ready for review, in one run.
*Start* claims the issue in this session. Then each step runs in a
fresh session: propose, apply, then apply review. A step never asks the
user. It ends with a report, and this session asks the user for it. Run
every command below from the repo root.

`lets-go` reuses the `lets-build` skill. It names the sections of
`lets-build` it runs, and repeats none of them.

## Start

1. Take the issue number the user gave as `<i>`. If they gave none, say
   that `lets-go` needs an issue number, and stop.
2. Find the default branch as `lets-build` does, and run
   `git branch --show-current`. If you are on another branch, say that
   running `lets-build` on it carries its change on, and that #150 adds
   resuming a run. Stop.
3. Run `lets-build`'s *Find the source of demand* for the named issue,
   then its *Confirm the packet*. A stop either section makes stands, as
   `lets-build` reports it. A packet that fails sends the user to
   `lets-shape`, as `lets-build` says.
4. In *Confirm the packet*, check the Kind as soon as you have read the
   issue's fields from the Project. If it is not Chore, say that #152
   adds Stories and Bugs to `lets-go`, say to run `lets-build` on #<i>,
   and stop. Read no parent epic.
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

6. Run `lets-build`'s *Route*, then its *Claim*. Keep the route line: the
   propose step needs it. A stop *Claim* makes stands. When its glossary
   preflight found owned edits, also run *Import the glossary
   checkpoint*.
7. *Claim* creates the change's branch, `<name>`. Switch to it if you are
   not on it, and stay on it for the whole run.
8. Print the interactivity level:

   ```text
   Interactivity: recommend, because #<i> is a Chore.
   ```

   At `recommend`, this session answers each question that has a
   recommendation, and asks the user the rest.

*Start* runs in this session. It is not a step, and has no step report.

## The steps

Run three steps, in this order: `propose`, `apply`, then `apply-review`.
`<step>` is one of these names, and `<name>` is the change's name. Each
step gets its own prompt, and runs as [Run a step](#run-a-step) says.

## Write the prompt

Write the frame below to `.workspace/lets-go/<name>-<step>-prompt.md`.
Fill in each `<...>`, and put the step's row from the table under
*What to run*. `<schema>` is the schema *Route* picked.

````text
You run one step of a lets-go run: <step>, for the change <name>.
Issue: #<i>, <issue URL>. Branch: <name>. Schema: <schema>.

## What to run

<the step's row from the table>

## Questions

The interactivity level is recommend. The lets-go session answers each
question that has a recommendation, and asks the user the rest. Never
decide a question yourself. Never ask the user in this session: nobody
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
4. Run the step with one `--model` per ranked option, best first:

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
