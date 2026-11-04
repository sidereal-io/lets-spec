## Context

The offline kit contains protocol validators, recovery helpers and a persistent
fake executable. Its tests call it through stdin/stdout. The release copies the
unused kit and fixtures into dist. `invoke` duplicates process execution, uses
`any` for envelopes and propagates raw spawn errors. The fake infers categories
from message substrings. Shared `Io.execFile` handles input and deadlines but
lacks the kit's combined byte-limit and explicit signal-result semantics.

ADR-014 on the stack base chooses the executable boundary. This cleanup keeps
that decision and the full executable lifecycle; it adds no production caller.

## Goals / Non-Goals

**Goals:** normal source layout and runtime packaging; typed protocol values;
one process-execution implementation; preserved transport/recovery guarantees;
accurate capability, contract and discovery documentation.

**Non-Goals:** new provider APIs, dispatcher, wire fields, journal guarantees,
process sandboxing or new vocabulary beyond the agreed definitions.

## Test Seams

- **Primary test seam:** existing executable conformance and process fixtures,
  moved to `tests/lets/backlog/`. Keep real subprocess coverage of the boundary.
- **Existing seams reused:** `tests/lets/io.test.ts` for shared execution limits;
  fake I/O for caller-only branches; release assertions in `flake.nix`; full
  `pnpm test`, `pnpm test:backlog` and `nix flake check` for integration.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** shared process I/O, kit protocol/runtime types, fake state,
  release packaging and capability documentation. Existing delegate consumers
  must retain their default execution behavior.

## Decisions

### Move the source and preserve executable coverage

Move all kit files to `lets/src/backlog/` and tests/fixtures to
`tests/lets/backlog/`. Update relative imports, scripts, TypeScript include paths,
README and contract references. Keep one persistent fake implementation and the
four provider variation cases; introduce no duplicate in-process lifecycle model.
Use in-process I/O doubles only where they isolate caller handling, while retaining
real timeout, malformed output, signal and combined-overflow subprocess tests.

Remove dist copies and the smoke test importing released TypeScript fixtures.
Assert dist has no contrib, test-fixture or copied-contract payload. Keep the
repository tests and existing runtime-bundle check; no standalone kit package.

### Extend the existing I/O seam without changing defaults

Let `Io.execFile` accept an optional combined stdout/stderr byte limit and report
an explicit output-limit outcome and terminating signal. Absent these options,
retain existing limits and result shapes so delegate callers and fake I/O keep
working. For a configured limit, count raw bytes across both streams, terminate
promptly on overflow, release pipes and settle once. Preserve timeout behavior
when descendants retain pipes. Test multibyte output and stderr-only overflow,
plus a combined overflow where each stream alone stays below the limit.

`invoke` validates inputs, serializes the request and calls injected shared I/O,
defaulting to `realIo()`. Preserve the 5-second/1-MiB defaults. Signal, deadline,
overflow and invalid output remain structured unknown outcomes requiring mutation
reconciliation. A spawn failure becomes `AdapterFailure`, conservatively retaining
unknown effects. Preserve valid provider categories/effects without rewrapping
them as unknown. Invalid invocation limits are rejected before launching.

### Type data at its boundaries and classify errors explicitly

Use `unknown` for parsed external data, narrow it through validators, and define
request/response, operation, claim, journal, edge and persistent-state types.
Prefer discriminated unions over broad records or unchecked casts. Keep wire
validation unchanged apart from structured classification; no runtime dependency.
Format blocks and expressions in the surrounding `lets/src` style.

Use structured domain/validation errors for expected fake failures. Convert known
request-validation failures to invalid_request at that validation boundary, not
by inspecting their text in a global catch. Preserve permission, capability,
conflict and partial-write categories at their source. Unknown programming errors
must become unknown_outcome/unknown, even when their text contains a category.
Validate persisted JSON before relying on typed state; a cast is not validation.

### Keep definitions and evidence at their proper scope

The shared glossary owns Backlog, Work item and Packet. The contract defines
Claim, Worker session, Display reference, Pull request reference and Completion
beside their guarantees. Qualify session/reference uses to distinguish accounts,
scoped identities, labels and code-host associations. Do not duplicate definitions.

The delta retains every existing scenario on modified requirements and states
current guarantees. Delivery verification belongs in tasks. Discovery restores
Change to supported and describes actual GitHub setup/shaping/build paths, while
naming future provider work as gaps without implying production support.

These are implementation and documentation choices within ADR-014, not a new
architectural extension point. Shared I/O options are additive and reversible.

## Risks / Trade-offs

- [Shared execution breaks delegate behavior] → optional limits/result fields,
  default-shape regressions and full delegate suite.
- [Type cleanup hides invalid persisted data behind casts] → validate at JSON
  boundaries and retain negative protocol/state cases.
- [Error refactoring changes uncertain-write recovery] → preserve partial/lost
  mutation and ownership-replay scenarios; assert categories and effects.
- [Moving tests weakens coverage] → move rather than replace the executable
  lifecycle; compare test inventory before/after.
- [Spec replacement loses scenarios] → carry complete modified requirement blocks.

## Migration & Rollback

No production data migration or config change. Source consumers update relative
imports; runtime releases stop including unused developer payloads. Revert this
layer to restore the old layout and packaging without altering the ADR decision.
Merge #163 first, then this layer; retarget/rebase only after its base lands.
