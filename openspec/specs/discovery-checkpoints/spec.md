# discovery-checkpoints Specification

## Purpose
Let a fresh discovery session resume confirmed work and keep journey status based on the implementation when issue links change.

## Requirements

### Requirement: Record pending Finalize durably

Shaping SHALL write `next phase: finalize` to the parent after Stories is confirmed and written. The parent template and Resume mode SHALL recognize this value. Finalize SHALL retain its existing duties and order, including removing the status line and completing glossary handoff before ordinary handoff.

#### Scenario: Resume after confirmed Stories
- **WHEN** a fresh session reads a parent with `next phase: finalize`
- **THEN** it proceeds to Finalize without repeating confirmed story shaping

### Requirement: Derive journey status from implementation

Removing a closed issue link SHALL preserve the stage's code-based classification: supported for working code, partial for incomplete existing code, and gap for missing code. Supported stages SHALL have no issue links; remaining issue links SHALL identify open work.

#### Scenario: Incomplete code has no replacement issue
- **WHEN** a closed issue link is removed from a stage whose code is incomplete and no open issue replaces it
- **THEN** the stage remains partial without an issue link

### Requirement: lets-shape picks its path from its input

`lets-shape` SHALL pick its path at the start of every run, whoever runs it, with the first match winning. The input is what the caller brings: an idea in words, a file, or an issue `#<i>`. The answers are those the run already has: the ones the user gave in this session, or the `## Answers` section of a resumed step.

1. An open parent issue is this input, or its `Input:` line names this input, and the parent is in one of two states. When it says `Discovery status: in-progress`, `lets-shape` SHALL resume it. When it has no status line and the answers confirmed its Phase 5 story table, `lets-shape` SHALL finish its Finalize. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT match, and the list goes on to item 2. When several parents match, it SHALL list them and ask which one, and pick none itself.
2. The answers already answer the discovery question: `lets-shape` SHALL follow that answer and SHALL NOT ask the question again or size the work again. On yes, it SHALL run discovery from Ingest with this input. On anything else, it SHALL stop and say that the work is too large for one issue and discovery was declined.
3. The input plainly holds a large idea, such as a PRD or a vision: `lets-shape` SHALL ask the discovery question before any other question.
4. Any other input: `lets-shape` SHALL shape it as one issue. Sizing decides whether it is too large.
5. No input: an open parent that says `Discovery status: in-progress` is resumed, and when several do, `lets-shape` SHALL ask which one or whether to start a new run. With no such parent, every phase runs when the discovery map does not exist, and *Revision mode* runs when it does.

A parent whose `Input:` line names another input SHALL NOT be resumed or finished when the user brings an input, unless the input is that parent.

#### Scenario: A resumed round finds the parent
- **WHEN** the input is the idea `rewrite the backlog around a plugin model`, the answers hold the discovery question answered `yes`, and the open parent `Epic: plugin backlog` says `Discovery status: in-progress — next phase: moscow` with `Input: rewrite the backlog around a plugin model`
- **THEN** `lets-shape` resumes that parent at MoSCoW and creates no second parent

#### Scenario: A resumed round for an issue
- **WHEN** the input is `#180`, and an open parent says `Discovery status: in-progress` with `Input: #180`
- **THEN** `lets-shape` resumes that parent, and does not shape #180 as one issue

#### Scenario: The user names the parent
- **WHEN** the input is `#200`, and `#200` is an open parent that says `Discovery status: in-progress — next phase: moscow` with `Input: rewrite the backlog around a plugin model`
- **THEN** `lets-shape` resumes `#200` at MoSCoW, and neither shapes `#200` as one issue nor creates a second parent

#### Scenario: The user says yes
- **WHEN** the answers hold the discovery question answered `yes`, and no open parent's `Input:` line names the input
- **THEN** `lets-shape` runs discovery from Ingest with the input, and its first questions are Ingest's

#### Scenario: The user says no
- **WHEN** the answers hold the discovery question answered `no`, and no open parent's `Input:` line names the input
- **THEN** `lets-shape` stops and says that the work is too large for one issue and discovery was declined, and does not shape the work as one issue or size it again

#### Scenario: A large idea brought directly
- **WHEN** a user runs `lets-shape` with a two-page vision and `openspec/discovery.md` exists
- **THEN** `lets-shape` asks the discovery question before it asks about a Kind or a packet, and does not start *Revision mode*

#### Scenario: A finished epic names the input
- **WHEN** the input is `#180`, the open parent `Epic: plugin backlog` has `Input: #180` and no status line, and the answers do not confirm its Phase 5 story table
- **THEN** `lets-shape` neither resumes nor finishes that parent, asks no question about which parent, and goes on to the next item of the list

#### Scenario: An unrelated discovery is in progress
- **WHEN** the user brings the bug `lets sync prints twice`, and an open parent says `Discovery status: in-progress` with `Input: #150`
- **THEN** `lets-shape` shapes the bug as one issue, and does not resume that parent

#### Scenario: No input
- **WHEN** the user runs `lets-shape` with no input, and one open parent says `Discovery status: in-progress`
- **THEN** `lets-shape` resumes that parent

### Requirement: A resumed round settles what the answers confirmed

When `lets-shape` resumes a parent and the answers confirmed phases of it, or confirmed its restatement of where discovery stopped, that work SHALL be settled. *Resume mode* SHALL NOT ask the user to confirm its restatement of where discovery stopped, and SHALL go straight to the parent's recorded next phase. It SHALL NOT ask a confirmed phase's questions again unless the user brings new information. Otherwise, including when the answers settle only other questions, such as which product the parent belongs to, *Resume mode* SHALL restate where discovery stopped and ask the user to confirm it, as before.

#### Scenario: Resume with answers
- **WHEN** a resumed step's `## Answers` section confirmed Ingest, Personas and the Journey map, and the parent says `next phase: moscow`
- **THEN** `lets-shape`'s next questions are MoSCoW's, and none of them asks to confirm the restatement

#### Scenario: Resume with answers that confirm no phase
- **WHEN** a resumed step's `## Answers` section holds only the product that the parent `#200` belongs to, and `#200` says `next phase: journey-map`
- **THEN** `lets-shape` restates where discovery stopped and asks the user to confirm it before the Journey map

#### Scenario: Resume without answers
- **WHEN** a user runs `lets-shape` in a fresh session, and the one open parent says `next phase: moscow`
- **THEN** `lets-shape` restates where discovery stopped and asks the user to confirm it before MoSCoW

### Requirement: A round during Finalize finishes Finalize

Finalize removes the parent's status line before it asks its own questions, such as who carries the glossary edits. When `lets-shape` matches a parent with no status line whose story table the answers confirmed, it SHALL finish Finalize on that parent from where the answers leave off, including the glossary handoff. It SHALL NOT run discovery from Ingest, and SHALL NOT create a second parent.

#### Scenario: The glossary owner was answered
- **WHEN** the answers hold the discovery question answered `yes`, the Phase 5 story table confirmed and the glossary owner question answered, and the open parent `Epic: plugin backlog` has `Input: rewrite the backlog around a plugin model` and no status line
- **THEN** `lets-shape` records that owner in the parent's **Glossary handoff**, finishes Finalize, and creates no issue

### Requirement: lets-shape asks before it runs discovery

When the work is too large for one issue, `lets-shape` SHALL ask `The work is Size <L or XL>, too large for one issue. Run discovery on it?` with the recommendation `yes`, whoever runs it. Too large means Size L or XL, or an input that plainly holds a large idea. It SHALL NOT start discovery before the answer. On `yes`, it SHALL run discovery from Ingest with the input, and every phase to Finalize, including the glossary handoff. On any other answer, it SHALL stop, say that the work is too large for one issue and discovery was declined, and create no issue and no glossary definition. In a `lets-go` step, that stop is a `failed` report with that reason.

#### Scenario: A too-large idea asks
- **WHEN** `lets-shape` sizes the idea `rewrite the backlog around a plugin model` XL
- **THEN** it asks `The work is Size XL, too large for one issue. Run discovery on it?`, recommends `yes`, and has created no issue

#### Scenario: Yes runs discovery
- **WHEN** the user answers `yes` to the discovery question for `#180`
- **THEN** `lets-shape` runs Ingest with #180 as its input, and #180 stays open

#### Scenario: The user declines
- **WHEN** the user answers `no` to the discovery question
- **THEN** `lets-shape` stops, says the work is too large for one issue and discovery was declined, and creates no issue

### Requirement: The parent's Input line names its input

When Ingest writes the parent issue, its `Input:` line SHALL name the input so a later run can match it: `#<i>` for an issue, the path for a file, and the idea word for word for an idea in words. A long conversation with no short statement of the idea SHALL keep `conversation, YYYY-MM-DD`, which no later run matches.

#### Scenario: An idea's parent
- **WHEN** discovery runs for the idea `rewrite the backlog around a plugin model`
- **THEN** the parent's body holds `Input:` followed by `rewrite the backlog around a plugin model`

#### Scenario: An issue's parent
- **WHEN** discovery runs for `#180`
- **THEN** the parent's `Input:` line holds `#180`

### Requirement: lets-shape skips a title search that already ran

When `lets-shape` shapes one issue and its input says that open issues were already searched for this idea and none is the same work, it SHALL skip its own title search and create the issue at its write. Without that note, it SHALL search open issue titles first, as before.

#### Scenario: The search already ran
- **WHEN** the input is an idea, with the note that open issues were searched and none is the same work
- **THEN** `lets-shape` runs no `gh issue list` title search, and asks no question about a matching issue

#### Scenario: No note
- **WHEN** a user brings the idea `add a --quiet flag to lets sync` with no note
- **THEN** `lets-shape` searches open issue titles for its words before it creates an issue

### Requirement: Confirmation questions carry no recommendation

`lets-shape` SHALL ask these as confirmation questions, with no recommendation, whoever runs it: each discovery phase's confirmation, including the parent issue's text at Ingest and *Resume mode*'s restatement; the Phase 5 story table; the packet confirmation in **Confirm, then write**; which product an idea belongs to; and whether to move the map for a second product.

#### Scenario: The packet confirmation
- **WHEN** a `lets-go` shape step reaches **Confirm, then write** for a new Chore
- **THEN** its `needs-input` report lists the packet confirmation with no `recommendation`

#### Scenario: A phase confirmation
- **WHEN** discovery needs the user to confirm the journey map
- **THEN** that question carries no recommendation

### Requirement: lets-shape recommends the glossary owner

When the glossary handoff asks which pull request carries this run's glossary edits, `lets-shape` SHALL recommend the first story in dependency order, whoever runs it. For one shaped issue, that is the issue itself.

#### Scenario: Three stories share new terms
- **WHEN** discovery filed #191, #192 and #193, #192 and #193 are blocked by #191, and the run added glossary terms
- **THEN** the owner question recommends #191's pull request

### Requirement: lets-shape ends where it started

`lets-shape` SHALL create no OpenSpec change and no change branch. The issues it files and a glossary holding branch are its own. It SHALL end on the branch it started on, with no edits of its own left in the working tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran.

#### Scenario: A shape step on the default branch
- **WHEN** a `lets-go` shape step shapes one issue, starting on `main` with a clean tree
- **THEN** it ends on `main`, and `git status --porcelain` prints nothing

#### Scenario: Discovery leaves the maps
- **WHEN** discovery ran from `main` and wrote `openspec/discovery.md`
- **THEN** `lets-shape` ends on `main`, and `git status --porcelain` lists only paths under the discovery maps

#### Scenario: Shaping a split-off story on a change branch
- **WHEN** `lets-brainstorm` sends a split-off story to *Shape one issue* on the branch `lets-sync-quiet`
- **THEN** `lets-shape` ends on `lets-sync-quiet`, and leaves no uncommitted edit of its own
