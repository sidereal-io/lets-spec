## MODIFIED Requirements

### Requirement: Review plan is reported as not in the route
When the schema is `lets-minimal`, `lets-go` SHALL print `Skipped review plan: not in the lets-minimal route.` after the plan step is done, and before the build step. That line SHALL carry no date. Review plan SHALL not run as a step of its own. When the schema is not `lets-minimal`, it runs inside the build step: `lets-build`'s *Apply* has the plan reviewed before it builds, and the review is recorded in the pull request description under **Plan review**. When build is done, `lets-go` SHALL print a review plan line before build's line. Its evidence is `the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.` `<p>` SHALL be the pull request's number. `<sha>` and `<verdict>` SHALL come from the **Plan review** section of the pull request's body, read with `gh pr view <name> --json number,body` after the build step, or from the body read in *lets-go finds the first unfinished step* when build was done before this run: `<sha>` from the section's `Reviewed: <sha>` line, and `<verdict>` from its `**Verdict:**` line. `<date>` SHALL be `<sha>`'s author date, as `YYYY-MM-DD`, from `git log -1 --format=%as <sha>`. When the build step reported `done` in this run, the line SHALL start `Done review plan:`. When build was done before this run, it SHALL start `Skipped review plan:`. The schema SHALL be the `schema:` line of the change's `.openspec.yaml` when the change folder exists, and the route's schema when it does not.

#### Scenario: A chore's route
- **WHEN** the schema is `lets-minimal` and the plan step reports `done`
- **THEN** `lets-go` prints `Skipped review plan: not in the lets-minimal route.` and goes on to build

#### Scenario: A review that ran in this run
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, the build step reported `done` in this run, pull request #167's **Plan review** section says `Reviewed: 7d16565` and `**Verdict:** APPROVE_WITH_CHANGES`, and `git log -1 --format=%as 7d16565` prints `2026-11-03`
- **THEN** `lets-go` prints `Done review plan: the Plan review in pull request #167 says APPROVE_WITH_CHANGES for 7d16565, committed 2026-11-03.` before `Done build:`

#### Scenario: A schema with a review
- **WHEN** the change's `.openspec.yaml` says `schema: lets-standard`, build was done before this run, and pull request #167's **Plan review** section says `Reviewed: 7d16565` and `**Verdict:** APPROVE`, and `git log -1 --format=%as 7d16565` prints `2026-11-03`
- **THEN** `lets-go` prints `Skipped review plan: the Plan review in pull request #167 says APPROVE for 7d16565, committed 2026-11-03.`

### Requirement: Review build ends the run
The review build step SHALL run `lets-build`'s *Finish the change*: the project's finishing rules, verify, archive, and marking the pull request ready. When it reports `done`, or when *lets-go finds the first unfinished step* found every step done, `lets-go` SHALL print one line per step, in order. A skipped step prints its skip line from *A skipped step's line carries its evidence and date*. A done step prints `Done`, the step's spoken name, a colon, the report's `date` and its evidence: `Done build: <date>. <evidence>`. Review plan prints the line *Review plan is reported as not in the route* sets. A failed step prints `Failed`, the spoken name, a colon and the reason: `Failed review build: <reason>`. The spoken name has a space, never a hyphen. `lets-go` SHALL then print the pull request's URL and stop. It SHALL keep no state of its own outside `.workspace/`, and SHALL need none: without its files in `.workspace/lets-go/`, a run reaches the same step.

#### Scenario: A finished run
- **WHEN** review build reports `done` with evidence `archive commit 9a1b2c3` and `pull request #167 ready`
- **THEN** `lets-go` prints a line for shape, plan, review plan, build and review build, then the pull request's URL

#### Scenario: A finished run on lets-standard
- **WHEN** the build step ran in this run on `lets-standard`, and review build reports `done`
- **THEN** the third line starts `Done review plan: the Plan review in pull request #`

#### Scenario: Every step was already done
- **WHEN** Start finds the archive folder `openspec/changes/archive/2026-11-04-lets-go-chore`, and pull request #167 is ready for review with a `Code review` section
- **THEN** `lets-go` runs no step, prints five `Skipped` lines, then the pull request's URL

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md` SHALL hold these strings, so the skill-interfaces test can check them:

- `Skipped shape: #<i>'s packet is complete, last edited <date>.`
- `Done shape: <date>. <evidence>`
- `Done plan: <date>. <evidence>`
- `Done build: <date>. <evidence>`
- `Done review build: <date>. <evidence>`
- `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).`
- `Skipped review plan: not in the lets-minimal route.`
- `Skipped review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.`
- `Done review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.`
- `Skipped build: every task is ticked, last task commit <date> (<sha>).`
- `Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review with a Code review section.`
- `Records disagree:`
- `Interactivity: <level>, because #<i> is a <Kind>.`
- `Interactivity: <level>, because you asked for it.`
- `Interactivity: ask, because shape has not run yet.`
- `Interactivity: <level>, because your lets config sets go.level.`
- `lets go level`
- `issue #<n>: <title>`
- `epic #<p>: <title>`
- `story #<n>: <title>`
- `Run discovery on it?`
- `Picked #<n>: <title>, the first ready story under #<p>.`
- `docs: the discovery map from #<p>`
- `Discovery status: in-progress`
- `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`
- `*Resume mode*`
- `issue-<i>`
- `idea-<slug>`
- `openspec instructions apply --change <name> --json`
- `git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md`
- `git log -1 --format=%as <sha>`
- `gh pr view <name> --json number,body`
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

It SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`, SHALL not say that `lets-go` takes chores only, SHALL not say that `lets-go` needs an issue number on the default branch, SHALL not say that review plan runs inside plan, and SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

### Requirement: lets-go finds the first unfinished step
After Start, on the change's branch, `lets-go` SHALL find the first unfinished step from the records Git and GitHub keep, and SHALL run the steps from there. It SHALL read the records in this order. First, `git status --porcelain`: a line for a path outside `.workspace/` is a disagreement. Second, the pull request for the branch, with `gh pr view <name> --json number,url,state,isDraft,body`. A missing pull request is noted, not a stop. Third, the archive folder, whose whole name is `<YYYY-MM-DD>-<name>` in `openspec/changes/archive/`. When it exists, every step is done. Fourth, `openspec instructions apply --change <name> --json`, read as `lets-build`'s *Find where you are* reads it. No change folder, or `state` `blocked`, means plan is the first unfinished step. `ready` means build. `all_done` means review build. Any other `state` SHALL show the CLI's `instruction` and stop. Shape SHALL count as done when *Confirm the packet* passed. Review plan SHALL count as done when build is done: on a schema other than `lets-minimal`, it runs inside build.

#### Scenario: A branch with no change
- **WHEN** the branch `lets-go-chore` has no `openspec/changes/lets-go-chore/` folder and no archive folder
- **THEN** the first unfinished step is plan, and `lets-go` prints only the shape skip line before it

#### Scenario: A plan in progress
- **WHEN** `openspec instructions apply --change lets-go-chore --json` says `blocked`
- **THEN** the first unfinished step is plan

#### Scenario: A ready plan
- **WHEN** the state is `ready`
- **THEN** the first unfinished step is build, and `lets-go` prints the shape and plan skip lines before it, and review plan's line after build reports `done`

#### Scenario: Every task ticked
- **WHEN** the state is `all_done`
- **THEN** the first unfinished step is review build, and `lets-go` prints four skip lines before it

#### Scenario: An archived change
- **WHEN** `openspec/changes/archive/2026-11-04-lets-go-chore` exists, and no `openspec/changes/lets-go-chore/` folder does
- **THEN** every step is done, and `lets-go` runs none

#### Scenario: A name that ends another change's name
- **WHEN** the change is `go-chore`, and the archive holds `2026-11-04-lets-go-chore` and no folder `<YYYY-MM-DD>-go-chore`
- **THEN** `lets-go` finds no archive folder for `go-chore`

### Requirement: Records that disagree stop the run
When the records disagree, `lets-go` SHALL print `Records disagree:` and what it found, say what to fix by hand, and stop before any step. It SHALL repair nothing. These are disagreements:

- `git status --porcelain` lists a path outside `.workspace/`;
- the local branch and `origin/<name>` have diverged;
- a change folder and an archive folder exist for the same name;
- an archive folder exists but the pull request is missing, is a draft, or has no `Code review` section;
- `openspec/changes/<name>/brainstorm.md` is committed but the branch has no open pull request;
- a `git log` read for a skipped step finds no commit;
- build is done on a schema other than `lets-minimal`, but the pull request's body has no **Plan review** section with a `Reviewed:` line and a `**Verdict:**` line.

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
- **THEN** `lets-go` prints no disagreement, and the first unfinished step is plan

#### Scenario: A built change with no plan review
- **WHEN** the state is `all_done`, the change's `.openspec.yaml` says `schema: lets-standard`, and the pull request's body has no **Plan review** section
- **THEN** `lets-go` prints `Records disagree:`, says the change is built but its pull request has no Plan review section, and runs no step
