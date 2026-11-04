## Why

The agreed backlog contract has only simulated adapters; build still embeds GitHub commands. A real GitHub walking skeleton must prove that boundary before other integrations depend on it (D1, D2).

## What Changes

- Add production `lets backlog` dispatch and the default GitHub executable for existing-story build operations.
- Resolve repository selection and mappings under `lets.backlog`, preserving unconfigured GitHub discovery (D2).
- Move GitHub translation behind the boundary while retaining shared readiness, packet and routing policy (D3).
- Persist scoped item identity and session ownership for planning, resumption, PR association, release and merge-gated completion (D4).
- Migrate the build and finishing instructions in both flows; keep setup and shaping unchanged.
- Add automated failure checks and live acceptance through the implemented flow using the agreed test repository and Project (D5, D6).

## Capabilities

### New Capabilities

- `github-backlog-build`: Build existing GitHub packets through the executable backlog boundary, including configuration, recovery, identity and completion.

### Modified Capabilities

None. `backlog-adapter-contract` remains the prior contract-validation delivery; `issue-comments` and `shared-domain-language` remain shared policy inputs.

## Impact

Touches `lets/src/main.ts`, new backlog runtime and GitHub adapter modules, executable packaging, `skills/lets-build/`, both source schemas, `overlays/AGENTS.md`, release checks and documentation. Reuses the existing YAML dependency and contract definitions. GitHub authentication continues through `gh`; no credentials enter repository configuration. Setup/shaping operations and non-GitHub adapter implementations remain separate stories.
