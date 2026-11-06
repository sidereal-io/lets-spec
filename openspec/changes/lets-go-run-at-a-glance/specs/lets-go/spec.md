## ADDED Requirements

### Requirement: lets-go opens with an overview of its parts
`skills/lets-go/SKILL.md` SHALL describe a run as named parts. A part is one named piece of a run, as `openspec/glossary.md` defines it. The parts SHALL be these, in run order: *Read the settings*, *Read the request*, *Start from an idea*, *Check the issue*, *Run the shape step*, *Pick the first ready story*, *Route*, *Enter the branch*, *Set the level*, *Walk the step table* and *End of the run*. *Start from an idea*, *Run the shape step* and *Pick the first ready story* run only when the request or the packet needs them. Each part SHALL be a `##` heading of `SKILL.md`, in that order. Right after its opening paragraphs, and before `## Placeholders`, `SKILL.md` SHALL hold an overview table with one row per part, in the same order. Each row SHALL name the part and link to its heading, and say what the part does, whether it runs in the `lets-go` session or a fresh one, what comes next, and when it stops. The skill SHALL hold no `## Start` heading. Where another requirement of this spec says *Start*, it means the parts from *Read the settings* to *Set the level*, which run before the walk, and *Start*'s blocker read is the blocker read in *Check the issue*.

#### Scenario: The overview lists every part
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds a table before `## Placeholders` whose rows name the eleven parts, each linked to its heading, in run order

#### Scenario: The parts are headings in run order
- **WHEN** the skill-interfaces test lists the `##` headings of `skills/lets-go/SKILL.md`
- **THEN** each of the eleven parts is one of them, in the order the overview lists them, and none is `## Start`

#### Scenario: A part missing from the overview
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a `## Route` heading and an overview table that has no row for *Route*
- **THEN** the overview check fails, and its output names `Route`

### Requirement: An entry table says where the run goes after the request
*Read the request* SHALL hold a table that decides where the run goes, from the branch the run started on and the request. Its rows SHALL be the default branch and another branch. Its columns SHALL be a number, an idea and nothing. Each of the six cells SHALL name the part the run goes to next, or the stop:

- On the default branch, a number goes to *Check the issue*. An idea goes to *Start from an idea*. Nothing runs `next`: a pick prints `Picked #<i>: <title>, the next ready issue.` and goes to *Check the issue*, and an empty backlog stops.
- On another branch, a number goes to *Check the issue* when it is one of the open issues whose title starts with the branch's name and ` — `, and stops otherwise. An idea stops: an idea needs the default branch. Nothing goes to *Check the issue* when exactly one open issue's title starts that way, and stops when none or several do.

The table SHALL replace the bullets *Start* step 2 held, with the same results. A leading or trailing `ask` or `recommend` SHALL still be taken off the request before the table decides.

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
- **WHEN** the skill-interfaces test reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** it finds a table with a row for the default branch and a row for another branch, and a column each for a number, an idea and nothing

### Requirement: Each part ends by saying what comes next
Every part but *End of the run* SHALL end with a line that starts `Next:`. The line SHALL link the part or parts that can follow, and give the condition for each when there is more than one. A procedure that a part runs, such as *Find the source of demand*, *Confirm the packet* or *Claim*, SHALL say that it returns to the part that ran it, and SHALL have no `Next:` line. *End of the run* SHALL say that the run is over.

#### Scenario: Route says what comes next
- **WHEN** the skill-interfaces test reads the *Route* section of `skills/lets-go/SKILL.md`
- **THEN** its last non-empty line starts `Next:` and links `#enter-the-branch`

#### Scenario: A part without a Next line
- **WHEN** a skills folder holds `lets-go/SKILL.md` whose *Set the level* section ends with no `Next:` line
- **THEN** the check fails, and its output names `Set the level`

#### Scenario: Check the issue goes to shape or to route
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** its `Next:` line links `#run-the-shape-step` and `#route`, each with its condition

### Requirement: lets-go refers to no step by its number
`skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` SHALL refer to another part of the skill by its name and a link, never by a step number. Outside fenced code blocks and inline code spans, no text SHALL match the word `step` or `steps` followed by a number, in any case. So the skill SHALL not say `*Start* step 3`, `*Claim* step 2`, `Step 3 of [Run a step](#run-a-step)` or `go on to step 4`. The shape prompt SHALL name `lets-shape`'s steps by their bold titles, **Find or create the issue** and **Confirm, then write**, not by their numbers. A numbered list SHALL still number its items.

#### Scenario: No step numbers
- **WHEN** the skill-interfaces test reads `lets-go`, outside code
- **THEN** it finds no `step` or `steps` followed by a number

#### Scenario: A step number comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with the line `Go on from *Claim* step 3.`
- **THEN** the check fails, and its output names `SKILL.md` and `step 3`

#### Scenario: A numbered list
- **WHEN** a section of `lets-go` holds a list numbered `1.` to `4.`
- **THEN** the step-number check passes

#### Scenario: The shape prompt names lets-shape's steps
- **WHEN** the skill-interfaces test reads *What shape runs* in `lets-go`
- **THEN** it finds `**Find or create the issue**` and `**Confirm, then write**`

### Requirement: Every link inside lets-go names one of its headings
Each link in `skills/lets-go/SKILL.md` to a place in the same file, written `](#<anchor>)` outside code, SHALL match the anchor GitHub makes from one of the file's headings: the heading's text in lower case, with each space made a hyphen, and every character other than a letter, a digit, a hyphen or an underscore dropped. The skill-interfaces check SHALL fail on a link that matches no heading, and SHALL name the anchor.

#### Scenario: Every link resolves
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** every `](#...)` link outside code matches one of its headings, such as `#enter-the-branch` for `## Enter the branch` and `#the-changes-name` for `### The change's name`

#### Scenario: A link to a heading that is gone
- **WHEN** a skills folder holds `lets-go/SKILL.md` with a link `[Start](#start)` and no heading `Start`
- **THEN** the check fails, and its output names `#start`

### Requirement: The Project query runs once per run
*Find the source of demand* SHALL run its Project query only the first time it runs in a run. When an earlier pass in the same run has set `<project>`, `<owner>` and `<repo>`, a later pass SHALL use them, and SHALL not run the query again. This holds for the pass after `next` picks an issue, the pass after a shape step, the pass after *Pick the first ready story*, and the pass after a lost claim.

#### Scenario: Next, then the named issue
- **WHEN** `lets-go` runs with nothing on the default branch, `next` picks #149, and *Check the issue* runs *Find the source of demand* for #149
- **THEN** the Project query has run once in the run

#### Scenario: The rule is in the section
- **WHEN** the skill-interfaces test reads *Find the source of demand* in `lets-go`
- **THEN** it says to run the Project query only when `<project>` is not set yet in this run

## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Claim* sets the issue's Status with `gh project item-edit`, so `lets-go` sets that field itself. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. When a blocker is open, `lets-go` SHALL look for the change's branch before it stops. When the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue, and the prerequisite stop SHALL stand: an unresolved owner or checkpoint is reported, and the run stops. When no such branch exists, `lets-go` SHALL say which open issues block it, and stop. The named-issue case of *Find the source of demand* SHALL make no blocker stop of its own, because the blocker read has decided. When *Find the source of demand* passes, the part that ran it SHALL say what comes next, not the section. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when none matches, the case's stop, to run `lets-shape`, SHALL be set aside: the shape step runs for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* finds that another session took an issue `next` picked, `lets-go` SHALL run `next` again with the same candidates. It SHALL go on from its blocker read with the new issue. On the default branch, when *Confirm the packet* stops with a remedy of running `lets-shape` on #<i>, that stop SHALL be set aside too: the shape step runs for #<i>. It SHALL be set aside once per run: after a shape step, the stop stands. On a change's branch, that stop SHALL stand, because the shape step runs only before any branch exists. The Epic stop SHALL stand. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

- `lets go level`, run once when it reads the request, as *lets-go picks the interactivity level and says why* says;
- `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `git branch --show-current`, run once after it, to find the default branch and the current one;
- `title` beside `blockedBy` in the blocker read above;
- `gh issue view <i> --json createdAt`, run only when the issue's `lastEditedAt` is null;
- the issue search of *lets-go takes one issue number or an idea*;
- `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`, to find the change's branch, and the fetch, switch and fast-forward above;
- the Git and GitHub reads of *lets-go walks the step table*, *A skipped step's line carries its evidence and date* and *Review plan runs as a step, or is not in the route*. These include the reads of `lets-review-plan`'s *Check an earlier review*, which tell whether review plan is done;
- the in-progress parent query of *A stopped discovery resumes from its parent issue*, run only for an idea;
- the `git status --porcelain` before the shape step, and the commit of `openspec/discovery.md`, that *lets-go commits the discovery map on the story's branch* says.

No part SHALL be a step: the parts before the walk SHALL run no `lets delegate step` command of their own, beside *Run the shape step*, and SHALL produce no step report. The shape step that *Run the shape step* runs is a step, and has a report.

#### Scenario: The skill names the sections
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as headings of `lets-go`. It finds `gh issue view <i> --json createdAt`, `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` and `gh project item-edit`, and no section named as `lets-build`'s

#### Scenario: A lost race on next
- **WHEN** `lets-go` ran alone, `next` picked #149, and *Claim* finds that #149 has an assignee
- **THEN** `lets-go` runs `next` again over the same candidates, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

#### Scenario: The branch exists
- **WHEN** `lets-go` runs for #149 on the default branch, and `origin` has a branch `lets-go-chore`
- **THEN** `lets-go` does not run *Claim*, switches to `lets-go-chore`, fetches it, and walks the step table there

#### Scenario: A stale local branch
- **WHEN** the local branch `lets-go-chore` is two commits behind `origin/lets-go-chore`, and has no commit of its own
- **THEN** `lets-go` fast-forwards it before it reads the change state

#### Scenario: Claim fails
- **WHEN** *Claim* finds that someone else has the issue
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
- **WHEN** the skill-interfaces test reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it finds `gh issue view <i> --json title,blockedBy` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

#### Scenario: The search finds the same work
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, the search finds `#181 lets-sync-quiet — lets sync takes a --quiet flag`, and the user says it is the same work
- **THEN** `lets-go` takes `#181` as `<i>`, runs no shape step for the idea, and goes on to the blocker read

#### Scenario: The search finds other work
- **WHEN** the search finds one issue and the user says it is not the same work
- **THEN** `lets-go` runs the shape step for the idea, and does not say to run `lets-shape`

#### Scenario: A packet with unread comments
- **WHEN** *Confirm the packet* finds two comments after the watermark on #180
- **THEN** `lets-go` runs the shape step for #180 instead of stopping

#### Scenario: The pick names next
- **WHEN** the shape step reports an epic and three stories
- **THEN** `lets-go` runs its own `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

### Requirement: Each step runs through lets delegate step
`lets-go` SHALL run shape, when it is needed, then plan, review plan, build and review build, in that order. It SHALL run shape when *Check the issue* or *Start from an idea* sends the run to *Run the shape step*, before the walk. It SHALL run each other step when the walk of *lets-go walks the step table* reaches its row and finds it not done. For each step it SHALL write the prompt to `.workspace/lets-go/<session>-prompt.md`. `<step>` is `shape`, `plan`, `review-plan`, `build` or `review-build`. `<session>` is the step's session label: `<name>-<step>`, where `<name>` is the change's name, for every step but shape. For the shape step, it is `<shape-name>-shape`, where `<shape-name>` is `issue-<i>` or `idea-<slug>`, as *The shape step shapes an idea or an unshaped issue* says. It SHALL run `lets delegate step instructions --for <step>` and read `options` and `guidance`. It SHALL rank the options by the guidance first, then the order the options came in. It SHALL leave out a model the guidance rules out. The guidance SHALL only rank and filter the listed models. When `options` is empty, it SHALL pass its own family as the one model. It SHALL then run `lets delegate step run --for <step> --name <session> --prompt-file <that file> --effort high`, with one `--model` per ranked option, best first. `.workspace/lets-go/<session>-answers.yaml` can exist before the step's first round. When it holds at least one pair, that round SHALL add `--answers-file` with that file, as a resumed round does. An empty or unreadable answers file SHALL count as absent. Stdout SHALL go to `.workspace/lets-go/<session>-report.json` and stderr to `.workspace/lets-go/<session>-meta.txt`. When `step instructions` exits non-zero, or `step run` exits non-zero other than 3, it SHALL show the user the command's stderr and stop.

#### Scenario: The skill names both commands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds `lets delegate step instructions --for <step>`, `lets delegate step run --for <step>`, `delegate.step.<step>.guidance`, `the guidance first, then the order the options came in`, `The guidance only ranks and filters the listed models` and `When \`options\` is empty, pass your own family`

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

### Requirement: A run ends on done, failed, or a repeated question
`lets-go` SHALL run a step's rounds until its report is `done` or `failed`. When a `needs-input` report holds a question that is already in the answers file, `lets-go` SHALL stop, say the step asked a settled question again, and show the report. *Read the report* SHALL handle a failed shape step before any other failed step. For a failed shape step there is no branch: `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch and print no pull request URL. On a `failed` report from any other step it SHALL show the reason, name the step and the branch, and stop. It SHALL say that running `lets-go` again on the branch carries on from the first unfinished step. It SHALL print the pull request's URL only when the branch has a pull request. When it has none, it SHALL print no URL, and SHALL say that the branch has no pull request yet. It SHALL not run a failed step again in the same run.

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
- **WHEN** the skill-interfaces test reads *Read the report* in `skills/lets-go/SKILL.md`
- **THEN** the case for a failed shape step comes before the case for any other failed step

### Requirement: lets-go walks the step table
After *Set the level*, on the change's branch, `lets-go` SHALL read the records Git and GitHub keep, in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Then `lets-go` SHALL walk the step table from the top: plan, review plan, build, review build. The step table SHALL have no row for shape: shape runs before the walk, in *Run the shape step*, and *Check the issue* prints its `Skipped shape` or `Done shape` line. When the walk reaches a row, it SHALL read whether that step is done. The plan row and the build row each read the change state when the walk reaches them: `openspec instructions apply --change <name> --json`, run when `openspec/changes/<name>/` exists and there is no archive folder. Plan is done when the `state` is `ready` or `all_done`, or the archive folder exists. Build is done when the `state` is `all_done`, or the archive folder exists. The build row SHALL read the state again, even when the plan row read it, because a review plan round can add a task. Any `state` other than `blocked`, `ready` or `all_done` SHALL show the CLI's `instruction` and stop. Review plan is done as *Review plan runs as a step, or is not in the route* says. Review build is done when the archive folder exists. A done step SHALL print its line, as *A skipped step's line carries its evidence and date* says. An unfinished step SHALL run, as *Each step runs through lets delegate step* says. Its report SHALL be read as *A run ends on done, failed, or a repeated question* says. After a `done` report, the walk SHALL go on to the next row. `lets-go` SHALL read a row's record when it reaches the row, not before, because a step run in this round changes the records the next row reads.

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

### Requirement: Each placeholder in lets-go names one thing
`skills/lets-go/SKILL.md` SHALL hold a `## Placeholders` section after the overview of its parts and before the first part. It SHALL hold a table with one row for each placeholder the skill uses, in `SKILL.md` or in a file in `skills/lets-go/references/`: the placeholder, the one thing it stands for, and where the run sets it. Each placeholder SHALL have one row, and SHALL name one thing everywhere in the skill. One thing SHALL have one placeholder. The names SHALL be these:

- `<project>` is the number of the Project linked to the repository. `<owner>` is its owner, and `<repo>` the repository, as `owner/name`.
- `<i>` is the run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. `<issue-url>` is its URL.
- `<parent>` is a parent issue: an epic that discovery filed, or a discovery in progress.
- `<story>` is one story that a shape step's report names.
- `<pr>` is the change's pull request.
- `<name>` is the change's name, the part of `<i>`'s title before ` — `. On a change's branch it is `<branch>`. *Check the issue* sets it from the blocker read's title, so after a shape step it is set again from the shaped issue's title.
- `<shape-name>` is the shape step's name: `issue-<i>` or `idea-<slug>`.
- `<session>` is a step's session label: `<name>-<step>` for plan, review plan, build and review build, and `<shape-name>-shape` for shape.
- `<idea>` is the idea in the user's words.

Neither `SKILL.md` nor any reference file SHALL hold `<n>`, `<p>`, `<url>`, `<issue URL>` or `<words>`. The table's *Where the run sets it* column SHALL name the part or section that sets each placeholder, never a step number.

#### Scenario: Every placeholder has a row
- **WHEN** the skill-interfaces test lists each distinct text in angle brackets that starts with a letter in `skills/lets-go/SKILL.md` and in each file in `skills/lets-go/references/`
- **THEN** each one is the first cell of exactly one row of the table under `## Placeholders` in `SKILL.md`

#### Scenario: A placeholder with no row
- **WHEN** an edit adds `<base>` to the skill and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: A placeholder with no row, in a reference file
- **WHEN** an edit adds `<base>` to `skills/lets-go/references/glossary-preflight.md` and adds no row for it
- **THEN** the test fails and names `<base>`

#### Scenario: The old names are gone
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and each file in `skills/lets-go/references/`
- **THEN** it finds none of `<n>`, `<p>`, `<url>`, `<issue URL>` and `<words>`

#### Scenario: The Project and the issue
- **WHEN** `lets-go` claims #197 on Project 6
- **THEN** it runs `gh project item-edit 6 --owner <owner> --url <issue-url> --field Status --value "In Progress"` with 6 as `<project>`, and never 197

#### Scenario: The change's name after shape
- **WHEN** the shape step ran as `issue-180-shape` and reported `done` with `issue #181: lets-sync-quiet — lets sync takes a --quiet flag`
- **THEN** `<name>` is `lets-sync-quiet`, and *Claim* creates the branch `lets-sync-quiet`, not `issue-180`

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. The checks that test reading order or a relative link SHALL read `SKILL.md` alone: the section of each part, the *Walk the step table* section, the order of the overview and the parts, the place of the `## Placeholders` section, the rule that `lets go level` comes before the first GitHub call, and the links to other skills' reference files.

#### Scenario: A fixed line that wraps in a reference file
- **WHEN** a skills folder holds `lets-go/SKILL.md` without `Records disagree:`, and `lets-go/references/records.md` holds `Records` at the end of one line and `disagree:` at the start of the next
- **THEN** the check that `lets-go` says `Records disagree:` passes

#### Scenario: A missing fixed line
- **WHEN** neither `SKILL.md` nor any reference file of `lets-go` holds `Records disagree:`
- **THEN** the check fails, and its output names `Records disagree:`

#### Scenario: A banned phrase in a reference file
- **WHEN** `SKILL.md` does not hold `VERDICT:`, and `lets-go/references/records.md` does
- **THEN** the check that `lets-go` does not say `VERDICT:` fails, and its output names `VERDICT:`

#### Scenario: The lost race
- **WHEN** the skill-interfaces test checks what `lets-go` does after another session claims the issue `next` picked
- **THEN** it checks for ``run `next` again with the same candidates``, and does not check for a step number

### Requirement: The step table check reads the step rows
The skill-interfaces check that `lets-go` keeps its steps in one table SHALL pass when the rows for `plan`, `review-plan`, `build` and `review-build`, each a line that starts ``| `<step>` |``, appear exactly once each, and all four sit in one table: one run of consecutive lines that start with `|`, in `SKILL.md` or in one file in `skills/lets-go/references/`. A `shape` row SHALL make the check fail, and its output SHALL name `shape`: shape runs before the walk. The check SHALL not pin the table's header line.

#### Scenario: The table as it stands
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, whose step table has a row for each of plan, review plan, build and review build
- **THEN** the step table check passes

#### Scenario: A table with a shape row
- **WHEN** the step table has rows for `plan`, `review-plan`, `build` and `review-build`, and one that starts ``| `shape` |``
- **THEN** the step table check fails, and its output names `shape`

#### Scenario: A table with no shape row and another header
- **WHEN** the step table's header is `| Step | Skill | Record | Skip line |`, and it has rows for `plan`, `review-plan`, `build` and `review-build` and none for `shape`
- **THEN** the step table check passes

#### Scenario: A step with two rows
- **WHEN** `lets-go`'s files hold two lines that start ``| `build` |``
- **THEN** the step table check fails, and its output names `build`

#### Scenario: Steps split across two tables
- **WHEN** the `plan` and `review-plan` rows sit in one table, and the `build` and `review-build` rows in another
- **THEN** the step table check fails

