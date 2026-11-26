## Purpose

Says what `lets go step-prompt` prints: the prompt for one step of a `lets-go` run, or for an epic run's story run, built from the values `lets-go` passes as flags, so that no skill copies a prompt frame by hand.

## ADDED Requirements

### Requirement: lets go step-prompt prints a walk step's prompt
`lets go step-prompt --for <step>`, where `<step>` is `plan`, `review-plan`, `build` or `review-build`, SHALL take `--name <name>`, `--issue <i>`, `--issue-url <issue-url>`, `--schema <schema>`, `--route <route line>` and `--questions <mode>`, each required. It SHALL print the step's prompt on stdout and exit 0. The prompt's first line SHALL be `You run one step of a lets-go run: <step>, for the change <name>.` Its second line SHALL be `Issue: #<i>, <issue-url>. Branch: <name>. Schema: <schema>. <route line>`. Its sections SHALL follow in this order: `## What to run`, then `## Stack` when the story is stacked, then `## Writing`, `## Questions` and `## The report`. `## What to run` SHALL hold one sentence, ``Invoke the `<skill>` skill for the change `<name>`, for issue #<i>, and stop where it stops.``, where `<skill>` is `lets-plan` for plan, `lets-review-plan` for review plan, `lets-build` for build and `lets-review-build` for review build. The prompt SHALL name no other skill, and no section of a skill.

#### Scenario: The plan prompt
- **WHEN** the user runs `lets go step-prompt --for plan --name lets-go-chore --issue 149 --issue-url https://github.com/o/r/issues/149 --schema lets-minimal --route "Route: lets-minimal, because #149 is a Chore." --questions auto`
- **THEN** it exits 0, the first line of stdout is `You run one step of a lets-go run: plan, for the change lets-go-chore.`, the second is `Issue: #149, https://github.com/o/r/issues/149. Branch: lets-go-chore. Schema: lets-minimal. Route: lets-minimal, because #149 is a Chore.`, and `## What to run` holds only ``Invoke the `lets-plan` skill for the change `lets-go-chore`, for issue #149, and stop where it stops.``

#### Scenario: The build prompt names only lets-build
- **WHEN** the user runs `lets go step-prompt --for build` for a change on `lets-standard`
- **THEN** stdout names `lets-build`, and names neither `lets-review-plan` nor `lets-review-build`

#### Scenario: The review build prompt
- **WHEN** the user runs `lets go step-prompt --for review-build --name lets-go-story --issue 152` with the other required flags
- **THEN** `## What to run` names the `lets-review-build` skill for `lets-go-story` and `#152`, and stdout names no `lets-build`

#### Scenario: The review plan prompt
- **WHEN** the user runs `lets go step-prompt --for review-plan --name lets-go-story --issue 152` with the other required flags
- **THEN** `## What to run` names the `lets-review-plan` skill for `lets-go-story`, the second line names `#152` and the route line, and stdout names no `lets-build`

#### Scenario: The sections' order
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags and no stack flags
- **THEN** the `##` headings of stdout are, in order, `## What to run`, `## Writing`, `## Questions` and `## The report`

### Requirement: lets go step-prompt prints the shape prompt for an issue or an idea
`lets go step-prompt --for shape` SHALL take `--branch <default>` and `--questions <mode>`, each required, and exactly one of `--issue <i>`, with `--issue-url <issue-url>`, or `--idea <idea>`. Its sections SHALL be those of a walk step's prompt, without `## Stack`. Its prompt names no schema and no route line.

- For an issue, the first line SHALL be `You run one step of a lets-go run: shape, for issue #<i>.`, the second `Issue: #<i>, <issue-url>. Branch: <default>.`, and `## What to run` SHALL hold only ``Invoke the `lets-shape` skill for issue #<i>, and stop where it stops.``
- For an idea, the first line SHALL be `You run one step of a lets-go run: shape, for an idea.`, the second `Issue: none yet. The idea is: <idea>. Branch: <default>.`, with the idea word for word, and `## What to run` SHALL hold only ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.``
- With `--searched`, which only an idea takes, the second line SHALL end with ` Open issues were searched, and none is the same work.`

The prompt SHALL name no section of `lets-shape`.

#### Scenario: The shape prompt for an issue
- **WHEN** the user runs `lets go step-prompt --for shape --issue 180 --issue-url https://github.com/o/r/issues/180 --branch main --questions ask`
- **THEN** it exits 0, the second line is `Issue: #180, https://github.com/o/r/issues/180. Branch: main.`, and `## What to run` holds only ``Invoke the `lets-shape` skill for issue #180, and stop where it stops.``

#### Scenario: The shape prompt for an idea
- **WHEN** the user runs `lets go step-prompt --for shape --idea "add a --quiet flag to lets sync" --branch main --questions auto`
- **THEN** the second line is `Issue: none yet. The idea is: add a --quiet flag to lets sync. Branch: main.`, and stdout holds no `Schema:` and no `Route:`

#### Scenario: An idea whose search ran
- **WHEN** the user runs the same command with `--searched`
- **THEN** the second line is `Issue: none yet. The idea is: add a --quiet flag to lets sync. Branch: main. Open issues were searched, and none is the same work.`

#### Scenario: The shape prompt names no part of lets-shape
- **WHEN** the user runs `lets go step-prompt --for shape` for an issue or an idea
- **THEN** stdout names no section of `lets-shape`, such as *Resume mode* or *Shape one issue*, and does not hold `Discovery status: in-progress` or `Run discovery on it?`

### Requirement: lets go step-prompt prints an epic run's story prompt
`lets go step-prompt --for story` SHALL take `--name <name>`, `--issue <i>`, `--issue-url <issue-url>`, `--parent <parent>`, `--checkout <path>`, `--schema <schema>`, `--route <route line>` and `--questions <mode>`, each required. Its first line SHALL be `You run a story run of a lets-go epic run: #<i>, for the change <name>, under #<parent>.` Its second line SHALL be `Issue: #<i>, <issue-url>. Branch: <name>. Schema: <schema>. <route line>`. Its sections SHALL follow in this order: `## What to run`, then `## Stack` when the story is stacked, then `## Questions` and `## The report`. It SHALL hold no `## Writing` section.

- `## What to run` SHALL tell the child to invoke the `lets-go` skill for this story run and stop where it stops. It SHALL say that the epic run has already claimed `#<i>`, routed it and checked the branch `<name>` out in the worktree `<path>`, which is the child's checkout and repository root, so the child claims nothing, routes nothing, stays on `<name>`, works only in `<path>`, and walks the step table.
- `## Questions` SHALL say that the question mode is `<mode>`, that the epic run applies it, so the child answers no step's question at either mode and passes each one up in its report with the step's recommendation, and that the child never asks the user in its session.
- `## The report` SHALL say to end with one step report, whose outcome is `done` with the pull request as its first evidence line, `needs-input` with the step's questions, or `failed` with the reason.

#### Scenario: The story prompt
- **WHEN** the user runs `lets go step-prompt --for story --name story-run-child-sessions --issue 284 --issue-url https://github.com/o/r/issues/284 --parent 278 --checkout .workspace/lets-go/worktrees/story-run-child-sessions --schema lets-standard --route "Route: lets-standard, because #284 is a Size M Story." --questions auto`
- **THEN** it exits 0, the first line is `You run a story run of a lets-go epic run: #284, for the change story-run-child-sessions, under #278.`, and stdout names `lets-standard`, `The question mode is auto.` and the worktree `.workspace/lets-go/worktrees/story-run-child-sessions`

#### Scenario: The story prompt's sections
- **WHEN** the user runs `lets go step-prompt --for story` with the required flags and no stack flags
- **THEN** the `##` headings of stdout are, in order, `## What to run`, `## Questions` and `## The report`

### Requirement: A stacked story's prompt holds a Stack section
`--blocker <blocker>`, `--blocker-branch <blocker-branch>` and `--blocker-pr <blocker-pr>` SHALL be given together or not at all. Every step but shape takes them, and so does `story`. With them, the prompt SHALL hold a `## Stack` section, right after `## What to run`. It SHALL say that the change is stacked on `#<blocker>`, and that its branch starts from `<blocker-branch>`, the branch of pull request `#<blocker-pr>`. It SHALL tell the step to open the draft pull request with `--base <blocker-branch>`, and to put the line `Stacked on #<blocker-pr>; merge that first.` on its own line after `Closes #<i>` in its description. It SHALL tell the step, when the pull request exists with another base, to fix it with `gh pr edit <name> --base <blocker-branch>`. Without them, the prompt SHALL hold no `## Stack` section.

#### Scenario: The plan step of a stacked story
- **WHEN** the user runs `lets go step-prompt --for plan --name epic-run-failures --issue 280` with the other required flags and `--blocker 279 --blocker-branch epic-run-skeleton --blocker-pr 290`
- **THEN** the `## Stack` section comes right after `## What to run`, and holds `#279`, `--base epic-run-skeleton`, `Stacked on #290; merge that first.` and `gh pr edit epic-run-failures --base epic-run-skeleton`

#### Scenario: The story prompt of a stacked story
- **WHEN** the user runs `lets go step-prompt --for story` with the required flags and `--blocker 282 --blocker-branch epic-run-resume --blocker-pr 293`
- **THEN** the `## Stack` section comes right after `## What to run` and holds `--base epic-run-resume` and `Stacked on #293; merge that first.`

#### Scenario: The same section in every prompt of the story
- **WHEN** the user runs `lets go step-prompt` for `story`, `plan` and `build` with the same change, issue and stack flags
- **THEN** the three `## Stack` sections are the same text

#### Scenario: A story that is not stacked
- **WHEN** the user runs `lets go step-prompt --for build` with the required flags and no stack flags
- **THEN** stdout holds no `## Stack` section

#### Scenario: Part of a stack
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags and `--blocker 279` only
- **THEN** it exits 2, stdout is empty, and stderr names `--blocker-branch` and `--blocker-pr`

### Requirement: The step prompt names the plain-language reference
For every step but `story`, the prompt's `## Writing` section SHALL name, as `Plain-language method: <path>.`, the absolute path of `.agents/skills/lets-shape/references/plain-language.md` under the repository root, which `git rev-parse --show-toplevel` gives from the folder the command runs in. When that file does not exist, the command SHALL exit 2, print nothing on stdout, and name the path on stderr. Outside a git repository, it SHALL exit 2, print nothing on stdout, and say on stderr that the folder is not in a git repository. `--for story` SHALL not read the file.

#### Scenario: The installed reference
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags in a subfolder of a repository whose root is `/w/repo` and which holds `.agents/skills/lets-shape/references/plain-language.md`
- **THEN** stdout holds `Plain-language method: /w/repo/.agents/skills/lets-shape/references/plain-language.md.`

#### Scenario: No installed reference
- **WHEN** the user runs `lets go step-prompt --for build` with the required flags in a repository with no `.agents/skills/lets-shape/references/plain-language.md`
- **THEN** it exits 2, stdout is empty, and stderr names `.agents/skills/lets-shape/references/plain-language.md`

#### Scenario: Outside a git repository
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags in a folder that is not in a git repository
- **THEN** it exits 2, stdout is empty, and stderr says the folder is not in a git repository

#### Scenario: A story prompt needs no reference
- **WHEN** the user runs `lets go step-prompt --for story` with the required flags in a repository with no plain-language reference
- **THEN** it exits 0

### Requirement: The step prompt says how the step asks
For every step but `story`, the prompt's `## Questions` section SHALL say the question mode, and what the `lets-go` session does with it. At `auto`, that session answers each question that has a recommendation, tells the user what it chose, and asks the user the rest. At `ask`, it puts every question to the user, with the step's recommendation as the suggested answer. The section SHALL say that the step's own rules are the same in both modes, that it never decides a question itself, and that it never asks the user in its session. When the step needs a decision, it stops and ends with a `needs-input` report that lists every open question, in order, with a `recommendation` where it has one. A question that asks the user to confirm something, such as a brainstorm ledger, an issue packet or a discovery phase, carries no recommendation. The section SHALL say how to read an `## Answers` section: each answer settles its question; an answer that ends with `(lets-go accepted the step's recommendation; the user did not decide)` is recorded as `Assumption` in a brainstorm ledger, and any other answer as `User`; an answer of yes to the confirmation question lets the brainstorm set `Confirmed by user: yes`.

#### Scenario: The prompt at auto
- **WHEN** the user runs `lets go step-prompt --for plan` with `--questions auto` and the other required flags
- **THEN** `## Questions` holds `The question mode is auto.`, and stdout names `needs-input`, `recommendation`, `## Answers`, `Assumption`, `User` and `Confirmed by user: yes`

#### Scenario: The prompt at ask
- **WHEN** the user runs `lets go step-prompt --for plan` with `--questions ask` and the other required flags
- **THEN** `## Questions` holds `The question mode is ask.`, says the `lets-go` session puts every question to the user, and still says to list every open question with a recommendation where the step has one

#### Scenario: A confirmation carries no recommendation
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags
- **THEN** `## Questions` says to give no recommendation for a question that asks the user to confirm a brainstorm ledger, an issue packet or a discovery phase

### Requirement: The step prompt gives the report rules
For every step but `story`, the prompt's `## The report` section SHALL say to end the final message with one step report: a fenced block tagged `step-report` that holds one YAML mapping. It SHALL show one example each of `outcome: done`, with `evidence`, `outcome: needs-input`, with `questions`, and `outcome: failed`, with `reason`. It SHALL say that a `done` report's evidence lists the commits made, and the pull request when the step opened or changed it. For shape, the first evidence line is `issue #<i>: <title>`, or `epic #<parent>: <title>` followed by a `story #<story>: <title>` line for each story. For review plan, the first line is `Plan review: <verdict> for <sha>`. It SHALL say to write the report last, to quote a line that holds `#` or `: `, and to put no other `step-report` block in the message.

#### Scenario: The report section
- **WHEN** the user runs `lets go step-prompt --for review-plan` with the required flags
- **THEN** `## The report` holds a block tagged `step-report` with each of `outcome: done`, `outcome: needs-input` and `outcome: failed`, and names `Plan review: <verdict> for <sha>`, `issue #<i>: <title>` and `epic #<parent>: <title>`

### Requirement: lets go step-prompt rejects flags that do not fit the step
`lets go step-prompt` SHALL exit 2, print nothing on stdout, and name the flag or value on stderr, in each of these cases:

- `--for` is missing, or is not `shape`, `plan`, `review-plan`, `build`, `review-build` or `story`.
- A flag the step requires is missing.
- A flag the step does not take is given, such as `--schema` or `--blocker` for shape, `--idea` for plan, or `--parent` for build.
- For shape, both `--issue` and `--idea` are given, or neither; `--issue` comes without `--issue-url`; or `--searched` comes without `--idea`.
- `--questions` is not `ask` or `auto`.
- A value other than `--idea` holds a line break.
- Only some of `--blocker`, `--blocker-branch` and `--blocker-pr` are given.

#### Scenario: An unknown step
- **WHEN** the user runs `lets go step-prompt --for review --name x --issue 1 --issue-url u --schema s --route r --questions ask`
- **THEN** it exits 2, stdout is empty, and stderr names `--for` and `review`

#### Scenario: No step
- **WHEN** the user runs `lets go step-prompt --name x --issue 1 --issue-url u --schema s --route r --questions ask` without `--for`
- **THEN** it exits 2, stdout is empty, and stderr names `--for`

#### Scenario: A missing flag
- **WHEN** the user runs `lets go step-prompt --for plan` without `--route`
- **THEN** it exits 2, stdout is empty, and stderr names `--route`

#### Scenario: A flag the shape step does not take
- **WHEN** the user runs `lets go step-prompt --for shape --issue 180 --issue-url u --branch main --questions ask --schema lets-standard`
- **THEN** it exits 2, stdout is empty, and stderr names `--schema`

#### Scenario: An issue and an idea
- **WHEN** the user runs `lets go step-prompt --for shape --issue 180 --issue-url u --idea "x" --branch main --questions ask`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue` and `--idea`

#### Scenario: Neither an issue nor an idea
- **WHEN** the user runs `lets go step-prompt --for shape --branch main --questions ask`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue` and `--idea`

#### Scenario: An issue without its URL
- **WHEN** the user runs `lets go step-prompt --for shape --issue 180 --branch main --questions ask`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue-url`

#### Scenario: A search without an idea
- **WHEN** the user runs `lets go step-prompt --for shape --issue 180 --issue-url u --searched --branch main --questions ask`
- **THEN** it exits 2, stdout is empty, and stderr names `--searched` and `--idea`

#### Scenario: A question mode lets does not know
- **WHEN** the user runs `lets go step-prompt --for plan` with `--questions loud` and the other required flags
- **THEN** it exits 2, stdout is empty, and stderr names `--questions` and `loud`

#### Scenario: A route line with a line break
- **WHEN** the user runs `lets go step-prompt --for plan` with a `--route` value that holds a line break
- **THEN** it exits 2, stdout is empty, and stderr names `--route`

### Requirement: lets go step-prompt only prints
`lets go step-prompt` SHALL write no file, start no session, ask no resolver, and run no command but `git rev-parse --show-toplevel`. It SHALL read neither the backlog nor the `lets` config.

#### Scenario: Nothing is written
- **WHEN** the user runs `lets go step-prompt --for plan` with the required flags in a repository
- **THEN** `git status --porcelain` prints the same before and after the run, and no file appears under `.workspace/`

#### Scenario: No outside program
- **WHEN** stand-ins for `gh`, `openspec` and every resolver's CLI are first on `PATH`, and the user runs `lets go step-prompt --for shape --idea "x" --branch main --questions ask`
- **THEN** no stand-in is called

### Requirement: The step-prompt help names the steps and flags
`lets go --help` SHALL name `step-prompt`. `lets go step-prompt --help` SHALL name each `--for` value, each flag and which steps take it, say that the prompt goes to stdout and that the command writes no file, and name the exit codes 0 and 2.

#### Scenario: The group's help
- **WHEN** the user runs `lets go --help`
- **THEN** the output names `questions` and `step-prompt`

#### Scenario: The command's help
- **WHEN** the user runs `lets go step-prompt --help`
- **THEN** the output names `shape`, `plan`, `review-plan`, `build`, `review-build` and `story`, each of `--name`, `--issue`, `--issue-url`, `--branch`, `--idea`, `--searched`, `--parent`, `--checkout`, `--schema`, `--route`, `--questions`, `--blocker`, `--blocker-branch` and `--blocker-pr`, and the exit codes `0` and `2`
