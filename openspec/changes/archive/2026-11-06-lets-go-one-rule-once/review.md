## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family. `gemini-4-argon` (Gemini) answered, on T3's `antigravity` provider. The author is Claude (Opus 5.5). How it ran:
  1. `lets delegate review run --for plan` with `--model gemini/gemini-4-argon --model gemini/gemini-3.8-flash`, at effort `medium`, ran under a 590-second shell timeout of the author's, which ended it with exit 124 and no output. That was the author's limit, not the review's, so the command ran once more with no shell limit.
  2. The second run exited 6: `lets delegate: no result after 900000 ms (thread ee29a430-6549-466c-9f29-cd9f6294a1ef)`. The session itself, on `gemini-4-argon`, completed at the same moment, 2026-11-06T23:30:26Z, with its findings as its final message.
  3. The author read that final message from the T3 thread, unchanged, and saved it to `.workspace/lets-go-one-rule-once-review-raw.md`. No `delegate_task` fallback ran: the review had answered, with findings and not a plan, and with no quota error.
- **Independent**: yes. The reviewer is another family, and T3 names the provider and model of the thread that answered.
- **Tool restrictions**: read-only by the prompt: change no file, run no command that writes, and open no pull request or issue. `git status --porcelain` was the same before and after each run.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, `skills/lets-go/SKILL.md`, `tests/skill-interfaces.bats`, `openspec/specs/lets-go/spec.md`, `openspec/glossary.md`, `docs/decisions/`
- **Reviewed commit**: `694602b`

## Findings

### 🔴 Critical (blocking)

1. **The check after a `done` report reads stale records.** **CONFIRMED.** Check: contradictions, scenario testability. The walk reads the tree, the pull request and the archive folder once, before the first row. Review build's own done test is only "the archive folder exists", so *Scenario: Review build reports done on a draft* could not pass, and a plan step that left `tasks.md` uncommitted would pass. The unchanged *Review build ends the run* also says the walk prints the URL as soon as review build reports `done`.
2. **The step lines would be written twice.** **CONFIRMED.** Check: one rule, one place. Moving *End of the run*'s example run into *The step lines* repeats `Skipped shape: …` and three `Done` lines, so `skill_says_once` would fail. The Placeholders rows for `<evidence>` and `<date>` restate the rule too.
3. **`Skipped shape` could print after `Done shape`.** **CONFIRMED.** Check: contradictions. design.md said `Skipped shape` prints "once for each issue *Check the issue* passes", without "only when no shape step ran in this run". A story picked after a lost claim in a discovery run would print it. The delta spec has the condition. design.md did not.

### 🟡 Moderate

4. **"Under its own heading" is wrong for the walk's lists.** **CONFIRMED.** Check: test seams. Headings inside *Walk the step table* would end the part for `parts_say_next` and `next_line`, and `lists_start_at_one` does not read nested lists.
5. ***Glossary preflight* keeps a branch that never runs.** **CONFIRMED** for the dead branch, **OUT-OF-SCOPE** for the glossary. Check: one rule, one place. Only *Claim* runs the whole preflight, so "Otherwise, return to the part that ran it" in *What the preflight returns* never runs. The glossary's **Procedure** says a part runs a procedure. That predates this change: *Find the source of demand* already ran *Confirm the packet*, and *Claim* already ran the preflight, after #201. Changing the entry needs the user to agree the term, so this change leaves it.
6. **A Bug that needs shaping could get `recommend` before shape.** **CONFIRMED.** Check: contradictions. *Confirm the packet* has read the Kind when a Bug's packet lacks a line, so "before a shape step there is no Kind" is false for it. The main spec and the delta both say the shape step's level ignores the Kind.
7. **Without *Claim*'s branch check, a late branch slips through, or one session releases another's claim.** **REBUTTED.** Check: Assumption rows (D6). The release between two sessions of one user is the claim race. It needs both sessions to pass the assignee check, which is out of scope and is being shaped as a separate bug. *Claim*'s old check did not close it. A branch pushed to `origin` in the seconds between *Check the issue* and *Claim* was not caught before either: the old check named no remote. Its first push is then rejected. design.md now records both as a risk.

### 📌 Suggestions

8. **`CLOSED` misses its main case, a stale overview cell, and no checks for D8 and D14.** **CONFIRMED.** A pull request closed without merging leaves its issue open, so `CLOSED` runs on the change's branch. *Start from an idea*'s *Stops when* cell would be empty. The `<reason>` row and a review plan failure with no pull request needed naming.
9. **Plain language.** **CONFIRMED** in part. design.md counted seven procedures where there are six. It also wrote `<step name>`, a second name for a step's name and a placeholder with no row. Four spec sentences ran over 30 words or hid the actor. The long lines of proposal.md's *Impact* and adr.md's summary are lists of section names, and stay.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

The reviewer wrote `VERDICT: REVISE`. Each Critical finding is fixed by a small, unambiguous edit, listed below, so by this skill's rules the verdict is APPROVE_WITH_CHANGES.

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. Finding 1: the check after a `done` report reads the three records again, with `gh pr view <name> --json number,url,state,isDraft,body`, applies their disagreement rules, then runs the row's test. Edit the design's *The walk checks a `done` report* and the spec's *A done report is checked against its record*, and add the scenario *Plan leaves a file uncommitted*. MODIFY *Review build ends the run* so that the walk prints the URL only after that check passes.
2. Finding 2: the example run leaves *End of the run* and does not move. The Placeholders rows for `<date>`, `<evidence>` and `<reason>` name *The step lines* and do not restate the rule.
3. Finding 3: in design.md, `Skipped shape` prints only when no shape step ran in this run.
4. Finding 4: in design.md, the walk's rows stay bullets, and their nested lists start at 1, unchecked by `lists_start_at_one`.
5. Finding 5: *What the preflight returns* ends "Return to *Claim*, with the result." The spec's *Each lets-go procedure returns a result* says so, and its scenario accepts *Claim* for *Glossary preflight*.
6. Finding 6: *Set the level* says that before a shape step the Kind does not count, even when the Project has one.
7. Finding 7: design.md's *Risks* records the late branch and the shared-user race.
8. Finding 8: the `MERGED` and `CLOSED` sentence names a pull request closed without merging, in design.md and the spec. *Start from an idea*'s *Stops when* is `Never`. The reason example covers a branch with no pull request. design.md lists checks for D8, D14 and the fresh `gh pr view`.
9. Finding 9: design.md says six procedures, and writes the `Failed` form without `<step name>`. The spec splits the long sentences in *A closed pull request ends the run*, *lets-go runs for a Chore, a Bug or a Story*, *A done report is checked against its record* and *Each lets-go rule is written once*.

CHANGES_APPLIED: yes

## Rebuttals

1. Fixed: design.md, *The walk checks a `done` report*; specs/lets-go/spec.md, *A done report is checked against its record* (the record reads, and *Scenario: Plan leaves a file uncommitted*) and *Review build ends the run*.
2. Fixed: design.md, *The step lines get one section* (the example run goes, and the Placeholders rows).
3. Fixed: design.md, *The step lines get one section* ("and only when no shape step ran in this run"). The spec already said it, in *A complete packet means shape is skipped*. Ledger row D5 holds for a run with no shape step, and is unchanged.
4. Fixed: design.md, *Each row's done test is an ordered list in the walk*.
5. Fixed: design.md, *Branches that never run go*; specs/lets-go/spec.md, *Each lets-go procedure returns a result*. The glossary entry is left to the user, as above.
6. Fixed: design.md, *The level is written once*.
7. Rebutted, as above. design.md *Risks* names both cases.
8. Fixed: design.md, *Branches that never run go* and *The tests change*; specs/lets-go/spec.md, *A closed pull request ends the run*.
9. Fixed in part, as above. Declined: the list-like lines in proposal.md and adr.md.
