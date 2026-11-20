## ADDED Requirements

### Requirement: lets sync reports a missing OpenSpec CLI
`lets sync` SHALL treat the OpenSpec CLI as missing when `openspec --version` cannot start or exits non-zero. It SHALL run this check whether or not the `lets` package has a `release.json`, and in both skills modes.

When the CLI is missing, `lets sync` SHALL list this problem on stderr, under its `lets-spec: <n> problem(s) to fix:` heading, and SHALL still exit 0:

`the OpenSpec CLI is not on PATH, and the openspec-* skills need it. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".`

When the CLI is missing, `lets sync --check` SHALL print this line on stderr and exit 1:

`lets-spec: the OpenSpec CLI is not on PATH. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".`

A CLI whose `openspec --version` exits 0 SHALL NOT count as missing, even when it prints no version.

#### Scenario: No openspec on PATH
- **WHEN** `lets sync` runs in a git project and no `openspec` command is on PATH
- **THEN** stderr holds `the OpenSpec CLI is not on PATH, and the openspec-* skills need it. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".` under the `lets-spec: <n> problem(s) to fix:` heading
- **AND** `lets sync` exits 0

#### Scenario: openspec on PATH exits non-zero
- **WHEN** `lets sync` runs and `openspec --version` on PATH exits 1, as a broken mise shim does
- **THEN** stderr holds the missing-CLI problem
- **AND** `lets sync` exits 0

#### Scenario: Missing CLI with no release.json
- **WHEN** `lets sync` runs from the source tree, which has no `release.json`, and no `openspec` command is on PATH
- **THEN** stderr holds the missing-CLI problem

#### Scenario: --check with a missing CLI, committed mode
- **WHEN** `lets sync --check` runs in the committed skills mode, in a project that is otherwise up to date, and no `openspec` command is on PATH
- **THEN** stderr holds `lets-spec: the OpenSpec CLI is not on PATH. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".`
- **AND** `lets sync --check` exits 1

#### Scenario: --check with a missing CLI, ignored mode
- **WHEN** `LETS_SPEC_SKILLS=ignored lets sync --check` runs in a project that is otherwise up to date, and no `openspec` command is on PATH
- **THEN** stderr holds `lets-spec: the OpenSpec CLI is not on PATH. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".`
- **AND** `lets sync --check` exits 1

#### Scenario: --check with an installed CLI
- **WHEN** `lets sync --check` runs in a project that is otherwise up to date, and `openspec --version` on PATH exits 0
- **THEN** stderr does not hold `the OpenSpec CLI is not on PATH`
- **AND** `lets sync --check` exits 0

#### Scenario: A CLI that prints no version
- **WHEN** `lets sync` runs and `openspec --version` on PATH exits 0 and prints nothing
- **THEN** the output holds neither the missing-CLI problem nor an OpenSpec CLI version warning

## MODIFIED Requirements

### Requirement: The OpenSpec CLI version warning works on every install
`lets sync` SHALL compare the OpenSpec CLI on PATH with the version recorded in the `release.json` of the `lets` package that runs, whether that package comes from the Nix flake or the release tarball. It SHALL compare them by semver precedence: major, minor and patch as numbers, a prerelease older than its release, and build metadata ignored.

When the CLI on PATH is older, `lets sync` SHALL list this warning under its `lets-spec: <n> problem(s) to fix:` heading: `the OpenSpec CLI on PATH is <found>, older than <pinned>, which this release's openspec-* skills were generated from. Upgrade it to <pinned> or later.` When the CLI is the same version or newer, or when either version is unknown, it SHALL NOT warn. `lets sync --check` SHALL NOT fail because the CLI is older.

#### Scenario: Nix install with a different CLI on PATH
- **WHEN** `lets sync` runs from the flake's `lets` package, whose `release.json` records OpenSpec `1.2.3`, and `openspec --version` on PATH prints `1.1.0`
- **THEN** stderr holds `the OpenSpec CLI on PATH is 1.1.0, older than 1.2.3, which this release's openspec-* skills were generated from. Upgrade it to 1.2.3 or later.`

#### Scenario: Patch compared as a number
- **WHEN** `release.json` records OpenSpec `1.2.10`, and `openspec --version` prints `1.2.9`
- **THEN** stderr holds `the OpenSpec CLI on PATH is 1.2.9, older than 1.2.10, which this release's openspec-* skills were generated from. Upgrade it to 1.2.10 or later.`

#### Scenario: A prerelease of the recorded version
- **WHEN** `release.json` records OpenSpec `1.2.3`, and `openspec --version` prints `1.2.3-beta.1`
- **THEN** stderr holds `the OpenSpec CLI on PATH is 1.2.3-beta.1, older than 1.2.3, which this release's openspec-* skills were generated from. Upgrade it to 1.2.3 or later.`

#### Scenario: The same CLI
- **WHEN** `lets sync` runs and `openspec --version` prints the version the package's `release.json` records
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: The same CLI with build metadata
- **WHEN** `release.json` records OpenSpec `1.2.3`, and `openspec --version` prints `1.2.3+nix`
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: A newer CLI
- **WHEN** `release.json` records OpenSpec `1.2.3`, and `openspec --version` prints `2.1.0`
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: No release.json
- **WHEN** `lets sync` runs from the source tree, which has no `release.json`, and `openspec --version` prints `0.0.1`
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: --check with an older CLI
- **WHEN** `lets sync --check` runs in a project that is otherwise up to date, from a package whose `release.json` records OpenSpec `1.2.3`, and `openspec --version` prints `1.1.0`
- **THEN** `lets sync --check` exits 0
