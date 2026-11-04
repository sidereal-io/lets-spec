## MODIFIED Requirements

### Requirement: lets-go picks the interactivity level and says why
Before it first picks the level, `lets-go` SHALL run `lets go level` from the repo root, once per run. When the command exits non-zero, `lets-go` SHALL show the user its stderr and stop, and run no step. Otherwise `lets-go` SHALL pick the level in this order: the level the user named in the request that started the run; else the `level` the command printed, when it is not `null`; else the Kind's default, `recommend` for a Chore or a Bug and `ask` for a Story. It SHALL print the line for the source it used: `Interactivity: <level>, because you asked for it.` for the request's, `Interactivity: <level>, because your lets config sets go.level.` for the config's, and `Interactivity: <level>, because #<i> is a <Kind>.` for the Kind's. Before a shape step, the Kind is not settled. The level for the shape step SHALL be the request's, when named; else the config's, when set; else `ask`, and the line SHALL then read `Interactivity: ask, because shape has not run yet.` After the shape step, `lets-go` SHALL pick the level again, in the same order, and print its line. `lets-go` SHALL never ask the user which level to use. The level SHALL hold for the whole run and SHALL not be kept for a later run. It SHALL put the level, and what it means for the step, into every step prompt.

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

#### Scenario: The config sets the level
- **WHEN** the `lets` config holds `go.level: recommend`, issue `#152` is a Story, the user named no level, and Start has passed
- **THEN** `lets-go` prints `Interactivity: recommend, because your lets config sets go.level.` before it runs propose, and relays at `recommend`

#### Scenario: The request's level beats the config's
- **WHEN** the `lets` config holds `go.level: recommend`, and the user runs `lets-go` for `#152`, a Story, and says `ask`
- **THEN** `lets-go` prints `Interactivity: ask, because you asked for it.`

#### Scenario: The config's level before shape
- **WHEN** the `lets` config holds `go.level: recommend`, and the user runs `lets-go add a --quiet flag to lets sync` without naming a level
- **THEN** `lets-go` prints `Interactivity: recommend, because your lets config sets go.level.` before the shape step, and again before propose

#### Scenario: The config holds no level
- **WHEN** `lets go level` prints `{"level":null}`, issue `#152` is a Story, and the user named no level
- **THEN** `lets-go` prints `Interactivity: ask, because #152 is a Story.`

#### Scenario: lets go level fails
- **WHEN** the `lets` config holds `go.level: loud`, and the user runs `lets-go` for `#152`
- **THEN** `lets-go` shows the user the command's stderr, which names `go.level`, and runs no step

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

It SHALL not hold `#152 adds`, `#153 adds` or `#154 adds`, SHALL not say that `lets-go` takes chores only, SHALL not say that `lets-go` needs an issue number on the default branch, and SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`
- **THEN** it finds every string this requirement lists, and does not find `#152 adds`, `#153 adds` or `#154 adds`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`
