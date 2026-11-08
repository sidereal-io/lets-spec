---
name: lets-plan
description: Plan one claimed change in an OpenSpec project, on the change's branch. Runs openspec-propose for the change, or continues it, and stops when the plan is ready. Use when lets-go runs the plan step, or when someone asks to plan or carry on planning the change on the current branch.
---

# Let's plan

Plan one change, on its branch. This is the plan step. `lets-go` claims
the issue and routes it first. Run every command below from the repo
root.

## Configured backlog calls

Use the configured default GitHub connection and the
[Backlog action loop](../lets-go/references/backlog-actions.md) for every
repository, issue and PR action below. Keep this step's own worker ID.
PR reads use input `branch` for the current branch or the validated PR ID;
body updates and ready requests use that exact ID. Only validated results
advance the step; save complete prepared bodies in private scratch.
Resolve repository/actor and the linked Project through the read-only
bootstrap and discovery calls when the caller supplied no validated
scope. Resolve issue numbers through scoped `lets backlog item.search`;
keep full identities. Verify required tools and writable shared state in
this session before backend issuance. Missing prerequisites return the
existing failed report with a remedy, without another tool or connection.

## Find where you are

1. Find the default branch:
   `lets backlog repository.read --request-file`, using `repository.defaultBranch`.
2. Run `git branch --show-current`. On the default branch, say that
   `lets-go` starts an issue, and stop. Otherwise the branch is the
   change's name, `<name>`.
3. Take the issue, `<i>`, and the route line from the caller. When the
   caller gives no issue, search for it:

   ```bash
   lets backlog item.search --request-file
   ```

   Keep the one whose title starts with `<branch> — `. If none or
   several match, say that `lets-plan` needs the issue number, and stop.

## Plan

Invoke the `openspec-propose` skill for the change `<name>`, for issue
#<i>. Give it the route line for the proposal's commit message. When the
route is `lets-minimal` and the flow's schema is not, say to use the
schema `lets-minimal`. The flow's schema is the `schema:` line of
`openspec/config.yaml`.

When `openspec/changes/<name>/` exists, say to continue the change. When
it does not, and you have no route line, stop: say that `lets-go` routes
and claims the issue.

## When propose stops

Read the state:

```bash
openspec instructions apply --change <name> --json
```

- `ready`: say the plan is ready. On `lets-standard`, the plan review
  comes next.
- Anything else: say that propose stopped early, for example to ask a
  question, and stop.

## Rules

- Never plan on the default branch.
- Never build, and offer no handoff.
- Write no artifact yourself. The skills you invoke write them.
