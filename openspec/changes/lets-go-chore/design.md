## Context

`lets-build` is one skill that finds, confirms, routes and claims an issue, then plans, builds and finishes the change in the user's session. Its *Propose* section already delegates the build through `lets delegate handoff run`, with a model chosen from `handoff instructions` and the user's guidance. `lets delegate step run` exists on this branch: it runs a session that may write files, waits, and prints a step report as one JSON line. With the default `subagent` resolver it saves the composed prompt and exits 3, so the caller runs the step in a subagent. `--answers-file` resumes a step with the answers to its last `needs-input` report.

A step session cannot talk to the user. In T3 Code, a thread that stops to ask is reported as a failed session. A subagent has no user at all. So every question a step has must travel in its report, and only the `lets-go` session asks the user.

The skills are prose. `tests/skill-interfaces.bats` checks them by grepping for fixed strings, resolving links, and checking that each flow ships what its schema, config and skills name. Three skills are entry points that nothing names: `lets-build`, `lets-shape` and `lets-setup-backlog`. `flows.json` lists each flow's skills. `overlays/AGENTS.md` carries the routing table that `lets sync` writes into a project, and `tests/sync-rules.bats` checks that table.

This repository runs the pinned `lets` 0.7.0, which has no `step` command. `lets-go` cannot run here until the next release, so the tests check the prose, not a run.

## Goals / Non-Goals

**Goals:**
- One new skill, `lets-go`, that reads like the others: short sections, one command block per command, exact strings the tests can grep.
- Start reuses `lets-build` by naming its sections, so the claim rules live in one place.
- Three step prompts that share one frame, so a later story adds a step by adding a row.
- The relay is a loop a reader can hold in their head: read the report, answer or ask, append, run again.

**Non-Goals:**
- Running shape as a step, resuming a run from a change's branch, Stories, Bugs, the `ask` level, ideas, the `t3` and `cli` resolvers running steps.
- Changing `lets`, `lets-build`, `lets-brainstorm` or any step's inner workings.
- A new glossary term.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. New tests grep `skills/lets-go/SKILL.md` for the commands, the ranking rules, the skip and level lines, the section names of `lets-build` it reuses, and the absence of `gh project item-edit`. The entry-point case in the flow-ships test gains `lets-go`.
- **Existing seams reused:** `tests/sync-rules.bats` for the routing row `lets sync` writes; the flow-ships test, which reads `flows.json`, for both flows shipping `lets-go`; the existing checks that every `lets delegate step` the prose names is followed by `instructions` or `run`, and that every `gh` command the prose names is one `gh` knows.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. One new skill on the patterns of `lets-build`'s handoff and the step contract from #162. No code, no data, no new dependency. The relay is a new contract between `lets-go` and every step prompt, which #150 and #152 extend.
- **Blast radius:** `skills/lets-go/`, `flows.json`, `overlays/AGENTS.md`, `README.md`, `tests/skill-interfaces.bats`, `tests/sync-rules.bats`.

## Decisions

### D-1. Start names `lets-build`'s sections instead of repeating them

`lets-go`'s *Start* section says: run `lets-build`'s *Find the source of demand* for the named issue, then *Confirm the packet*, *Route* and *Claim*, and come back here. It adds the two gates of its own that come before them: the default branch, and Kind Chore. It repeats none of the `gh` commands.

Alternative: copy the four sections into `lets-go`. Rejected: two copies of the claim rules drift, and #136 would then have two places to change when the backlog adapters land. Alternative: make `lets-build` the step runner and have `lets-go` only call it. Rejected: `lets-build`'s table runs *Propose* in the session, and #157 has not decided its future yet.

### D-2. One prompt frame, three "what to run" rows

The skill holds one prompt frame, with the fields every step gets: the step, the change, the issue, the branch, the schema, the interactivity level and what it means, the rule that the step never asks in its session, the report rules, and what `done` evidence holds. A table gives each step's "what to run" paragraph: propose runs `openspec-propose` for the change with the route line and does not offer the handoff; apply runs `lets-build` on the branch and stops when every task is ticked; apply review runs `lets-build`'s *Finish the change*. `lets-go` writes the frame and the row to `.workspace/lets-go/<name>-<step>-prompt.md`.

Alternative: three whole prompts. Rejected: the report rules and the level would be stated three times, and a fix in one would miss the others.

### D-3. The user is asked only in the `lets-go` session

A step never asks the user. It ends with a `needs-input` report that lists every open question, with a recommendation where it has one and none for a confirmation. `lets-go` answers a recommended question itself at the `recommend` level, says so, and asks the user the rest one at a time. The step itself never decides a question, so the same prompt serves the `ask` level in #152, where `lets-go` relays every question. This is the one decision in this change that later stories and resolvers bind to, so it gets a record: ADR-015.

Alternative: let the step take its own recommendations at `recommend` and report only the rest. Rejected: the level would then live in two places, the step's behaviour and the relay, and the user would not see what was decided for them. Alternative: let a step that has a user, such as a T3 thread, ask directly. Rejected: the resolver reports a thread that stops to ask as a failed session, and a subagent has no user; two paths for one thing.

### D-4. The answers file grows, and a repeated question stops the run

`lets-go` appends every pair of each round to one answers file per step, so a resumed step sees every settled question. A `needs-input` report that holds a question whose text is already in the file stops the run: the step did not read its answers, and another round would loop. The match is the question's exact text.

Alternative: a fixed number of rounds. Rejected: a brainstorm may need several rounds for good reasons, and a bound would stop a healthy run.

### D-5. On exit 3, `lets-go` reads the block itself

When `step run` exits 3, `lets` is out of the loop. `lets-go` runs the saved prompt in a subagent that may write files, and reads the last `step-report` block from its final message by the rules in ADR-014: three or more backticks and `step-report` to open, at least as many backticks alone to close, one YAML mapping with `outcome`. It writes what it read to the same report file a `lets` run would have produced, and stamps a `done` report's date itself.

Alternative: ask the subagent to write a JSON file. Rejected in ADR-014: a stale file can be read as this run's report, and the final message cannot be stale.

### D-6. Every step runs at effort `high`

Propose plans, apply builds test-first, and apply review runs a code review and verify. None is a narrow fix. One effort keeps the command block one line.

### D-7. The step runs in the user's checkout

Start checks out the change's branch in the repository, as `lets-build`'s *Claim* does. Each step session gets the repository root as its working directory, so it inherits that checkout. `lets-go` does not switch branches between steps. A resolver that runs steps in another checkout is that resolver's concern (#155, #156).

## Risks / Trade-offs

- [A step session asks the user anyway, despite the prompt] → With the default resolver, the subagent has no way to ask. With a resolver that reports the session failed, `lets-go` shows the reason and names the step and the branch; `lets-build` on the branch carries on.
- [A resumed brainstorm runs from the start each round, so a long brainstorm costs several sessions] → The prompt carries every answer, and `lets-brainstorm` skips a question whose answer is known. A chore's brainstorm is short.
- [The step's `done` evidence is free text, so `lets-go` cannot check it] → `lets-go` reports it as given. The archive commit and the pull request's state are the real evidence, and apply review reaches them.
- [`lets-go` cannot run on this repository until the next release] → The tests check the prose. The first real run is the dogfood after the release.

## Migration & Rollback

N/A. A new skill. Removing it from `flows.json` removes it from the next release.
