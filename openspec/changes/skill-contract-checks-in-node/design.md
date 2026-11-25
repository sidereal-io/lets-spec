## Context

- `tests/skill-interfaces.bats` holds 512 tests. About 30 of them check a
  name or a link: the `gh` commands, the schema templates, the skills a
  schema or config names, the `lets delegate` subcommands, and the links
  of `lets-go` and of the reference inputs, in the source and in each
  published flow. The rest check phrases and form, which #312 deletes.
  #312 must name the Node test that replaces each name or link test
  before it deletes the file, so this design maps them (see
  [The bats tests this change replaces](#the-bats-tests-this-change-replaces)).
- `tests/support/lets.ts` is the helper module of #308 (from #309). It
  already has `runLets`, `tempDir`, `buildRelease` and `repo`. Later
  stories extend it and never copy it.
- `lets` builds its commands with commander. `lets <command> --help`
  prints a `Commands:` list and an `Options:` list for each command and
  subcommand. A probe of the 48 texts found about 210 mentions of a
  `lets` command, all of which walk that tree, except `--` (the end of
  options) and `lets delegate step --for` in
  `skills/lets-go/references/terms.md`, which names a flag of the
  `step` subcommands.
- A probe of the links found two real problems: `README.md` links the
  deleted `docs/upgrading.md`, and the README's emoji headings need
  GitHub's own anchor rule to resolve. `overlays/AGENTS.md` and each
  `schema.yaml` link `.agents/skills/...`, which exists only in a
  published flow, relative to the project's root.
- A published flow is a release built by `buildRelease`: its skills in
  `overlay/.agents/skills/`, its schemas in `overlay/openspec/schemas/`,
  its rules block in `fragments/AGENTS.md`, and its config in
  `init/openspec/config.yaml`.
- The flake's `node-tests` check has no `gh`, and no OpenSpec CLI. The
  `yaml` package is a dependency of `lets`, not of the tests.

## Goals / Non-Goals

**Goals:**

- One Node test per check, each over every text it applies to, with
  findings that name the file and the broken name.
- Each check reads its expected names from the code, the release or the
  real `gh`, never from a list typed into the test (D2).
- Each check is shown to fail, on a small text written for the test
  (D14).
- Each text is read once per test file, so the checks stay fast.

**Non-Goals:**

- Checking a flag that a text names on its own, such as `` `--only` ``,
  away from its command. No rule can tell which command it belongs to.
- Checking `gh` flags, or the `openspec-*` skills OpenSpec generates.
  The tests have no list of the generated skills, as the bats tests had
  none.
- Checking which skills a text links for each section it names, or for
  each glossary term: these are form (D5).
- Testing the bats helper functions again (D10).

## Test Seams

- **Primary test seam:** the texts as files on disk, read by the check
  functions in `tests/contracts/`. The real texts are checked in the
  source tree and inside each release `buildRelease` builds. The same
  functions run on a small folder of texts written in `tempDir` to show
  each check fails.
- **Existing seams reused:** `runLets` for `lets <command> --help`,
  `buildRelease` and `tempDir` from `tests/support/lets.ts`, and the real
  `gh` program for `gh <group> <command> --help`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. No product code changes, but #312 relies on these
  checks to delete the bats file, so a gap in them goes unseen.
- **Blast radius:** new files in `tests/contracts/` and one export in
  `tests/support/lets.ts`; the `node-tests` check in `flake.nix`; and
  any text with a broken name.

## Decisions

### Layout

- `tests/support/lets.ts` gains `letsCommandTree()`. It runs
  `lets --help`, then `lets <path> --help` for each command it lists,
  and returns each command path with its subcommands and options. It
  leaves out commander's built-in `help [command]`, which every command
  with subcommands lists: `lets help --help` prints the root's help
  again, so following it would loop. It belongs with `runLets`, because
  a later story can use it too.
- `tests/contracts/texts.ts` reads the texts and is not a test file.
  It lists the texts (D1), and for each it gives the prose (outside
  fenced code and code spans), the code spans, the fenced code lines,
  the headings and their anchors. It reads each file once. Each check
  function takes a folder, so a test can point it at a folder of its
  own.
- One test file per check: `tests/contracts/commands.test.ts`,
  `links.test.ts`, `skills.test.ts`, `templates.test.ts` and
  `gh.test.ts`. Each holds the
  test over the real texts first, then the tests on small texts.

Alternative: put the text readers in `tests/support/`. Rejected: only
the contract checks read texts, and #328 extends them in the same
folder.

### Commands and flags

- A mention is a code span that starts with `lets `, or a fenced code
  line where `lets ` starts the line or follows `$ `, `$(`, `&&`, `|` or
  `;`. The mention ends at the end of the span or at a shell operator.
  In a span or a line, each later `lets ` after `&&`, `|` or `;` starts
  another mention.
- The check walks the words after `lets` through the tree: each word
  that is a subcommand of the current command goes one level down. The
  first word that is not a subcommand ends the walk. That word is a
  finding when the current command has subcommands and the word looks
  like one: lower case letters and hyphens. Placeholders such as `<i>`
  and arguments such as `149` are not.
- A walk that ends on a command with subcommands is a finding, unless
  that command is directly under `lets`. So `` `lets delegate` `` and
  `` `lets backlog` `` name a family of commands and pass, but
  `` `lets delegate review` `` and `lets delegate review --for plan`
  name no command that runs, and are findings, as in bats tests 257 and
  262. `skills/lets-go/references/terms.md` is exempt from this rule, as
  the bats test exempts it: it copies the glossary, which names the step
  intents as `lets delegate step --for` takes them.
- Each later word that starts with `-` is a flag. It is a finding unless
  it is an option of the current command or, in the glossary copy only,
  of one of its subcommands. This rule passes
  `lets delegate step --for` in the glossary copy, which names the
  `--for` of the step subcommands. Elsewhere, `lets backlog --only 3`
  is a finding, as `lets` rejects it. `--` always passes, and ends the
  flags: a word after it is an argument. A value after `=` is not read.

Alternative: export the command table from `lets`. Rejected by the
user's answer (D12): `lets` does not change (D3).

### Links and sections

- A link is `](<target>)` in the prose. A target with a URL scheme is
  skipped, and so is a target that holds a placeholder, such as
  `discovery/<product>.md`: it names a file the agent writes.
- A target resolves when its path is a file and its `#anchor`, if any,
  is one of that file's headings. A target with only an anchor names a
  heading of its own file.
- Anchors follow GitHub's rule, as the `github-slugger` package does:
  lower case, drop every character that is not a letter, mark, number,
  connector, space or hyphen, then turn each space into a hyphen. A
  second heading with the same anchor gets `-1`, the third `-2`. The
  marks keep the variation selector in `## ⚙️ Usage`, whose anchor is
  `#️-usage`.
- **In the source tree:** the links of each skill's `SKILL.md` and
  reference files must stay inside `skills/`, since the skill is
  installed without the rest of the repository. The links of
  `README.md` and `docs/*.md` resolve in the repository.
- **In each published flow:** one release per flow, built once by
  `buildRelease` with the flow's schemas and skills from `flows.json`.
  Each installed skill's files, templates included, resolve from their
  own folder. Each `schema.yaml` and `fragments/AGENTS.md` resolve from
  the overlay's root, as an agent reads them in the project. Every
  target must stay inside the overlay, compared by real path, so a
  symlinked temporary folder does not break it.
- `schema.yaml` is read as text, not parsed. A link in an instruction
  is the same string in the file as in the CLI's output, so the check
  needs neither the `yaml` package nor the OpenSpec CLI.

### Skills and files

- A skill a text names is `` `<name>` skill ``, across a line break,
  and not followed by `s`, so "the `ignored` skills mode" is no
  mention.
- Each name is a folder of `skills/`, or an `openspec-*` name.
- Each skill that a flow's schemas or config name is one `flows.json`
  ships with that flow, as the bats test does (D7).
- Each skill a flow ships is named by its schemas, its config or
  another of its shipped skills, unless it is an entry point. A skill
  that names itself is not reached by that. The entry points are
  the skills the routing table in `overlays/AGENTS.md` names, read from
  the text, not a typed list.
- Each skill's `SKILL.md` has `name:` equal to its folder.
- Each `openspec/schemas/<schema>/templates/<file>.md` that a text names
  is a file in `schemas/`.

### `gh` commands

- A mention is `gh <group> <command>` at the start of a fenced code line
  or of a code span, as the bats test reads it.
- `gh <group> <command> --help` must print a usage line that starts
  with `gh <group> <command>`, because `gh` answers an unknown command
  with its group's help and exits 0. For `gh api`, the endpoint must be
  one `gh api --help` shows in an example, such as `graphql`.
- The test fails, with a message that says so, when `gh` is not on
  `PATH`. The flake's `node-tests` check adds `pkgs.gh`; the dev tools
  already pin `gh` in `mise.toml`.

### Showing each check fails

Each check has at least one test on a small folder in `tempDir`, with
one broken name, that expects exactly one finding naming that file and
that name (D14). The link check also has a passing case for each skip
rule: a URL, a placeholder and an emoji heading.

### The bats tests this change replaces

| Bats test (line) | Node test |
|---|---|
| each skill is named for its folder (18) | `skills.test.ts` |
| each gh command the prose names is one gh knows (30) | `gh.test.ts` |
| each schema template the prose names exists (46) | `templates.test.ts` |
| each skill a flow ships, other than an entry point, is named by … (77) | `skills.test.ts` |
| each skill a schema or config names is one its flow ships … (128) | `skills.test.ts` |
| each lets delegate review, handoff or step the prose names … (257) | `commands.test.ts` |
| the docs name lets delegate review, handoff or step only … (262) | `commands.test.ts` |
| the link check … (10 tests, 1559 to 1747) | `links.test.ts`, small texts |
| each link in lets-go names one of its file's headings (2271) | `links.test.ts`, source |
| shaping loads its installed domain-language reference (3161) | `links.test.ts`, source and published |
| lets-go's links resolve inside the source skills (3182) | `links.test.ts`, source |
| writing reference inputs resolve inside each published flow (3511) | `links.test.ts`, published |
| lets-go's links resolve in each published flow (3553) | `links.test.ts`, published |
| review vocabulary inputs resolve in the published standard flow (3563) | `links.test.ts`, published |
| installed reference containment accepts a symlinked root (3571) | real paths in `links.test.ts` |

Not replaced, and left to #312, because they check typed names, a fixed
string or form rather than whether a name resolves: the tests that a
flow ships a named skill (94, 655, 3129, 3692), the `Confirmed by user:`
marker (141), and the tests that a skill links a given file or a section
it names (such as 3166 to 3174 and 2327 to 2359).

## Risks / Trade-offs

- [A mention rule misses a way a text names a command] → The rules read
  every code span and every fenced code line, which is how the texts
  write commands today. A command named in plain prose, outside code, is
  not read; review catches it.
- [GitHub changes its anchor rule] → The rule is written once, in
  `texts.ts`, with a test of the emoji heading.
- [Reading `--help` for about 25 commands is slow] → They run in
  parallel, once per test file.
- [The `gh` in nixpkgs knows other commands than the pinned `gh`] →
  Both are recent; the texts name long-standing commands. A failure
  names the command, so a difference is easy to see.
- [A new check finds a broken name in a text the user wrote with a
  meaning in mind] → Fix only the name, and keep the meaning (D9).

## Migration & Rollback

N/A. The change adds tests and fixes names in texts. Reverting its
commits removes them; the bats tests keep running until #312.
