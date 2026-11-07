## Context

After #200, `skills/lets-go/SKILL.md` is 1,270 lines: an overview table, eleven parts as `##` headings, then `## Procedures` with six `###` procedures. Each procedure already ends with "Return to the part that ran it". But most of them also stop on their own:

- *Find the source of demand* stops on no Project, several Projects, no match, nothing ready and an unresolved prerequisite.
- *Confirm the packet* stops on no Kind, a missing line, unread comments and an Epic.
- *Check the prerequisite* stops a named issue. *Check the checkpoint* stops in each of its six checks, which #199 made explicit.
- *Claim* stops on an existing branch, a taken issue and a failed branch creation. Its lost-race rule jumps back to *Check the issue* itself.
- *Recover from a failed import* ends with "Then stop."

The parts then override some of these stops in nine places: "set aside" in *Start from an idea* and *Check the issue*, and "stands" in *Read the request*, *Check the issue*, *Run the shape step*, *Enter the branch* and *Claim*.

The branch lookup runs in *Check the issue* only when a blocker is open. It runs again in *Enter the branch*, before *Claim*. The `next` case checks only the prerequisite of each candidate.

The tests pin some of this wording:

- `the prerequisite stop stands, even on a stacked branch`, and ``run `next` again with the same candidates``.
- `When the section passes, go on to *Confirm the packet*` in *Check the issue*.
- Six phrases in the *Check the checkpoint* tests that end in `and stop`, such as `report the conflict, and stop, repairing nothing`.
- `return to the part that ran it` and `When *Claim* ran it, return to *Claim*`.
- `at most once`.

The procedure loop test reads each procedure with `procedure_text`. `prose_text` strips fenced code and code spans.

## Goals / Non-Goals

**Goals:**

- Following a procedure word for word is always right. A procedure never stops and never names a part to go to.
- Each part's text says, for every result it can get, exactly what to do.
- A reader finds a stop by reading the part, not by chasing the procedure and its override.

**Non-Goals:**

- Removing duplicated rules, such as *Claim*'s own branch check, which *Check the issue* makes redundant (#202). It stays, and returns `branch-exists`.
- Making the claim atomic. The assignee check and the assignment are two calls, and the race between them is being shaped as a separate bug.
- Moving procedures into `references/` (#203), or renaming them (#204).
- Changing how a step reports. Results are a `lets-go` idea inside one session, not a step report.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. It reads the real `skills/lets-go/SKILL.md`, and uses `fixture_file` skills folders for the failing case of each new check.
- **Existing seams reused:** `procedure_text`, `part_section`, `skill_section`, `prose_text`, `skill_says`, `skill_does_not_say`, `parts_say_next`, `anchors_resolve`, `step_numbers` and `fixture_file`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill changes, but its control flow changes in about fifteen places, and an agent follows it literally. A result a part forgets to handle leaves the agent with no instruction, and no test runs the agent.
- **Blast radius:** `skills/lets-go/SKILL.md`, which both published flows ship, and `tests/skill-interfaces.bats`. `openspec/glossary.md` gained **Procedure** with the brainstorm. No code under `lets/`, and no other skill or schema.

## Decisions

### A procedure ends with its results

Each procedure that can end more than one way ends with a short bulleted list headed `It returns one of these results:`. Each bullet is the result in backticks, when it is returned, and what it carries:

```markdown
It returns one of these results:

- `complete`: every line is there and no comment is unread. It carries the Kind, the Size, and the parent's **Shared decisions**.
- `needs-shape`: the issue is not on the Project or has no Kind, a line is missing or holds a placeholder, or comments are unread. It carries which, with each unread comment's author and date.
- `epic`: the Kind is Epic. It carries the open sub-issues.

Return to the part that ran it, with the result.
```

The places in the body that stop today say "the result is `<name>`" instead. For example: "If the second command prints nothing, or no `kind`, the result is `needs-shape`." The `Return to the part that ran it` line keeps the phrase the tests pin.

The results are the ones the spec's table names:

| Procedure | Results |
|---|---|
| *Find the source of demand* | `found`, `unresolved`, `matches`, `no-match`, `picked`, `nothing-ready`, `no-project`, `several-projects` |
| *Confirm the packet* | `complete`, `needs-shape`, `epic` |
| *Check the prerequisite* | `resolved`, `unresolved` |
| *Check the checkpoint* | `verified`, `checkpoint-failed`, `unresolved` |
| *Glossary preflight* | `no-owned-edits`, `verified`, `unresolved`, `checkpoint-failed` |
| *Claim* | `claimed`, `branch-exists`, `taken`, `unresolved`, `checkpoint-failed`, `branch-failed` |
| *Import the glossary checkpoint* | `imported`, `import-failed` |

The names are hyphenated, like a step report's `needs-input`, so an agent reads `needs-shape` as one name. A result that a procedure passes on from a procedure it runs keeps its name. *Claim* returns *Check the checkpoint*'s `unresolved` and `checkpoint-failed` unchanged.

*Glossary preflight* ends with its own results, after its two subsections. It returns `no-owned-edits` when the story has no **Glossary handoff**, or another issue owns the edits. Otherwise it returns what *Check the checkpoint* returned. `verified` carries the checkpoint commits, in their recorded order, and the ones the rehearsal found already present. *Claim*'s `claimed` carries the preflight's result, so *Enter the branch* knows whether to import without remembering how *Claim* got there.

Alternatives: a results table instead of a list, which wraps badly at 72 columns once the *Carries* text is long; or free prose ("return that the issue needs shaping"), which a part cannot match on and a test cannot check.

### A part handles each result in a list after the call

Right after the sentence that runs a procedure, the part gives one bullet per result, in the procedure's order, with the action:

```markdown
2. Run [Confirm the packet](#confirm-the-packet). On its result:
   - **`complete`:** go on to the shape line, below.
   - **`needs-shape`:** run the shape step when all of these hold … Otherwise …, and stop.
   - **`epic`:** say that an epic is built through its stories, list the open sub-issues it carries, and stop.
```

Each part lists only the results the procedure can return there. When a part runs *Find the source of demand* for a named issue, case 2 and case 3 cannot happen, so it handles only `found`, `unresolved`, `no-project` and `several-projects`. `no-project` and `several-projects` show up in four parts. Each part repeats the one-line action: say to run `lets-setup-backlog`, or list each Project and ask the user to unlink the extras, and stop. That is four short copies. #202 decides whether to define the action once.

### Case 1 is the issue the run has

*Check the issue* runs *Find the source of demand* for every `<i>`: one the user named, one `next` or *Pick the first ready story* picked, and one a shape step shaped. Case 1 is worded today as **The user named an issue**, and *Check the issue* adds "as for a named issue". An agent that reads case 1 literally for a picked issue falls through to case 3 and runs `next` again. D6 also gives "the user named it" a meaning of its own, for the shape step. So case 1 becomes **The run has an issue, `<i>`**, and *Check the issue* drops "as for a named issue". The words "the user named" appear only where the shape step's rule needs them.

### The idea's search returns its matches, and the part asks

Case 2 of *Find the source of demand* returns `matches`, with the issues, or `no-match`. It no longer asks the user. *Start from an idea* already asks, at either level, and keeps the question.

### *Check the issue* reads, looks, then decides

The new order inside *Check the issue*:

1. The blocker read, `gh issue view <i> --json title,blockedBy`, which sets `<name>`.
2. The branch lookup, every time: `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>` on the default branch. On a change's branch, it exists. Keep what it found for *Enter the branch*.
3. The blocker decision, which uses that lookup.
4. *Find the source of demand* for `<i>`, with its results.
5. *Confirm the packet*, with its results.
6. The shape line.

Step 2 sits before the first link to `#confirm-the-packet`, so the order test can compare the two positions as the blocker-order test does. *Enter the branch* stops running the lookup itself, and reads what *Check the issue* kept. After a shape step, *Check the issue* runs again for the shaped issue, so the lookup runs again with the new name.

### When `needs-shape` runs shape

*Check the issue* runs the shape step on `needs-shape` only when all three hold:

- the user named `<i>`, or said in *Start from an idea* that it is the same work;
- the lookup found no branch;
- no shape step has run in this run.

Otherwise it says why the packet needs shaping and to run `lets-shape` on `` `#<i>` ``, and stops. When the branch exists, it first says that the change has started on `` `<name>` ``. So an issue that `next` or *Pick the first ready story* picked never reaches shape. It can reach this stop only when a comment arrives between the pick and the check.

*Run the shape step* loses its sentences about stops that stand. It keeps "It runs on the default branch, before any branch or change exists" and `at most once`, and says that *Check the issue* decides when it runs.

### `next` checks the packet

Case 3 of *Find the source of demand* checks each candidate in rank order, with the candidate's number as `<i>` while it is checked. The `<i>` row of the Placeholders table adds "or, inside `next`, the candidate it is checking", so `Confirm the packet`'s commands read the right issue. It runs [Check the prerequisite](#check-the-prerequisite), then [Confirm the packet](#confirm-the-packet), and takes the first candidate where they return `resolved` and `complete`. A candidate that fails either check is skipped, and kept with its reason for `nothing-ready`. *Pick the first ready story* names those reasons. *Confirm the packet* returns to *Find the source of demand* when that is what ran it, as *Glossary preflight* returns to *Claim*. Its last line names both.

The packet is then checked twice for the picked issue: once in `next`, and once in *Check the issue*. The second check is what catches a comment that arrives in between, so it stays.

The jq filter keeps `.kind != "Epic"`. An item with no Kind passes the filter, and *Confirm the packet* then returns `needs-shape` for it, so `next` skips it. That is one rule, not two.

### A lost claim goes back to the part that picked

*Enter the branch* handles `taken`:

- When the user named `<i>` or confirmed it, it says who has it, and stops.
- Otherwise, it counts the lost claim. After the third in the run, it says that other sessions keep taking the picked issues and to run `lets-go` again, and stops.
- Before that, it goes back to the part that picked: *Read the request* for `next`, or *Pick the first ready story*. That part prints the right `Picked` line, handles `nothing-ready` with its own words, and goes on to *Check the issue*. *Pick the first ready story* prints the `Done shape` line on `nothing-ready` only when this run has not printed it yet. After a lost claim, *Check the issue* has printed it already.

Case 3 of *Find the source of demand* says to leave out every issue lost in this run. So a reused candidate list cannot pick the same issue, even though the `no:assignee` search would usually drop it already. *Enter the branch*'s `Next:` line and its overview row name both ways back.

Alternative: *Enter the branch* runs `next` itself. That would duplicate *Pick the first ready story*'s `nothing-ready` handling and its discovery map advice.

Three is a cap, not a tuning knob. Two lost claims can be bad luck. Three mean another session is working the same backlog in a loop, and the user should look.

### *Enter the branch* handles every claim result

- **`claimed`:** when it carries `verified`, run *Import the glossary checkpoint* with the commits it carries. Then commit the discovery map, and go on. With `no-owned-edits`, skip the import.
- **`branch-exists`:** say so, suggest switching to it and running `lets-go` there, and stop.
- **`taken`:** as above.
- **`unresolved`:** report the owner or checkpoint, and stop, claiming nothing.
- **`checkpoint-failed`:** report what the check found, and stop.
- **`branch-failed`:** *Claim* has released the claim. Show the error, and stop.

The import's `import-failed` reports each cleanup failure and what was kept, and stops.

### The checkpoint returns `checkpoint-failed`

Each of *Check the checkpoint*'s "report it, and stop" becomes "return `checkpoint-failed`, with …". The intro's "Each stop below comes before *Claim* assigns the issue" becomes the same rule about `checkpoint-failed`. The six pinned phrases change to the new wording. The rerun of *Check the prerequisite* returns `unresolved`, and *Enter the branch* stops on it, "even for an issue that `next` picked".

### The banned idioms

A new helper, `override_idioms <skill>`, runs `prose_text` over each of the skill's files. It prints each line that holds `aside` or the word `stand` or `stands`, in any case, unless the word is followed by ` for`. A second helper, `procedure_stops`, writes `procedure_text` of each procedure to a temporary file, runs `prose_text` on it, and prints each line that holds the word `stop` or `stops`. The existing procedure loop calls it.

Matching on words rather than on the nine phrases catches new phrasings, such as "the stop still stands". The `stands for` exception covers the placeholders table, the only legitimate use.

### Overview rows

The *Stops when* column names results, for example: "*Find the source of demand* returns `nothing-ready`, `no-project` or `several-projects`". *Enter the branch*'s *Next* becomes "*Set the level*; *Read the request* or *Pick the first ready story* after a lost claim". *Check the issue*'s row adds `epic`, and `needs-shape` when shape cannot run.

### Tests whose pinned wording changes

The structural checks from #200 stay as they are: `parts_listed`, `parts_say_next`, `step_numbers`, `anchors_resolve`, the `*Start*` and `part way` bans, `lists_start_at_one` and the placeholder checks. These pinned phrases change with the new wording, and the build updates each test with its phrase:

- `the prerequisite stop stands, even on a stacked branch`, in the level-and-relay test.
- ``run `next` again with the same candidates``, in the lost-race test. It becomes `leave out every issue lost in this run`.
- `When the section passes, go on to *Confirm the packet*`, in the blocker-order test. It becomes a check that *Check the issue* handles `found` by going on to *Confirm the packet*.
- The six *Check the checkpoint* phrases that end in `and stop`, such as `report the conflict, and stop, repairing nothing`. Each becomes its `checkpoint-failed` form.

## Risks / Trade-offs

- [A part misses a result, and the agent has no instruction.] → The new checks list each procedure's results, and check that *Check the issue* and *Enter the branch* name the results they handle. The plan review checks the other parts by reading.
- [The `stop` ban catches a legitimate word in a procedure, such as "a stop repairs nothing".] → Rephrase around the result, such as "returning `checkpoint-failed` repairs nothing". The ban is the point.
- [Going back to *Read the request* after a lost claim re-reads the request.] → With nothing on the default branch, the request is the same, so the entry table sends it to `next` again. *Read the request* does no other work that could change.
- [The packet is checked twice for a picked issue.] → Accepted: the second check catches a comment that arrives in between. #202 can merge them.

## Migration & Rollback

N/A. The change is prose in one skill and its tests. Revert the commits to roll back.
