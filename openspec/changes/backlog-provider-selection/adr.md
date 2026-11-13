# ADR Review Manifest

- Status: completed
- Review date: 2026-11-13

## Review Summary

Two of design.md's decisions are costly to reverse.

- **Decision 3, keys are opaque strings.** Reversing it would rework every adapter, the `lets backlog` contract and the skills that read it.
- **Decision 2, where the backlog provider is set.** It puts the first repository setting in `openspec/config.yaml`, beside ADR-011's user file. Moving it later would break every repository's config.

The other decisions can be recovered from the code:
- the registry of backlog providers (1);
- the creation-time tie-break and the GitHub field it reads (4);
- the error names (5);
- how `lets-go` asks for a key (6);
- the placeholder rule for labels (7).

## In-Force ADRs Reviewed

- [ADR-021](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md): backlog calls run in lets code through an adapter, with shared rules outside it. This change follows it. ADR-025 builds on it.
- [ADR-011](../../../docs/decisions/ADR-011-one-config-file-shaped-like-the-commands.md): the user config. ADR-026 narrows its one-file rule to settings that belong to a person, and ADR-011 now carries a note that says so. Its layout rule stands.
- [ADR-002](../../../docs/decisions/ADR-002-lets-owns-the-delegate-config.md): only lets reads its config. Unchanged.
- [ADR-017](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md): `lets-go` reads records from Git and GitHub. Unchanged, since pull request reads stay as `gh`.
- [ADR-020](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md): `lets-go` is the runner whose input rule changes. Unaffected.
- [ADR-012](../../../docs/decisions/ADR-012-issue-comments-are-evidence.md), [ADR-013](../../../docs/decisions/ADR-013-the-reply-is-the-read-marker.md): issue comments. The thread read stays in the skill. Unaffected.
- [ADR-001](../../../docs/decisions/ADR-001-default-delegate-starts-no-session.md), [ADR-005](../../../docs/decisions/ADR-005-the-config-lists-the-chain.md), [ADR-006](../../../docs/decisions/ADR-006-the-caller-chooses-the-model.md), [ADR-007](../../../docs/decisions/ADR-007-delegations-by-strategy-and-intent.md), [ADR-008](../../../docs/decisions/ADR-008-lets-tries-the-ranked-models.md), [ADR-010](../../../docs/decisions/ADR-010-the-resolvers-are-built-into-lets.md), [ADR-016](../../../docs/decisions/ADR-016-review-and-handoff-stay-apart-from-step.md), [ADR-019](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md), [ADR-021 (maps)](../../../docs/decisions/ADR-021-each-product-has-a-map-and-the-root-lists-them.md), [ADR-022](../../../docs/decisions/ADR-022-a-step-reports-through-its-final-message.md), [ADR-023](../../../docs/decisions/ADR-023-a-step-asks-through-its-report.md), [ADR-024](../../../docs/decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md): delegation, steps, reviews and discovery maps. Unaffected.

## New Durable ADRs Created

- [ADR-025: A backlog item is named by an opaque key that only its backlog provider reads](../../../docs/decisions/ADR-025-an-item-key-is-opaque.md)
- [ADR-026: A repository's own lets settings live in a `lets:` block of `openspec/config.yaml`](../../../docs/decisions/ADR-026-project-settings-live-in-the-openspec-config.md)
