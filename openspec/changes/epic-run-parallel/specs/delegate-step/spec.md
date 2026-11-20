## ADDED Requirements

### Requirement: step start runs a step in the background
`lets delegate step start` SHALL take every option of `lets delegate step run`, plus `--report-file <path>` and `--meta-file <path>`, which are required, and `--checkout <path>`, which is optional. It SHALL start, in the background, the session that `lets delegate step run` would run with the same options, and return at once. The session SHALL run with the repository root of `--checkout` as its working directory, or the repository root of the working directory when `--checkout` is not given. Every relative path SHALL be read from the working directory `step start` ran in. When the background step ends, the report file SHALL hold what `lets delegate step run` would have printed on stdout, and the meta file what it would have printed on stderr. Once the step has started, `step start` SHALL print one JSON line, `{"name":"<name>","pid":<pid>}`, with the normalized `--name` and the background process's id, and exit 0. It SHALL keep what it needs to know about the run under `.workspace/` in the repository root where it ran.

#### Scenario: A story run in a worktree
- **WHEN** the user runs `lets delegate step start --for story --name Fix X --checkout .workspace/lets-go/worktrees/fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --effort high --model gpt/gpt-6-luna`
- **THEN** the command exits 0 at once, prints one JSON line starting `{"name":"fix-x","pid":`, and the resolver is asked for a `step` session named `fix-x` whose working directory is the root of `.workspace/lets-go/worktrees/fix-x`

#### Scenario: The report once the step ends
- **WHEN** a step started with `--report-file r.json --meta-file m.txt` ends with a `done` report
- **THEN** `r.json` holds one JSON line starting `{"outcome":"done",`, and `m.txt` holds the record line that `lets delegate step run` prints on stderr

#### Scenario: A usage error starts nothing
- **WHEN** the user runs `lets delegate step start` with no `--report-file`
- **THEN** the command exits 2, prints nothing on stdout, and starts no background process

#### Scenario: A prompt file that cannot be read
- **WHEN** `--prompt-file` names a file that does not exist
- **THEN** the command exits 2, its stderr names the file, and no background process starts

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step start --help`
- **THEN** the output names `--checkout`, `--report-file` and `--meta-file`, lists exit codes 0 and 2, and says that `lets delegate step wait` tells when the step ends

### Requirement: step start refuses a name that is still running
`lets delegate step start` SHALL exit 2, and start nothing, when a background step that it started with the same normalized `--name`, from the same repository root, has not ended yet. Its stderr SHALL name the step. Once that step has ended, `step start` SHALL accept the name again, and the new run SHALL replace the old one.

#### Scenario: A name that runs
- **WHEN** a background step named `fix-x-story` runs, and the user runs `lets delegate step start --name fix-x-story` again
- **THEN** the command exits 2, stderr names `fix-x-story`, and no second process starts

#### Scenario: A name that has ended
- **WHEN** the background step named `fix-x-story` has ended with a `needs-input` report, and the user runs `lets delegate step start --name fix-x-story --answers-file a.yaml` with the other options
- **THEN** the command exits 0, and a new background step starts with the answers

### Requirement: step wait names the next background step to end
`lets delegate step wait` SHALL take one or more `--name <name>`, each the name of a background step that `lets delegate step start` started from the same repository root. It SHALL wait until one of them has ended, print one JSON line, `{"name":"<name>","exit":<code>}`, and exit 0. `<code>` SHALL be the exit code that `lets delegate step run` gave for that step: 0 when a report is in its report file, whatever its outcome, or 2, 3, 4 or 6. When several of the named steps have ended, it SHALL name the one that ended first. A named step that ended before `step wait` started SHALL be named at once. `step wait` SHALL change neither the report file nor the meta file of a step that ended with an exit code.

#### Scenario: The first of two to end
- **WHEN** the background steps `a-story` and `b-story` run, and `b-story` ends first with a report
- **THEN** `lets delegate step wait --name a-story --name b-story` prints `{"name":"b-story","exit":0}` and exits 0

#### Scenario: A step that ended earlier
- **WHEN** the background step `a-story` ended with exit 3 before the user runs `lets delegate step wait --name a-story`
- **THEN** the command prints `{"name":"a-story","exit":3}` at once and exits 0

#### Scenario: Two ended steps
- **WHEN** `a-story` ended at 10:00 and `b-story` at 10:05, and the user runs `lets delegate step wait --name b-story --name a-story`
- **THEN** the command prints `{"name":"a-story","exit":0}`

### Requirement: step wait reports a background step that ended without an exit code
When the process of a named background step has ended without recording an exit code, such as a process that was killed, `lets delegate step wait` SHALL count the step as ended with exit 4, the code for an unknown outcome. It SHALL append one line to that step's meta file, `lets delegate: the background step ended without an exit code`, so the caller reads a reason there, as for any other exit 4.

#### Scenario: A killed process
- **WHEN** the process of the background step `a-story` was killed, and the step recorded no exit code
- **THEN** `lets delegate step wait --name a-story` prints `{"name":"a-story","exit":4}`, and the meta file ends with `lets delegate: the background step ended without an exit code`

### Requirement: step wait's exit codes
`lets delegate step wait` SHALL exit 0 when it names a step that ended. It SHALL exit 2 on a usage error, such as no `--name`, or a name that no `lets delegate step start` started from this repository root, and its stderr SHALL name that name. It SHALL wait with no time limit, unless `--timeout-minutes` gives a whole number of minutes. When that time passes and none of the named steps has ended, it SHALL exit 6, and leave every named step running. On every code but 0, stdout SHALL be empty. The help text of `lets delegate step wait` SHALL list these codes.

#### Scenario: An unknown name
- **WHEN** no background step named `c-story` was started here, and the user runs `lets delegate step wait --name c-story`
- **THEN** the command exits 2, stdout is empty, and stderr names `c-story`

#### Scenario: A time limit that passes
- **WHEN** the background step `a-story` runs for longer than 5 minutes, and the user runs `lets delegate step wait --name a-story --timeout-minutes 5`
- **THEN** the command exits 6 after 5 minutes, stdout is empty, and `a-story` still runs

#### Scenario: The help text
- **WHEN** the user runs `lets delegate step wait --help`
- **THEN** the output lists exit codes 0, 2 and 6, and says that the step's report is in the report file `lets delegate step start` was given
