<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `tests/skill-interfaces.bats` holds 512 tests and takes about 130
  seconds. Most look for a fixed phrase or check the form of a text.
  About 30 check that a name or a link resolves. #311 moved those to
  Node, in `tests/contracts/`, and its pull request, #329, maps each one
  to its Node test. It left three kinds to this story: the tests that a
  flow ships a named skill (D2), the glossary copy in `terms.md` (D3),
  and the tests of a fixed string or link (D4).
- `pnpm test` runs `bats tests`, and the flake's check runs
  `bats repo/tests`. Both take the folder, so deleting one file changes
  neither (D7). `tests/openspec-compat.bats` and
  `tests/release-build.bats` stay, and so does `tests/support/common.bash`,
  which they load.
- `tests/contracts/skills.test.ts` already reads `flows.json`, each
  flow's schemas and config, and the entry points of the routing table
  in `overlays/AGENTS.md`. `tests/contracts/texts.ts` reads a text once
  and splits it into prose, code spans, fenced code and headings. Both
  take a root folder, so a test can point them at a small folder of its
  own.
- OpenSpec 1.13.2 refuses a MODIFIED requirement that leaves out a
  scenario the main spec has. `openspec validate` reports it, and
  `openspec archive` stops on it. So a delta cannot delete a scenario
  from a requirement it keeps.
- The README's *Development* section says the `*.bats` files test
  "every command, file and skill the prose names". Since #311, the Node
  tests in `tests/contracts/` do that, and the table has no row for them.

## Goals / Non-Goals

**Goals:**

- Delete `tests/skill-interfaces.bats` with no check of a name or a link
  lost. Each one has a Node test, or is a fixed string that review
  checks (D4).
- Each new check reads its expected names from the texts, never from a
  list typed into the test.
- Each new check is shown to fail, on a small text written for the
  test.
- After the change, `grep -rn skill-interfaces openspec/specs` finds
  nothing, and no requirement on what a skill says, or on its form,
  changes meaning.

**Non-Goals:**

- Changing a skill, a schema or `lets`. The texts already pass every
  check this change adds.
- A Node test of a phrase or of form. Review checks them (#308's shared
  decisions).
- Moving any test to bats, or adding one there.
- Editing archived changes or decision records, which keep naming bats.

## Test Seams

- **Primary test seam:** the texts as files on disk, read by the check
  functions in `tests/contracts/`, as #311 built them. Each check runs
  on this repository, and on a small folder written in `tempDir`.
- **Existing seams reused:** `readText`, `skillFiles` and `Finding` from
  `tests/contracts/texts.ts`; `repo` and `tempDir` from
  `tests/support/lets.ts`; `readFlows`, `namedSkills`, `entryPoints` and
  `smallProject` in `tests/contracts/skills.test.ts`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. No product code changes, but the deletion removes
  512 tests at once, so a check with no replacement goes unseen.
- **Blast radius:** `tests/contracts/skills.test.ts`, a new
  `tests/contracts/terms.test.ts`, the deleted bats file, three spec
  files, and the tests row of the README's *Development* table.

## Decisions

### The skills each flow must ship (D2)

`skills.test.ts` gains `requiredSkillFindings(root)`:

- The skills relied on are the entry points of the routing table
  (`entryPoints`), and each skill that a file of `lets-go` names
  (`namedSkills` over `skillFiles(root, 'skills/lets-go')`). Only
  skills that are folders of `skills/` count: the existing check
  already reports a name that is not.
- For each flow and each such skill the flow does not ship, the check
  finds the schemas, of all the flows' schemas, whose `schema.yaml`
  names the skill. The flow must ship it when no schema names it, or
  when the flow ships one of the schemas that do. Otherwise the skill
  belongs to another flow's schema, and the flow may leave it out.
- Each finding is `{ file: 'flows.json', name: <skill> }`.

Today this requires `lets-go`, `lets-shape`, `lets-review-pr`,
`lets-setup-backlog`, `lets-plan`, `lets-build` and `lets-review-build`
in both flows, and `lets-review-plan` only in `standard`, the one flow
that ships `lets-standard`, the only schema that names it. A probe of
the current texts found no finding.

Alternative: a list of the skills every flow ships. Rejected: #308 says
a check never holds a typed copy of its names. Alternative: read the
exemption from the step table's skip line, `not in the lets-minimal
route`. Rejected: rewording that sentence would then break the check.

### The glossary copy (D3)

A new `tests/contracts/terms.test.ts` holds `termFindings(terms,
glossary)`, two `Text`s:

- The terms are the `##` headings of `terms.md`, outside code. The file's
  `#` title is not a term.
- An entry's text is its lines from after the heading to the next
  heading, with each run of whitespace made one space and the ends
  trimmed.
- A term the glossary has no `##` heading for, or whose text differs,
  is a finding that names `terms.md` and the term.

Its tests: the real files, a small pair whose *Procedure* text differs,
and a small pair whose glossary lacks a term the copy holds.

With no typed list, this test cannot see an entry taken out of
`terms.md`. `lets-go` links five of the six terms, so the Node link
check fails on a removed linked term. *Part*, which `lets-go` does not
link, and an extra entry that the glossary also holds, are left to
review. The spec says so in *lets-go carries the glossary's entries for
its own terms*.

### What replaces each bats test of a name or a link

| Bats test (line) | After this change |
|---|---|
| The tests #311 maps in pull request #329 (18, 30, 46, 77, 128, 257, 262, 1559 to 1747, 2271, 3161, 3182, 3511, 3553, 3563, 3571) | The Node test that table names, unchanged |
| A flow ships a named skill (94, 655, 3129, 3692) | `requiredSkillFindings`, in `tests/contracts/skills.test.ts` |
| `terms.md` matches the glossary (3247 to 3267) | `tests/contracts/terms.test.ts` |
| The copy holds no other entry (3275) | `terms.test.ts` for a term the glossary lacks; review for an extra term the glossary has |
| The `Confirmed by user:` marker (141) | Deleted: a fixed string no code reads (D4) |
| A skill links a given file or section, or a term at its first use (3166 to 3174, 2327 to 2359, 3317 to 3325, 3457) | Deleted: fixed links and form (D4). Each link that is there still resolves, by `links.test.ts` |
| A text holds, or does not hold, a fixed path (such as 152, 1666, 3718, 5128) | Deleted (D4). Where a text links the path, `links.test.ts` fails when the file is missing |
| The published copy of `lets-review-pr`'s references matches the source (3692) | Deleted: the release links each skill's folder, as `tests/release-build.bats` checks in "the release links exactly the schemas and the skills it is given" |

Every other test in the file looks for a phrase, queries the README's
workflow example, tests a bats helper, or checks form: none checks that
a name resolves.

### The spec deltas

Made by a script, run once in `.workspace/`, then checked by
`openspec validate --strict` and by a trial archive in a throwaway
worktree:

- In a scenario, `the skill-interfaces test reads` (or `lists`,
  `finds`, `scans`, `checks`) becomes `a reader reads`, and a THEN that
  began `it finds` begins `the reader finds`.
- A scenario that showed the deleted check pass or fail on a small
  folder keeps its name, since OpenSpec will not drop it, and states the
  rule instead: `WHEN an edit makes ... THEN the edit breaks this
  requirement`, or `THEN the file meets this requirement` for an
  exception. This keeps every example of a rule on form, as D6 asks,
  with no word about the check.
- A sentence that described the deleted check goes (D6). Where it was
  the only statement of a rule, the rule stays in other words.
- Two requirements are removed, and two are removed and added again
  under a name that states the rule (D5): *lets-go keeps its steps in
  one table* and *Each skill that delegates says what exit 3 means*. A
  MODIFIED block must keep its name, and the old names name a check.
- The requirements that describe a Node check name it:
  `tests/contracts/links.test.ts`, `tests/contracts/skills.test.ts`,
  `tests/contracts/terms.test.ts` and `tests/contracts/gh.test.ts`.
- *Every link inside lets-go names one of its headings* now says a
  link SHALL not leave the skills folder. The old text said such a link
  "is not checked here"; `links.test.ts`, since #311, reports it.
- *The prose holds the fixed lines the tests check* keeps its name, as
  the packet asks. Only its reason changes.

### The README

The tests row of the *Development* table names `contracts/`, the Node
checks of each command, link, skill, template and `gh` command a text
names. The `*.bats` entry says what the two files left test: the
release build and each schema with the OpenSpec CLI.

## Risks / Trade-offs

- [A bats test of a name is missed in the mapping, and deleted with no
  replacement.] → The table above covers each test whose body checks a
  flow, a build, a file or a link. Task 2.1 repeats the search before
  the deletion and stops on a test it cannot place.
- [The D2 rule passes a flow that leaves out a skill a schema names,
  when that flow also ships no schema that names it.] → That is the
  intended exemption, and the existing check already requires each
  skill a flow's own schemas name.
- [Reworded scenarios read as tests nobody runs.] → Each one now names
  a reader or an edit, as `contract-first-builds` does, and states a
  rule a reviewer can check.
- [A rename by REMOVED and ADDED moves two requirements to the end of
  `openspec/specs/lets-go/spec.md`.] → Accepted: their place in the file
  carries no meaning.

## Migration & Rollback

N/A. To undo, revert the change's commits: the bats file and the spec
text come back as they were.
