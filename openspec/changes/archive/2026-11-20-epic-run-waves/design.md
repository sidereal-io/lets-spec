<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- The epic run lives in `skills/lets-go/references/epic-run.md`, under
  *Run the epic*. Step 1, *Start the epic run*, settles the stories an
  earlier run finished. Step 3, *Pick the next story*, runs
  `lets backlog ready` with every story of the epic in this repository
  as `--only`. Step 4 handles `picked` and `nothing-ready`.
- The epic run keeps its state in scratch files under
  `.workspace/lets-go/`, such as `epic-<parent>-lines.txt`, so it
  survives a long session.
- `lets backlog` is in `lets/src/backlog/`. `commands.ts` parses the
  commands with commander and prints one JSON object. `policy.ts` holds
  the rules every backlog provider shares. The adapter's `readItem`
  returns an item's `body` and its `blockedBy`, each with `key`,
  `label` and `state`.
- An item's key is opaque (ADR-025). With GitHub, a blocker in another
  repository has a number-only `key`, such as `7`, and a label that
  names its repository, such as `acme/lib#7`. A key alone can match the
  wrong issue.
- The packet's **Relevant code** is one list item:
  `- **Relevant code**: <paths / modules ...>`, written by `lets-shape`
  from `skills/lets-shape/templates/issue-template.md`. Real packets mix
  paths, section names in parentheses, and code spans that are not
  paths, such as `ready --only`.
- `tests/skill-interfaces.bats` already checks the text of *Run the
  epic*, including the example `lets backlog ready --only 279,280,281`
  lines.

## Goals / Non-Goals

**Goals:**

- Put the wave rules where Node tests can pin them: path parsing,
  overlap, placement and the reason text.
- Keep the skill's part small: run one command, print its result, and
  narrow each pick to one wave.
- Give #286 an output it can read without parsing the skill's lines.

**Non-Goals:**

- No change to `lets backlog ready` or its ranking.
- No reading of affected specs, branches or pull requests in the
  command.
- No parallel work: stories are still built one at a time.

## Test Seams

- **Primary test seam:** `run(['waves', '--only', ...], deps)` from
  `lets/src/backlog/commands.ts`, with the fake `gh` of
  `tests/lets/backlog/fixtures/fake-gh.ts`, in a new
  `tests/lets/backlog/waves.test.ts`. Each spec scenario of
  `lets-backlog` is one test: the fake answers `issue view <n>` with a
  body and `blockedBy`, and the test asserts the printed JSON.
- **Existing seams reused:** `tests/skill-interfaces.bats` for the
  skill's text, as the earlier epic-run changes did; and
  `tests/lets/backlog/cli.test.ts` for the help text.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** one new `lets backlog` command, read-only, and the
  epic run's start and pick in `references/epic-run.md`. Runs that are
  not epic runs do not change. No backlog write, schema or permission
  changes.

## Decisions

### D-A. The rules go in a new module, `lets/src/backlog/waves.ts`

The module exports three pure functions: one that reads an item's paths
from its body, one that says whether two items overlap and why, and one
that places items into waves and gives each its reason. `commands.ts`
adds the `waves` command: it reads each named item with
`adapter.readItem`, one at a time in `--only`'s order, and prints
`{ waves }`. The items are read in turn, not all at once, so the fake
`gh` sees a fixed order and the backend sees no burst.

- Alternative: put the rules in `policy.ts`. Rejected: that file holds
  ready, claim, release and complete, and waves are a separate concern
  with their own tests.
- Alternative: write the rules in the skill's text. Rejected (D8): an
  agent applying placement by hand cannot be tested, and #286 would
  repeat it.

### D-B. A blocker matches a named item by both key and label

A `blockedBy` entry counts when its `state` is `OPEN`, and its `key`
and `label` equal those of a named item, as `readItem` returned them.
The label carries the repository, so `acme/lib#7` never matches `#7`.
This keeps the key opaque: the command compares, and never takes a key
apart.

### D-C. Relevant code is read from its one list item

The command finds the first line that matches
`- **Relevant code**:` (or `* **Relevant code**:`), at any indent, and
takes the rest of that line, plus the lines after it that are indented
more and do not start a new list item. It reads the code spans in that
text. A code span is a path when it has no whitespace, and either holds
a `/` or ends in `.` and letters or digits. A leading `./` is dropped
from a longer path.
Overlap compares paths with any trailing `/` dropped: equal, or one
followed by `/` starts the other. The repository's root, `./` or `/`,
holds every path. Case matters, as it does in Git.

A body with no such line, or a line with no path, gives no paths, and
the item overlaps everything (D5).

### D-D. Placement is a stable topological sort, then first fit

Each round takes the first item in `--only`'s order whose blockers are
all placed. That follows the epic's order (D6) and still puts a blocker
first when the epic lists it later. The item starts at the wave after
its latest blocker, and moves on while it overlaps a story in that wave.

The reason comes from the wave just before the item's own. When the
item is in the first wave it could take, that wave held its latest
blocker: `blocked by <label>`. Otherwise an overlap pushed it out of
that wave, and the reason names the first story there it overlaps. This
gives one reason per story, and for an item the sort placed, the story
it names is always in the wave just before.

Items left after the sort have blockers in a loop, or depend on one.
GitHub does not stop a loop of blocked-by links. Each left item gets a
wave of its own, at the end, so the command still returns every item.
Its reason names its first left blocker, which can sit in a later wave:
with `--only 1,7,8`, where #7 and #8 block each other, #7 in wave 2
waits for #8 in wave 3. The line is still true, and neither story is
ever built.
None of them is ever ready, so they get their `not built, blocked by`
lines when the epic run reaches their wave.

### D-E. The command writes the reason text

`reason` is the English text the skill prints after `waits for #<other>:`.
The skill adds only the story labels and the full stop. The wording
lives in one place and Node tests pin it, such as
`both name skills/lets-go/references/shape.md`. #286 needs the waves,
not the reasons, so it reads `waves[].stories[].key`.

- Alternative: a reason code, such as `blocked` or `shared-path`, plus
  fields. Rejected: the only reader prints it, and the skill would have
  to hold the wording.

### D-F. The epic run keeps the waves in a scratch file

At the end of *Start the epic run*, when a story is not settled, the
skill runs:

```bash
lets backlog waves --only <keys> > .workspace/lets-go/epic-<parent>-waves.json
```

`<keys>` are the keys of the epic's stories in this repository that are
not settled, in the epic's order. On exit 1 the file holds the error,
and the skill acts as *Backlog errors* says. Otherwise it prints the
lines of D9 from the file. *Pick the next story* reads the file again
for every pick, so the waves survive a long session the way the lines
file does. The file is written afresh on each run.

### D-G. A pick narrows `--only` to the current wave

*Pick the next story* finds the current wave: the first in the file
with a story not settled. It passes that wave's stories as `--only`.
`--exclude`, `--met-blockers` and `--started` are found as today. On
`nothing-ready`, step 4 settles that wave's remaining stories with
today's reasons. Then, when a later wave holds a story not settled, it
goes back to step 3; otherwise to *End of the run*. A wave can be
empty of unsettled stories before its turn, for example when every
story in it depends on a story that failed. The current-wave rule skips
it.

### No ADR

The decisions above are cheap to reverse. The command is read-only and
new, and only the epic run reads it. The cost of the choice to sort by
**Relevant code** rather than affected specs is recorded on epic #278,
as a shared decision.

## Risks / Trade-offs

- [GitHub's `readItem` makes two or three `gh` calls per story,
  including a Project item list.] → An epic has a handful of stories,
  and the command runs once per epic run. If epics grow, a lighter read
  of body and blockers can come later without changing the output.
- [A packet that does not follow the template, or names a module in
  words, gives no paths.] → That story gets a wave of its own and its
  reason says so, which is the safe side: it never shares a wave by
  mistake.
- [A file named under **Relevant code** is not the only file a story
  edits.] → The waves are a plan, printed for Mo to judge before #286
  runs anything in parallel. This change builds one story at a time, so
  a wrong split costs no conflict yet.
- [Narrowing `--only` to one wave can leave a ready story of a later
  wave unbuilt while the current wave waits.] → It does not wait: a
  wave with nothing ready is settled at once (D7), and the run moves on.
- [The `bats` checks pin the example `--only 279,280,281` lines.] →
  The tasks update those checks together with the skill's text.

## Migration & Rollback

N/A. The command is new and read-only. Rolling back removes it and the
epic run's waves step; an epic run then picks from all its stories, as
before.
