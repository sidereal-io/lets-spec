## MODIFIED Requirements

### Requirement: Record agreed definitions immediately

Shaping and brainstorming SHALL write a definition to the appropriate project-owned glossary once the user agrees on its meaning and scope, without waiting for implementation or the end of shaping. In single-issue shaping, agents SHALL check size before agreeing and writing new definitions. An L or XL stop SHALL keep candidate meanings tentative; only if the user starts a discovery run SHALL its parent record them. The size stop SHALL NOT create an issue or start discovery.

#### Scenario: Meaning and scope are settled during shaping
- **WHEN** the user agrees on a new definition and its scope before implementation stories start
- **THEN** shaping writes that definition immediately so subsequent stories can use it

#### Scenario: A brainstorm settles a new definition
- **WHEN** the user agrees on the meaning and scope of a term during a story's brainstorm
- **THEN** the agent updates the appropriate glossary as part of the current change

#### Scenario: Oversized single-issue shaping stops
- **WHEN** a new single issue is sized L or XL
- **THEN** shaping stops without writing definitions or creating an issue, and records tentative meanings in a discovery parent only if the user starts that run

#### Scenario: Single-issue shaping passes sizing
- **WHEN** the single issue passes the size check and the user agrees on meaning and scope
- **THEN** shaping writes the definition and follows the existing glossary checkpoint and handoff procedures

### Requirement: Choose one owner for vocabulary shared by several stories

When several shaped stories share new definitions, the glossary handoff SHALL ask whether a selected story's PR carries the glossary edits or a separate documentation PR lands first. It SHALL record the selected owner so other stories can reference the definitions without copying them into competing PRs or automatically stacking independent stories. Agents SHALL seek user confirmation for blocker links to the owner and keep dependent stories unready until that prerequisite is resolved.

#### Scenario: A story PR owns the shared definitions
- **WHEN** the user selects checkout's PR to carry definitions also needed by fulfillment and confirms the blocker link
- **THEN** the glossary handoff records that ownership and fulfillment's issue records checkout's issue as its blocker

#### Scenario: Shared documentation precedes independent implementations
- **WHEN** the user selects a documentation PR for the shared definitions and confirms blocker links for both stories
- **THEN** the glossary handoff records that PR as their owner and both stories record the documentation issue as their blocker

#### Scenario: The user declines blocker links
- **WHEN** the user declines blocker links while a story still needs definitions from an unmerged owner PR
- **THEN** the issue packet retains that unresolved prerequisite and build selection does not claim the story until it is resolved

#### Scenario: The glossary owner has an issue and a PR
- **WHEN** the user approves blockers for definitions owned by an issue with a separate PR
- **THEN** each dependent story's blocker uses the owner issue number recorded in Glossary handoff, not the Project owner login or the PR number
