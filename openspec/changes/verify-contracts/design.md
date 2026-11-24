<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- The build step's method lives in three places: the apply instruction in
  each schema (`schemas/lets-standard/schema.yaml`, `schemas/lets-minimal/schema.yaml`),
  the skill they name, and `skills/lets-write-tasks/SKILL.md`, which shapes
  the tasks the build agent picks up. The two tasks templates
  (`schemas/*/templates/tasks.md`) repeat the task rule in a comment: "One
  task is one behavior, its test, and the code that passes it."
- The new `SKILL.md` must be #304's text word for word (D1). It cannot link
  a reference or carry this project's extra rules. Those rules (D4, D5, D7)
  go in the apply instructions, which every build reads.
- `lets sync` already removes a skill a release stops shipping
  (`lets/src/sync/skills.ts`, `unshipped`; tested by "a skill the new release
  no longer ships is removed" in `tests/sync-skills.bats`). No sync code
  changes.
- `tests/release-build.bats`, `tests/support/release.bash` and
  `tests/sync-skills.bats` use `lets-test-first` only as a fixture name for
  a real shipped skill.

## Goals / Non-Goals

**Goals:**
- Every build reads the same three-phase method and the same three added
  rules, whichever schema the change uses.
- Nothing shipped still points at `lets-test-first`.

**Non-Goals:**
- Changing the review skills' checks of what a build produced (D3).
- Rewriting existing tests in this repository to the new style. This change
  alters how future builds write tests, not the tests that exist.
- A test that keeps `SKILL.md` in line with the issue text after this
  change. The issue is the source once; the file is the source afterwards.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which reads the
  shipped prose (skills, schemas, templates) and checks what it names and
  says. New checks there cover the apply instructions, `lets-build`,
  `lets-write-tasks` and the absence of `lets-test-first`.
- **Existing seams reused:** `tests/release-build.bats` and
  `tests/sync-skills.bats` for what a release ships and what `lets sync`
  writes; `nix flake check` for the synced project's skill files.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the prose of two schemas, two templates and three skills,
  `flows.json`, `flake.nix`, the README and four test files. Removing a
  shipped skill reaches every project at its next `lets sync`; no code,
  data or trust boundary changes.

## Decisions

### D-1: Copy the skill from the issue and check it with a diff once

The build task writes `skills/lets-verify-contracts/SKILL.md` from the
fenced block in #304's body, and its verify command diffs the two:

```bash
gh issue view 304 --json body --jq .body | sed -n '/^~~~~markdown$/,/^~~~~$/p' | sed '1d;$d' | diff - skills/lets-verify-contracts/SKILL.md
```

Alternatives: a fixture copy of the text in `tests/`, checked on every run.
Rejected: it keeps two copies that must change together, and the next edit
to the skill would have to edit the fixture too.

### D-2: Put the added rules in the apply instruction, after the method

Both apply instructions replace the current "Work on each task test-first"
paragraph with the following text, identical in both schemas:

```text
Work on each task with the `lets-verify-contracts` skill, in its three
phases: write the contracts, then the code, then black-box and invariant
tests at public boundaries.

In Phase 1, run the static checks the project has, such as its type checker
or linter. When it has none, Phase 1 ends once the contracts are written
down: signatures, usage text or spec scenarios. Phase 3's failing black-box
test then shows what the code must do.

Take each expected value in a test from the spec or a worked example, never
from the code's own logic. Code takes its external clients, such as an HTTP
client or the clock, as inputs, so a test can pass in a substitute.

The skill's exit criteria check spec coverage only for the requirements the
task builds. The integration task, which runs last, checks that every
requirement in the change's specs has at least one black-box or invariant
test.
```

Alternatives: a project-owned reference file the apply instruction links.
Rejected: one more file to ship for four short paragraphs, and an agent can
skip a link.

### D-3: Keep `lets-write-tasks`'s structure; replace the red-green rules

- *Size*: "One task is one red-green cycle" becomes one behavior through
  contract, code and black-box test (D6). The "and" rule and "Minutes, not
  hours" stay.
- *Verification*: "runs the test the task adds" becomes "runs the black-box
  or invariant test the task adds, or the type check or other static check
  for a shared-contracts task". The integration task runs the whole suite
  and checks every requirement's coverage (D7).
- *Test-first tasks* becomes *Name the behavior*, keeping its CSV example
  and its completion rule, without "write its test first".
- The description's "one at a time, test-first" becomes "one at a time,
  contract first".
- Both tasks templates' comment becomes "One task is one behavior: its
  contract, its code, then its black-box test."

### D-4: Rename the fixture in release and sync tests

Those tests need a real skill from `flows.json`. They use
`lets-verify-contracts` in its place, with the same assertions. The
`scripts/check.sh` fixture in `tests/support/release.bash` moves to the new
skill's folder unchanged: it tests file modes, not the skill.

### D-5: Retiring test-first gets a decision record

Building contract first and testing at public boundaries, with no
unit-test-first cycle, changes how every future build writes tests, and a
reader of ADR-020 meets "test-first" there. The ADR step judges whether
this qualifies under `lets-write-adrs`. If it does, the new record
supersedes ADR-020's "test-first" clause only, and ADR-020's text stays as
it is (D3).

## Risks / Trade-offs

- [A project's in-progress `tasks.md`, written for red-green cycles, is
  built under the new method] → Its verify commands still run; the build
  agent works the task contract first and the same command proves it. No
  migration.
- [The word-for-word skill names tools (Zod, `fast-check`, containers) a
  project lacks] → The skill gives them as examples; D-2's Phase 1 paragraph
  covers the no-static-check case.
- [Shipped prose keeps an old phrase, such as "test-first", in a place no
  test reads] → A new prose check fails on `lets-test-first` anywhere in
  `skills/`, `schemas/`, `flows.json`, `flake.nix` or `README.md`.

## Migration & Rollback

- Projects: the next `lets sync` from this release removes
  `.agents/skills/lets-test-first/` and adds `lets-verify-contracts`. Nothing
  to run by hand.
- Rollback: revert the change and release again; the next `lets sync`
  restores `lets-test-first`.
