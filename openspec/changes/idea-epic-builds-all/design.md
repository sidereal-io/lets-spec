<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- **Where a shaped parent goes today.** Step 5 of *Run the shape step*
  in `skills/lets-go/references/shape.md` has two cases for a report
  that names a parent and its stories. A parent that is the run's own
  issue `<i>` (an empty epic shaped in place, #283) goes back to the
  blocker read in *Check the issue*, whose `epic` case starts the epic
  run. Any other parent goes to *Pick the first ready story*, which
  builds one story.
- **The epic run.** *Check the issue*'s `epic` case in
  `skills/lets-go/SKILL.md` sorts an epic: empty, finished, a stopped
  discovery (found with *Find the input's discovery*), or any other
  epic, which goes to *Run the epic* in
  `skills/lets-go/references/epic-run.md`. Case 4 prints `Done shape`
  before *Run the epic* when a shape step ran. The epic run already
  commits the discovery maps on the first story it claims, and *Report
  the maps' edits* names them when they are still uncommitted.
- **A parent's Kind.** `lets-shape` sets Kind Epic on every parent it
  creates (Phase 1: Ingest), so *Confirm the packet* returns `epic` for
  it.
- **The gap from #302.** *Find the input's discovery*, run for
  `#<epic>`, keeps the epic because it is itself a parent. With no
  status line, it then looks for answers under
  `issue-<epic>-shape-answers.yaml`. A round that started from an idea
  or from another issue left its answers under that input's shape name,
  `idea-<slug>` or `issue-<n>`, so the lookup finds nothing.
- **What `lets-shape` needs to finish Finalize.** Its *Locate the
  discovery* finishes Finalize on a parent with no status line only
  when the answers confirm its Phase 5 story table. Given the original
  input, it keeps the parent by its `Input:` line. Given `#<epic>`, it
  keeps the epic as the input itself, but the answers are not there.
- **Constraint from #267 and #302.** `lets-go` adds no new query for a
  discovery: it reuses *Find the input's discovery* (brainstorm D7).

## Goals / Non-Goals

**Goals:**

- One route after a shape report that names a parent: back to the
  blocker read with the parent, so every such run is an epic run.
- *Pick the first ready story* leaves the skill with no trace, and
  every link to it moves to what replaces it.
- `lets-go #<epic>` finishes a Finalize that an idea's or another
  issue's round left, using that round's own answers.

**Non-Goals:**

- Changing how a discovery that became one story runs (brainstorm D5).
- The stale answers file that can send a finished epic back into
  `lets-shape`. That is #137 (brainstorm D6).
- Any change to `lets-shape`.
- Finding the gap's answers on a machine that does not hold them.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. Every behavior
  here is skill text, and that file checks fixed lines, links, part
  order and section content.
- **Existing seams reused:** the tests that name *Pick the first ready
  story* are removed or rewritten (around lines 924, 931, 1037, 1091,
  1403, 1617, 1878, 2115, 2428, 2481 and 2490 today). *the shaped epic
  goes back to Check the issue* becomes the test of the single route.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** `lets-go`'s shape path (`SKILL.md`,
  `references/shape.md`), one paragraph in `references/epic-run.md`,
  `README.md`, and the bats tests. No code, command, schema or config
  changes, and `lets-shape` is untouched.

## Decisions

### D1. One route for every shaped parent

Step 5 of *Run the shape step* keeps two cases for a `done` report:

- **One issue:** as today.
- **A parent and its stories:** the parent is `<i>`. Go on from the
  blocker read in *Check the issue* with it. That read finds the
  parent's new open stories, and its `epic` case starts the epic run.

The second pass through the `epic` case lands on case 4: the parent
has open stories, and *Find the input's discovery* finds nothing,
because Finalize removed the status line and *Read the report* removed
the answers file. Case 4 prints `Done shape` and goes to *Run the epic*.
No new code path: this is the route #283 built for an empty epic.

The part table's row for *Run the shape step* says *Check the issue*
for both cases. *Run the shape step*'s `Next:` line says the same.

*Alternative:* go straight from the report to *Run the epic*. It lost,
as in #283's D2: *Run the epic* takes its stories from what
`lets backlog item` printed in *Check the issue*, and the epic's own
blocker check would be skipped.

### D2. *Pick the first ready story* is removed

Remove the part and every mention of it:

- `SKILL.md`: the `##` part, its row in the part table, its name in the
  overview paragraph, the `<i>` placeholder row, the *Enter the branch*
  `taken` case ("or *Pick the first ready story*" and the way back to
  it), *Enter the branch*'s row and `Next:` line, *The step lines*
  (where `Done shape` prints when no story is ready), and the opening
  paragraph, which says the run builds the first ready story.
- `references/shape.md`: the section, and its `Picked ... the first
  ready story under #<parent>.` line.

A lost claim outside an epic run can now come only from `next`, so the
`taken` case goes back to *Read the request* only.

The section's closing paragraph, on a run that stops after discovery
and before *Claim*, is still needed: *Check the issue* links it twice
and *Report the maps' edits* links it once. It moves to a new `###`
subsection of *Run the shape step* in `references/shape.md`, *Name the
maps' edits*, with its words kept. Each of the three links points
there. It cannot go under *Commit the discovery map*: that is a
procedure, and a procedure's text holds no `stop`.

*Alternative:* keep *Pick the first ready story* for one input, such as
a split issue. It lost in the brainstorm (D1): two behaviors after the
same report.

### D3. *Find the input's discovery* also reads the named input's answers

Add one rule to step 3 of the procedure, for the case D6 of #283 left
open. When the input is an issue `#<i>` kept because it is itself in
the parent list, its `Input:` line names another input, and it has no
status line:

1. Take the named input. An `Input:` line of `#<n>` or an issue URL
   names the issue `#<n>`; any other text names an idea, word for word.
2. Make that input's `<shape-name>`, as *The shape step's name* says:
   `issue-<n>`, or `idea-<slug>` from the idea.
3. The epic is this input's discovery when
   `.workspace/lets-go/<shape-name>-shape-answers.yaml` holds at least
   one pair, and, for an idea,
   `.workspace/lets-go/<shape-name>-shape-prompt.md` holds that idea.

The procedure now returns each discovery with its *shape input*: the
input whose shape round resumes it. That is the named input for a
discovery found by rule 3, and this input for every other one. The
procedure still names no result: it ends one way. No new query runs;
the parent list and its `Input:` lines are already in hand.

The rule applies only with no status line. An epic that says
`Discovery status: in-progress` is already found, and `lets-shape`
resumes it from `#<epic>` with Resume mode, which reads the status line
and needs no answers.

*Alternatives:*

- Run the shape step for `#<epic>`, and copy the named input's answers
  to `issue-<epic>-shape-answers.yaml`. It lost: the answers belong to
  the other session's questions, and *Read the report* would remove only
  the copy, leaving the original to send a later run back in (the #137
  risk, made worse).
- Teach `lets-shape` to finish Finalize from `#<epic>` with no answers.
  It lost: `lets-shape` needs the answers that confirmed the Phase 5
  story table before it finishes Finalize, and this story changes no
  `lets-shape` rule.

### D4. The shape step runs for the discovery's shape input

Where *Check the issue*'s `epic` case 3 now says "run the shape step for
`#<i>`", it runs the shape step for the shape input that *Find the
input's discovery* returned. For an idea, the step is the idea's step:
its `<shape-name>`, its prompt (*Write the prompt*'s idea form, with
the idea from the `Input:` line), its answers file, and the idea check
in step 3 of *Run the shape step*. For `#<n>`, it is `#<n>`'s step.

`lets-shape`, given that input, keeps the epic by its `Input:` line and
finishes Finalize with the answers. Its report is
`epic #<epic>: <title>`, followed by a `story` line for each of the
epic's stories, so D1 sends the run back to *Check the issue* with
`#<epic>`, and the epic run starts. *Read the report* fails an `epic`
line with no `story` line. The step prompt in
`references/step-prompt.md` asks for the story lines "in the order you
created them", which a round that only finishes Finalize can read as
none: that round created no story. So the prompt says "in the order
discovery created them" instead, as *Read the report* already does. *Read the report* removes the
named input's answers file, which is the one the step used.

Step 1 of *Run the shape step* already takes the discovery that *Check
the issue* found, so its dirty-map check needs no change. Its step 5
check, "the step shaped none of those parents", compares the reported
parent with `#<epic>`, which matches.

When the lookup returns several discoveries with different shape
inputs, run the shape step for `#<i>`, as today, and let `lets-shape`
ask which one. Finding two parents for one epic is already rare.

### D5. The README and the main spec's Purpose

`README.md:279` says the run picks the first ready story. It changes to
say the run builds every story under the parent, as an epic run, and
that the discovery map is committed on the first story the epic run
claims. The Purpose of `openspec/specs/lets-go/spec.md` says the skill
"picks the first ready story". A delta cannot change a Purpose, so the
build edits the main spec's Purpose directly, to "builds every story it
files".

## Risks / Trade-offs

- [The gap fix needs the answers file, which lives only in
  `.workspace/lets-go/` on the machine where the round ran] → On another
  machine, the lookup finds no discovery and the epic run starts on a
  half-finalized epic, as before this change. The spec records this
  limit as a scenario. Running `lets-shape` by hand on the original
  input still finishes Finalize.
- [A parent whose Kind is not Epic, if a Project write failed in
  Ingest] → *Confirm the packet* returns `needs-shape`, a shape step has
  already run, so the run says to run `lets-shape` on the parent and
  stops. Nothing is claimed.
- [A large discovery now builds many stories in one run, with no
  question first] → The user confirmed the story table in Phase 5, and
  the epic run already prints its waves before the first pick. To build
  one story, run `lets-go #<story>`.
- [A stale answers file under the named input's shape name sends a
  finished epic back into `lets-shape`] → Same class as #137's risk;
  rule 3 adds one more place it can happen. The idea check (the prompt
  file must hold the idea) narrows it for ideas. #137 replaces the
  lookup.

## Migration & Rollback

N/A. No data changes shape. Reverting the change brings back *Pick the
first ready story*; a parent filed while this change was in force is an
ordinary epic and builds with `lets-go #<parent>`.
