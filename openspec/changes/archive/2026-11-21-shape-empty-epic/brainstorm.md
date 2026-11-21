<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#283 shape-empty-epic — lets-go shapes an empty epic in place, then builds its stories, https://github.com/sidereal-io/lets-spec/issues/283

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which epics does this story shape, and which does it leave alone? | It shapes an empty epic: Kind Epic, with no sub-issues, open or closed. An epic that already has stories, and whose discovery finished, is never shaped again. | Evidence: #283 packet, **Scope** |
| D2 | When `lets-shape` gets an empty epic as its input, does it still ask `Run discovery on it?` | No. It goes straight to Phase 1: Ingest. Making the issue an Epic was already the decision to split the work, and the user still confirms the epic's new text at Ingest. This holds whoever runs `lets-shape`: `lets-go` or the user. | Assumption |
| D3 | Discovery uses the empty epic as its parent. Does it file a second parent issue? | No. Ingest writes the parent template into the epic's own body, and its `Input:` line names the epic, `#<epic>`. | Evidence: #283 packet, **Scope** |
| D4 | Discovery never edits its input, but Ingest rewrites the epic's body. How is the epic's original text kept? | It is copied word for word into a section at the end of the new body, such as `## Original description`. **Scope** restates it in discovery's words. | Assumption |
| D5 | Does the empty epic keep its title when it becomes the parent, or get the `Epic: <capability>` title of a new parent? | It keeps the title the user gave it. | Assumption |
| D6 | Discovery finds that the whole epic fits one story. What happens? | The epic becomes that story, as for any discovery today: Kind Story, which the user confirms in the Phase 5 story table. `lets-go` then builds it as one issue. No new rule. | Assumption |
| D7 | After the shape step has shaped an empty epic into stories, what does `lets-go` do? | It goes on as an epic run on that epic, and builds its stories. An idea that discovery turns into an epic still builds only its first ready story; #287 changes that. | Evidence: #283 packet, **Scope**; #287 packet |
| D8 | An epic's discovery stopped partway: its body says `Discovery status: in-progress`, or a round stopped during Finalize. Does `lets-go` finish shaping it before it builds, even when the epic already has open stories? | Yes. It finds such a discovery with *Find the input's discovery* for `#<epic>`, which also keeps the input issue when the issue is itself a parent. Otherwise a stop during Phase 5 would let the epic run build a half-shaped epic. | Assumption |
| D9 | What does `lets-go` do with an epic whose sub-issues are all closed? | It prints `#<parent> is finished: every story under it is closed.` and stops. It claims nothing, creates no branch and leaves the epic open. | Assumption |
| D10 | `lets backlog item` lists only open sub-issues, and `lets-go` reads the backlog only through `lets backlog`. How does `lets-go` tell an empty epic from a finished one? | `lets backlog item` must also report the epic's closed sub-issues. Without that, both look the same: no open stories. The design picks the field. | Evidence: `lets/src/backlog/policy.ts` (`itemView`); `openspec/specs/lets-go/spec.md`, *lets-go reads and claims the backlog only through lets backlog* |
| D11 | Should *Empty epic* become a glossary term? | Yes. Add to `openspec/glossary.md`: "Empty epic: an epic with no sub-issues, open or closed; an epic run shapes it before it builds any story." Change the *Epic run* entry from "when the epic has no stories" to "when the epic is empty". *Finished epic* stays defined only in `lets-go`. | Assumption |
| D12 | What evidence accepts the story? | The `lets-go`, `discovery-checkpoints` and `lets-backlog` requirements assert the new behaviour. The requirement *An epic with no open stories points to lets-shape*, its line `lets-go does not shape an empty epic yet` and the bats test that checks it are replaced. The Node tests cover the closed sub-issues that `lets backlog item` reports. | Evidence: #283 packet, **Scope**; `openspec/specs/lets-go/spec.md`; `tests/skill-interfaces.bats` |

## Changes from the story

- **Added: `lets backlog item` reports an epic's closed sub-issues** (D10). The story's finished-epic rule needs it, and the packet's **Relevant code** does not name `lets/src/backlog/`. The change adds `lets/src/backlog/policy.ts` and `openspec/specs/lets-backlog/` to the story's scope.
- **Added: an epic whose discovery stopped partway is finished before it is built** (D8). The packet's Scope leaves out re-shaping an epic that already has stories. This keeps that rule for an epic whose discovery finished, and closes the gap for one whose discovery did not.
- **Settled: the packet's open question.** The epic's original body is kept word for word at the end of its new body (D4).

Confirmed by user: yes

lets-go confirmed this ledger under the user's standing instruction for this run, which is to take each recommendation unless there is none; the user has not reviewed it.
