## ADDED Requirements

### Requirement: Archive preserves a covering code review

`lets-review-build`'s *Check an earlier review* SHALL not call a review
stale for this change's archive commit when it moves the change folder into
`openspec/changes/archive/` and its only changes outside `openspec/changes/`
are merges into `openspec/specs/` that match its delta specs as they stood
at `<head-sha>`.

#### Scenario: Matching archive
- **WHEN** this change's archive commit moves the change folder into the archive and only merges its delta specs as they stood at `<head-sha>` outside `openspec/changes/`
- **THEN** no new review is required for that commit

#### Scenario: Archive includes an unrelated file
- **WHEN** an archive commit also changes a source file and is not a listed fix
- **THEN** a new review is required

#### Scenario: Spec merge differs from the reviewed delta
- **WHEN** an archive commit merges spec text that differs from the delta specs at `<head-sha>`
- **THEN** a new review is required
