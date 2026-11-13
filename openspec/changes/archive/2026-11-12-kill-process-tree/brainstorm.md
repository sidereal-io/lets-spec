## Story

#178 kill-process-tree — a timed-out session stops every process it started.
https://github.com/sidereal-io/lets-spec/issues/178

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which processes does a timeout stop? | The command and every process in its process group: its children, their children, and so on. A process that moves itself into a new process group or session, such as a daemon started with `setsid`, is not stopped. | Evidence: #178 Scope (in: "start the command in its own process group and signal the group"); Assumption for the limit |
| D2 | Which commands does this reach? | Every call to the kit's `realIo().execFile` that has a time limit: a `cli` review, a `cli` step, a `cli` model listing (20 s), and the `t3` resolver's token request. No resolver code changes. | Evidence: callers of `io.execFile` in `lets/src/resolvers/cli/cli.ts` and `lets/src/resolvers/t3/t3.ts` |
| D3 | Does the other `execFile`, in `lets/src/io.ts`, change too? | No. It runs `gh`, `git` and `openspec` for `lets sync` and `lets backlog`, which start no long-lived children, and the packet names only the kit. | Assumption |
| D4 | How is the group stopped? | `SIGTERM` to the whole group. If any process in it is still alive 5 seconds later, `SIGKILL` to the group. | Evidence: #178 Scope (in: "a short wait and then SIGKILL"); Assumption for 5 seconds |
| D5 | When does `execFile` return after a timeout? | Once the group is gone, or once `SIGKILL` is sent, with `timedOut` set. It does not wait for the output pipes to close. So `lets delegate review run` or `step run` exits 6 at most about 5 seconds after the time limit, even when a process outside the group still holds a pipe. | Evidence: #178 Expected ("exits 6 promptly") and Actual (the pipes delay the exit); Assumption for the bound |
| D6 | Does a command that ends in time change? | No. Nothing is signalled. A command that exits in time but leaves a background child behind is not this story. | Evidence: #178 Expected (only "when `io.execFile` times out") |
| D7 | Does Ctrl-C still stop a running session? | Yes. Today the terminal's Ctrl-C reaches the CLI and its children because they share the process group of `lets`. In its own group, the command would no longer get it. So when `lets` gets `SIGINT`, `SIGTERM` or `SIGHUP` while a command runs, it sends the same signal to the command's group, then ends as it would have. | Evidence: Node `child_process` docs (`detached` makes the child the leader of a new process group and session) |
| D8 | Which platforms? | Linux and macOS, the systems `lets` is built for. Both have process groups. | Evidence: `flake.nix` (`systems`), `docs/resolvers.md` |
| D9 | Does #221 or #102 change anything this story relies on? | No. #221 raises the review time limits to 30 and 45 minutes, and makes `cli`'s `execute` also return the checkout. Neither changes how a command is stopped, or `kit/io.ts`. #102 changes only `t3.ts`. The stop starts at whatever limit the caller passes. | Evidence: `openspec/changes/t3-review-session-fit/design.md` (decisions 4 and 7), `openspec/changes/t3-review-waiting-is-transient/brainstorm.md` |
| D10 | How is the fix accepted? | Tests of the real `execFile` with real processes: a grandchild such as `sh -c 'sleep 600 & sleep 600'` is gone after a timeout; a group that ignores `SIGTERM` is stopped by `SIGKILL`; a process outside the group that holds stdout does not delay the result; and a signal to `lets` reaches the group. In `delegate-resolvers`, the `cli` review and step time-limit scenarios say the CLI and every process it started are stopped. | Evidence: #227 Shared decisions, #178 Scope |
| D11 | Do the docs change? | Yes. The `cli` section of `docs/resolvers.md` says a session past its time limit is stopped with every process it started, and that a process that leaves its group is not. | Assumption |

## Changes from the story

- Added: Ctrl-C and other signals to `lets` are passed to the command's group (D7). Running the command in its own group would otherwise stop Ctrl-C from reaching it, which works today. This widens the story.
- Made explicit: `execFile` returns after a timeout without waiting for the output pipes (D5). The packet's Expected and Actual imply it.
- Narrowed: a process that leaves the group (D1), a command that ends in time (D6) and `lets/src/io.ts` (D3) are out.
- Added: the `docs/resolvers.md` text (D11).
- No split: about six tasks.

The user delegated the brainstorm for epic #227: the agent decides and records its recommendations, and asks only where it has none. Every question here had a recommendation, so no question went to the user. The issue has no comments.

Confirmed by user: yes
