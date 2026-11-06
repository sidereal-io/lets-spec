## MODIFIED Requirements

### Requirement: Start finds, confirms, routes and claims the issue
`lets-go` SHALL hold *Find the source of demand*, *Confirm the packet*, *Route*, *Glossary preflight*, *Claim* and *Import the glossary checkpoint* as sections of its own. They SHALL sit under no `## Start` heading: the parts that *lets-go opens with an overview of its parts* lists call them. It SHALL name no section of `lets-build`. It SHALL run *Find the source of demand*, *Confirm the packet* and *Route* in its own session on every run. It SHALL run *Claim* only when no branch with the change's name exists, locally or on `origin`. *Claim* sets the issue's Status with `gh project item-edit`, so `lets-go` sets that field itself. When the change's branch exists and `lets-go` is on the default branch, it SHALL run `git switch <name>`, and go on as on a change's branch. On a change's branch that `origin` has, it SHALL run `git fetch origin <name>` before it reads any record. A local branch behind `origin/<name>` SHALL be fast-forwarded with `git merge --ff-only origin/<name>`. A local branch that has diverged from `origin/<name>` is a disagreement. `lets-go` SHALL read the issue's blockers, and decide on an open one, before it runs *Find the source of demand* for that issue. The skill SHALL state this rule before that call, so that an agent that follows it in reading order decides on an open blocker before it reaches the section. The blocker read SHALL be `gh issue view <i> --json title,blockedBy`, so the change's name is known as *Claim* names it, before *Confirm the packet* reads the title. `lets-go` SHALL look for the change's branch as *lets-go looks for the change's branch before the packet check* says. When a blocker is open and the branch exists, locally or on `origin`, it SHALL name the open blockers and go on: the user has stacked the branch by hand. *Find the source of demand* SHALL still run *Check the prerequisite* for the issue. When it returns `unresolved`, `lets-go` SHALL report the unresolved owner or checkpoint, and stop, even on a stacked branch. When a blocker is open and no such branch exists, `lets-go` SHALL say which open issues block it, and stop. The named-issue case of *Find the source of demand* SHALL make no blocker decision of its own, because the blocker read has decided. Each procedure returns a result, and the part that ran it decides what comes next, as *Each lets-go procedure returns a result* says. *Check the issue* holds the blocker read. For an idea, `lets-go` SHALL run that section's second case, described work with no issue: the search for an existing issue. It SHALL show the user the matches and ask, at either level, whether one is the same work. A yes SHALL make that issue `<i>`. On a no, or when the case returns `no-match`, `lets-go` SHALL run the shape step for the idea. With no number and no idea, `lets-go` SHALL run that section's third case, `next`, as *lets-go takes one issue number or an idea* says. After a shape report that names a parent and stories, `lets-go` SHALL run that third case again. The candidates SHALL be the report's stories, as *lets-go picks the first ready story* says. When *Claim* returns `taken`, `lets-go` SHALL go on as *A lost claim drops the issue, and three lost claims stop the run* says. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL go on as *Only an idea or a named issue goes to the shape step* says. When it returns `epic`, `lets-go` SHALL say that an epic is built through its stories, list its open sub-issues, and stop. Beside the commands those sections hold, the parts before *Walk the step table* SHALL run only:

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
- **THEN** `lets-go` leaves #149 out, runs both `next` commands again, prints a new `Picked` line, and runs the blocker read, *Confirm the packet* and *Route* for the new issue

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
- **WHEN** the skill-interfaces test reads *Check the issue* in `skills/lets-go/SKILL.md`
- **THEN** it finds `gh issue view <i> --json title,blockedBy` before the call to *Find the source of demand*, and that section's named-issue case no longer says `If an open issue blocks it, say so and stop`

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
- **THEN** `lets-go` runs its own `next` case, with the three stories as the only candidates, and adds no command of its own for the pick

### Requirement: lets-go takes one issue number or an idea
`lets-go` SHALL take one issue number, or an idea in words, or nothing. A request names an issue when it holds `#<i>` or is a bare number. A leading or trailing `ask` or `recommend` names the level and SHALL not count as part of the idea. On the default branch, every other request with words SHALL be the idea, kept word for word. On the default branch, when the request holds neither a number nor words, `lets-go` SHALL take `next`: the third case of *Find the source of demand*, over the whole backlog. That case keeps its rank, and its *Check the prerequisite* and *Confirm the packet* on each candidate, as *Only an idea or a named issue goes to the shape step* says. `lets-go` SHALL print `Picked #<i>: <title>, the next ready issue.` and go on from the blocker read with that issue as `<i>`. When the case returns `nothing-ready`, `lets-go` SHALL say the backlog has nothing ready, suggest the `lets-shape` skill, and stop, claiming nothing. On a change's branch, when it is given no number, it SHALL find the issue by the branch name. It SHALL run `gh issue list --state open --search "<branch> in:title" --json number,title` and keep the issues whose title starts with `<branch> — `. Exactly one match SHALL be the issue. Otherwise it SHALL say that it needs the issue number, and stop. When it is given a number on a change's branch, that issue's title SHALL start with `<branch> — `. If it does not, `lets-go` SHALL say the issue and the branch do not match, and stop. When it is given words on a change's branch, it SHALL say that an idea needs the default branch, and stop. It SHALL take an issue number as *Find the source of demand* takes a named issue. It SHALL take an idea as that section takes described work.

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
`lets-go` SHALL run a step named `shape` when the request is an idea that no existing issue matches. It SHALL also run it when *Confirm the packet* returns `needs-shape` for an issue the user named, as *Only an idea or a named issue goes to the shape step* says. It SHALL run that step as *Each step runs through lets delegate step* says, with `--for shape`, on the default branch, before any branch or change exists. The shape step SHALL run at most once per run. After it, a `needs-shape` result SHALL make `lets-go` say to run `lets-shape` on `#<i>`, and stop. `<shape-name>` SHALL be `issue-<i>` for an existing issue, and `idea-<slug>` for an idea. `<slug>` SHALL be built this way: split the idea on white space; lower-case each word; keep only its letters and digits; drop a word left empty; join the first five words with hyphens, or all of them when there are fewer. Once the shape step reports `done` or `failed`, `lets-go` SHALL remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`. Before it writes the shape prompt for an idea, when `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds another idea, `lets-go` SHALL remove that answers file too. The shape prompt SHALL say to run `lets-shape`'s *Shape one issue* to its end, including its second comment fetch, its reply, and its glossary handoff. For an idea, it SHALL give the idea word for word. It SHALL say that Start has searched and the user confirmed no open issue is the same work, so the step skips the search and creates the issue. For an existing issue, it SHALL name `#<i>` and say to shape it. It SHALL say to create no change and no change branch, and to end on the default branch with a clean tree, except `openspec/discovery.md` when discovery ran; a glossary holding branch that `lets-shape` makes is allowed. It SHALL say that the packet confirmation is a confirmation question, with no recommendation. It SHALL say what the first evidence line of a `done` report is: `issue #<i>: <title>` for one issue. When discovery filed stories, it is `epic #<parent>: <title>`, followed by `story #<story>: <title>` lines. It SHALL say that work too large for one issue, Size L or XL, or an input that holds a large idea, ends the round with the discovery question, as *The shape step asks before it runs discovery* says. When the step reports `done` for one issue, `lets-go` SHALL read `<i>` from that first evidence line. When it reports `done` for a parent and stories, `lets-go` SHALL pick `<i>` as *lets-go picks the first ready story* says. A `done` report whose first evidence line is in neither form SHALL count as `failed`, with a reason that says the shape step named no issue. After a `done` report, Start SHALL go on from its blocker read with `<i>`, as for an issue number, and the shape line SHALL be `Done shape: <date>. <evidence>`. When the step reports `failed`, `lets-go` SHALL print `Failed shape: <reason>`, say to run `lets-shape` on the idea or the issue, name no branch, and stop. When exit 3 sends the step to a subagent, the subagent SHALL work on the default branch.

#### Scenario: An idea no issue matches
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync`, and the search finds no open issue
- **THEN** `lets-go` writes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-prompt.md`, and runs `lets delegate step run --for shape --name idea-add-a-quiet-flag-to-shape`

#### Scenario: A short idea with punctuation
- **WHEN** the idea is `fix lets-sync — quiet output`
- **THEN** `<shape-name>` is `idea-fix-letssync-quiet-output`: the dash alone is dropped, and four words are all there are

#### Scenario: The shape prompt for an idea
- **WHEN** `lets-go` writes the shape prompt for the idea `add a --quiet flag to lets sync`
- **THEN** the file names `lets-shape`, holds `add a --quiet flag to lets sync`, says the search has run and to create the issue, says to run *Shape one issue* to its end and finish on the default branch with a clean tree, and says the first evidence line is `issue #<i>: <title>`

#### Scenario: The shape prompt names discovery
- **WHEN** `lets-go` writes the shape prompt
- **THEN** the file holds `Run discovery on it?`, `epic #<parent>: <title>`, `story #<story>: <title>`, `Discovery status: in-progress` and `openspec/discovery.md`, and does not say to end with a failed report for a too-large idea

#### Scenario: The answers file after shape
- **WHEN** the shape step for `idea-add-a-quiet-flag-to` reports `done`, and `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` holds three pairs
- **THEN** `lets-go` removes that file before it goes on, so a later idea with the same first five words starts with no answers

#### Scenario: Another idea with the same first five words
- **WHEN** a run for `add a --quiet flag to lets sync` stopped at `needs-input`, and the user now runs `lets-go add a --quiet flag to lets status`
- **THEN** `lets-go` removes `.workspace/lets-go/idea-add-a-quiet-flag-to-shape-answers.yaml` before it writes the prompt, and the first round carries no `--answers-file`

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
- **WHEN** `step run --for shape` exits 3 and its stderr names `.workspace/lets-delegate/idea-add-a-quiet-flag-to-shape.prompt.md`
- **THEN** `lets-go` runs a subagent with that prompt file on the default branch, and reads its `step-report` block

### Requirement: A stopped discovery resumes from its parent issue
A discovery can stop between rounds, or before *Claim*, when no story is ready. For an idea, before the title search of *Start from an idea*, `lets-go` SHALL look for an open parent issue that says `Discovery status: in-progress` and whose `Input:` line holds the idea's words. It SHALL use `lets-shape`'s own query, `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body`. When one exists, `lets-go` SHALL say that a discovery of this idea is in progress at `#<parent>`, skip the title search, and run the shape step for the idea. The step resumes that discovery, as *The shape step asks before it runs discovery* says. For an issue, no check is needed: when *Confirm the packet* returns `needs-shape` for `#<i>`, the shape step runs, and finds the parent whose `Input:` is `#<i>`. The answers file rules of *The shape step shapes an idea or an unshaped issue* SHALL hold: an idea retyped word for word keeps its answers, and a reworded idea starts with none and is a new input. The phases the parent already recorded are not lost either way.

#### Scenario: The same idea again
- **WHEN** a run for `rewrite the backlog around a plugin model` stopped at MoSCoW, the open parent `Epic: plugin backlog` says `Discovery status: in-progress` with `Input: rewrite the backlog around a plugin model`, and the user runs `lets-go rewrite the backlog around a plugin model` again
- **THEN** `lets-go` says a discovery of this idea is in progress at that parent, runs no title search, and runs the shape step, whose round resumes the parent at MoSCoW

#### Scenario: A reworded idea
- **WHEN** the user runs `lets-go rewrite the backlog around a plugin system` instead, and no parent's `Input:` line holds those words
- **THEN** `lets-go` runs the title search as usual, and on a yes for `Epic: plugin backlog`, *Confirm the packet* returns `epic`, and `lets-go` stops as `lets-build` does

#### Scenario: An issue's discovery again
- **WHEN** the user runs `lets-go` for `#180` again, #180 still has no Kind, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** *Confirm the packet* returns `needs-shape` for #180, and the shape step's round resumes that parent

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
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** no file of `lets-go` says `Resolve a partial or conflicting patch` or `do not claim until it is recovered`, and *Check the checkpoint* returns `checkpoint-failed` where a check fails, with no word `stop`

### Requirement: The lets-go checks read the skill's reference files
Every skill-interfaces check that `lets-go` holds a string, or does not hold one, SHALL read `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md` as one text. It SHALL collapse each run of whitespace, line breaks included, to one space before it matches, so a string may wrap across lines. A check that a string is present SHALL pass when any of those files holds it. A check that a string is absent SHALL fail when any of those files holds it, and SHALL name the string. A check that greps a table row of `lets-go`, such as a step's row or a row of the disagreements table, SHALL read the same files. Some checks test reading order or a relative link. They SHALL read `SKILL.md` alone. These are the checks of the section of each part and of the *Walk the step table* section. So are the checks of the order of the overview and the parts, and of the place of the `## Placeholders` section. So are the rule that `lets go level` comes before the first GitHub call, and the links to other skills' reference files. The check that each link names a heading reads each file against its own headings.

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
- **THEN** it checks for `leave out every issue lost in this run`, and does not check for a step number

### Requirement: lets-go picks the first ready story
After a shape report that names a parent and stories, `lets-go` SHALL pick one story with its own `next` case, the third case of *Find the source of demand*. The candidates SHALL be the report's stories and no other issue. That case's two commands SHALL run as the section writes them. So SHALL its rank, Must, then Should, then Could, then the lowest issue number, and its *Check the prerequisite* and *Confirm the packet* on each candidate in rank order. `lets-go` SHALL print `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL then go on from Start's blocker read with that story as `<i>`, as for an issue number. When the case returns `nothing-ready`, `lets-go` SHALL print the `Done shape` line and say that no story under `#<parent>` is ready. It SHALL name each story and why it was left out, such as its blocker, its assignee, an unresolved prerequisite, or a packet that is not complete, say to run `lets-go` with a story's number once it is ready, and stop. It SHALL claim nothing and create no branch in that case.

#### Scenario: The walking skeleton is picked
- **WHEN** the report names stories #191, #192 and #193, all Todo with Priority Must, #192 and #193 are blocked by #191, and nobody is assigned to any
- **THEN** `lets-go` prints `Picked #191: plugin-contract — ..., the first ready story under #190.`, reads #191's blockers, confirms its packet, and runs *Claim* for it

#### Scenario: The rank follows next
- **WHEN** the unblocked candidates are #192, a Should, and #193, a Must
- **THEN** `lets-go` picks #193

#### Scenario: Another issue is not a candidate
- **WHEN** the backlog holds an unblocked, unassigned Must, #120, that the report does not name
- **THEN** `lets-go` does not pick #120

#### Scenario: No story is ready
- **WHEN** every story the report names is blocked by a documentation chore that owns the glossary edits
- **THEN** `lets-go` prints the `Done shape` line, says no story under #190 is ready, names each story and its blocker, says to run `lets-go` with a story's number once it is ready, and stops with no branch

## ADDED Requirements

### Requirement: Each lets-go procedure returns a result
Each section under `## Procedures` in `lets-go` SHALL end by returning to the part that ran it, with a result. A procedure SHALL not tell the agent to stop, and SHALL not name the part that runs next: the part that ran it decides. Outside code, a procedure's text, its subsections included, SHALL not hold the word `stop` or `stops`, in any case. A procedure that can end more than one way SHALL list its results. Each result is a name in backticks, with when it is returned and what it carries, such as the issue, who has it, or what to tell the user. The results SHALL be these:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready`, `no-project`, `several-projects` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Claim* | `claimed`, `branch-exists`, `taken`, `unresolved`, `checkpoint-failed`, `branch-failed` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |

*Commit the discovery map* ends one way only, so it names no result.

#### Scenario: Every procedure returns
- **WHEN** the skill-interfaces test reads each procedure of `lets-go`
- **THEN** each one says it returns to the part that ran it, has no `Next:` line, and holds no `stop` or `stops` outside code

#### Scenario: A procedure that stops
- **WHEN** a skills folder holds `lets-go/SKILL.md` whose *Confirm the packet* says ``Say to run the `lets-shape` skill on `#<i>`, and stop.``
- **THEN** the check fails, and its output names `Confirm the packet`

#### Scenario: Confirm the packet lists its results
- **WHEN** the skill-interfaces test reads *Confirm the packet*
- **THEN** it finds `complete`, `needs-shape` and `epic`

### Requirement: Each part names the action for each result
A part that runs a procedure SHALL name each result the procedure can return there, and say what to do on it: go on, run another part, or tell the user what the result carries and stop. A part SHALL not hold a catch-all such as `any other stop stands`. The overview's *Stops when* column SHALL name the results a part stops on.

#### Scenario: Check the issue acts on the packet's results
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** it finds `complete`, `needs-shape` and `epic`, each with its action

#### Scenario: Enter the branch acts on the claim's results
- **WHEN** the skill-interfaces test reads *Enter the branch*
- **THEN** it finds `claimed`, `branch-exists`, `taken`, `unresolved`, `checkpoint-failed` and `branch-failed`, each with its action

#### Scenario: An epic stops the run
- **WHEN** the user runs `lets-go` for `#194`, and *Confirm the packet* returns `epic`
- **THEN** `lets-go` says that an epic is built through its stories, lists its open sub-issues, claims nothing and stops

### Requirement: lets-go states the action, not an override
`lets-go` SHALL state each action directly. Outside code, no text of `lets-go` SHALL hold `aside`, or the word `stand` or `stands`, in any case, except in `stands for`. So the skill SHALL not say `set that stop aside`, `the stop in next stands` or `The lines printed for the lost issue stand`.

#### Scenario: No override idiom
- **WHEN** the skill-interfaces test reads `lets-go`, outside code
- **THEN** it finds no `aside`, and no `stand` or `stands` other than in `stands for`

#### Scenario: An override comes back
- **WHEN** a skills folder holds `lets-go/SKILL.md` with the line ``When nothing is ready, the stop in `next` stands.``
- **THEN** the check fails, and its output names `stands`

#### Scenario: The placeholders table
- **WHEN** `lets-go` says `Each one stands for one thing` and has a column `What it stands for`
- **THEN** the check passes

### Requirement: lets-go looks for the change's branch before the packet check
*Check the issue* SHALL look for the change's branch once for each issue it checks. It SHALL look right after the blocker read, and before it runs *Find the source of demand* and *Confirm the packet*, whether a blocker is open or not. On the default branch, it SHALL run `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`. On a change's branch, the branch exists. *Enter the branch* SHALL use what *Check the issue* found, and SHALL not look again. After a shape step, *Check the issue* SHALL look again for the shaped issue, whose title gives the name. When the branch exists and *Confirm the packet* returns `needs-shape`, `lets-go` SHALL say that the change has started on `<name>`, say why the packet needs shaping, say to run `lets-shape` on `#<i>`, and stop. It SHALL do the same on the default branch and on the change's branch.

#### Scenario: The lookup comes before the packet check
- **WHEN** the skill-interfaces test reads *Check the issue*
- **THEN** `git ls-remote --heads origin refs/heads/<name>` comes before the link to `#confirm-the-packet`

#### Scenario: A started change with a new comment, on the default branch
- **WHEN** the user runs `lets-go 123` on the default branch, `origin` has the branch `lets-go-chore`, and *Confirm the packet* returns `needs-shape` because #123 has a comment after the watermark
- **THEN** `lets-go` says the change has started on `lets-go-chore`, says to run `lets-shape` on #123, stops, and runs no shape step

#### Scenario: The same change, on its branch
- **WHEN** the user runs `lets-go` on the branch `lets-go-chore`, whose issue #123 has the same comment
- **THEN** `lets-go` says the same, and stops

### Requirement: Only an idea or a named issue goes to the shape step
`lets-go` SHALL run the shape step before *Claim* only for an idea, or for an issue the user named or confirmed as the same work. When *Confirm the packet* returns `needs-shape`, `lets-go` SHALL run the shape step only when all of these hold: the user named the issue or confirmed it as the same work; the change's branch does not exist, locally or on `origin`; and no shape step has run in this run. Otherwise it SHALL say why the packet needs shaping, say to run `lets-shape` on `#<i>`, and stop, running no step. `next` SHALL count a candidate as ready only when *Check the prerequisite* returns `resolved` for it and *Confirm the packet* returns `complete`. It SHALL check the candidates in rank order, and SHALL skip a candidate for which either check fails. So `next` never sends an issue to the shape step, and never edits an issue it skips.

#### Scenario: Next skips a candidate with an unread comment
- **WHEN** `next` ranks #150 first and #151 second, #150 has a comment after the watermark, and #151's packet is complete
- **THEN** `lets-go` prints `Picked #151: <title>, the next ready issue.`, runs no shape step, and leaves #150 as it was

#### Scenario: Next skips a candidate with no Kind
- **WHEN** the Project's first Todo candidate, #160, has no Kind
- **THEN** `next` skips #160, and does not pick it

#### Scenario: A picked packet changes before the check
- **WHEN** `next` picked #151, and *Check the issue*'s *Confirm the packet* then returns `needs-shape` because a comment arrived in between
- **THEN** `lets-go` says to run `lets-shape` on #151, stops, claims nothing, and runs no shape step

#### Scenario: A named issue still goes to shape
- **WHEN** the user runs `lets-go` for `#180` on the default branch, no branch for its change exists, and #180 has no Kind
- **THEN** `lets-go` runs the shape step for #180

### Requirement: A lost claim drops the issue, and three lost claims stop the run
When *Claim* returns `taken` for an issue the user named or confirmed as the same work, `lets-go` SHALL say who has it, and stop. When `next` or *Pick the first ready story* picked the issue, `lets-go` SHALL leave out every issue lost in this run. It SHALL run both `next` commands again, with the same narrowing as the first pick, and take the first ready candidate that is left. It SHALL print the `Picked` line in the same form as the first pick: `Picked #<i>: <title>, the next ready issue.` or `Picked #<i>: <title>, the first ready story under #<parent>.` It SHALL keep the lines it printed already, and go on from the blocker read with the new issue. When no candidate is left, it SHALL stop as when nothing is ready. After the third lost claim in one run, `lets-go` SHALL say that other sessions keep taking the picked issues, say to run `lets-go` again, and stop, claiming nothing.

#### Scenario: The lost issue is not picked again
- **WHEN** `next` picked #149, *Claim* returns `taken` for it, and the candidate list read before the claim still holds #149
- **THEN** `lets-go` leaves #149 out, runs both `next` commands again, and picks another issue

#### Scenario: A lost story under a parent
- **WHEN** *Pick the first ready story* picked #191 under #190, and *Claim* returns `taken` for it, and #192 is the next ready story
- **THEN** `lets-go` prints `Picked #192: <title>, the first ready story under #190.`, and picks no issue outside #190's stories

#### Scenario: Three lost claims
- **WHEN** *Claim* returns `taken` for three picked issues in one run
- **THEN** `lets-go` says other sessions keep taking the picked issues, says to run `lets-go` again, claims nothing and stops
