## Context

`skills/lets-go/SKILL.md` runs a `shape` step for an idea, or for an issue whose packet is not complete. Its prompt row runs `lets-shape`'s *Shape one issue*, and says that work of Size L or XL ends the step with a `failed` report. `lets-go` then prints `Failed shape:` and tells the user to run `lets-shape` discovery by hand. *Read the report* reads one issue number from the first evidence line, `issue #<n>: <title>`.

`lets-shape`'s discovery runs six phases. It confirms each one with the user, then writes it at once: the parent issue's status line names the next phase, and `discovery.md` holds the personas and the journey map. Its *Resume mode* picks a run up from those records. The map is edited in the working tree on the default branch; so far a person has committed it there by hand.

Constraints:

- A step never asks the user in its session (ADR-015). Each discovery phase ends the step's round with a `needs-input` report, and a fresh session resumes it with every answer so far.
- `lets-go` keeps no state (ADR-017). Where a discovery stands is read from the parent issue and the map, which `lets-shape` already writes.
- *Find the first unfinished step* stops on any path outside `.workspace/` that `git status --porcelain` lists. A dirty map on the new branch would stop the run right after *Claim*.
- `lets-go` adds no check of its own to `lets-build`'s sections, and names them instead. The pick of the next story is `lets-build`'s `next` case.
- The skill-interfaces test greps fixed strings. The pinned `lets` 0.7.0 cannot run a step here, so prose tests are the only check (D17).

## Goals / Non-Goals

**Goals:**

- Run discovery inside the shape step, on the machinery the step already has: the prompt frame, the relay, the answers file and the subagent fallback.
- Read the parent and the stories from the report, and pick one story with `lets-build`'s rule.
- Leave the tree clean on the story's branch before any record is read.

**Non-Goals:**

- Building more than one story in a run (#154 Scope, out).
- Changing `lets-shape`'s phases, confirmations or glossary handoff.
- A new step, strategy or `lets` command.
- A default interactivity level (#159).

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, which greps the skill's prose and the README for the fixed strings the spec lists.
- **Existing seams reused:** the test `lets-go runs a shape step for an idea or an unshaped issue`, which gains the discovery strings and loses the too-large phrase.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** one skill's prose and its spec; one bats test; one README section. No code in `lets/`, no schema, no other skill.

## Decisions

### D-1: Discovery is a path inside the shape step, entered through a question

The `shape` row gains one rule. When the step finds the work too large for one issue, or finds that the input holds a large idea, it ends the round with the question `The work is Size <L or XL>, too large for one issue. Run discovery on it?`, recommended `yes`. On `yes`, the resumed step runs `lets-shape`'s discovery from Ingest to Finalize with the same input. On any other answer, the step fails as it did before (D2).

The question keeps `lets-shape`'s stance: it offers discovery, it does not start one unasked. It costs no extra round. The step stops there anyway, because a too-large idea has no packet to confirm. At `recommend`, `lets-go` answers `yes` itself; at `ask`, the user does.

The step keeps its name, `issue-<i>` or `idea-<slug>`, its answers file and its once-per-run bound (D3). A separate `discover` step would need a second prompt, a second answers file and a rule for passing the input between the two.

Alternatives: the step starts discovery on its own at Size L or XL. Rejected: a step never decides a question itself (ADR-015), and `lets-shape` asks. Start asks the user up front whether the idea is large. Rejected: the step judges size with the code in view; Start has not read it.

### D-2: A resumed round finds the discovery in `lets-shape`'s records

Each phase's confirmation ends a round. The next round is a fresh session with the same prompt and every answer so far. It must not start a second discovery. The prompt says that an open parent issue that says `Discovery status: in-progress` and names this input is resumed, as *Resume mode* says (D5). The parent's `Input:` line names the idea or the issue, so the step can match it. The answers file holds the earlier answers, and the prompt frame already says an answered question is never asked again.

Each phase's confirmation, and the story table in Phase 5, is a confirmation question with no recommendation, like a ledger or a packet (D4, D12). So the user confirms every phase at either level.

Alternative: pass the parent's number back through the answers. Rejected: the answers file holds answers, not state, and `lets-shape` already keeps the record (ADR-017).

### D-3: The report names the parent and the stories in fixed lines

The first evidence line is `epic #<p>: <title>`, then one `story #<n>: <title>` line per story, in creation order. One issue keeps `issue #<n>: <title>`. When Phase 5 finds the run fits one story, the parent becomes that story, so the step reports the `issue` form and `lets-go` goes on as for one issue (D6).

*Read the report* checks the first line's form. A line in neither form is `failed`, as today. An `epic` line with no `story` line is `failed` too, with a reason that names the missing story. The `Done shape` line carries the whole evidence, so the user sees the epic and its stories.

Alternative: read the stories from GitHub as the parent's sub-issues. Rejected: it needs a GraphQL read `lets-go` would add of its own, and the report already has to name the issue.

### D-4: The pick is `lets-build`'s `next`, narrowed to the report's stories

`lets-go` names `lets-build`'s *Find the source of demand*, its third case. The case's two commands run as written: the Project's Todo candidates, and the open issues nobody is assigned to and nothing blocks. Its rank is Must, Should, Could, then the lowest number, and *Check the prerequisite* runs on each candidate in rank order. The one narrowing: the candidates are the stories the report named, and no other issue (D7).

Without the narrowing, `next` could pick an unrelated Must from the backlog, which is not what the user asked for. With it, the walking skeleton is the usual pick: the first story in dependency order has no blocker and the lowest number. `lets-go` prints `Picked #<n>: <title>, the first ready story under #<p>.` and goes on from Start's blocker read with that story (D8).

When no candidate is ready, `lets-go` prints the `Done shape` line, says no story under #<p> is ready, names each story and why it was left out, says to run `lets-go` with a story's number once it is ready, and stops. There is no branch, and nothing is claimed (D9). This happens when a documentation pull request owns the glossary edits and blocks every story, or when a story is already taken.

Alternative: pick the first story the report lists. Rejected: the report's order is creation order, not readiness, and a blocker or an assignee can make it not ready.

### D-5: `lets-go` commits the map on the story's branch

Discovery edits `openspec/discovery.md` in the working tree on the default branch. No agent commits there, and the step cannot leave the file for a later session to find: *Find the first unfinished step* stops on it. So the shape step ends with the tree clean except that file. After *Claim* creates the story's branch, which carries the uncommitted edit with it, `lets-go` commits the file alone as `docs: the discovery map from #<p>`, before it reads the tree. It commits no other path. An unchanged map means no commit. A run that stops before *Claim* says the map is uncommitted on the default branch (D10).

This mirrors *Import the glossary checkpoint*: one named commit `lets-go` makes itself, for a file a shape step wrote, before propose. The map reaches the default branch when the first story's pull request merges. Other stories branch off the default branch without it until then, which costs nothing: the map is documentation, not an input to a build.

Alternatives: the step commits the map on the default branch. Rejected: agents never commit there, and the commit would sit ahead of `origin`. Exclude the map from the dirty-tree check. Rejected: the file would stay dirty through propose and apply, and a step's commit could sweep it in. A holding branch for the map, like the glossary's. Rejected: it needs a change to `lets-shape`'s checkpointing and a second import in *Claim*.

### D-6: Glossary edits in discovery go through the handoff, with a recommended owner

`lets-shape`'s glossary handoff asks which pull request carries the edits. Inside the step, that question reaches the user through the relay. The prompt recommends the first story in dependency order as the owner, so that at `recommend` the usual pick, the walking skeleton, imports the checkpoint in *Claim* (D11). When another story or a documentation pull request owns them, *Check the prerequisite* leaves the blocked stories out of the pick, as `next` does.

### D-7: The spec adds four requirements and modifies four

The discovery question, the report lines, the pick and the map commit are each one behavior, so each is an ADDED requirement. *The shape step shapes an idea or an unshaped issue* changes its too-large sentence and its clean-tree sentence, and keeps the scenario `An idea too large for one issue` with new content, because archive refuses to drop a scenario. *Start reuses lets-build* lists the map commit among the commands `lets-go` adds, and names the `next` case. *The step prompt says what to run* names discovery and a phase confirmation. *The prose holds the fixed lines* gains the new strings and the phrases that must go. The main spec's `## Purpose` is edited directly.

None of these decisions is costly to reverse. ADR-015 and ADR-017 already hold the two decisions this design leans on, so the ADR step records none.

## Risks / Trade-offs

- [Discovery costs one fresh session per phase, six or more rounds] → ADR-015 accepts the round trip. `lets-shape`'s checkpoints make each round short: it reads the parent and the map, and runs one phase. The user can name `recommend` to cut the non-confirmation questions.
- [A resumed round starts a second discovery instead of resuming] → The prompt names the status line and the `Input:` match. Two in-progress parents make `lets-shape` ask which to resume, which is one more relayed question, not a second run.
- [The step's `Input:` match fails for an idea, because `lets-shape` writes `conversation, <date>`] → The prompt says to write the idea's words in the `Input:` line for an idea, as `lets-shape` allows pasted text. The design task says so.
- [The map commit lands on a story's pull request that the user later rejects] → The map's edits are lost with the branch. The parent issue holds the scope, priorities and stories, and a revision run rebuilds the map from the code and the issues.
- [The user wanted the map on the default branch at once] → They can cherry-pick the `docs:` commit. The run names it.
- [No story is ready after a long discovery] → The stories are filed and on the Project, and the run says why each was left out. Running `lets-go` with a story's number, or `lets-build`, carries on.
- [The report's `story` lines drift from the issues `lets-shape` created] → `next`'s commands read GitHub, so a wrong number is not a candidate, and the run says so.

## Migration & Rollback

N/A. The skill reaches this repository at the next release, through `lets sync`.
