<!-- Build order follows skills/lets-verify-contracts/SKILL.md, not
     test-first (D8): the file's contracts first, then the black-box
     journeys through `lets` run as a program. `lets` does not change
     (D5), so no task writes code under `lets/`. Every task in sections
     2 and 3 grows one of the two tests in one file, so the tasks run in
     order. Each journey step checks its exit code, with the command's
     output in the message, before the next step runs. -->

## 1. Contracts

- [ ] 1.1 [easy] `tests/journey/journeys.test.ts` opens with a comment saying what a journey test is (D1) and that it checks the joins between commands, not each command. It imports the fixtures design decision 2 names, from `tests/sync/project.ts`, `tests/backlog/github.ts`, `tests/delegate/repo.ts` and `tests/delegate/steps.ts`, and declares its own helpers, such as one that reads the one JSON line of a result and one that turns an item's `title` into a session name (the text before ` — `), each with a doc comment on what it needs, what it gives and how it fails. Each body throws `not built yet` (verify: `pnpm check`)

## 2. The story journey [depends-on: 1]

- [ ] 2.1 [medium] In one `delegateRepo` with the user config `version: 3\ndelegate: { resolvers: [cli] }\n` and a stand-in `openspec` that answers `--version` with `1.3.0`, `lets sync` with `WORKFLOW_RELEASE` set to `useRelease()`'s release exits 0, then `lets sync --check` exits 0. If `lets sync` needs a program other than `git` and `openspec` on `PATH`, the test links it with `pathWith`, and the Deviations Ledger names it (verify: `node --test tests/journey/journeys.test.ts`)
- [ ] 2.2 [medium] With the stand-in `gh` of design decision 3, `lets backlog ready` lists 149 first; `lets backlog item` on that key prints the title `story-149 — outcome`; `lets backlog claim` on the key `item` printed returns `claimed` with a token. The stand-in issue then has `assignees` `['octocat']`, `status` `['In Progress']` and one claim comment holding that token (verify: `node --test tests/journey/journeys.test.ts`)
- [ ] 2.3 [medium] With stand-in `codex` listing `gpt-6-luna`, `agy` listing `gemini-3.8-flash-high` and a `claude`, `lets delegate step instructions --for plan` prints `options`, and `lets delegate step run --for plan --name story-149-plan --prompt-file p.md --effort high` with one `--model` per option, in order, prints a report whose `outcome` is `done`, and a record line naming the family `gemini`. `codex` and `claude` refused, by exiting 1 having printed nothing, and each of the three CLIs got one write-mode call with its listed model, as design decision 3 says (verify: `node --test tests/journey/journeys.test.ts`)

## 3. The epic-wave journey [depends-on: 2]

- [ ] 3.1 [medium] In a second `delegateRepo`, with the stand-in `gh` of design decision 4, `lets backlog item 52` prints the open sub-issues 53, 54 and 55, and `lets backlog waves --only` with those keys, joined by commas in that order, prints a first wave of 53 and 54 (verify: `node --test tests/journey/journeys.test.ts`)
- [ ] 3.2 [complex] `lets delegate step start --for story --model gpt` for each story of the first wave, named from its `title` with `-story` added, prints a name and a pid, and the test calls `cleanUpStep(t, pid)` before any assertion. `lets delegate step wait`, run again with the names still running until none is, names each started step once with exit 0. Each story's report file then holds a `done` report whose evidence names that story, and `untilGone(pid)` resolves for each pid (verify: `node --test tests/journey/journeys.test.ts`)

## 4. Integration [depends-on: 3]

- [ ] 4.1 [easy] The `tests/` row of the README's *Development* table says that `journey/` holds tests that run several `lets` commands in sequence, as `lets-go` does, and feed each one what the last one printed (verify: `git grep -n 'journey/' README.md`)
- [ ] 4.2 [medium] Every check passes: `pnpm test`, `mise run check`, and `nix flake check`, whose `node-tests` check runs the new file in the Nix sandbox. No step process is left running after the journey file ends (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
