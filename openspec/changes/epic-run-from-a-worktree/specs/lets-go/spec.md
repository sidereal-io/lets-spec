<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: lets-go decides once whether the run starts in a checkout at the default branch
*Read the settings* SHALL decide whether the run starts in a checkout at the default branch, as the glossary's *Checkout at the default branch* defines it. It SHALL decide once, before *Read the request* reads the request, and the run SHALL keep the answer to its end. Edits that a shape step makes during the run SHALL not change it.

When `git branch --show-current` prints the default branch, the checkout SHALL be at the default branch, and `lets-go` SHALL run none of the checks below. A run there SHALL go as it does today, whatever changes the checkout holds.

On any other branch, `<branch>`, the checkout SHALL be at the default branch only when all three checks below pass. `lets-go` SHALL run them in this order, and stop checking at the first that fails:

1. `lets backlog find <branch>` prints no open issue whose title starts with `<branch> — `. The entry table SHALL read these matches, and `lets-go` SHALL not search again. When the command prints an `error`, `lets-go` SHALL stop as *A backlog error stops the run* says.
2. `git status --porcelain` lists no path outside `.workspace/`, whether staged, unstaged or untracked.
3. After `git fetch origin <default>`, HEAD is the commit of `origin/<default>`. When the fetch fails, `lets-go` SHALL show Git's error and stop, claiming nothing and running no step.

#### Scenario: A clean T3 Code worktree at the default branch's commit
- **WHEN** the user runs `lets-go 308` on `t3/d0dcada9`, a branch no open issue's title starts with, the checkout has no changes, and HEAD is the commit of `origin/main` after `git fetch origin main`
- **THEN** the checkout is at the default branch, and `lets-go` goes to *Check the issue* for #308 without saying that the issue and the branch do not match

#### Scenario: Changes only in the scratch folder
- **WHEN** the checkout on `t3/d0dcada9` holds the untracked file `.workspace/notes.md` and no other change, and HEAD is the commit of `origin/main`
- **THEN** the checkout is at the default branch

#### Scenario: A change outside the scratch folder
- **WHEN** the user runs `lets-go 308` on `t3/d0dcada9`, HEAD is the commit of `origin/main`, and `openspec/discovery.md` has an uncommitted edit
- **THEN** the checkout is not at the default branch, and `lets-go` says that the issue and the branch do not match, and stops

#### Scenario: A checkout behind origin
- **WHEN** the checkout on `t3/d0dcada9` has no changes, and HEAD is one commit behind `origin/main` after `git fetch origin main`
- **THEN** the checkout is not at the default branch

#### Scenario: A change's branch just after its claim
- **WHEN** the user runs `lets-go` with nothing on `lets-go-chore`, the checkout has no changes, HEAD is the commit of `origin/main`, and the open issue #149's title starts with `lets-go-chore — `
- **THEN** the checkout is not at the default branch, `lets-go` runs no `git fetch origin main`, and it takes #149 as the issue

#### Scenario: The default branch with changes
- **WHEN** the user runs `lets-go 308` on `main`, the default branch, and `README.md` has an uncommitted edit
- **THEN** the checkout is at the default branch, and `lets-go` runs neither `lets backlog find main` nor `git fetch origin main`

#### Scenario: The fetch fails
- **WHEN** the user runs `lets-go 308` on `t3/d0dcada9`, the checkout has no changes, and `git fetch origin main` fails with `fatal: unable to access 'https://github.com/o/r.git/'`
- **THEN** `lets-go` shows that error, claims nothing, runs no step and stops

#### Scenario: A shape step's edits keep the answer
- **WHEN** a run that started in a checkout at the default branch on `t3/d0dcada9` runs a shape step whose discovery leaves `openspec/discovery.md` edited
- **THEN** the run still acts as in a checkout at the default branch when it claims the first story, and runs none of the three checks again

### Requirement: A run in a checkout at the default branch acts as on the default branch
A run that starts in a checkout at the default branch SHALL act as a run on the default branch does, wherever these requirements say what a run does on the default branch or that something needs the default branch: the entry table, the shape step, the `epic` case of *Check the issue*, *Enter the branch*, *Claim* and the epic run. `lets-go` SHALL create each change's branch and each story's worktree from `<default>`, as on the default branch. Outside an epic run, the run SHALL switch its checkout to the change's branch, as on the default branch, and leave the branch it started on as it was. A run on any other branch SHALL act as it does on a change's branch.

#### Scenario: A story from a T3 Code worktree
- **WHEN** the user runs `lets-go 308` in a checkout at the default branch on `t3/d0dcada9`, and #308, titled `step-strategy — ...`, has no branch here or on `origin`
- **THEN** *Claim* claims #308 and creates `step-strategy` off `main`, the run goes on with `git branch --show-current` printing `step-strategy`, and `t3/d0dcada9` still points at the commit it started on

#### Scenario: An epic from a T3 Code worktree
- **WHEN** the user runs `lets-go #278` in a checkout at the default branch on `t3/d0dcada9`, and #278's Kind is Epic with open sub-issues
- **THEN** `lets-go` starts an epic run on #278, and does not say that an epic run needs the default branch

#### Scenario: Nothing from a T3 Code worktree
- **WHEN** the user runs `lets-go` with nothing in a checkout at the default branch on `t3/d0dcada9`, and `next` picks #149
- **THEN** `lets-go` prints `Picked #149: lets-go-chore — ..., the next ready issue.` and goes to *Check the issue* with #149

#### Scenario: An epic on a change's branch
- **WHEN** the user runs `lets-go #278` on `lets-go-chore`, a branch the open issue #149's title starts with
- **THEN** the checkout is not at the default branch, and `lets-go` says that the issue and the branch do not match, starts no epic run and claims nothing


## MODIFIED Requirements

### Requirement: An entry table says where the run goes after the request
*Read the request* SHALL hold a table that decides where the run goes, from the checkout the run started in and the request. Its rows SHALL be a checkout at the default branch and another branch, as *lets-go decides once whether the run starts in a checkout at the default branch* says. Its columns SHALL be a number, an idea and nothing. Each of the six cells SHALL name the part the run goes to next, or the stop:

- In a checkout at the default branch, a number goes to *Check the issue*. An idea goes to *Start from an idea*. Nothing runs `next`: a pick prints `Picked #<i>: <title>, the next ready issue.` and goes to *Check the issue*, and an empty backlog stops.
- On another branch, a number goes to *Check the issue* when it is one of the open issues whose title starts with the branch's name and ` — `, and stops otherwise. An idea stops: an idea needs the default branch. Nothing goes to *Check the issue* when exactly one open issue's title starts that way, and stops when none or several do.

The table SHALL replace the bullets *Start* step 2 held, with the same results. A leading or trailing `ask` or `auto` SHALL be read before the table decides, as *lets-go takes one issue number or an idea* says. On another branch, words stop the run, so `lets-go` SHALL ask no question about the word there.

#### Scenario: An idea on the default branch
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` on `main`, the default branch
- **THEN** the entry table sends the run to *Start from an idea*

#### Scenario: An idea in a T3 Code worktree
- **WHEN** the user runs `lets-go add a --quiet flag to lets sync` in a checkout on `t3/d0dcada9` that has no changes, whose HEAD is the commit of `origin/main` after `git fetch origin main`, and whose branch no open issue's title starts with
- **THEN** the entry table sends the run to *Start from an idea*, and `lets-go` does not say that an idea needs the default branch

#### Scenario: An idea on a change's branch
- **WHEN** the user runs `lets-go add a --quiet flag` on the branch `lets-go-chore`
- **THEN** the entry table stops the run, and `lets-go` says that an idea needs the default branch

#### Scenario: Nothing on a change's branch with one match
- **WHEN** the user runs `lets-go` with nothing on the branch `lets-go-chore`, and one open issue's title starts `lets-go-chore — `
- **THEN** the entry table sends the run to *Check the issue* for that issue

#### Scenario: The table has six cells
- **WHEN** a reader reads *Read the request* in `skills/lets-go/SKILL.md`
- **THEN** the reader finds a table with a row for a checkout at the default branch and a row for another branch, and a column each for a number, an idea and nothing

### Requirement: An epic run gives each story run a worktree of its own
In an epic run, every story run SHALL work in a git worktree of its own, even in a wave of one story. The epic run's own checkout SHALL stay where it is for the whole epic run: on the branch and at the commit it started on, whether that is the default branch or another branch of a checkout at the default branch. `<path>` is the story's worktree: `.workspace/lets-go/worktrees/<name>` in the epic run's checkout for a worktree the epic run creates, or the path `git worktree list --porcelain` prints for one it reuses, as *An epic run reuses a story's clean worktree* says.

Where *Enter the branch* checks the story's branch out, the epic run SHALL create the worktree instead:

- **A story with no branch:** *Claim* SHALL create the branch and its worktree together, off the default branch, with `git worktree add -b <name> .workspace/lets-go/worktrees/<name> <default>`. For a stacked story it SHALL create them off the blocker's branch, with no upstream, with `git worktree add --no-track -b <name> .workspace/lets-go/worktrees/<name> origin/<blocker-branch>`. When the command fails, *Claim* SHALL release the claim and return `branch-failed`, as it does when creating a branch fails.
- **A story whose branch exists, here or on `origin`, and is checked out in no worktree:** the epic run SHALL run `git fetch origin <name>` when `origin` has it, then `git worktree add .workspace/lets-go/worktrees/<name> <name>`. When the command fails, the story's run SHALL stop with `stopped: ` followed by Git's error.

When git ignores the project's lets-spec skills, as `git check-ignore -q .agents/skills/lets-go` says in the epic run's checkout, the epic run SHALL then run `lets sync` with `<path>` as its working directory, so the child finds the `lets-go` skill and the lets schemas. It SHALL prepare nothing else in the worktree. When `lets sync` exits non-zero, the story's run SHALL stop with `stopped: lets sync failed in its worktree: ` followed by its error.

From then on, every command of the story that reads or writes its branch SHALL run in `<path>`: the fetch and fast-forward of *Enter the branch*, *Import the glossary checkpoint*, the schema read, the child session, and the walk in this session when no child session can start.

#### Scenario: A new story's worktree
- **WHEN** an epic run on #278 claims #279, which has no branch and no open blocker, on a repository whose default branch is `main`
- **THEN** *Claim* runs `git worktree add -b epic-run-skeleton .workspace/lets-go/worktrees/epic-run-skeleton main`, and `git branch --show-current` in the epic run's checkout still prints `main`

#### Scenario: A new story's worktree from a T3 Code worktree
- **WHEN** an epic run on #278 starts in a checkout at the default branch on `t3/d0dcada9`, on a repository whose default branch is `main`, and claims #279, which has no branch and no open blocker
- **THEN** *Claim* runs `git worktree add -b epic-run-skeleton .workspace/lets-go/worktrees/epic-run-skeleton main`, and `git branch --show-current` in the epic run's checkout still prints `t3/d0dcada9`

#### Scenario: A stacked story's worktree
- **WHEN** the epic run claims #280, stacked on #279, whose branch is `epic-run-skeleton`
- **THEN** *Claim* runs `git worktree add --no-track -b epic-run-stacks .workspace/lets-go/worktrees/epic-run-stacks origin/epic-run-skeleton`

#### Scenario: Ignored skills
- **WHEN** the epic run's checkout ignores `.agents/skills/lets-go`, and the epic run creates the worktree for #279
- **THEN** it runs `lets sync` in `.workspace/lets-go/worktrees/epic-run-skeleton` before the story's child session starts

#### Scenario: Committed skills
- **WHEN** git tracks `.agents/skills/lets-go` in the epic run's checkout
- **THEN** the epic run runs no `lets sync` in the story's worktree

#### Scenario: A worktree that cannot be created
- **WHEN** `git worktree add` fails for #280, whose branch exists, with the error `fatal: '.workspace/lets-go/worktrees/epic-run-stacks' already exists`
- **THEN** #280's line is `#280 epic-run-stacks: stopped: fatal: '.workspace/lets-go/worktrees/epic-run-stacks' already exists`, and the epic run goes on with the other stories

### Requirement: lets-go carries the glossary's entries for its own terms
`skills/lets-go/references/terms.md` SHALL hold the entries of `openspec/glossary.md` for *Part*, *Procedure*, *Step*, *Step report*, *Question mode*, *Packet* and *Checkout at the default branch*. Each entry SHALL be a `##` heading with the term, as in the glossary, and its text SHALL be the glossary entry's text, word for word. The file SHALL hold no other entry. An installed skill cannot link `openspec/glossary.md`: in a project that installs `lets-go`, that path is the project's own glossary. So this file is how the definitions travel with the skill. The Node terms check, `tests/contracts/terms.test.ts`, SHALL fail when an entry's text differs from the glossary's, or when the glossary has no entry for a term that `terms.md` holds, and SHALL name the term. It SHALL read the terms from the `##` headings of `terms.md`, not from a list typed into the test. An entry missing from `terms.md` that `lets-go` links fails the Node link check instead.

#### Scenario: The copy matches the glossary
- **WHEN** the Node terms check reads `skills/lets-go/references/terms.md` and `openspec/glossary.md`
- **THEN** each of the seven terms has a `##` heading in both files, the text under each heading is the same once whitespace is collapsed, and the check passes

#### Scenario: The glossary changes and the copy does not
- **WHEN** a small glossary written for the test has a *Procedure* entry that says `run by a part`, and a small `terms.md` says `run by a part or another procedure`
- **THEN** the check fails, and its output names `Procedure`

#### Scenario: A term missing from the glossary
- **WHEN** a small `terms.md` written for the test has a `## Packet` entry, and the small glossary beside it has no `## Packet` heading
- **THEN** the check fails, and its output names `terms.md` and `Packet`

#### Scenario: A term missing from the copy
- **WHEN** an edit takes the `## Step report` entry out of `terms.md`, and `SKILL.md` still links `references/terms.md#step-report`
- **THEN** the Node link check fails, and its output names `SKILL.md` and the link

### Requirement: lets-go links each glossary term at its first use
In `skills/lets-go/SKILL.md`, the first mention of each of *Packet*, *Step*, *Step report*, *Question mode* and *Checkout at the default branch*, in any case and outside the frontmatter and code, SHALL sit in a link to that term's heading in `references/terms.md`, such as `[step report](references/terms.md#step-report)`. A mention of *Step report* SHALL not count as a mention of *Step*. The skill SHALL not repeat a definition that `terms.md` holds.

#### Scenario: Each term links at its first mention
- **WHEN** a reader finds, in `SKILL.md` outside the frontmatter and code, the first line that mentions each of `packet`, `step`, `step report`, `question mode` and `checkout at the default branch`
- **THEN** that line holds a link to `references/terms.md#packet`, `#step`, `#step-report`, `#question-mode` or `#checkout-at-the-default-branch`, as the term is

#### Scenario: A term used before its link
- **WHEN** an edit makes `SKILL.md` say `the issue's packet` on one line, and link `[packet](references/terms.md#packet)` only on a later line
- **THEN** the edit breaks this requirement, because the first line that mentions `packet` has no link

