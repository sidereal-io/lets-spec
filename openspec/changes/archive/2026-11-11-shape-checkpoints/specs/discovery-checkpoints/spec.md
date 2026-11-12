## Purpose

Let a fresh discovery session resume confirmed work and keep journey status based on the implementation when issue links change.

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
