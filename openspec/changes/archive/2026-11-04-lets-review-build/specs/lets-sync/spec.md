## ADDED Requirements

### Requirement: A config that still names lets-review-code is a problem to fix
When the project's `openspec/config.yaml` has a line that names `lets-review-code` outside a `#` comment, `lets sync` SHALL list this problem on stderr, under its `lets-spec: <n> problem(s) to fix:` heading:

`openspec/config.yaml names lets-review-code, which this release does not ship. Delete the operations.archive entry that names it: the lets-review-build skill runs the code review now.`

It SHALL list the problem once, however many lines name the skill, and beside any schema problem the same run finds. It SHALL still exit 0. When no such line exists, it SHALL NOT list this problem. `lets sync --check` SHALL NOT change because of this requirement.

#### Scenario: A project keeps the rule an earlier release wrote
- **WHEN** `lets sync` runs in a project whose `openspec/config.yaml` holds the `operations.archive` entry from release 0.7.0, which names the `lets-review-code` skill
- **THEN** stderr lists the problem above, once
- **AND** the exit status is 0

#### Scenario: The name sits in comments
- **WHEN** `lets sync` runs in a project whose `openspec/config.yaml` names `lets-review-code` only in `#` comments, one a whole line and one the end of a line
- **THEN** the output holds no `lets-review-code` problem

#### Scenario: A config without the name
- **WHEN** `lets sync` runs in a project whose `openspec/config.yaml` holds `schema: lets-standard` and nothing that names `lets-review-code`
- **THEN** the output holds no `lets-review-code` problem

#### Scenario: A schema problem and the name in one run
- **WHEN** `lets sync` runs in a project whose `openspec/config.yaml` sets `schema: spec-driven` and holds the entry from release 0.7.0
- **THEN** stderr lists the schema problem and the `lets-review-code` problem
- **AND** the exit status is 0

#### Scenario: Check is unchanged
- **WHEN** `lets sync --check` runs in a project that is otherwise up to date, and whose `openspec/config.yaml` names `lets-review-code`
- **THEN** the exit status is 0
