## MODIFIED Requirements

### Requirement: step start runs a step in the background
`lets delegate step start` SHALL take every option of `lets delegate step run`, plus `--report-file <path>` and `--meta-file <path>`, which are required, and `--checkout <path>`, which is optional. It SHALL start, in the background, the session that `lets delegate step run` would run with the same options, and return at once. The background step SHALL pick its resolver as `lets delegate step run` would in the process where `step start` ran: the first resolver in `delegate.resolvers` that answers. A resolver that would answer `step run` there, `t3` included, SHALL answer the background step too, except that `t3` declines once the T3 server that was an ancestor of `step start` has stopped. The session SHALL run with the repository root of `--checkout` as its working directory, or the repository root of the working directory when `--checkout` is not given. Every relative path SHALL be read from the working directory `step start` ran in. When the background step ends, the report file SHALL hold what `lets delegate step run` would have printed on stdout, and the meta file what it would have printed on stderr. Once the step has started, `step start` SHALL print one JSON line, `{"name":"<name>","pid":<pid>}`, with the normalized `--name` and the background process's id, and exit 0. The name SHALL be normalized as a session's name is, but SHALL NOT be cut to that name's 32 characters. It SHALL keep what it needs to know about the run under `.workspace/` in the repository root where it ran.

#### Scenario: A story run in a worktree
- **WHEN** the user runs `lets delegate step start --for story --name Fix X --checkout .workspace/lets-go/worktrees/fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --effort high --model gpt/gpt-6-luna`
- **THEN** the command exits 0 at once, prints one JSON line starting `{"name":"fix-x","pid":`, and the resolver is asked for a `step` session named `fix-x` whose working directory is the root of `.workspace/lets-go/worktrees/fix-x`

#### Scenario: A story run started inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[t3, subagent]`, the running T3 server is an ancestor of the process, and the user runs `lets delegate step start --for story --name fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --effort high --model claude/claude-opus-5-5`, then exits that process before the background step picks its resolver
- **THEN** `t3` is asked for the `step` session, and `subagent` is not asked

#### Scenario: A resolver listed before t3 inside T3 Code
- **WHEN** the config's `delegate.resolvers` is `[cli, t3]`, `claude` is on `PATH`, the running T3 server is an ancestor of the process, and the user runs `lets delegate step start --for build` with every required option and `--model claude`
- **THEN** `cli` is asked for the `step` session, as `lets delegate step run` with the same options would ask it, and no T3 thread is created

#### Scenario: A name longer than 32 characters
- **WHEN** the user runs `lets delegate step start --name openspec-cli-is-the-projects-own-story` with the other options
- **THEN** the command prints one JSON line starting `{"name":"openspec-cli-is-the-projects-own-story","pid":`, and `lets delegate step wait --name openspec-cli-is-the-projects-own-story` names the step by that same name once it ends

#### Scenario: Paths for a step in a worktree
- **WHEN** the user runs `lets delegate step start --for story --name Fix X --checkout .workspace/lets-go/worktrees/fix-x --prompt-file p.md --report-file r.json --meta-file m.txt --model gpt/gpt-6-luna` in the repository root `/repo`
- **THEN** the background `lets delegate step run` is given `--prompt-file /repo/p.md` and `--exit-file /repo/.workspace/lets-delegate/fix-x.exit.json`, and none of `--checkout`, `--report-file` and `--meta-file`

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
