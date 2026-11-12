## ADDED Requirements

### Requirement: Claim instructions describe session arbitration
Claim SHALL explain the zero-assignee guard before assignment, the unique comment token, the earliest-comment tie-break before In Progress, and loser cleanup preserving a winner under the same login. It SHALL pass the returned claim token to release on branch creation or glossary import failure. Existing lost-claim routing SHALL remain unchanged.

#### Scenario: An assigned issue
- **WHEN** the assignee read finds a nonzero count
- **THEN** Claim returns taken before assignment or Status changes

#### Scenario: Branch creation fails
- **WHEN** the session wins a claim and cannot create its branch
- **THEN** it releases with its own claim token
