## Context

`skills/lets-go/SKILL.md` starts from an issue number. Start step 2 stops on the default branch when none is given. Step 4 names `lets-build`'s *Confirm the packet*, and lets each of its stops stand, so an unshaped issue sends the user to `lets-shape` by hand. The skill runs three steps, propose, apply and apply review, each through one prompt frame, one relay and one subagent fallback. The frame's first lines name the change, the issue, the branch and the schema.

Constraints:

- A step never asks the user in its session (ADR-015). `lets-shape`'s single-issue mode asks one question at a time, so inside a step each round ends with a `needs-input` report and the relay asks.
- `lets-go` keeps no state (ADR-017). Before an issue exists there is no record of a shape step at all, so a shape that stops part way has nothing to resume from but its answers file.
- `lets-shape` never creates a change or a branch, so the shape step runs on the default branch, before *Claim*.
- The skill-interfaces test greps fixed strings from the skill, the overlay and the README. The pinned `lets` 0.7.0 cannot run a step here, so prose tests are the only check (D17).

## Goals / Non-Goals

**Goals:**

- Add the shape step with the machinery the other steps already use: the frame, `lets delegate step run`, the relay and the fallback.
- Keep Start's reuse of `lets-build`: the search is its case 2, named, with one more stop set aside.
- Keep every change inside `skills/lets-go/SKILL.md`, its spec, its tests and the two routing rows.

**Non-Goals:**

- A large idea and discovery (#154).
- A default level in the `lets` config (#159).
- Changing `lets-shape` or `lets-build`.
- A glossary entry for *Idea* (D16).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which greps the skill's prose, `overlays/AGENTS.md`, `README.md` and `flows.json` for the fixed strings the spec lists.
- **Existing seams reused:** the `lets-go` tests already in that file. `lets-go ships in both flows with a routing row` changes its `request` string; one new test holds the shape strings.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** one skill's prose and its spec; two routing rows; one bats file. No code in `lets/`, no schema, no other skill.

## Decisions

### D-1: Shape is a fourth step on the same machinery, run inside Start

Start step 2 gains the idea path. When the request is an idea, or when step 4's *Confirm the packet* stops with a `lets-shape` remedy, Start runs the shape step with *Write the prompt*, *Run a step*, *Read the report* and *Relay the questions* as they are, then goes on from step 3 with `<i>`. The step list becomes four, and the table gains a `shape` row. Nothing new is written for the step's lifecycle (D5, D9).

Alternatives: shape as a section of its own with its own loop (two copies of the relay to keep in step); running `lets-shape` in the `lets-go` session itself (it asks the user directly, which breaks the level, and it would be the one step without a report or a fresh session).

### D-2: Start searches, in this session, and the user confirms

`lets-build`'s case 2 already searches by words and confirms a match with the user. Start names it. The confirmation is asked here, at both levels: it is a yes or no about identity, and a wrong yes claims someone else's issue. On a yes the run continues as for a number. On a no, or no match, the case's stop is set aside and the shape step runs (D3). The prompt tells the step the search has run, so `lets-shape` skips its own and creates the issue (D6).

Alternative: let the shape step search and report the match as a `needs-input` question. Rejected: it costs a session round trip for the common case, and `lets-build` has the search already.

### D-3: Every `lets-shape` stop in *Confirm the packet* becomes the shape step

*Confirm the packet* has three stops whose remedy is `lets-shape`: not shaped, a missing or placeholder line, and unread comments. All three mean shape is not done, which is what the shape step is for. One rule sets all three aside; the Epic stop stands (D4). The prompt names #<i>, and `lets-shape`'s single-issue mode does the rest: joining the Project, asking about comments, interviewing for the template.

Alternative: only the idea path runs shape. Rejected: the search then dead-ends on an issue with no packet, which is the usual state of an issue someone filed in passing.

### D-4: The shape step runs at `ask` unless the user named a level

Before shape there is no Kind, so the Kind default cannot apply. `ask` fits: shape is where the user's intent is captured, and the final confirmation has no recommendation at either level. The line is `Interactivity: ask, because shape has not run yet.` After shape, step 10 picks the level again from the Kind the packet got, unless the user named one, so the rest of the run matches a run started from the number (D7).

Alternative: ask the user which level. Rejected: the skill never asks that, and the user can name one with the idea.

### D-5: The report's first evidence line names the issue

The shape step is the one step whose output `lets-go` must read: the issue number. The prompt fixes the form, `issue #<n>: <title>`, as the first evidence line, and `lets-go` reads `<n>` from it. A `done` report without it is `failed`, like a `done` report without evidence (D8). The `Done shape:` line then carries that evidence, so the user sees the issue.

Alternatives: a second search by the idea's words (fuzzy, and the title may differ); the newest issue assigned to the user (wrong in a shared backlog).

### D-6: Shape's scratch files are named by the input, not the change

There is no change name before shape. `issue-<i>` serves an existing issue. For an idea, `idea-<slug>` with the first five words keeps the answers file across a retyped run, and a different idea gets a different file (D10). The step's `--name` is `<name>-shape`, as for the other steps.

Alternative: one fixed name, `idea`. Rejected: *Run a step* feeds an existing answers file into the first round, so a stale file from an earlier idea would answer a new one.

### D-7: A too-large idea fails the step

`lets-shape` stops at Size L or XL and offers discovery. In a step, that offer is a `failed` report whose reason says so and names `lets-shape` discovery (D11). `lets-go` prints `Failed shape: <reason>` and, since there is no branch, says to run `lets-shape` on the idea. #154 replaces this with the discovery path.

Alternative: a `needs-input` question offering discovery. Rejected: this story cannot act on a yes.

### D-8: The frame's first lines vary for shape; the rest does not

The frame names the issue, the branch and the schema. For shape, the issue is `#<i>` or `none yet` with the idea, the branch is the default branch, and the schema line is left out. The `## Questions` and `## The report` sections are shared, so the relay and the parser see one format (D12). The subagent fallback says the shape step works on the default branch.

### D-9: The spec removes the one-input requirement and adds a new one

The requirement `lets-go takes one issue number` names the one input in its heading, and MODIFIED must keep the heading. So the delta removes it and adds `lets-go takes one issue number or an idea`, with every scenario the old one had. The shape step gets a requirement of its own. The main spec's `## Purpose` still says "for a shaped Chore, Bug or Story"; one task edits it directly, as the schema allows.

None of these decisions is costly to reverse. ADR-015 and ADR-017 already hold the two decisions this design leans on, so the ADR step records none.

## Risks / Trade-offs

- [A shape step at `ask` costs one session per round, and `lets-shape` asks one question at a time] → The prompt frame already says to list every open question before stopping, so the interview is a few rounds, not one per question. The user can name `recommend`.
- [The search in Start matches nothing for a long idea] → `lets-build`'s case 2 leaves the search words to the skill. The miss costs one more question in the shape step, where `lets-shape`'s own step 1 is told the search has run.
- [The slug for `idea-<slug>` differs when the user retypes the idea] → Only the answers file is lost. Shape leaves no other record before the issue exists, and the run reaches the same step.
- [The shape step writes an issue, then the run stops before *Claim*] → The issue is shaped and on the Project. Running `lets-go` with its number, or `lets-build`, carries on. Nothing is half-written.
- [A `done` report whose first evidence line is not `issue #<n>: <title>` fails a step that did its work] → The user reruns with the issue number the report's text names. The prompt shows the exact line.

## Migration & Rollback

N/A. The skill reaches this repository at the next release, through `lets sync`.
