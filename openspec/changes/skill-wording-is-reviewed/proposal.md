<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

About 379 tests in `tests/skill-interfaces.bats` look for an exact
phrase, so rewording or rewrapping a sentence with the same meaning
fails a test. The `lets-verify-contracts` skill calls that a flawed
test. Since #311, the contract checks of names and links run in Node,
so the file's last useful tests have a replacement, and the file, which
takes 130 seconds to run, can go.

## What Changes

- Add a Node check that each skill the routing table and `lets-go`
  rely on ships in every flow that needs it, before the bats file goes
  (D2). It closes the one name check with no Node replacement.
- Add a Node test that each entry of `skills/lets-go/references/terms.md`
  matches `openspec/glossary.md`, reading the terms from `terms.md`
  with no typed list (D3).
- Delete `tests/skill-interfaces.bats`: its phrase tests, its queries of
  the README's workflow example, its helper tests and its checks of
  form. The tests of a fixed string or link with no Node replacement go
  with it, and review checks them (D4). Nothing else runs or names the
  file (D7).
- Reword each spec scenario that begins `WHEN the skill-interfaces test
  reads`, or names the test another way, to name a reader instead, as
  `openspec/specs/contract-first-builds/spec.md` does. The rule each
  scenario states does not change.
- Remove the two `lets-go` requirements that only say how a phrase
  check matches text: *The lets-go checks read the skill's reference
  files* and *A lets-go section may sit in a reference file, at any
  heading level*.
- Rewrite *The step table check reads the step rows* and *The exit-3
  sentence may wrap* as rules on what the skill says, without the
  check's matching details (D5).
- In each requirement on form, remove only the sentences and scenarios
  that describe the deleted check, and keep the rule on form (D6).
- Reword the requirement on `terms.md` to name the Node test, and
  change the reason in *The prose holds the fixed lines the tests
  check* so it no longer says the skill-interfaces test checks them.

No requirement on what a skill says, or on its form, changes meaning.
After this change, `grep -rn skill-interfaces openspec/specs` finds
nothing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `lets-go`: about 50 requirements name the skill-interfaces test. Their
  scenarios name a reader instead; two requirements are removed, two are
  rewritten as rules on the skill, the requirements on form lose the
  sentences about their check, and the `terms.md` requirement names its
  Node test.
- `issue-comments`: 8 requirements name the skill-interfaces test. Their
  scenarios name a reader instead, and the scenario *The query is
  checked by the test suite* names the Node `gh` check.
- `discovery-maps`: one scenario names the skill-interfaces test, and
  names a reader instead.

## Impact

- Tests: `tests/skill-interfaces.bats` is deleted. New Node tests go in
  `tests/contracts/`. `pnpm test` and `nix flake check` run `bats tests`
  as a folder, so neither runner changes (D7). The bats suite gets about
  130 seconds faster.
- Specs: `openspec/specs/lets-go/spec.md`,
  `openspec/specs/issue-comments/spec.md` and
  `openspec/specs/discovery-maps/spec.md`.
- README: the `tests/` row of the *Development* table names
  `contracts/` and says what the bats files still test.
- Out of scope: the skills, schemas and the rest of the README, `lets`,
  archived changes and decision records, which keep naming bats.
