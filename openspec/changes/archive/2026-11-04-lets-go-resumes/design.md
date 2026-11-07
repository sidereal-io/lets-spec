## Context

`lets-go` today runs one path: the default branch, a chore nobody has claimed, three steps in order. Its *Start* names `lets-build`'s *Find the source of demand*, *Confirm the packet*, *Route* and *Claim*, and stops on any branch but the default one. `lets-build`'s *Find where you are* already maps a branch to a place in the workflow. It reads `state` from `openspec instructions apply --change <branch> --json`, and treats an archive folder `<date>-<branch>` as finished. It has no dates, and it carries on in the user's session.

The records a run leaves are all in Git and GitHub. The brainstorm commits `brainstorm.md` and opens the draft pull request. Each later artifact is its own `docs:` commit, and `tasks.md` is added last. Each task tick modifies `tasks.md`. The code review writes a `Code review` section into the pull request description, with a `Reviewed:` line and no date. Archive moves the change folder to `openspec/changes/archive/<date>-<name>` in a `chore:` commit, and the pull request is then marked ready. `git log` on the old path still lists the add and the ticks after the move, because the archive is a deletion at that path.

A step's answers live in `.workspace/lets-go/<name>-<step>-answers.yaml` for the run. An interrupted brainstorm leaves that file and no commit, because the brainstorm commits only once the ledger is confirmed.

The skills are prose, checked by `tests/skill-interfaces.bats` with fixed strings. The pinned `lets` 0.7.0 has no `step` command, so no run is possible here until the next release.

## Goals / Non-Goals

**Goals:**
- One new section in `lets-go`, *Find the first unfinished step*, that a reader can follow with four reads: the tree, the pull request, the archive folder, the change state.
- One form for every skip line, with the record's date and SHA, so the lines read alike and the tests can grep them.
- Restarting the same command after any interruption, on the same machine or another, without re-answering a step's settled questions.
- A short, closed list of disagreements, each with a clear stop.

**Non-Goals:**
- Repairing a change whose records disagree.
- A step log, a state file, or any record `lets-go` writes for itself.
- Stories, Bugs, the `ask` level, ideas, or changes to `lets-build`.
- Running the plan review as its own step. It stays inside propose until #152 brings a schema that has one.
- Checking whether an archived change's code review is still fresh. After archive, `lets-build` stops too. A commit after archive follows the workflow's change-request rule, which reverts the archive commit.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. One new test greps `skills/lets-go/SKILL.md` for the fixed strings the spec lists. They are the five skip lines, `Records disagree:`, and the `openspec instructions apply`, `git log`, `git status --porcelain`, `git fetch`, `git merge --ff-only` and `git switch` commands. The existing `lets-go` tests keep passing, including the one that checks `lets-go` sets no Project field.
- **Existing seams reused:** the check that every `gh` command the prose names is one `gh` knows. The check that every `lets delegate step` is followed by `instructions` or `run`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One skill, no code, no dependency. The skip lines and the record reads are a small new contract that #152 and the resolver stories inherit.
- **Blast radius:** `skills/lets-go/SKILL.md`, `tests/skill-interfaces.bats`, `README.md`.

## Decisions

### D-1. Four reads, in a fixed order, find the first unfinished step

After Start, on the change's branch, `lets-go` reads in this order: `git status --porcelain`, then `gh pr view <name> --json number,url,state,isDraft,body`, then the archive folder, then `openspec instructions apply --change <name> --json`. The tree comes first because a dirty tree makes every later read suspect. The pull request comes next because a merged or closed one ends the run before anything else is read. The archive folder's whole name is `<YYYY-MM-DD>-<name>`, as `lets-build` reads it, so a name that ends another change's name does not match. An archive folder means every step is done, so the state is read only when there is no archive. The state maps to a step as `lets-build`'s *Find where you are* maps it: no change folder or `blocked` is propose, `ready` is apply, `all_done` is apply review. The section says so, and does not repeat the table.

Alternative: run `lets-build`'s *Find where you are* by name. Rejected: that table sends `ready` to *Apply* in the session, and `lets-go` needs the step name and the dates, not the action.

### D-2. Each date is one `git log` with a diff filter on the change's path

Propose: the commit that added `tasks.md`, `--diff-filter=A`. Apply: the last commit that modified it, `--diff-filter=M`. Propose review: the last commit that added or modified `review.md`, `--diff-filter=AM`. Apply review: the commit that added the archive folder's `tasks.md`, `--diff-filter=A` on the archive path. Each prints `%h %as`: the short SHA and the author date. The author date survives a rebase, which stacked branches get often; the committer date does not. The filters make the commands right before and after archive. The move is a deletion at the old path, so `A` and `M` at that path still find the add and the last tick.

The `M` read relies on the schema's apply rule: `tasks.md` is committed unticked, and each tick is its own commit. A `tasks.md` committed with its ticks already in, or squashed into its add, has no `M` commit. Then the read finds nothing, and `lets-go` stops with a disagreement that names the command.

Alternative: the commit date of the last commit that touched the folder. Rejected: after archive the last commit is the archive commit for every step. Alternative: `git log --follow` through the move. Rejected: it lists the archive commit first, and the reader would have to skip it.

### D-3. The branch is found before Claim, the issue from the branch, and `origin` is fetched first

On the default branch, after *Route*, `lets-go` looks for the change's branch with `git branch --list <name>` and `git ls-remote --heads origin refs/heads/<name>`. The full ref name matters: a bare `<name>` would also match `refs/heads/topic/<name>`. When either finds it, `lets-go` fetches a branch that only `origin` has, runs `git switch <name>`, and goes on as on a change's branch. *Claim* runs only when neither finds it, so *Claim*'s own "branch exists" stop is never reached.

On any change's branch that `origin` has, `lets-go` runs `git fetch origin <name>` before it reads a record. A local branch behind `origin/<name>` is fast-forwarded with `git merge --ff-only origin/<name>`. Without this, a resume on a second machine would read a stale local branch and run steps that another machine finished. A branch that has diverged is a disagreement: both sides moved it, and `lets-go` cannot pick which is right.

On a change's branch with no issue number, `lets-go` searches open issues for `<branch> in:title` and keeps the titles that start with `<branch> — `, the form every Kind's title has. One match is the issue; none or several asks for the number. A given number must match the branch the same way.

Alternative: read `Closes #<n>` from the pull request. Rejected: a branch that *Claim* made has no pull request yet, and the title search covers both cases with one command.

### D-4. Disagreements are a closed list, and the stop names the fix

Six cases stop the run with `Records disagree:`:

- a dirty tree;
- a local branch that has diverged from `origin/<name>`;
- a change folder beside its archive folder;
- an archive folder with a pull request that is missing, a draft or has no `Code review` section;
- a committed `brainstorm.md` with no open pull request;
- a `git log` read for a skipped step that finds no commit.

The brainstorm case covers a propose step that died between its commit and `gh pr create`. A resumed propose would skip the brainstorm artifact and never open the pull request, so the stop comes at the first resume, while the fix is one command by hand. Each stop says what `lets-go` found and what to do. `lets-go` repairs nothing, because every repair is a judgement about which record is right. A merged or closed pull request is not a disagreement; it is an end, and gets its own message.

Alternative: treat any unexpected record as a disagreement. Rejected: a new branch with no pull request is normal, and the rule would stop a healthy run.

### D-5. A step's answers file from an earlier run is reused when it holds a pair

When `.workspace/lets-go/<name>-<step>-answers.yaml` exists before a step's first round and holds at least one pair, the round runs with `--answers-file`. Without this, a restart after an interrupted brainstorm would ask the user the same questions again. Worse, the first `needs-input` report would repeat a question already in the file, which the relay reads as a step that ignored its answers. With it, the step sees its settled questions, and the relay's check stays right. An empty or unreadable file counts as absent, because `lets delegate step run` exits 2 on one, and that exit stops the run. `lets-go` still needs no state: without the file, the step asks again.

Alternative: delete the step's files at the start of a run. Rejected: the user would answer every question again, and the walking skeleton's prompts are written fresh anyway.

### D-6. One form for every skip line

`Skipped <step>: <evidence>, <date> (<sha>).` The shape line keeps its form from #149. The apply review line adds the pull request's state after a semicolon, because its evidence is two records. The exact strings live in the spec's *The prose holds the fixed lines the tests check*, so the test and the skill cannot drift apart.

### D-7. Propose review's dated line ships now, though no chore reaches it

A chore's route is `lets-minimal`, so today the line is always `not in the lets-minimal route`. The dated form for another schema reads `review.md`'s `VERDICT:` line and its last commit. It costs two sentences and makes every step skippable, which is the story's outcome, before #152 brings the Kinds that use it.

## Risks / Trade-offs

- [The `Code review` section is matched by its heading, which a person could rename] → `lets-review-code` writes that heading and `lets-build`'s finishing rule reads it. `lets-go` reads it the same way, and a stop says what it looked for.
- [`git log` finds no commit, for example when `tasks.md` was added and never committed] → the dirty tree check stops first. If the tree is clean and the log is empty, the records disagree, and `lets-go` says which command found nothing.
- [A title search finds an issue from another repository or a closed one] → `gh issue list` searches this repository and, with `--state open`, open issues only.
- [`git fetch origin <name>` fails because the network is down] → `lets-go` shows the error and stops, as it does for any command that fails. It does not read a branch it could not fetch.
- [`lets-go` cannot run here until the next release] → the tests check the prose; the first real run is the dogfood after the release.

## Migration & Rollback

N/A. Prose only. Reverting the skill's commits restores the one-path `lets-go`.
