## ADDED Requirements

### Requirement: An epic run prints its waves before the first pick
When *Start the epic run* has settled the stories that an earlier epic run finished, and before the first pick, `lets-go` SHALL run `lets backlog waves --only <keys>`, naming every story of the epic in this repository that is not settled yet, in the epic's order. It SHALL then print `Waves for #<parent>:`, and for each wave, in order, the line `Wave <n>: #<a>, #<b>`, naming the wave's stories by their `label`, in the order the command gives. After each wave's line but the first, it SHALL print one line for each story of that wave: `#<story> waits for #<other>: <reason>.`, where `#<other>` is the story's `waitsFor` label and `<reason>` is its `reason`, as the command prints them. It SHALL print the waves once in an epic run, even when there is only one wave. When every story is settled at the start, `lets-go` SHALL run no `waves` command and print no waves. On an error, it SHALL act as *A backlog error stops the run* says.

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
- **WHEN** the skill-interfaces test reads `skills/lets-go/references/epic-run.md`
- **THEN** it finds `lets backlog waves --only`, `Waves for #<parent>:` and `#<story> waits for #<other>: <reason>.` once each across the files of `lets-go`, under *Run the epic*, and the `waves` command comes after the stories an earlier run finished are settled and before *Pick the next story*

## MODIFIED Requirements

### Requirement: An epic run picks each story as next picks it
An epic run SHALL pick its stories one at a time with the `next` case of *Find the source of demand*. The current wave SHALL be the earliest wave, as *An epic run prints its waves before the first pick* found them, that holds a story not settled yet. The candidates SHALL be the current wave's stories that are not yet settled, and no other issue. `lets-go` SHALL pass the current wave's stories to `lets backlog ready` as `--only`, every story already settled as `--exclude`, every met story as `--met-blockers`, as *An epic run counts a blocker as met when its story's pull request is ready* says, and every story not settled yet that has its change's branch as `--started`, as *An epic run resumes the stories this user started* says, such as `lets backlog ready --only 280,281 --exclude 279 --met-blockers 279 --started 281`. With no story settled it SHALL pass no `--exclude`, with no met story no `--met-blockers`, and with no such branch no `--started`. A story is settled once the epic run has given it its line. The rank, *Check the prerequisite* and *Confirm the packet* on each candidate SHALL be those of `next`, so a story of a later wave SHALL not be picked while the current wave has a story not settled, whatever its Priority. A sub-issue in another repository SHALL not be passed in `--only`: its number can name an issue of this repository.

When the case returns `picked`, `lets-go` SHALL print `Picked #<i>: <title>, the next ready story under #<parent>.`, or the `Resumed` line for a story passed in `--started`. It SHALL then go on from the blocker read in *Check the issue* with that story as `<i>`, as for an issue number: *Check the issue*, *Route*, *Enter the branch* and *Set the question mode*, in this session. It SHALL then run the story's run in a child session, as *An epic run runs each story in a child session* says. When the story's run has ended with its pull request ready for review, `lets-go` SHALL settle the story with its line, as *The epic run settles a story from its child's report* says, run `git switch <default>`, and pick again. It SHALL rank the stories again for every pick, because a story built in this run can change what is ready.

When the case returns `nothing-ready`, every story of the current wave not yet settled SHALL get its `not built` line, in the epic's order. When a later wave holds a story not settled yet, `lets-go` SHALL pick again, from that wave. Otherwise the epic run SHALL end as *An epic run ends with one line per story* says.

#### Scenario: The first pick
- **WHEN** an epic run on #278 starts, nothing is settled, wave 1 holds only #279, `lets backlog ready --only 279` lists #279, and its prerequisite and packet pass
- **THEN** `lets-go` prints `Picked #279: epic-run-skeleton — lets-go on an epic with open stories builds each ready story in turn, and ends with one line per story, the next ready story under #278.`, reads #279's blockers, and runs *Claim* for it

#### Scenario: The next pick leaves out the settled stories
- **WHEN** the waves are `Wave 1: #279` and `Wave 2: #280, #281`, and the epic run has built #279 and settles it with its line
- **THEN** `lets-go` runs `git switch` to the default branch, then `lets backlog ready --only 280,281 --exclude 279`, with `--met-blockers 279` when #279's pull request is open and ready for review

#### Scenario: A started story in the pick
- **WHEN** an epic run on #278 starts, nothing is settled at the start, wave 1 holds #281 and #282, and only #282's change's branch `epic-run-resume` exists, on `origin`
- **THEN** the first pick runs `lets backlog ready --only 281,282 --started 282`

#### Scenario: A story of a later wave waits, whatever its Priority
- **WHEN** wave 1 holds #283, whose Priority is Could, and wave 2 holds #287, whose Priority is Must
- **THEN** the first pick runs `lets backlog ready --only 283`, and can pick only #283

#### Scenario: A wave with nothing ready
- **WHEN** the waves are `Wave 1: #283, #285` and `Wave 2: #286`, the epic run has built #285, #283 is blocked by #263, which is not a story of the epic, and `lets backlog ready --only 283,285 --exclude 285 --met-blockers 285` returns no issues
- **THEN** `lets-go` settles #283 with `#283 <story-name>: not built, blocked by #263`, then runs `lets backlog ready --only 286 --exclude 283,285 --met-blockers 285`

#### Scenario: The last wave with nothing ready
- **WHEN** the current wave is the last, and its pick returns `nothing-ready`
- **THEN** each story of that wave not settled yet gets its `not built` line, and the epic run goes to *End of the run*

#### Scenario: A candidate whose packet is not complete
- **WHEN** `lets backlog ready` lists #281 and #282, and *Confirm the packet* returns `needs-shape` for #281
- **THEN** `lets-go` picks #282, runs no shape step for #281, and #281 is not settled yet

#### Scenario: A sub-issue in another repository
- **WHEN** the epic's open sub-issues are #279 and `other-org/tools#5`
- **THEN** `lets-go` passes `--only 279`, and `other-org/tools#5` gets `not built, in another repository`

#### Scenario: The story runs in a child session
- **WHEN** the epic run has claimed #279 and entered its branch `epic-run-skeleton`
- **THEN** `lets-go` runs `lets delegate step run --for story` for #279, and walks none of #279's steps in its own session

#### Scenario: No child session
- **WHEN** the epic run builds #279, and `lets delegate step run --for story` exits 3
- **THEN** the epic run walks #279's step table in its own session, and runs each step as *Run a step* says, as *With no child session, the epic run walks the story itself* says

### Requirement: An epic run counts a blocker as met when its story's pull request is ready
In an epic run, an open blocker SHALL count as met only when all of these hold:

- it is one of the epic's stories, in this repository;
- its change's pull request is open and not a draft: it is ready for review;
- that pull request's head branch is in this repository, not a fork: its branch is on `origin`.

It SHALL not matter whether this epic run or an earlier one built the blocker. The blocker's change's name is the part of its title before ` — `, or the whole title when it has none. Its pull request is the open one whose head branch has that name and whose `isCrossRepository` is false. A blocker whose pull request is a draft, a blocker whose only pull request with that head branch comes from a fork, a blocker with no open pull request, and a blocker that is not one of the epic's stories SHALL not count as met. Before each pick, `lets-go` SHALL read the open pull requests once, with `gh pr list --state open --limit 1000 --json number,url,isDraft,headRefName,isCrossRepository`, and SHALL find the met stories from that one read. A met story's branch and pull request are the ones that read found: *An epic run stacks a story on its met blocker* uses them.

#### Scenario: A blocker built in this run
- **WHEN** an epic run on #278 whose waves are `Wave 1: #279` and `Wave 2: #280, #281` has built #279, whose pull request #290 from the branch `epic-run-skeleton` is open and ready for review, and #280's only open blocker is #279
- **THEN** the next pick runs `lets backlog ready --only 280,281 --exclude 279 --met-blockers 279`, and can pick #280

#### Scenario: A blocker built in an earlier run
- **WHEN** an epic run on #278 starts, #279 is open and assigned, and its pull request from `epic-run-skeleton` is open and ready for review
- **THEN** the first pick passes `--met-blockers 279`, though this run did not build #279

#### Scenario: A blocker whose pull request is a draft
- **WHEN** #279's pull request is a draft, and #280's only open blocker is #279
- **THEN** the pick passes no `--met-blockers 279`, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A blocker whose pull request comes from a fork
- **WHEN** #280's only open blocker is #279, and the only open pull request whose head branch is `epic-run-skeleton` comes from a fork, so its `isCrossRepository` is true
- **THEN** the pick passes no `--met-blockers 279`, and #280's line is `#280 epic-run-stacks: not built, blocked by #279`

#### Scenario: A blocker outside the epic
- **WHEN** #283's only open blocker is #263, which is not a story of #278, and #263 has an open pull request ready for review
- **THEN** the pick does not pass #263 in `--met-blockers`, and #283's line is `#283 <story-name>: not built, blocked by #263`
