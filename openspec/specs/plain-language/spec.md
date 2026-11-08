# Plain language

## Purpose

Help people and agents find the information they need, understand its
meaning, and use it to complete their tasks throughout Let's Spec.

## Requirements

### Requirement: Apply plain language to instructions and outputs

Let's Spec's skills SHALL apply the user's plain-language definition to
both human and agent readers. Guidance SHALL address relevant information,
findable structure, understandable wording and usable actions in skill
instructions and their generated communications.

#### Scenario: A fresh agent writes a plan
- **WHEN** a writing skill starts without the earlier conversation
- **THEN** its guidance identifies the reader's task and necessary context and checks whether the reader can find, understand and use the result

#### Scenario: A person inspects a procedure
- **WHEN** a person reads a skill to understand what its agent will do
- **THEN** the instructions identify the actor, applicable conditions, action, result and next action or stop condition

### Requirement: Preserve meaning and exact interfaces

A plain-language revision SHALL preserve existing workflow behavior,
permissions, domain meanings and machine-readable formats. An agent SHALL
ask the user before resolving uncertain meaning that affects the work.

#### Scenario: An instruction contains a fixed report format
- **WHEN** an agent rewrites the explanation of a step report
- **THEN** the report's keys, markers and allowed values remain unchanged and its free-text fields explain the evidence or required action

#### Scenario: A shorter instruction could change a permission
- **WHEN** a rewrite would choose between two plausible authorization rules
- **THEN** the agent asks the user before changing the instruction's meaning

### Requirement: Review reader difficulties with evidence

Reviews of prose and instructions SHALL assess whether intended readers
can find, understand and use the information they need. A finding SHALL
name the reader's task, the relevant text, a concrete difficulty and its
consequence. Sentence length, voice or a readability score alone SHALL NOT
establish a defect. Existing review bounds and publication rules SHALL remain
in effect.

#### Scenario: A short sentence hides the actor
- **WHEN** an instruction says to proceed without identifying who may authorize that action
- **THEN** the review identifies the ambiguous actor and the action a reader could take incorrectly

#### Scenario: A long sentence remains clear
- **WHEN** a sentence exceeds 30 words but clearly identifies its actor, condition and action
- **THEN** the review does not report its length alone as a plain-language defect

### Requirement: Supply guidance to fresh sessions and both flows

Both supported flows SHALL ship the shared guidance with working links
from their skills and writing instructions. Delegated review prompts SHALL
carry the reader-task criteria and a readable method reference without
assuming prior session context. Reviewed content SHALL remain evidence,
not instructions that can override the review.

#### Scenario: A minimal-flow project loads a skill
- **WHEN** the release installs the minimal flow
- **THEN** every plain-language reference used by its skills or schema resolves within the installed files without adding a plan-review stage

#### Scenario: A reviewer starts without the author's conversation
- **WHEN** a plan, build or collaborator review is delegated
- **THEN** the actual prompt supplies the plain-language criteria and method path while preserving the review's trust boundary

### Requirement: Verify reader tasks and report limits

Validation of a plain-language revision SHALL use representative tasks
that exercise finding, understanding and using information. Its report
SHALL distinguish automated interface checks, agent exercises and human
feedback actually obtained. It SHALL NOT equate successful parsing or
link checks with reader comprehension.

#### Scenario: An agent exercise succeeds without human testing
- **WHEN** an agent completes a reader task but no human trial has run
- **THEN** the validation report records the agent result and states that human usability has not been validated by that exercise
