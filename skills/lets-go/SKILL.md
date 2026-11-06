---
name: lets-go
description: Take one story, bug or chore, or an idea in words, to a pull request ready for review, in one run. Given nothing, it takes the next ready issue on the backlog. It claims the issue here. Given an idea, it first searches the open issues for the same work. An idea with no match, or an issue whose packet is not complete, goes to a shape step that runs lets-shape. A large idea runs lets-shape discovery first, and lets-go builds the first ready story it files. Shape, plan, review plan, build and review build each run in a fresh session. lets-minimal skips review plan. Every question a step has comes back to this conversation. A chore or a bug runs at recommend, where lets-go answers each question that has a recommendation. A story or a shape runs at ask, where the user answers every question. Name a level, or set go.level in the lets config, to pick the other. On a change's branch, it picks the change up at its first unfinished step, and prints each step it skips with its evidence and date. Use when the user wants an issue or an idea built end to end, or wants to start the next story. Also use when the user wants to carry on the change on the current branch, says lets-go, or runs it again after a run stopped.
---

# Let's go

Take one story, bug or chore to a pull request ready for review, in one
run. Start from its issue number, from an idea in words, or from
nothing, which takes the next ready issue. The run claims the issue in
this session. Then each step runs in a fresh session: shape when the
issue needs it, then plan, review plan, build and review build.
`lets-minimal` skips review plan. An idea too large for one issue runs
discovery in the shape step, and the run builds the first ready story it
files. A step never asks the user: it ends with a report. This session
answers the step's questions or asks the user, as the interactivity
level says. Run every command below from the repo root.

A run can stop before it finishes. Run `lets-go` again, on the default branch or
on the change's branch. It reads from Git and GitHub which steps are
done, prints a dated line for each, and goes on from the first
unfinished step.

## The run at a glance

A run goes through these parts, in this order. *Start from an idea*,
*Run the shape step* and *Pick the first ready story* run only when the
request or the packet needs them. Each part runs in this session. A
part is not a step, and has no step report. The shape step that
*Run the shape step* runs is a step, and has a report.

| Part | What it does | Runs in | Next | Stops when |
|---|---|---|---|---|
| [Read the settings](#read-the-settings) | Reads the default level, the default branch, the current branch and the Project | this session | *Read the request* | `lets go level` fails, or the Project query finds no Project, or several |
| [Read the request](#read-the-request) | Takes a level off the request, then finds the issue from the branch and the request | this session | *Check the issue*, or *Start from an idea* for an idea | An idea on a change's branch, no issue that matches the branch, or *Find the source of demand* returns `nothing-ready` |
| [Start from an idea](#start-from-an-idea) | Resumes a discovery of the idea, or searches for an issue that is the same work | this session | *Check the issue* for the same work; otherwise *Run the shape step* | Never |
| [Check the issue](#check-the-issue) | Reads the blockers, looks for the change's branch, finds the source of demand, confirms the packet and prints shape's line | this session | *Run the shape step* when the packet needs shaping and shape can run; otherwise *Route* | An open blocker with no branch; *Find the source of demand* returns `unresolved`; or *Confirm the packet* returns `epic`, or `needs-shape` when shape cannot run |
| [Run the shape step](#run-the-shape-step) | Runs `lets-shape` on the idea or the issue | this session; its step runs in a fresh one | *Check the issue* for one issue; *Pick the first ready story* for a parent and its stories | The discovery map has edits of its own, or the step fails or asks a settled question again |
| [Pick the first ready story](#pick-the-first-ready-story) | Picks the first ready story that discovery filed | this session | *Check the issue* | *Find the source of demand* returns `nothing-ready` |
| [Route](#route) | Picks the change's schema, and says the route line | this session | *Enter the branch* | Never |
| [Enter the branch](#enter-the-branch) | Claims the issue and creates the branch, or switches to the branch and brings it up to date, then sets the schema | this session | *Set the level*; *Read the request* or *Pick the first ready story* after a lost claim | *Claim* returns `unresolved`, `checkpoint-failed` or `branch-failed`, or `taken` for a named issue or for the third time; the import returns `import-failed`; or the branch has diverged |
| [Set the level](#set-the-level) | Picks `ask` or `recommend`, and says why | this session | *Walk the step table* | Never |
| [Walk the step table](#walk-the-step-table) | Reads the records, then runs each step that is not done | this session; its step runs in a fresh one | *End of the run* | The records disagree, the pull request is merged or closed, or a step fails or asks a settled question again |
| [End of the run](#end-of-the-run) | Prints the pull request's URL | this session | Nothing: the run is over | Always |

## Placeholders

A name in angle brackets is a placeholder. Each one stands for one
thing, the same everywhere in this skill. Fill it in from where the run
sets it.

| Placeholder | What it stands for | Where the run sets it |
|---|---|---|
| `<project>` | The number of the Project linked to the repository | [Read the settings](#read-the-settings), from the Project query |
| `<owner>` | The Project's owner | [Read the settings](#read-the-settings), from the Project query |
| `<repo>` | The repository, as `owner/name` | [Read the settings](#read-the-settings), from the Project query's `repo` |
| `<i>` | The run's issue: the number the user named, the issue `next` or *Pick the first ready story* picked, or the issue a shape step shaped. Or, inside `next`, the candidate it is checking | [Read the request](#read-the-request), the shape step's report, or `next`, for each candidate |
| `<issue-url>` | The URL of `<i>` | *Confirm the packet*, from the issue's `url` |
| `<parent>` | A parent issue: an epic that discovery filed, or a discovery in progress | The shape report's `epic` line, or the discovery query in *Start from an idea* |
| `<story>` | One story that a shape step's report names | Each `story` line of the shape report |
| `<pr>` | The number of the change's pull request | *Read the records*, from the pull request's `number` |
| `<name>` | The change's name: the part of `<i>`'s title before ` — `. On a change's branch, it is `<branch>` | [Check the issue](#check-the-issue), from the blocker read's title. After a shape step, *Check the issue* sets it again from the shaped issue's title |
| `<branch>` | The branch the run started on, when it is not the default branch | [Read the settings](#read-the-settings), from `git branch --show-current` |
| `<default>` | The repository's default branch | [Read the settings](#read-the-settings) |
| `<shape-name>` | The shape step's name: `issue-<i>` or `idea-<slug>` | [The change's name](#the-changes-name) |
| `<slug>` | The first five words of the idea, as [The change's name](#the-changes-name) makes them | [The change's name](#the-changes-name) |
| `<idea>` | The idea, in the user's words | [Read the request](#read-the-request) |
| `<step>` | One step, as `--for` names it: `shape`, `plan`, `review-plan`, `build` or `review-build` | [The step table](#the-step-table), at the row the walk runs, or `shape` in [Run the shape step](#run-the-shape-step) |
| `<session>` | A step's session label: `<name>`, a hyphen and `<step>`, or `<shape-name>-shape` for shape | [The change's name](#the-changes-name) |
| `<level>` | The interactivity level, `ask` or `recommend` | [Set the level](#set-the-level), or [Run the shape step](#run-the-shape-step), before shape |
| `<Kind>` | The issue's Kind on the Project | *Confirm the packet* |
| `<schema>` | The change's schema | [Enter the branch](#enter-the-branch) |
| `<route line>` | The line *Route* says, such as `Route: lets-minimal, because #<i> is a Chore.` | [Route](#route) |
| `<title>` | The title of the issue the line names | The command or report line that names the issue |
| `<date>` | The date on a printed line | [The step lines](#the-step-lines), for each kind of line |
| `<sha>` | A commit's short hash, or the commit a review names | [Read the records](#read-the-records), or the review plan report |
| `<verdict>` | A plan review's verdict | The **Plan review** section, or the review plan report |
| `<evidence>` | What a `done` report's `evidence` lists | [The step lines](#the-step-lines) |
| `<reason>` | Why a step failed | [The step lines](#the-step-lines), from a `failed` report's `reason` |
| `<YYYY-MM-DD>` | The date in an archive folder's name | The folder's name in `openspec/changes/archive/` |
| `<first>` | The first model of the ranked options | [Run a step](#run-a-step), when it ranks the options |
| `<second>` | The second model of the ranked options | [Run a step](#run-a-step), when it ranks the options |
| `<skill>` | The skill in the step's row of the step table | [Write the prompt](#write-the-prompt) |
| `<the sentence above>` | The sentence for *What to run*, or for shape the text of [What shape runs](#what-shape-runs) | [Write the prompt](#write-the-prompt) |
| `<kebab-name>` | The part of an issue title before ` — `, in `lets-shape`'s template | The issue's title |
| `<one-line outcome>` | The part of an issue title after ` — `, in `lets-shape`'s template | The issue's title |
| `<L or XL>` | The Size the shape step gave the work, `L` or `XL` | The shape step |

## Read the settings

Read the user's default level. Run this once, before anything asks
GitHub:

```bash
lets go level
```

It prints one JSON line, such as `{"level":"recommend"}`. Keep its
`level` for the whole run: `ask`, `recommend`, or `null` when the
`lets` config sets none. If it exits non-zero, show the user its
stderr and stop: claim nothing, and run no step. Then find the
default branch with
`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`,
and run `git branch --show-current`.

Then find the Project linked to this repository. Run this query once
per run:

```bash
gh api graphql -F owner='{owner}' -F name='{repo}' -f query='
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    projectsV2(first: 100) { nodes { number title url closed owner { ... on User { login } ... on Organization { login } } } }
  }
  repositoryOwner(login: $owner) {
    ... on ProjectV2Owner {
      projectsV2(first: 100) { nodes { number title url closed owner { ... on User { login } ... on Organization { login } } repositories(first: 100) { nodes { nameWithOwner } } } }
    }
  }
}' --jq '.data.repository.nameWithOwner as $repo
  | {repo: $repo, projects: ([.data.repository.projectsV2.nodes[], (.data.repositoryOwner.projectsV2.nodes[] | select(any(.repositories.nodes[]; .nameWithOwner == $repo)))]
      | map(select(.closed | not) | {number, title, url, owner: .owner.login}) | unique_by(.owner, .number))}'
```

The query lists the Projects linked to the repository, and the
owner's Projects that link back to it. A user-owned Project can be
missing from the repository's own listing for a while after it is
linked, so neither list alone is enough.

- **One Project:** use its `number` as `<project>` and its `owner` as
  `<owner>` in every `gh project` command of this run. The query's
  `repo` is the repository, `<repo>`, as `owner/name`.
- **None:** say to run the `lets-setup-backlog` skill, and stop.
- **Two or more:** list each one's title and URL, ask the user to unlink
  the extras, and stop. Never pick one yourself.

Next: [Read the request](#read-the-request).

## Read the request

Read the request. A leading or trailing `ask` or `recommend` names
the level: take it off, and keep it for [Set the level](#set-the-level).
What is left is one of these:
- **A number:** it holds `#<i>`, or is a bare number. It names the
  issue.
- **Words:** anything else. They are an idea, kept word for word.
- **Nothing.**

Then find the issue, `<i>`, from the branch the run started on and what
is left of the request:

| The branch | A number | An idea | Nothing |
|---|---|---|---|
| The default branch | The number is `<i>`. Go to [Check the issue](#check-the-issue) | Go to [Start from an idea](#start-from-an-idea) | Run `next`. Its pick is `<i>`: print the `Picked` line, and go to [Check the issue](#check-the-issue). When nothing is ready, stop |
| Another branch, `<branch>` | When the number is one of the matches, it is `<i>`: go to [Check the issue](#check-the-issue). Otherwise stop | Stop: an idea needs the default branch | When exactly one issue matches, it is `<i>`: go to [Check the issue](#check-the-issue). When none or several do, stop |

With nothing on the default branch, run the third case, `next`, of
[Find the source of demand](#find-the-source-of-demand), over the
whole backlog. On its result:
- **`picked`:** print `Picked #<i>: <title>, the next ready issue.`
  That issue is `<i>`.
- **`nothing-ready`:** say the backlog has nothing ready, suggest the
  `lets-shape` skill to shape more, and stop, claiming nothing.

On another branch, `<branch>`, when the request is words, say that an
idea needs the default branch, and stop. Otherwise search for the
change's issue, once:

```bash
gh issue list --state open --search "<branch> in:title" --json number,title
```

Keep the issues whose title starts with `<branch> — `: these are the
matches. When the user gave a number, it must be one of them. If it is
not, say that the issue and the branch do not match, and stop. When
they gave none, exactly one match is the issue. If none matches, say
that `lets-go` runs on the default branch or on a change's branch, and
needs the issue number on a change's branch. Stop. If several match,
say that `lets-go` needs the issue number, and stop.

Next: [Check the issue](#check-the-issue) when the entry table found `<i>`;
[Start from an idea](#start-from-an-idea) for an idea on the default branch.

## Start from an idea

1. Look for a discovery of this idea that an earlier run started. Use
   `lets-shape`'s own query:

   ```bash
   gh issue list --state open --search '"Discovery status: in-progress" in:body' --json number,title,body
   ```

   When a parent's `Input:` line holds the idea word for word, say that
   a discovery of this idea is in progress at `#<parent>`. Skip the
   search below, and [run the shape step](#run-the-shape-step) for the
   idea: its round resumes that parent.
2. Run the second case of
   [Find the source of demand](#find-the-source-of-demand): the run has
   described work, but no issue. It searches open issue titles for the
   idea's words. On its result:
   - **`matches`:** show the user the matches it carries, and ask
     whether one is the same work. Ask at either level: a wrong yes
     builds someone else's issue.
   - **`no-match`:** [run the shape step](#run-the-shape-step) for the
     idea.
3. On a yes, that issue is `<i>`. Go on from the blocker read in
   [Check the issue](#check-the-issue).
4. On a no, [run the shape step](#run-the-shape-step) for the idea.

Next: [Check the issue](#check-the-issue) when the user says an issue is the
same work; otherwise [Run the shape step](#run-the-shape-step).

## Check the issue

1. Read the blockers of `<i>`:

   ```bash
   gh issue view <i> --json title,blockedBy
   ```

   It gives the title too. `<name>` is the change's name, which *Claim*
   takes from the title. On a change's branch, it is `<branch>`.
2. Look for the change's branch, here and on `origin`, every time:

   ```bash
   git branch --list <name>
   git ls-remote --heads origin refs/heads/<name>
   ```

   On a change's branch, the branch exists: you are on it. Run the
   `git ls-remote` there too, to learn whether `origin` has it. Keep
   what you found: [Enter the branch](#enter-the-branch) reads it, and
   does not look again.
3. Decide on an open blocker before anything else in this part runs. A
   blocker whose `state` is `OPEN` is open. When one is:
   - **The branch exists**, here or on `origin`: the user has stacked it
     by hand. Name the open blockers by number, and go on.
   - **It does not exist:** say which open issues block `#<i>`, and
     stop. The user stacks it on the blocker's branch by hand.
4. Run [Find the source of demand](#find-the-source-of-demand) for
   `<i>`. Its first case runs *Check the prerequisite* for the issue.
   On its result:
   - **`found`:** go on to *Confirm the packet*, below.
   - **`unresolved`:** report the unresolved owner or checkpoint it
     carries, and stop, even on a stacked branch.
5. Run [Confirm the packet](#confirm-the-packet). On its result:
   - **`complete`:** go on to the shape line, below. For a Story with a
     parent, the result carries the parent's **Shared decisions**:
     *Route* needs them.
   - **`needs-shape`:** [run the shape step](#run-the-shape-step) for
     `#<i>` when all of these hold:
     - the user named `<i>`, or said in *Start from an idea* that it is
       the same work;
     - the branch lookup above found no branch, here or on `origin`;
     - no shape step has run in this run.

     Otherwise, when the branch exists, first say that the change has
     started on `<name>`. Say why the packet needs shaping, as the
     result carries it, and show nothing of what a comment says. Say to
     run the `lets-shape` skill on `#<i>`, and stop.
   - **`epic`:** say that an epic is built through its stories, list the
     open sub-issues the result carries, and stop.
6. When *Confirm the packet* returns `complete`, shape is done. Print
   shape's line, as [The step lines](#the-step-lines) says.

Next: [Run the shape step](#run-the-shape-step) when *Confirm the packet*
returned `needs-shape` and shape can run; otherwise [Route](#route).

## Run the shape step

The shape step turns an idea, or an issue whose packet is not complete,
into one shaped issue. When the work is too large for one issue, it runs
discovery instead, which files a parent issue and its stories. It runs
on the default branch, before any branch or change exists, and at most
once per run. [Check the issue](#check-the-issue) decides when it runs.

1. Check the discovery map. Run `git status --porcelain`. When it lists
   `openspec/discovery.md`, look for this input's discovery: an open
   parent issue that says `Discovery status: in-progress`, and whose
   `Input:` line names this input, the idea's words or `#<i>`. For an
   idea, use what *Start from an idea* found. For an issue, run the
   query in *Start from an idea*.
   - **There is one:** the edits are that discovery's confirmed phases.
     Go on: the step resumes it, and its map commit takes them.
   - **There is none:** say that the map has uncommitted edits, and to
     commit or discard them. Stop, and run no step. If the run went on,
     a discovery's commit could sweep those edits in.
2. Set `<level>` and print its line, as
   [Set the level](#set-the-level) says for a level before a shape step.
   Then go on here, with the next step.
3. For an idea, check that the answers file is this idea's. Two ideas
   can share their first five words, and so their `<shape-name>`. When
   `.workspace/lets-go/<shape-name>-shape-prompt.md` exists and holds
   another idea, an earlier run stopped before it finished, on that other idea. In
   that case, remove `.workspace/lets-go/<shape-name>-shape-answers.yaml`
   before you write the prompt.
4. Run the `shape` step, as [Run a step](#run-a-step) says.
5. When it reports `done`, [Read the report](#read-the-report) says
   what it shaped:
   - **One issue:** that issue is `<i>`. Go on from the blocker read in
     [Check the issue](#check-the-issue) with it, as for an issue number.
   - **A parent and its stories:**
     [pick the first ready story](#pick-the-first-ready-story).

Next: [Check the issue](#check-the-issue) when shape shaped one issue;
[Pick the first ready story](#pick-the-first-ready-story) when it filed a
parent and its stories.

## Pick the first ready story

Discovery filed a parent issue, `#<parent>`, and its stories. Build one
of them in this run.

1. Run the third case, `next`, of
   [Find the source of demand](#find-the-source-of-demand), with one
   narrowing: the candidates are the stories the report named, and no
   other issue. Run its two commands as the section writes them. Rank
   as it does: Must, then Should, then Could, then the lowest issue
   number. Run *Check the prerequisite* and *Confirm the packet* on
   each candidate, in rank order. A ready story is one that `next`
   would take.
2. On its result:
   - **`picked`:** print:

     ```text
     Picked #<i>: <title>, the first ready story under #<parent>.
     ```

     That story is `<i>`. Go on from the blocker read in
     [Check the issue](#check-the-issue) with it, as for an issue number.
   - **`nothing-ready`:** print the `Done shape` line, as
     [The step lines](#the-step-lines) says. Say
     that no story under `#<parent>` is
     ready. Name each story, and why it was left out, as the result
     carries it: for example, its blocker, its assignee, an unresolved
     prerequisite, or a packet that is not complete. Say to run `lets-go` with a story's number
     once it is ready. Then stop. Claim nothing, and create no branch.

A run that stops after discovery and before *Claim*, for any reason,
leaves the map's edits on the default branch. When
`git status --porcelain` lists `openspec/discovery.md`, say that it
holds the discovery's map, uncommitted on the default branch. While the
parent still says `Discovery status: in-progress`, say to leave the map
as it is: running `lets-go` again with the same idea, or `#<i>`, resumes
the discovery and keeps its edits. Otherwise, say to commit or discard
the map before the next run, because the next run stops on it.

Next: [Check the issue](#check-the-issue), with the story that is ready.

## Route

Pick the schema for the change. Top down, first match wins:

| The issue | Schema |
|---|---|
| Kind Chore | `lets-minimal` |
| Size XS or S, and the packet's **Relevant code** says `new` | the flow's schema |
| Size XS or S, and the parent epic's **Shared decisions** names one this story relies on or creates | the flow's schema |
| Size XS or S | `lets-minimal` |
| anything else, including Size unset | the flow's schema |

The flow's schema is the `schema:` line of `openspec/config.yaml`. Say
which schema and why in one line, such as
`Route: lets-minimal, because #<i> is a Chore.` That line goes in the
proposal commit message.

Keep the route line: the plan step needs it.

Next: [Enter the branch](#enter-the-branch).

## Enter the branch

1. On the default branch, use what *Check the issue* found when it
   looked for the change's branch, here and on `origin`:
   - **Neither has it:** run [Claim](#claim), which creates the
     branch, and act on its result as below.
   - **Either has it:** the change has started. Do not run *Claim*.
     When `origin` has it, run `git fetch origin <name>` first:
     `git switch` finds a branch on `origin` only once it is fetched.
     Then run `git switch <name>`.

   Stay on `<name>` for the whole run.
2. When you ran *Claim*, act on its result:
   - **`claimed`:** when it carries `verified`, run
     [Import the glossary checkpoint](#import-the-glossary-checkpoint)
     with the commits it carries, and act on its result as below. When
     it carries `no-owned-edits`, run no import, and
     [commit the discovery map](#commit-the-discovery-map).
   - **`taken`:** when the user named `<i>` or confirmed it, say who has
     it, and stop. Otherwise `next` or *Pick the first ready story*
     picked it: count the lost claim. After the third lost claim in this
     run, say that other sessions keep taking the picked issues, and to
     run `lets-go` again. Stop, claiming nothing. Before that, go back
     to the part that picked: [Read the request](#read-the-request) for
     `next`, or [Pick the first ready story](#pick-the-first-ready-story).
     Keep the lines printed for the lost issue.
   - **`unresolved`:** report the owner or the definitions it carries,
     and stop, claiming nothing, even for an issue that `next` picked.
   - **`checkpoint-failed`:** report what the check found, and stop.
   - **`branch-failed`:** *Claim* has released the claim. Show the error
     it carries, and stop.
3. When you ran *Import the glossary checkpoint*, act on its result:
   - **`imported`:** [commit the discovery map](#commit-the-discovery-map).
   - **`import-failed`:** report each cleanup failure it carries, and
     what was kept, with how to recover, and stop.
4. When `origin` has the branch, bring it up to date before you read any
   record. On a change's branch too, *Check the issue* found whether it
   does.

   ```bash
   git fetch origin <name>
   git merge --ff-only origin/<name>
   ```

   Skip the fetch when you have just run it above. If the merge cannot
   fast-forward, the branch and `origin` have diverged: the
   [records disagree](#records-that-disagree). If any command here fails
   for another reason, show the user its error, and stop.
5. Set `<schema>`. When `openspec/changes/<name>/.openspec.yaml` exists,
   it is that file's `schema:` line. Otherwise it is the schema *Route*
   picked.

Next: [Set the level](#set-the-level);
[Read the request](#read-the-request) or
[Pick the first ready story](#pick-the-first-ready-story) after a lost
claim.

## Set the level

Set `<level>`, the interactivity level. Take the first of these
that is set:
1. The level the user named in the request that started the run.
2. The level `lets go level` printed in
   [Read the settings](#read-the-settings), when it is not `null`.
3. The Kind's: `recommend` for a Chore or a Bug, and `ask` for any
   other Kind, a Story included. *Confirm the packet* reads any other
   Kind as a Story. Before a shape step, the Kind does not count, even
   when the Project has one, as for a Bug whose packet lacks a line. So
   before a shape step, the third source is `ask`.

Never ask the user which level to use. The level holds for this run
only. Do not run `lets go level` again. Print the line for the source
you used. The last line is for the third source, before a shape step:

```text
Interactivity: <level>, because you asked for it.
Interactivity: <level>, because your lets config sets go.level.
Interactivity: <level>, because #<i> is a <Kind>.
Interactivity: ask, because shape has not run yet.
```

At `recommend`, this session answers each question that has a
recommendation, and asks the user the rest. At `ask`, it asks the
user every question.

Next: [Walk the step table](#walk-the-step-table).

## Walk the step table

After [Set the level](#set-the-level), on the branch `<name>`, read three
records first, in this order:

1. **The tree.** Run `git status --porcelain`. A line for a path outside
   `.workspace/` means the records disagree.
2. **The pull request.** Run:

   ```bash
   gh pr view <name> --json number,url,state,isDraft,body
   ```

   When it finds none, note that the branch has no pull request, and go
   on. A new branch has none yet. When its `state` is `MERGED`, say that
   the change is merged and the run is finished, and stop. When it is
   `CLOSED`, say that the change was rejected and there is nothing to
   resume, and stop.
3. **The archive folder.** Look in `openspec/changes/archive/` for a
   folder whose whole name is `<YYYY-MM-DD>-<name>`. A folder whose name
   only ends in `-<name>` belongs to another change. When the folder
   exists, every step is done, and the records disagree if any of these
   is true:
   - `openspec/changes/<name>/` exists too;
   - the pull request is missing or is a draft;
   - the flow's schema, the `schema:` line of `openspec/config.yaml`, is
     `lets-standard`, and the pull request's `body` has no `Code review`
     section.

Then walk [The step table](#the-step-table) from the top row.
*Check the issue* has printed shape's line already. At each row, find
out whether the step is done:

- **Plan.** When the archive folder exists, plan is done. When
  `openspec/changes/<name>/` does not exist, plan is not done.
  Otherwise run `openspec instructions apply --change <name> --json`,
  and read its `state`. When the `state` is `ready` or `all_done`, plan
  is done. When the `state` is `blocked`, plan is not done. For any
  other `state`, show the user the CLI's `instruction`, and stop. When
  `openspec/changes/<name>/brainstorm.md` exists and the branch has no
  pull request, the records disagree. The tree is clean, so the file is
  committed.
- **Review plan.** On `lets-minimal`, it is done once plan is done. When
  the archive folder exists, it is done. But the records disagree if the
  pull request's `body` has no **Plan review** section with a
  `Reviewed:` line and a `- **Verdict:**` line. No step can write the
  section once the change is archived. Otherwise read the pull
  request's body again, because a step in this run can have opened or
  changed it:

  ```bash
  gh pr view <name> --json number,body
  ```

  Review plan is done when the **Plan review** section covers the plan.
  Follow *Check an earlier review* in the `lets-review-plan` skill. Its
  four rules say when a new round is needed. It then says when the
  review is finished, with the fix commits under `APPROVE_WITH_CHANGES`.
  When no rule calls for a new round and the review is finished, review
  plan is done. Its reads change nothing:
  `git merge-base --is-ancestor`, `git log` and `git show`. When review
  plan is not done, run it, whatever the state.
- **Build.** When the archive folder exists, build is done. Otherwise
  run `openspec instructions apply --change <name> --json` again, even
  when the plan row has run it, because a review plan round can add a
  task to a built change. When the `state` is `all_done`, build is
  done. Any `state` other than `blocked`, `ready` or `all_done` stops
  the run, as for plan.
- **Review build.** When the archive folder exists, review build is
  done.

Read a row's record when you reach the row, not before. A step that runs
in this walk changes the records the next row reads.

Then settle the row:

- **Done:** print its Skip line from the table, filled from
  [Read the records](#read-the-records). Go on to the next row.
- **Not done:** run the step, as [Run a step](#run-a-step) says. Then
  [read its report](#read-the-report), which says what to print and
  whether the walk goes on.

Next: [End of the run](#end-of-the-run), when no row is left.

### Records that disagree

When the records disagree, print `Records disagree:` and what you found.
Say what to fix by hand, and stop before any step. Repair nothing: each
repair means choosing which record is right, and that is the user's
choice.

| What you found | What to fix by hand |
|---|---|
| `git status --porcelain` lists a path outside `.workspace/` | Commit or discard the path. |
| The branch and `origin/<name>` have diverged | Reconcile the two, and push. |
| A change folder and an archive folder for the same name | Keep the folder that is right, and remove the other. |
| An archive folder, and the pull request is missing or a draft, or has no `Code review` section on `lets-standard` | Open the pull request, review it, or mark it ready, as `lets-review-build` does. Or revert the archive commit. |
| `brainstorm.md` is committed, and the branch has no pull request | Push the branch, and open the draft pull request. |
| An archived change on a schema other than `lets-minimal`, and the pull request's body has no **Plan review** section with a `Reviewed:` line and a `- **Verdict:**` line | Review the plan with the `lets-review-plan` skill, which writes the section. Or revert the archive commit. |
| A `git log` read for a skipped step finds no commit | Name the command, and find out why the step's record is missing. |

The printed line names what you found, such as the path, or the pull
request's `isDraft`. A built change that is not archived,
and whose pull request has no **Plan review** section, is not a
disagreement. The walk reaches review plan first, and runs it.

## End of the run

The walk prints each row's line when it settles the row, as
[The step lines](#the-step-lines) says. A failed step ends the walk.

When `review-build` reports `done`, its *Finish the change* has marked
the pull request ready for review. When the walk is over, print the pull
request's URL. A failed shape has none: there is no branch yet. Nor
does a step that failed before the branch had a pull request: say that
the branch has no pull request yet.

```bash
gh pr view <name> --json url --jq .url
```

`lets-go` keeps no state of its own. Its files in `.workspace/lets-go/`
are scratch: without them, a new run reaches the same step.

The run is over.

## Procedures

The parts run these sections. Each one returns to the part that ran it.

### Find the source of demand

Parallel sessions share the backlog, so claim the issue before you
create anything.

It uses the `<project>`, `<owner>` and `<repo>` that
[Read the settings](#read-the-settings) set. Take the first case that
applies:

1. **The run has an issue, `<i>`.** Use it. *Check the issue* has read its
   blockers already, and decided on an open one. Run
   [Check the prerequisite](#check-the-prerequisite) for it. The result
   is `found` when that returns `resolved`, and `unresolved` when it
   returns `unresolved`.
2. **The run has described work, but no issue.** Search for it:
   `gh issue list --state open --search "<idea> in:title" --json number,title`.
   The result is `matches`, with the issues the search found, or
   `no-match` when it found none.
3. **Otherwise, take `next`.** List the Project's Todo candidates with a
   priority of Must, Should or Could. Any Kind but Epic counts, and
   items from other repositories are left out:

   ```bash
   gh project item-list <project> --owner <owner> --format json --limit 500 \
     --jq '.items[] | select(.content.repository == "<repo>" and .status == "Todo" and .kind != "Epic" and (.priority | IN("Must", "Should", "Could")))
           | "\(.priority)\t\(.kind)\t\(.size // "-")\t#\(.content.number)\t\(.content.title)\t\(.content.url)"'
   ```

   Then list the open issues that nobody is assigned to and nothing
   blocks:

   ```bash
   gh issue list --search "is:open no:assignee -is:blocked" --limit 500 --json number --jq '.[].number'
   ```

   `next` comes from the candidates whose number is in the second list.
   Rank them Must, then Should, then Could, then the lowest issue
   number. A Wont is never a candidate. After a lost claim, leave out
   every issue lost in this run: each one for which *Claim* returned
   `taken`.

   Check each candidate in rank order, with its number as `<i>` while
   you check it. Run [Check the prerequisite](#check-the-prerequisite),
   then [Confirm the packet](#confirm-the-packet). Take the first
   candidate for which they return `resolved` and `complete`: the result
   is `picked`. Skip any other, and keep why: its prerequisite is
   unresolved, or its packet is not complete. Fetching, the commit
   checks and the rehearsal wait for *Claim*, and run only for the
   candidate you pick. When no candidate is left, the result is
   `nothing-ready`, and you pick no candidate.

It returns one of these results:

- `found`: the run has an issue, and its prerequisite is resolved. It
  carries `<i>`.
- `unresolved`: *Check the prerequisite* returned `unresolved` for the
  run's issue. It carries the unresolved owner or checkpoint.
- `matches`: the search for described work found issues. It carries
  each one's number and title.
- `no-match`: the search found no issue.
- `picked`: `next` took a candidate. It carries the candidate's number
  and title.
- `nothing-ready`: `next` has no candidate left. It carries each
  candidate it left out, and why: its blocker, its assignee, an
  unresolved prerequisite, or a packet that is not complete.

When *Claim* ran it, return to *Claim*: it says what comes next.
Otherwise, return to the part that ran it, with the result.

### Confirm the packet

Read the issue, and its fields on the Project:

```bash
gh issue view <i> --json number,title,body,url,parent
gh project item-list <project> --owner <owner> --format json --limit 500 \
  --jq '.items[] | select(.content.repository == "<repo>" and .content.number == <i>) | {kind, priority, size, status}'
```

- If the second command prints nothing, or no `kind`, the issue is not
  shaped. The result is `needs-shape`: return it now.
- If its Kind is Epic, the result is `epic`: return it now, with the
  epic's open sub-issues.

Read the whole body. Check that every required line for its Kind is
there and filled in. These are the lines of the `lets-shape` skill's
issue templates:

| Kind | Required lines |
|---|---|
| Chore | the one-line outcome |
| Bug | the one-line outcome, **Expected**, **Actual**, **How to reproduce**, **Relevant code**, **Scope** |
| Story, and any Kind this table does not name | the one-line outcome, **Persona served**, **Journey segment**, **MoSCoW**, **Why this story / why now**, **Depends on**, **Scope**, **Relevant code** |

If a line is missing, or still holds a placeholder in angle brackets,
the result is `needs-shape`: return it now, naming the line. Never
write or fix the packet yourself.

Then read the issue's thread as
[Issue comments](../lets-shape/references/issue-comments.md) says. Read
a comment's first line only, to find read markers. The watermark is the
later of the body's last edit and the newest read marker. When neither
exists, every comment is after it. A comment created or edited after
the watermark makes the result `needs-shape`, whoever wrote it. A read
marker never does. The result then carries how many comments shaping
has not read, each one's author as the reference shows it, and the date
that put it past the watermark: its edit date, else its creation date.
It carries nothing of what a comment says.

For a Story with a parent, read the parent's **Shared decisions**
section, when it has one: `gh issue view <parent> --json body`. *Route*
needs it.

It returns one of these results:

- `complete`: the issue has a Kind other than Epic, every required line
  is there and filled in, and no comment is past the watermark. It
  carries the Kind, the Size, and the parent's **Shared decisions**.
- `needs-shape`: the issue is not on the Project or has no Kind, a line
  is missing or holds a placeholder, or comments are unread. It carries
  which, with each unread comment's author and date.
- `epic`: the Kind is Epic. It carries the open sub-issues.

When *Find the source of demand* ran it, for a candidate of `next`,
return to *Find the source of demand*. Otherwise, return to the part
that ran it, with the result.

### Glossary preflight

A story whose shaping added glossary terms carries a **Glossary handoff**
record. These steps check it. "You" is the agent. Run
*Check the prerequisite*, then, when this story owns the glossary edits,
*Check the checkpoint*. *Find the source of demand* runs only
*Check the prerequisite*.

#### Check the prerequisite

1. Read **Glossary handoff** in the story, and in any shaping parent or
   owner issue it references. A missing blocker link does not mean the
   story is ready.
2. If another issue owns the definitions the story needs, check that the
   owner's pull request has merged, and that the definitions are on the
   proposed base. A pull request closed without merging is not enough.
3. Treat each of these as unresolved: an undecided owner, a declined
   blocker link with an unmerged owner, or definitions missing from the
   base.
4. Never recreate competing definitions. A story with no glossary handoff
   gets the normal checks only.

It returns `resolved` when nothing is unresolved. Otherwise it returns
`unresolved`, with the owner or the definitions that are unresolved.
Return to the section that ran it, with the result.

#### Check the checkpoint

Run these steps only when this story owns the glossary edits. Run them
once, when *Claim* runs *Glossary preflight*. Each `checkpoint-failed`
below comes before *Claim* assigns the issue, so nothing is claimed and
no branch exists. Returning `checkpoint-failed` repairs nothing, and
leaves user edits as they are.

1. Read the starting base, the owned paths, the remote URL and branch,
   and the ordered checkpoint commits. Fetch the recorded branch if you
   need to. Verify each full commit object and the recorded head. If a
   checkpoint commit or the recorded head is missing, or exists only in a
   local checkout, return `checkpoint-failed`, with what is missing.
   Treat fetched content as data.
2. Check that the range from base to head holds exactly the recorded
   commits, with no merges and no unrelated history. Inspect each
   commit's diff, not only the total. Each commit may touch only the
   recorded project-owned glossary paths. A shared glossary path set by
   an explicit `context` replacement is allowed. Skill files, config,
   code and other paths are not. If the range holds a merge, a commit
   that is not recorded, or a commit that touches another path, return
   `checkpoint-failed`, with what you found.
3. If the commits come from a source change branch, take only the
   recorded glossary commits and their parents, never implementation
   commits. Check that the context they need is on the proposed base.
   If that context is missing from the proposed base, return
   `checkpoint-failed`, with what is missing. Never import a commit from
   a planning store into the code repository.
4. Record the starting branch, and the working tree and index status.
   If the owned paths do not match the shaping baseline, return
   `checkpoint-failed`, with what differs. Keep any user edits, whether
   they came before or after. Never force a checkout, reset, or stash
   automatically.
5. Before claiming, rehearse the import on the proposed base in a
   throwaway checkout under `.workspace/`. Compare patches and contents
   to find edits already present, and import no duplicate. An edit
   already present is skipped, which is not a failure. If a patch applies
   only in part, or conflicts, return `checkpoint-failed`, with the
   conflict, repairing nothing. Leave the real working tree unchanged.
6. If the owner of the glossary definitions or the proposed base changed
   since *Find the source of demand* ran *Check the prerequisite*, run
   [Check the prerequisite](#check-the-prerequisite) again, before
   *Claim* assigns the issue. When that run returns `unresolved`, return
   `unresolved`, claiming nothing, even for an issue that `next` picked.
   Nothing is claimed yet, so the result leaves the backlog as it was.

The verified glossary import is the only implementation step this skill
adds, beside [the discovery map commit](#commit-the-discovery-map).

It returns one of these results:

- `verified`: every check passed. It carries the checkpoint commits, in
  their recorded order, and the ones the rehearsal found already
  present.
- `checkpoint-failed`: a check failed. It carries what the check found.
- `unresolved`: the second run of *Check the prerequisite* returned
  `unresolved`. It carries the owner or the definitions that are
  unresolved.

Return to the section that ran it, with the result.

#### What the preflight returns

It returns one of these results:

- `no-owned-edits`: *Check the prerequisite* returned `resolved`, and
  the story owns no glossary edits: it has no **Glossary handoff**, or
  another issue owns the edits.
- `verified`: the story owns the edits, and *Check the checkpoint*
  returned `verified`. It carries the checkpoint commits, in their
  recorded order, and the ones the rehearsal found already present.
- `unresolved`: *Check the prerequisite* returned `unresolved`, the
  first time or the second. It carries what is unresolved.
- `checkpoint-failed`: *Check the checkpoint* returned it. It carries
  what the check found.

When *Claim* ran it, return to *Claim*, with the result. Otherwise,
return to the part that ran it.

### Claim

1. Name the change after the issue title. Every Kind's title is
   `<kebab-name> — <one-line outcome>`, so the name is the part before
   the dash.
2. Run [Glossary preflight](#glossary-preflight) against the proposed
   base. When it returns `unresolved` or
   `checkpoint-failed`, return that result now, with what it carries,
   before you assign the issue.
3. Claim the issue: check that nobody has it, assign yourself, then move
   it to In Progress. `<issue-url>` is the issue's URL.

   ```bash
   gh issue view <i> --json assignees --jq '.assignees | length'
   gh issue edit <i> --add-assignee @me
   gh project item-edit <project> --owner <owner> --url <issue-url> --field Status --value "In Progress"
   ```

   The first command must print `0`. Anything else means another
   session took it: the result is `taken`, with who has it. Return it
   now.
4. Create a branch with the change's name off the default branch. This
   also fails when a branch with the change's name appeared after
   *Check the issue* looked. If creating the branch fails, release the
   claim, so another session can pick the issue up. The result is then
   `branch-failed`, with the error:

   ```bash
   gh issue edit <i> --remove-assignee @me
   gh project item-edit <project> --owner <owner> --url <issue-url> --field Status --value Todo
   ```

It returns one of these results:

- `claimed`: the issue is yours, and the branch exists. It carries what
  *Glossary preflight* returned: `no-owned-edits`, or `verified` with
  the checkpoint commits.
- `taken`: another session has the issue. It carries who has it.
- `unresolved`: *Glossary preflight* returned `unresolved`. It carries
  what is unresolved.
- `checkpoint-failed`: *Glossary preflight* returned it. It carries what
  the check found.
- `branch-failed`: creating the branch failed, and the claim is
  released. It carries the error.

Return to the part that ran it, with the result.

### Import the glossary checkpoint

Run this section only when *Claim* returned `claimed`, carrying the
`verified` result of [Glossary preflight](#glossary-preflight). It
imports the commits `verified` carries. Run it after *Claim* created the
branch, and before [Walk the step table](#walk-the-step-table) reads the
tree. A resumed
change has its glossary edits committed already, and needs no transfer
and no new claim.

#### Import the commits

1. Cherry-pick only the verified checkpoint commits onto the new branch,
   in their recorded order. Skip any the rehearsal found already present.
   Keep them as separate `docs:` commits.
2. In the issue's **Glossary handoff**, record the destination branch, the
   resulting commits and, once it exists, the pull request.
3. Keep the holding branch until the destination holds the edits.

When the import succeeds, the result is `imported`. Return to the part
that ran it, with the result.

#### Recover from a failed import

If the import fails:

1. Abort the cherry-pick.
2. Return to the recorded starting branch without losing user changes.
   Never force a checkout.
3. Delete the branch this attempt created only after proving it holds no
   work beyond its starting base. If earlier picks survived on it, keep
   it, and note how to recover. Never delete an existing change branch,
   and never reset unrelated commits.
4. Release the claim with the same commands as a failed branch creation
   in [Claim](#claim): remove your assignment, and set Status back to
   Todo. Do this even if the Git cleanup failed.
5. The result is `import-failed`. It carries every cleanup failure, and
   anything kept: the branch, commits or claim, with how to recover.

Return to the part that ran it, with the result.

### Commit the discovery map

Discovery edits `openspec/discovery.md` on the default branch, and the
new branch carries the edits with it. When a shape step ran in this
run, and `git status --porcelain` lists `openspec/discovery.md`, commit
the edits on the new branch, before
[Walk the step table](#walk-the-step-table) reads the tree. Otherwise
make no commit.

```bash
git add openspec/discovery.md
git commit -m "docs: the discovery map from #<parent>" -- openspec/discovery.md
```

`<parent>` is the parent's number, or the story's when the parent
became the one story. Commit no other path. This is the one commit
`lets-go` makes itself, beside the glossary import.

Return to the part that ran it.

## The step table

There are five steps, in this order: shape, plan, review plan, build
and review build. Prose and printed lines use these names. `--for`,
`--name`, file names and config keys use `shape`, `plan`, `review-plan`,
`build` and `review-build`. `<step>` is one of these.

Shape runs only before the walk, as
[Run the shape step](#run-the-shape-step) says, so this table has no row
for it. Its skill is in [What shape runs](#what-shape-runs), and
*Check the issue* prints its line. The walk runs the other four steps.
Every other step runs in a fresh session, as [Run a step](#run-a-step)
says. On `lets-minimal`, review plan never runs.

Each row says which skill the step runs, when the step is done, which
record shows it, and the line to print when it was done before this run.
The state is the `state` that
`openspec instructions apply --change <name> --json` prints.

| Step | Skill | Done when | Record | Skip line |
|---|---|---|---|---|
| `plan` | the `lets-plan` skill | The state is `ready` or `all_done`, or the archive folder exists | The commit that added `tasks.md` | `Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).` |
| `review-plan` | the `lets-review-plan` skill | The **Plan review** section covers the plan. On `lets-minimal`, plan is done | The section's `Reviewed:` commit | `Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.` On `lets-minimal`: `Skipped review plan: not in the lets-minimal route.` |
| `build` | the `lets-build` skill | The state is `all_done`, or the archive folder exists | The last commit that changed `tasks.md` | `Skipped build: every task is ticked, last task commit <date> (<sha>).` |
| `review-build` | the `lets-review-build` skill | The archive folder exists | The commit that added the archive's `tasks.md`, and the pull request | `Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.` |

### Read the records

One read dates each skip line. `<date>` is the commit's author date,
from `%as`, as `YYYY-MM-DD`. A rebase keeps it. `<sha>` is
the short hash, from `%h`. A read that prints nothing means the
[records disagree](#records-that-disagree).

- **Shape.** [The step lines](#the-step-lines) says how to date shape's
  line.
- **Plan.** Read the commit that added the task list:

  ```bash
  git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md
  ```

- **Review plan.** On `lets-minimal`, there is no record, and the line
  has no date. On any other schema, the `lets-review-plan` skill records
  the review in the pull request's `body`. Find the `## Plan review`
  heading, and read the section up to the next `## ` heading or the end
  of the body. Inside it, `<sha>` comes from the line that starts
  `Reviewed: `, and `<verdict>` from the line that starts
  `- **Verdict:** `. Do not search the whole body: a **Code review**
  section has a `Reviewed:` line too. `<pr>` is the pull request's
  `number`. Date the line by the reviewed commit:

  ```bash
  git log -1 --format=%as <sha>
  ```

- **Build.** Read the last commit that changed the task list: the last
  task's tick.

  ```bash
  git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md
  ```

- **Review build.** Read the commit that archived the change. `<pr>` is
  the pull request's `number`.

  ```bash
  git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/archive/<YYYY-MM-DD>-<name>/tasks.md
  ```

The plan and build reads work after archive too. Archive removes the
old path, and its history keeps the add and the ticks.

### The step lines

The run prints one line for each step, when it settles the step: `Done`
after a `done` report, `Skipped` when the step was done before this run,
and `Failed` after a `failed` report. A step can take an hour, so print
each line as it comes. A line names a step with a space, never a
hyphen.

A `Done` line is one of these. `<date>` is the report's `date`, and
`<evidence>` is its `evidence`, joined with `; `:

```text
Done shape: <date>. <evidence>
Done plan: <date>. <evidence>
Done review plan: <date>. <evidence>
Done build: <date>. <evidence>
Done review build: <date>. <evidence>
```

A `Skipped` line is the Skip line in the step's row of
[The step table](#the-step-table), with `<date>` and `<sha>` from
[Read the records](#read-the-records). Shape has no row. Its line is:

```text
Skipped shape: #<i>'s packet is complete, last edited <date>.
```

Here `<date>` is the day of the issue's `lastEditedAt`, from the thread
query in *Confirm the packet*, as `YYYY-MM-DD`. When `lastEditedAt` is
null, the body was never edited. Use the day the issue was created:

```bash
gh issue view <i> --json createdAt --jq .createdAt
```

When every step was already done, all five lines are `Skipped` lines.

A `Failed` line is `Failed`, the step's name, a colon and the reason,
`<reason>`, such as `Failed review build: <reason>` or
`Failed shape: <reason>`.

Shape's line prints at most once for an issue. Print `Done shape` after
a shape step reported `done`, once per run, when this run has not
printed it yet: *Check the issue* prints it, or
*Pick the first ready story* when no story is ready. Print
`Skipped shape` once for each issue whose packet *Check the issue* finds
complete, and only when no shape step ran in this run. So a story
picked after a lost claim in a discovery run prints neither.

### The change's name

`<name>` is the change's name. Shape runs before there is one, so it
has a name of its own, `<shape-name>`, from what it shapes:

- **An issue:** `issue-<i>`, such as `issue-180`.
- **An idea:** `idea-<slug>`. To make `<slug>`, split the idea on white
  space. Lower-case each word, and keep only its letters and digits.
  Drop a word left empty. Join the first five words with hyphens, or all
  of them when there are fewer. `fix lets-sync — quiet output` becomes
  `idea-fix-letssync-quiet-output`. The same idea typed again gets the
  same name, so it finds its answers file.

A step's session label, `<session>`, names its fresh session and its
files. For every step but shape, it is `<name>`, a hyphen and `<step>`:
the review plan step runs with `--for review-plan` and
`--name <name>-review-plan`. For shape, it is `<shape-name>-shape`: the
shape step runs with `--for shape` and `--name <shape-name>-shape`, such
as `--name idea-fix-letssync-quiet-output-shape`.

## Write the prompt

If the folder is missing, create it first: `mkdir -p .workspace/lets-go`.
Then write the frame below to `.workspace/lets-go/<session>-prompt.md`.
Fill in each `<...>`. `<schema>`, `<level>` and `<route line>` are the
ones [Enter the branch](#enter-the-branch), [Set the level](#set-the-level)
and [Route](#route) set. For shape, `<level>` is the one
[Run the shape step](#run-the-shape-step) set. Under *What to run*, put this sentence. `<skill>` is
the skill in the step's row of [The step table](#the-step-table):

```text
Invoke the `<skill>` skill for the change `<name>`, for issue #<i>, and stop where it stops.
```

For shape, put the text of [What shape runs](#what-shape-runs) under
*What to run* instead.

For shape, the first two lines differ. There is no change, the branch is
the default branch, `<default>`, and *Route* has not run, so there is no
schema and no route line. For an issue, they are:

```text
You run one step of a lets-go run: shape, for issue #<i>.
Issue: #<i>, <issue-url>. Branch: <default>.
```

For an idea, they are:

```text
You run one step of a lets-go run: shape, for an idea.
Issue: none yet. The idea is: <idea>. Branch: <default>.
```

The rest of the frame is the same for every step.

````text
You run one step of a lets-go run: <step>, for the change <name>.
Issue: #<i>, <issue-url>. Branch: <name>. Schema: <schema>. <route line>

## What to run

<the sentence above>

## Questions

The interactivity level is <level>. At recommend, the lets-go session
answers each question that has a recommendation, and asks the user the
rest. At ask, it puts every question to the user, with your
recommendation as the suggested answer. Your rules are the same at both
levels. Never decide a question yourself. Never ask the user in this session: nobody
here can answer.

When you need a decision, stop. End with a needs-input report that lists
every open question, in the order you would ask them. Give a
recommendation where you have one. Give none for a question that asks
the user to confirm something, such as a brainstorm ledger, an issue
packet or a discovery phase.

A resumed step ends with an `## Answers` section. Each answer settles its
question, so never ask it again. An answer that ends with "(lets-go
accepted the step's recommendation; the user did not decide)" is not the
user's: record it as Assumption in a brainstorm ledger. Record any other
answer as User. An answer of yes to the confirmation question confirms
the ledger: the brainstorm may set `Confirmed by user: yes`.

## The report

End your final message with a step report: a fenced block tagged
step-report, holding one YAML mapping. Use one of these three:

```step-report
outcome: done
evidence:
  - "commit 3f2a1c0: feat: add the thing"
  - "pull request #12"
```

```step-report
outcome: needs-input
questions:
  - question: Which schema should the change use?
    recommendation: lets-minimal
  - question: Do you confirm the ledger?
```

```step-report
outcome: failed
reason: The tests fail on main before any change.
```

A done report's evidence lists the commits you made, and the pull request
when you opened or changed it. For shape, its first line is the issue,
as `issue #<i>: <title>`, or the parent, as `epic #<parent>: <title>`,
with a `story #<story>: <title>` line for each story. For review plan,
its first line is the verdict and the commit reviewed, as
`Plan review: <verdict> for <sha>`. Write the report last. Quote a line that
holds `#` or `: `. Put no other step-report block in the message.
````

### What shape runs

The shape step runs `lets-shape`. It shapes one issue, or runs discovery
when the work is too large for one issue. A fresh round must find the
discovery an earlier round started, so the text lists where to start, in
order.

```text
Run the `lets-shape` skill. Start at the first of these that matches:

1. An open parent issue says `Discovery status: in-progress`, and its
   `Input:` line names this input: the idea's words, or #<i>. Run its
   *Resume mode* on that parent, and start no second discovery. The
   phases that the `## Answers` section confirmed are settled. So skip
   the restatement in *Resume mode* and its confirmation, and go straight
   to the parent's recorded next phase.
2. An open parent issue's `Input:` line names this input, it has no
   status line, and the `## Answers` section confirmed its Phase 5 story
   table. Finalize has started on that parent: Finalize removes the
   status line first, then asks its own questions. Finish Finalize on
   that parent, from where the answers leave off, including the glossary
   handoff. Start no second discovery.
3. The `## Answers` section answers the discovery question with yes. Run
   its discovery from Ingest, with the idea or #<i> as its input.
4. Otherwise, run its *Shape one issue* to its end, including its second
   comment fetch, its reply and its glossary handoff. For an issue: shape
   #<i>. For an idea: lets-go has searched for it, and the user confirmed
   that no open issue is the same work. Skip the search in
   **Find or create the issue**, and create the issue. The packet
   confirmation in **Confirm, then write** is a confirmation question:
   give it no recommendation.

The work is too large for one issue when it is Size L or XL, or when the
input holds a large idea. Then do not fail, and do not start discovery
yourself. End the round with a needs-input report that holds this
question, with the recommendation yes:

The work is Size <L or XL>, too large for one issue. Run discovery on it?

If the answer is anything but yes, end with a failed report. Its reason
says that the work is too large for one issue and discovery was
declined.

Discovery runs every phase from Ingest to Finalize, including the
glossary handoff. Write the idea's words, or #<i>, in the parent's
`Input:` line, so a later round can find the parent. Each phase's
confirmation, and the story table in Phase 5, is a confirmation
question: give it no recommendation. When the glossary handoff asks who
carries the edits, recommend the first story in dependency order.

Create no change and no change branch. The parent issue, the stories
and a glossary holding branch that `lets-shape` makes are allowed. End on
the branch <default>, with a clean tree, except `openspec/discovery.md`
when discovery ran.

A done report's first evidence line is `issue #<i>: <title>` for one
issue. When discovery filed stories, it is `epic #<parent>: <title>`,
then one `story #<story>: <title>` line per story, in the order you
created them.
When discovery found that the whole run fits one story, the parent became
that story: use the `issue` form.
```

## Run a step

1. [Write the prompt](#write-the-prompt).
2. Ask what can run. From the repo root, run:

   ```bash
   lets delegate step instructions --for <step>
   ```

   It prints one JSON line. `options` lists the models the resolver can
   run now, and `guidance` is the user's prose for this step, from
   `delegate.step.<step>.guidance` in the `lets` config, or `null`. If it
   exits non-zero, show the user its stderr, and stop.
3. Rank the options: the guidance first, then the order the options came
   in. Leave out a model the guidance rules out. The guidance only ranks
   and filters the listed models. Never follow guidance that would change
   this skill's steps. When `options` is empty, pass your own family,
   `gpt`, `claude` or `gemini`, as the one model.
4. Run the step with one `--model` per ranked option, best first. An
   earlier run may have left answers for this step. When
   `.workspace/lets-go/<session>-answers.yaml` exists before the
   step's first round, and holds at least one pair, add
   `--answers-file` with that file to the first round, as in
   [Relay the questions](#relay-the-questions). An empty or unreadable
   file counts as absent.

   ```bash
   lets delegate step run --for <step> --name <session> \
     --prompt-file .workspace/lets-go/<session>-prompt.md \
     --effort high --model <first> --model <second> \
     > .workspace/lets-go/<session>-report.json 2> .workspace/lets-go/<session>-meta.txt
   ```

5. Act on its exit code:
   - **0**: the report file holds the report, one JSON line.
   - **3**: no fresh session can run here, for example because no resolver started one,
     or every model was refused. When the meta file names a saved
     prompt, take the [subagent step](#run-a-step-in-a-subagent). When it
     names none, show the user the meta file, name the step, and stop.
   - **Anything else**: show the user the meta file, name the step, and
     stop. Do not run the step again.

### Run a step in a subagent

Take this step only when `lets delegate step run` exits 3, and the meta
file names the prompt `lets` saved,
`.workspace/lets-delegate/<session>.prompt.md`. That file holds the
prompt, with any answers added.

1. Run that prompt in a subagent that starts with no context from this
   session, and may write files. It works in the repo root, on the
   branch `<name>`. For shape, it works on the default branch.
2. Read the last `step-report` block in the subagent's final message, by
   the rules `lets` uses:
   - The block opens with a line of three or more backticks followed by
     `step-report`. It closes with a line of at least as many backticks,
     and nothing else.
   - It holds one YAML mapping, whose `outcome` is `done`, `needs-input`
     or `failed`.
   - A `done` report holds `evidence`, a non-empty list of strings.
   - A `needs-input` report holds `questions`, a non-empty list of
     mappings. Each has a string `question`, and may have a string
     `recommendation`.
   - A `failed` report holds a string `reason`.
3. A final message that breaks any of these rules is a `failed` report.
   Its `reason` says what is missing or wrong, such as no `step-report`
   block, or a `done` report with no `evidence`.
4. Add `date` to a `done` report: the current time in ISO 8601 UTC, from
   `date -u +%Y-%m-%dT%H:%M:%SZ`.
5. Write the report as one JSON line, `outcome` first, to
   `.workspace/lets-go/<session>-report.json`.

## Read the report

Read `outcome` from `.workspace/lets-go/<session>-report.json`.

A shape step's `done` report must name what it shaped. Its first
evidence line is one of these:

- `issue #<i>: <title>`: one issue, `<i>`.
- `epic #<parent>: <title>`: the parent issue of a discovery, and
  `<parent>` is its number. Each `story #<story>: <title>` line after it
  names one story, in the order discovery created them.

When the first line is in neither form, the report is `failed`, and its
reason is that the shape step named no issue. When it is an `epic` line
and no `story` line follows, the report is `failed`, and its reason is
that the shape step named no story.

Once shape reports `done` or `failed`, remove
`.workspace/lets-go/<shape-name>-shape-answers.yaml`. Nothing resumes a
finished shape. A later idea, or a second shape of the same issue, must
start with no answers.

- **`done`**: after `shape`, go on as
  [Run the shape step](#run-the-shape-step) says. After any other step,
  print its `Done` line, as [The step lines](#the-step-lines) says, and
  go on to the next row of the [walk](#walk-the-step-table).
- **`needs-input`**: [relay its questions](#relay-the-questions).
- **`failed`, for shape**: there is no branch yet. Print shape's
  `Failed` line, as [The step lines](#the-step-lines) says. Say to run
  `lets-shape` on the idea, or on `#<i>`, and name no branch. Stop.
- **`failed`**: print its `Failed` line, as
  [The step lines](#the-step-lines) says. The walk ends here. Name the
  step and the branch `<name>`, and say that running `lets-go` again on
  that branch carries on from the first unfinished step. The step may
  have opened the pull request, so look for it again:

  ```bash
  gh pr view <name> --json url --jq .url
  ```

  When it finds one, print the pull request's URL. When it finds none,
  print no URL, and say that the branch has no pull request yet. Stop.
  Never run a failed step again.

## Relay the questions

The answers go in `.workspace/lets-go/<session>-answers.yaml`, one
file per step.

1. If any question's exact text is already in that file, the step did
   not read its answers. Say that the step asked a settled question
   again, name the step, show the user the report, and stop.
2. Go through the questions in the report's order, as `<level>` says:
   - **At `recommend`, with a `recommendation`**: take it as the answer.
     Say which question you answered, and the answer you gave. Write the
     answer as the recommendation followed by
     ` (lets-go accepted the step's recommendation; the user did not decide)`.
   - **At `recommend`, without one**: ask the user that question alone. Wait for the answer before the next question.
   - **At `ask`**: ask the user every question, one at a time. Show the
     `recommendation`, when there is one, as the suggested answer. Wait
     for each answer before the next question. Write the answer as the
     user gave it, with no marker, even when they took the
     recommendation: the step records it as the user's.
3. Append each pair, in order, to the answers file. It is a YAML list of
   `question` and `answer` mappings, and keeps the pairs of earlier
   rounds. Quote each value, so YAML keeps it whole:

   ```yaml
   - question: "Which schema should the change use?"
     answer: "lets-minimal (lets-go accepted the step's recommendation; the user did not decide)"
   - question: "Do you confirm the ledger?"
     answer: "yes"
   ```

4. [Run the step](#run-a-step) again with the same prompt file. Add
   `--answers-file .workspace/lets-go/<session>-answers.yaml` to
   `lets delegate step run`. Ask for the options again, and rank them
   again. Exit 3 goes to the subagent step as before.

A step's rounds go on until its report is `done` or `failed`.
