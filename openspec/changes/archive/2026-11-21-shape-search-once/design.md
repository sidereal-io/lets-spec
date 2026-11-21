<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

`skills/lets-go/references/shape.md` holds `lets-go`'s discovery lookup in two places:

- *Start from an idea* step 1 runs `gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body` and keeps a parent whose `Input:` line holds the idea word for word. When it finds one, the run skips the title search.
- *Run the shape step* step 1 is the dirty-map check. When `git status` lists a changed map, it looks for an in-progress parent whose `Input:` line names this input. It uses the result of *Start from an idea* for an idea, and runs the same query for an issue.

`lets-shape`'s *Locate the discovery* (since #264) lists parents with `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`. It resumes a parent that says `Discovery status: in-progress`, and finishes Finalize on a parent that has no status line when its answers confirmed the Phase 5 story table. Finalize removes the status line first, so `lets-go`'s query cannot see a parent once Finalize has started.

Constraints that shape the approach:

- `tests/skill-interfaces.bats` forbids `lets-go` from holding `lets-shape`'s discovery rules, including the phrase `Finalize has started on that parent` (#264's decision that `lets-shape` owns them). So `lets-go` cannot copy the Phase 5 rule.
- `lets-go` owns the shape step's answers file, `.workspace/lets-go/<shape-name>-shape-answers.yaml`. *Relay the questions* appends to it after each `needs-input` round. *Read the report* removes it once shape reports `done` or `failed`.
- `SKILL.md` *Backlog errors* names "the in-progress parent query of *Start from an idea*" as one of three reads that stay as `gh` commands.

## Goals / Non-Goals

**Goals:**

- One lookup, written once in `shape.md`, that both callers link.
- The lookup finds the same parents `lets-shape` would act on, for the same input, without restating `lets-shape`'s rules.
- A run after a stop during Finalize asks nothing before the shape step.

**Non-Goals:**

- No change to `lets-shape`, `references/step-prompt.md`, the title search or the header note (D1).
- No `lets backlog` command. #137 adds it and removes this copy (D3).
- No change for an issue `#<i>` that is itself a parent. *Confirm the packet* routes it, as today.

## Test Seams

- **Primary test seam:** the wording checks in `tests/skill-interfaces.bats`. The lookup is prose an agent follows, so the test asserts the strings and links that carry each rule.
- **Existing seams reused:** `skill_says`, `skill_does_not_say` and `skill_section` in `tests/skill-interfaces.bats`, and the test *lets-go runs a shape step for an idea or an unshaped issue*, which already checks the old query.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. The edit is prose in one reference file, but it decides whether a run asks the title search's question, stops on the maps or resumes a discovery. It also makes the shape answers file a signal the lookup reads.
- **Blast radius:** `skills/lets-go/references/shape.md` (*Start from an idea*, *Run the shape step*, the stop note after *Pick the first ready story*, one new section), one sentence and one placeholder row in `skills/lets-go/SKILL.md`, and the wording checks in `tests/skill-interfaces.bats`. Users of `lets-go` see the change only after a stop during Finalize.

## Decisions

### DS1. Move the lookup into its own section, *Find the input's discovery*

Add `## Find the input's discovery` to `shape.md`, before *Start from an idea*. It lists the parents, filters them by `Input:` line and says which kept parent is this input's discovery. *Start from an idea* step 1 and *Run the shape step* step 1 link it. The `<parent>` row of SKILL.md's placeholder table and *Backlog errors* name it instead of "the in-progress parent query of *Start from an idea*".

- *Alternative:* keep the lookup inside *Start from an idea* step 1, as today. Rejected: the lookup now has a state check as well as a query, and the dirty-map check would have to point into another section's numbered step for it.

### DS2. Use `lets-shape`'s query string exactly

The lookup runs `gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body`, the same string as *Locate the discovery*, and keeps each parent whose `Input:` line names the input: the idea word for word, or `#<i>` or the issue's URL. When #137 replaces both with one command, there is one query to swap.

- *Alternative:* keep the in-progress query and add a second search for parents with no status line. Rejected: two calls, and a query `lets-shape` does not run.

### DS3. Detect a stop during Finalize from `lets-go`'s own answers file

A kept parent with no status line is this input's discovery only when an earlier shape round of this input left answers. That means `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least one pair. For an idea, `.workspace/lets-go/<shape-name>-shape-prompt.md` must also hold this idea, the same test *Run the shape step* step 3 already makes for ideas that share a `<shape-name>`.

Why this signal works:

- A finished discovery reported `done`, so *Read the report* removed the answers file.
- Finalize runs only after the user confirmed the Phase 5 story table in an earlier round, so a stop during Finalize always leaves at least one pair.
- `lets-go` reads only its own file. It does not interpret the answers, so it copies none of `lets-shape`'s rules. `lets-shape` still decides, from the same answers, whether to finish Finalize.
- It keeps [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md), which says `lets-go` keeps no state of its own outside `.workspace/`. The answers file is not new state: [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md) already puts a resumed step's answers there, and `lets-shape` cannot finish Finalize without them. Without the file, the run behaves as it does today: it stops on the dirty maps, or runs the title search. It never skips work that is not done.

Alternatives:

- *Treat every kept parent with no status line as the discovery.* Rejected: an open epic whose discovery finished would also match. The run would then skip the title search for an idea that matches that epic's stories, which changes what the user is asked.
- *Read the answers for a confirmed Phase 5 story table.* Rejected: it copies `lets-shape`'s Finalize rule, which the tests forbid.

### DS4. Name each parent when several match

When the lookup finds more than one discovery, `lets-go` names each one in its message, skips the title search and runs the shape step. `lets-shape` asks the user which one, as *Locate the discovery* says. `lets-go` asks nothing itself.

### DS5. The tests assert the new strings and forbid the old query

In the test *lets-go runs a shape step for an idea or an unshaped issue*:

- Replace the check for the in-progress-only query with a check for the `Input:` query.
- Add `skill_does_not_say` for the in-progress-only query.
- Add a check that *Find the input's discovery* names the answers file condition.
- Add a check that *Start from an idea* and *Run the shape step* each link `#find-the-inputs-discovery`.

Keep the check for `Discovery status: in-progress`: the lookup still names it.

No ADR: each choice is prose in one reference file and is reversed by editing it. #137 replaces the lookup anyway.

## Risks / Trade-offs

- [A finished epic and an abandoned later shape round of the same input. The answers file exists, so the lookup takes the epic for a discovery. `lets-go` says a discovery is in progress and skips its title search. `lets-shape` drops the epic, goes to *Shape one issue* and runs its own title search, because the header carries no note.] → The user is still asked whether an issue is the same work, by `lets-shape` instead of `lets-go`. The same false match lets the dirty-map check go on, and *Commit the discovery map* could then commit another discovery's map edits onto this story's branch. So when the check went on only because of a parent with no status line, and the shape step shapes none of those parents, whether it reports one issue or a new parent, `lets-go` prints the `Done shape` line, names the dirty maps, says to commit or discard them and stops before *Check the issue*, so it claims nothing and creates no branch (task 1.6). The case needs two runs of the same input after its discovery finished, with the second abandoned mid-question. The design accepts it and records it in the pull request. #137's command can take the parent's state from the backlog instead.
- [More than 500 open parents with an `Input:` line.] → The same limit as `lets-shape`, so both skills miss the same parents.
- [A user deletes `.workspace/` after a stop during Finalize.] → The run behaves as today: it stops on the dirty maps, or runs the title search. No data is lost, and committing or discarding the maps clears the stop.

## Migration & Rollback

N/A. No data or file changes shape. Reverting the change's commits restores the old lookup.
