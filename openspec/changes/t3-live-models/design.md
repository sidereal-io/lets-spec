## Context

- `lets/src/resolvers/t3/t3.ts` reads `~/.t3/userdata/model-manifest.json` in two places. The adapter's `options` turns it into `options` through `optionsFromT3Manifest`, and `launchThread` takes a bare family's default from it through `defaultModel`.
- The adapter already speaks T3's WebSocket RPC through `request()`. That function gets a ticket for the stored token, issuing a new token when T3 rejects the old one, then sends one `Request` frame and waits up to 120 s for its `Exit`. Today only `orchestration.launchThread` and `orchestration.dispatchCommand` use it.
- T3's `server.getConfig` (payload `{}`) returns the composer's catalogue. Its `providers[]` entries carry `instanceId`, `driver`, `enabled`, `status` (`ready`, `warning`, `error` or `disabled`) and `models[]`. Each model carries a `slug`, and may carry `isDefault`, `isLegacy` and `isCustom`. `settings.providerModelPreferences[<instanceId>].hiddenModels` lists the slugs the user hid. This was read from the t3code 0.1.0 server bundle (`loadServerConfig`) and from a live call on 2026-10-31.
- PR #121 (#120) is changing how gemini ids and efforts are sent, in `t3ModelSelection` and `defaultModel`'s `keepEffort`. This change has to sit beside it without fighting it.

## Goals / Non-Goals

**Goals:**

- One source of models for the `t3` resolver: the live catalogue, used for both `options` and a bare family's default.
- A probe that stays quick and never fails the command because T3 is slow or refuses.
- Pure functions for the catalogue logic, so the filter, the order and the default are tested without a socket.

**Non-Goals:**

- Changing which id or effort `t3` sends for a model. #120 owns that.
- Refusing a `--model` that the catalogue lacks. "A resolver runs a model it never listed" stays as it is.
- Caching the catalogue between commands.
- Listing models from a second instance of a provider, such as a `codex_work` instance next to `codex` (see Decisions).

## Test Seams

- **Primary test seam:** `lets delegate review instructions` and `lets delegate handoff run`, driven through `tests/lets/resolvers/t3/delegate.test.ts`, with the real T3 adapter on the kit's fake io. Its fake WebSocket learns to answer `server.getConfig` with a catalogue. This seam covers every spec scenario, including the timeout, which uses `node:test` mock timers.
- **Existing seams reused:** `tests/lets/resolvers/t3/t3.test.ts`. Its `optionsFromT3Manifest` tests become tests of the pure catalogue functions. Its `silentWebSocket`, `refusedWebSocket` and mock-timer pattern cover `request()`'s new timeout argument.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the `t3` resolver only (`lets/src/resolvers/t3/t3.ts` and its tests), plus `docs/resolvers.md`. The `options` shape and the resolver contract do not change. The new dependency on a private T3 request is the main exposure.

## Decisions

### Read the catalogue with `server.getConfig`

`server.getConfig` is the request the T3 UI makes to fill its model picker, so it lists what the composer offers.

- **Alternative: `orchestrator_capabilities`, the T3 MCP tool.** It reads the same catalogue, but its tools reach only the agent process T3 started, not a child like `lets` (see the comment at the top of `t3.ts`).
- **Alternative: subscribing to provider updates.** A subscription keeps a socket open for a list the probe needs once.

The request goes into the "What is private here" comment at the top of `t3.ts`, next to `launchThread`.

### Give `request()` a timeout argument

`request()` takes an optional `timeoutMs`, which defaults to `REPLY_TIMEOUT_MS`. Its timeout message names the thread only when there is one. The probe passes `CATALOGUE_TIMEOUT_MS = 10_000`. A second, smaller copy of the socket code would drift from the first.

### Keep the catalogue logic in pure functions

- `optionsFromCatalogue(config)` replaces `optionsFromT3Manifest`. It keeps each provider whose `enabled` is true and whose `status` is `ready` or `warning`, in `providers[]` order. It maps the instance id to a family through `T3_INSTANCE`, puts the `isDefault` model first, drops hidden slugs, and keeps the existing gemini rule: no effort suffix, once per model.
- `defaultModel(config, family, { keepEffort })` keeps its signature, so #121 can merge with no conflict. It reads the `isDefault` model of the family's instance instead of the manifest's `defaults.chat`.
- The `Catalogue` type names only the fields these functions read.

### Map providers by instance id, as runs do

`t3ModelSelection` always sends `T3_INSTANCE[family]`, such as `codex`. If the probe listed models from a second instance, such as `codex_work`, a run of one of them would go to the `codex` instance, which may not have it. So a provider counts only when its `instanceId` is in `T3_INSTANCE`, exactly as the manifest's keys did.

### The probe turns every failure into a warning

The adapter's `options` catches any error from the catalogue request: no running server, T3 refusing the upgrade, a failed `getConfig`, no reply, or a token that cannot be issued. It returns `[]`, and warns `T3 gave no model catalogue: <reason>`. The reason is the kit error's message, which already says what happened, such as T3's own refusal message.

### A bare-family run fetches the catalogue just before launch

When `model` is null, `launchThread` asks for the catalogue with the same server and token it is about to launch with, and the short timeout. If that fails, it sends no model and T3 picks its own default, as happens today when the manifest is missing. The launch that follows reports any real connection problem with its usual refusal or exit 4. Failing the run over the default alone would make an unreachable catalogue look worse than an unreachable T3.

## Risks / Trade-offs

- [A T3 update renames or reshapes `server.getConfig`] → The probe warns and lists no models instead of failing. The "After a t3 update" smoke test in `docs/resolvers.md` gains a step that compares the probe's `options` with the composer's picker.
- [The first probe issues a T3 token as a side effect] → It is the same token, path and label a run uses, so it adds no new kind of state (D7).
- [A probe now costs a network round trip, up to 10 s when T3 hangs] → It runs once per instructions command, and the timeout bounds it.
- [`warning` includes a provider that is still being checked, which may then fail] → A run of one of its models is refused as today, and the caller tries the next model (D9).
- [#121 and this change both edit `t3.ts` and the T3 scenarios] → `defaultModel` keeps its signature. Whichever change archives second updates #121's "T3's manifest gives `antigravity` a default" scenarios to name the catalogue.

## Migration & Rollback

N/A. No stored data changes shape. Reverting the commit puts the manifest reads back.
