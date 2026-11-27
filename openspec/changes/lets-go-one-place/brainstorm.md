## Story

#270 lets-go-one-place — each lets-go rule and result list is written once, in one place.
https://github.com/sidereal-io/lets-spec/issues/270

It depends on #267, which is closed, and on #268. This branch stacks on
`lets-go-walk-state`, the branch of #268's pull request #347, so it
holds #265 and #268 too. The issue's thread has no comments.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What may this branch hold, and whose text must it leave alone? | This change, on top of #265 and #268 only. It leaves alone the text that five open pull requests change in `skills/lets-go/` and `openspec/glossary.md`: #348 (`lets-go-shape-name`), #349 (`lets-go-step-prompt`), #357 (`subagent-report-in-lets`), #351 (`clear-guidance-keys`) and #356 (`one-delegate-command`). | User (limits set 2026-11-26) |
| D2 | Which parts of #270's scope wait for those pull requests? | Folding `references/shape.md` into `SKILL.md`, with the *Start from an idea* and *Run the shape step* stubs it turns into full sections (#348, #349); removing `references/terms.md` (#357, #356); and the placeholder rows inside their edits (D8). The pull request lists each one, and the pull request it waits for, in a section of its own. | User (limits set 2026-11-26) |
| D3 | How does the build show that it left that text alone? | `git merge-tree --write-tree` of this branch with each of the five branches names no conflicted path under `skills/lets-go/` and not `openspec/glossary.md`. Today all five pass. Four already conflict with this branch's base in `README.md`, `lets/src/main.ts` or `openspec/specs/lets-go/spec.md`; this change does not cause or fix those. | Assumption |
| D4 | Which tests change? | None is added or changed. The packet's `tests/skill-interfaces.bats` is gone (#313), and no Node test checks parts, `Next:` lines, result lists or placeholder rows. `tests/contracts/links.test.ts` checks that every link still resolves once the stub goes. | Assumption |
| D5 | Do the glossary terms Part and Procedure stay, merge or retire? | Both stay as written. The split lets several parts share a procedure, and this change makes no edit to `openspec/glossary.md` or `references/terms.md`. | User |
| D6 | Where is each procedure result described? | Once, in the procedure's closing list: when it is returned and what it carries. The step that returns it only names it. The part that runs the procedure gives each result with its action only. A procedure that passes on another's result links that procedure's list. | Assumption |
| D7 | Does the *Run the epic* stub in `SKILL.md` go now? | Yes. The overview row and every link point to `references/epic-run.md#run-the-epic`, and *Run the epic* there ends with the `Next:` line the stub held. The two shape stubs stay until the shape fold (D2). | Assumption |
| D8 | Which placeholders leave the table now? | The 12 used in one section, whose rows no open pull request touches: `<other-branch>`, `<c>`, `<keys>`, `<wave>`, `<wave-stories>`, `<other>`, `<map>`, `<copied paths>`, `<tracked paths>`, `<Kind>`, `<evidence>` and `<YYYY-MM-DD>`. Each is explained in its section. `<word>`, `<kebab-name>` and `<one-line outcome>` keep their rows as named exceptions; #349 removes `<skill>` and `<the sentence above>`. | Assumption |
| D9 | Is the repeated "In an epic run, each stop in this part ends only its story's run" sentence folded into one rule? | No. It is outside the listed scope, and each copy puts the condition beside the stops it controls. | Assumption |
| D10 | What accepts the story? | `pnpm test`, `nix flake check` and `mise run check` pass; the merge check of D3 passes; and the pull request records `wc -l` of each changed skill file, before and after. | Evidence: #270 packet, **Scope**; `AGENTS.md`, *Checks* |

## Changes from the story

- **Left out until other pull requests merge** (D1, D2): the fold of
  `references/shape.md` into `SKILL.md` and the two shape stubs, which
  wait for #348 and #349; the removal of `references/terms.md`, which
  waits for #357 and #356; and the rows of `<word>` (#348, #356),
  `<kebab-name>` and `<one-line outcome>` (#349). #349 removes
  `<skill>` and `<the sentence above>` itself.
- **No glossary edit** (D5): Part and Procedure stay as written.
- **No test changes** (D4): the packet's **Relevant code** names
  `tests/skill-interfaces.bats`, which #313 deleted.

Confirmed by user: yes
