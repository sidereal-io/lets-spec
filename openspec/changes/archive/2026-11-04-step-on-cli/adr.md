# ADR Review Manifest

- Status: completed
- Review date: 2026-11-04

## Review Summary

ADR review completed for this change. Every record in `docs/decisions/` was read. The design's five decisions were tested against the `lets-write-adrs` rule: a real fork, costly to reverse, that an engineer reading only the code could reverse by accident.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md): the default starts no session. Unchanged: `subagent` still saves the prompt and refuses a step.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md): only `lets` reads the config. Unchanged.
- [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md): the config lists the chain in order. The migration note in the spec delta relies on it: a user who wants steps elsewhere orders the chain.
- [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md): the resolver runs exactly the model it is given. The step passes the model as the review does.
- [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md): a strategy fixes options, output and exit codes. The step's exit codes come from `delegate-step`, not from this change.
- [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md): a refusal moves to the next model. A CLI that will not start in its write mode is a refusal.
- [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md): the resolvers are adapters inside `lets`. Supersedes ADR-003, ADR-004 and ADR-009.
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): one config file. Unchanged.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md) and [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments. Not touched by this change.
- [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md): the report travels in the final message, and exit 0 means a report. Design D-3 follows it: an empty message becomes a `failed` report, not an exit code.
- [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md): a step never asks in its session. This is why the write mode must never prompt (design D-2).
- [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md): one adapter method per kind of session, and an adapter may share one private function between `run` and `step`. Design D-1 is that function.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md) and [ADR-018](../../../docs/decisions/ADR-018-lets-build-stays-and-loses-its-handoff.md): `lets-go` and `lets-build`. Not touched by this change.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced. The contract this change binds to was decided in ADR-016. The choice of each CLI's write mode (design D-2) is three flags in one table, pinned by tests and shown in the docs: an engineer who changes them learns why from the test names and the design, and changing them back costs one edit. The rest of the decisions are recoverable from the code.
