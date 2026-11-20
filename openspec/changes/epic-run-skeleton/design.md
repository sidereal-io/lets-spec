## Context

`lets-go` is a skill: prose that an agent follows. Nothing executes it, so its tests are structural. `tests/skill-interfaces.bats` reads `skills/lets-go/SKILL.md` and its reference files, and checks the parts, links, placeholders, fixed lines and wrapping that the `lets-go` spec sets.

The shapes this change must fit:

- **Parts.** A run is a list of named parts, each a `##` heading, listed in run order in an overview table. Every part but *End of the run* ends with a `Next:` line. The tests hold the list of parts in `lets_go_parts`.
- **Reference files.** What only some runs need lives in `skills/lets-go/references/`. A part whose steps moved keeps its heading, its overview row, a sentence that links its steps, and its `Next:` line in `SKILL.md`. *Pick the first ready story* is the model: its steps are in `references/shape.md`.
- **Placeholders.** Every `<placeholder>` in any file of the skill has exactly one row in the Placeholders table, and means one thing.
- **Printed lines.** A whole printed line is given in a `text` block. A step is named in plain words in prose, such as `review build`.
- **The epic stop today.** *Check the issue* reads the issue with `lets backlog item <i>`, looks for the change's branch, decides on an open blocker, runs *Find the source of demand* (whose first case runs *Check the prerequisite*), then *Confirm the packet*. *Confirm the packet* returns `epic` for an Epic, with its open sub-issues, and *Check the issue* lists them and stops.
- **The backlog commands already fit.** `lets backlog item` prints only the open sub-issues, each with `key`, `label`, `title` and `url`. `lets backlog ready` takes `--only` and `--exclude`, and leaves out an issue that is blocked, assigned, not Todo, an Epic or a Wont. A sub-issue in another repository gets its number as its key, so its key can match an issue of this repository.

## Goals / Non-Goals

**Goals:**
- One new part, *Run the epic*, holds the epic run, with its steps in one new reference file.
- The parts a story already runs through, from *Check the issue* to *Walk the step table*, run unchanged for each story, apart from where each one goes next in an epic run.
- The rules that only an epic run needs are written once, in `references/epic-run.md`.

**Non-Goals:**
- Child sessions (#284), stacking (#280), going on past a failure (#281), resume (#282), shaping an empty epic (#283) and waves (#285, #286).
- Any change to `lets backlog` or other code.
- Any change to `openspec/glossary.md` or `references/terms.md` (D4, and the decision on terms below).
- The skill's `description`. It holds 59 of its 60 words, and the README's routing row already sends "take a story to a ready pull request" to `lets-go`.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, with its helpers `part_section`, `parts_listed`, `parts_say_next`, `skill_says`, `section_moved`, `placeholders_listed_once` and the fixed-line checks. Each new requirement's scenarios that name the skill-interfaces test become a test there.
- **Existing seams reused:** `lets_go_parts`, which gains *Run the epic* after *Pick the first ready story*, and `section_moved`, which gains `references/epic-run.md`.

Behavior that only a live run shows, such as a whole epic run on #278, is outside the seam. The review build step checks it by reading the skill against the scenarios.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill and its tests, on the patterns the skill already uses. No code, schema or contract changes, but #280 to #287 build on the shape this change gives the epic run.
- **Blast radius:** `skills/lets-go/SKILL.md`, a new `skills/lets-go/references/epic-run.md`, `tests/skill-interfaces.bats` and the `lets-go` section of `README.md`.

## Decisions

1. **One new part, *Run the epic*, placed after *Pick the first ready story*.** Its row says it starts or goes on with an epic run: it picks the next ready story, or ends the epic run. Its `Next:` line goes to *Check the issue* with the picked story, or to *End of the run* when no story is left. Its steps live in `references/epic-run.md`, under the heading `Run the epic`, like the shape parts in `shape.md`.
   *Alternative:* extend *Pick the first ready story*. It picks once, from a shape report's stories, and stops with a different message when nothing is ready. Making it loop would change a part that #287 also needs as it is. *Alternative:* put the steps in `SKILL.md`. That breaks the rule that what only some runs need sits in a reference file.

2. **The loop goes through *Walk the step table*, not *End of the run*.** In an epic run, the walk's `Next:` line goes back to *Run the epic*, which settles the story's line, runs `git switch <default>` and picks again. *End of the run* stays the last part, the run is over there, and in an epic run it prints every story's line. *Alternative:* let *End of the run* loop back. That breaks "every part but *End of the run* ends with `Next:`" and "*End of the run* says the run is over".

3. ***Check the issue* treats an epic as the spec says (D9), at three points.**
   - At the branch lookup: an epic has no change's branch, so `lets-go` looks for none, and an open blocker stops the run as for an issue with no branch.
   - At *Find the source of demand*: it does not run for an epic, so *Check the prerequisite* does not run on the epic.
   - At the `epic` case: on the default branch it goes to *Run the epic*; on a change's branch it says an epic run needs the default branch, and stops (D3).

   *Confirm the packet* is unchanged: it already returns `epic` from the Kind alone, from the read *Check the issue* made.

4. **Each pick is the `next` case of *Find the source of demand*.** The candidates are the epic's stories in this repository, passed as `--only`, with every settled story as `--exclude`. This is the same case *Pick the first ready story* runs. A sub-issue in another repository is never passed: its number could name an issue of this repository. It settles at once, with `not built, in another repository`. The epic's stories are the open sub-issues that the first `lets backlog item <parent>` printed, and they stay that set for the whole run (D5).

5. **The story lines live in a scratch file, `.workspace/lets-go/epic-<parent>-lines.txt`.** *Run the epic* writes the file afresh when the epic run starts, appends each line as the story settles, and prints that line. *End of the run* prints the file. An epic run can hold many long steps, and the file keeps the lines through a long session. It is scratch, like the other files in `.workspace/lets-go/`: no rule reads it to decide what to do, and resume (#282) reads Git and GitHub.

6. **One rule says what a stop does in an epic run, under the heading *A stop in an epic run* in `references/epic-run.md`.** It applies to every stop of every part and procedure while a story is in progress, except the lost claim. The rule's text is written once. Each stop keeps its own text, so the existing requirements and tests stay as they are. The rule is linked where an agent meets a stop, as each `lets backlog` call links *Backlog errors*: one link in each section that holds a stop a story can reach, next to its stops. Those sections are *Backlog errors*, *Check the issue*, *Enter the branch*, *Walk the step table*, *Run a step*, *Read the report* and *Relay the questions* in `SKILL.md`, and *Records that disagree* in `references/records.md`. The sentence after the overview that says any part stops on a `lets backlog` error links the rule too. A test checks that each of the eight sections has the link. *Backlog errors* is one of them, because every `lets backlog` call a story makes goes there on an error (plan review round 2).
   *Alternative:* add an epic-run clause to each stop. That is about twenty clauses, and breaks "each rule is written once". *Alternative:* a link at every single stop, about twenty. One link per section sits close enough to each stop, and keeps the sections readable. *Alternative:* link only from the overview. An agent that reaches a local `Stop.` deep in a story's steps may not hold the overview in mind, and end without settling the story lines (plan review round 1).

7. **A lost claim in an epic run goes back to *Run the epic*.** In *Enter the branch*, the `taken` case gets an epic-run branch first: settle the story with `not built, taken by <login>` and go back to *Run the epic*, counting no lost claim. *Enter the branch*'s `Next:` line names *Run the epic* for that case (D8).

8. **New placeholders, each with one meaning.** `<story-name>` (the part of a story's title before ` — `, or the whole title), `<pr-url>` (a story's pull request URL), `<login>` (an assignee's login) and `<step name>` (a step's name in plain words, such as `review build`). `<stopped-story>` (the story the epic run stopped at, in a `not built` line for another story). The rows for `<parent>` and `<story>` also say that *Run the epic* sets them. A blocker in a `not built` line is written `#<blocker>`, which needs one more row. The old `<n>` stays unused.

9. **The new fixed lines go in `text` blocks in `references/epic-run.md`:**

   ```text
   Picked #<i>: <title>, the next ready story under #<parent>.
   #<parent> has no open stories. lets-go does not shape an empty epic yet: run the lets-shape skill on #<parent>.
   #<story> <story-name>: <pr-url>
   #<story> <story-name>: not built, <reason>
   #<story> <story-name>: failed at <step name>: <reason>
   #<story> <story-name>: stopped: <reason>
   ```

   The reasons in a `not built` line, such as `blocked by #<blocker>`, `taken by <login>` and `the epic run stopped at #<stopped-story>`, are listed beside the lines. `<stopped-story>` and `<story>` are two placeholders because the line names two stories: `#<story>` is the story not built, and `#<stopped-story>` the story the run stopped at.

10. **The question mode is set per story, by the existing part.** *Set the question mode* runs for each story and prints its line. The mode the user named for the epic run is its first source, so it holds for every story. Nothing changes in that part.

11. **`references/terms.md` gets no *Epic run* or *Story run* entry.** That file copies glossary entries word for word, and those entries say a story run runs in a child session. In this change it does not (D4). `epic-run.md` says what an epic run does here in its opening lines, and #284 adds the entries when the behavior matches them.

12. **The README's `lets-go` section gets one paragraph** on running `lets-go` with an epic's number: what it builds, what it leaves out and what it prints at the end.

No decision here is costly to reverse: each is prose in one skill, and #280 to #287 will reshape it.

## Risks / Trade-offs

- [An agent at a stop deep in a story's walk misses the epic-run rule, and stops without printing the lines] → Each section that holds such a stop links the rule next to its stops, as each `lets backlog` call links *Backlog errors*, and a test checks every one of those links. A new stop added later in another section can still miss it; the test names the sections, so a change that adds one updates that list. The scenarios of *A failure or a stop ends the epic run at that story* name a failed build and records that disagree.
- [The session's context fills up over many stories, because each story runs in this session] → Accepted for the skeleton: each step still runs in a fresh session, so this session holds only lines and reports. The lines file keeps the result. #284 moves each story run into a child session.
- [A stale lines file from an earlier epic run mixes old lines into the new run] → *Run the epic* writes the file afresh when the epic run starts.
- [The glossary describes behavior this change does not have] → The spec and `epic-run.md` say which parts are left to #283 and #284 (D4).
- [Adding a twelfth part breaks many structural tests at once] → The first task updates `lets_go_parts` and the overview together, then each later task adds one behavior and its test.

## Migration & Rollback

N/A. Only prose and tests change. Reverting the commits restores the stop at an epic.
