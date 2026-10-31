## Context

- `lets/src/resolvers/t3/t3.ts` reads `~/.t3/userdata/model-manifest.json` in two places. The adapter's `options` turns it into `options` through `optionsFromT3Manifest`. `launchThread` takes a bare family's default from it through `defaultModel(manifest, family)`, which #121 left without its old `keepEffort` argument.
- With no default in the manifest, `launchThread` sends `model: null` today. T3 rejects that: `ModelSelectionWire.model` is a `TrimmedNonEmptyString` (t3code 0.1.0 `binCli-*.mjs`). This manifest gives `codex` no default, so a bare `gpt` fails today.
- The adapter already speaks T3's WebSocket RPC through `request()`. First `request()` gets a ticket for the token, issuing a new token when T3 rejects the old one. Then it sends one `Request` frame and waits up to 120 s for its `Exit`. Only the reply wait has a time limit. `issueToken` runs `t3` with no limit, and `requestTicket` fetches with no signal.
- T3's `server.getConfig` (payload `{}`) returns the composer's catalogue. Each entry of its `providers[]` carries:
  - `instanceId`, `driver`, `enabled`, and a `status` of `ready`, `warning`, `error` or `disabled`;
  - `models[]`, each with a `slug`, and optionally `isDefault`, `isLegacy` and `isCustom`.

  `settings.providerModelPreferences[<instanceId>].hiddenModels` lists the slugs the user hid. The composer keeps a custom model even when its slug is hidden. It picks a default as `isDefault ?? first`, among the visible models. The author read all this in the t3code 0.1.0 bundle (`loadServerConfig`, the client's `utils-*.js`), and made a live call on 2026-10-31.

## Goals / Non-Goals

**Goals:**

- One source of models for the `t3` resolver: the live catalogue, for both `options` and a bare family's model.
- A probe that ends within 10 seconds, and never fails the command because T3 is slow, refuses, or answers in a shape `t3` does not know.
- Catalogue logic in pure functions that a test can drive without a socket.

**Non-Goals:**

- Changing which id or effort `t3` sends for a named model. #121 settled that.
- Refusing a named `--model` that the catalogue lacks. "A resolver runs a model it never listed" stays as it is.
- Caching the catalogue between commands.
- Running models on a second instance of a provider, such as `codex_work`.

## Test Seams

- **Primary test seam:** `lets delegate review instructions` and `lets delegate handoff run`, driven through `tests/lets/resolvers/t3/delegate.test.ts`. The real T3 adapter runs on the kit's fake io. Its fake WebSocket learns to answer `server.getConfig` with a catalogue, by the request's `tag`. This seam covers every spec scenario. The timeout scenarios use `node:test` mock timers, with a `fetch` and a WebSocket that never answer.
- **Existing seams reused:** `tests/lets/resolvers/t3/t3.test.ts`. Its `optionsFromT3Manifest` tests become tests of the pure catalogue functions. Its `silentWebSocket` and mock-timer pattern cover `request()`'s deadline.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the `t3` resolver only (`lets/src/resolvers/t3/t3.ts` and its tests), plus `docs/resolvers.md`. The `options` shape and the resolver contract do not change. The new dependency on a private T3 request is the main exposure.

## Decisions

### Read the catalogue with `server.getConfig`

`server.getConfig` is the request the T3 UI makes to fill its model picker, so it lists what the composer offers.

- **Alternative: `orchestrator_capabilities`, the T3 MCP tool.** It reads the same catalogue, but its tools reach only the agent process T3 started, not a child like `lets` (see the comment at the top of `t3.ts`).
- **Alternative: subscribing to provider updates.** A subscription keeps a socket open for a list the probe needs once.

The request goes into the "What is private here" comment at the top of `t3.ts`, next to `launchThread`.

### One deadline covers the whole catalogue request

A new `readCatalogue(io, origin)` runs the token, the ticket and the request under one 10 s deadline (`CATALOGUE_TIMEOUT_MS`). `request()` takes an optional deadline, and passes it on to each step:

- to `issueToken`, as `execFile`'s existing `timeoutMs`;
- to `requestTicket`, as an `AbortSignal` on `fetch`;
- to the reply wait, as the time left.

A timeout message names the thread only when there is one. Each step stops when the deadline passes, so no open handle keeps the process alive after the command answers. An outer `Promise.race` alone would answer on time, but would leave a hung `fetch` holding the process for minutes.

### Read the reply defensively, in pure functions

The reply is untrusted data from a private protocol, so the functions take `unknown`:

- `catalogueOf(value)` returns the providers and hidden slugs. It throws `Refused('T3 gave no model catalogue: …')` when `providers` is not an array. It skips any entry or model that lacks the fields the next two functions need.
- `optionsFromCatalogue(catalogue)` replaces `optionsFromT3Manifest`. It keeps an instance when `enabled` is true, its `status` is `ready` or `warning`, and its `instanceId` is in `T3_INSTANCE`. It keeps the catalogue's order and puts the default first. It applies the gemini rule: no effort suffix, once per model.
- `defaultModel(catalogue, family)` keeps #121's signature shape. It returns the visible `isDefault` model, else the first visible one, else null. For gemini it removes the suffix, as #121's version does.
- `visibleModels(instance, hidden)` is shared by both: `isCustom || !hidden.has(slug)`, as in the composer.

### Map providers by instance id, as runs do

`t3ModelSelection` always sends `T3_INSTANCE[family]`, such as `codex`. If the probe listed models from a second instance, such as `codex_work`, a run of one of them would go to the `codex` instance, which may not have it. So an instance counts only when its `instanceId` is in `T3_INSTANCE`, exactly as the manifest's keys did. The spec names the three ids.

### The probe turns every failure into a warning

The adapter's `options` wraps both `readCatalogue` and `catalogueOf` in one `try`. It catches any error, a kit error or not: no running server, a refused upgrade, a failed `getConfig`, a timeout, a token that cannot be issued, or a reply of another shape. It returns `[]`, and warns with the error's message, which starts `T3 gave no model catalogue` or carries T3's own refusal. A plain `TypeError` therefore never reaches `lookup.ts` as exit 4.

### A bare family fetches the catalogue, then reads the token again

When `model` is null, `launchThread` calls `readCatalogue` and `defaultModel` before it reads the token for the launch. If the catalogue request replaced a rejected token, the launch reads the new one from disk. It does not reuse a stale value and mint a second token. When `defaultModel` returns null, or the catalogue fails, `launchThread` throws `Refused` with the reason. The resolver then tries the next `--model`, or exits 3 (D10). The thread is never created, so there is nothing to archive.

## Risks / Trade-offs

- [A T3 update renames or reshapes `server.getConfig`] → The probe warns and lists no models, and a bare family refuses. The "After a t3 update" smoke test in `docs/resolvers.md` gains a step that compares the probe's `options` with the composer's picker.
- [The first probe issues a T3 token as a side effect] → It is the same token, path and label a run uses, so it adds no new kind of state (D7).
- [A probe now costs a network round trip, up to 10 s when T3 hangs] → It runs once per instructions command, and the deadline bounds it.
- [`warning` includes an instance that is still being checked. Antigravity can sit in `warning` with no models until its first session] → Its models are listed once T3 has them. A bare `gemini` refuses until then (D9, D10).
- [A named model is still sent when the catalogue lacks it] → This is the contract (ADR-006), and T3's refusal is reported as before.

## Migration & Rollback

N/A. No stored data changes shape. Reverting the commit puts the manifest reads back.
