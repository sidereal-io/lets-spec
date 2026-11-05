## Story

#184 lets-review-build — one skill reviews the build, verifies and archives
the change, and marks the pull request ready; lets-review-code and the
config rule fold into it.
https://github.com/sidereal-io/lets-spec/issues/184

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does `lets-review-build` do, and in what order? | It reads the pull request's body. With no **Code review** section, it runs the code review as `lets-review-code` does today. With one, it runs *Check an earlier review*, and reviews again only when that says to. Then it follows the project's archive guidance, runs the `openspec-verify-change` skill, archives with the `openspec-archive-change` skill, commits the archive alone as `chore:`, and marks the pull request ready. | Evidence: #184 packet, Scope; #148 Shared decisions, "Review build ends the change" |
| D2 | Where does the skill ship? | In the `standard` flow, in `lets-review-code`'s place in `flows.json`. The `minimal` flow does not ship it. | Evidence: #184 packet, Scope, "ships where it did" |
| D3 | How does `lets-build`'s *Finish the change* decide what to run? | By the flow, as the code review runs today: the rule sits in the project's config, so a `lets-minimal` chore in a `standard` project gets a review too. *Finish the change* reads the `schema:` line of `openspec/config.yaml`, as *Route* does. On `lets-standard` it invokes the `lets-review-build` skill. On any other schema it finishes as today: the project's archive guidance, verify, archive, mark ready. | Evidence: `overlays/openspec/config.d/lets-standard.yaml` holds the rule project-wide; the read is an Assumption |
| D4 | Does the project's archive guidance still run before verify? | Yes, on both paths. `openspec instructions archive --json` returns the project's `operations.archive` rules as `operationGuidance`. lets-spec no longer ships one, but a project may keep its own, and the step stays where it was. | Assumption |
| D5 | How does a project turn the code review off now? | It cannot by config. The rule goes, and with it the switch. The `standard` flow reviews the code and the `minimal` flow does not. The README's *Turning the code review off* section goes, and the flows table's link to it. | Evidence: #148 Shared decisions, the rule goes; the README is an Assumption |
| D6 | What does `lets sync` say about a config that still names `lets-review-code`? | One problem to fix, on stderr, exit 0, beside the schema warnings: `openspec/config.yaml names lets-review-code, which this release does not ship. Delete the operations.archive entry that names it: the lets-review-build skill runs the code review now.` A line that names it inside a `#` comment does not count. `lets sync --check` does not change: it does not read the config today. | Evidence: #184 packet, Scope; `lets/src/sync/main.ts`, check returns before `checkConfig`; the text is an Assumption |
| D7 | Does this repository's own `openspec/config.yaml` change? | No. The pinned release's `lets-build` still follows the rule. The next release's `lets sync` reports the entry, and the user deletes it then. | Assumption |
| D8 | Which main specs change? | `lets-sync` gains one requirement, for the warning. No spec covers the skills, `flows.json`, the overlay or the README; the bats tests pin them, as the previous layer did. | Evidence: `openspec list --specs` |
| D9 | What do the tests pin? | `tests/skill-interfaces.bats`: each `lets-review-code` pin names `lets-review-build`; the new skill says `**Code review**`, `` `openspec-verify-change` skill ``, `` `openspec-archive-change` skill `` and `gh pr ready`; `lets-build` says `` `lets-review-build` skill ``; nothing under `skills/`, `schemas/` or `overlays/` says `lets-review-code`. `tests/release-build.bats`: neither release's config holds `operations`. `tests/openspec-compat.bats`: archive returns no guidance from the standard flow's config. `tests/support/release.bash`: the fixture ships `lets-review-build`. `tests/lets/sync/config.test.ts` and `tests/sync-setup.bats`: the warning, and its absence for a comment and for a clean config. | Assumption |
| D10 | Does `lets-go` change? | No. Its `review-build` step runs `lets-build`'s *Finish the change*, which now invokes the skill. Its reads of the **Code review** section stand: the section keeps its shape. #186 gives review build a session of its own. | Evidence: `skills/lets-go/SKILL.md`, the step table; #184 packet, out |
| D11 | Does `lets delegate review --for code` change? | No. The skill calls it as `lets-review-code` does, and `delegate.review.code.guidance` keeps its name. | Evidence: #184 packet, out |
| D12 | What does the README say? | The flows table's *Skills it adds* names `lets-review-build`; its *Independent code review* row says `Yes` and `No` with no link; stage 9 says `lets-review-build` has a fresh session review the branch, and stage 10 says the same skill verifies, archives and marks the pull request ready. The `lets-build` and `lets-go` sections stand. | Assumption |
| D13 | Do dated records change? | No. Archived changes and decision records keep `lets-review-code`. The synced copies in `.agents/skills/` change at the next release. | Assumption |

## Changes from the story

None. The user delegated this run on 2026-11-04 and asked not to wait for
the ledger's confirmation. The agent did not put the Assumption rows to them.

Confirmed by user: yes
