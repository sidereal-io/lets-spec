<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#267 shape-search-once — lets-go drops its copy of lets-shape's discovery query and title search, https://github.com/sidereal-io/lets-spec/issues/267

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Can `lets-go` drop its title search in *Start from an idea*, and with it the idea header's note `Open issues were searched, and none is the same work.` and `lets-shape`'s rule that skips its own search? | No. If `lets-shape` searched instead, an idea that matches an issue with a complete packet would run the shape step and ask for that packet to be confirmed, where today shape is skipped. The packet's constraint keeps all three. | Evidence: #267 packet, **Constraint**; `skills/lets-go/references/shape.md` |
| D2 | What does #267 do with `lets-go`'s discovery lookup? | Keep it, but match parents by their `Input:` line with the same query as `lets-shape`'s *Locate the discovery*, not the in-progress-only query. The second copy stays until #137's `lets backlog` discovery command. #267 stays Size S. Dropping it would change the run's stops and questions, which the packet's **Constraint** forbids: the dirty-map check in *Run the shape step* would stop on an in-progress discovery's maps, and the title search would run for an idea whose discovery is in progress. | Assumption |
| D3 | Should #137's packet say that its `lets backlog` discovery command replaces `lets-go`'s lookup? | Yes. #137's Scope now says so (edited 2026-11-21), so the last copy goes when #137 lands. | Assumption |
| D4 | A run stopped during Finalize, and the user runs `lets-go` with the same input again. Today `lets-go` stops on the uncommitted maps with "commit or discard", and runs the title search again. What should it do? | Treat that parent as this input's discovery, as `lets-shape` does: run no title search, do not stop on the maps, and run the shape step, which finishes Finalize. | Assumption |
| D5 | Which inputs does the lookup cover? | Both, as today: an idea, in *Start from an idea* and the dirty-map check; and an issue `#<i>`, in the dirty-map check of *Run the shape step*. | Evidence: `skills/lets-go/references/shape.md`, *Run the shape step* step 1 |
| D6 | What evidence accepts the story? | The `lets-go` requirements and bats checks that name the old query assert the new behaviour, including a run after a stop in Finalize. The pull request records `wc -l` for the files it changes, before and after. | Evidence: #267 packet, **Scope** |

## Changes from the story

- **Kept, not dropped: the title search, the idea header's note and `lets-shape`'s skip rule.** Dropping them would change what the user is asked (D1), which the story's constraint forbids.
- **Kept, not dropped: the discovery lookup.** It now matches parents by their `Input:` line, as `lets-shape` does (D2). It goes when #137's `lets backlog` discovery command lands, and #137's packet says so (D3).
- **Added: the stop after Finalize.** A new run after a stop in Finalize no longer stops on the maps or asks the title search's question again (D4). #264 left this gap for #267.

Confirmed by user: yes
