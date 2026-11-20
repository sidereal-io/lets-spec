<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#273 openspec-cli-is-the-projects-own — lets sync checks that the OpenSpec CLI is installed, and lets-spec no longer pins or supplies it.
https://github.com/sidereal-io/lets-spec/issues/273

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Who installs the OpenSpec CLI in a project? | The project, however it likes. lets-spec stops pinning, shipping or downloading it for projects (option D). | Evidence: #277 body, *Decision* |
| D2 | Does `lets sync` generate the `openspec-*` skills with the project's CLI? | No. It keeps copying them from the release, and never runs `openspec init` or `openspec update`. | Evidence: #273 body, *Scope: out*; #277 body, *Decision* item 3 |
| D3 | What does a missing CLI do? | `lets sync` warns, says how to install it, and exits 0. `lets sync --check` fails, in both skills modes. | Evidence: #273 body, *Scope: in* |
| D4 | When does `lets sync` warn about the CLI's version? | Only when the CLI is older than the `openspec` version in `release.json`. Equal or newer is silent. No `release.json` is silent. `--check` does not fail on an older CLI. | Evidence: #273 body, *Scope: in* |
| D5 | Does the Nix flake still supply the CLI to projects? | No. The flake module's `packages` and the flake's `bundle` drop it. This breaks Nix projects until they add one. | Evidence: #273 body, *Scope: in* |
| D6 | Does this repository keep its own OpenSpec pin and release build? | Yes. `mise.toml` keeps `"npm:@fission-ai/openspec" = "1.13.2"`, and the release still generates its skills from nixpkgs' OpenSpec and records it in `release.json`. | Evidence: #273 body, *Scope: out*; `mise.toml`; `flake.nix` |
| D7 | When is the CLI missing? | When `openspec --version` cannot start or exits non-zero. A CLI that exits 0 but prints no version is not missing; its version is unknown, so no version warning. The missing check does not need `release.json`. | Assumption |
| D8 | What do the three messages say? | Missing, in `lets sync`: `the OpenSpec CLI is not on PATH, and the openspec-* skills need it. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".` Missing, in `--check`: `lets-spec: the OpenSpec CLI is not on PATH. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".` Older: `the OpenSpec CLI on PATH is <found>, older than <pinned>, which this release's openspec-* skills were generated from. Upgrade it to <pinned> or later.` | Assumption |
| D9 | How are versions compared? | By semver precedence: major, minor and patch as numbers, a prerelease older than its release, build metadata ignored. | Assumption |
| D10 | What does the README tell Nix projects to add? | `pkgs.openspec` from the project's own nixpkgs, beside `config.letsSpec.packages`. The flake keeps its `packages.openspec` output for its own build and checks, without documenting it for projects. | Assumption |
| D11 | What does the release workflow's notes line say? | `OpenSpec CLI: <version> or later`, in place of `OpenSpec CLI: <version>`, so nobody reads it as a pin. | Assumption |
| D12 | How do Nix projects learn of the breaking change? | The README's *Updating → With Nix* says to add an OpenSpec CLI. The pull request description has a *Breaking for Nix projects* section, for whoever cuts the next release to copy into its notes. | Assumption |

## Changes from the story

Added: `.github/workflows/release.yml`, which the story's *Relevant code* does not name. D11 changes its release-notes line so projects stop reading the OpenSpec version as a pin.

Confirmed by user: yes
