## RENAMED Requirements
- FROM: `### Requirement: A failure or a stop ends the epic run at that story`
- TO: `### Requirement: A failure or a stop skips only the stories that depend on it`

## MODIFIED Requirements

### Requirement: A failure or a stop skips only the stories that depend on it
While an epic run is on a story, from its pick to its line, a stop SHALL end that story's run, and not the epic run. This holds the same way for every stop of the parts and procedures the story runs through: a failed step, records that disagree, a pull request that is merged or closed, a stop of *Check the prerequisite*, a failed claim write, a `lets backlog` error, a `fetch-failed` from *Stack the story*, and every other stop. The lost claim of *A lost claim drops the issue, and three lost claims stop the run* is unchanged: it settles the story with `not built, taken by <login>` and picks again. A stop between stories, such as a `lets backlog` error in a pick, SHALL still end the epic run, as *A backlog error stops the run* says.

On a stop in a story run, `lets-go` SHALL act in this order:

1. Do what the stop says, such as print the `Failed` line and the pull request's URL.
2. Settle the story with `failed at <step name>: <reason>` for a failed step, or `stopped: <reason>` for any other stop. The story is `<failed>` from here on.
3. Check the checkout. When it holds uncommitted changes outside `.workspace/`, staged, unstaged or untracked, the epic run SHALL end at that story. Each story the run had not settled SHALL get `not built, the epic run stopped at #<stopped-story>`, in the epic's order, where `<stopped-story>` is `<failed>`. `lets-go` SHALL leave the changes as they are, print every line, as *End of the run* does, and stop.
4. Otherwise settle each dependent of `<failed>`, in the epic's order, with `not built, it depends on #<failed>, which did not finish`, right after `<failed>`'s own line. A dependent is a story of the epic, in this repository and not settled yet, whose open blockers include `<failed>`, or include another dependent, through any number of stories. Only "blocked by" links between the epic's own stories that are not settled yet count: a link through an issue outside the epic, or through a settled story, does not make a story a dependent. The line names `<failed>` itself, even when the dependence goes through other stories.
5. Run `git switch <default>`, and pick the next story, as *An epic run picks each story as next picks it* says. Every story settled in steps 2 and 4 is passed in `--exclude`, so none of them is picked. When `git switch` fails, `lets-go` SHALL say Git's error, and end the epic run as step 3 says.

`lets-go` SHALL not retry a failed step in the same run. Running `lets-go` again on the failed story's branch carries on, as for any run. The end of an epic run SHALL print no count of built, failed or skipped stories: the per-story lines are its summary.

`<stopped-story>` and `<failed>` are different placeholders from `<story>`, the story the line is for.

The rule's text SHALL appear once, under the heading *A stop in an epic run* in `references/epic-run.md`. Each stop keeps its own text. Each section that holds a stop a story can reach SHALL link the rule, next to its stops, as each `lets backlog` call links *Backlog errors*: *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions* in `SKILL.md`, and *Records that disagree* in `references/records.md`. The sentence after the overview that says any part stops on a `lets backlog` error SHALL link the rule too, and SHALL say that a stop in a story run ends only that story.

#### Scenario: A failed build
- **WHEN** an epic run on #278 has built #279, the build step of #391 reports `failed` with the reason `tests fail on main`, #392 is blocked by #391, #393 is blocked by #392, #394 has no open blocker, and the checkout has no uncommitted changes outside `.workspace/`
- **THEN** `lets-go` prints `Failed build: tests fail on main` and the rest of what *Read the report* says, then the lines `#391 <story-name>: failed at build: tests fail on main`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#393 <story-name>: not built, it depends on #391, which did not finish`, in that order, runs `git switch` to the default branch, and runs the next pick with `--exclude` naming #279, #391, #392 and #393, which can pick #394

#### Scenario: Records that disagree
- **WHEN** the walk of #391 finds that the records disagree, no story of the epic is blocked by #391, and the checkout is clean outside `.workspace/`
- **THEN** #391's line is `#391 <story-name>: stopped: ` followed by the disagreement, no story gets a `depends on` line, and the epic run picks again

#### Scenario: A failed claim write
- **WHEN** *Claim* for #391 returns `claim-failed`, and the checkout is clean outside `.workspace/`
- **THEN** `lets-go` shows what *Claim* says for `claim-failed`, settles #391 with `#391 <story-name>: stopped: ` followed by the reason, and picks again

#### Scenario: Uncommitted changes after a failure
- **WHEN** the build step of #391 reports `failed`, and `git status` shows a modified file `skills/lets-go/SKILL.md` that is not committed
- **THEN** #391's line is `#391 <story-name>: failed at build: <reason>`, each story not settled gets a line such as `#394 <story-name>: not built, the epic run stopped at #391`, `lets-go` prints every line, runs no `git switch` and picks no other story, and the modified file is still there

#### Scenario: Changes only in .workspace
- **WHEN** the build step of #391 reports `failed`, and the only uncommitted files are under `.workspace/`
- **THEN** the epic run settles #391's dependents and picks again

#### Scenario: A link through an issue outside the epic
- **WHEN** the build step of #391 fails, and #395, a story of the epic, is blocked only by #263, which is not a story of the epic and is blocked by #391
- **THEN** #395 gets no `depends on` line when #391 settles, and gets its own line later, such as `#395 <story-name>: not built, blocked by #263`

#### Scenario: A stop between stories
- **WHEN** the epic run has settled #391 after a failure, and the next `lets backlog ready` returns an error
- **THEN** `lets-go` stops as *Backlog errors* says, and picks no other story

#### Scenario: The rule is written once
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/epic-run.md`
- **THEN** it finds `not built, the epic run stopped at #<stopped-story>`, `not built, it depends on #<failed>, which did not finish` and `failed at <step name>: <reason>` once each across the files of `lets-go`, all under the heading *A stop in an epic run*

#### Scenario: Each section with a stop links the rule
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `skills/lets-go/references/records.md`
- **THEN** it finds a link to `epic-run.md#a-stop-in-an-epic-run` in the overview's sentence on `lets backlog` errors, in each of *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions*, and in *Records that disagree*

#### Scenario: A section with a stop that does not link the rule
- **WHEN** a skills folder holds a `lets-go` whose *Run a step* has no link to `epic-run.md#a-stop-in-an-epic-run`
- **THEN** the check fails, and its output names `Run a step`

### Requirement: An epic run ends with one line per story
An epic run SHALL end with one line for every story the epic had when the run started, in the order the run settled them. `lets-go` SHALL print each story's line as it settles the story, and SHALL print every line again, in order, in *End of the run*. `<story-name>` is the part of the story's title before ` — `, or the whole title when it has none. A line SHALL take one of these forms:

- A built story: `#<story> <story-name>: <pr-url>`, the URL of its pull request. A built story that the epic run stacked on a blocker SHALL end its line with `, stacked on #<blocker>`, such as `#280 epic-run-stacks: <pr-url>, stacked on #279`. The lines then show the merge order: a stacked story's pull request merges after its blocker's.
- A story not built: `#<story> <story-name>: not built, <reason>`. The reason SHALL say why, such as `blocked by #279`, `blocked by #284 and #285, on different branches`, `assigned to octocat`, `taken by octocat`, `its packet is not complete`, `its glossary prerequisite is unresolved`, `in another repository`, `it depends on #391, which did not finish` or `the epic run stopped at #391`. For a story `lets backlog ready` did not list, `lets-go` SHALL read why with `lets backlog item <story>`, as *Pick the first ready story* does: an open blocker, an assignee, or its Status, Kind or Priority.
- A story whose step failed: `#<story> <story-name>: failed at <step name>: <reason>`, with the step's name in plain words, as its `Failed` line names it.
- A story whose walk stopped for another reason: `#<story> <story-name>: stopped: <reason>`.

#### Scenario: Two built, one blocked
- **WHEN** an epic run on #278 builds #279 and then a story #391, and #283 is blocked throughout by #263, which is not a story of #278
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#391 <story-name>: <pr-url>`, then `#283 <story-name>: not built, blocked by #263`

#### Scenario: A stacked story's line
- **WHEN** an epic run on #278 builds #279, then builds #280 stacked on #279
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, then `#280 epic-run-stacks: <pr-url>, stacked on #279`

#### Scenario: An assigned story
- **WHEN** #282 is assigned to `octocat` when the epic run starts
- **THEN** its line is `#282 epic-run-resume: not built, assigned to octocat`

#### Scenario: Each line prints as the story settles
- **WHEN** the epic run settles #279 with its pull request URL, and goes on to pick another story
- **THEN** `lets-go` prints #279's line before it prints the next `Picked` line

#### Scenario: Built, failed and skipped stories together
- **WHEN** an epic run on #278 builds #279, the build of #391 fails with `tests fail on main`, #392 is blocked by #391, and the run then builds #394
- **THEN** *End of the run* prints `#279 epic-run-skeleton: <pr-url>`, `#391 <story-name>: failed at build: tests fail on main`, `#392 <story-name>: not built, it depends on #391, which did not finish` and `#394 <story-name>: <pr-url>`, in that order, and no count line
