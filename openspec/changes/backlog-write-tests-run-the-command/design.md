## Context

The tests in scope (D1) drive `run()` from `lets/src/backlog/commands.ts`
with `backlogDeps()` from `tests/lets/backlog/fixtures/fake-gh.ts`. A row
there may answer with a function of the call, and the functions share
variables in the test, which is how a claim comment written by one call
is read back by the next. `race.test.ts` goes further: two sessions share
one set of variables, and a promise holds both at the assignee read.

#315 left `tests/support/lets.ts` and `tests/backlog/github.ts` with
what a black-box test of a read needs: `runLets`, `standIn` with exact
and prefix rows, and `backlog()`, which makes a repository, a stand-in
`gh` and the lets config files. Constraints that shape the approach:

- A stand-in is a separate program, run once per `gh` call. It keeps
  nothing between calls, and its answers are fixed in its table file.
- `claim` reads the issue's comments up to three times in one run, and
  writes in between (`claim()` in `lets/src/backlog/policy.ts`). Each
  read must see the earlier writes (D6).
- `lets` passes its environment to `gh` and runs it in the repository
  (`ghRunner` in `lets/src/backlog/github.ts`).
- The comment `claim` posts is `-f body=lets-go claimed this
  issue.\n\nToken: <uuid>`, and the token comes from `randomUUID` (D7).
- Node 26 runs `.ts` files by stripping their types. `tsconfig.json`
  sets `erasableSyntaxOnly`, so every test module can be imported by a
  stand-in that runs under the same Node.
- `node --test` runs each file in its own process, and the tests in a
  file one after another.

## Goals / Non-Goals

**Goals:**

- Each deleted test's case is checked by a black-box test, and a
  reviewer can match the two by name.
- A race test sets the order of two `lets` processes by gates, never by
  timing (D11).
- Tests written before this change, and their rows, keep working
  unchanged.

**Non-Goals:**

- A stand-in that acts out GitHub in general. The stand-in issue
  answers only the calls `claim`, `release` and `complete` make on one
  issue.
- A way to make `gh` time out in a black-box test (D8).
- Changes to `lets`, to `fixtures/fake-gh.ts` or
  `fixtures/fake-provider.ts`, or to the tests of the read commands.

## Test Seams

- **Primary test seam:** `lets/bin/lets backlog …` run as a program by
  `backlog()` in `tests/backlog/github.ts`, in a temporary git
  repository, with the stand-in `gh` first on `PATH`. A test observes
  the exit code, standard output, the calls the stand-in logged, and the
  state the stand-in issue kept.
- **Existing seams reused:** `tests/support/lets.ts` (`runLets`,
  `tempDir`, `standIn`) and `tests/backlog/github.ts` (`backlog`,
  `LOOKUP_ONE`, `json`, `fail`). The kept tests still use `run()` with
  `backlogDeps()` and `fakeProvider()`.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. Test code only, on the pattern #315 set. The new
  stand-in options are a contract that later stories may build on, and
  the race tests run two processes at once.
- **Blast radius:** `tests/support/lets.ts`, `tests/backlog/github.ts`,
  a new `tests/backlog/issue.ts`, new `tests/backlog/*.test.ts` files,
  and the five in-scope files in `tests/lets/backlog/`. No file under
  `lets/` changes.

## Decisions

### 1. A stand-in row can answer through a function in a module, from shared state

`StandInRow` gains two optional fields, and `standIn` an optional
fourth argument:

```ts
/** What a stand-in prints and how it exits. */
export interface StandInReply {
  stdout?: string;
  stderr?: string;
  /** The exit code. 0 when absent. */
  code?: number;
}

/** A function a module exports, which answers a call in place of a row's fixed reply. */
export interface StandInAnswerer {
  /** The module's absolute path or file URL. The stand-in imports it for each call it answers. */
  module: string;
  /** The name of the exported function. */
  name: string;
  /** A JSON value, passed to the function as `data`. */
  data?: unknown;
}

// The exported function's shape. It may change `state` in place, and
// the stand-in saves it once the function returns.
export type StandInAnswer = (call: { args: string[]; state: any; data: unknown }) => StandInReply | Promise<StandInReply>;

export interface StandInRow {
  args: string[];
  prefix?: boolean;
  stdout?: string;
  stderr?: string;
  code?: number;
  /** Answer through this function, in place of stdout, stderr and code. */
  answer?: StandInAnswerer;
  /** Hold the call at the gate of this name until the test opens it (decision 2). */
  gate?: string;
}

export interface StandInOptions {
  /** The state and gates this stand-in shares with others. Its own, in its folder, when absent. */
  shared?: SharedState;
}

export function standIn(dir: string, name: string, table: StandInRow[], options?: StandInOptions): StandIn;
```

The state is one JSON value in `state.json`, in the shared folder. For a
call whose row has `answer`, the stand-in takes a lock (a folder it
makes with `mkdir`, which fails when the folder exists), reads the state,
runs the function, writes the state back and removes the lock. So two
processes never write the state at once. A function that throws, or a
lock not free within 10 seconds, makes the stand-in exit 127 and say so
on standard error, as for a call no row answers. A row without `answer`
answers as it does today, and never reads the state.

*Alternatives:*

- Copy the function's source into the program with `toString()`. A
  function that uses a variable from the test would fail only when the
  stand-in runs it, with an error far from the cause. A module is
  type-checked, and its imports work.
- A separate stand-in GitHub program in `tests/backlog/`. #308's Shared
  decisions say later stories extend the helper module's stand-in and
  never copy it, and the extension is useful to any stand-in.
- Fixed rows that act out each call of a claim in order. A claim reads
  the comments up to three times, and the race tests need state that two
  processes share, so the rows would need state anyway.

### 2. A gate holds a call until the test opens it

`tests/support/lets.ts` exports `sharedState`:

```ts
/** State and gates in one folder, for stand-ins to share. */
export interface SharedState {
  /** The folder that holds `state.json` and the gates. */
  dir: string;
  /** The state as the stand-ins left it. */
  read(): any;
  /**
   * Resolves once `count` calls wait at `gate`. Rejects after 10 seconds,
   * naming the gate and how many calls came.
   */
  waiting(gate: string, count: number): Promise<void>;
  /** Lets every call at `gate` go on, now and later. */
  open(gate: string): void;
}

/** Makes the folder `dir`, with `initial` as the state, `{}` when absent. */
export function sharedState(dir: string, initial?: unknown): SharedState;
```

A call whose row has `gate` writes a file named for its process into
`gates/<gate>/` in the shared folder, then waits until the file
`gates/<gate>.open` exists, checking every 10 milliseconds. It waits
before it takes the lock, so a held call never blocks another. After 20
seconds, or when the shared folder is gone, it gives up and exits 127,
so a test that never opens its gate fails and leaves no process behind.

The waits are polling, but no result depends on how long they take: a
call goes on only when the test opens its gate.

*Alternatives:*

- Sleeps between the two runs. The order would then depend on the
  machine's speed (D11).
- A named pipe for each gate. Opening a pipe blocks without polling, but
  a pipe that nobody opens hangs the stand-in until `runLets` kills
  `lets`, and the stand-in would outlive it.

### 3. The stand-in issue acts out one GitHub issue

`tests/backlog/issue.ts` exports one `StandInAnswer`, `answerIssue`,
and the type of its state. It imports nothing at run time, so each
`gh` call loads one small file.

```ts
/** A comment as `gh api …/comments` prints it. */
export interface Comment {
  id: number;
  body: string;
  user: { login: string; type: string };
  author_association: string;
}

export interface IssueState {
  assignees: string[];
  /** The comment pages, as `--paginate --slurp` prints them. A post goes on the last page. */
  pages: Comment[][];
  /** The id the next posted comment gets. */
  nextId: number;
  /** Each Status value written, in order. */
  status: string[];
  state: 'OPEN' | 'CLOSED';
  /**
   * Comments another session posts just after this session's first post,
   * each onto its page. Added once, then emptied.
   */
  rivals: { page: number; comment: Comment }[];
  /** When set, every comment read after the first post fails with this error. */
  readsFailAfterPost?: string;
  /** Whether a comment was posted. */
  posted: boolean;
  /**
   * When true, deleting a comment another login wrote fails with `HTTP 403`.
   * The race tests set it. A claim deletes earlier claims by any login, so
   * other tests leave it unset.
   */
  ownDeletesOnly?: boolean;
}
```

The row's `data` is `{ number, login }`: the issue, and the login of the
session whose `gh` this is. `answerIssue` answers these calls, with
`acme/app` as the repository and Project 7 of `acme` as the backlog:

| Call | Answer |
|---|---|
| `api user` | `{ login }` |
| `issue view <n> --json assignees,url` | the assignees and the issue's URL |
| `issue view <n> --json url` | the URL |
| `issue view <n> --json state` | the state |
| `issue edit <n> --add-assignee @me` / `--remove-assignee @me` | adds or removes `login` |
| `api repos/acme/app/issues/<n>/comments --method POST -f body=…` | posts a comment by `login`, as `OWNER`, with the next id, then adds the rivals |
| `api repos/acme/app/issues/<n>/comments --paginate --slurp` | the pages |
| `api repos/acme/app/issues/comments/<id> --method DELETE` | deletes the comment; exit 1 with `HTTP 404` when it is missing, and with `HTTP 403` when another login wrote it and `ownDeletesOnly` is set |
| `project item-edit 7 --owner acme --url <url> --field Status --value <v>` | adds `v` to `status` |
| `issue close <n> --reason completed` | sets the state to `CLOSED` |

Any other call exits 127, naming the call. The 403 rule stands in for
the old race test's check that a session deletes only its own comment.
It is off unless the state sets `ownDeletesOnly`, because a claim that
wins deletes every earlier claim, whoever wrote it (`claim()` in
`lets/src/backlog/policy.ts`), as "an unassigned issue ignores an old
claim by abandoned" and the reclaim tests check.

`tests/backlog/github.ts` gains the builders:

- `issue({ number = 149, login = 'octocat' } = {})`: the row
  `{ args: [], prefix: true, answer: … }`, which matches every call. It
  goes last in a table, after `LOOKUP_ONE` and after any row a test adds
  to make one call fail or answer otherwise.
- `issueState(partial)`: an `IssueState` with no assignees, one empty
  page, `nextId` 1, no Status, `OPEN`, no rivals, `ownDeletesOnly`
  unset, and `partial` on top.
- `claimComment(token, { id, login, association })`: a comment with the
  claim body.

*Alternative:* answer each test's calls with its own rows, as the old
tests did. The model is written once, and a test states only what is
different about its issue.

### 4. `backlog()` takes the state, and can start a second session

`backlog(t, rows, { config?, repoConfig?, files?, state? })` makes a
`sharedState` in the test's temporary folder, with `state` as its
initial value, and gives it to the stand-in `gh`. The result gains:

- `state()`: the state the stand-ins kept;
- `waiting(gate, count)` and `open(gate)`, from decision 2;
- `session(rows)`: another session in the same repository, with the
  same lets config and the same state, and a stand-in `gh` of its own,
  which answers from `rows` and keeps its own log. It returns
  `{ lets(...args), calls() }`, which work as the first session's do.

Tests that give no `state` get `{}`, and their rows never read it, so
#315's tests do not change.

### 5. The tests live in `tests/backlog/`, by command

| New file | Takes the tests of | Moves |
|---|---|---|
| `claim.test.ts` | `tests/lets/backlog/claim.test.ts` | 13 of 16 |
| `release.test.ts` | `release.test.ts` | 7 of 8 |
| `complete.test.ts` | `complete.test.ts` | 8 of 10 |
| `race.test.ts` | `race.test.ts` | 4 of 4 |
| `reclaim.test.ts` | `reclaim.test.ts` | 2 of 2 |

The counts are `test()` calls. Three of them sit in loops, so 43 tests
run: "an unassigned issue ignores an old claim by `<login>`" in
`claim.test.ts`, for `octocat` and `abandoned`; "release while the loser
cleans up leaves no owner" in `race.test.ts`, for `(alice, alice)` and
`(alice, bob)`; and "release after reclaiming an abandoned issue by
`<login>`" in `reclaim.test.ts`, for `octocat` and `abandoned`. Each
moves with every case of its loop.

Each moved test keeps its name where its case is unchanged. A test that
checked `t.ran(key)` checks `calls()` for a call that starts with the
same arguments. A test that checked a variable of its fake checks
`state()`. A case where another session writes between two calls of one
run, such as the earlier claim in "the earliest valid claim wins across
comment pages", is acted out by `rivals`, as the old test acted it out
in its row's function.

The deleted tests go in the same commit as the black-box tests that
cover them, so no case is ever unchecked (#308's Shared decisions).

### 6. Cases that timed out use a `gh` call that fails (D8)

| Old test | Black-box test |
|---|---|
| "a failed claim comment write retains its recovery token" (the post timed out) | The post exits 1. The result is `failed`, `write: claim`, with a claim token, and no Status is written. |
| "a state read that times out is backend-failed, and closes nothing" | The state read exits 1, as "a state read that fails is backend-failed, and closes nothing". |
| "a close that times out returns failed, says it may have happened, and is not retried" | Its retry check joins "a close that fails returns failed with gh's error, exits 0, and is not retried". |

The in-process test of the close is narrowed to its message, and renamed
"a close that times out says the write may have happened".

### 7. The race tests run two processes and open gates in order (D11)

Each race test calls `backlog()` for the first session and
`b.session()` for the second, with `ownDeletesOnly: true` in the state. Each session's table has `LOOKUP_ONE`,
then a gate row, then `issue({ login })`. The gate row matches the
assignee read, `issue view 149 --json assignees,url`, has
`gate: 'assignees'`, and answers through `answerIssue` too.

1. The test starts `lets backlog claim 149` in both sessions, without
   waiting.
2. It awaits `waiting('assignees', 2)`, so both have read no assignee
   before either assigns, and opens the gate.
3. It awaits both runs, and checks their output, each session's calls
   and `state()`.

"a repeated loser release preserves a shared-login winner" reads the
loser's token from the post in the loser's `calls()`, since the loser's
result is `taken` and holds no token.

"release while the loser cleans up leaves no owner" runs for the logins
`(alice, alice)` and `(alice, bob)`. It adds a second gate row,
`cleanup`, to both tables, before `issue({ login })`, on
`api repos/acme/app/issues/comments/2 --method DELETE`. Like the
`assignees` row, it answers through `answerIssue`, so the held delete
removes the comment once the gate opens. Comment 2 is the
loser's, because the first post gets id 1 and the lowest id wins. After
step 2:

1. The test awaits `waiting('cleanup', 1)`, then the first run to end.
   The loser is held, so that run is the winner's, and its output holds
   the winner's token.
2. It runs `lets backlog release 149 --claim <token>` in the winner's
   session, a real release.
3. It opens `cleanup`, awaits the loser, and checks that `state()` has
   no assignee, no comment, and one `Todo` in `status`.

### 8. The kept tests stay where they are, and the pull request lists them

| File | Kept | Reason |
|---|---|---|
| `claim.test.ts` | "a write that times out is failed, and says it may have happened"; "every write has a finite timeout" | a black-box test would wait 60 seconds for each (D8) |
| `complete.test.ts` | "a close that times out says the write may have happened" | same (D8) |
| `claim.test.ts`, `release.test.ts`, `complete.test.ts` | the Jira-style keys test of each | needs a second backlog provider, which no command can load (D9) |

The kept files keep their imports of `fixtures/fake-gh.ts` and
`fixtures/fake-provider.ts`, so `fixtures/` stays (D10). The pull
request lists these six under the heading *Kept in process*, beside
#315's, with the reasons above (D12).

No decision here is costly to reverse: each is test code that a later
story can change.

## Risks / Trade-offs

- [Each `gh` call starts a Node process and imports `issue.ts`, so a
  claim of about eight calls takes far longer than in process] → Measure
  `tests/backlog/` once it is written. If one file takes over 30
  seconds, run its tests with `describe(…, { concurrency: true })`;
  each test has its own folders, so they share nothing.
- [A race test hangs when a gate never fills, for example when a change
  to `lets` stops it reading assignees] → `waiting` rejects after 10
  seconds, naming the gate and how many calls came, and a held call
  gives up after 20 seconds.
- [The race tests' first run to end is assumed to be the winner's] → In
  the clean-up case the loser is held at `cleanup` until the winner's
  run has ended, so no other order can happen. The test also checks that
  run's result is `claimed`.
- [A lock left behind by a killed stand-in blocks later calls] → Only
  within that test's own folder, which is removed after it. The next
  call fails within 10 seconds, saying the lock was not free.
- [`issue.ts` drifts from what GitHub does] → It answers the calls the
  old fakes answered, with the same JSON shapes, and fails loudly on any
  other call.

## Migration & Rollback

N/A. Only tests change. To roll back, revert the branch's commits.
