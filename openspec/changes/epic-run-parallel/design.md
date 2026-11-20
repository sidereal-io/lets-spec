<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- The epic run lives in `skills/lets-go/references/epic-run.md`. *Run the
  epic* picks one story, claims it, enters its branch in the epic run's
  own checkout, and runs *Start the story run*, which blocks on
  `lets delegate step run --for story` for up to 600 minutes. It then
  settles the story, runs `git switch <default>`, and picks again.
  *A stop in an epic run* ends the whole epic run when the checkout has
  uncommitted changes, because the next story would start on top of them.
- *Enter the branch* and *Claim* in `skills/lets-go/SKILL.md` create or
  switch to the branch with `git switch`. *Import the glossary
  checkpoint*, the schema read and the fast-forward all run in the
  current checkout.
- `lets delegate step run` (`lets/src/delegate/step.ts`) runs the session
  with `repoRoot(deps.cwd)` as its working directory. Both resolvers that
  start sessions already work from a linked worktree: `cli` runs the
  agent CLI in `cwd`, and `t3` launches its thread with
  `existing_worktree` when `cwd` is not the main checkout
  (`lets/src/resolvers/t3/t3.ts`, `launchThread`). `subagent` saves the
  prompt and exits 3.
- `lets` has no way to run a command in the background. `Io.execFile`
  waits for the process. `lets/src/main.ts` calls `process.exit()` once a
  command has answered.
- The epic run keeps its state in scratch files under
  `.workspace/lets-go/`, such as `epic-<parent>-lines.txt` and
  `epic-<parent>-waves.json`, so it survives a long session.
- This repository sets `LETS_SPEC_SKILLS=ignored`: git ignores
  `.agents/skills/lets-*` and `openspec/schemas/lets-*`, so a fresh
  worktree has no `lets-go` skill and no lets schemas until `lets sync`
  writes them. `lets sync` copies from the release `lets` ships, with no
  network.
- ADR-021 puts a command that joins several reads, or runs processes, in
  `lets` code rather than in the skill's prose. ADR-027 says the child
  "can later run the same way, each in its own checkout".

## Goals / Non-Goals

**Goals:**

- Run the stories of one wave at the same time, with no change to how a
  child walks its steps.
- Keep `lets delegate step run` unchanged for every caller: the new
  commands wrap it.
- Keep the background machinery in `lets`, testable with the existing
  fake `Io`, and the skill's part to running commands and acting on
  their output.

**Non-Goals:**

- No limit on how many children run at once (D6).
- No start of a later wave before the current wave is settled (D1).
- No setup of a worktree beyond `lets sync` (D5): no dependency install,
  no env files.
- No change to the resolvers.

## Test Seams

- **Primary test seam:** the `run` functions of a new module,
  `lets/src/delegate/background.ts`, driven through
  `tests/lets/delegate/fixtures/command-deps.ts`, in a new
  `tests/lets/delegate/background.test.ts`. The fake `Io` records the
  detached spawn and holds the run files in memory, and a fake clock and
  `sleep` drive the wait. Each `delegate-step` scenario is one test.
- **Existing seams reused:**
  - `tests/lets/delegate/cli.test.ts`, which runs the real `lets/bin/lets`
    in a temporary git repository, for one end-to-end test: with only
    the `subagent` resolver, `step start` returns at once, and
    `step wait` names the step with exit 3. This proves the detached
    process, the exit file and the help text with no model.
  - `tests/lets/delegate/step.test.ts` for the hidden `--exit-file`
    option of `step run`.
  - `tests/skill-interfaces.bats` for the skill's text, as #279 to #285
    did. Each `lets-go` scenario that names a command, a line or a
    section becomes an assertion there.

## Scrutiny Tier & Blast Radius

- **Tier:** high
- **Blast radius:** two new `lets delegate step` commands, a hidden
  option on `step run`, and two new `Io` methods that start and check
  processes; the epic run's whole loop in `references/epic-run.md`;
  *Enter the branch* and *Claim* in `SKILL.md` in an epic run; and the
  story prompt. Runs that are not epic runs do not change: outside an
  epic run, `lets-go` still uses `git switch` and blocks on
  `step run`.

## Decisions

### D-A. `step start` runs a detached copy of `lets delegate step run`

`step start` checks its options, resolves every path against its
working directory, and writes a run record to
`.workspace/lets-delegate/<name>.run.json` in its repository root:
`{ name, pid, checkout, reportFile, metaFile, exitFile, startedAt }`. It
then starts a detached process: the same Node binary and `lets` entry
that is running (`process.execPath`, `process.execArgv` and
`process.argv[1]`), with the arguments of `delegate step run` and the
same options, plus `--exit-file .workspace/lets-delegate/<name>.exit.json`.
The process runs with the checkout's root as its working directory, its
stdout opened on the report file and its stderr on the meta file. Then
`step start` prints `{"name","pid"}` and exits.

- Alternative: the agent host's own background commands. Rejected by
  D7: it works only on hosts that have them.
- Alternative: a long-lived `lets` daemon that runs every child.
  Rejected: a second process to keep alive and talk to, for nothing the
  files do not give.
- Alternative: `sh -c 'lets ...; echo $? > exit'`. Rejected: it needs a
  POSIX shell and quoting of every argument.

### D-B. `step run --exit-file` records how the step ended

A hidden option of `step run`, not in its help. After the command's
exit code is known, including a usage error that `guarded` turned into
2, `main.ts` writes `{ "exit": <code>, "endedAt": <ms> }` to the file,
then exits. A process that dies before that, such as one killed by a
signal, leaves no exit file: `step wait` finds its `pid` gone and counts
exit 4, as the spec says. `endedAt` lets `step wait` name the step that
ended first.

- Alternative: a hidden `step run-background` command. Rejected: a whole
  second command that differs from `step run` by one write.

### D-C. `step wait` polls the run files

`step wait` reads each named run record, then checks, every 2 seconds,
for each name: an exit file, or a `pid` that is gone. When one or more
have ended, it names the one with the earliest `endedAt`; a dead process
counts as ended when it was found dead. The check uses two new `Io`
methods, `spawnDetached` and `isAlive(pid)` (`process.kill(pid, 0)`), and
`sleep`, which the resolver `Io` already has and the command `Io` gains.
With `--timeout-minutes`, it stops at the deadline with exit 6. With
none, it waits for as long as it takes: every child has its own time
limit, so it ends.

- Alternative: `step wait` prints the report itself. Rejected: the
  report file already holds `step run`'s stdout, and the skill reads it
  as it reads it today.

### D-D. Every story runs in a worktree under `.workspace/lets-go/worktrees/`

In an epic run, *Claim* creates the branch and its worktree in one
command, `git worktree add -b <name> <path> <default>`, or
`git worktree add --no-track -b <name> <path> origin/<blocker-branch>`
for a stacked story. For a story whose branch exists, *Enter the branch*
first runs `git worktree list --porcelain`, reuses a clean worktree
that has the branch checked out (D11), or runs
`git worktree add <path> <name>`, which also creates a local branch from
`origin/<name>` when only `origin` has it. Every later command on the
story's branch runs with `git -C <path>`, or with `<path>` as its
working directory for a command that has no `-C`, such as `lets sync`
and `lets delegate step run` in the walk this session does on exit 3.

The epic run's checkout never leaves the default branch, so the
`git switch <default>` after each story, and the uncommitted-changes
check that ended the epic run, both go away (D3, D9).

- Alternative: worktrees only for waves of two or more. Rejected by D3:
  two ways of running.

### D-E. The epic run removes only the worktrees it created

`git worktree remove <path>` runs, with no `--force`, only for a path
under `.workspace/lets-go/worktrees/`. A worktree the epic run reused
from elsewhere was made by the user, and stays. Without `--force`, Git
refuses a worktree with untracked or modified files, so nothing that is
not committed is ever deleted: the story's line says the worktree was
kept (D9).

### D-F. `lets sync` runs when the epic run's checkout ignores the skills

The epic run runs `git check-ignore -q .agents/skills/lets-go` once, in
its own checkout. Exit 0 means the project ignores its skills, so each
new worktree gets `lets sync`, run from the worktree with the epic run's
environment, which carries `LETS_SPEC_SKILLS` and `LETS_SPEC_FLOW`. A
reused worktree gets it too: it is cheap, and it brings an old worktree
up to the epic run's release.

### D-G. The skill's loop: start the wave, then wait

*Run the epic* becomes two phases per wave:

1. **Start.** Pick, check, route, enter the branch, set the mode and
   start the child, then pick again, until the pick returns
   `nothing-ready`. Each started story goes in `--exclude` for the next
   pick, because a claimed story is assigned and in progress.
2. **Wait.** Run `lets delegate step wait` with the name of every child
   that runs, act on the one it names, and repeat while one runs. A
   `needs-input` report is relayed whole, then that child starts again
   and rejoins the wait. A child that exits 3 is kept for a walk in this
   session once no child runs.

The relay is one report at a time without any queue: the epic run acts
on one wait result at a time, and children that end meanwhile are named
by later waits, in the order they ended (D8, D-C).

The children that run, and those kept for a walk, are listed in
`.workspace/lets-go/epic-<parent>-children.txt`, one line per story,
`<i> <name> running` or `<i> <name> walk`, so the loop survives a long
session as the lines file does.

### D-H. A stop between stories waits for the running children

A `lets backlog` error in a pick, or in the dependents read, still ends
the epic run. With children running, the epic run starts no other
story, waits for each child and settles it, then stops. Ending at once
would leave children running with nobody to answer their questions or
read their reports. When `step wait` itself fails, the epic run cannot
wait, so it ends at once and names each child that still runs and its
worktree.

### D-I. The child's files live in its worktree

The child runs with the worktree as its repository root, so its step
prompts, reports and rounds files are under `<path>/.workspace/lets-go/`.
The epic run's own files, the story prompt, the story's answers file,
report file and meta file, stay in the epic run's checkout, and
`step start` resolves them to absolute paths. So the epic run removes
the rounds files in the worktree before a story's first child, which
matters only for a reused worktree, and the answers file in its own
checkout. The story prompt names the worktree, so a child on a resolver
that does not start in it, or a person reading the prompt, knows where
to work. `references/story-run.md` says the child's repository root is
that worktree.

### D-J. A durable record

D-D fixes the shape of every epic run: a worktree per story, and a
checkout that never leaves the default branch. Reversing it would bring
back the shared checkout's limits: one story at a time, and a stop on
uncommitted changes. The ADR step records it as one ADR that builds on
ADR-027. D-A to D-C need no record of their own: putting process
management in `lets`, not in the skill, is what ADR-021 already says.

## Risks / Trade-offs

- [Two children update refs in the shared repository at once, and one
  `git fetch` or `git push` fails on a ref lock] → Each story has its
  own branch, so they rarely touch the same ref. A failed push fails
  that step, the child reports `failed`, and running `lets-go` on the
  story's branch carries on.
- [An agent host kills a foreground command after a few minutes, such as
  Claude Code's Bash tool at 10 minutes] → `step start` returns at once.
  The skill can pass `--timeout-minutes` to `step wait`, which exits 6,
  and runs it again with the same names.
- [A child from an earlier epic run still runs in a worktree the new run
  would reuse] → `step start` exits 2 for a name that still runs, so the
  story stops with that error instead of a second child writing in the
  same worktree.
- [Many children at once hit an API or model rate limit] → Not limited
  (D6). A child that fails reports it, and its story stops alone. A limit
  in the lets config can come later.
- [A new worktree lacks ignored files the project's tools need, such as
  `node_modules` or a trusted `mise.toml`] → Out of scope (D5): the
  steps follow the project's own instructions, as they do in any fresh
  checkout. A step that cannot run its checks reports `failed`.
- [A pid is reused by another process after a child dies] → `step wait`
  would wait on the wrong process until it ends. The exit file is
  checked first, and pid reuse within one epic run is rare.
- [Disk use grows with one worktree per running story] → Built stories'
  worktrees are removed at once; kept ones are named in their lines.

## Migration & Rollback

No data changes shape. An epic run started with the earlier release
keeps its scratch files; a new run on the same epic reads Git and
GitHub, as ADR-017 says, and reuses or creates worktrees from there.
The line `not built, the epic run stopped at #<stopped-story>` no longer
appears. To roll back, revert the change: the new commands go, and the
epic run builds one story at a time in its own checkout again. Worktrees
a run kept stay until the user removes them with `git worktree remove`.
