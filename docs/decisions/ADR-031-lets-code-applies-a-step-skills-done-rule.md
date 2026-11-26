---
id: adr-031
date: 2026-11-26
status: accepted
title: "ADR-031: lets code applies a step skill's done rule mechanically, and the skill's text stays the rule"
description: Architecture decision record (ADR) for letting lets go records decide whether review plan is done from lets-review-plan's written rule, checking only what can be checked mechanically, with a contract test that ties the code to the skill's text
---

# ADR-031: lets code applies a step skill's done rule mechanically, and the skill's text stays the rule

> Builds on [ADR-029](ADR-029-a-step-skill-owns-its-rules.md): a step skill owns its rules, for every caller. This record says what happens when code, not an agent, is one of those callers.

## Context

`lets-go` decides on every run whether each step is done, and runs the first step that is not. For review plan, the rule is written in the `lets-review-plan` skill, under *Check an earlier review*. It reads the **Plan review** section of the pull request and runs `git merge-base`, `git log` and `git show`. Its last test is a judgment: a fix commit under `APPROVE_WITH_CHANGES` must make the change the review asked for. An agent that runs the rule by hand can get any part wrong, and a wrong answer runs a review again or skips it. Moving the test into `lets go records` makes it repeatable, but code cannot make the judgment, and the code becomes a second reader of a rule that a skill owns.

## Decision

`lets go records` applies the parts of the rule that can be checked mechanically: the section's lines, the verdict, the reviewed commit's ancestry, the plan commits after it, a count of `Fixed in <commit>` rebuttals against the required changes, and the paths each fix commit changes. It does not read a fix's diff to judge it. The review plan step made that judgment when it wrote the rebuttal. The skill's text stays the only statement of the rule: `lets-go` no longer restates it, and the command's help cites it. A contract test reads the skill and fails when a string the code depends on, such as `- **Rebuttals:**` or the rule's `git log` command, leaves the text.

## Consequences

- Easier: the same branch and pull request give the same answer on every run, and tests can check each rule against a fixture repository.
- Easier: `lets-go` loses its longest hand-run logic, and its agent no longer reads diffs to decide what to run.
- Easier: a person who reads *Check an earlier review* still reads the whole rule, in one place.
- Harder: a change to *Check an earlier review* must also change `lets/src/go/`, in the same change. The contract test catches a changed string, not a changed meaning, so review must still compare the two.
- Harder: the command trusts the rebuttals. A fix commit that touches only the plan files but does not make the required change counts as a fix. The review plan step is the only check on that.
- Harder: a rebuttal written in another form than the template's `Fixed in <commit>: <what changed>` is not counted, so review plan runs again.

## Alternatives Considered

### Alternative 1: The code checks the mechanical parts and lists the fixes for the agent to judge
- **Pros**: keeps today's judgment of each fix's diff.
- **Cons**: `lets-go` would still run `git show` and judge diffs on every run, so half the done test stays by hand, and the answer can change between runs.
- **Why not**: the judgment was already made by the step that wrote the rebuttal. Making it again on every run adds cost and a second chance to get it wrong, and the walk would still depend on an agent's reading.

### Alternative 2: Move the rule into the code, and make the skill point at the command
- **Pros**: one copy of the rule, in code, with no drift possible.
- **Cons**: a person or agent who runs `lets-review-plan` directly would read a rule they cannot see, and the skill would depend on a `lets` command for its own entry logic.
- **Why not**: ADR-029 keeps a step's rules in its skill for every caller. Reviewers of the skill read prose, not TypeScript.

### Alternative 3: Change the section template so each required change names its fix commit
- **Pros**: the code could match each change to its fix exactly, instead of counting.
- **Cons**: changes `lets-review-plan`'s output, and every **Plan review** section already written would read as unfinished.
- **Why not**: the count already gives the right answer on every section written so far, and the step that wrote the rebuttals has already matched each fix to its change.
