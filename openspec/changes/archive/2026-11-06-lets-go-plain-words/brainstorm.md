**Why:** `lets-go` uses a dozen terms before it says what they mean, its 231-word description buries when to use it, and its resume paragraph covers two of the five ways a run starts again; #203 has settled which file each section lives in, so the wording can now be fixed once.

## Story

#204 lets-go-plain-words — lets-go explains its terms where they first appear, and its description says when to use it, https://github.com/sidereal-io/lets-spec/issues/204

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the glossary's **Procedure** entry say? | A part or another procedure runs it, as *Claim* runs *Glossary preflight*; it returns its result to what ran it, and never picks the next part. Committed on its own as `docs:` (`15c8e29`). The Procedures intro in `SKILL.md` says the same. | User |
| D2 | Can `lets-go` link *Packet*, *Step*, *Step report* and *Interactivity level* to `openspec/glossary.md`, as the scope says? | No. The installed skill's `openspec/glossary.md` is the user's project glossary, which does not hold these terms, and the link check fails any reference that escapes the installed skills. | Evidence: `tests/skill-interfaces.bats` `assert_reference_links`; `flows.json` |
| D3 | Then where do those terms link? | A new `skills/lets-go/references/terms.md` holds the glossary's entries for *Part*, *Procedure*, *Step*, *Step report*, *Interactivity level* and *Packet*, word for word. A test fails when any entry differs from `openspec/glossary.md`. Each term's first use in `SKILL.md` links its entry. | Assumption |
| D4 | Is *Find the source of demand* renamed? | No. 19 spec lines in 11 requirements and 31 test lines name it, and `lets-build` uses the same name for the same job. One sentence before the overview table says what it does and what `next` is. | Assumption |
| D5 | Where is each other D2 term explained? | In the section where it first appears, in one clause or sentence: *source of demand* and `next` before the overview; *read marker* and the unread-comment rule in *Confirm the packet*, keeping the pinned watermark sentence; *Glossary handoff* where *Find the source of demand* first names it; *prerequisite*, *checkpoint*, *owned paths*, *rehearse* and *holding branch* in `references/glossary-handoff.md`. | Evidence: #204 D2 |
| D6 | Where does "'You' is the agent" go? | Into the skill's opening paragraphs, once, with who "the user" is. It leaves `references/glossary-handoff.md`. | Evidence: #204 D2 |
| D7 | Do any terms join `openspec/glossary.md`? | No. The D5 terms belong to `lets-go` and `lets-shape` alone, so each is explained where it is used. D1 is the only glossary edit. | Assumption |
| D8 | What does the description say? | About 50 words, at most 60, starting `Use when`: an issue, a bug, a chore or an idea built end to end to a ready pull request; the next story; the change on the current branch; or `lets-go` again after a stop. Then one sentence on what it does. Its trigger phrases stay. | Evidence: #204 D4 |
| D9 | What does the resume paragraph say? | One case each: on the change's branch it resumes at the first unfinished step; on the default branch with the issue number it switches to the branch and resumes; with nothing it picks the next ready issue, never a claimed one; a failed step runs again only in a new run, with its answers kept, and a failed shape says to run `lets-shape`; a merged or closed pull request leaves nothing to resume. | Evidence: `skills/lets-go/SKILL.md` *Read the request*, *Enter the branch*, *Walk the step table*, *Read the report* |
| D10 | Does *Enter the branch* gate the link to *Commit the discovery map*? | Yes. It links it only when a shape step ran in this run, so a run that never shaped does not open `shape.md`. The section's own rule is unchanged. | Assumption |
| D11 | How are the changes tested? | Each glossary term's first mention in `SKILL.md` links `references/terms.md`; `terms.md` matches the glossary; the description is at most 60 words and starts `Use when`; the resume paragraph names all five cases; the "you" sentence is in the opening; each D5 explanation is pinned in its section. Pinned sentences that change are updated in the same task. | Assumption |
| D12 | Which spec requirements change? | `lets-go`: one new requirement for D3 to D6, one for D8, one for D9; *lets-go keeps what only some runs need in reference files* gains the `terms.md` row. | Assumption |
| D13 | Is line length fixed here? | No. Re-wrapping is #206's job. New and changed lines wrap at 72 columns; lines this story does not touch stay as they are. | Evidence: #206 |

The user decided D1. Every row marked Assumption was decided by recommendation. The orchestrator confirmed every row but D1 on the user's behalf, on 2026-11-06.

## Changes from the story

- Added: `skills/lets-go/references/terms.md`, a test-checked copy of the glossary entries, in place of links to `openspec/glossary.md`, which an installed skill cannot reach (D2, D3).
- Added: the glossary's **Procedure** entry and the Procedures intro say a procedure can run another (D1).
- Added: *Enter the branch* opens `shape.md` only after a shape step (D10), the gap #203 found.
- Kept: the name *Find the source of demand* (D4), which the finding offered to rename.

Confirmed by user: yes
