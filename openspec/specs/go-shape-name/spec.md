# go-shape-name Specification

## Purpose
Says how `lets go shape-name` names the shape step of `lets-go` for an issue or an idea, and where that step's answers file is, so the naming rule is written once, in the `lets` CLI.

## Requirements

### Requirement: lets go shape-name prints the shape step's name and answers file
`lets go shape-name` SHALL take exactly one of `--issue <i>` and `--idea <text>`. On success it SHALL exit 0, write nothing on stderr, and print one JSON line on stdout, `{"name":<name>,"answers":<answers>}`, with the keys in that order. `<answers>` SHALL be `.workspace/lets-go/<name>-shape-answers.yaml`, a path relative to the repository root. The command SHALL read no file, start no session and ask no resolver, so the same input always gives the same line.

#### Scenario: An issue
- **WHEN** the user runs `lets go shape-name --issue 180`
- **THEN** it exits 0, and stdout is `{"name":"issue-180","answers":".workspace/lets-go/issue-180-shape-answers.yaml"}`

#### Scenario: An idea
- **WHEN** the user runs `lets go shape-name --idea 'add a --quiet flag to lets sync'`
- **THEN** it exits 0, and stdout is `{"name":"idea-add-a-quiet-flag-to-f1ade72f","answers":".workspace/lets-go/idea-add-a-quiet-flag-to-f1ade72f-shape-answers.yaml"}`

#### Scenario: Outside a repository
- **WHEN** the user runs `lets go shape-name --issue 180` in a folder that is not in a Git repository
- **THEN** it exits 0 and prints the same line as inside one

### Requirement: An issue's name is issue and its key
For `--issue <i>`, the name SHALL be `issue-` followed by `<i>` unchanged, where `<i>` is the issue's key as `lets backlog` prints it, such as `180` on GitHub or `PROJ-12` on Jira. The command SHALL not check the key's form: only the backlog provider reads a key.

#### Scenario: A key of another backlog provider
- **WHEN** the user runs `lets go shape-name --issue PROJ-12`
- **THEN** stdout is `{"name":"issue-PROJ-12","answers":".workspace/lets-go/issue-PROJ-12-shape-answers.yaml"}`

### Requirement: An idea's name is its first five words and a hash of all its words
For `--idea <text>`, the command SHALL clean the idea into words: split it on white space, lower-case each word, keep only its letters and digits, in any script, and drop a word left empty. The name SHALL be `idea-<slug>-<hash>`. `<slug>` SHALL be the first five words joined with hyphens, or all of them when there are fewer. When that text is longer than 50 characters, counted as Unicode code points, `<slug>` SHALL be its first 50, with a hyphen left at the end dropped, so the answers file's name stays under 255 bytes in any script. `<hash>` SHALL be the first eight lower-case hexadecimal digits of the SHA-256 of all the words joined with single spaces, in UTF-8. Two ideas with the same words after the clean-up SHALL get the same name. Two ideas that share their first five words but differ in a later word SHALL differ in `<hash>`, and so in their answers files, unless the two digests share their first eight digits.

#### Scenario: Case and punctuation do not change the name
- **WHEN** the user runs `lets go shape-name --idea 'fix lets-sync — quiet output'`, then `lets go shape-name --idea 'Fix letssync quiet output'`
- **THEN** both print the name `idea-fix-letssync-quiet-output-ef93442d`: the dash alone is dropped, and four words are all there are

#### Scenario: Two ideas that share their first five words
- **WHEN** the user runs `lets go shape-name --idea 'add a --quiet flag to lets sync'`, then `lets go shape-name --idea 'add a --quiet flag to lets status'`
- **THEN** the first name is `idea-add-a-quiet-flag-to-f1ade72f` and the second is `idea-add-a-quiet-flag-to-cb62daa9`

#### Scenario: Letters in another script
- **WHEN** the user runs `lets go shape-name --idea 'ログを直す'`
- **THEN** it exits 0, and the name is `idea-ログを直す-bffc2164`

#### Scenario: A long word is cut
- **WHEN** the user runs `lets go shape-name --idea 'https://github.com/sidereal-io/lets-spec/issues/180#issuecomment-1234567890'`
- **THEN** it exits 0, and the name is `idea-httpsgithubcomsiderealioletsspecissues180issuecomm-48aab992`: the one word is cut to 50 characters, and the hash is of the whole word

### Requirement: lets go shape-name rejects input it cannot name
The command SHALL exit 2, print nothing on stdout, and print a message on stderr that names the problem when it is given neither option, both options, or an option more than once. For an idea with no letter or digit in any script, the line SHALL be `lets go: an idea needs at least one letter or digit`.

#### Scenario: No letter or digit
- **WHEN** the user runs `lets go shape-name --idea '???'`
- **THEN** it exits 2, stdout is empty, and stderr is `lets go: an idea needs at least one letter or digit`

#### Scenario: An idea of white space only
- **WHEN** the user runs `lets go shape-name --idea '   '`
- **THEN** it exits 2, and stderr is `lets go: an idea needs at least one letter or digit`

#### Scenario: Neither option
- **WHEN** the user runs `lets go shape-name`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue` and `--idea`

#### Scenario: Both options
- **WHEN** the user runs `lets go shape-name --issue 180 --idea 'fix the typo'`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue` and `--idea`

#### Scenario: An option given twice
- **WHEN** the user runs `lets go shape-name --issue 180 --issue 181`
- **THEN** it exits 2, stdout is empty, and stderr names `--issue`
