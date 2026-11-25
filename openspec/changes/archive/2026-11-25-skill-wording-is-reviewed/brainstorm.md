<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#312 skill-wording-is-reviewed — a reworded sentence breaks no test: the phrase tests and form checks are gone, and the specs name a reader. https://github.com/sidereal-io/lets-spec/issues/312

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which bats tests of a link or a name already have a Node replacement? | Links: `links.test.ts`, in the source and in each published flow. Skill names: `skills.test.ts`. Commands, `gh` commands and templates: their own tests in `tests/contracts/`. The gaps are D2, D3 and D4. | Evidence: `tests/contracts/*.test.ts`, `tests/skill-interfaces.bats` |
| D2 | Node does not check that `lets-plan`, `lets-review-pr`, `lets-shape` and `lets-setup-backlog` ship in every flow, which bats tests such as "both flows ship lets-plan" guard. How does the gap close? | This story's first task adds a Node check that each skill the routing table and `lets-go` rely on ships in every flow, before the bats file goes. The design picks the rule, since `minimal` leaves out `lets-review-plan` on purpose. | Assumption |
| D3 | What replaces the bats test that `skills/lets-go/references/terms.md` holds the glossary's entries word for word? | A Node test that reads the terms from `terms.md` and compares each entry with `openspec/glossary.md`, with no typed list of terms. | Assumption |
| D4 | What happens to the bats tests of a fixed string or link with no Node replacement: the `Confirmed by user:` marker, the issue-comments reference links, the section links and the glossary-term links? | Deleted. Review checks them, as the epic's shared decisions say, and no code reads the marker. | Assumption |
| D5 | *The step table check reads the step rows* and *The exit-3 sentence may wrap* hold the only statement of a rule on what a skill says. Remove them, as the packet says? | No. Rewrite each as a rule on the skill, without the check's matching details. Remove the other two of the four, which describe only how a check matches text. | Assumption |
| D6 | Requirements on form, such as the 72-column wrap, italic section names and numbered lists, also describe the deleted check: its test folders and "the check fails, and its output names X". What changes? | Remove only the sentences and scenarios that describe the check. Keep each rule on form unchanged. | Assumption |
| D7 | Does anything outside the three specs run or name `tests/skill-interfaces.bats`? | No. `pnpm test` and `nix flake check` run `bats tests` as a folder, so deleting the file needs no runner change. | Evidence: `package.json`, `flake.nix` |

## Changes from the story

- Added: a Node check that each skill the routing table and `lets-go` rely on ships in every flow (D2). Without it, deleting the bats file loses a name check, which the packet says must not happen.
- Added: a Node test that `terms.md` matches the glossary (D3). The packet lists it with neither the phrase tests nor the checks of form, and a drifted copy gives installed agents old definitions.
- Changed: two of the four requirements the packet removes are rewritten as rules on the skill instead (D5), so no rule on what a skill says is lost.

Confirmed by user: yes
