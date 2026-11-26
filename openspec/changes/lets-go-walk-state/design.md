## Context

- `lets go records <name>` lives in `lets/src/go/records.ts` (149 lines). It finds the repository root, reads the pull request once with `gh pr view <name> --json number,body`, looks for the archive folder, and runs `git log` for each record. It already parses the **Plan review** section (`planReview`) and checks the reviewed commit with `git rev-parse`. Its help, `GO_RECORDS_HELP` in `lets/src/main.ts`, says it does not read the schema and does not decide which steps are done.
- `lets-go` runs the done tests by hand today: *Walk the step table* (`skills/lets-go/SKILL.md`, lines 796 to 917) reads the tree, the pull request and the archive folder, then runs one ordered list per row. *Read the report* (lines 1352 to 1443) runs the same reads again after each `done` report. `references/records.md` (28 lines) holds the table of fixes by hand. `SKILL.md` is 1503 lines on this branch.
- The rule for review plan is *Check an earlier review* in `skills/lets-review-plan/SKILL.md`, with the section template under *Report*. The template numbers rebuttals by finding, not by required change: in pull request #346, required change 1 is answered by rebuttal 3.
- `lets/src/io.ts` gives `readFile` (null when missing or unreadable), `exists`, `isDir`, `listDirs` and `execFile`. The `yaml` package is a dependency, but no YAML parse is needed here (decision 5).
- `tests/go/records.test.ts` runs `lets` as a program in a temporary Git repository with a stand-in `gh` from `tests/support/lets.ts`. The same `standIn` helper can put a stand-in `openspec` on `PATH`.
- ADR-021 puts a task in `lets` code when it joins several calls or decides something. The done tests do both. ADR-029 says a step skill owns its rules; decision 9 says how the code keeps to that.

## Goals / Non-Goals

**Goals:**

- One command gives `lets-go` everything the walk decides on: the records, the done answers, the disagreements and the pull request's state.
- The same answers as today's hand-run tests, except the two deliberate changes the brainstorm lists (D3, D4) and the stop order in decision 8.
- `lets-go` gets shorter: *Walk the step table* and *Read the report* lose their read commands and ordered lists.

**Non-Goals:**

- Running steps, relaying questions, or the diverged-branch check, which stay in `lets-go` (D1, D3).
- Changing `lets-review-plan`'s text (D7), or any Skip line's wording.
- Judging whether a fix's diff makes the required change (D4).
- A reason for each `false` answer. The output holds `true` or `false` (D6); the `Failed` line names the command instead (decision 8).

## Test Seams

- **Primary test seam:** `lets go records` run as a program, in `tests/go/records.test.ts`. Each test builds a temporary Git repository, puts a stand-in `gh` and a stand-in `openspec` on `PATH`, and asserts the exit code and the parsed stdout. The stand-in `openspec` answers `instructions apply` with a fixed `state`, so no test needs the real CLI.
- **Existing seams reused:** `tests/support/lets.ts` (`runLets`, `standIn`, `tempDir`); the repository builder in `tests/go/records.test.ts`, extended with an `openspec` stand-in and a way to leave a file uncommitted; the contract tests in `tests/contracts/` (`commands.test.ts`, `links.test.ts`) for `lets-go`'s new text, unchanged. One new contract test reads `lets-review-plan`'s text (decision 9).

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One command grows on patterns it already has, and its JSON contract gains keys. The new risk is the review plan answer: a wrong `true` skips a plan review, and a wrong `false` runs one again.
- **Blast radius:** `lets/src/go/`, `lets/src/main.ts` (help), `tests/go/`, one test in `tests/contracts/`, `skills/lets-go/SKILL.md` and `skills/lets-go/references/records.md`. The command still writes nothing, so a wrong answer can make `lets-go` run, skip or stop on a step, but cannot change a branch, a pull request or the backlog.

## Decisions

### 1. Read everything first, then decide in pure functions

`records.ts` keeps the command and the reads. It gathers one `Facts` object, then hands it to pure functions that work out `done` and `disagreements`. Two new files hold the logic:

- `lets/src/go/plan-review.ts`: the section parse (moved from `records.ts`), extended to the **Required changes** and **Rebuttals** lists, and review plan's done test, which needs a few `git` reads of its own (decision 4).
- `lets/src/go/walk.ts`: `done(facts)` and `disagreements(facts, done)`, with no process access.

*Alternative:* keep it all in `records.ts`. It would pass 400 lines, and the done rules would sit between `execFile` calls. Split this way, each rule reads as the spec states it.

### 2. The reads

All `git` commands run at the repository root. The command makes each read at most once.

| Fact | Read |
|---|---|
| Tree | `git status --porcelain=v1 -z`. Entries are split on NUL; a rename or copy entry's second path is skipped, except a rename's old path outside `.workspace/` when its new path is inside. A path is inside `.workspace/` when it is `.workspace/` or starts with it |
| Pull request | `gh pr view <name> --json number,body,state,isDraft`. No pull request is `null`, as today |
| Archive folders | The names in `openspec/changes/archive/` that match `^\d{4}-\d{2}-\d{2}-<name>$`, as a list. The `review-build` record still needs exactly one |
| Change folder | `io.isDir(<root>/openspec/changes/<name>)` |
| Change state | `openspec instructions apply --change <name> --json`, only when the change folder exists and the list of archive folders is empty. `state` must be a string |
| Schemas | Decision 5 |
| Committed brainstorm | `git ls-tree --name-only HEAD -- openspec/changes/<name>/brainstorm.md`: a line means committed, no output means not |
| Records | As today |

The `gh` call adds `state` and `isDraft` to its `--json` list, so the "writes nothing" scenario still sees one `pr view` call.

### 3. The output keeps the four keys and adds three

The line is built as one object literal, in the spec's key order: the four records, then `done` (an object in step order), `disagreements` (a list of `{row, found}`), and `pull-request` (`gh`'s `state`, or `null`). Row names are kebab-case like the record keys: `dirty-tree`, `change-and-archive`, `archive-not-ready`, `brainstorm-without-pull-request`, `archive-without-plan-review`, `null-record`. `found` is one string, so `lets-go` prints it as it is.

*Alternative:* `found` as a list of paths. The agent prints it either way, and one string keeps every row's entry the same shape.

### 4. Review plan's done test

`plan-review.ts` exports `reviewPlanDone(git, section, facts)`. It runs only when `openspec/changes/<name>/` exists, no archive folder exists and the schema is not `lets-minimal`, and returns `false` at the first rule that fails:

1. The `review-plan` record is `null` (no pull request, no section, no `Reviewed:` or `- **Verdict:**` line, or no such commit).
2. The verdict is neither `APPROVE` nor `APPROVE_WITH_CHANGES`.
3. `git merge-base --is-ancestor <oid> HEAD` exits 1. Exit 0 passes. Any other exit is exit 4.
4. `git log --format=%H <oid>..HEAD -- openspec/changes/<name>/ docs/decisions/` lists a commit that is not a fix. When a task is ticked, the pathspec adds `:(exclude)openspec/changes/<name>/tasks.md`, as *Check an earlier review* says. A task is ticked when a line of `tasks.md` in `HEAD`'s tree matches `/^\s*- \[x\] /`. The `build` record is not the test: a planning commit that edits `tasks.md` sets it before any task is ticked.
5. Under `APPROVE_WITH_CHANGES`: there are fewer fix items than required changes, or a fix item's commit is not in the same `git log` without the exclusion, or it changes a path outside the two folders.

The parse reads lines inside the section. An item is `/^\s*\d+\.\s/`. The **Required changes** list starts after the line that starts `- **Required changes:**` and ends at the next line that starts `- **`, or at the end of the section. **Rebuttals** works the same way. A fix item matches `/^\s*\d+\.\s+Fixed in ([0-9a-f]{4,40}):/`. `git rev-parse --verify --quiet --end-of-options <hex>^{commit}` turns its hash into a full one; a hash git cannot find names no commit, so the item fails rule 5 under `APPROVE_WITH_CHANGES`.

The paths a commit changes come from `git diff --name-only --no-renames <oid>^ <oid>`. With `--no-renames`, a move lists both the old and the new path, so a move out of the plan folders fails. A fix is never a root commit; if `<oid>^` does not resolve, the commit is not a fix.

*Alternative:* match each required change to a rebuttal by number. Rejected in the brainstorm (D4): the template numbers rebuttals by finding.

### 5. Schemas are read from their `schema:` lines

The change's schema is the first line that matches `/^schema:\s*(\S+)/` in `openspec/changes/<name>/.openspec.yaml`, then in the archive folder's `.openspec.yaml` (the first archive folder by name, when there are several). The flow's schema is the same line of `openspec/config.yaml`. A missing file gives no schema. A file that exists but `io.readFile` returns `null` for is exit 4, naming the file. This matches how `lets-go`'s *Enter the branch* reads the line, and does not fail on YAML that OpenSpec itself accepts.

*Alternative:* parse with `yaml`. It would turn a stray character elsewhere in the file into exit 4, which today's hand read does not.

### 6. Failed reads

`openspec` runs through the same `runner` as `git`, so a start failure, a timeout or a non-zero exit is exit 4 with `lets go: openspec instructions: <error>`. Output that is not JSON with a string `state` is exit 4. A state outside `blocked`, `ready` and `all_done` is exit 4 with `lets go: openspec instructions apply: the change state is <state>: <instruction>`, the instruction on one line. `lets-go` shows stderr and stops on any non-zero exit, so it needs no new branch for this.

### 7. The help

`GO_RECORDS_HELP` drops "does not read the change's schema" and "does not decide which steps are done". It adds the three keys, the six row names with one line each on when they match, and one sentence that review plan's answer applies *Check an earlier review* in the `lets-review-plan` skill, mechanically, without reading a fix's diff. The `lets go` group's summary stays "settings and records for the lets-go skill".

### 8. `lets-go`'s walk

*Walk the step table* becomes:

1. Run `lets go records <name>`. On a non-zero exit, show stderr and stop.
2. On `pull-request` `MERGED` or `CLOSED`, stop as today.
3. On a non-empty `disagreements`, stop as [Records that disagree](references/records.md#records-that-disagree) says.
4. Walk the rows. Each row reads `done` from the latest output. **Done** fills the Skip line from the latest output, and runs nothing. **Not done** runs the step.

*Read the report*'s `done` bullet runs the command again and applies steps 1 to 3, then reads the row's answer. A `false` answer fails the step with `the step reported done, but lets go records <name> says it is not done`.

The pull request's state is checked before the disagreements. Today a dirty tree on a merged branch said "Records disagree"; now it says the change is merged. Nothing is left to fix on a finished change, so the merged stop is the more useful one.

`references/records.md` keeps its heading and its rule. Its table gains a first column, *Row*, with each row's name, and the diverged-branch row says *Enter the branch* finds it. Each other row maps to one row name: the archive row with the pull request is `archive-not-ready`, and the archive row with no **Plan review** section is `archive-without-plan-review`.

The review plan row keeps one sentence that names *Check an earlier review* in italics, so the *lets-go links each section it names* scenario still holds, and so a reader knows where the rule is written.

### 9. A contract test ties the code to the skill's text

ADR-029 says the step skill owns its rules. The code is now a second reader of *Check an earlier review*, so a change to that text could leave the code behind. A new test in `tests/contracts/` reads `skills/lets-review-plan/SKILL.md` and checks that it still holds each string the code depends on: `## Plan review`, `Reviewed: `, `- **Verdict:** `, `- **Required changes:**`, `- **Rebuttals:**`, `Fixed in <commit>`, `git merge-base --is-ancestor <sha> HEAD`, `git log --oneline <sha>..HEAD -- openspec/changes/<name>/ docs/decisions/` and `':(exclude)openspec/changes/<name>/tasks.md'`. A reworded rule then fails a test instead of drifting. The test collapses whitespace before it compares, so a line wrap in the skill does not fail it. The ADR step records this choice.

## Risks / Trade-offs

- [A fix item written another way, such as `Fixed in abc123 and def456:`, is not counted, so review plan reruns] → The template gives `Fixed in <commit>: <what changed>`. A rerun costs a review round, not a wrong skip. The contract test keeps the template's form.
- [Rule 4's `git log` lists other changes' plan commits brought in by a merge of the default branch] → Same as today's hand-run rule. Review plan reruns, which is safe. Not fixed here.
- [The code and *Check an earlier review* drift apart] → Decision 9's contract test, and the help's citation of the rule.
- [The command does more reads, so a run is slower] → At most one `openspec` call and a handful of `git` calls, all local. `lets-go` now runs the command once before the walk and once per step, instead of once per skipped row.
- [A `false` answer gives no reason, so a failed `done` check says less than today] → The user can run `lets go records <name>` and read the records. A reason field can be added later without breaking the contract.

## Migration & Rollback

N/A. The JSON only gains keys, so `lets-go` at the last release keeps working with the new command. Rolling back is reverting the commits. The repository's own `lets-go` copy comes from the pinned release and changes only at the next release.
