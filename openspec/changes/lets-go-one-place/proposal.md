## Why

An agent that follows `lets-go`, and a maintainer who changes it, must
read some results in two or three places and follow a stub section to
another file. A path such as *Pick the next story* crosses four files.
When the same result is described twice, the two copies drift, and the
reader cannot tell which one holds. #270 asks that each rule and each
result list is written once. The moves of #267 and #268 are done, so
this cleanup no longer rewrites text that they delete.

## What Changes

What a run does does not change. Only where `lets-go` writes each rule
changes.

- **Each procedure result is described once** (D6): in the procedure's
  closing list, which says when the result is returned and what it
  carries. The step that returns a result names it only. The part that
  runs the procedure gives each result with its action only. A
  procedure that passes on another procedure's result links that
  procedure's list. This touches *Find the source of demand*, *Confirm
  the packet* and *Claim* in `SKILL.md`, *Glossary preflight* and
  *Import the glossary checkpoint* in `references/glossary-handoff.md`,
  *Take up a started story* and *Stack the story* in
  `references/epic-run.md`, and *Commit the map in an epic run* in
  `references/shape.md`. *Import the glossary checkpoint* gains a
  closing list.
- **The *Run the epic* stub goes** (D7). The part keeps its row in the
  overview and its `##` heading, now in `references/epic-run.md`. Every
  link goes there, and that section ends with the stub's `Next:` line.
- **The placeholder table keeps only shared placeholders** (D8). 12
  placeholders that one section uses leave the table, and that section
  explains each. `<word>`, `<kebab-name>` and `<one-line outcome>` keep
  their rows as named exceptions until the cleanup. `<skill>`,
  `<plain-language-path>` and `<the sentence above>` keep theirs
  until #349 removes them.
- **Left alone:** the text that five open pull requests change in
  `skills/lets-go/` and `openspec/glossary.md` (D1). The parts of
  #270 that need that text wait for them (D2), and the pull request
  lists each part with the pull request it waits for.
- **No glossary edit** (D5), no change to the repeated epic-run stop
  sentence (D9), and no test change (D4).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lets-go`: where the skill writes each procedure result, where the
  *Run the epic* part's heading lives, and which placeholders the
  table lists. The changed requirements are *Each placeholder in
  lets-go names one thing*, *lets-go opens with an overview of its
  parts*, *Each part ends by saying what comes next*, *Each lets-go
  procedure returns a result*, *Each part names the action for each
  result*, *Each lets-go rule is written once*, *lets-go keeps what
  only some runs need in reference files* and *An epic run starts on an
  epic with open stories*.

## Impact

- **Skill text:** `skills/lets-go/SKILL.md`,
  `skills/lets-go/references/epic-run.md`,
  `skills/lets-go/references/glossary-handoff.md` and
  `skills/lets-go/references/shape.md`. The other reference files and
  `openspec/glossary.md` stay as they are.
- **Spec:** `openspec/specs/lets-go/spec.md`, at archive. #348 and #349
  also change two of the same requirements, so the second of those to
  merge resolves the spec by hand. That conflict is outside D3's merge
  check.
- **Checks:** `pnpm test`, `nix flake check` and `mise run check`, and
  the merge check of D3 (D10). The Node link check covers the moved
  links.
- **Code and commands:** none. No `lets` command, flag or output
  changes.
