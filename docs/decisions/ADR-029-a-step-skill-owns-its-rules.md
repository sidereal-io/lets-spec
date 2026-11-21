---
id: adr-029
date: 2026-11-21
status: accepted
title: 'ADR-029: A step skill owns its rules, and the step prompt only names it'
description: Architecture decision record (ADR) for keeping each step's rules in its own skill, for every caller, with a step prompt that names the skill in one sentence
---

# ADR-029: A step skill owns its rules, and the step prompt only names it

> Builds on [ADR-023](ADR-023-a-step-asks-through-its-report.md): a step asks through its report, and a resumed step gets an `## Answers` section. This record says that the step's skill, not the prompt, decides what to do with those answers.

## Context

`lets-go` runs each step in a fresh session from a written prompt. A
fresh session has none of the earlier rounds' conversation, so the step
must find where it stands: for example, a discovery that an earlier
round started and stopped on a question. The prompt could tell the step
how to find that, or the step's skill could. Rules written in the prompt
are a second copy of the skill's own rules. When the skill changes, the
prompt's copy goes on giving the old instructions, and nothing fails
until a resumed run goes wrong: it shapes an issue a second time, starts
a second discovery, or asks a settled question again.

## Decision

Each step skill states its rules as its own, for every caller, and
picks its path from its input and its answers: the ones given in its
session, or a resumed step's `## Answers` section. A step prompt says
what to run in one sentence that names the skill and its input. Beyond
that, the prompt carries only what the caller alone knows, such as a
search the caller already ran, and the shared rules for questions and
the report.

## Consequences

- Easier: a change to a step skill reaches every caller at once. There
  is one copy of each rule to read, test and change.
- Easier: a person who runs a step skill directly gets the same
  behaviour as a `lets-go` step, such as resuming a discovery.
- Easier: the prompt frame is the same for every step, so `lets-go`
  shrinks.
- Harder: a step skill has to resume from answers on its own, which
  makes its entry logic longer than a skill that only ever starts fresh.
- Harder: a behaviour wanted only in a `lets-go` step must be written
  as a rule for every caller, or carried as a fact in the prompt's
  header. The skill cannot have a section that applies only to one
  caller.

## Alternatives Considered

### Alternative 1: The prompt re-instructs the skill for the step

- **Pros**: the runner controls exactly how a step resumes, and the
  skill can stay simple for direct use.
- **Cons**: two copies of the same rules, in two skills, with nothing
  that keeps them in step.
- **Why not**: this was the shape step's prompt. Its resume rules
  drifted from the skill's own, and a change to the skill broke the
  runner's resume without any check failing.

### Alternative 2: The skill has a section for when a runner calls it

- **Pros**: the rules live in the skill, and direct use is untouched.
- **Cons**: the skill holds two versions of its entry logic, one per
  caller, and they drift the same way, inside one file.
- **Why not**: it moves the second copy instead of removing it.
