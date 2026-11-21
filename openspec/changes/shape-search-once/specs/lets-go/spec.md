<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The prose holds the fixed lines the tests check
`skills/lets-go/SKILL.md`, or a file in `skills/lets-go/references/`, SHALL hold each of these strings, so the skill-interfaces test can check them. A string may wrap across lines. `## Placeholders` SHALL be in `SKILL.md` itself, as *Each placeholder in lets-go names one thing* says:

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
- `Picked #<i>: <title>, the first ready story under #<parent>.`
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

Below, the skill means `SKILL.md` together with its reference files. The skill SHALL not hold `review.md`, `VERDICT:`, `#152 adds`, `#153 adds` or `#154 adds`. The skill SHALL not say that `lets-go` takes chores only, or that `lets-go` needs an issue number on the default branch. The skill SHALL not say that review plan runs inside plan or inside build, or that `lets-go` reuses the `lets-build` skill. The skill SHALL not hold `Done review plan: the Plan review` or `with a Code review section`. The skill SHALL not hold the in-progress-only discovery query `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`, which matches no parent during Finalize. The skill SHALL not say that a too-large idea ends the shape step with a `failed` report. The README's `lets-go` section SHALL not say that an idea too large for one issue stops the run, or that review plan runs inside build.

#### Scenario: The fixed lines
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds every string this requirement lists, and does not find `review.md`, `VERDICT:`, `#152 adds`, `#153 adds`, `#154 adds`, `reuses the \`lets-build\` skill`, `runs inside build`, `Done review plan: the Plan review` or `with a Code review section`

#### Scenario: The too-large idea
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md`, the files in `skills/lets-go/references/` and `README.md`
- **THEN** the skill does not say `end with a failed report that says so and names`, and the README does not say `An idea too large for one issue stops the run`

#### Scenario: The old discovery query
- **WHEN** the skill-interfaces test reads `skills/lets-go/SKILL.md` and every file in `skills/lets-go/references/`
- **THEN** it finds `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and does not find `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`

#### Scenario: The step table header changes
- **WHEN** the step table's header no longer reads `| Step | Skill | Done when | Record | Skip line |`
- **THEN** the fixed-lines check still passes

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, during Finalize, or before *Claim*, when no story is ready. Finalize removes the parent's status line before it asks its own questions, so a stop during Finalize leaves a parent with no status line. To find an input's discovery, `lets-go` SHALL list the open parent issues with `lets-shape`'s query, `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, and keep each whose `Input:` line names this input: the idea word for word for an idea, and `#<i>` or the issue's URL for an issue. A kept parent SHALL be this input's discovery when it says `Discovery status: in-progress`. It SHALL also be this input's discovery when it has no status line and an earlier shape round of this input left answers: `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair, and, for an idea, `.workspace/lets-go/<shape-name>-shape-prompt.md` holds this idea. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT be this input's discovery.

For an idea, `lets-go` SHALL run this lookup before the title search of *Start from an idea*. When it finds a discovery, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, naming each parent it found, skip the title search, and run the shape step for the idea. The step resumes the discovery, or finishes its Finalize, because `lets-shape` matches the parent's `Input:` line to the idea, as the `discovery-checkpoints` capability says. When it finds none, `lets-go` SHALL run the title search. For an issue, *Start from an idea* does not run: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: The same idea after a stop during Finalize
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped during Finalize, the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` holds the Phase 5 story table confirmed, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, asks no question, and runs the shape step, whose round finishes Finalize on that parent

#### Scenario: A finished discovery of the same idea
- **WHEN** the open epic `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line, `.workspace/lets-go/idea-rewrite-the-backlog-around-a-shape-answers.yaml` does not exist, and the user runs `lets-go rewrite the backlog around a plugin model`
- **THEN** `lets-go` does not say a discovery is in progress, and runs the title search as usual

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

### Requirement: lets-go commits the discovery map on the story's branch
Discovery edits the discovery maps in the working tree on the default branch: `openspec/discovery.md`, and in a repository with several products the files under `openspec/discovery/`. Before it runs the shape step, `lets-go` SHALL run `git status --porcelain -uall -- openspec/discovery.md openspec/discovery`, which names each changed file and works when the folder does not exist. When that lists a path, `lets-go` SHALL look for this input's discovery, for an idea or an issue `#<i>`, as *A stopped discovery resumes from its parent issue* says. For an idea, it SHALL use what *Start from an idea* found. When this input has a discovery, the edits are that discovery's confirmed phases, and `lets-go` SHALL go on and run the shape step, which resumes the discovery or finishes its Finalize. When it has none, `lets-go` SHALL say the maps have uncommitted edits, name each path, say to commit or discard them, and stop. When the check went on only because one or more parents with no status line were this input's discovery, and the shape step then shaped none of those parents: the one issue it reports, or the parent it reports, is not one of them, the edits may be another discovery's: `lets-go` SHALL print the `Done shape` line, name each path the status command lists, say to commit or discard them, and stop in *Run the shape step*, before *Check the issue*. It SHALL claim nothing and create no branch. The shape step SHALL end on the default branch with the tree clean, except the discovery maps when discovery ran. When the shape step ran in this run and *Claim* created the picked story's branch, `lets-go` SHALL run that status command again, on the branch, before *lets-go walks the step table* reads the tree. It SHALL commit each path it lists, new files included. The commit is `git add -- <paths>`, then `git commit -m "docs: the discovery map from #<parent>" -- <paths>`. It SHALL never pass `openspec/discovery` itself to `git add` or `git commit`, because both fail on a path that matches no file. `<parent>` is the parent's number, or the story's when the parent became the one story. It SHALL commit no other path. When no discovery map changed, or no shape step ran in this run, it SHALL make no commit. When the run stops after discovery and before *Claim*, `lets-go` SHALL say that the discovery maps it names hold the discovery's edits, uncommitted on the default branch. While *Find the input's discovery* still takes the parent as this input's discovery, it SHALL say to leave the maps as they are, because running `lets-go` again with the same input resumes the discovery and keeps its edits. Otherwise, it SHALL say to commit or discard them before the next run, because a run stops on a dirty tree.

#### Scenario: The map is committed
- **WHEN** discovery changed `openspec/discovery.md`, and *Claim* created the branch `plugin-contract`
- **THEN** `lets-go` commits `openspec/discovery.md` alone on `plugin-contract` as `docs: the discovery map from #190`, and `git status --porcelain` then lists no path outside `.workspace/`

#### Scenario: A new map
- **WHEN** the project had no `openspec/discovery.md` and discovery created it
- **THEN** `lets-go` commits the new file the same way

#### Scenario: The run stops before Claim
- **WHEN** no story is ready, and `openspec/discovery.md` is modified
- **THEN** `lets-go` says the map is uncommitted on the default branch, says to commit or discard it before the next run, and commits nothing

#### Scenario: A dirty map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step runs, and this input has no discovery
- **THEN** `lets-go` says the map has uncommitted edits, says to commit or discard them, and runs no step

#### Scenario: A dirty map from the discovery it resumes
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped after Personas was confirmed, `git status --porcelain` lists ` M openspec/discovery.md`, and the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`
- **THEN** `lets-go` runs the shape step, which resumes the parent at the journey map, and the map commit after *Claim* takes the edits

#### Scenario: A dirty map after a stop during Finalize
- **WHEN** a run for `#180` stopped during Finalize, `git status --porcelain` lists ` M openspec/discovery.md`, the open parent `Epic: plugin backlog` has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` holds the Phase 5 story table confirmed
- **THEN** `lets-go` does not say to commit or discard the map, and runs the shape step, whose round finishes Finalize on that parent

#### Scenario: A dirty map beside a finished discovery
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, and `.workspace/lets-go/issue-180-shape-answers.yaml` does not exist
- **THEN** `lets-go` says the map has uncommitted edits, says to commit or discard them, and runs no step

#### Scenario: A dirty map beside a finished epic and an abandoned round
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds one pair from an abandoned round, and the shape step reports `issue #180: Plugin contract`
- **THEN** `lets-go` prints the `Done shape` line, names `openspec/discovery.md`, says to commit or discard it, and stops before *Check the issue*. It claims nothing, creates no branch and makes no map commit

#### Scenario: A dirty map beside a finished epic, and a new discovery
- **WHEN** `git status --porcelain` lists ` M openspec/discovery.md` before the shape step for `#180` runs, the open epic `Epic: plugin backlog` has `Input: #180` and no status line, `.workspace/lets-go/issue-180-shape-answers.yaml` holds one pair from an abandoned round, and the shape step reports `epic #300: Plugin contract` with `story #301: Plugin loader`
- **THEN** `lets-go` prints the `Done shape` line, names `openspec/discovery.md`, says to commit or discard it, and stops before *Check the issue*. It picks no story, claims nothing and makes no map commit

#### Scenario: A later run with no shape step
- **WHEN** the user runs `lets-go #191` after the map was committed by hand, #191's packet is complete, and *Claim* creates the branch
- **THEN** `lets-go` makes no map commit

#### Scenario: A discovery that fits one story
- **WHEN** discovery edited the map and the parent became story #190, and *Claim* created #190's branch
- **THEN** `lets-go` commits the map as `docs: the discovery map from #190`

#### Scenario: A product's map and the root
- **WHEN** discovery moved the old map to `openspec/discovery/web-shop.md`, rewrote `openspec/discovery.md` as the root, and created `openspec/discovery/warehouse.md`, and *Claim* created the branch `stock-alerts`
- **THEN** `lets-go` commits those three paths, and no other, on `stock-alerts` in one commit, `docs: the discovery map from #<parent>`

#### Scenario: A dirty product map before the shape step
- **WHEN** `git status --porcelain` lists ` M openspec/discovery/warehouse.md` before the shape step runs, and this input has no discovery
- **THEN** `lets-go` names `openspec/discovery/warehouse.md`, says to commit or discard it, and runs no step
