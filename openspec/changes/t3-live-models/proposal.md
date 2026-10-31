## Why

Inside T3 Code, the `t3` resolver lists its `options` from T3's downloaded model manifest. That file is not what the composer offers. On 2026-10-23 it listed four models this T3 Code cannot run, and left out eight that it can, so `lets-build` handed #73 to `gpt-6-astra`. A caller that trusts `options` needs the models T3 Code can run now.

## What Changes

- `t3` lists its `options` from T3's live catalogue, the one the composer uses, which it asks the running T3 server for (D2).
- It lists only providers that are enabled and not failing, and leaves out the models the user hid in the composer. Each provider's default model comes first, in the catalogue's provider order (D4, D9).
- A bare family, such as `--model claude`, runs the default model the live catalogue gives that provider (D3).
- `t3` stops reading `model-manifest.json`.
- When T3 cannot answer in a few seconds, `t3` lists no `options`, and says why on stderr. The command still exits 0 (D5).
- To read the catalogue, the probe may need a T3 token, and issues one when none is stored, as a run does (D7).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `delegate-resolvers`: the requirement "The T3 resolver lists the models in its manifest" becomes a requirement to list the models T3 Code can run now. It also names where the default model for a bare family comes from. The scenarios of "T3 Code has its own resolver" stop naming the manifest.

## Impact

- **Code:** `lets/src/resolvers/t3/t3.ts`: `optionsFromT3Manifest`, `defaultModel`, `readManifest`, the adapter's `options`, and the default model in `launchThread`. The WebSocket `request` gains a caller with a short timeout. Its tests are in `tests/lets/resolvers/t3/`.
- **T3 protocol:** the resolver depends on one more private T3 request, `server.getConfig`. A T3 update can change it, as it can change `orchestration.launchThread`. The smoke test in `docs/resolvers.md` ("After a t3 update") should cover the model list.
- **Docs:** `docs/resolvers.md` ("Which model runs") describes the catalogue.
- **Overlap with #120 (PR #121):** that change modifies "The T3 resolver opens a session in a T3 thread". Its new scenarios say that T3's manifest gives the bare `gemini` default. Whichever change archives second updates those scenarios to match: after this change, the default comes from the live catalogue, and has no effort suffix to remove. This change does not alter how gemini model ids are sent (D6).
