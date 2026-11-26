# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. No decision in `design.md` needs a record. Each one can be read back from the code and changed cheaply: where the prompt text lives, the table of flags per step, how the plain-language path is found, and the trailing newline. Moving the frame out of the skill applies epic #263's shared decision, and a revert restores the frame. The change is consistent with the records below.

## In-Force ADRs Reviewed

- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md), [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md), [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md), [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md), [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md), [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md), [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md), [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md), [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md), [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md), [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md), [ADR-021: each product has a map](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md), [ADR-021: where an outside command runs](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md), [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md), [ADR-026](../../../docs/decisions/ADR-026-a-repository-config-wins-leaf-by-leaf.md), [ADR-027: the project installs the OpenSpec CLI](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md), [ADR-030](../../../docs/decisions/ADR-030-an-empty-epic-is-its-own-discovery-parent.md): read as context; this change touches none of their decisions.
- [ADR-020: lets-go is the only runner](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): `lets-go` still writes every prompt; the command only prints the text.
- [ADR-022: a step reports through its final message](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md) and [ADR-023: a step asks through its report](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md): the prompt's `## Questions` and `## The report` sections keep these rules word for word.
- [ADR-025: an item key is opaque](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md): the command passes `--issue` through unchanged. The design notes that the prompt writes `#` and the key, as today.
- [ADR-027: a story run is a child lets-go session](../../../docs/decisions/ADR-027-a-story-run-is-a-child-lets-go-session.md) and [ADR-028: each story run works in its own worktree](../../../docs/decisions/ADR-028-each-story-run-works-in-its-own-worktree.md): the story prompt still names the worktree and says the child claims and routes nothing.
- [ADR-029: a step skill owns its rules](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md): the prompt still says what to run in one sentence and carries only what the caller knows and the shared rules for questions and the report.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
