<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

An epic run builds its stories one at a time and never says which of
them could be built at once. Mo needs to see that before trusting #286,
which runs a wave's stories in parallel. Sorting the stories into waves
is cheap, and shows whether parallel runs would pay off on a real epic.

## What Changes

- New command `lets backlog waves --only <keys>`. It reads each named
  story's open blockers and packet, sorts the stories into waves, and
  prints one JSON object: each wave's stories, and for each story after
  the first wave, the story it waits for and why (D8). #286 can reuse
  the same output.
- Two stories split when a chain of open blocked-by links joins them
  through the named stories (D3), or when their packets' **Relevant
  code** name overlapping paths (D4). A story whose **Relevant code**
  names no path gets a wave of its own (D5). Placement follows the
  epic's order (D6).
- At the start of an epic run, after *Start the epic run* settles the
  finished stories and before the first `Picked` line, `lets-go` runs
  the command on the stories not settled, and prints
  `Waves for #<parent>:`, one `Wave <n>:` line per wave, and one
  `waits for` line per story after the first wave (D9). The waves are
  computed again on each run (D3).
- Each pick passes only the stories of the earliest wave that still has
  a story not settled. When that wave has nothing ready, its remaining
  stories get the `not built` lines they get today, and the run goes on
  with the next wave (D7). Stories are still built one at a time.
- The glossary entry *wave* is already on this branch, in its own commit
  (D2).

Out of scope: running a wave in parallel (#286), and using affected
specs, which exist only after planning (D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-backlog`: adds the `waves` command, its placement rule and its
  output.
- `lets-go`: an epic run prints its waves at the start, and each pick
  takes its candidates from the earliest wave with a story not settled.

## Impact

- `lets/src/backlog/commands.ts`: the `waves` command and its help text.
- `lets/src/backlog/`: a new module for the path parsing and placement,
  next to `policy.ts`. It uses only the adapter's `readItem`, so every
  backlog provider gets it.
- `skills/lets-go/references/epic-run.md`: *Start the epic run* prints
  the waves; *Pick the next story* passes one wave at a time.
- `tests/lets/backlog/`: Node tests for parsing, placement and the
  command's output. `tests/skill-interfaces.bats`: checks on the skill's
  text.
- No dependency changes. `lets backlog ready` is unchanged.
