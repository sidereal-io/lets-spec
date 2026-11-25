<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Check the issue* SHALL be the only part that looks for the branch: *Claim* SHALL not look again, and SHALL have no `branch-exists` result. When a local branch with the change's name appears after *Check the issue* looked, creating it fails, and *Claim* SHALL release the claim and return `branch-failed`. A branch that appears only on `origin` does not make it fail: the plan step's first push is rejected, and that step fails. *Claim* claims the issue with `lets backlog claim <i>`, and releases it with `lets backlog release <i>`. It runs no `gh` command on the backlog. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. In an epic run it SHALL instead check the branch out in the story's own worktree, and stay on the default branch, as *An epic run gives each story run a worktree of its own* says. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `lets backlog item <i>`, whose `title` and `blockedBy` it uses, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. In an epic run, for the story the epic run picked, *An epic run stacks a story on its met blocker* decides instead. The first case of *Find the source of demand*, for an issue the run already has, SHALL make no blocker decision of its own, because the blocker read has decided. That case SHALL cover an issue the user named, and an issue the run picked or shaped. Its heading SHALL not say the user named it: whether the user named it matters only to the shape step. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, in either mode, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL go on as an epic run on that parent, as *A shape step that files a parent goes on as an epic run* says. It SHALL not run that third case again for the report's stories. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL shape the epic when it is empty, as *An epic run shapes an empty epic first* says; stop when it is finished, as *A finished epic stops the run* says; shape it when its discovery stopped partway, as *An epic run finishes a stopped discovery before it builds* says; and otherwise start an epic run, as *An epic run starts on an epic with open stories* says. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go questions`, run once when it reads the request, as *lets-go picks the question mode and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the parent query of *A stopped discovery resumes from its parent issue*, and its read of the answers and prompt files, run for an idea; for an issue `#<i>` when the discovery maps have uncommitted edits before the shape step, as *lets-go commits the discovery map on the story's branch* says; for an epic with open sub-issues, as *An epic run finishes a stopped discovery before it builds* says; and for a `complete` issue whose `Input:` line names the issue itself, as *An epic run shapes an empty epic first* says;
- in an epic run only, the reads of *An epic run picks each story as next picks it*, the worktree commands and `lets sync` of *An epic run gives each story run a worktree of its own* and *An epic run reuses a story's clean worktree*, and the fetches and ancestry checks of *An epic run stacks a story on its met blocker*;
- the `git status --porcelain -uall -- openspec/discovery.md openspec/discovery` before the shape step and after *Claim*, and the commit of the discovery maps it lists, that *lets-go commits the discovery map on the story's branch* says. In an epic run, these include the copy into the story's worktree and the restore of the epic run's checkout that *An epic run commits the discovery map on the first story it claims* says.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. The reader also finds `gh issue view <i> --json createdAt`, `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `lets backlog claim <i>`, no `gh project` and no `gh api graphql`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` leaves #149 out, runs `lets backlog ready --exclude 149`, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and walks the step table there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** the user named the issue, and *Claim* returns `taken` because someone else has it
- **THEN** `lets-go` says who has it and stops, and runs no step

#### Scenario: A blocked story on its own branch
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, and the branch `lets-go-story` exists on `origin`
- **THEN** `lets-go` names #149 as an open blocker, switches to `lets-go-story`, and walks the step table there

#### Scenario: A blocked story with no branch
- **WHEN** `lets-go` runs for #152 on the default branch, #149 is open, and no branch `lets-go-story` exists locally or on `origin`
- **THEN** `lets-go` says #149 blocks it, and claims nothing

#### Scenario: A stacked story with an unresolved prerequisite
- **WHEN** `lets-go` runs for #152, which #149 blocks and #149 is open, the branch `lets-go-story` exists on `origin`, and #152's **Glossary handoff** names #150 as the owner of its definitions, and #150's pull request has not merged
- **THEN** `lets-go` names #149 as an open blocker, reports that #150 owns the definitions and has not merged, and stops, and runs no step

#### Scenario: The blocker rule comes before the call
- **WHEN** a reader reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds `lets backlog item <i>` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** the user named #180, no branch for its change exists, and *Confirm the packet* returns `needs-shape` because it finds two comments after the watermark
- **THEN** `lets-go` runs the shape step for #180

#### Scenario: The pick names next
- **WHEN** the shape step reports an epic and three stories
- **THEN** `lets-go` goes on from the blocker read in *Check the issue* with the epic as `<i>`, and does not run its own `next` case for the three stories

#### Scenario: A branch made after the check
- **WHEN** *Check the issue* found no branch `lets-go-chore` for #149, and someone creates a local branch `lets-go-chore` before *Claim* creates it
- **THEN** *Claim* fails to create the branch, removes its assignment, sets #149's Status back to Todo and returns `branch-failed`, and `lets-go` shows the error and stops

#### Scenario: An epic run checks a started story out in a worktree
- **WHEN** an epic run on #278 picks #280, whose branch `epic-run-stacks` is on `origin` and is not checked out anywhere
- **THEN** `lets-go` does not run *Claim* or `git switch`, runs `git fetch origin epic-run-stacks`, then `git worktree add .workspace/lets-go/worktrees/epic-run-stacks epic-run-stacks`, and the epic run's checkout stays on the default branch

### Requirement: lets-go picks the question mode and says why
In *Read the settings*, before it asks GitHub for anything, `lets-go` SHALL run `lets go questions` from the repo root, once per run. When the command exits non-zero, `lets-go` SHALL show the user its stderr and stop. It SHALL then claim nothing and run no step. Otherwise it SHALL keep the `questions` value the command printed for the whole run. Each time it picks the question mode, it SHALL take the first of these that is set. First, the question mode the user named in the request. Then the kept `questions` value, when it is not `null`. Then the Kind's default: `auto` for a Chore or a Bug, and `ask` for a Story or any other Kind, because *Confirm the packet* reads any other Kind as a Story. It SHALL print the line for the source it used. For the request's question mode: `Questions: <mode>, because you asked for it.` For the config's: `Questions: <mode>, because your lets config sets go.questions.` For the Kind's: `Questions: <mode>, because #<i> is a <Kind>.` Before a shape step, the Kind is not settled. The question mode for the shape step SHALL be the request's, when named; else the config's, when set; else `ask`. In that last case the line SHALL read `Questions: ask, because shape has not run yet.` After the shape step, `lets-go` SHALL pick the question mode again, in the same order, and print its line. *Set the question mode* SHALL hold this rule, and *Run the shape step* SHALL link to it, not write it again. `lets-go` SHALL never ask the user which question mode to use. The question mode SHALL hold for the whole run and SHALL not be kept for a later run. It SHALL put the question mode, and what it means for the step, into every step prompt.

#### Scenario: The question mode line
- **WHEN** issue `#149` is a Chore and Start has passed
- **THEN** `lets-go` prints `Questions: auto, because #149 is a Chore.` before it runs plan

#### Scenario: A Story
- **WHEN** issue `#152` is a Story and Start has passed
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.` before it runs plan

#### Scenario: A Bug
- **WHEN** the issue is a Bug
- **THEN** `lets-go` prints `Questions: auto, because #<i> is a Bug.` with the issue's number

#### Scenario: The user names the question mode
- **WHEN** the user runs `lets-go` for `#152`, a Story, and says `auto`
- **THEN** `lets-go` prints `Questions: auto, because you asked for it.` and relays at `auto`

#### Scenario: A later run
- **WHEN** an earlier run of `lets-go` for `#152` ran at `auto` because the user said so, and the user runs `lets-go` for `#152` again without naming a question mode
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.`

#### Scenario: The shape step's question mode
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` without naming a question mode
- **THEN** `lets-go` prints `Questions: ask, because shape has not run yet.` before the shape step, and relays its questions at `ask`

#### Scenario: The question mode after shape
- **WHEN** the shape step wrote `#181` as a Chore, and the user named no question mode
- **THEN** `lets-go` prints `Questions: auto, because #181 is a Chore.` before it runs plan

#### Scenario: A named question mode holds through shape
- **WHEN** the user runs `lets-go auto add a --quiet flag to lets sync`, and the shape step writes a Story
- **THEN** `lets-go` prints `Questions: auto, because you asked for it.` before the shape step and again before plan

#### Scenario: The config sets the question mode
- **WHEN** the `lets` config holds `go.questions: auto`, issue `#152` is a Story, the user named no question mode, and Start has passed
- **THEN** `lets-go` prints `Questions: auto, because your lets config sets go.questions.` before it runs plan, and relays at `auto`

#### Scenario: The request's question mode beats the config's
- **WHEN** the `lets` config holds `go.questions: auto`, and the user runs `lets-go` for `#152`, a Story, and says `ask`
- **THEN** `lets-go` prints `Questions: ask, because you asked for it.`

#### Scenario: The config's question mode before shape
- **WHEN** the `lets` config holds `go.questions: auto`, and the user runs `lets-go add a --quiet flag to lets sync` without naming a question mode
- **THEN** `lets-go` prints `Questions: auto, because your lets config sets go.questions.` before the shape step, and again before plan

#### Scenario: The config holds no question mode
- **WHEN** `lets go questions` prints `{"questions":null}`, issue `#152` is a Story, and the user named no question mode
- **THEN** `lets-go` prints `Questions: ask, because #152 is a Story.`

#### Scenario: lets go questions fails
- **WHEN** the `lets` config holds `go.questions: loud`, and the user runs `lets-go` for `#152`
- **THEN** `lets-go` shows the user the command's stderr, which names `go.questions`, claims nothing, and runs no step

#### Scenario: Another Kind
- **WHEN** issue `#160` has the Kind Spike on the Project, its packet has every Story line, and the user named no question mode and the config sets none
- **THEN** `lets-go` prints `Questions: ask, because #160 is a Spike.`

#### Scenario: The rule is written once
- **WHEN** a reader reads *Run the shape step* in `lets-go`
- **THEN** the reader finds a link to `#set-the-question-mode`, and not the line `Questions: <mode>, because your lets config sets go.questions.`

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run shape when *Check the issue* or *Start from an idea* sends the run to *Run the shape step*, before the walk. It SHALL run each other step when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

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
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` again after a run stopped, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds two pairs
- **THEN** the shape step's first round carries `--answers-file` with that file

#### Scenario: The review plan step's name
- **WHEN** the walk reaches review plan for the change `lets-go-story` and finds it not done
- **THEN** `lets-go` writes `.workspace/lets-go/lets-go-story-review-plan-prompt.md`, and runs `step run --for review-plan --name lets-go-story-review-plan` with it

### Requirement: Exit 3 runs the step in a subagent
When `step run` exits 3, `lets-go` SHALL run the step in a subagent. The subagent SHALL start with no context from the `lets-go` session. It SHALL follow the saved prompt, work only in this repository, on the branch `<name>` or, for shape, on the default branch, and make only the changes that the step calls for. Its prompt SHALL be the file `lets` saved, `.workspace/lets-delegate/<session>.prompt.md`. `lets-go` SHALL read the last `step-report` block from the subagent's final message by the rules `lets` uses. The block opens with three or more backticks and `step-report`. It closes with at least as many backticks alone on a line. It holds one YAML mapping whose `outcome` is `done`, `needs-input` or `failed`. A `done` report holds `evidence`, a non-empty list of strings. A `needs-input` report holds `questions`, a non-empty list of mappings, each with a string `question`, an optional string `recommendation` and an optional boolean `ask`, by the rule `lets` uses: `ask: true` is kept, `ask: false` is dropped, and any other value breaks the report, which names `questions[<i>].ask`. A `failed` report holds a string `reason`. A final message that breaks any of these rules SHALL count as a `failed` report whose reason says what is missing or wrong. For a `done` report `lets-go` SHALL stamp the date itself, as the current time in ISO 8601 UTC. It SHALL write the report it read to `.workspace/lets-go/<session>-report.json`.

#### Scenario: The subagent step
- **WHEN** `step run --for build` exits 3 and its stderr names `.workspace/lets-delegate/lets-go-chore-build.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file, and reads the `step-report` block at the end of its final message

#### Scenario: What the subagent may change
- **WHEN** a reader reads *Run a step in a subagent*
- **THEN** it says that the subagent follows the saved prompt, works only in this repository on the branch `<name>`, and makes only the changes that the step calls for, and it does not say `may write files`

#### Scenario: A subagent with no block
- **WHEN** the subagent's final message holds no `step-report` block
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `step-report`, and stops

#### Scenario: A done report with no evidence
- **WHEN** the subagent's block holds `outcome: done` and no `evidence`
- **THEN** `lets-go` treats the step as `failed`, with a reason that names `evidence`, and stops

#### Scenario: A subagent's marked question
- **WHEN** the subagent's block holds `outcome: needs-input` and one question with `ask: true`
- **THEN** `.workspace/lets-go/<session>-report.json` holds that question with `"ask":true`

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. At `auto`, from a step's sixth `needs-input` report in a run, the user answers every question of that step, as *lets-go relays a needs-input report in auto mode* says. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. *Read the report* SHALL handle a failed shape step before any other failed step. For a failed shape step there is no branch: `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch and print no pull request URL. On a `failed` report from any other step it SHALL show the reason, name the step and the branch, and stop. It SHALL say that running `lets-go` again on the branch carries on from the first unfinished step. It SHALL print the pull request's URL only when the branch has a pull request. When it has none, it SHALL print no URL, and SHALL say that the branch has no pull request yet. It SHALL not run a failed step again in the same run.

#### Scenario: A failed apply
- **WHEN** the build step reports `failed` with reason `tests fail on main`
- **THEN** `lets-go` shows `tests fail on main`, names `build` and the branch, says to run `lets-go` again on the branch, and runs no review build

#### Scenario: A repeated question
- **WHEN** the resumed plan step asks `Which schema?` again, and that question is in the answers file
- **THEN** `lets-go` stops and says the step asked a settled question again

#### Scenario: A failed shape
- **WHEN** the shape step reports `failed`
- **THEN** `lets-go` prints `Failed shape:` with the reason, says to run `lets-shape`, names no branch, prints no pull request URL, and runs no plan

#### Scenario: A failed plan with no pull request
- **WHEN** the plan step reports `failed` on the branch `lets-go-chore` before its brainstorm opened a pull request, and `gh pr view lets-go-chore` finds none
- **THEN** `lets-go` names `plan` and `lets-go-chore`, says the branch has no pull request yet, and prints no URL

#### Scenario: The shape case comes first
- **WHEN** a reader reads *Read the report* in `skills/lets-go/SKILL.md`
- **THEN** the case for a failed shape step comes before the case for any other failed step

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
- `issue-<i>`
- `idea-<slug>`
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

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The skill SHALL not hold `the first ready story under`, and SHALL have no heading *Pick the first ready story*. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

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

### Requirement: lets-go ships in both flows as an entry point
Both flows in `flows.json` SHALL ship `lets-go` and `lets-plan`. The routing table in `overlays/AGENTS.md` SHALL hold a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run`, and a row whose request is `Start the next story, or move the current branch's change on`. Each row's answer SHALL be `The \`lets-go\` skill`, in that table's form. The README's usage table SHALL hold a row with the first request, and a row whose request is `Start the next story, or carry on the change on your current branch`, each with the answer `\`lets-go\``, in that table's form. Neither table SHALL keep a row whose request is `Take a shaped story, bug or chore to a ready pull request in one run`, and neither SHALL point a row at `lets-build`. The `lets-shape` rows SHALL stay: shaping alone is still a request. The Node skills check, `tests/contracts/skills.test.ts`, SHALL count `lets-go` as an entry point, which no schema, config or skill needs to name. The same check SHALL fail when a flow does not ship a skill that the routing table in `overlays/AGENTS.md` or a file of `lets-go` names, and SHALL name `flows.json` and the skill. A skill that a schema names is exempt in a flow that ships none of the schemas that name it: `minimal` ships only `lets-minimal`, so it may leave out `lets-review-plan`, which only `lets-standard` names. The check SHALL read the skills from those texts, not from a list typed into the test.

#### Scenario: The flows
- **WHEN** a reader reads `flows.json`
- **THEN** `standard` and `minimal` both list `lets-go` and `lets-plan` in `skills`

#### Scenario: A flow drops a skill that lets-go runs
- **WHEN** the Node skills check reads a small project written for the test, whose `flows.json` leaves `lets-plan` out of a flow, and whose `lets-go` names the `lets-plan` skill
- **THEN** the check fails, and its output names `flows.json` and `lets-plan`

#### Scenario: A flow leaves out a skill that only another flow's schema runs
- **WHEN** the Node skills check reads this repository, whose `minimal` flow ships `lets-minimal` and leaves out `lets-review-plan`, which `lets-go` and `schemas/lets-standard/schema.yaml` name
- **THEN** the check passes

#### Scenario: The routing rows
- **WHEN** a reader reads `overlays/AGENTS.md` and `README.md`
- **THEN** each holds a row whose request is `Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run` and whose answer names `lets-go`. Each holds its next-story row with the answer `lets-go`. Neither holds the row without the idea, or a row that names `lets-build`

### Requirement: lets-go walks the step table
After *Set the question mode*, on the change's branch, `lets-go` SHALL read the records Git and GitHub keep, in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Then `lets-go` SHALL walk the step table from the top: plan, review plan, build, review build. The step table SHALL have no row for shape: shape runs before the walk, in *Run the shape step*, and *Check the issue* prints its `Skipped shape` or `Done shape` line. When the walk reaches a row, it SHALL read whether that step is done. Each row's done test SHALL be written once, in the walk, as an ordered list: the first item that matches decides. The step table SHALL not restate it. The plan row and the build row each read the change state when the walk reaches them: `openspec instructions apply --change <name> --json`, run when `openspec/changes/<name>/` exists and there is no archive folder. Plan is done when the `state` is `ready` or `all_done`, or the archive folder exists. Build is done when the `state` is `all_done`, or the archive folder exists. The build row SHALL read the state again, even when the plan row read it, because a review plan round can add a task. Any `state` other than `blocked`, `ready` or `all_done` SHALL show the CLI's `instruction` and stop. Review plan is done as *Review plan runs as a step, or is not in the route* says. Review build is done when the archive folder exists. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL check it as *A done report is checked against its record* says, and go on to the next row only when the check passes. `lets-go` SHALL read a row's record when it reaches the row, not before, because a step run in this round changes the records the next row reads.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first step the walk runs is plan, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first step the walk runs is plan

#### Scenario: A ready plan
- **WHEN** the state is `ready`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, and runs build after review plan reports `done`

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`, and the pull request's **Plan review** section covers the plan
- **THEN** `lets-go` prints four skip lines, then runs review build

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

#### Scenario: A built change whose review is missing
- **WHEN** the state is `all_done`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints the shape and plan skip lines, runs review plan, prints `Skipped build: every task is ticked, last task commit <date> (<sha>).` with the last task commit, and runs review build

#### Scenario: A review round adds a task
- **WHEN** the plan row read `all_done`, the review plan step ran in this run, and its `REVISE` round added an unticked task to `tasks.md` before its `APPROVE`
- **THEN** the build row reads the state again, finds `ready`, and runs build instead of printing `Skipped build:`

#### Scenario: The step table has no done column
- **WHEN** a reader reads the step table of `lets-go`
- **THEN** its header has no *Done when* column

### Requirement: Placeholders in lets-go render as written
Every placeholder in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`, a name in angle brackets such as `<i>`, SHALL sit inside a fenced code block or an inline code span. A placeholder that follows `#`, such as `#<i>`, SHALL have the `#` inside the same code span. So GitHub shows each placeholder as written: it SHALL not read `<i>` or `<p>` as an HTML tag, drop the placeholder, or set the text after it in italics.

#### Scenario: No placeholder outside code
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`, and removes every fenced code block and every inline code span
- **THEN** no text in angle brackets that starts with a letter is left

#### Scenario: A fence inside a longer fence
- **WHEN** a reader reads the prompt frame, a fence of four backticks that holds fences of three
- **THEN** the whole frame is code, the text after the inner fences close included, up to the four-backtick line that closes the frame, so a placeholder there renders as written

#### Scenario: A stop that names the issue
- **WHEN** `lets-go` says to run `lets-shape` on the issue
- **THEN** the skill writes the line as ``Say to run the `lets-shape` skill on `#<i>`, and stop.``

#### Scenario: A placeholder outside code in a reference file
- **WHEN** an edit makes `skills/lets-go/references/records.md` hold `pull request #<pr>` outside a code span
- **THEN** the edit breaks this requirement, because Markdown would hide `<pr>`

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<i>` is the run's issue, as its key: the key the user named, the issue `next` or *Run the epic* picked, or the issue or parent a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Check the issue* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
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

### Requirement: Each numbered list in lets-go starts at 1 under its heading
In `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md`, the first numbered item after each heading, outside fenced code blocks, SHALL be numbered `1.`. A list SHALL not carry on its numbers from the list under an earlier heading. *Check the prerequisite* SHALL number its steps 1 to 4, and *Check the checkpoint* SHALL number its steps from 1. Where one of these sections sends the agent to the other, it SHALL name the other section and link to it, and SHALL not refer to it by step number.

#### Scenario: The checkpoint steps start at 1
- **WHEN** a reader reads `lets-go`
- **THEN** the first numbered item after `#### Check the checkpoint` is `1.`

#### Scenario: A list that carries on across a heading
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold `### Steps` followed by `5. Read the base.`
- **THEN** the edit breaks this requirement, because the first numbered item under `### Steps` is not `1.`

#### Scenario: A number inside a code block
- **WHEN** a heading is followed by a fenced code block whose first line is `5. not a step`, and then by `1. Read the base.`
- **THEN** the section meets this requirement, because the line in the code block is no numbered item

### Requirement: The checkpoint names the prerequisite check it repeats
*Check the checkpoint* SHALL end by saying that, when the owner of the glossary definitions or the proposed base changed since *Find the source of demand* ran *Check the prerequisite*, the agent runs [Check the prerequisite](#check-the-prerequisite) again, before *Claim* claims the issue. It SHALL name that section and link to it. It SHALL not say `repeat steps 1 to 3`, and SHALL not say to go on with the packet, blocker and routing checks, which *Start* ran before *Claim*. When that second run finds an unresolved prerequisite, `lets-go` SHALL report it and stop, claiming nothing, whether the user named the issue or `next` picked it.

#### Scenario: The rerun is named
- **WHEN** a reader reads *Check the checkpoint* in `lets-go`
- **THEN** the reader finds a link to `#check-the-prerequisite` there, and no file of `lets-go` says `repeat steps 1 to 3` or `Go on with the normal packet, blocker and routing checks`

#### Scenario: The owner changed after next picked the story
- **WHEN** `next` picked #152, *Check the checkpoint* runs inside *Claim* step 2, and #152's glossary owner has changed to #150, whose pull request has not merged
- **THEN** `lets-go` runs *Check the prerequisite* again, reports that #150 owns the definitions and has not merged, and stops without assigning #152 or creating a branch

### Requirement: A failed checkpoint check stops before the claim and repairs nothing
Each check in *Check the checkpoint* that fails SHALL make it return `checkpoint-failed`, with what it found. *Claim* SHALL then return `checkpoint-failed` before it assigns the issue or creates a branch, and *Enter the branch* SHALL report what was found and stop. The run SHALL repair nothing: it SHALL not recover a missing commit, resolve a patch, drop or rewrite a commit, or change the working tree. The checks that can fail are:

- a checkpoint commit or the recorded head is missing, or exists only in a local checkout;
- the range from the base to the head holds a merge, a commit that is not recorded, or a commit that touches a path other than the recorded glossary paths;
- the context the commits need is not on the proposed base;
- the owned paths do not match the shaping baseline;
- the rehearsal finds a partial or conflicting patch.

An edit that the rehearsal finds already present on the base SHALL not be a failure: the import skips it. *Check the checkpoint* SHALL not say `Resolve a partial or conflicting patch` or `do not claim until it is recovered`.

#### Scenario: A missing checkpoint
- **WHEN** the **Glossary handoff** of #152 records a checkpoint commit that `git cat-file -e` cannot find after the recorded branch is fetched
- **THEN** `lets-go` reports the missing commit, and stops without assigning #152 or creating a branch

#### Scenario: A conflicting patch
- **WHEN** the rehearsal in `.workspace/` finds that a checkpoint commit conflicts with `openspec/glossary.md` on the proposed base
- **THEN** `lets-go` reports the conflict, and stops without assigning the issue, creating a branch or editing the glossary

#### Scenario: An edit already present
- **WHEN** the rehearsal finds that the base already holds one of two checkpoint commits, and the other applies cleanly
- **THEN** `lets-go` goes on to claim the issue, and the import skips the commit already present

#### Scenario: The wording that repairs is gone
- **WHEN** a reader reads `lets-go`
- **THEN** no file of `lets-go` says `Resolve a partial or conflicting patch` or `do not claim until it is recovered`, and *Check the checkpoint* returns `checkpoint-failed` where a check fails, with no word `stop`

### Requirement: lets-go opens with an overview of its parts
`skills/lets-go/SKILL.md` SHALL describe a run as named parts. A part is one named piece of a run, as `openspec/glossary.md` defines it. The parts SHALL be these eleven, in run order:

1. *Read the settings*
2. *Read the request*
3. *Start from an idea*
4. *Check the issue*
5. *Run the shape step*
6. *Run the epic*
7. *Route*
8. *Enter the branch*
9. *Set the question mode*
10. *Walk the step table*
11. *End of the run*

 *Start from an idea*, *Run the shape step* and *Run the epic* run only when the request or the packet needs them. *Run the epic* runs only in an epic run. Each part SHALL be a `##` heading of `SKILL.md`, in that order. `SKILL.md` SHALL hold an overview table right after its opening paragraphs, and before `## Placeholders`. The table SHALL have one row per part, in the same order. Each row SHALL name the part and link to its heading. It SHALL say what the part does, and whether it runs in the `lets-go` session or a fresh one. It SHALL say what comes next, and when the part stops. The skill SHALL hold no `## Start` heading, and SHALL not name *Start* anywhere. Another requirement of this spec may still say *Start*. There it means the parts from *Read the settings* to *Set the question mode*, which run before the walk. *Start*'s blocker read is the blocker read in *Check the issue*.

#### Scenario: The overview lists every part
- **WHEN** a reader reads `skills/lets-go/SKILL.md`
- **THEN** the reader finds a table before `## Placeholders` whose rows name the eleven parts, each linked to its heading, in run order

#### Scenario: The parts are headings in run order
- **WHEN** a reader lists the `##` headings of `skills/lets-go/SKILL.md`
- **THEN** each of the eleven parts is one of them, in the order the overview lists them, none is `## Start`, and no file of `lets-go` says `*Start*`

#### Scenario: A part missing from the overview
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold a `## Route` heading and an overview table with no row for *Route*
- **THEN** the edit breaks this requirement, because the overview does not name every part

### Requirement: An entry table says where the run goes after the request
*Read the request* SHALL hold a table that decides where the run goes, from the branch the run started on and the request. Its rows SHALL be the default branch and another branch. Its columns SHALL be a number, an idea and nothing. Each of the six cells SHALL name the part the run goes to next, or the stop:

- On the default branch, a number goes to *Check the issue*. An idea goes to *Start from an idea*. Nothing runs `next`: a pick prints `Picked #<i>: <title>, the next ready issue.` and goes to *Check the issue*, and an empty backlog stops.
- On another branch, a number goes to *Check the issue* when it is one of the open issues whose title starts with the branch's name and ` — `, and stops otherwise. An idea stops: an idea needs the default branch. Nothing goes to *Check the issue* when exactly one open issue's title starts that way, and stops when none or several do.

The table SHALL replace the bullets *Start* step 2 held, with the same results. A leading or trailing `ask` or `auto` SHALL be read before the table decides, as *lets-go takes one issue number or an idea* says. On another branch, words stop the run, so `lets-go` SHALL ask no question about the word there.

#### Scenario: An idea on the default branch
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on `main`, the default branch
- **THEN** the entry table sends the run to *Start from an idea*

#### Scenario: An idea on a change's branch
- **WHEN** the user runs `lets-go add a --quiet flag` on the branch `lets-go-chore`
- **THEN** the entry table stops the run, and `lets-go` says that an idea needs the default branch

#### Scenario: Nothing on a change's branch with one match
- **WHEN** the user runs `lets-go` with nothing on the branch `lets-go-chore`, and one open issue's title starts `lets-go-chore — `
- **THEN** the entry table sends the run to *Check the issue* for that issue

#### Scenario: The table has six cells
- **WHEN** a reader reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds a table with a row for the default branch and a row for another branch, and a column each for a number, an idea and nothing

### Requirement: Each part ends by saying what comes next
Every part but *End of the run* SHALL end its own text with a line that starts `Next:`. A part's own text runs from its heading to the next heading of any level, so the line comes before any subsection of the part. The line SHALL link the part or parts that can follow, and give the condition for each when there is more than one. A procedure that a part runs, such as *Find the source of demand*, *Confirm the packet* or *Claim*, SHALL say that it returns to the part that ran it, and SHALL have no `Next:` line. *End of the run* SHALL say that the run is over.

#### Scenario: Route says what comes next
- **WHEN** a reader reads the *Route* section of `skills/lets-go/SKILL.md`
- **THEN** its last non-empty line starts `Next:` and links `#enter-the-branch`

#### Scenario: A part with a subsection
- **WHEN** a reader reads *Walk the step table*, which has the subsection *Records that disagree*
- **THEN** the last non-empty line before `### Records that disagree` starts `Next:` and links `#end-of-the-run`

#### Scenario: A part without a Next line
- **WHEN** an edit makes the *Set the question mode* section of `skills/lets-go/SKILL.md` end with no `Next:` line
- **THEN** the edit breaks this requirement

#### Scenario: Check the issue goes to shape or to route
- **WHEN** a reader reads *Check the issue*
- **THEN** its `Next:` line links `#run-the-shape-step` and `#route`, each with its condition

### Requirement: Every link inside lets-go names one of its headings
This holds for `skills/lets-go/SKILL.md` and for each file in `skills/lets-go/references/`. A link to a place in the same file is written `](#<anchor>)`. Outside code, each such link SHALL match the anchor GitHub makes from one of that file's own headings. GitHub makes it from the heading's text: in lower case, with each space made a hyphen and punctuation dropped. A link to another file is written with a path relative to the linking file, such as `](references/records.md#records-that-disagree)` or `](../SKILL.md#walk-the-step-table)`. Outside code, the path SHALL name a file that exists, and an anchor after it SHALL match one of that file's headings. A link SHALL not leave the skills folder: the skill is installed without the rest of the repository. A link that starts with a URL scheme such as `https:`, or whose target holds a placeholder, is not checked here. The Node link check, `tests/contracts/links.test.ts`, SHALL fail on a link that matches no file or no heading, or that leaves the skills folder, and SHALL name the linking file and the link. It SHALL run on the source skills, and on `lets-go` as the release build installs it in each published flow, `standard` and `minimal`.

#### Scenario: Every link resolves
- **WHEN** the Node link check reads `skills/lets-go/SKILL.md`
- **THEN** every `](#...)` link outside code matches one of its headings, such as `#enter-the-branch` for `## Enter the branch` and `#the-changes-name` for `### The change's name`

#### Scenario: A link to a heading that is gone
- **WHEN** a small skills folder written for the test holds `lets-go/SKILL.md` with a link `[Start](#start)` and no heading `Start`
- **THEN** the check fails, and its output names `SKILL.md` and `#start`

#### Scenario: A link in a reference file
- **WHEN** a small skills folder written for the test holds `lets-go/references/glossary-preflight.md`, which links `[Check the prerequisite](#check-the-prerequisite)` and has a heading `## Check the prerequisite`
- **THEN** the check passes for that file

#### Scenario: A link to a heading in another file
- **WHEN** a small skills folder written for the test holds `lets-go/SKILL.md` linking `[records disagree](references/records.md#records-that-disagree)`, and `lets-go/references/records.md` has a heading `## Records that disagree`
- **THEN** the check passes

#### Scenario: A link to a missing file
- **WHEN** a small skills folder written for the test holds `lets-go/SKILL.md` linking `[the frame](references/frame.md)`, and there is no `lets-go/references/frame.md`
- **THEN** the check fails, and its output names `SKILL.md` and `references/frame.md`

#### Scenario: A link to a heading another file does not have
- **WHEN** a small skills folder written for the test holds `lets-go/references/shape.md` linking `[Check the issue](../SKILL.md#check-the-issue)`, and `lets-go/SKILL.md` has no heading `Check the issue`
- **THEN** the check fails, and its output names `references/shape.md` and `../SKILL.md#check-the-issue`

#### Scenario: The links in both published flows
- **WHEN** the release build installs the `standard` flow and the `minimal` flow
- **THEN** every link in each installed file of `lets-go` resolves to a file and a heading inside the installed skills

### Requirement: Each lets-go procedure returns a result
Each procedure of `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure is a section under `## Procedures` in `SKILL.md`, or one of *Glossary preflight*, *Import the glossary checkpoint*, *Commit the discovery map* and *Find the input's discovery* in a reference file. *Glossary preflight*, which only *Claim* runs, SHALL return to *Claim*. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results. Each result is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed`, `branch-failed` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |
| *Commit the map in an epic run* | `committed`, `commit-failed`, `restore-failed` |

*Glossary preflight* returns `no-owned-edits` when the story owns no glossary edits, and otherwise passes on what *Check the checkpoint* returns. `verified` carries the checkpoint commits to import. *Claim*'s `claimed` carries what *Glossary preflight* returned, so *Enter the branch* runs *Import the glossary checkpoint* only after `verified`. *Commit the discovery map* ends one way only, so it names no result. Its epic-run form, *Commit the map in an epic run*, can fail after its commit, so it names its results: `committed` when the story's branch holds the maps' edits or no map changed, `commit-failed` with Git's error when the edits are still only in the epic run's checkout, and `restore-failed` with Git's error when the story's commit holds the edits but the checkout could not be restored. *Find the input's discovery* ends one way too: it returns each discovery it found, or none, and names no result.

#### Scenario: Every procedure returns
- **WHEN** a reader reads each procedure of `lets-go`, in `SKILL.md` and in its reference files
- **THEN** each one says it returns to the part that ran it, or, for *Glossary preflight*, to *Claim*, has no `Next:` line, and holds no `stop` or `stops` outside code

#### Scenario: A procedure that stops
- **WHEN** an edit makes *Confirm the packet* say ``Say to run the `lets-shape` skill on `#<i>`, and stop.``
- **THEN** the edit breaks this requirement, because a procedure returns a result and holds no `stop`

#### Scenario: Claim lists its results
- **WHEN** a reader reads *Claim*
- **THEN** the reader finds `claimed`, `taken`, `claim-failed`, `unresolved`, `checkpoint-failed` and `branch-failed`

#### Scenario: Confirm the packet lists its results
- **WHEN** a reader reads *Confirm the packet*
- **THEN** the reader finds `complete`, `needs-shape` and `epic`

#### Scenario: The epic-run map commit lists its results
- **WHEN** a reader reads *Commit the map in an epic run* and *Enter the branch*
- **THEN** the reader finds `committed`, `commit-failed` and `restore-failed` in each, with an action for each one in *Enter the branch*

### Requirement: Each part names the action for each result
A part that runs a procedure SHALL name each result the procedure can return there. For each one, it SHALL say what to do: go on, run another part, or tell the user what the result carries and stop. A part SHALL not hold a catch-all such as `any other stop stands`. The overview's *Stops when* column SHALL name the results a part stops on.

#### Scenario: Check the issue acts on the packet's results
- **WHEN** a reader reads *Check the issue*
- **THEN** the reader finds `complete`, `needs-shape` and `epic`, each with its action

#### Scenario: Enter the branch acts on the claim's results
- **WHEN** a reader reads *Enter the branch*
- **THEN** the reader finds `claimed`, `taken`, `unresolved`, `checkpoint-failed` and `branch-failed`, each with its action, and no `branch-exists`

#### Scenario: A claim with owned glossary edits
- **WHEN** *Glossary preflight* returns `verified` with two checkpoint commits, and *Claim* then returns `claimed`
- **THEN** *Enter the branch* runs *Import the glossary checkpoint* with those two commits before it commits the discovery map

#### Scenario: A claim with no owned edits
- **WHEN** *Glossary preflight* returns `no-owned-edits`, and *Claim* returns `claimed`
- **THEN** *Enter the branch* runs no import

#### Scenario: An epic stops the run
- **WHEN** the user runs `lets-go` for `#194`, and *Confirm the packet* returns `epic`
- **THEN** `lets-go` says that an epic is built through its stories, lists its open sub-issues, claims nothing and stops

### Requirement: lets-go states the action, not an override
`lets-go` SHALL state each action directly. Outside code, no text of `lets-go` SHALL hold `aside`, or the word `stand` or `stands`, in any case, except in `stands for`. So the skill SHALL not say `set that stop aside`, `the stop in next stands` or `The lines printed for the lost issue stand`.

#### Scenario: No override idiom
- **WHEN** a reader reads `lets-go`, outside code
- **THEN** the reader finds no `aside`, and no `stand` or `stands` other than in `stands for`

#### Scenario: An override comes back
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold the line ``When nothing is ready, the stop in `next` stands.``
- **THEN** the edit breaks this requirement, because of the word `stands`

#### Scenario: The placeholders table
- **WHEN** `lets-go` says `Each one stands for one thing` and has a column `What it stands for`
- **THEN** the skill meets this requirement, because `stands for` is allowed

### Requirement: lets-go looks for the change's branch before the packet check
*Check the issue* SHALL look for the change's branch once for each issue it checks. It SHALL look right after the blocker read, and before it runs *Find the source of demand* and *Confirm the packet*, whether a blocker is open or not. On the default branch, it SHALL run `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`. On a change's branch, the branch exists. *Enter the branch* SHALL use what *Check the issue* found, and SHALL not look again. After a shape step, *Check the issue* SHALL look again for the shaped issue, whose title gives the name. Sometimes the branch exists and *Confirm the packet* returns `needs-shape`. Then `lets-go` SHALL say that the change has started on `<name>`, and why the packet needs shaping. It SHALL say to run `lets-shape` on `#<i>`, and stop. It SHALL do the same on the default branch and on the change's branch.

#### Scenario: The lookup comes before the packet check
- **WHEN** a reader reads *Check the issue*
- **THEN** `git ls-remote --heads origin refs/heads/<name>` comes before the link to `#confirm-the-packet`

#### Scenario: A started change with a new comment, on the default branch
- **WHEN** the user runs `lets-go 123` on the default branch, `origin` has the branch `lets-go-chore`, and *Confirm the packet* returns `needs-shape` because #123 has a comment after the watermark
- **THEN** `lets-go` says the change has started on `lets-go-chore`, says to run `lets-shape` on #123, stops, and runs no shape step

#### Scenario: The same change, on its branch
- **WHEN** the user runs `lets-go` on the branch `lets-go-chore`, whose issue #123 has the same comment
- **THEN** `lets-go` says the same, and stops

### Requirement: Each lets-go rule is written once
`lets-go` SHALL write each of these rules in one place. Every other place that uses a rule SHALL link to it or name it, and SHALL not restate it.

- The question mode, in *Set the question mode*.
- The form of each step's `Done`, `Skipped` and `Failed` line, and what fills `<date>` and `<evidence>`, in one section.
- The branch check, in *Check the issue*.
- What a `lets backlog` error does, in *Backlog errors*.
- The prerequisite check, in *Check the prerequisite*.
- The packet check, in *Confirm the packet*.
- Each step's done test, in the walk.

A rule written once MAY run more than once. `next` runs *Check the prerequisite* and *Confirm the packet* on each candidate, and *Check the issue* runs both again for the picked issue. *Claim*'s *Glossary preflight* SHALL run only *Check the checkpoint*, which runs *Check the prerequisite* again only when the owner of the glossary definitions or the proposed base has changed. *Find the source of demand* SHALL not say that it returns to *Claim*, because *Claim* never runs it.

#### Scenario: Each line form is written once
- **WHEN** a reader reads `lets-go`
- **THEN** the reader finds `Done shape: <date>. <evidence>` and `Skipped shape: #<i>'s packet is complete, last edited <date>.` once each

#### Scenario: Claim looks for no branch
- **WHEN** a reader reads *Claim* in `lets-go`
- **THEN** the reader finds no `branch-exists`, and no branch lookup

#### Scenario: The preflight in Claim checks no prerequisite first
- **WHEN** `lets-go` runs *Claim* for #152, whose **Glossary handoff** names #150 as the owner of its definitions, #150's pull request has merged, and neither the owner nor the base has changed since *Check the issue*
- **THEN** *Claim* runs *Check the checkpoint* only when #152 owns the edits, and does not run *Check the prerequisite* again

#### Scenario: No return to Claim
- **WHEN** a reader reads *Find the source of demand*
- **THEN** it does not say `When *Claim* ran it, return to *Claim*`

### Requirement: lets-go keeps what only some runs need in reference files
`skills/lets-go/references/` SHALL hold these eight files. Each SHALL open with a `#` title and one line that says when a run reads it.

| File | What it holds |
|---|---|
| `epic-run.md` | The steps of *Run the epic*: how an epic run starts, picks each story, records each story's line and ends |
| `glossary-handoff.md` | *Glossary preflight*, with *Check the prerequisite*, *Check the checkpoint* and *What the preflight returns*, and *Import the glossary checkpoint*, with *Import the commits* and *Recover from a failed import* |
| `shape.md` | The steps of *Start from an idea* and *Run the shape step*, *Find the input's discovery*, *Commit the discovery map*, and the `<shape-name>` and `<slug>` rules of *The change's name* |
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

### Requirement: lets-go reads the glossary file only for a story with a glossary handoff
`SKILL.md` SHALL say to read `references/glossary-handoff.md` only when the issue's body has a **Glossary handoff** section. Where *Find the source of demand* runs *Check the prerequisite*, and where *Claim* runs *Glossary preflight*, `SKILL.md` SHALL say what each returns for an issue with no such section: `resolved` and `no-owned-edits`, without reading the file. These are the results the moved text already gives for a story with no glossary handoff.

#### Scenario: An issue with no glossary handoff
- **WHEN** a reader reads *Find the source of demand* and *Claim* in `SKILL.md`
- **THEN** each names **Glossary handoff** and links `references/glossary-handoff.md`, *Find the source of demand* names `resolved`, and *Claim* names `no-owned-edits`

### Requirement: lets-go carries the glossary's entries for its own terms
`skills/lets-go/references/terms.md` SHALL hold the entries of `openspec/glossary.md` for *Part*, *Procedure*, *Step*, *Step report*, *Question mode* and *Packet*. Each entry SHALL be a `##` heading with the term, as in the glossary, and its text SHALL be the glossary entry's text, word for word. The file SHALL hold no other entry. An installed skill cannot link `openspec/glossary.md`: in a project that installs `lets-go`, that path is the project's own glossary. So this file is how the definitions travel with the skill. The Node terms check, `tests/contracts/terms.test.ts`, SHALL fail when an entry's text differs from the glossary's, or when an entry is missing from either file, and SHALL name the term. It SHALL read the terms from the headings of `terms.md`, not from a list typed into the test.

#### Scenario: The copy matches the glossary
- **WHEN** the Node terms check reads `skills/lets-go/references/terms.md` and `openspec/glossary.md`
- **THEN** each of the six terms has a `##` heading in both files, the text under each heading is the same once whitespace is collapsed, and the check passes

#### Scenario: The glossary changes and the copy does not
- **WHEN** a small glossary written for the test has a *Procedure* entry that says `run by a part`, and a small `terms.md` says `run by a part or another procedure`
- **THEN** the check fails, and its output names `Procedure`

#### Scenario: A term missing from the copy
- **WHEN** a small `terms.md` written for the test has no `## Step report` heading, and its glossary has one
- **THEN** the check fails, and its output names `Step report`

### Requirement: lets-go links each glossary term at its first use
In `skills/lets-go/SKILL.md`, the first mention of each of *Packet*, *Step*, *Step report* and *Question mode*, in any case and outside the frontmatter and code, SHALL sit in a link to that term's heading in `references/terms.md`, such as `[step report](references/terms.md#step-report)`. A mention of *Step report* SHALL not count as a mention of *Step*. The skill SHALL not repeat a definition that `terms.md` holds.

#### Scenario: Each term links at its first mention
- **WHEN** a reader finds, in `SKILL.md` outside the frontmatter and code, the first line that mentions each of `packet`, `step`, `step report` and `question mode`
- **THEN** that line holds a link to `references/terms.md#packet`, `#step`, `#step-report` or `#question-mode`, as the term is

#### Scenario: A term used before its link
- **WHEN** an edit makes `SKILL.md` say `the issue's packet` on one line, and link `[packet](references/terms.md#packet)` only on a later line
- **THEN** the edit breaks this requirement, because the first line that mentions `packet` has no link

### Requirement: lets-go explains each of its own terms where it first appears
`lets-go` SHALL explain each term below, in the section where it first appears, in the same sentence or the one before it. The explanation SHALL say what the term is, not only where it is used.

| Term | Where | What the explanation says |
|---|---|---|
| *Find the source of demand* and `next` | The paragraph before the overview table in `SKILL.md` | *Find the source of demand* finds the run's issue: the one the user named, the one an idea's words describe, or `next`. `next` is the first ready issue on the backlog, as that procedure ranks it. |
| *Procedure* | The same paragraph | A part or another procedure runs it, and it returns a result to what ran it. It links `references/terms.md#procedure`. |
| *read marker* and the unread-comment rule | *Confirm the packet* | A read marker is a comment that `lets-shape` posts when it has read the thread, as the issue-comments reference says. A comment is unread when it was created or edited after both the body's last edit and the newest read marker. The sentence `The watermark is the later of the body's last edit and the newest read marker` stays. |
| *Glossary handoff* | Its first mention in `SKILL.md`, in *Find the source of demand* | The section `lets-shape` writes in a story's issue body when shaping added glossary terms. It records which issue owns the definitions, and where the owner's glossary commits are. |
| *prerequisite* | *Check the prerequisite*, in `references/glossary-handoff.md` | The glossary definitions a story needs that another issue owns. |
| *checkpoint* and *owned paths* | *Check the checkpoint* | The checkpoint is the ordered `docs:` commits that hold shaping's glossary edits. The owned paths are the glossary files those commits may change. |
| *rehearse* | *Check the checkpoint*, at its first use | Try the import first in a throwaway checkout, and keep the real working tree as it is. |
| *holding branch* | *Import the commits* | The branch `lets-shape` makes from the default branch to keep the checkpoint commits until a story's branch imports them. |

The opening paragraphs of `SKILL.md`, before the overview, SHALL say that "you" is the agent that runs the skill, and "the user" is the person who asked for the run. No reference file SHALL say it again.

The `## Procedures` section of `SKILL.md` SHALL say, before its first procedure, that a part or another procedure runs each procedure, and that each returns to what ran it.

#### Scenario: The explanations are in their sections
- **WHEN** a reader reads the paragraph before the overview table, *Confirm the packet*, *Find the source of demand*, *Check the prerequisite*, *Check the checkpoint* and *Import the commits*
- **THEN** each holds its row's explanation, and *Confirm the packet* still holds `The watermark is the later of the body's last edit and the newest read marker`

#### Scenario: Who "you" is
- **WHEN** a reader reads `SKILL.md` up to the overview table
- **THEN** it says `"You" is the agent`, and no file in `skills/lets-go/references/` says it

#### Scenario: A procedure that another runs
- **WHEN** a reader reads `## Procedures` up to its first `###` heading
- **THEN** it says that a part or another procedure runs each procedure

### Requirement: The lets-go description says when to use it in about 50 words
The `description` in the frontmatter of `skills/lets-go/SKILL.md` SHALL start with `Use when`, and SHALL hold at most 60 words. It SHALL name these requests: a story, bug or chore, or an idea in words, built end to end to a pull request ready for review; the next story; the change on the current branch; and `lets-go` run again after a run stopped. It SHALL say that `lets-go` runs each step in a fresh session. It SHALL leave the question modes, the shape rules and the resume details to the body.

#### Scenario: The description as it ships
- **WHEN** a reader reads the frontmatter of `skills/lets-go/SKILL.md`
- **THEN** its `description` starts `Use when`, holds at most 60 words, and holds `next story`, `current branch` and `fresh session`

#### Scenario: A description that grew
- **WHEN** an edit gives `SKILL.md` a `description` of 61 words that starts `Use when`
- **THEN** the edit breaks this requirement, because the description holds more than 60 words

### Requirement: The resume paragraph says what a run started again does
The paragraph near the top of `SKILL.md` that tells the user to run `lets-go` again after a run stops SHALL say what the new run does in each of these cases:

- **On the change's branch:** it finds the issue from the branch's name, prints a dated line for each step already done, and goes on from the first unfinished step.
- **On the default branch, with the issue number:** it finds the change's branch, here or on `origin`, switches to it, and goes on the same way. It does not claim the issue again.
- **On the default branch, with an epic's number:** it starts the epic run again. It gives each story whose pull request is ready, merged or closed its line, resumes each story this user started, and builds the rest.
- **On the default branch, with nothing:** it does not resume. It picks the next ready issue, and a claimed issue is never ready. To resume, give the issue number, or run it on the change's branch.
- **After a failed step:** the run that failed never runs that step again. A new run starts it afresh, in a new session, with the answers given so far. A failed shape step has no branch: the run says to run `lets-shape` on the idea or the issue.
- **After the pull request is merged or closed:** there is nothing to resume, and the run stops.

#### Scenario: Each case is named
- **WHEN** a reader reads `SKILL.md` up to the overview table
- **THEN** it names the change's branch, the default branch with the issue number, the default branch with an epic's number, the default branch with nothing, a failed step and a merged or closed pull request, each with what the new run does

### Requirement: Enter the branch opens the shape file only after a shape step
*Enter the branch* SHALL link *Commit the discovery map* in `references/shape.md` only for a run in which a shape step ran. For a run with no shape step, it SHALL say that there is no map to commit, so the run reads no part of `references/shape.md`. *Commit the discovery map* keeps its own rule, so a map is committed exactly when *lets-go commits the discovery map on the story's branch* says.

#### Scenario: A claim with no shape step
- **WHEN** a reader reads *Enter the branch*
- **THEN** each link to `references/shape.md#commit-the-discovery-map` sits in a sentence that says a shape step ran in this run

### Requirement: lets-go wraps its prose at 72 columns
No line of `skills/lets-go/SKILL.md` or of a file in `skills/lets-go/references/` SHALL be longer than 72 columns, outside these exceptions. A column is one character (one Unicode code point), not one byte.

- the frontmatter, between the opening and closing `---`;
- a table row, a line whose first character other than a space is `|`;
- a line inside a fenced code block, the fence lines included;
- a line that holds one link and nothing else but leading spaces, a list marker such as `-` or `1.`, and one closing `.`, `,`, `;` or `:`;
- every line of `references/terms.md`, which copies `openspec/glossary.md` word for word.

#### Scenario: The source wraps
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds no line longer than 72 columns outside the exceptions

#### Scenario: A prose line too long
- **WHEN** an edit makes line 4 of `skills/lets-go/references/shape.md` 73 characters of prose
- **THEN** the edit breaks this requirement

#### Scenario: A table row, a command and a lone link
- **WHEN** `skills/lets-go/SKILL.md` holds a 120-column table row, a 120-column line inside a ```` ```bash ```` block, and a line longer than 72 columns that holds only `   [Import the glossary checkpoint](references/glossary-handoff.md#import-the-glossary-checkpoint).`
- **THEN** the file meets this requirement, because each of those lines is an exception

#### Scenario: Wide characters count once
- **WHEN** `skills/lets-go/SKILL.md` holds a prose line of 70 characters, five of them `ログを直す`
- **THEN** the line meets this requirement, because each character counts as one column

#### Scenario: The exit-3 sentence wraps
- **WHEN** a reader reads *Run a step* in `skills/lets-go/SKILL.md`
- **THEN** `**3**: no fresh session can run here, for example because no resolver started one` spans more than one line

### Requirement: lets-go links each section it names
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a file by a link to its heading, every time, in prose and in table cells, the overview's *Next* column included. A link to a section of another `lets-go` file, or of another skill, SHALL use a path relative to the linking file, as *Every link inside lets-go names one of its headings* says. A section of another skill that a published flow does not install, such as *Check an earlier review* in `lets-review-plan`, which the `minimal` flow leaves out, SHALL stay in italics, so that every link resolves in both flows. A heading inside the step prompt frame, which is not a heading of the file, SHALL be written as it is typed, in a code span, such as `## What to run`. `references/terms.md` is exempt: it copies `openspec/glossary.md` word for word, and the glossary names sections such as *Route* and *Claim* in italics.

#### Scenario: Every section reference is a link
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`, outside code
- **THEN** the reader finds no italic text that equals a heading of those files, such as `*Claim*` or `*Check the issue*`

#### Scenario: An italic section name comes back
- **WHEN** an edit makes `skills/lets-go/SKILL.md`, which has a heading `## Route`, say `otherwise *Route*`
- **THEN** the edit breaks this requirement, because it names a section in italics and not by a link

#### Scenario: A section of another skill
- **WHEN** a reader reads *End of the run* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds a link to `../lets-review-build/SKILL.md#finish-the-change`

#### Scenario: A section the minimal flow does not install
- **WHEN** a reader reads the review plan row of *Walk the step table*
- **THEN** the reader finds `*Check an earlier review*` in italics and the `lets-review-plan` skill named, and no link to `../lets-review-plan/`

#### Scenario: A heading of the prompt frame
- **WHEN** a reader reads *Write the prompt* in `references/step-prompt.md`
- **THEN** the reader finds `` `## What to run` `` and no `*What to run*`

#### Scenario: The glossary's copy keeps its italics
- **WHEN** a reader reads `references/terms.md`, which says `such as *Route* or *Walk the step table*`
- **THEN** those italics break no rule, because this requirement exempts `terms.md`, and `terms.md` still matches `openspec/glossary.md`

#### Scenario: Italics that name no section
- **WHEN** `skills/lets-go/SKILL.md` has no heading `Resume mode`, and holds the text `*Resume mode*` inside a fenced code block
- **THEN** the file meets this requirement, because text in code names no section

### Requirement: lets-go names a pull request section in bold
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a section of a pull request's body in bold, such as **Code review** and **Plan review**. A heading the agent searches for, such as `## Plan review`, and a printed line SHALL stay in code font.

#### Scenario: The sections are bold
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds `**Code review**` in *Walk the step table* and in *Records that disagree*, and no code span that holds only `Code review` or `Plan review`

#### Scenario: A section name in code font comes back
- **WHEN** an edit makes `skills/lets-go/references/records.md` say ``has no `Code review` section``
- **THEN** the edit breaks this requirement, because it names a section of the pull request in code font and not in bold

#### Scenario: A heading to search for
- **WHEN** `references/records.md` says ``Find the `## Plan review` heading``
- **THEN** the file meets this requirement, because a heading the agent searches for stays in code font

### Requirement: lets-go names a step in plain words in prose
In prose, `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL name a step as *The step table* says: shape, plan, review plan, build or review build, in plain words. Code font SHALL stay for a `--for` value, a file name, a config key and the step table's *Step* column.

#### Scenario: The steps named in code font are plain
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** none of them says ``Run the `shape` step``, ``When `review-build` reports`` or ``after `shape`, go on``

#### Scenario: The `--for` names stay in code font
- **WHEN** a reader reads *The step table*
- **THEN** it still says that `--for` uses `shape`, `plan`, `review-plan`, `build` and `review-build`

### Requirement: lets-go gives a whole printed line in a text block
`skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` SHALL give each whole line the run prints in a fenced `text` block. A part of a line, such as the `Records disagree:` prefix, a line named in passing, and a line in a table cell, such as a Skip line in *The step table*, SHALL be an inline code span.

#### Scenario: The Picked line of next
- **WHEN** a reader reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** `Picked #<i>: <title>, the next ready issue.` is a line of a `text` block

#### Scenario: The Failed examples
- **WHEN** a reader reads *The step lines*
- **THEN** `Failed review build: <reason>` and `Failed shape: <reason>` are lines of a `text` block

### Requirement: lets-go reads and claims the backlog only through lets backlog
`lets-go` SHALL read the ready issues with `lets backlog ready`, read an issue with `lets backlog item <i>`, search titles with `lets backlog find`, claim with `lets backlog claim <i>` and release with `lets backlog release <i>`. It SHALL run no `gh project` command and no Project query. These stay as `gh` until the shaping side moves: the comment thread read of *Confirm the packet*, which is a GraphQL query with its pagination; `gh issue view <i> --json createdAt`; the parent query of *A stopped discovery resumes from its parent issue*; and the issue body edit that records a **Glossary handoff** import. Pull request reads and edits stay as `gh pr` commands.

#### Scenario: No backlog gh in the skill
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds no `gh project`, no `projectsV2`, no `--add-assignee`, no `--remove-assignee` and no `gh issue list --search "is:open no:assignee`, and finds `lets backlog ready`, `lets backlog item <i>`, `lets backlog find`, `lets backlog claim <i>` and `lets backlog release <i>`

#### Scenario: Why no shaped story is ready
- **WHEN** a shape step files #190 with the stories #191 and #192 in one wave, the epic run on #190 runs `lets backlog ready --only 191,192`, which returns no issues, and `lets backlog item 191` returns `"assignees": ["octocat"]`
- **THEN** the epic run settles #191 with `#191 <story-name>: not built, assigned to octocat`

#### Scenario: An epic's sub-issues
- **WHEN** the user runs `lets-go` for #52, and `lets backlog item 52` returns Kind Epic and `subIssues` #136 and #137
- **THEN** `lets-go` says that an epic is built through its stories, lists #136 and #137, and runs no other command to find them

#### Scenario: The parent's Shared decisions
- **WHEN** `lets-go` confirms the packet of a Story whose parent is #52
- **THEN** it reads the parent's **Shared decisions** from the `parent` that `lets backlog item <i>` returned, and runs no `gh issue view 52`

### Requirement: An epic run starts on an epic with open stories
When *Confirm the packet* returns `epic` for the run's issue, the run started on the default branch, the epic has open sub-issues, and *An epic run finishes a stopped discovery before it builds* found no discovery in progress, `lets-go` SHALL start an epic run on that epic, `#<parent>`. On a change's branch it SHALL say that an epic run needs the default branch, and stop: an epic has no change's branch. The epic's stories SHALL be the open sub-issues that `lets backlog item <parent>` printed in *Check the issue*, in the order it printed them. They SHALL stay the same set for the whole epic run: a sub-issue added or closed during the run does not change it. `lets-go` SHALL claim nothing on the epic, and create no branch for it: it claims each story it builds, as for any picked issue. Before the epic run starts, *Check the issue* SHALL run only these checks on the epic:

- the blocker read and the open-blocker decision, as for any issue. An epic has no change's branch, so `lets-go` SHALL not look for one. An open blocker on the epic SHALL stop the run, as for an issue with no branch;
- *Confirm the packet*, which returns `epic` from the Kind alone.

It SHALL not run *Find the source of demand* or *Check the prerequisite* on the epic. Each story's own *Check the prerequisite* runs when the epic run ranks it.

Each story run SHALL run in a child `lets-go` session, as *An epic run runs each story in a child session* says. An empty epic SHALL go as *An epic run shapes an empty epic first* says, and an epic whose sub-issues are all closed as *A finished epic stops the run* says.

#### Scenario: An epic with open stories
- **WHEN** the user runs `lets-go #278` on the default branch, #278's Kind is Epic, it has no open blocker, and it has the open sub-issues #279 to #287
- **THEN** `lets-go` starts an epic run whose stories are #279 to #287, in that order, and claims nothing on #278

#### Scenario: An epic with an open blocker
- **WHEN** the user runs `lets-go #278` on the default branch, and #278 is blocked by the open issue #263
- **THEN** `lets-go` says that #263 blocks #278, starts no epic run, and claims nothing

#### Scenario: The epic's own glossary handoff is not checked
- **WHEN** #278's body has a **Glossary handoff** that names #279 as the owner of its definitions, and #279's pull request has not merged
- **THEN** `lets-go` runs no *Check the prerequisite* on #278, and starts the epic run

#### Scenario: The checks on the epic come before the epic run
- **WHEN** a reader reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it says that an epic has no change's branch to look for, and that *Find the source of demand* does not run for an epic, and its `epic` case links `#run-the-epic`

### Requirement: A failure or a stop skips only the stories that depend on it
While an epic run is on a story, from its pick to its line, a stop SHALL end that story's run, and not the epic run. This holds the same way for every stop of the parts and procedures the story runs through: a failed step, records that disagree, a pull request that is merged or closed, a stop of *Check the prerequisite*, a failed claim write, a `lets backlog` error, a `fetch-failed` from *Stack the story*, a worktree that cannot be created or that has changes that are not committed, and every other stop. The lost claim of *A lost claim drops the issue, and three lost claims stop the run* is unchanged: it settles the story with `not built, taken by <login>` and picks again. A stop between stories, such as a `lets backlog` error in a pick, SHALL still end the epic run, as *A backlog error stops the run* says. When children of the wave still run at that stop, the epic run SHALL first wait for each of them and settle its story, as *An epic run waits for the children of a wave* says, and start no other story.

On a stop in a story run, `lets-go` SHALL act in this order:

1. Do what the stop says, such as print the `Failed` line and the pull request's URL.
2. Settle the story with `failed at <step name>: <reason>` for a failed step, or `stopped: <reason>` for any other stop, with the worktree ending that *An epic run removes a built story's worktree* says. The story is `<failed>` from here on. Its worktree SHALL stay as it is, with any changes that are not committed: they stop no other story.
3. Settle each dependent of `<failed>`, in the epic's order, with `not built, it depends on #<failed>, which did not finish`, right after `<failed>`'s own line. A dependent is a story of the epic, in this repository and not settled yet, whose open blockers include `<failed>`, or include another dependent, through any number of stories. Only "blocked by" links between the epic's own stories that are not settled yet count: a link through an issue outside the epic, or through a story settled before this stop, does not make a story a dependent. The line names `<failed>` itself, even when the dependence goes through other stories.
4. Go back to where the epic run was: the next pick of the current wave, or the wait for its children. Every story settled in steps 2 and 3 is passed in `--exclude`, so none of them is picked. The epic run SHALL run no `git switch`.

`lets-go` SHALL not retry a failed step in the same run. Running `lets-go` again on the failed story's branch carries on, as for any run. The end of an epic run SHALL print no count of built, failed or skipped stories: the per-story lines are its summary.

`<failed>` is a different placeholder from `<story>`, the story the line is for.

The rule's text SHALL appear once, under the heading *A stop in an epic run* in `references/epic-run.md`. Each stop keeps its own text. Each section that holds a stop a story can reach SHALL link the rule, next to its stops, as each `lets backlog` call links *Backlog errors*: *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions* in `SKILL.md`, and *Records that disagree* in `references/records.md`. The sentence after the overview that says any part stops on a `lets backlog` error SHALL link the rule too, and SHALL say that a stop in a story run ends only that story.

#### Scenario: A failed build
- **WHEN** an epic run on #278 has built #279, the build step of #391 reports `failed` with the reason `tests fail on main`, #392 is blocked by #391, #393 is blocked by #392, and #394 has no open blocker
- **THEN** `lets-go` prints the lines `#391 <story-name>: failed at build: tests fail on main; its worktree is at .workspace/lets-go/worktrees/<story-name>`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#393 <story-name>: not built, it depends on #391, which did not finish`, in that order, runs no `git switch`, and runs the next pick with `--exclude` naming #279, #391, #392 and #393, which can pick #394

#### Scenario: Records that disagree
- **WHEN** the walk of #391 finds that the records disagree, and no story of the epic is blocked by #391
- **THEN** #391's line is `#391 <story-name>: stopped: ` followed by the disagreement and its worktree ending, no story gets a `depends on` line, and the epic run goes on

#### Scenario: A failed claim write
- **WHEN** *Claim* for #391 returns `claim-failed`
- **THEN** `lets-go` shows what *Claim* says for `claim-failed`, settles #391 with `#391 <story-name>: stopped: ` followed by the reason, and picks again

#### Scenario: Uncommitted changes after a failure
- **WHEN** the build step of #391 reports `failed`, #394 has no open blocker, and `git status` in #391's worktree shows a modified file `skills/lets-go/SKILL.md` that is not committed
- **THEN** #391's line ends with `; its worktree is at .workspace/lets-go/worktrees/<story-name>`, the modified file is still there, no story gets a line that says the epic run stopped, and the epic run can still pick #394

#### Scenario: Changes only in .workspace
- **WHEN** the build step of #391 reports `failed`, and the only uncommitted files in #391's worktree are under `.workspace/`
- **THEN** the epic run settles #391 with its worktree ending, settles #391's dependents and goes on, as it does when the worktree has other changes

#### Scenario: A link through an issue outside the epic
- **WHEN** the build step of #391 fails, and #395, a story of the epic, is blocked only by #263, which is not a story of the epic and is blocked by #391
- **THEN** #395 gets no `depends on` line when #391 settles, and gets its own line later, such as `#395 <story-name>: not built, blocked by #263`

#### Scenario: A stop between stories
- **WHEN** the epic run has settled #391 after a failure, no child runs, and the next `lets backlog ready` returns an error
- **THEN** `lets-go` stops as *Backlog errors* says, and picks no other story

#### Scenario: A stop between stories while children run
- **WHEN** the child of #280 runs, and the pick after it returns a `lets backlog` error
- **THEN** `lets-go` starts no other story, waits for #280's child and settles #280, then stops as *Backlog errors* says

#### Scenario: The rule is written once
- **WHEN** a reader reads `skills/lets-go/references/epic-run.md`
- **THEN** the reader finds `not built, it depends on #<failed>, which did not finish` and `failed at <step name>: <reason>` once each across the files of `lets-go`, all under the heading *A stop in an epic run*, and finds `the epic run stopped at` in no file of `lets-go`

#### Scenario: Each section with a stop links the rule
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and `skills/lets-go/references/records.md`
- **THEN** the reader finds a link to `epic-run.md#a-stop-in-an-epic-run` in the overview's sentence on `lets backlog` errors, in each of *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions*, and in *Records that disagree*

#### Scenario: A section with a stop that does not link the rule
- **WHEN** an edit takes the link to `epic-run.md#a-stop-in-an-epic-run` out of *Run a step*
- **THEN** the edit breaks this requirement

### Requirement: A stacked story's pull request targets its blocker's branch
When `lets-go` writes the prompt for a step of a stacked story, the prompt SHALL hold a `## Stack` section. It SHALL name the blocker, its branch and its pull request. It SHALL tell the step to open the story's draft pull request with `--base <blocker-branch>`, and to put the line `Stacked on #<blocker-pr>; merge that first.` on its own line after `Closes #<i>` in its description. When the pull request exists with another base, the section SHALL tell the step to fix it with `gh pr edit <name> --base <blocker-branch>`. The prompt of a story that is not stacked SHALL hold no `## Stack` section. The brainstorm instruction of the `lets-standard` and `lets-minimal` schemas SHALL say to follow the prompt's `## Stack` section, when it has one, where it opens the draft pull request.

#### Scenario: The plan step of a stacked story
- **WHEN** an epic run writes the prompt for the plan step of #280, stacked on #279, whose pull request #290 is from `epic-run-skeleton`
- **THEN** the prompt's `## Stack` section holds `--base epic-run-skeleton` and `Stacked on #290; merge that first.`

#### Scenario: A story that is not stacked
- **WHEN** an epic run writes the prompt for a step of #279, which has no open blocker
- **THEN** the prompt holds no `## Stack` section

#### Scenario: The schemas follow the section
- **WHEN** a reader reads the brainstorm instruction of `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`
- **THEN** each says to follow the step prompt's `## Stack` section where it opens the draft pull request

### Requirement: A story run's child walks only the step table
When the request starts with `You run a story run of a lets-go epic run:`, `lets-go` SHALL run as a story run's child. It SHALL take `<i>`, `<name>`, `<parent>`, `<schema>`, the route line, `<mode>` and any stack from the story prompt. When the current branch is not `<name>`, it SHALL end with a `failed` report whose reason is `stopped: the story run is on <branch>, not <name>`. Otherwise it SHALL run none of *Read the request*, *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, and SHALL claim nothing. It SHALL walk *The step table* from its top row on the branch `<name>`, as *Walk the step table* says, and run each step that is not done as *Run a step* says, the subagent step on exit 3 included. Each step's prompt SHALL hold `<mode>` from the story prompt, and the story prompt's `## Stack` section when it has one.

The child's part SHALL be written in `skills/lets-go/references/story-run.md`, whose first lines say to read it only in a story run's child session. *Read the request* in `SKILL.md` SHALL link it for a request that starts with the story prompt's first line.

#### Scenario: A child on its branch
- **WHEN** a child session starts on the branch `story-run-child-sessions` with a story prompt for #284
- **THEN** it runs no `lets backlog claim`, no *Route* and no *Set the question mode*, and reads the walk's three records first

#### Scenario: A child on another branch
- **WHEN** a child session starts on the branch `main` with a story prompt for the change `story-run-child-sessions`
- **THEN** it runs no step, and ends with a `failed` report whose reason is `stopped: the story run is on main, not story-run-child-sessions`

#### Scenario: A step prompt in a child
- **WHEN** the child writes the prompt for the plan step, and the story prompt says the question mode is `ask` and holds a `## Stack` section
- **THEN** the plan step's prompt says the question mode is `ask`, and holds the same `## Stack` section

#### Scenario: The child's part is in a reference file
- **WHEN** a reader reads `skills/lets-go/references/story-run.md` and *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** the reference file says to read it only in a story run's child session, and *Read the request* links `references/story-run.md` beside the text `You run a story run of a lets-go epic run:`

### Requirement: An epic run prints its waves before the first pick
When *Start the epic run* has settled the stories that an earlier epic run finished, and before the first pick, `lets-go` SHALL run `lets backlog waves --only <keys>`, naming every story of the epic in this repository that is not settled yet, in the epic's order. It SHALL then print `Waves for #<parent>:`, and for each wave, in order, the line `Wave <wave>: <wave-stories>`, where `<wave>` is the wave's number, counted from 1, and `<wave-stories>` is the `label` of each of the wave's stories, in the order the command gives, joined by `, `. After each wave's line but the first, it SHALL print one line for each story of that wave: `#<story> waits for #<other>: <reason>.`, where `#<other>` is the story's `waitsFor` label and `<reason>` is its `reason`, as the command prints them. It SHALL print the waves once in an epic run, even when there is only one wave. When every story is settled at the start, `lets-go` SHALL run no `waves` command and print no waves. On an error, it SHALL act as *A backlog error stops the run* says.

The waves SHALL hold for the whole epic run. Running `lets-go` on the epic again SHALL compute them again, from the stories not settled at that run's start. The wave lines SHALL not be story lines: *End of the run* SHALL not print them again.

#### Scenario: The waves of an epic
- **WHEN** an epic run on #278 starts, #283, #285, #286 and #287 are the stories not settled, and `lets backlog waves --only 283,285,286,287` puts #283 and #285 in wave 1, and #286, waiting for #285 with `blocked by #285`, and #287, waiting for #283 with `both name skills/lets-go/references/shape.md`, in wave 2
- **THEN** before the first `Picked` line, `lets-go` prints `Waves for #278:`, `Wave 1: #283, #285`, `Wave 2: #286, #287`, `#286 waits for #285: blocked by #285.` and `#287 waits for #283: both name skills/lets-go/references/shape.md.`, in that order

#### Scenario: One wave
- **WHEN** an epic run on #300 starts, and `lets backlog waves --only 301,302` puts #301 and #302 in one wave
- **THEN** `lets-go` prints `Waves for #300:` and `Wave 1: #301, #302`, and no `waits for` line

#### Scenario: A story settled at the start is not in the waves
- **WHEN** an epic run on #278 starts, and #279's pull request is open and ready for review, so *Start the epic run* settles #279
- **THEN** `lets-go` prints #279's line before the waves, and the `waves` command's `--only` does not name #279

#### Scenario: Every story settled at the start
- **WHEN** an epic run on #278 starts, and *Start the epic run* settles every story
- **THEN** `lets-go` runs no `lets backlog waves` command, prints no `Waves for` line, and goes to *End of the run*

#### Scenario: The waves command fails
- **WHEN** `lets backlog waves` returns `"error": "backend-failed"`
- **THEN** `lets-go` stops as *Backlog errors* says, and picks no story

#### Scenario: The skill holds the waves step once
- **WHEN** a reader reads `skills/lets-go/references/epic-run.md`
- **THEN** the reader finds `lets backlog waves --only`, `Waves for #<parent>:` and `#<story> waits for #<other>: <reason>.` once each across the files of `lets-go`, under *Run the epic*, and the `waves` command comes after the stories an earlier run finished are settled and before *Pick the next story*

### Requirement: lets-go names a part of a skill, never its step number
`skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` SHALL refer to another part of the skill by its name and a link, never by a step number. Outside fenced code blocks and inline code spans, no text SHALL match the word `step` or `steps` followed by a number, in any case. So the skill SHALL not say `*Start* step 3`, `*Claim* step 2`, `Step 3 of [Run a step](#run-a-step)` or `go on to step 4`. A numbered list SHALL still number its items.

#### Scenario: No step numbers
- **WHEN** a reader reads `lets-go`, outside code
- **THEN** the reader finds no `step` or `steps` followed by a number

#### Scenario: A step number comes back
- **WHEN** an edit makes `skills/lets-go/SKILL.md` hold the line `Go on from *Claim* step 3.`
- **THEN** the edit breaks this requirement, because of `step 3`

#### Scenario: A numbered list
- **WHEN** a section of `lets-go` holds a list numbered `1.` to `4.`
- **THEN** the section meets this requirement, because a numbered list still numbers its items

### Requirement: An epic run shapes an empty epic first
An empty epic is an epic with no sub-issues, open or closed: `lets backlog item <epic>` returns an empty `subIssues` and an empty `closedSubIssues`. When *Confirm the packet* returns `epic` for an empty epic, and the run started on the default branch, `lets-go` SHALL run the shape step for `#<epic>`, with `<shape-name>` `issue-<epic>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL claim nothing on the epic and create no branch before the step. When a shape step has already run in this run, `lets-go` SHALL instead say that `#<epic>` has no stories after shaping, say to run the `lets-shape` skill on `#<epic>`, and stop, running no second shape step. The step's `lets-shape` shapes the epic in place, as the `discovery-checkpoints` capability says.

When the step reports `done` and its first evidence line is `epic #<epic>: <title>`, naming the run's epic, `lets-go` SHALL go on from the blocker read in *Check the issue* with the epic as `<i>`, so it reads the epic's new open sub-issues. It SHALL print the `Done shape` line once, before the epic run prints its waves, and SHALL then start the epic run on those sub-issues as *An epic run starts on an epic with open stories* says. When the first evidence line is `issue #<epic>: <title>`, because the whole epic fits one story and became it, `lets-go` SHALL go on from the blocker read with `#<epic>` as `<i>`, as for an issue number, and build it as one story. That story keeps `Input: #<epic>`. On a later run, when *Confirm the packet* returns `complete` for an issue whose `Input:` line names the issue itself, `lets-go` SHALL first run *Find the input's discovery* for it. When the lookup finds the issue, its discovery stopped before it finished, and `lets-go` SHALL act as for `needs-shape`, with the reason that its discovery is in progress, so the shape step resumes the discovery or finishes its Finalize. When the step reports `failed` or `needs-input`, `lets-go` SHALL act as *The shape step shapes an idea or an unshaped issue* says.

#### Scenario: An empty epic runs the shape step
- **WHEN** the user runs `lets-go #300` on the default branch, #300's Kind is Epic, it has no open blocker, and `lets backlog item 300` returns `"subIssues": []` and `"closedSubIssues": []`
- **THEN** `lets-go` runs `lets delegate step run --for shape --name issue-300-shape`, its prompt says ``Invoke the `lets-shape` skill for issue #300, and stop where it stops.``, and it claims nothing and creates no branch before the step

#### Scenario: The shaped epic is built as an epic run
- **WHEN** the shape step for #300 reports `done` with `epic #300: Epic: plugin backlog`, `story #301: ...`, `story #302: ...` and `story #303: ...`
- **THEN** `lets-go` prints `Done shape: <date>. epic #300: Epic: plugin backlog; story #301: ...; story #302: ...; story #303: ...` once, runs `lets backlog item 300` again, and starts an epic run on #300 whose stories are #301, #302 and #303

#### Scenario: The epic became one story
- **WHEN** the shape step for #300 reports `done` with the first evidence line `issue #300: plugin-contract — the backlog reads its provider from a plugin`
- **THEN** `lets-go` takes #300 as `<i>`, reads its blockers, confirms its packet as a Story, and starts no epic run

#### Scenario: The one story's discovery stopped
- **WHEN** an earlier run turned #300 into one story and stopped during Finalize, #300's body says `Input: #300` and has no status line, `.workspace/lets-go/issue-300-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go #300` on the default branch
- **THEN** *Confirm the packet* returns `complete`, *Find the input's discovery* finds #300, and `lets-go` runs the shape step for #300 before it claims #300

#### Scenario: Still empty after a shape step
- **WHEN** a shape step has run in this run, and *Confirm the packet* then returns `epic` for #300 with no sub-issues
- **THEN** `lets-go` says that #300 has no stories after shaping, says to run the `lets-shape` skill on #300, and stops without a second shape step

#### Scenario: The old line is gone
- **WHEN** a reader reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** the reader finds no `lets-go does not shape an empty epic yet`

### Requirement: A finished epic stops the run
When *Confirm the packet* returns `epic` for an epic with no open sub-issues and at least one closed sub-issue, `lets-go` SHALL print `#<parent> is finished: every story under it is closed.` and stop. It SHALL claim nothing, create no branch, run no step and leave the epic open.

#### Scenario: Every story is closed
- **WHEN** the user runs `lets-go #278` on the default branch, and `lets backlog item 278` returns `"subIssues": []` and `closedSubIssues` with #279 to #287
- **THEN** `lets-go` prints `#278 is finished: every story under it is closed.`, claims nothing, creates no branch, runs no step, and #278 stays open

#### Scenario: The line is a text block
- **WHEN** a reader reads `skills/lets-go/references/epic-run.md` and `skills/lets-go/SKILL.md`
- **THEN** one of them holds `#<parent> is finished: every story under it is closed.` as a line of its own in a `text` block

## ADDED Requirements

### Requirement: lets-go keeps its steps in one table
`lets-go` SHALL keep its steps in one table, in `SKILL.md` or in one file in `skills/lets-go/references/`. The table SHALL have exactly one row for each of `plan`, `review-plan`, `build` and `review-build`, and each row's first cell SHALL be the step's name in code font, such as `` `plan` ``. The table SHALL have no `shape` row: the shape step runs before the walk.

#### Scenario: The table as it stands
- **WHEN** a reader reads the step table of `lets-go`
- **THEN** it has one row each for `plan`, `review-plan`, `build` and `review-build`, in that order, and no `shape` row

#### Scenario: No second table of steps
- **WHEN** a reader searches `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/` for a table row whose first cell is `` `build` ``
- **THEN** the reader finds exactly one, in the same table as the rows for `plan`, `review-plan` and `review-build`

### Requirement: Each skill that delegates says what exit 3 means
`lets-review-build`, `lets-review-plan` and `lets-go` SHALL each say `**3**: no fresh session can run here, for example because no resolver started one`, in the skill's `SKILL.md` or in one of its reference files. The sentence may wrap across lines.

#### Scenario: The three skills say it
- **WHEN** a reader reads `lets-review-build`, `lets-review-plan` and `lets-go`, each with its reference files
- **THEN** each says `**3**: no fresh session can run here, for example because no resolver started one`, whatever its line breaks

## REMOVED Requirements

### Requirement: The lets-go checks read the skill's reference files
**Reason**: It said only how the skill-interfaces checks matched a string against `lets-go`, and this change deletes those checks. Review checks the wording instead.
**Migration**: None for the skill. Where a requirement says `lets-go` holds a string, `SKILL.md` together with its reference files holds it, and the string may wrap across lines, as *The prose holds the fixed lines the tests check* says.

### Requirement: A lets-go section may sit in a reference file, at any heading level
**Reason**: It said only how the skill-interfaces check found a section, and this change deletes that check.
**Migration**: None for the skill. A section that a requirement names may sit in `SKILL.md` or in a reference file, at any heading level; *lets-go keeps what only some runs need in reference files* says which sections live in which file.

### Requirement: The step table check reads the step rows
**Reason**: It described the skill-interfaces check of the step table, which this change deletes.
**Migration**: The rule on the skill moves to *lets-go keeps its steps in one table*, without the check's matching details.

### Requirement: The exit-3 sentence may wrap
**Reason**: It described how the skill-interfaces check matched the exit-3 sentence, which this change deletes.
**Migration**: The rule on the three skills moves to *Each skill that delegates says what exit 3 means*, without the check's matching details.
