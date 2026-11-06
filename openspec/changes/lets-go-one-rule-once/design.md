## Context

After #201, `skills/lets-go/SKILL.md` is 1,412 lines: an overview table, a Placeholders table, eleven parts as `##` headings, `## Procedures` with seven `###` procedures, then five `##` sections that are not parts (*The step table*, *Write the prompt*, *Run a step*, *Read the report*, *Relay the questions*). Each procedure returns a result, and the part that ran it acts on it.

These rules are written more than once today:

- **The level.** *Set the level* lists three sources. *Run the shape step* step 2 lists them again, with a third source of its own. *Set the level* also says "After a shape step, set it again here", though it runs once per run anyway.
- **The step lines.** The `Done` and `Skipped` lines for shape are written in *Check the issue* step 6, and again in *End of the run*. *End of the run* also writes the `Done` form, the `Failed` form and the `<date>` and `<evidence>` rule, and *Check the issue* repeats that rule. *Read the report* points back to *End of the run*. *Pick the first ready story* prints "the `Done shape` line that *Check the issue* shows".
- **The branch check.** *Check the issue* step 2 looks for the branch. *Claim* step 2 looks again, and returns `branch-exists`.
- **The Project stops.** *Find the source of demand* runs the Project query and returns `no-project` or `several-projects`. *Read the request*, *Start from an idea*, *Check the issue* and *Pick the first ready story* each write the same two stops.
- **The prerequisite.** `next` and the first case of *Find the source of demand* run *Check the prerequisite*. *Glossary preflight*, inside *Claim*, runs it a third time, and *Check the checkpoint* step 6 runs it again when the owner or the base changed.
- **The done tests.** The step table has a *Done when* column. The walk has a test per row. Only the walk has the disagreement rules, and its review plan test has no stated order (B8f).

Some branches never run: *Find the source of demand* ends "When *Claim* ran it, return to *Claim*", but *Claim* never runs it. Review plan on `lets-minimal` "is done once plan is done", and plan is always done by then.

The walk takes a `done` report on trust: *Read the report* prints the `Done` line and goes on (B6).

The tests pin this wording in about twenty places, including `Run this query only when \`<project>\` is not set yet in this run`, the four parts' `no-project` and `several-projects` bullets, *Enter the branch*'s `branch-exists` bullet, both shape lines inside *Check the issue*, and `when this run has not printed it yet` inside *Pick the first ready story*.

## Goals / Non-Goals

**Goals:**

- A reader who wants a rule finds it in one place, and every other place links to it.
- No sentence in `lets-go` describes something that cannot happen.
- A step that reports `done` while its record says otherwise ends the walk as a failed step.

**Non-Goals:**

- Running each check only once. The packet and the prerequisite are still checked again in *Check the issue* for a picked issue (D9). Only the third prerequisite check, inside *Claim*, goes.
- Moving anything into `references/` (#203), or explaining terms at first use (#204).
- Changing the claim race, or the `--state open` title search on a change's branch.
- A general check that no sentence repeats. Short sentences such as "Return to the part that ran it, with the result." repeat on purpose.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. It reads the real `skills/lets-go/SKILL.md`, and uses `fixture_file` skills folders where a new check needs a failing case.
- **Existing seams reused:** `part_section`, `procedure_text`, `skill_section`, `skill_says`, `skill_does_not_say`, `next_line`, `overview_row`, `step_row`, `skill_rows`, `prose_text`, and the guards `procedure_stops`, `override_idioms`, `parts_listed`, `parts_say_next`, `step_numbers`, `anchors_resolve`, `lists_start_at_one`, `placeholders_listed_once` and `no_old_placeholders`.

One new helper: `skill_says_once <skill> <phrase>`, which passes when the phrase occurs exactly once across the skill's files, with whitespace squeezed as `skill_says` does. It gets a failing fixture of its own.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill, on the pattern #201 set. But the change moves text in about fifteen places, and removes two results and a column that other text refers to. A link left pointing at removed text, or a part that still handles a result nobody returns, leaves the agent confused, and no test runs the agent.
- **Blast radius:** `skills/lets-go/SKILL.md`, which both published flows ship, and `tests/skill-interfaces.bats`. No code under `lets/`, no other skill, schema or glossary entry.

## Decisions

### The Project query moves to *Read the settings*

*Read the settings* runs `lets go level`, then finds the default and current branch, then runs the Project query, which moves there unchanged. It then states the three outcomes:

- **One Project:** its `number` is `<project>`, its `owner` is `<owner>`, and the query's `repo` is `<repo>`, for the whole run.
- **None:** say to run the `lets-setup-backlog` skill, and stop.
- **Two or more:** list each one's title and URL, ask the user to unlink the extras, and stop. Never pick one yourself.

*Find the source of demand* loses the query, its paragraph on the two listings, the sentence on reusing an earlier pass, and the `no-project` and `several-projects` results. It says it uses the `<project>`, `<owner>` and `<repo>` that *Read the settings* set. The four parts lose their two bullets each. The overview's row for *Read the settings* says it reads the Project too, and stops when the query finds none or several. The other rows drop the two results. The Placeholders table sets `<project>`, `<owner>` and `<repo>` in *Read the settings*.

Alternative: keep the query where it is, and write the two stops once in a subsection the four parts link to. Rejected: the parts would still carry two bullets each, and a stop would still sit three links from the query that causes it. The user chose the move (D7).

### The level is written once, in *Set the level*

*Set the level* lists the sources in order, with the line for each:

1. The level the user named.
2. The level `lets go level` printed, when it is not `null`.
3. The Kind's: `recommend` for a Chore or a Bug, and `ask` for any other Kind, Story included, as *Confirm the packet* reads any other Kind as a Story. Before a shape step there is no Kind, so it is `ask`, with the line `Interactivity: ask, because shape has not run yet.`

The four `Interactivity:` lines sit there, in one code block. *Run the shape step* step 2 becomes: set `<level>` as [Set the level](#set-the-level) says, before the shape step, and print its line. "After a shape step, set it again here" goes. "Do not run `lets go level` again" stays.

### The step lines get one section

A new `### The step lines` sits under `## The step table`, after *Read the records*. It holds:

- the `Done` form, with one line per step in one code block, shape's included: `Done shape: <date>. <evidence>` to `Done review build: <date>. <evidence>`;
- the `Skipped` lines: shape's, `Skipped shape: #<i>'s packet is complete, last edited <date>.`, and a pointer to each row's *Skip line* in the table for the other steps;
- the `Failed` form, `Failed <step name>: <reason>`, written with a real step, such as `Failed review build: <reason>`, as today. A line names a step with a space, never a hyphen;
- what fills `<date>` and `<evidence>` on each kind of line: a report's `date` and its `evidence` joined with `; `; the record's author date, from *Read the records*; or the issue's last edit, or its creation date when `lastEditedAt` is null, with the `gh issue view <i> --json createdAt` read;
- when shape's line prints: `Done shape` once per run, when this run has not printed it yet; `Skipped shape` once for each issue *Check the issue* passes;
- the example run that *End of the run* holds today.

*Check the issue* step 6 says: print shape's line, as [The step lines](#the-step-lines) says. *Pick the first ready story* on `nothing-ready` says the same. *Read the report* and *End of the run* link to it instead of describing the forms. *End of the run* keeps the URL, the `.workspace/lets-go/` note and "The run is over."

Alternative: put the section in *End of the run*, where most of the text is now. Rejected: *End of the run* is a part, and runs last. A rule the first part of the walk uses belongs with the step table, which every line names.

### *Claim* loses its branch check

*Claim* step 2 becomes: run *Glossary preflight*, and return `unresolved` or `checkpoint-failed` as now. Step 4 already releases the claim when creating the branch fails. It gains one clause: this includes a branch with the change's name that appeared after *Check the issue* looked. `branch-exists` leaves *Claim*'s results, *Enter the branch*'s bullets, the overview row and the spec's table. *Check the checkpoint*'s opening, "after *Claim*'s branch check passes", becomes "when *Claim* runs *Glossary preflight*".

### *Claim*'s preflight checks no prerequisite first

The opening of *Glossary preflight* says who runs what: `next` and *Find the source of demand* run *Check the prerequisite*. *Claim* runs the rest of the preflight. That reads the story's **Glossary handoff**. When there is none, or another issue owns the edits, the result is `no-owned-edits`. Otherwise it runs *Check the checkpoint*, whose step 6 runs *Check the prerequisite* again when the owner or the base changed. *What the preflight returns* changes to match: `no-owned-edits` no longer says *Check the prerequisite* returned `resolved`, and `unresolved` comes from *Check the checkpoint*.

### Each row's done test is an ordered list in the walk

In *Walk the step table*, each row's bullet becomes a short numbered list, headed "the first of these that matches decides". For review plan:

1. On `lets-minimal`, review plan is done.
2. When the archive folder exists, review plan is done. The records disagree when the pull request's `body` has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line.
3. Otherwise read the body again, with `gh pr view <name> --json number,body`, and follow *Check an earlier review*, as now.

Plan, build and review build get the same shape, with the archive folder first. The step table drops its *Done when* column and keeps *Step*, *Skill*, *Record* and *Skip line*. Its intro sentence on the state moves into the walk, which reads it. Each numbered list starts at 1 under its own heading, as `lists_start_at_one` checks.

### The walk checks a `done` report

*Read the report*'s `done` case, for any step but shape, becomes: run the row's done test again, from the walk, with its reads and disagreement rules.

- **Done:** print the step's `Done` line, and go on to the next row.
- **The records disagree:** stop as [Records that disagree](#records-that-disagree) says.
- **Not done:** the step failed. Its reason starts `the step reported done, but`, then names the record and what it holds. For example: `the step reported done, but the change state is blocked`, or `the step reported done, but pull request #<pr> has no Plan review section that covers the plan`. Go on as for `failed`, below.

The reason fills `<reason>`, so the `Failed` line needs no new placeholder. The walk's `Not done` bullet and the overview's *Stops when* for the walk name the new case. Shape gets no change: *Check the issue* already runs *Confirm the packet* after it (D13).

### Branches that never run go, or say when they run

- *Find the source of demand* ends "Return to the part that ran it, with the result." The *Claim* clause goes. The pinned `When *Claim* ran it, return to *Claim*` still sits in *What the preflight returns*, where it is true.
- Review plan on `lets-minimal` is the first item of its list (above), with no "once plan is done".
- The walk's `MERGED` and `CLOSED` stops gain one sentence: they run when the branch still exists and the run finds its issue. That is a stacked pull request merged into the branch below it, which leaves its issue open, or a closed issue the user names on the default branch.

### The tests change with the sentences they pin

Each pinned phrase that moves follows its sentence: the Project query check reads *Read the settings*; the shape-line checks read *The step lines*; `when this run has not printed it yet` moves there too. The table of parts and results in "each part that finds the source of demand acts on each result" drops `no-project` and `several-projects`. "Enter the branch acts on each result of the claim" drops `branch-exists`, and checks it is gone. New checks follow the spec's scenarios:

- `skill_says_once` for `Done shape: <date>. <evidence>`, the `Skipped shape` line and the `<evidence>` rule;
- no `no-project`, `several-projects` or `branch-exists` anywhere in `lets-go`;
- *Read the settings* holds the Project query, and *Find the source of demand* does not;
- *Run the shape step* links `#set-the-level`, and the level rule names any other Kind;
- the step table's header has no *Done when*;
- review plan's done test lists `lets-minimal` before the archive folder;
- *Read the report* runs the done test again after `done`, and holds `the step reported done, but`;
- *Find the source of demand* does not return to *Claim*.

## Risks / Trade-offs

- [A link points at text that moved, or an anchor that no longer exists] → `anchors_resolve` fails the suite. Each moved rule is linked by its new heading.
- [A part still handles `no-project` or `branch-exists`, which nothing returns] → a new check bans both names in `lets-go`.
- [The no-Project stop now comes first, before a stop that names the wrong branch] → The user chose this (D7). Both stops are true, and the repository cannot run `lets-go` without a single Project.
- [The `done` check turns a real success into a failure, for example when a record lags] → Every record the test reads is local Git or a fresh `gh pr view`, which the step itself just wrote. A false failure stops the run with the record named, and the next run picks up from the same step.
- [The edits change text the plan did not name] → As in #201, the last task diffs the old and new `SKILL.md` sentence by sentence, and accounts for every changed sentence.

## Migration & Rollback

N/A. The skill reaches projects through the next release. Rolling back is a revert of this pull request.
