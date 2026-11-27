<!-- Plain language: Name the actor, condition and observable result. Explain necessary domain terms using the agreed glossary. Keep requirement and scenario headings and WHEN/THEN syntax exactly as required. -->

## MODIFIED Requirements

### Requirement: The review record says what the review was for
When `lets delegate review run` exits 0, the JSON line it prints on stderr SHALL hold `for`, the intent that `--for` gives, as its first field. The line SHALL still hold `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`.

#### Scenario: A code review
- **WHEN** a resolver answers a run, and the user runs `lets delegate review run --for review-build`
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"review-build",` and holds `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`

#### Scenario: A plan review
- **WHEN** a resolver answers a run, and the user runs `lets delegate review run --for review-plan`
- **THEN** the command exits 0, and its stderr ends with one JSON line that starts `{"for":"review-plan",` and holds `resolver`, `family`, `model`, `independent`, `handle`, `gitClean` and `durationSeconds`

### Requirement: The review record names the checkout and commit the session read
When `lets delegate review run` exits 0, its JSON line on stderr SHALL hold `checkout` and `commit`, for every resolver that runs a review:
- `checkout` SHALL be the absolute path of the top level of the git checkout the session ran in, as the resolver reports it.
- `commit` SHALL be the full hash at that checkout's `HEAD`, read after the session ended.

When `lets` cannot tell the checkout, or cannot read its `HEAD`, the field SHALL be `null`, and the command SHALL still exit 0 and print the final message.

#### Scenario: A review through the cli resolver
- **WHEN** the config's `delegate.resolvers` is `[cli]`, the user runs `lets delegate review run --for review-build` with every required option in the checkout `/r`, and `/r`'s `HEAD` is `0123456789abcdef0123456789abcdef01234567` when the session ends
- **THEN** the command exits 0, and its JSON line has `"checkout":"/r"` and `"commit":"0123456789abcdef0123456789abcdef01234567"`

#### Scenario: A reviewer that commits
- **WHEN** a resolver answers a review in `/r`, whose `HEAD` is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` when the command starts, and the session makes the commit `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb` and leaves the tree clean
- **THEN** the command exits 0, and its JSON line has `"commit":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"`

#### Scenario: The checkout's HEAD cannot be read
- **WHEN** a resolver answers a review and reports the checkout `/gone`, where `git rev-parse HEAD` fails
- **THEN** the command exits 0, prints the final message, and its JSON line has `"checkout":"/gone"` and `"commit":null`
