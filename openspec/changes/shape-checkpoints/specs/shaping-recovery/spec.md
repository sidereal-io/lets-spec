## Purpose

Let a fresh shaping session recover confirmed work and unfinished duties without losing glossary ownership or confusing implementation status with issue links.

## ADDED Requirements

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

### Requirement: Size single issues before glossary writes

Single-issue shaping SHALL check size before writing any new glossary definition. An L or XL stop SHALL leave candidate meanings tentative. If the user starts a discovery run, its parent SHALL record those meanings as tentative; this recovery SHALL NOT itself authorize issue creation or starting discovery. Existing glossary checkpoint recovery, ownership and unrelated-edit protections SHALL remain in effect.

#### Scenario: Oversized work stops before issue creation
- **WHEN** a new single issue is sized L or XL
- **THEN** shaping stops without writing definitions or creating an issue, offering discovery and carrying tentative meanings to its parent only if the user starts it

#### Scenario: A small issue introduces vocabulary
- **WHEN** single-issue shaping passes sizing and the user agrees on meaning and scope
- **THEN** the agent writes the definition and follows the existing checkpoint and glossary handoff procedures

### Requirement: Identify the glossary owner issue for blockers

Beside the unchanged blocker command, shaping SHALL identify `<owner>` as the recorded glossary owner issue number, distinct from the Project owner login and the owner's PR number. User permission and per-dependent-story blocker links SHALL remain required.

#### Scenario: Owner record includes an issue and PR
- **WHEN** the user approves blockers for definitions owned by an issue with a separate PR
- **THEN** the command uses the owner issue number on every affected dependent story
