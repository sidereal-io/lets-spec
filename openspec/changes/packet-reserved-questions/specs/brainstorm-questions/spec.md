## Purpose

Makes sure that a decision an issue's packet leaves to the user reaches the user, so no question mode and no recommendation lets an agent decide it in the user's place.

## ADDED Requirements

### Requirement: The brainstorm reads the story's packet and its parent epic's packet for questions left to the user

`lets-brainstorm` SHALL look for questions left to the user in the story's packet, the issue body. When the story is a sub-issue of a parent epic, it SHALL also read the parent's packet, the parent issue's body, and look for them there. A question the parent's packet leaves to the user SHALL count as left to the user in every story under that parent, each time its brainstorm runs. Issue comments SHALL NOT leave a question to the user: they stay evidence, as the `issue-comments` capability says.

#### Scenario: A line in the story's packet
- **WHEN** the brainstorm runs for a story whose packet says "Where the expected fields and values come from is not yet decided by the user"
- **THEN** it asks the user where the expected fields and values come from, as a question left to the user

#### Scenario: A line in the parent epic's packet
- **WHEN** the brainstorm runs for a story whose own packet leaves nothing to the user, and whose parent epic's *Shared decisions* say "Agree the retry limit with the user in each story's brainstorm"
- **THEN** it asks the user the retry limit, as a question left to the user

#### Scenario: A story with no parent
- **WHEN** the brainstorm runs for a story that is not a sub-issue
- **THEN** it looks for questions left to the user in the story's packet only, and reads no other issue's body

### Requirement: The brainstorm recognizes a question left to the user by its meaning

`lets-brainstorm` SHALL treat a packet line as leaving a question to the user when the line says that a decision is not yet made by the user, or that it must be agreed with the user. It SHALL do so whatever the line's wording, and whatever section or heading holds it. Packets SHALL need no fixed phrase or section for this. The skill SHALL quote the two lines of #328's packet as examples: "Where the expected fields and values come from is not yet decided by the user" and "Agree it with the user in the brainstorm".

#### Scenario: A plain sentence under a heading no template has
- **WHEN** a story's packet has a section `## Notes` holding "Agree it with the user in the brainstorm", about the writing rule
- **THEN** the brainstorm asks the writing rule as a question left to the user

#### Scenario: A decision the packet makes
- **WHEN** a story's packet says "The flag is named `--quiet`"
- **THEN** the brainstorm does not treat the flag's name as a question left to the user

#### Scenario: The skill gives the examples
- **WHEN** a reader reads `skills/lets-brainstorm/SKILL.md`
- **THEN** it quotes "Where the expected fields and values come from is not yet decided by the user" and "Agree it with the user in the brainstorm" as examples, and names no phrase that a packet must use

### Requirement: A line the brainstorm cannot read for certain leaves the question to the user

When `lets-brainstorm` cannot tell whether a packet line leaves a decision to the user, it SHALL treat the line as leaving it to the user.

#### Scenario: An unclear line
- **WHEN** a story's packet says "The timeout is up to the user's preference, probably 30 seconds"
- **THEN** the brainstorm asks the timeout as a question left to the user, with no recommendation

### Requirement: A question left to the user carries no recommendation and names no favorite

`lets-brainstorm` SHALL ask a question left to the user with no recommendation, whoever runs it and at either question mode. The question SHALL give two or three options, each with its trade-offs. Neither the question's text nor its options SHALL name the option the brainstorm prefers. In a `lets-go` step, the question SHALL appear in the `needs-input` report with no `recommendation`, so `lets-go` asks the user at `auto` as at `ask`. The brainstorm SHALL NOT settle such a question from the code or a document, and SHALL NOT record it as an `Assumption`. The answer's ledger row SHALL have the source `User`.

#### Scenario: The plan step at auto
- **WHEN** the plan step's brainstorm at `auto` reaches a question the packet leaves to the user
- **THEN** its `needs-input` report lists that question with no `recommendation`, and the question shows two or three options with their trade-offs and calls none of them recommended, preferred or best

#### Scenario: The answer is recorded as the user's
- **WHEN** the step resumes with the user's answer to a question the packet left to them
- **THEN** that question's ledger row has the source `User`

#### Scenario: The code seems to settle it
- **WHEN** a story's packet leaves the field source to the user, and the code already reads fields from one place
- **THEN** the brainstorm still asks the user with no recommendation, and writes no `Evidence` row for that question

### Requirement: A question left to the user quotes the packet line

A question left to the user SHALL quote the packet line that leaves it to the user, and SHALL say whether that line is in the story's packet or in the parent epic's packet, with the issue's number.

#### Scenario: A question from the parent epic
- **WHEN** the brainstorm for story #341 asks a question that epic #339's packet leaves to the user
- **THEN** the question quotes epic #339's line and names #339
