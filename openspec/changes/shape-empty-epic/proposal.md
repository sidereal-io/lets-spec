<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

When a user runs `lets-go` on an epic that has no stories yet, the run
stops with `lets-go does not shape an empty epic yet`. The user then has
to run `lets-shape` by hand, and its discovery files a second parent
issue beside the epic the user already made. The epic run (#279) and the
shape step (#264, #267) are now in place, so `lets-go` can shape the
epic itself and go on to build it.

## What Changes

- **An empty epic is shaped in place.** An empty epic is Kind Epic with
  no sub-issues, open or closed (D1). When `lets-go` reaches one, it
  runs the shape step on it, then goes on as an epic run on that epic
  and builds its stories (D7).
- **`lets-shape` takes an empty epic as discovery's parent.** It asks no
  `Run discovery on it?` question and goes straight to Ingest (D2).
  Ingest writes the parent template into the epic's own body, with an
  `Input:` line that names the epic, and files no second parent (D3).
  The epic keeps its title (D5). Its original text is kept word for word
  in a section at the end of the new body (D4). This holds whoever runs
  `lets-shape`.
- **A discovery that fits one story turns the epic into that story,**
  as any discovery does today (D6).
- **An epic whose discovery stopped partway is finished before it is
  built**, even when it already has open stories (D8). `lets-go` finds
  it with *Find the input's discovery*, which now also keeps the input
  issue when the issue is itself a parent. An epic whose discovery
  finished is still never shaped again.
- **A finished epic stops the run.** When every sub-issue of an epic is
  closed, `lets-go` prints
  `#<parent> is finished: every story under it is closed.` and stops,
  claiming nothing (D9).
- **`lets backlog item` also reports an epic's closed sub-issues**, so
  that `lets-go` can tell an empty epic from a finished one (D10). The
  existing `subIssues` field is unchanged.
- **Removed:** the line
  `#<parent> has no open stories. lets-go does not shape an empty epic yet: run the lets-shape skill on #<parent>.`
  and the requirement that prints it (D12).
- **Glossary:** a new term, *Empty epic*, and the *Epic run* entry says
  "when the epic is empty" (D11).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: an epic run on an empty epic runs the shape step first; an
  epic with a stopped discovery is shaped before it is built; a finished
  epic stops with its own line; *Find the input's discovery* keeps an
  input issue that is itself a parent; the epic's map commit lands on
  the first story the epic run claims.
- `discovery-checkpoints`: `lets-shape` picks a new path for an empty
  epic, skips the discovery question for it, and writes the parent into
  the epic's own body, with its `Input:` line naming the epic.
- `lets-backlog`: `lets backlog item` returns the closed sub-issues
  beside the open ones.

## Impact

- `skills/lets-go/SKILL.md` (*Check the issue*, *Confirm the packet*,
  *The step lines*), `skills/lets-go/references/epic-run.md` (*Run the
  epic*), `skills/lets-go/references/shape.md` (*Find the input's
  discovery*, *Run the shape step*, *Commit the discovery map*).
- `skills/lets-shape/SKILL.md` (*Locate the discovery*, *Phase 1:
  Ingest*, the read-only input rule) and
  `skills/lets-shape/templates/issue-template.md`.
- `lets/src/backlog/policy.ts` (`itemView`), `lets/src/backlog/commands.ts`
  (usage text), and the Node tests for `lets backlog item`.
- `tests/skill-interfaces.bats`: the test for the removed line is
  replaced.
- `openspec/glossary.md`.
- `lets backlog item`'s JSON gains a field. Nothing that reads it today
  breaks.
