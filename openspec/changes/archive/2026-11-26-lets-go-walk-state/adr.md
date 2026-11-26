# ADR Review Manifest

- Status: completed
- Review date: 2026-11-26

## Review Summary

ADR review completed for this change. Each decision in design.md was tested against the `lets-write-adrs` rule: could a reader of the code reverse it without knowing why, and would that be costly? One qualifies. Design decisions 4 and 9 together choose how code applies a rule that a step skill owns: mechanically, with no judgment of a fix's diff, with the skill's text as the only statement and a contract test against it. A reader of `lets/src/go/plan-review.ts` could easily add a diff check back, or move the rule into code, and either would undo a choice the brainstorm settled (D4, D7). That gets ADR-031.

The other decisions need no record. Moving the done tests into `lets` applies ADR-021. Reading them from Git and the pull request, with no log of `lets-go`'s own, and stopping when the records disagree, keeps ADR-017. The section the command reads is the one ADR-019 puts in the pull request. The module split, the reads, the JSON layout, the `schema:` line read, the exit codes and the stop order live in code or in the specs, and cost little to change.

## In-Force ADRs Reviewed

- [ADR-017: lets-go reads where a run stands from Git and GitHub, and keeps no log of its own](../../../docs/decisions/ADR-017-lets-go-reads-where-a-run-stands-from-git-and-github.md)
- [ADR-019: Reviews record in the pull request, and the schema holds only the plan](../../../docs/decisions/ADR-019-reviews-record-in-the-pull-request.md)
- [ADR-020: lets-go is the only runner, and lets-build is the build step](../../../docs/decisions/ADR-020-lets-go-is-the-only-runner.md)
- [ADR-021: An outside command runs in lets code or in the skill, by how complex and portable it must be](../../../docs/decisions/ADR-021-where-an-outside-command-runs.md)
- [ADR-027: The project installs the OpenSpec CLI](../../../docs/decisions/ADR-027-the-project-installs-the-openspec-cli.md)
- [ADR-029: A step skill owns its rules, and the step prompt only names it](../../../docs/decisions/ADR-029-a-step-skill-owns-its-rules.md)

The other in-force records, ADR-001, 002, 005 to 008, 010 to 013, 016, 021 (product maps), 022 to 026, 027 (story runs), 028 and 030, cover delegation, config, issue comments, discovery maps, step reports, worktrees and epics. This change touches none of them.

## New Durable ADRs Created

- [ADR-031: lets code applies a step skill's done rule mechanically, and the skill's text stays the rule](../../../docs/decisions/ADR-031-lets-code-applies-a-step-skills-done-rule.md)
