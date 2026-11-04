# lets-go Specification

## Purpose

Says what the `lets-go` skill does for a shaped Chore, Bug or Story, or for an idea in words: where it starts, how it shapes an idea or an unshaped issue, how it runs discovery for a large idea and picks the first ready story, what it skips and how it says so, which interactivity level it picks, how it runs each step and reads its report, how it relays a step's questions to the user, and how the run ends.

## Requirements

### Requirement: Start reuses lets-build
`lets-go` SHALL run `lets-build`'s *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run, by naming those sections. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. When *Find the source of demand* finds an open blocker, `lets-go` SHALL look for the change's branch before it stops. For that, its blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. When the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. When no such branch exists, the stop stands. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when none matches, the case's stop, to run `lets-shape`, SHALL be set aside: the shape step runs for the idea. On the default branch, when *Confirm the packet* stops with a remedy of running `lets-shape` on #<i>, that stop SHALL be set aside too: the shape step runs for #<i>. It SHALL be set aside once per run: after a shape step, the stop stands. On a change's branch, that stop SHALL stand, because the shape step runs only before any branch exists. The Epic stop SHALL stand. `lets-go` SHALL add no other check of its own to `lets-build`'s sections. The commands it adds of its own are:

- `title` beside `blockedBy` in the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go finds the first unfinished step* and *A skipped step's line carries its evidence and date*.

Start SHALL not be a step: it SHALL run no `lets delegate step` command of its own and SHALL produce no step report. The shape step it runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route* and *Claim* named as sections of `lets-build`, finds `gh issue view <i> --json createdAt`, and finds no `gh project item-edit` command

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and finds the first unfinished step there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** `lets-build`'s *Claim* finds that someone else has the issue
- **THEN** `lets-go` says who has it and stops, as `lets-build` does, and runs no step

#### Scenario: A blocked story on its own branch
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, and the branch `lets-go-story` exists on `origin`
- **THEN** `lets-go` names #149 as an open blocker, switches to `lets-go-story`, and finds the first unfinished step there

#### Scenario: A blocked story with no branch
- **WHEN** `lets-go` runs for #152 on the default branch, #149 is open, and no branch `lets-go-story` exists locally or on `origin`
- **THEN** `lets-go` says #149 blocks it, as `lets-build` does, and claims nothing

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** *Confirm the packet* finds two comments after the watermark on #180
- **THEN** `lets-go` runs the shape step for #180 instead of stopping

### Requirement: A complete packet means shape is skipped, and the skip line says when
When *Confirm the packet* passes, and no shape step ran in this run, `lets-go` SHALL print `Skipped shape: #<i>'s packet is complete, last edited <date>.` `<date>` SHALL be the day of the issue's `lastEditedAt`, which the thread query in *Confirm the packet* returns, as `YYYY-MM-DD`. When `lastEditedAt` is null, `<date>` SHALL be the day of the issue's `createdAt`, read with `gh issue view <i> --json createdAt`. When *Confirm the packet* passes after a shape step reported `done` in this run, `lets-go` SHALL print `Done shape: <date>. <evidence>` instead, with the report's `date` and its `evidence` joined with `; `. When *Confirm the packet* fails with a remedy of running `lets-shape` on #<i>, `lets-go` SHALL run the shape step, as *The shape step shapes an idea or an unshaped issue* says, and print no skip line.

#### Scenario: An edited packet
- **WHEN** issue `#149`'s body was last edited on 2026-11-04
- **THEN** `lets-go` prints `Skipped shape: #149's packet is complete, last edited 2026-11-04.`

#### Scenario: A packet never edited
- **WHEN** the issue's `lastEditedAt` is null and `gh issue view <i> --json createdAt` says it was created on 2026-11-03
- **THEN** the skip line's date is `2026-11-03`

#### Scenario: A packet with a missing line
- **WHEN** the packet lacks its one-line outcome
- **THEN** `lets-go` prints no skip line, and runs the shape step for the issue

#### Scenario: A packet the shape step wrote
- **WHEN** the shape step reported `done` in this run with the date `2026-11-05T09:30:00Z`, and *Confirm the packet* passes for the issue it named
- **THEN** `lets-go` prints `Done shape: 2026-11-05T09:30:00Z.` followed by the report's evidence, and no `Skipped shape` line

### Requirement: Propose review is reported as not in the route
When the schema is `lets-minimal`, `lets-go` SHALL print `Skipped propose review: not in the lets-minimal route.` after the propose step is done, and before the apply step. That line SHALL carry no date. When the schema is not `lets-minimal`, and propose is done, `lets-go` SHALL print a propose review line. Its evidence is `review.md says VERDICT: <verdict>, committed <date> (<sha>).` `<verdict>` SHALL be the value of the `VERDICT:` line in the change's `review.md`. That file is `openspec/changes/<name>/review.md`, or `openspec/changes/archive/<YYYY-MM-DD>-<name>/review.md` once the change is archived. `<date>` and `<sha>` SHALL come from `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`. When the propose step reported `done` in this run, the line SHALL start `Done propose review:`. When propose was done before this run, it SHALL start `Skipped propose review:`. Propose review SHALL not run as a step of its own. On `lets-standard` it runs inside the propose step, as the schema's `review` artifact. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the propose step reports `done`
- **THEN** `lets-go` prints `Skipped propose review: not in the lets-minimal route.` and goes on to apply

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the propose step reported `done` in this run, and `review.md` says `VERDICT: APPROVE_WITH_CHANGES` in commit `7d16565` of 2026-11-03
- **THEN** `lets-go` prints `Done propose review: review.md says VERDICT: APPROVE_WITH_CHANGES, committed 2026-11-03 (7d16565).`

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, propose was done before this run, and `review.md` says `VERDICT: APPROVE` in commit `7d16565` of 2026-11-03
- **THEN** `lets-go` prints `Skipped propose review: review.md says VERDICT: APPROVE, committed 2026-11-03 (7d16565).`

### Requirement: lets-go picks the interactivity level and says why
Before the first step, `lets-go` SHALL pick the interactivity level from the Kind: `recommend` for a Chore or a Bug, `ask` for a Story. It SHALL print `Interactivity: <level>, because #<i> is a <Kind>.` When the user named `ask` or `recommend` in the request that started the run, that level SHALL win. The line SHALL then read `Interactivity: <level>, because you asked for it.` Before a shape step, the Kind is not settled. The level for the shape step SHALL be the user's, when named, and `ask` otherwise, and the line SHALL read `Interactivity: ask, because shape has not run yet.` After the shape step, `lets-go` SHALL pick the level again from the packet's Kind, unless the user named one, and print its line. `lets-go` SHALL never ask the user which level to use. The level SHALL hold for the whole run and SHALL not be kept for a later run. It SHALL put the level, and what it means for the step, into every step prompt.

#### Scenario: The level line
- **WHEN** issue `#149` is a Chore and Start has passed
- **THEN** `lets-go` prints `Interactivity: recommend, because #149 is a Chore.` before it runs propose

#### Scenario: A Story
- **WHEN** issue `#152` is a Story and Start has passed
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.` before it runs propose

#### Scenario: A Bug
- **WHEN** the issue is a Bug
- **THEN** `lets-go` prints `Interactivity: recommend, because #<i> is a Bug.` with the issue's number

#### Scenario: The user names the level
- **WHEN** the user runs `lets-go` for `#152`, a Story, and says `recommend`
- **THEN** `lets-go` prints `Interactivity: recommend, because you asked for it.` and relays at `recommend`

#### Scenario: A later run
- **WHEN** an earlier run of `lets-go` for `#152` ran at `recommend` because the user said so, and the user runs `lets-go` for `#152` again without naming a level
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.`

#### Scenario: The shape step's level
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` without naming a level
- **THEN** `lets-go` prints `Interactivity: ask, because shape has not run yet.` before the shape step, and relays its questions at `ask`

#### Scenario: The level after shape
- **WHEN** the shape step wrote `#181` as a Chore, and the user named no level
- **THEN** `lets-go` prints `Interactivity: recommend, because #181 is a Chore.` before it runs propose

#### Scenario: A named level holds through shape
- **WHEN** the user runs `lets-go recommend add a --quiet flag to lets sync`, and the shape step writes a Story
- **THEN** `lets-go` prints `Interactivity: recommend, because you asked for it.` before the shape step and again before propose

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then propose, apply and apply review, in that order, starting at the first unfinished step that *lets-go finds the first unfinished step* found. For each step it SHALL write the prompt to `.workspace/lets-go/<name>-<step>-prompt.md`. `<name>` is the change's name, and `<step>` is `shape`, `propose`, `apply` or `apply-review`. For the shape step, `<name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <name>-<step> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. When `.workspace/lets-go/<name>-<step>-answers.yaml` exists before the step's first round and holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<name>-<step>-report.json` and stderr to `.workspace/lets-go/<name>-<step>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for propose` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for propose --name lets-go-chore-propose` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A run that starts at apply
- **WHEN** the first unfinished step is apply
- **THEN** `lets-go` writes no propose prompt, and the first `step run` is `--for apply`

#### Scenario: An answers file from an interrupted run
- **WHEN** `.workspace/lets-go/lets-go-chore-propose-answers.yaml` exists with one pair before the propose step's first round
- **THEN** that round's `step run` carries `--answers-file .workspace/lets-go/lets-go-chore-propose-answers.yaml`

#### Scenario: An empty answers file
- **WHEN** `.workspace/lets-go/lets-go-chore-propose-answers.yaml` exists and is empty
- **THEN** the first round's `step run` carries no `--answers-file`

#### Scenario: A timeout
- **WHEN** `step run` exits 6
- **THEN** `lets-go` shows the user the meta file, names the step, and stops without running the step again

#### Scenario: The shape step's answers file
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` again after a run stopped, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds two pairs
- **THEN** the shape step's first round carries `--answers-file` with that file

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session, and may write files. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<name>-<step>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question` and an optional string `recommendation`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<name>-<step>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for apply` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-apply.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

### Requirement: The step prompt says what to run, the level, and how to report
Each step prompt SHALL name the step, the change, the issue, the branch and the schema. For the shape step, the issue is `#<i>`, or `none yet` with the idea; the branch is the default branch; and the schema is left out, because *Route* has not run. It SHALL say what to run. For shape: `lets-shape`'s *Shape one issue*, as *The shape step shapes an idea or an unshaped issue* says. For propose: the `openspec-propose` skill for the change, for the issue, with the route line. It continues the change when it already exists, and does not offer the handoff. For apply: the `lets-build` skill on the branch. It stops when every task is ticked, and does not finish the change. For apply review: the *Finish the change* section of the `lets-build` skill. The prompt SHALL say the interactivity level, and what the `lets-go` session does with it. At `recommend`, that session answers each question that has a recommendation, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation. The step's own rules SHALL be the same at both levels. It SHALL say that the step never asks the user in its session. When the step needs a decision, it ends with a `needs-input` report that lists every open question, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger or an issue packet, SHALL carry no recommendation. The prompt SHALL say how to read an `## Answers` section. Each answer settles its question. An answer marked as accepted by `lets-go` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`. An answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`. The prompt SHALL give the report rules: write the report last, quote a line that holds `#` or `: `, and put no other `step-report` block in the message. It SHALL say what a `done` report's evidence holds: the commits made, and the pull request when the step opened or changed it; for shape, the issue first, as `issue #<n>: <title>`.

#### Scenario: The propose prompt
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-chore`, issue `#149`, route `lets-minimal`, at `recommend`
- **THEN** the file names `openspec-propose`, `lets-go-chore`, `#149`, the route line, `recommend`, `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `step-report`

#### Scenario: The propose prompt at ask
- **WHEN** `lets-go` writes the propose prompt for change `lets-go-story`, issue `#152`, at `ask`
- **THEN** the file says the level is `ask`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: The apply prompt stops short of finishing
- **WHEN** `lets-go` writes the apply prompt
- **THEN** the file says to stop when every task is ticked, and not to run *Finish the change*

#### Scenario: A confirmation
- **WHEN** a step's brainstorm needs the user to confirm the ledger
- **THEN** its `needs-input` report lists that question with no `recommendation`

#### Scenario: The shape prompt's frame
- **WHEN** `lets-go` writes the shape prompt for an idea on a repository whose default branch is `main`
- **THEN** the file says the issue is `none yet`, holds the idea, names `main` as the branch, names no schema, and keeps the `## Questions` and report rules of the other prompts

### Requirement: lets-go relays a needs-input report at the recommend level
When a report's outcome is `needs-input`, `lets-go` SHALL go through its questions in order. For a question with a `recommendation`, it SHALL take the recommendation as the answer, and tell the user the question and the answer it gave. It SHALL write that answer as the recommendation followed by ` (lets-go accepted the step's recommendation; the user did not decide)`. For a question without one, it SHALL ask the user that question alone, and wait for the answer before the next. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. That file is a YAML list of `question` and `answer` mappings, and keeps the pairs of earlier rounds. `lets-go` SHALL then run the step again with the same `--prompt-file` and `--answers-file <that file>`, through the same `step instructions`, `step run` and exit 3 rules.

#### Scenario: A mixed report
- **WHEN** the propose step reports `needs-input` with `Which schema?` recommended `lets-minimal`, then `Confirm the ledger?` with no recommendation
- **THEN** `lets-go` tells the user it answered `Which schema?` with `lets-minimal`, asks the user `Confirm the ledger?`, writes both pairs to the answers file with the first marked as accepted by `lets-go`, and runs `step run --for propose` again with `--answers-file .workspace/lets-go/lets-go-chore-propose-answers.yaml`

#### Scenario: A second round
- **WHEN** the resumed step reports `needs-input` with one new question
- **THEN** the answers file holds the earlier pairs and the new one, in order, and the step runs a third time with it

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. On a `failed` report it SHALL show the reason, name the step and the branch, say that running `lets-build` on the branch carries on, and stop. For a failed shape step there is no branch: it SHALL say to run `lets-shape` on the idea or the issue instead. It SHALL not run a failed step again.

#### Scenario: A failed apply
- **WHEN** the apply step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `apply` and the branch, says to run `lets-build` on the branch, and runs no apply review

#### Scenario: A repeated question
- **WHEN** the resumed propose step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

#### Scenario: A failed shape
- **WHEN** the shape step reports `failed`
- **THEN** `lets-go` prints `Failed shape:` with the reason, says to run `lets-shape`, names no branch, and runs no propose

### Requirement: Apply review ends the run
The apply review step SHALL run `lets-build`'s *Finish the change*: the project's finishing rules, verify, archive, and marking the pull request ready. When it reports `done`, or when *lets-go finds the first unfinished step* found every step done, `lets-go` SHALL print one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done <step>: <date>` followed by the report's evidence. Propose review prints the line *Propose review is reported as not in the route* sets. A failed step prints `Failed <step>: <reason>`. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** apply review reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, propose, propose review, apply and apply review, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the propose step ran in this run on `lets-standard`, and apply review reports `done`
- **THEN** the third line starts `Done propose review: review.md says VERDICT:`

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped propose review: not in the lets-minimal route.`
- `Skipped propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Done propose review: review.md says VERDICT: <verdict>, committed <date> (<sha>).`
- `Skipped apply: every task is ticked, last task commit <date> (<sha>).`
- `Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `issue #<n>: <title>`
- `issue-<i>`
- `idea-<slug>`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=AM --format='%h %as' -- openspec/changes/<name>/review.md`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<name>-<step>-prompt.md`
- `.workspace/lets-go/<name>-<step>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<name>-<step>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`

It SHALL not hold `#152 adds` or `#153 adds`, SHALL not say that `lets-go` takes chores only, and SHALL not say that `lets-go` needs an issue number on the default branch.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `#152 adds` or `#153 adds`

### Requirement: lets-go ships in both flows as an entry point
Both flows in `flows.json` SHALL ship `lets-go`. The routing table in `overlays/AGENTS.md` SHALL hold a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run`. Its answer SHALL be `The \`lets-go\` skill`, in that table's form. The README's usage table SHALL hold a row with the same request and the answer `\`lets-go\``, in that table's form. Neither table SHALL keep a row whose request is `Take a shaped story, bug or chore to a ready pull request in one run`. The `lets-shape` rows SHALL stay: shaping alone is still a request. The skill-interfaces test SHALL count `lets-go` as an entry point, which no schema, config or skill needs to name.

#### Scenario: The flows
- **WHEN** the skill-interfaces test reads `flows.json`
- **THEN** `standard` and `minimal` both list `lets-go` in `skills`

#### Scenario: The routing rows
- **WHEN** the skill-interfaces test reads `overlays/AGENTS.md` and `README.md`
- **THEN** each holds a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run` and whose answer names `lets-go`, and neither holds the row without the idea

### Requirement: lets-go finds the first unfinished step
After Start, on the change's branch, `lets-go` SHALL find the first unfinished step from the records Git and GitHub keep, and SHALL run the steps from there. It SHALL read the records in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Fourth, `openspec instructions apply --change <name> --json`, read as `lets-build`'s *Find where you are* reads it. No change folder, or `state` `blocked`, means propose is the first unfinished step. `ready` means apply. `all_done` means apply review. Any other `state` SHALL show the CLI's `instruction` and stop. Shape SHALL count as done when *Confirm the packet* passed. Propose review SHALL count as done when propose is done.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first unfinished step is propose, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first unfinished step is propose

#### Scenario: A ready plan
- **WHEN** the state is `ready`
- **THEN** the first unfinished step is apply, and `lets-go` prints the shape, propose and propose review skip lines before it

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`
- **THEN** the first unfinished step is apply review, and `lets-go` prints four skip lines before it

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

### Requirement: A skipped step's line carries its evidence and date
Each skipped step SHALL print one line, in step order, before the first step that runs. `<date>` SHALL be the author date of the commit named, as `YYYY-MM-DD`, from `git log`'s `%as`. `<sha>` SHALL be its short hash, from `%h`. The lines and their reads are:

- Propose: `Skipped propose: the plan is ready, tasks.md committed <date> (<sha>).`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Apply: `Skipped apply: every task is ticked, last task commit <date> (<sha>).`, from `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`.
- Apply review: `Skipped apply review: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`, from `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<date>-<name>/tasks.md` and the pull request read earlier.

The same `git log` commands SHALL date propose and apply after archive, because the old path's history holds the add and the ticks. The shape line and the propose review line are set by their own requirements.

#### Scenario: A skipped propose
- **WHEN** commit `2bbc7d0` of 2026-11-03 added `openspec/changes/lets-go-chore/tasks.md`
- **THEN** `lets-go` prints `Skipped propose: the plan is ready, tasks.md committed 2026-11-03 (2bbc7d0).`

#### Scenario: A skipped apply
- **WHEN** the last commit that modified `openspec/changes/lets-go-chore/tasks.md` is `3222c70` of 2026-11-03
- **THEN** `lets-go` prints `Skipped apply: every task is ticked, last task commit 2026-11-03 (3222c70).`

#### Scenario: A skipped apply review
- **WHEN** commit `1d253bd` of 2026-11-04 added `openspec/changes/archive/2026-11-04-lets-go-chore/tasks.md`, and pull request #167 is open, not a draft, with a `Code review` section
- **THEN** `lets-go` prints `Skipped apply review: archived 2026-11-04 (1d253bd); pull request #167 is ready for review with a Code review section.`

#### Scenario: A rebased branch
- **WHEN** the branch was rebased after the last task commit, so its committer date is today
- **THEN** the apply skip line's date is the commit's author date, not today

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

- `git status --porcelain` lists a path outside `.workspace/`;
- the local branch and `origin/<name>` have diverged;
- a change folder and an archive folder exist for the same name;
- an archive folder exists but the pull request is missing, is a draft, or has no `Code review` section;
- `openspec/changes/<name>/brainstorm.md` is committed but the branch has no open pull request;
- a `git log` read for a skipped step finds no commit.

#### Scenario: A dirty tree
- **WHEN** `git status --porcelain` lists `skills/lets-go/SKILL.md`
- **THEN** `lets-go` prints `Records disagree:`, names the path, says to commit or discard it, and runs no step

#### Scenario: A diverged branch
- **WHEN** the local branch `lets-go-chore` and `origin/lets-go-chore` each have a commit the other lacks
- **THEN** `lets-go` prints `Records disagree:`, says the branch and `origin` have diverged, and runs no step

#### Scenario: Archived, but the pull request is a draft
- **WHEN** the archive folder exists and `gh pr view` says `isDraft` is `true`
- **THEN** `lets-go` prints `Records disagree:`, says the change is archived but the pull request is a draft, and runs no step

#### Scenario: A committed brainstorm with no pull request
- **WHEN** `openspec/changes/lets-go-chore/brainstorm.md` is committed, the state is `blocked`, and `gh pr view lets-go-chore` finds no pull request
- **THEN** `lets-go` prints `Records disagree:`, says the brainstorm is committed but the branch has no pull request, and runs no step

#### Scenario: A read that finds no commit
- **WHEN** the state is `ready`, the tree is clean, and `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md` prints nothing
- **THEN** `lets-go` prints `Records disagree:`, names that command, and runs no step

#### Scenario: A new branch with no pull request
- **WHEN** the branch has no change folder and no pull request
- **THEN** `lets-go` prints no disagreement, and the first unfinished step is propose

### Requirement: A closed pull request ends the run
When the pull request's `state` is `MERGED`, `lets-go` SHALL say the change is merged and the run is finished, and stop. When its `state` is `CLOSED`, `lets-go` SHALL say the change was rejected and there is nothing to resume, and stop. Neither SHALL count as a disagreement, and neither SHALL run a step.

#### Scenario: A merged pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `MERGED`
- **THEN** `lets-go` says the change is merged, and runs no step

#### Scenario: A rejected pull request
- **WHEN** `gh pr view lets-go-chore` says `state` is `CLOSED`
- **THEN** `lets-go` says the change was rejected, and runs no step

### Requirement: lets-go runs for a Chore, a Bug or a Story
`lets-go` SHALL run on the repository's default branch, or on a change's branch. A change's branch is a branch named after the change, whose issue `lets-go` finds as *lets-go takes one issue number or an idea* says. On any other branch it SHALL say that `lets-go` runs on the default branch or on a change's branch, and stop. It SHALL run for an issue whose Kind is Chore, Bug or Story, and for an idea or an unshaped issue, which the shape step turns into one. It SHALL add no Kind check of its own: an Epic stops where `lets-build`'s *Confirm the packet* says an epic is built through its stories. For a Story with a parent, it SHALL read the parent's **Shared decisions** as *Confirm the packet* says, because *Route* needs them. A stop that `lets-build` makes, such as an unresolved glossary prerequisite, SHALL stand as `lets-build` reports it, except the open-blocker stop and the `lets-shape` stops that *Start reuses lets-build* sets aside.

#### Scenario: A change's branch
- **WHEN** the current branch is `lets-go-chore`, and issue #149's title starts with `lets-go-chore — `
- **THEN** `lets-go` runs for #149 on that branch, and claims nothing

#### Scenario: A Story
- **WHEN** *Confirm the packet* reads the issue's fields and its Kind is Story, and the issue has a parent
- **THEN** `lets-go` reads the parent's **Shared decisions**, runs *Route*, and goes on to the first step

#### Scenario: A Bug
- **WHEN** the issue's Kind is Bug and its packet has every Bug line
- **THEN** `lets-go` goes on to *Route* without reading a parent

#### Scenario: An Epic
- **WHEN** the issue's Kind is Epic
- **THEN** `lets-go` stops as `lets-build`'s *Confirm the packet* does, lists the epic's open sub-issues, and claims nothing

#### Scenario: A branch with no issue
- **WHEN** the current branch is `fix-typo`, and no open issue's title starts with `fix-typo — `
- **THEN** `lets-go` says it runs on the default branch or on a change's branch, and stops

#### Scenario: A glossary prerequisite still stops
- **WHEN** the issue's **Glossary handoff** names an owner whose pull request has not merged
- **THEN** `lets-go` stops as `lets-build`'s *Check the prerequisite* does, and runs no step

### Requirement: lets-go relays a needs-input report at the ask level
At the `ask` level, when a report's outcome is `needs-input`, `lets-go` SHALL ask the user every question, one at a time, in the report's order. It SHALL wait for each answer before the next question. For a question with a `recommendation`, it SHALL show the recommendation as the suggested answer. It SHALL write each answer as the user gave it, even when the user took the recommendation. It SHALL add no ` (lets-go accepted the step's recommendation; the user did not decide)` marker. It SHALL append every pair, in order, to `.workspace/lets-go/<name>-<step>-answers.yaml`. It SHALL then run the step again, as *lets-go relays a needs-input report at the recommend level* says.

#### Scenario: A recommended question at ask
- **WHEN** the level is `ask` and the propose step reports `needs-input` with `Which schema?` recommended `lets-minimal`
- **THEN** `lets-go` asks the user `Which schema?`, shows `lets-minimal` as the suggested answer, and writes the user's answer with no marker

#### Scenario: The user takes the recommendation at ask
- **WHEN** the level is `ask` and the user answers a recommended question with the recommendation
- **THEN** the answers file holds the recommendation as the answer, with no marker, so the step records it as `User`

#### Scenario: A confirmation at ask
- **WHEN** the level is `ask` and the report holds `Do you confirm the ledger?` with no recommendation
- **THEN** `lets-go` asks the user that question alone, as it does at `recommend`

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words. A request names an issue when it holds `#<n>` or is a bare number. A leading or trailing `ask` or `recommend` names the level and SHALL not count as part of the idea. On the default branch, every other request SHALL be the idea, kept word for word. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL say that it needs an issue number or an idea, and stop. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `gh issue list --state open --search "<branch> in:title" --json number,title` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as `lets-build`'s *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work. It SHALL name that section rather than restate it.

#### Scenario: Neither a number nor words
- **WHEN** the user runs `lets-go` alone on the default branch
- **THEN** `lets-go` says it needs an issue number or an idea, and claims nothing

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as `lets-build`'s *Find the source of demand* does for a named issue

#### Scenario: An idea
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on the default branch
- **THEN** `lets-go` takes `add a --quiet flag to lets sync` as the idea, and searches for an existing issue as *Find the source of demand* does for described work

#### Scenario: An idea with a level
- **WHEN** the user runs `lets-go recommend add a --quiet flag to lets sync` on the default branch
- **THEN** the idea is `add a --quiet flag to lets sync`, and the level is `recommend`

#### Scenario: No issue number on a change's branch
- **WHEN** the user runs `lets-go` with no issue number on the branch `lets-go-chore`, and one open issue's title starts with `lets-go-chore — `
- **THEN** `lets-go` takes that issue as `<i>`

#### Scenario: Two issues match the branch
- **WHEN** two open issues have titles that start with `lets-go-chore — `
- **THEN** `lets-go` says it needs the issue number, and stops

#### Scenario: The number does not match the branch
- **WHEN** the user runs `lets-go` for `#149` on the branch `step-strategy`, and #149's title does not start with `step-strategy — `
- **THEN** `lets-go` says the issue and the branch do not match, and stops

#### Scenario: Words on a change's branch
- **WHEN** the user runs `lets-go fix the typo in the README` on the branch `lets-go-chore`
- **THEN** `lets-go` says an idea needs the default branch, runs no step, and stops

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* stops on the default branch with a remedy of running `lets-shape` on #<i>. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a stop that *Confirm the packet* makes SHALL stand. `<name>` for the shape step SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The shape prompt SHALL say to run `lets-shape`'s *Shape one issue* to its end, including its second comment fetch, its reply, and its glossary handoff. For an idea, it SHALL give the idea word for word. It SHALL say that Start has searched and the user confirmed no open issue is the same work, so the step skips the search and creates the issue. For an existing issue, it SHALL name #<i> and say to shape it. It SHALL say to create no change and no change branch, and to end on the default branch with a clean tree; a glossary holding branch that `lets-shape` makes is allowed. It SHALL say that the packet confirmation is a confirmation question, with no recommendation. It SHALL say that the first evidence line of a `done` report is `issue #<n>: <title>`. It SHALL say that an idea too large for one issue, Size L or XL, ends the step with a `failed` report that says so and names `lets-shape` discovery. When the step reports `done`, `lets-go` SHALL read `<i>` from that first evidence line. A `done` report whose first evidence line is not in that form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `<name>` is `idea-fix-letssync-quiet-output`: the dash alone is dropped, and four words are all there are

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`
- **THEN** the file names `lets-shape`, holds `add a --quiet flag to lets sync`, says the search has run and to create the issue, says to run *Shape one issue* to its end and finish on the default branch with a clean tree, and says the first evidence line is `issue #<n>: <title>`

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` before it writes the prompt, and the first round carries no `--answers-file`

#### Scenario: Confirm the packet stops after shape
- **WHEN** the shape step reported `done` for #181 in this run, and *Confirm the packet* then finds no Kind for #181
- **THEN** `lets-go` stops as `lets-build` does, says to run `lets-shape` on #181, and runs no second shape step

#### Scenario: An issue with no packet
- **WHEN** the user runs `lets-go` for `#180`, and *Confirm the packet* finds no Kind for it
- **THEN** `lets-go` runs the shape step with `--name issue-180-shape`, and its prompt says to shape #180

#### Scenario: The shape step is done
- **WHEN** the shape step reports `done` with the first evidence line `issue #181: lets-sync-quiet — lets sync takes a --quiet flag` and the date `2026-11-05T09:30:00Z`
- **THEN** `lets-go` takes `#181` as `<i>`, reads its blockers, and confirms its packet. It prints `Done shape: 2026-11-05T09:30:00Z. issue #181: lets-sync-quiet — lets sync takes a --quiet flag`, and goes on to *Route*

#### Scenario: A done report that names no issue
- **WHEN** the shape step reports `done` and its first evidence line is `created the issue`
- **THEN** `lets-go` treats the step as `failed`, with a reason that says the shape step named no issue, and stops

#### Scenario: An idea too large for one issue
- **WHEN** the shape step reports `failed` with the reason `the idea is Size XL: too large for one issue; run lets-shape discovery on it`
- **THEN** `lets-go` prints `Failed shape:` with that reason, says to run `lets-shape` on the idea, names no branch, and claims nothing

#### Scenario: The shape step in a subagent
- **WHEN** `step run --for shape` exits 3 and its stderr names `.workspace/lets-delegate/idea-add-a-quiet-flag-to-shape.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file on the default branch, and reads its `step-report` block
