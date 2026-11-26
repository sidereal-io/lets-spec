# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. Each decision in design.md was tested against the `lets-write-adrs` rule: could a reader of the code reverse it without knowing why, and would that be costly? None needs a record of its own. Moving the record reads into `lets` applies ADR-021. Reading them from Git and the pull request, with no log of `lets-go`'s own, keeps ADR-017. Parsing the **Plan review** section follows the format ADR-019 puts in the pull request. The JSON shape is a contract that #268 extends next, and the brainstorm settled it (D2). The other choices, such as the exit codes, the name check and the `gh` message match, live in code and cost little to change.

## In-Force ADRs Reviewed

- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020: lets-go is the only runner, and lets-build is the build step](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)
- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-029: A step skill owns its rules, and the step prompt only names it](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md)

The other in-force records, ADR-001, 002, 005 to 008, 010 to 013, 016, 021 (product maps), 022 to 028 and 030, cover delegation, config, issue comments, discovery maps, step reports, worktrees and epics. This change touches none of them.

## New Durable ADRs Created

- None - no major durable architectural decisions were introduced.
