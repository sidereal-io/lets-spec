<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

When `lets-go` runs discovery on an idea, or on an issue too large for
one story, the shape step files a parent issue and its stories. The run
then builds only the first ready story, and the user must run
`lets-go #<parent>` to build the rest. Since #283, `lets-go` builds every
story of an epic it shapes in place, so this is the last path that
stops after one story.

A second gap is left from #283 (pull request #302). An epic that an
idea's discovery filed, and whose discovery stopped during Finalize, is
not found by `lets-go #<epic>`. The run then builds stories under an
epic whose Finalize never finished.

## What Changes

- **Every run whose shape step files a parent and its stories goes on as
  an epic run on that parent (D1).** This holds for an idea, and for an
  issue that discovery turned into a new parent with `Input: #<i>`. The
  run builds every story under the parent, in waves, and ends with one
  line per story, as `lets-go #<parent>` does. It asks the user nothing
  before the epic run starts: the user already confirmed the story table
  in discovery's Phase 5 (D3).
- **Removed: *Pick the first ready story*.** No path reaches it once
  every parent goes on as an epic run (D1). Its line
  `Picked #<i>: <title>, the first ready story under #<parent>.` goes
  with it, and so does its `nothing-ready` stop. An epic run reports a
  story that is not ready with its own `not built` line.
- **`lets-go #<epic>` finishes a discovery that stopped during Finalize,
  when the epic names another input (D2).** *Find the input's
  discovery* also looks for the answers of the input that the epic's
  `Input:` line names: an idea, or an issue `#<n>`. When it finds them,
  the shape step resumes that input's own round, which finishes
  Finalize. The run then goes on as an epic run. This works only on the
  machine whose `.workspace/lets-go/` holds that answers file.
- **Unchanged:** an idea that becomes one issue still builds that one
  issue (D5). A stale answers file can still send a finished epic back
  into `lets-shape`; #137 owns that (D6). No new query finds a discovery
  (D7).
- **Glossary:** *Epic run* now covers a run whose shape step filed the
  epic (D4). It was committed in 791e1fb6, with the brainstorm.
- **README:** the `lets-go` section says an idea too large for one issue
  builds all of its stories.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: after a shape report that names a parent and stories, the
  run goes on as an epic run on that parent, for every input; *Pick the
  first ready story*, its `Picked` line and its requirement are removed;
  *Find the input's discovery* also finds an epic's stopped Finalize by
  the answers of the input its `Input:` line names, and the shape step
  resumes that input's round.

## Impact

- `skills/lets-go/references/shape.md`: *Find the input's discovery*,
  *Run the shape step*, and the removed *Pick the first ready story*.
  Its paragraph on a run that stops after discovery and before *Claim*
  moves, because *Check the issue* and *Report the maps' edits* link to
  it.
- `skills/lets-go/SKILL.md`: the opening paragraph, the overview and
  part table, `<i>` in *Placeholders*, *Check the issue* (the `epic`
  case), *Run the shape step*, the removed *Pick the first ready story*
  part, *Enter the branch* (a lost claim), and *The step lines*.
- `skills/lets-go/references/epic-run.md`: *Report the maps' edits*.
- `skills/lets-go/references/step-prompt.md`: the shape report asks
  for a `story` line for each story in the order discovery created
  them, so a round that only finishes Finalize still lists them.
- `README.md`: the `lets-go` paragraph at line 279.
- `tests/skill-interfaces.bats`: the tests of *Pick the first ready
  story* and its line are removed or changed, and new tests cover the
  epic run after discovery and the Finalize lookup.
- No code, command, schema or config changes.
