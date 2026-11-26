<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- No `.bats` file is left in `tests/`. `package.json`'s `test` script
  is already `node --test "tests/**/*.test.ts" && tsc --noEmit` (D1).
- bats is still installed in three places: the `bats = "1.14.0"` pin in
  `mise.toml`, `pkgs.bats` in the `nativeBuildInputs` of the flake's
  `commands` check, and `pkgs.bats` in the flake's dev shell
  `packages`. `mise.toml` also pins `jq` and `yq`, and the dev shell
  also has `pkgs.jq` and `pkgs.yq-go`.
- Outside the flake's checks, nothing installed by mise or the dev shell
  runs `jq` or `yq`. The `commands` check's smoke test runs both, and
  takes them from its own `nativeBuildInputs`. `release.yml` runs the
  runner's own `jq`, without mise. The `mise-check` and `mise-smoke`
  jobs in `ci.yml` use neither.
- `tests/support/common.bash` and `tests/support/release.bash` are the
  old bats helpers. No file loads them (D2). Their Node replacement is
  `tests/support/lets.ts`, from #308's *Shared decisions*.
- Text that names bats or its helpers: the README's *Development*
  section (the tools sentence and two rows of the *Testing* commands
  table), the *Checks* block of `AGENTS.md`, the comment above the
  `commands` check in `flake.nix`, the comment on the *Flake check*
  step in `.github/workflows/ci.yml` (D7), and the `build` comment in
  `tests/release/build.test.ts`, which names `release.bash` (D8).
- `CLAUDE.md` is a symbolic link to `AGENTS.md`. The block between the
  lets-spec markers in `AGENTS.md` belongs to `lets sync`.
- `tests/contracts/` checks that each `lets` command the README names is
  real. The new wording names no `lets` command, so it adds nothing to
  check.

## Goals / Non-Goals

**Goals:**

- After the change, `mise install` and `nix develop` give the same
  tools: Node 26, pnpm, `gh` (mise only, as today) and the OpenSpec CLI.
- Each edited sentence describes what is there now. None says that
  bats was there once.

**Non-Goals:**

- No new test or check. The story's acceptance is the three project
  checks and one `git grep` (D11).
- No change to the smoke test in the `commands` check, to the
  `node-tests` check (D6), to `lets` (D13), to specs (D9), or to
  archived changes and decision records (D10).
- No other tidy-up of the README or the flake.

## Test Seams

- **Primary test seam:** the project's three checks, unchanged:
  `pnpm test`, `nix flake check` and `mise run check`. They prove that
  nothing still needs bats, `jq` or `yq` from the tools this change
  removes, and that every Node test still runs.
- **Existing seams reused:** `git grep -il bats` as the acceptance
  search (D11). `tests/contracts/` runs inside `pnpm test` and checks
  the README's links and `lets` commands after the rewording.

## Scrutiny Tier & Blast Radius

- **Tier:** low. The change removes unused tools, two unused files and
  some words. It adds no behavior and no contract.
- **Blast radius:** the developer tools (`mise.toml`, the flake's dev
  shell), one input of the flake's `commands` check, and the developer
  documents. A missing tool shows up as a failed check, not in a
  project that uses Let's Spec.

## Decisions

### 1. Remove `jq` and `yq` from both tool lists, but not from the smoke test

`mise.toml` drops `jq` and `yq` with `bats` (D3), and the dev shell
drops `pkgs.jq` and `pkgs.yq-go` with `pkgs.bats` (D5). The `commands`
check keeps `pkgs.jq` and `pkgs.yq-go` in its `nativeBuildInputs`,
because its smoke test runs both (D4).

- Alternative: keep `jq` and `yq` in the dev shell as handy tools.
  Rejected: then the README would need two lists, one per tool manager,
  and the tools would be pinned for nobody's use.

### 2. The README's tools sentence lists what both managers give

The sentence becomes: Node 26, pnpm and the OpenSpec CLI. `gh` stays
out of the sentence, as today: the flake's dev shell does not give it.

### 3. The commands table loses the `bats tests` row

The `pnpm test` row becomes "The Node tests and the type check". The
`bats tests` row goes. The other rows stay as they are.

### 4. `AGENTS.md` changes only above the lets-spec markers

The comment on `pnpm test` in the *Checks* block becomes "the Node
tests, then the type check", which is the order the script runs them.
`CLAUDE.md` follows, because it is a link.

### 5. Comments say what runs, without history

- `flake.nix`: the comment above the `commands` check drops its first
  sentence ("No bats file is left …"). The rest, which describes the
  smoke test, stays.
- `ci.yml`: the *Flake check* comment says "Runs the Node tests" in
  place of "Runs the bats and Node tests".
- `tests/release/build.test.ts`: the `build` comment says "as the flake
  does" in place of "as release.bash's `build` does".
  `tests/support/release.bash` itself opens with "as the flake does",
  so the meaning stays (D8).

### 6. One commit for the whole change

The tool removals, the file deletions and the rewording are one unit:
"bats is gone". Split, an intermediate commit would leave a document
naming a tool that is no longer installed, or the other way round. The
commit is `chore:`, because no behavior of Let's Spec changes.

No decision here is costly to reverse: putting a tool pin back is one
line.

## Risks / Trade-offs

- [A developer's own script uses the `jq` or `yq` that the dev shell or
  mise installed] → Both are common tools, often installed already. The
  pull request description says they left the tool lists.
- [`nix flake check` needs `bats` somewhere the search missed] → The
  check runs in CI and before push. A missing tool fails it with a
  "command not found" that names the tool.
- [The search for bats misses a mention written another way, such as
  `release.bash`] → Decision 5 covers the one known case. The
  implementer also searches for `common.bash` and `release.bash`.

## Migration & Rollback

N/A. To undo, revert the commit: it restores the pins, the helpers and
the wording.
