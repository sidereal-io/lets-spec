## ADDED Requirements

### Requirement: The review record names the checkout and commit the session read
When `lets delegate review run` exits 0, its JSON line on stderr SHALL hold `checkout` and `commit`, for every resolver that runs a review:
- `checkout` SHALL be the absolute path of the top level of the git checkout the session ran in, as the resolver reports it.
- `commit` SHALL be the full hash at that checkout's `HEAD`, read after the session ended.

When `lets` cannot tell the checkout, or cannot read its `HEAD`, the field SHALL be `null`, and the command SHALL still exit 0 and print the final message.

#### Scenario: A review through the cli resolver
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate review run --for code` with every required option in the checkout `/r`, and `/r`'s `HEAD` is `0123456789abcdef0123456789abcdef01234567` when the session ends
- **THEN** the command exits 0, and its JSON line has `"checkout":"/r"` and `"commit":"0123456789abcdef0123456789abcdef01234567"`

#### Scenario: A reviewer that commits
- **WHEN** a resolver answers a review in `/r`, whose `HEAD` is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` when the command starts, and the session makes the commit `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` and leaves the tree clean
- **THEN** the command exits 0, and its JSON line has `"commit":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"`

#### Scenario: The checkout's HEAD cannot be read
- **WHEN** a resolver answers a review and reports the checkout `/gone`, where `git rev-parse HEAD` fails
- **THEN** the command exits 0, prints the final message, and its JSON line has `"checkout":"/gone"` and `"commit":null`

### Requirement: A review has time to finish
`lets delegate review run` SHALL give the session 30 minutes at effort `low` and `medium`, and 45 minutes at effort `high`, unless `--timeout-minutes` gives another whole number of minutes. This SHALL hold for every resolver. When the session has not finished in that time, the command SHALL exit 6.

#### Scenario: A medium review
- **WHEN** the user runs `lets delegate review run --effort medium` with every other required option, and no `--timeout-minutes`
- **THEN** the resolver is given 30 minutes

#### Scenario: A low review
- **WHEN** the user runs `lets delegate review run --effort low` with no `--timeout-minutes`
- **THEN** the resolver is given 30 minutes

#### Scenario: A high review
- **WHEN** the user runs `lets delegate review run --effort high` with no `--timeout-minutes`
- **THEN** the resolver is given 45 minutes

#### Scenario: The user sets the limit
- **WHEN** the user runs `lets delegate review run --effort medium --timeout-minutes 7`
- **THEN** the resolver is given 7 minutes
