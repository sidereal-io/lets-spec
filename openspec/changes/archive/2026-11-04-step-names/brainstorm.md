## Story

#182 step-names — the five steps are named shape, plan, review plan, build
and review build in lets, the glossary, lets-go and the README.
https://github.com/sidereal-io/lets-spec/issues/182

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What are the five steps called? | Shape, plan, review plan, build and review build, in that order. `lets delegate step --for` takes `shape`, `plan`, `review-plan`, `build`, `review-build` and nothing else. The glossary's *Step* entry lists them, committed in this brainstorm. | Evidence: #148 body, Shared decisions |
| D2 | How is each name spelled where? | The spoken form, with a space, in prose and in every printed line: `Skipped review plan: ...`, `Done build: ...`, `Failed review build: ...`. Kebab-case in `--for`, `--name`, file names and config keys: `review-plan`, `<name>-review-build-prompt.md`, `delegate.step.review-build.guidance`. | Evidence: #182 packet, Scope |
| D3 | Do the review and handoff intents change? | No. `review` keeps `plan` and `code`, and `handoff` keeps `apply`. `apply` is no longer a step intent, so `lets delegate step ... --for apply` exits 2. | Evidence: #148 body, Won't |
| D4 | Does `lets-go` run review plan as its own step? | No. It runs shape, plan, build and review build in their own sessions. On `lets-standard`, review plan still runs inside plan, until the story that separates it. The skill names all five and says so. | Evidence: #182 packet, out of scope |
| D5 | What happens to `delegate.step.apply.guidance` in a user's config? | Nothing. `lets` reads only the new keys. It warns about nothing and migrates nothing. `lets delegate` ignores unknown keys by spec, and the config stays at version 3. | Assumption |
| D6 | Do dated records change? | No. Archived changes and ADR-017 and ADR-018 keep the old names. | Assumption |
| D7 | Which main specs change? | Every one whose step scenarios use an old name: `delegate-config`, `delegate-instructions`, `delegate-step`, `delegate-resolvers`, `delegate-default` and `lets-go`. The packet lists the first four; the last two also run steps with `--for apply` and `--for propose`, which exit 2 after this change. | Evidence: grep of openspec/specs |
| D8 | How do the tests pin the rename? | The strategies test lists the five intents. A cli test checks that `step instructions --for apply` exits 2 and names `--for`. `skill-interfaces.bats` pins the new `Skipped` and `Done` lines. It fails if `lets-go` still says `Skipped propose`, `Skipped apply`, `propose review`, `apply review`, `propose-review`, `apply-review`, `--for propose` or `--for apply`. | Assumption |
| D9 | Does the README's flow table change? | Its rows stay: they are OpenSpec's artifacts and the finishing stages, not the five steps. Its column header *Step* becomes *Stage*, so the word *Step* means one thing in the README. | Assumption |

## Changes from the story

None. The user delegated this run on 2026-11-04 and asked not to wait for
the ledger's confirmation. The agent did not put the Assumption rows to them.

Confirmed by user: yes
