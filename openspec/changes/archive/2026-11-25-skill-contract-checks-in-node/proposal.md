## Why

Agents act on what the skills, schemas and documents say. A `lets`
command that does not exist, a link to a heading that is gone or a skill
the flow does not ship sends an agent the wrong way, and no reviewer
reliably sees it. Today `tests/skill-interfaces.bats` checks some of
these names, against lists typed into the test. The epic #308 removes
bats, so these checks must run in Node, reading the names they expect
from the code, before #312 can delete the bats file.

## What Changes

- **New Node contract checks** over every text an agent reads: each
  skill's `SKILL.md` and reference files, each schema's `schema.yaml`
  and templates, `overlays/AGENTS.md`, `README.md` and `docs/*.md`
  (D1). Each check reads the names it expects from the code, never from
  a typed list (D2):
  - **Commands and flags:** each `lets` command and flag a text names is
    one that `lets <command> --help` lists (D12).
  - **Links, skills, files and sections:** each link resolves to a file,
    and its anchor to a heading. Each skill a text names is one its flow
    ships, by `flows.json`. Links are also checked inside each published
    flow, where a flow leaves some skills out (D7).
  - **`gh` commands:** each `gh` command a text names is one that
    `gh --help` knows (D8).
- **Each check is seen to fail once.** A test runs it on a small text
  written for the test, with one broken name, and expects the finding to
  name that file and that name (D14).
- **The helper module in `tests/support/` grows** with what these checks
  share, such as reading the texts and the help of `lets`. Nothing is
  copied from it.
- **The flake's `node-tests` check gets `gh` on `PATH`** (D8).
- **Texts are fixed** where a new check finds a broken name (D9).

Out of scope: the check that a text's JSON fields and result values exist,
which moved to #328 (D13); deleting any bats test, which is #312's (D4);
schema loading in the OpenSpec CLI, which is #310's (D6); fixed sentences
and form (D5); and the bats file's tests of its own helpers (D10).

`lets` does not change (D3), and no spec requirement changes. The change
sets `skip_specs: true`.

## Capabilities

### New Capabilities

None. This change adds tests of the texts lets-spec ships, and adds no
behavior.

### Modified Capabilities

None. A text fixed because a check found a broken name keeps its
meaning; only the name is corrected (D9).

## Impact

- **Tests:** new `*.test.ts` files under `tests/`, and new exports in
  `tests/support/`. `pnpm test` already runs every `tests/**/*.test.ts`
  file, so its command does not change. The bats files stay and keep
  running (D4).
- **Checks:** `flake.nix` adds `gh` to the `node-tests` check.
- **Texts:** any skill, schema, `overlays/AGENTS.md`, `README.md` or
  `docs/` file that names a command, flag, link, skill, file, section or
  `gh` command that does not exist.
- **Unchanged:** `lets` and its own tests, `flows.json`,
  `tests/skill-interfaces.bats` and `openspec/glossary.md`.
