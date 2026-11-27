---
id: adr-031
date: 2026-11-26
status: accepted
title: 'ADR-031: Each guidance key names the step it steers'
description: Architecture decision record (ADR) for naming each guidance key in the lets config, and each lets delegate review --for value, after the workflow step it steers, not after the lets delegate command that reads it
---

# ADR-031: Each guidance key names the step it steers

> Supersedes part of [ADR-011](ADR-011-one-config-file-shaped-like-the-commands.md): its rule that each setting sits at the path of the command that reads it no longer holds for guidance. Its one file, its `version` and its one section per command group still hold.

## Context

Guidance is prose in the lets config that a skill reads to rank and filter the models it may run for a session. It used to sit at the path of the command that reads it, `delegate.<strategy>.<intent>.guidance`. In a `lets-go` run, the review plan step's own session reads `delegate.step.review-plan` through `lets delegate step instructions --for review-plan`. That session then starts a read-only plan reviewer, which reads `delegate.review.plan` through `lets delegate review instructions --for plan`. The review build step and the code reviewer pair the same way. Two nested sessions got near-identical keys, and readers took one for a leftover of the other. The `--for` values blurred the same line: `--for plan` under `review` meant the plan reviewer, and under `step` the plan step. The keys are a contract with every user's config file and every repository's `.lets/config.yaml`, so renaming them breaks each file and moves the config to a new `version`.

## Decision

Each guidance key names the step it steers, and sits directly under `delegate` as a mapping with a `guidance` leaf: `delegate.shape`, `delegate.plan`, `delegate.build` and `delegate.story` for the steps and the story run, and `delegate.review-plan` and `delegate.review-build` for the read-only reviewers that the two review steps start. `lets delegate review` takes `--for review-plan` and `--for review-build`, in place of `--for plan` and `--for code`, so `--for` always names a step, and the reviewer commands read `delegate.review-plan` and `delegate.review-build`. `lets delegate step` keeps its `--for` values, and the commands stay as they are.

A review step's own session has no key of its own: the review plan step's session takes `delegate.plan`, and the review build step's session takes `delegate.build`. This rule is temporary. Epic #352's stories #354 and #355 remove it, when `lets-go` starts each reviewer itself and the review step's own session goes away.

`lets` holds one table that maps each strategy and intent to its key. The config moves to `version: 4`.

## Consequences

- Easier: each key names something a user recognizes from the workflow, a step or a reviewer, so no two keys look alike.
- Easier: a review step needs one piece of guidance, its reviewer's, as plan and build each need one.
- Easier: a later per-step setting, such as an effort, has a home beside `guidance`, such as `delegate.plan.effort`, with no further break.
- Easier: `--for` names a step in every `lets delegate` command, and under `review` the key is the `--for` value.
- Harder: until #354 and #355 ship, a review step's own session, which fixes or rebuts the reviewer's findings, cannot be steered apart from the plan or build step. The value for `delegate.plan` must suit both sessions.
- Harder: until then, the key does not always follow from the command: `--for review-plan` under `step` reads `delegate.plan`, while under `review` it reads `delegate.review-plan`. The help, the README and the table in `lets` must say so, and a test keeps the README's table in step with the code.
- Harder: every caller of `lets delegate review` must pass the new `--for` values. `--for plan` and `--for code` stop with exit 2.
- Harder: every existing config breaks once. A version 3 file stops each `lets` command with a message that names each old key and its new one.

## Alternatives Considered

### Alternative 1: Keep the keys and explain them
- **Pros**: no breaking change; no new version.
- **Cons**: the look-alike pairs stay, and a reader of the file alone still cannot tell them apart.
- **Why not**: the confusion arises when someone reads the config file, not the docs. Only the key names are in front of that reader.

### Alternative 2: Rename the keys, but keep one key per session
- **Pros**: each session, including a review step's own, stays steerable on its own, for example `delegate.reviewer.plan` beside `delegate.step.review-plan`.
- **Cons**: two groups of keys still name the same review step, so the pairs stay alike; the user must still learn the nesting of a review step's two sessions.
- **Why not**: the user treats each review step as one step, which should need one piece of guidance, like plan and build. Steering a review step's own session apart was not worth a second look-alike key.

### Alternative 3: Hold the guidance text directly at the key
- **Pros**: shorter lines, such as `delegate.plan: Prefer claude.`
- **Cons**: a second setting for the same step would need the key to become a mapping later.
- **Why not**: that would be a second breaking change to every config. A mapping with a `guidance` leaf costs one line now and none later.
