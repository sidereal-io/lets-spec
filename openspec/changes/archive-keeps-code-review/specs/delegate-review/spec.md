## ADDED Requirements

### Requirement: Archive preserves a covering code review

Rule 3 of the build review skill's *Check an earlier review* SHALL exempt
an archive commit when it moves the change folder into
`openspec/changes/archive/` and its only changes outside `openspec/changes/`
are merges into `openspec/specs/` that match this change's reviewed delta
specs. The agent SHALL inspect the commit's changes before applying the
exemption. The listed-fix exception and the other review triggers SHALL
remain in effect.

#### Scenario: Matching archive
- **WHEN** a commit after the reviewed head moves the change folder into the archive and only merges its reviewed delta specs outside `openspec/changes/`
- **THEN** rule 3 does not require a new review for that commit

#### Scenario: Archive includes an unrelated file
- **WHEN** an archive commit also changes a source file and is not a listed fix
- **THEN** rule 3 requires a new review

#### Scenario: Spec merge differs from the reviewed delta
- **WHEN** an archive commit changes only the named capability specs outside `openspec/changes/`, but their merged changes differ from the reviewed delta specs and are not a listed fix
- **THEN** rule 3 requires a new review

#### Scenario: Listed fix remains covered
- **WHEN** a post-review commit touches only what its listed finding names
- **THEN** the listed-fix exception still applies
