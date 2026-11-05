## Context

`skills/lets-go/SKILL.md` runs a Chore end to end. Start names `lets-build`'s sections and adds one Kind gate (step 4) that stops a Story or a Bug. Step 10 prints one fixed level line for `recommend`. *Write the prompt* hard-codes `The interactivity level is recommend.` in the `## Questions` section. *Relay the questions* knows one level. *Find the first unfinished step* and the skip lines, from #150, already date propose review from `review.md`.

Constraints:

- A step never asks the user in its session, and reports every open question with a recommendation where it has one (ADR-015). The level lives in the `lets-go` session only.
- `lets-go` keeps no state (ADR-017), so a level named for one run cannot carry to the next.
- The `lets-standard` schema writes `tasks.md` only after `review.md` holds a verdict, and `openspec-propose` writes every artifact in one step. So the plan review happens inside the propose step.
- The skill-interfaces test greps fixed strings from the skill, the overlay and the README. The pinned `lets` 0.7.0 cannot run a step here, so prose tests are the only check (D15).

## Goals / Non-Goals

**Goals:**

- Remove the Kind gate and let `lets-build`'s *Confirm the packet* decide which Kinds stop.
- Pick, print and accept the interactivity level, and make the relay honour `ask`.
- Keep every change inside `skills/lets-go/SKILL.md`, its spec, its tests and the two routing rows.

**Non-Goals:**

- A level in the `lets` config (#159).
- An idea in words instead of an issue (#153).
- Running propose review as its own step session, or changing `lets-review-plan`, `lets-review-code` or `lets-build`.
- Changing the glossary's *Step* entry (D14).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which greps the skill's prose, `overlays/AGENTS.md`, `README.md` and `flows.json` for the fixed strings the spec lists.
- **Existing seams reused:** the four `lets-go` tests already in that file. One of them, `lets-go ships in both flows with a routing row`, changes its `request` string; the others gain or lose a `skill_says` line.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** one skill's prose and its spec; two routing rows; one bats file. No code in `lets/`, no schema, no other skill.

## Decisions

### D-1: The level is a value Start sets, and the prompt frame reads it

Start sets `<level>` once: the user's word when they named `ask` or `recommend` in the request, else the Kind's default. The prompt frame's `## Questions` section becomes `The interactivity level is <level>.` followed by one sentence per level. So a step reads the same rules at both levels, and the relay alone changes (D5, D7).

Alternatives: a frame per level (two frames to keep in step); a flag the step reads to decide questions itself (rejected by ADR-015).

### D-2: The relay branches once, on the level

*Relay the questions* step 2 gets two cases. At `recommend`, as today. At `ask`, every question goes to the user with the step's recommendation shown as the suggested answer, and the answer is written as given, with no marker (D6). The settled-question check and the answers file do not change.

Alternative: write the marker when the user takes the recommendation. Rejected: the step would record a user's decision as `Assumption`.

### D-3: Propose review stays inside the propose step, and its line says `Done` when it ran now

`lets-go` already reads `review.md`'s verdict and commit after propose. The only change is the verb: `Done propose review:` after a propose step that reported `done` in this run, `Skipped propose review:` when propose was done before (D8, D9). Both share the evidence text, so the test checks two strings that differ in one word.

Alternative: split propose at `adr` and run `review` plus `tasks` as a fourth step session. Rejected: `openspec-propose` would need a stop point the schema does not have, and the review already runs in a fresh session of another family through `lets-review-plan`.

### D-4: The blocker stop waits for the branch check

Start's step 3 runs *Find the source of demand*, whose first case stops on an open blocker. Start now defers that one stop. The blocker read becomes `gh issue view <i> --json title,blockedBy`, so Start has the title before *Confirm the packet* reads it. From the title it names the change as *Claim* does, and runs the branch check of step 7 early. The stop stands only when neither `git branch --list` nor `git ls-remote` prints a line. When the branch exists, Start prints the open blockers by number and goes on (D10). Every other stop of `lets-build` stands as before, including the glossary prerequisite: a stacked story whose glossary owner has not merged still stops, as it does under `lets-build`.

Alternative: leave the stop in place and document that stacked stories need `lets-build`. Rejected: this repository stacks most stories, and the stop's own remedy, stacking by hand, is already done once the branch exists.

### D-5: The routing row names the three Kinds

The row becomes `Take a shaped story, bug or chore to a ready pull request in one run` in both tables, and the test's `request` variable follows (D11). `lets-build`'s row stays until #157.

Alternative: `Take a shaped issue ...`. Rejected: "issue" would read as covering an Epic.

### D-6: The spec removes the Chore-only requirement and adds a new one

The requirement `lets-go runs on the default branch, for a Chore` names the Kind in its heading, and MODIFIED must keep the heading. So the delta removes it and adds `lets-go runs for a Chore, a Bug or a Story`, with every scenario the old one had. The `ask` relay is a new requirement beside the `recommend` one, whose heading also names its level. A delta cannot change the main spec's `## Purpose`, which still says "for a shaped chore". One task edits that line in `openspec/specs/lets-go/spec.md` directly, as the schema allows.

None of these decisions is costly to reverse. The ADR step records none; ADR-015 and ADR-017 already hold the two decisions this design leans on.

## Risks / Trade-offs

- [A Story at `ask` costs one fresh session per brainstorm round, and a brainstorm asks many questions] → ADR-015 accepted this. The user can name `recommend` to start, and #159 adds a default.
- [The user names a level in prose, and the skill must read it from the request] → The skill accepts only the two words `ask` and `recommend`, and the line says which it took.
- [Deferring the blocker stop lets a run start on a branch stacked on an unmerged pull request] → That is the stacking rule in `AGENTS.md`. The run prints the blockers, so the user sees it.
- [The `Done propose review:` string is one word from the `Skipped` one, and a drift in either breaks the test] → Both strings are in the spec's fixed-lines list, and the skill shows both.

## Migration & Rollback

N/A. The skill reaches this repository at the next release, through `lets sync`.
