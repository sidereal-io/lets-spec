# The resolvers

A resolver is the part of `lets` that turns a review, a handoff or a step
into a real session in one harness. `lets` has three, and you choose them by name
under `delegate.resolvers` in your `lets` config. There is nothing to install. The README's
[Set up delegation](../README.md#set-up-delegation) section explains the
config file.

| Name | It answers | It needs | A review runs as | A handoff | A step |
|---|---|---|---|---|---|
| [`t3`](#t3) | Inside T3 Code | T3 Code running | A new thread, archived when the review succeeds | Starts a new thread in the sidebar | Declines, so the next resolver answers |
| [`cli`](#cli) | In any terminal | `codex`, `claude` or `agy` on your `PATH` | A child process of that CLI, in its read-only mode | Declines, so the next resolver answers | A child process of that CLI, in its write mode |
| [`subagent`](#subagent) | Anywhere | nothing | Nothing: the skill runs the review in a subagent | Gives back the prompt to start any agent with | Saves the prompt, and exits 3, so the caller runs the step in a subagent |

Each one declines where it cannot work, and the next in your config is
asked. List them in this order, and leave out any you do not use:

```yaml
version: 3
delegate:
  resolvers:
    - t3
    - cli
    - subagent
```

## `t3`

`t3` opens each fresh session as a T3 Code thread, so you can watch it
work. It runs on Linux and macOS, and runs `t3` and `git` from your
`PATH`.

It counts as inside T3 Code only when the running T3 server started
`lets`, through any number of parent processes. A terminal outside T3
Code declines, even while T3 Code runs. If you also work in other
terminals, list `cli` after it.

It runs no step yet, so it declines every one and opens no thread.

A session runs in the checkout you started it from. A session started
from a linked worktree runs in that worktree, on its branch, as part of
the main checkout's T3 project. From the main checkout, it runs in the project's
own checkout. Either way, a detached HEAD gives the session no branch.

A review opens in T3's default mode, not in plan mode, so the model works
through to a result instead of stopping on a plan. It can run the tests.
The tree check still keeps it read-only: a review that changes files
outside `.workspace/` exits 7
([ADR-024](decisions/ADR-024-the-tree-check-keeps-a-review-read-only.md)).
A review whose run ends holding a proposed plan exits 5, and stderr says
`the session returned a plan, not a result (thread <id>)`. The thread
stays, so you can read it.

A review also exits 5 when the session asks a question and waits for an
answer. Stderr then says `the session stopped to ask (thread <id>)`. The
thread stays, so you can answer it in T3 Code. A run that T3 shows as
`waiting` for a moment, with no question, does not count: `t3` waits for
it to end, up to the review's time limit.

The review's JSON line on stderr names `checkout` and `commit`. `checkout`
is where T3 records that the thread ran: its worktree, or else the
project's root. It is not where `t3` asked for the thread, so a thread T3
opened elsewhere shows up. `commit` is the full hash at that checkout's
`HEAD` after the session. Each is `null` when `lets` cannot tell.

### Which model runs

The caller chooses the model, and `t3` runs exactly that one:

- `lets delegate review instructions` and `handoff instructions` list
  the models that T3 Code's model picker offers, as `<family>/<model>`.
  `t3` asks the running T3 server for its live catalogue each time.
- They list a provider only when it is enabled, its status is ready or
  warning, and T3 Code does not mark it unavailable. A provider in
  warning is one T3 Code has not checked yet.
- They take each provider in the catalogue's order, with its default
  model first. They leave out the models you hid in T3 Code, but never a
  custom model. They list each Gemini model once, without its effort.
- When T3 Code gives no catalogue within 10 seconds, or refuses to, they
  list no models, say why on stderr, and still exit 0.
- A review or a handoff runs the model that `--model` names. A bare
  family, such as `claude`, runs that provider's default model in the
  catalogue. When you hid the default, it runs the first model you did
  not hide.
- `t3` refuses a bare family when it does not list that provider, the
  provider has no model you can see, or T3 Code gives no catalogue. It
  then tries the next `--model`.
- A Gemini model runs as given, such as `gemini-4-argon`. T3 Code has no
  effort setting for Gemini, so a review's `--effort` does not apply to
  it. A bare `gemini` runs the default model without its effort:
  `gemini-3.8-flash-high` runs as `gemini-3.8-flash`.
- When T3 Code or your account says no before the model answers, `t3`
  refuses: the command exits 3, says why on stderr, and archives any
  thread it started. Examples are a model your account cannot run, T3
  Code not running, and a repository with no T3 project. The caller can
  then try another model.

### Before the first review in T3 Code

Add your repository as a T3 project once:

```sh
t3 project add <path>
```

`t3` keeps a T3 token beside the `lets` config:

- in `$XDG_CONFIG_HOME/lets/t3-token` when `XDG_CONFIG_HOME` is
  set and not empty
- in `~/.config/lets/t3-token` otherwise

It issues a new token when none is stored there, or when T3 rejects the
one it has. T3 Code keeps its data in `~/.t3`. If you set `T3CODE_HOME`,
`t3` reads T3 Code's data from that folder instead, and issues its tokens
against it.

### After a t3 update

`t3` depends on T3 Code's internal protocol and database: it speaks
orchestration protocol 2, makes each thread with the same `launchThread`
request as the T3 UI, and reads the result from `statev2.sqlite`. A T3
Code update can break it. After each update, run these from a T3 thread
in a project that T3 knows:

```sh
printf 'Reply with the single word READY and nothing else.\n' > .workspace/p.md
lets delegate review run --for code --name smoke-review --prompt-file .workspace/p.md \
  --source-family claude --effort low --model gpt
```

Expect:

1. `READY` on stdout.
2. A JSON line on stderr with `"resolver":"t3"`, `"independent":true`, and
   `"checkout"` set to the top level of the checkout you ran it from.
3. An archived thread for the review.

Then check that `t3` still reads T3 Code's model catalogue:

```sh
lets delegate handoff instructions --for apply
```

Its `options` should list the same models as the model picker in a new
T3 thread. If they are empty, stderr says why.

Then check that a session from a linked worktree runs in that worktree.
A handoff keeps its thread open, so you can look at it:

```sh
git worktree add ../smoke-worktree -b smoke-worktree
cd ../smoke-worktree
mkdir -p .workspace
printf 'Reply with the single word READY and nothing else.\n' > .workspace/p.md
lets delegate handoff run --for apply --name smoke-handoff \
  --prompt-file .workspace/p.md --model gpt
```

The new thread should show the `smoke-worktree` folder and branch, not
the main checkout. Then archive the thread, and remove the worktree with
`git worktree remove ../smoke-worktree` and `git branch -D smoke-worktree`.

The review spends tokens. CI never runs it.

## `cli`

`cli` runs each review and each step headless with the command line
tool (CLI) of a model family: `codex`, `claude` or `agy`. It works in a
plain terminal, or inside another harness. It declines when none of the
three is on your `PATH`.

It never starts a handoff, so it declines every one, without running
anything. Keep `subagent` after it: a handoff then falls through to the
default, which gives you the prompt to start any agent with.

### Which models it lists

`lets delegate review instructions` and `lets delegate step instructions`
list the models each CLI on your `PATH` reports, in the order `gpt`,
`claude`, `gemini`:

| Family | Listed from | What it lists |
|---|---|---|
| `gpt` | `codex debug models` | `gpt/<model>` for each model codex shows, not the hidden ones |
| `claude` | nothing: `claude` cannot list its models | the bare family `claude`, which runs claude's default model |
| `gemini` | `agy models` | `gemini/<model>` for each Gemini model, once, without its effort |

Each listing gets 20 seconds. When one fails, for example because codex
is signed out, the bare family is listed instead, such as `gpt`, and a
line on stderr says why.

### How a review runs

`cli` runs the CLI of the family that `--model` names, in the repository,
and waits for its final message:

| Family | Command | The prompt goes | The answer comes from |
|---|---|---|---|
| `gpt` | `codex exec -s read-only` | on stdin | `.workspace/lets-delegate/<name>.last-message.md` |
| `claude` | `claude -p --permission-mode plan` | on stdin | stdout |
| `gemini` | `agy --mode plan … -p <prompt>` | in the arguments | stdout |

Each command gets the review's effort, and the model that `--model`
names, with `-m` for codex and `--model` for the others. A Gemini model
also gets the effort, as `gemini-3.8-flash-high`. A bare family passes no
model, so the CLI runs its default. `cli` also tries a model it did not
list. When the review succeeds, the session's files in
`.workspace/lets-delegate/` are removed. When it fails, they stay, so you
can read them.

The review's JSON line on stderr names the repository the CLI ran in as
`checkout`, and the full hash at its `HEAD` after the review as `commit`.

A review that runs past its time limit is stopped. Each failure has its
own exit code:

| What happened | Exit |
|---|---|
| The CLI cannot start | 3 |
| The CLI exits non-zero having printed nothing, such as for a model it cannot run | 3 |
| The CLI prints and then exits non-zero, or ends with an empty message | 5 |
| The CLI runs past the time limit | 6 |

Exit 3 is a refusal: the caller can try another model.

### How a step runs

A step runs the same CLI in the same way, but in its write mode:

| Family | Command | The prompt goes | The answer comes from |
|---|---|---|---|
| `gpt` | `codex exec --dangerously-bypass-approvals-and-sandbox` | on stdin | `.workspace/lets-delegate/<name>.last-message.md` |
| `claude` | `claude -p --permission-mode bypassPermissions` | on stdin | stdout |
| `gemini` | `agy --mode accept-edits --dangerously-skip-permissions … -p <prompt>` | in the arguments | stdout |

A step runs with your own rights, with no sandbox and no prompts, so it
can run any command you can. You opt in to this by listing `cli` in
`delegate.resolvers`. To run steps elsewhere, list that resolver before
`cli`, or leave `cli` out.

The step gets its effort, model and files as a review does, and a time
limit of 120 minutes unless `--timeout-minutes` says otherwise.
`lets delegate step run` reads the [step report](#a-steps-report) from
the final message. A done step's files are removed. Any other step keeps
them, so you can read them. A refusal is exit 3, and a step past its time
limit is exit 6. A CLI that prints and then exits non-zero, or ends with
no report, gives a `failed` report at exit 0.

## `subagent`

`subagent` is the default. `lets` asks it when your config lists no
`delegate.resolvers`, or where that list has `subagent`. It never declines, it can
run no model, and it starts no session.

| Request | What it does |
|---|---|
| A review | Starts nothing, and the command exits 3. The review skill then runs the review in a subagent. |
| A handoff | Saves the prompt to `.workspace/lets-delegate/<name>.prompt.md` in the repository, and gives back the prompt and that path, so you can start any agent with it. |
| A step | Saves the prompt, with any answers added, to `.workspace/lets-delegate/<name>.prompt.md`. Then the command exits 3, and stderr names that file. The caller runs the step in a subagent with it. |
| `instructions` | Lists no models. |

To get a fresh session in another model family, list `t3` or `cli` before
`subagent` in `delegate.resolvers`.

## A step's report

This section is for you if you write a step's prompt, or a resolver that
runs steps.

`lets delegate step run` waits for the session's final message, and reads
the step report at its end. The report is a fenced block tagged
`step-report`, holding one YAML mapping. Its `outcome` is one of three:

````markdown
```step-report
outcome: done
evidence:
  - "commit 3f2a1c0: feat: run a step"
  - "pull request #164"
```

```step-report
outcome: needs-input
questions:
  - question: Which schema should the change use?
    recommendation: lets-minimal
  - question: Should the story split?
```

```step-report
outcome: failed
reason: The tests fail on main before any change.
```
````

Tell the step to follow these rules:

- **Write the report last.** `lets` reads the last `step-report` block,
  and ignores the text before it and after it.
- **Quote a line that holds `#` or `: `.** YAML reads ` #` as the start of
  a comment, so `- pull request #164` loses its number.
- **Quote no other `step-report` block.** To show one, put it inside a
  longer fence, as this page does. A block closes only at a line of at
  least as many backticks as opened it.

`lets` prints the report as one JSON line, `outcome` first, and adds
`date` to a `done` report. A final message with no valid report becomes a
`failed` report. Its `reason` says what is wrong, and its `message` holds
the final message. A session that the resolver reports failed becomes a
`failed` report with the resolver's reason. Exit 0 means a report is on
stdout, whatever its outcome.

### Resume a step with answers

When a step reports `needs-input`, put the answers in a file:

```yaml
- question: Which schema should the change use?
  answer: lets-minimal
- question: Should the story split?
  answer: No.
```

Then run the step again, with the same `--prompt-file` and
`--answers-file <path>`. `lets` adds an `## Answers` section to the end of
the prompt. It lists each pair, and says the questions are settled. A file
that is missing, is not such a list, is empty, or holds a blank question
or answer makes the command exit 2.

### The step's guidance

`lets delegate step instructions --for <step>` gives the guidance at
`delegate.step.<step>.guidance` in your `lets` config, such as
`delegate.step.build.guidance`. It does not read the handoff's guidance.
