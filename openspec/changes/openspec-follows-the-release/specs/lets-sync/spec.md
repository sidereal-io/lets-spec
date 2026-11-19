## ADDED Requirements

### Requirement: The release tarball runs the OpenSpec CLI its release records
The release tarball SHALL ship an `openspec` command in `bin/`, beside `lets`. The command SHALL run the OpenSpec CLI version that the tarball's `release.json` records, as `npx --yes @fission-ai/openspec@<version>`, with the arguments it was given. It SHALL pass standard input, standard output, standard error and the exit code through unchanged. It SHALL set `OPENSPEC_NO_UPDATE_CHECK=1` for the CLI it runs. When `npx` is not on `PATH`, it SHALL exit 127 and write to stderr: `openspec: this release runs the OpenSpec CLI <version> with npx, and npx is not on PATH. Install Node, which includes npx.`

#### Scenario: Arguments and the version reach npx
- **WHEN** `bin/openspec list --json` runs from a tarball whose `release.json` records OpenSpec `1.13.2`, and the `npx` on `PATH` prints its arguments
- **THEN** stdout is `--yes @fission-ai/openspec@1.13.2 list --json`

#### Scenario: The update check is off
- **WHEN** `bin/openspec --version` runs, and the `npx` on `PATH` prints the value of `OPENSPEC_NO_UPDATE_CHECK`
- **THEN** stdout is `1`

#### Scenario: Input and exit code pass through
- **WHEN** `bin/openspec` runs with `hello` on stdin, and the `npx` on `PATH` copies stdin to stdout and exits 3
- **THEN** stdout is `hello`, and the exit code is 3

#### Scenario: npx is missing
- **WHEN** `bin/openspec --version` runs from a tarball whose `release.json` records OpenSpec `1.13.2`, and no `npx` is on `PATH`
- **THEN** it exits 127, and stderr is `openspec: this release runs the OpenSpec CLI 1.13.2 with npx, and npx is not on PATH. Install Node, which includes npx.`

#### Scenario: A mise project that pins no OpenSpec
- **WHEN** a project installs the release tarball with mise, its `mise.toml` pins no `npm:@fission-ai/openspec`, and `openspec --version` runs in the project
- **THEN** stdout holds the OpenSpec version that the tarball's `release.json` records

## MODIFIED Requirements

### Requirement: The OpenSpec CLI version warning works on every install
`lets sync` SHALL compare the OpenSpec CLI on PATH with the version recorded in the `release.json` of the `lets` package that runs, whether that package comes from the Nix flake or the release tarball. On a tarball install, when the first `openspec` on `PATH` is the tarball's own `bin/openspec`, `lets sync` SHALL NOT run it and SHALL NOT warn. When the two versions differ, it SHALL warn. From the Nix flake, the warning SHALL be: `the OpenSpec CLI on PATH is <found>, but this release's openspec-* skills were generated from <pinned>. Pin the CLI to <pinned>.` From the release tarball, the warning SHALL be: `the OpenSpec CLI on PATH is <found>, but this release's openspec-* skills were generated from <pinned>. Remove the "npm:@fission-ai/openspec" line from mise.toml, or any other openspec that comes before this release's on PATH.` When they match, or when either version is unknown, it SHALL NOT warn.

#### Scenario: Nix install with a different CLI on PATH
- **WHEN** `lets sync` runs from the flake's `lets` package, whose `release.json` records OpenSpec `1.2.3`, and `openspec --version` on PATH prints `1.4.0`
- **THEN** stderr holds `the OpenSpec CLI on PATH is 1.4.0, but this release's openspec-* skills were generated from 1.2.3. Pin the CLI to 1.2.3.`

#### Scenario: Tarball install with its own openspec first on PATH
- **WHEN** `lets sync` runs from the release tarball, and the first `openspec` on `PATH` is the tarball's `bin/openspec`
- **THEN** the output holds no OpenSpec CLI version warning, and `lets sync` does not run `openspec`

#### Scenario: Tarball install with a different CLI first on PATH
- **WHEN** `lets sync` runs from the release tarball, whose `release.json` records OpenSpec `1.2.3`, and the first `openspec` on `PATH` is another command, whose `openspec --version` prints `1.4.0`
- **THEN** stderr holds `the OpenSpec CLI on PATH is 1.4.0, but this release's openspec-* skills were generated from 1.2.3. Remove the "npm:@fission-ai/openspec" line from mise.toml, or any other openspec that comes before this release's on PATH.`

#### Scenario: Tarball install with an old pin at the same version
- **WHEN** `lets sync` runs from the release tarball, whose `release.json` records OpenSpec `1.2.3`, and the first `openspec` on `PATH` is another command, whose `openspec --version` prints `1.2.3`
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: The same CLI
- **WHEN** `lets sync` runs and `openspec --version` prints the version the package's `release.json` records
- **THEN** the output holds no OpenSpec CLI version warning

#### Scenario: No release.json
- **WHEN** `lets sync` runs from the source tree, which has no `release.json`
- **THEN** the output holds no OpenSpec CLI version warning
