## MODIFIED Requirements

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run shape when *Check the issue* or *Start from an idea* sends the run to *Run the shape step*, before the walk. It SHALL run each other step when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is the name `lets go shape-name` prints for the step's input, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

#### Scenario: A step with a resolver
- **WHEN** `step instructions --for plan` lists `claude/claude-opus-5-5` and `gpt/gpt-6-luna`, and the guidance prefers `gpt`
- **THEN** `lets-go` runs `step run --for plan --name lets-go-chore-plan` with `--model gpt/gpt-6-luna --model claude/claude-opus-5-5`

#### Scenario: A run that starts at apply
- **WHEN** the first step the walk finds not done is build
- **THEN** `lets-go` writes no plan prompt and no review plan prompt, and the first `step run` is `--for build`

#### Scenario: An answers file from an interrupted run
- **WHEN** `.workspace/lets-go/lets-go-chore-plan-answers.yaml` exists with one pair before the plan step's first round
- **THEN** that round's `step run` carries `--answers-file .workspace/lets-go/lets-go-chore-plan-answers.yaml`

#### Scenario: An empty answers file
- **WHEN** `.workspace/lets-go/lets-go-chore-plan-answers.yaml` exists and is empty
- **THEN** the first round's `step run` carries no `--answers-file`

#### Scenario: A timeout
- **WHEN** `step run` exits 6
- **THEN** `lets-go` shows the user the meta file, names the step, and stops without running the step again

#### Scenario: The shape step's answers file
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` again after a run stopped, and `.workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-answers.yaml` holds two pairs
- **THEN** the shape step's first round carries `--answers-file` with that file

#### Scenario: The review plan step's name
- **WHEN** the walk reaches review plan for the change `lets-go-story` and finds it not done
- **THEN** `lets-go` writes `.workspace/lets-go/lets-go-story-review-plan-prompt.md`, and runs `step run --for review-plan --name lets-go-story-review-plan` with it

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md`, or a file in `skills/lets-go/references/`, SHALL hold each of these strings, exactly as written: they are lines `lets-go` prints, commands it runs, and names, paths and markers that its steps and other skills read. A string may wrap across lines. `## Placeholders` SHALL be in `SKILL.md` itself, as *Each placeholder in lets-go names one thing* says:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done review plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.`
- `Records disagree:`
- `Questions: <mode>, because #<i> is a <Kind>.`
- `Questions: <mode>, because you asked for it.`
- `Questions: ask, because shape has not run yet.`
- `Questions: <mode>, because your lets config sets go.questions.`
- `lets go questions`
- `issue #<i>: <title>`
- `epic #<parent>: <title>`
- `story #<story>: <title>`
- `Plan review: <verdict> for <sha>`
- `Picked #<i>: <title>, the next ready issue.`
- `docs: the discovery map from #<parent>`
- `Discovery status: in-progress`
- `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`
- `lets go shape-name --issue <i>`
- `lets go shape-name --idea`
- `--for review-plan`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --format=%as <sha>`
- `gh pr view <name> --json number,body`
- `git status --porcelain`
- `git fetch origin <name>`
- `git merge --ff-only origin/<name>`
- `git switch <name>`
- `.workspace/lets-go/<session>-prompt.md`
- `.workspace/lets-go/<session>-answers.yaml`
- `--answers-file`
- `.workspace/lets-delegate/<session>.prompt.md`
- `step-report`
- `asked a settled question again`
- `**3**: no fresh session can run here`
- `## Placeholders`
- `<shape-name>`
- `<session>`

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The skill SHALL not hold `the first ready story under`, and SHALL have no heading *Pick the first ready story*. The skill SHALL not hold `idea-<slug>` or `<slug>`, and SHALL have no heading *The shape step's name*: the `go-shape-name` capability holds the naming rule. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** a reader reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The first-ready-story pick is gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader does not find `the first ready story under`, and no heading is `Pick the first ready story`

#### Scenario: The old discovery query
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and does not find `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`

#### Scenario: The step table header changes
- **WHEN** an edit changes the step table's header from `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the edit breaks no part of this requirement, because the header is not one of the fixed lines

#### Scenario: The slug rule is gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `lets go shape-name --issue <i>` and `lets go shape-name --idea`, does not find `idea-<slug>`, `<slug>` or `Join the first five words`, and no heading is `The shape step's name`

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. An issue number here is any item key of the backlog provider. A request names an issue when, after a question mode word is taken off, it is one word and `lets backlog key -- '<word>'` returns a `key`, with each `'` in the word written as `'\''`. That key SHALL be `<i>`. When `key` is `null`, the request SHALL be words. When the command returns an `error`, `lets-go` SHALL stop as *A backlog error stops the run* says. With the GitHub backlog provider, `#149` and `149` name the issue whose key is `149`. A leading or trailing `ask` or `auto` SHALL name the question mode when the rest of the request is a number or nothing. When the rest is words on the default branch, `lets-go` SHALL ask the user whether that word names the question mode or is part of the idea, and show both readings. It SHALL ask in either mode, before *Start from an idea* runs. Only when the user says the word names the question mode SHALL `lets-go` take it off, as the question mode. Otherwise the word SHALL stay in the idea, and *Set the question mode* SHALL take the question mode from its next source. On the default branch, every other request with words SHALL be the idea, kept word for word. For an idea on the default branch, `lets-go` SHALL first run `lets go shape-name --idea` with the idea as one argument in single quotes, with each `'` in it written as `'\''`. When the command exits non-zero, `lets-go` SHALL show the user its stderr, which for an idea with no letter or digit in any script says that an idea needs at least one letter or digit, and stop. It SHALL stop before the discovery query and the title search, claiming nothing and running no step. Otherwise the `name` it prints SHALL be the idea's `<shape-name>`, and its `answers` the idea's answers file. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank, and its *Check the prerequisite* and *Confirm the packet* on each candidate, as *Only an idea or a named issue goes to the shape step* says. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When the case returns `nothing-ready`, `lets-go` SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `lets backlog find <branch>` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

#### Scenario: Neither a number nor words
- **WHEN** the user runs `lets-go` alone on the default branch, and `next` finds `#149 lets-go-chore — ...` as the first ready issue
- **THEN** `lets-go` prints `Picked #149: lets-go-chore — ..., the next ready issue.` and goes on to its blocker read with #149

#### Scenario: Nothing is ready
- **WHEN** the user runs `lets-go` alone on the default branch, and no Todo issue is unassigned, unblocked and ready
- **THEN** `lets-go` says the backlog has nothing ready, suggests `lets-shape`, and claims nothing

#### Scenario: An issue number
- **WHEN** the user runs `lets-go` for `#149`
- **THEN** `lets-go` reads issue `#149` as *Find the source of demand* does for a named issue

#### Scenario: An idea
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on the default branch
- **THEN** `lets-go` takes `add a --quiet flag to lets sync` as the idea, and searches for an existing issue as *Find the source of demand* does for described work

#### Scenario: An idea with a question mode
- **WHEN** the user runs `lets-go auto add a --quiet flag to lets sync` on the default branch, and answers that `auto` names the question mode
- **THEN** the idea is `add a --quiet flag to lets sync`, and the question mode is `auto`

#### Scenario: A question mode word that is part of the idea
- **WHEN** the user runs `lets-go ask before deleting the branch` on the default branch, and answers that `ask` is part of the idea
- **THEN** the idea is `ask before deleting the branch`, and *Set the question mode* takes the question mode from `go.questions` or the Kind

#### Scenario: A question mode with a number
- **WHEN** the user runs `lets-go ask #149`
- **THEN** the question mode is `ask`, the issue is `#149`, and `lets-go` asks no question about the word

#### Scenario: An idea with no letters or digits
- **WHEN** the user runs `lets-go ???` on the default branch
- **THEN** `lets go shape-name --idea '???'` exits 2, and `lets-go` shows `lets go: an idea needs at least one letter or digit`, and stops, claiming nothing, before the discovery query and the title search

#### Scenario: Letters in another script
- **WHEN** the user runs `lets-go ログを直す` on the default branch
- **THEN** the idea is `ログを直す`, its `<shape-name>` is `idea-ログを直す-bffc2164`, and the run goes to *Start from an idea*

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

#### Scenario: A key of another backlog provider
- **WHEN** the user runs `lets-go PROJ-12` on the default branch, and `lets backlog key PROJ-12` returns `"key": "PROJ-12"` and `"label": "PROJ-12"`
- **THEN** `lets-go` takes `PROJ-12` as `<i>` and goes on to its blocker read with `lets backlog item PROJ-12`

#### Scenario: One word that is not a key
- **WHEN** the user runs `lets-go refactor` on the default branch, and `lets backlog key refactor` returns `"key": null`
- **THEN** `lets-go` takes `refactor` as the idea, and goes to *Start from an idea*

#### Scenario: One word with an apostrophe
- **WHEN** the user runs `lets-go can't` on the default branch
- **THEN** `lets-go` runs `lets backlog key -- 'can'\''t'`, which returns `"key": null`, and takes `can't` as the idea

#### Scenario: The key command fails
- **WHEN** the user runs `lets-go 149`, and `lets backlog key 149` returns `"error": "unknown-backlog-provider"`
- **THEN** `lets-go` shows the error's `message`, claims nothing and runs no step

### Requirement: The shape step shapes an idea or an unshaped issue
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says, and for an epic the user named, as *An epic run shapes an empty epic first* and *An epic run finishes a stopped discovery before it builds* say. For an epic whose stopped Finalize *A stopped discovery resumes from its parent issue* found through another input's answers, the step SHALL run for that input, under that input's `<shape-name>`. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `lets-go` SHALL take an input's `<shape-name>` and answers file from `lets go shape-name`: the `name` and `answers` it prints for `--issue <i>` for an issue, or for `--idea` with the idea. It SHALL build no shape name itself. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. When the step ran for an epic `#<i>` whose `Input:` line names another input, `lets-go` SHALL also remove that input's answers file, the `answers` that `lets go shape-name` prints for that input: otherwise a stopped round of that input leaves answers that *A stopped discovery resumes from its parent issue* finds when the run goes back to *Check the issue*. When the step reports `done` with an `epic #<parent>` line, `lets-go` SHALL also remove the answers file of `#<parent>`, the `answers` that `lets go shape-name --issue <parent>` prints, whatever input the step ran for: a stopped round of `lets-go #<parent>` may have left answers there. The step SHALL run `lets-shape` on the idea or on `#<i>`, with the prompt *The step prompt says what to run, the question mode, and how to report* gives it. `lets-shape` SHALL pick its path as the `discovery-checkpoints` capability says: it shapes the work as one issue, to the end of its comment reads, its reply and its glossary handoff, or runs discovery when the work is too large, as *The shape step runs discovery only after a yes* says. For an idea that the title search already checked, the step SHALL run no second title search. The step SHALL create no change and no change branch, and SHALL end on the default branch with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. The packet confirmation, the question about which product an idea belongs to, and the question that moves the map for a second product SHALL reach `lets-go` with no recommendation, so `lets-go` asks the user in either mode. The first evidence line of a `done` report SHALL be `issue #<i>: <title>` for one issue. When discovery filed stories, it SHALL be `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL take the parent as `<i>`, and go on as *A shape step that files a parent goes on as an epic run* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number or an epic's number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-f1ade72f-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `lets-go` runs `lets go shape-name --idea 'fix lets-sync — quiet output'`, and takes the `name` it prints, `idea-fix-letssync-quiet-output-ef93442d`, as `<shape-name>`

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`, after the title search found no match
- **THEN** its header holds `add a --quiet flag to lets sync` and says the search ran and no open issue is the same work, and its `## What to run` section holds only ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.``

#### Scenario: The shape prompt names discovery
- **WHEN** `lets-go` writes the shape prompt
- **THEN** its report rules name discovery's evidence lines, `epic #<parent>: <title>` and `story #<story>: <title>`, and the file holds none of `lets-shape`'s discovery rules: not `Run discovery on it?`, not `Discovery status: in-progress` and not *Resume mode*

#### Scenario: An idea the search already checked
- **WHEN** the shape step runs for the idea `add a --quiet flag to lets sync`, after the title search found no match
- **THEN** the step runs no title search of its own, creates the issue, ends on the default branch with a clean tree, and its first evidence line is `issue #<i>: <title>`

#### Scenario: The packet confirmation reaches the user
- **WHEN** the shape step reports `needs-input` with the packet confirmation, at `auto`
- **THEN** the question carries no `recommendation`, and `lets-go` asks the user it

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to-f1ade72f` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so the same idea typed again starts with no answers

#### Scenario: An epic's round removes its named input's answers
- **WHEN** a run for the idea `rewrite the backlog around a plugin model` stopped with #190 at `Discovery status: in-progress`, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` holds one pair, and the user runs `lets-go #190`, whose shape step for #190 reports `done` for `epic #190`
- **THEN** `lets-go` removes `.workspace/lets-go/issue-190-shape-answers.yaml` and `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml`, so the lookup back in *Check the issue* finds no discovery, and the epic run starts

#### Scenario: An idea's round removes the epic's own answers
- **WHEN** a run for `lets-go #190` resumed #190 at `Discovery status: in-progress`, left `.workspace/lets-go/issue-190-shape-answers.yaml` holding one pair, and stopped, and the user then runs `lets-go rewrite the backlog around a plugin model`, the idea #190's `Input:` line names, whose shape step reports `done` for `epic #190`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` and `.workspace/lets-go/issue-190-shape-answers.yaml`, so the lookup back in *Check the issue* finds no discovery, and the epic run starts

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** the shape step runs under `idea-add-a-quiet-flag-to-cb62daa9-shape`, its first round carries no `--answers-file`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-answers.yaml` stays as it was

#### Scenario: Confirm the packet stops after shape
- **WHEN** the shape step reported `done` for #181 in this run, and *Confirm the packet* then returns `needs-shape` because #181 has no Kind
- **THEN** `lets-go` says to run `lets-shape` on #181, stops, and runs no second shape step

#### Scenario: An issue with no packet
- **WHEN** the user runs `lets-go` for `#180`, no branch for its change exists, and *Confirm the packet* returns `needs-shape` because #180 has no Kind
- **THEN** `lets-go` runs the shape step with `--name issue-180-shape`, and its prompt says to shape #180

#### Scenario: The shape step is done
- **WHEN** the shape step reports `done` with the first evidence line `issue #181: lets-sync-quiet — lets sync takes a --quiet flag` and the date `2026-11-05T09:30:00Z`
- **THEN** `lets-go` takes `#181` as `<i>`, reads its blockers, and confirms its packet. It prints `Done shape: 2026-11-05T09:30:00Z. issue #181: lets-sync-quiet — lets sync takes a --quiet flag`, and goes on to *Route*

#### Scenario: A done report that names no issue
- **WHEN** the shape step reports `done` and its first evidence line is `created the issue`
- **THEN** `lets-go` treats the step as `failed`, with a reason that says the shape step named no issue, and stops

#### Scenario: An idea too large for one issue
- **WHEN** the shape step sizes the idea XL
- **THEN** it ends the round with the discovery question instead of a `failed` report, and `lets-go` prints no `Failed shape:` line

#### Scenario: An issue that holds a large idea
- **WHEN** the user runs `lets-go` for `#180`, whose body is a two-page vision with no packet, and the shape step finds it holds a large idea
- **THEN** the step's report is `needs-input` with the discovery question, and on `yes` discovery runs with #180 as its input, which stays open as `lets-shape` leaves it

#### Scenario: The shape step in a subagent
- **WHEN** `step run --for shape` exits 3 and its stderr names `.workspace/lets-delegate/idea-add-a-quiet-flag-to-f1ade72f-shape.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file on the default branch, and reads its `step-report` block

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, or during Finalize. Finalize removes the parent's status line before it asks its own questions, so a stop during Finalize leaves a parent with no status line. To find an input's discovery, `lets-go` SHALL list the open parent issues with `lets-shape`'s query, `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and keep each whose `Input:` line names this input: the idea word for word for an idea, and `#<i>` or the issue's URL for an issue. When the input is an issue `#<i>` that is itself in that list, `lets-go` SHALL keep it too, whatever its `Input:` line names, as `lets-shape` does. A kept parent SHALL be this input's discovery when it says `Discovery status: in-progress`. It SHALL also be this input's discovery when it has no status line and an earlier shape round of this input left answers: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT be this input's discovery.

An epic that discovery filed from another input names that input in its `Input:` line: an idea, or an issue `#<n>` that discovery split. A stop during Finalize leaves that input's answers, not the epic's. So when the input is an issue `#<i>` kept because it is itself in the list, its `Input:` line names another input, and it has no status line, `lets-go` SHALL also look for the answers of that named input: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair, where `<shape-name>` is the `name` that `lets go shape-name` prints for that input: with `--idea` and the idea, or with `--issue <n>` for `#<n>`. When it finds them, the epic SHALL be this input's discovery, and the lookup SHALL return with it the named input, whose shape round the shape step resumes. When the epic's own answers, `.workspace/lets-go/issue-<i>-shape-answers.yaml`, also make it this input's discovery, `lets-go` SHALL take the answers file that changed last, and return the input whose answers they are: the round that stopped last is the one to resume. Otherwise the lookup SHALL return each discovery with this input. `lets-go` SHALL read no other file and run no other query for this. The answers file exists only on the machine where that round ran: on another machine, the lookup SHALL find no discovery for that epic.

For an idea, `lets-go` SHALL run this lookup before the title search of *Start from an idea*. When it finds a discovery, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, naming each parent it found, skip the title search, and run the shape step for the idea. The step resumes the discovery, or finishes its Finalize, because `lets-shape` matches the parent's `Input:` line to the idea, as the `discovery-checkpoints` capability says. When it finds none, `lets-go` SHALL run the title search. For an issue, *Start from an idea* does not run: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. For an epic with open sub-issues, `lets-go` SHALL run this lookup for `#<epic>` before the epic run starts, as *An epic run finishes a stopped discovery before it builds* says. For a `complete` issue whose `Input:` line names the issue itself, the one story an empty epic became, `lets-go` SHALL run this lookup for it before it claims the issue, as *An epic run shapes an empty epic first* says. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: An epic with answers under two inputs
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped with #190 at `Discovery status: in-progress` and left `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` holding one pair, a later run for `lets-go #190` stopped during Finalize and left `.workspace/lets-go/issue-190-shape-answers.yaml` holding the Phase 5 story table confirmed, and the user runs `lets-go #190`
- **THEN** the lookup returns #190 with #190 as its shape input, because the epic's own answers file changed last, and the shape step runs under `issue-190-shape`

#### Scenario: The same idea after a stop during Finalize
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped during Finalize, the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, asks no question, and runs the shape step, whose round finishes Finalize on that parent

#### Scenario: A finished discovery of the same idea
- **WHEN** the open epic `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` does not exist, and the user runs `lets-go rewrite the backlog around a plugin model`
- **THEN** `lets-go` does not say a discovery is in progress, and runs the title search as usual

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

#### Scenario: An idea's epic after a stop during Finalize
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/issue-190-shape-answers.yaml` does not exist, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** the lookup returns #190, with the idea `rewrite the backlog around a plugin model` as the input whose round resumes

#### Scenario: A split issue's epic after a stop during Finalize
- **WHEN** the lookup runs for `#300`, the open parent #300 has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** the lookup returns #300, with `#180` as the input whose round resumes

#### Scenario: The answers are on another machine
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, and neither `.workspace/lets-go/issue-190-shape-answers.yaml` nor `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` exists
- **THEN** the lookup finds no discovery

#### Scenario: Another idea's answers under the same name
- **WHEN** the lookup runs for `#190`, the open parent #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-8839bea8-shape-answers.yaml`, the answers of `rewrite the backlog around a plugin store`, holds one pair, and neither `.workspace/lets-go/issue-190-shape-answers.yaml` nor `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` exists
- **THEN** the lookup finds no discovery, and reads no prompt file

#### Scenario: The input is itself the parent
- **WHEN** the lookup runs for `#200`, and the open parent #200 says `Discovery status: in-progress — next phase: stories` with `Input: rewrite the backlog around a plugin model`
- **THEN** the lookup keeps #200 as this input's discovery

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue, as its key: the key the user named, the issue `next` or *Run the epic* picked, or the issue or parent a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Check the issue* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: the `name` that `lets go shape-name` prints for the step's input.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<claim>` is the unique session token returned by `lets backlog claim <i>`, kept by *Claim* for release.
- `<idea>` is the idea in the user's words.

Neither `SKILL.md` nor any reference file SHALL hold `<n>`, `<p>`, `<url>`, `<issue URL>`, `<words>`, `<project>`, `<owner>` or `<repo>`. The table's *Where the run sets it* column SHALL name the part or section that sets each placeholder, never a step number.

#### Scenario: Every placeholder has a row
- **WHEN** a reader lists each distinct text in angle brackets that starts with a letter in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders` in `SKILL.md`

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to the skill and adds no row for it
- **THEN** the edit breaks this requirement, because `<base>` has no row under `## Placeholders`

#### Scenario: A placeholder with no row, in a reference file
- **WHEN** an edit adds `<base>` to `skills/lets-go/references/glossary-preflight.md` and adds no row for it
- **THEN** the edit breaks this requirement, because the table in `SKILL.md` covers the reference files too

#### Scenario: The old names are gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`
- **THEN** the reader finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

#### Scenario: The Project and the issue
- **WHEN** `lets-go` claims #197
- **THEN** it runs `lets backlog claim 197`, and no placeholder stands for the Project

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery* and *Commit the discovery map* |
| `story-run.md` | A story run's child session: how the child takes what the story prompt gives, walks the step table, passes its steps' questions up, and ends with one step report |
| `step-prompt.md` | *Write the prompt*: the rules that fill the frame, and the frame as one fenced block that the agent copies to `.workspace/lets-go/<session>-prompt.md` and fills |
| `records.md` | *Read the records* and *Records that disagree* |
| `subagent.md` | *Run a step in a subagent* |
| `terms.md` | The glossary's entries for the terms `lets-go` uses, as *lets-go carries the glossary's entries for its own terms* says |

`SKILL.md` SHALL hold no heading of a section in this table, except the three parts. *Start from an idea*, *Run the shape step* and *Run the epic* SHALL each keep, in `SKILL.md`, its `##` heading, its row in the overview, a sentence that links its steps in its reference file, and its `Next:` line. `shape.md` SHALL hold the steps of the two shape parts, and `epic-run.md` the steps of *Run the epic*, each under a heading with the part's name. Every link to a moved section SHALL name the file that holds it. The moved text SHALL keep its words, except for heading levels, links that now cross files, and what *lets-go reads the glossary file only for a story with a glossary handoff* and *Exit 3 runs the step in a subagent* change.

#### Scenario: The moved sections are in their files
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** the reader finds *Records that disagree* and *Read the records* in `references/records.md`, *Run a step in a subagent* in `references/subagent.md`, *Write the prompt* in `references/step-prompt.md`, *Commit the discovery map* in `references/shape.md`, and *Glossary preflight* and *Import the glossary checkpoint* in `references/glossary-handoff.md`, and none of them in `SKILL.md`; no file of `lets-go` has a heading *What shape runs*

#### Scenario: A part whose steps moved
- **WHEN** a reader reads the *Run the shape step* section of `SKILL.md`
- **THEN** it links `references/shape.md#run-the-shape-step`, its last paragraph starts `Next:`, and `references/shape.md` has a heading `Run the shape step`

#### Scenario: The epic run's steps are in their file
- **WHEN** a reader reads the *Run the epic* section of `SKILL.md`
- **THEN** it links `references/epic-run.md#run-the-epic`, its last paragraph starts `Next:`, `references/epic-run.md` has a heading `Run the epic`, and `references/epic-run.md` opens with a `#` title and a line that says a run reads it only in an epic run

#### Scenario: The prompt frame is one block to copy
- **WHEN** a reader reads `references/step-prompt.md`
- **THEN** one fenced block holds `## What to run`, `## Questions` and `## The report`, and the text before it names `.workspace/lets-go/<session>-prompt.md`

#### Scenario: A section left behind
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a heading `Records that disagree`
- **THEN** the edit breaks this requirement, because that section belongs in `references/records.md`

#### Scenario: The child's part is in its file
- **WHEN** a reader lists the headings of each file of `lets-go`
- **THEN** `references/story-run.md` opens with a `#` title and a line that says a run reads it only in a story run's child session, and `SKILL.md` holds none of its headings

### Requirement: An epic run finishes a stopped discovery before it builds
When *Confirm the packet* returns `epic` for an epic with open sub-issues, on the default branch, `lets-go` SHALL run *Find the input's discovery* for `#<epic>` before the epic run starts, as *A stopped discovery resumes from its parent issue* says. That lookup keeps the epic itself when it is a parent. When the lookup finds one or more discoveries, `lets-go` SHALL say that a discovery of `#<epic>` is in progress at each `#<parent>` it found, and run the shape step for the input the lookup returned with it, whose round resumes the discovery or finishes its Finalize. That input is `#<epic>`, or the idea or issue `#<n>` that the epic's `Input:` line names when the lookup found that input's answers. When the step reports `done` with the first evidence line `epic #<epic>: <title>`, followed by a `story #<story>: <title>` line for each of the epic's stories, including stories an earlier round filed, `lets-go` SHALL go on from the blocker read in *Check the issue* with `#<epic>` as `<i>`, and start the epic run. The step prompt SHALL ask for a `story` line for each story, in the order discovery created them, so that a round that only finishes Finalize still lists the stories and *Read the report* does not fail it for naming no story. When a shape step has already run in this run, it SHALL instead say to run the `lets-shape` skill on `#<epic>`, and stop. When the lookup finds none, the epic run SHALL start. An epic whose discovery finished SHALL NOT be shaped again: it has no status line, and no answers file of an earlier round of `issue-<epic>`, or of the input its `Input:` line names, holds a pair.

#### Scenario: A stop between rounds
- **WHEN** the user runs `lets-go #300`, #300 has the open sub-issues #301 and #302, and its body says `Discovery status: in-progress — next phase: stories` with `Input: #300`
- **THEN** `lets-go` says a discovery of #300 is in progress at #300, runs the shape step for #300, and starts no epic run before the step reports

#### Scenario: A stop during Finalize
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** `lets-go` runs the shape step for #300, whose round finishes Finalize, and after its `done` report starts the epic run on #301 to #303

#### Scenario: An idea's epic stopped during Finalize
- **WHEN** an earlier run for the idea `rewrite the backlog around a plugin model` filed #190 with the open sub-issues #191 to #193 and stopped during Finalize, #190 has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-9f0acd9e-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go #190`
- **THEN** `lets-go` says a discovery of #190 is in progress at #190, runs `lets delegate step run --for shape --name idea-rewrite-the-backlog-around-a-9f0acd9e-shape` with the answers file, and its prompt names the idea, not #190. After the step's `done` report for `epic #190`, `lets-go` starts the epic run on #191 to #193

#### Scenario: A split issue's epic stopped during Finalize
- **WHEN** an earlier run for #180 filed #300 with `Input: #180` and the open sub-issues #301 and #302, and stopped during Finalize, #300 has no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go #300`
- **THEN** `lets-go` runs the shape step with `--name issue-180-shape`, and its prompt says to shape #180. After the step's `done` report for `epic #300`, `lets-go` starts the epic run on #301 and #302

#### Scenario: A finished discovery is not shaped again
- **WHEN** #300 has the open sub-issues #301 to #303, `Input: #300` and no status line, and `.workspace/lets-go/issue-300-shape-answers.yaml` does not exist
- **THEN** `lets-go` runs no shape step and starts the epic run on #301 to #303
