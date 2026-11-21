<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## ADDED Requirements

### Requirement: An empty epic becomes discovery's parent

When `lets-shape` runs discovery for an empty epic, the epic SHALL be the parent issue. Ingest SHALL write the parent template into the epic's own body, with `gh issue edit`, after the user confirms the new text, and SHALL create no second parent. The epic SHALL keep its title, its Kind and its other Project fields. The new body SHALL end with a section `## Original description` that holds the epic's body from before Ingest, word for word. When that body was empty, the section SHALL be left out. **Scope** SHALL restate the original text in discovery's own words. The original body is the discovery's input: this is the one write `lets-shape` makes to its input, and the section keeps every word of it. Every later phase SHALL treat the epic as it treats any parent: its stories become the epic's sub-issues, and when the whole run fits one story, the epic SHALL become that story, as Phase 5 says for any parent. The user confirms that in the Phase 5 story table. The story's new body SHALL keep the `## Original description` section at its end.

#### Scenario: Ingest writes the epic's body
- **WHEN** the user confirms Ingest for the empty epic #300, titled `Plugin backlog`, whose body is `Let teams plug in their own backlog.`
- **THEN** #300's body holds the status line, `Input: #300`, the `Map:` line and **Scope**, and ends with `## Original description` followed by `Let teams plug in their own backlog.`; its title is still `Plugin backlog`; and no issue is created

#### Scenario: An epic with an empty body
- **WHEN** Ingest writes the body of the empty epic #300, whose body was empty
- **THEN** #300's new body has no `## Original description` section

#### Scenario: The epic's stories are its sub-issues
- **WHEN** the user confirms a Phase 5 story table of three stories for #300
- **THEN** each story is created with `--parent 300`, and no other parent issue exists for `Input: #300`

#### Scenario: The epic fits one story
- **WHEN** Phase 5 finds that the whole of #300 fits one story, and the user confirms the story table
- **THEN** #300 is retitled `<kebab-story-name> — <one-line outcome>`, its Kind becomes Story, it has no sub-issues, and its body still ends with `## Original description`

## MODIFIED Requirements

### Requirement: lets-shape picks its path from its input

`lets-shape` SHALL pick its path at the start of every run, whoever runs it, with the first match winning. The input is what the caller brings: an idea in words, a file, or an issue `#<i>`. The answers are those the run already has: the ones the user gave in this session, or the `## Answers` section of a resumed step.

1. An open parent issue is this input, or its `Input:` line names this input, and the parent is in one of two states. When it says `Discovery status: in-progress`, `lets-shape` SHALL resume it. When it has no status line and the answers confirmed its Phase 5 story table, `lets-shape` SHALL finish its Finalize. A parent in neither state, such as an open epic whose discovery finished, SHALL NOT match, and the list goes on to item 2. When several parents match, it SHALL list them and ask which one, and pick none itself.
2. The input is an empty epic: an issue `#<i>` whose Kind is Epic and that has no sub-issues, open or closed. `lets-shape` SHALL run discovery from Ingest with the epic as its parent, as *An empty epic becomes discovery's parent* says. It SHALL NOT ask the discovery question, and SHALL NOT size the work.
3. The answers already answer the discovery question: `lets-shape` SHALL follow that answer and SHALL NOT ask the question again or size the work again. On yes, it SHALL run discovery from Ingest with this input. On anything else, it SHALL stop and say that the work is too large for one issue and discovery was declined.
4. The input plainly holds a large idea, such as a PRD or a vision: `lets-shape` SHALL ask the discovery question before any other question.
5. Any other input: `lets-shape` SHALL shape it as one issue. Sizing decides whether it is too large.
6. No input: an open parent that says `Discovery status: in-progress` is resumed, and when several do, `lets-shape` SHALL ask which one or whether to start a new run. With no such parent, every phase runs when the discovery map does not exist, and *Revision mode* runs when it does.

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

#### Scenario: An empty epic
- **WHEN** the input is `#300`, #300's Kind is Epic, it has no sub-issues, open or closed, and no open parent's `Input:` line names `#300`
- **THEN** `lets-shape` runs discovery from Ingest with #300 as its parent, and asks neither `Run discovery on it?` nor a question about its Kind or Size

#### Scenario: An empty epic whose discovery started
- **WHEN** the input is `#300`, an empty epic whose body says `Discovery status: in-progress — next phase: personas` with `Input: #300`
- **THEN** `lets-shape` resumes #300 at Personas, as the first item says, and does not run Ingest again

#### Scenario: An epic with a closed story is not empty
- **WHEN** the input is `#278`, an Epic whose only sub-issues are closed, and no open parent's `Input:` line names `#278`
- **THEN** `lets-shape` does not take the empty-epic path, and goes on to the next item of the list

#### Scenario: An unrelated discovery is in progress
- **WHEN** the user brings the bug `lets sync prints twice`, and an open parent says `Discovery status: in-progress` with `Input: #150`
- **THEN** `lets-shape` shapes the bug as one issue, and does not resume that parent

#### Scenario: No input
- **WHEN** the user runs `lets-shape` with no input, and one open parent says `Discovery status: in-progress`
- **THEN** `lets-shape` resumes that parent

### Requirement: The parent's Input line names its input

When Ingest writes the parent issue, its `Input:` line SHALL name the input so a later run can match it: `#<i>` for an issue, the path for a file, and the idea word for word for an idea in words. A long conversation with no short statement of the idea SHALL keep `conversation, YYYY-MM-DD`, which no later run matches. When the input is an empty epic, the epic is the parent, and its `Input:` line SHALL name the epic itself, `#<epic>`.

#### Scenario: An idea's parent
- **WHEN** discovery runs for the idea `rewrite the backlog around a plugin model`
- **THEN** the parent's body holds `Input:` followed by `rewrite the backlog around a plugin model`

#### Scenario: An issue's parent
- **WHEN** discovery runs for `#180`
- **THEN** the parent's `Input:` line holds `#180`

#### Scenario: An empty epic's own body
- **WHEN** discovery runs for the empty epic `#300`
- **THEN** #300's body holds `Input: #300`
