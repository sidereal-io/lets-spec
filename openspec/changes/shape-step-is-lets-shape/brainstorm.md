<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#264 shape-step-is-lets-shape — lets-go's shape step runs lets-shape with one sentence, and lets-shape resumes from the step's answers. https://github.com/sidereal-io/lets-spec/issues/264

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Where do the rules in *What shape runs* go, beyond the three resume cases? These are: the discovery question, which questions get no recommendation, the glossary owner recommendation, the note that lets-go searched for the idea, and the end state. | `lets-shape` states each rule about its own work as its own rule, for every caller. The shape prompt's header lines in `references/step-prompt.md` carry only facts that lets-go alone knows. No separate "when a lets-go step runs it" section. | Assumption |
| D2 | In what order does *Locate the discovery* choose a mode? | (1) An open parent whose `Input:` line names this input (the idea's words or `#<i>`): *Resume mode* if its status is in-progress; finish Finalize if it has no status line and `## Answers` confirmed its Phase 5 story table. (2) `## Answers` says yes to the discovery question: discovery from Ingest. (3) Any other idea or issue: *Shape one issue*. (4) No input: today's rules. This applies to every caller, so a user who brings an input is never moved into an unrelated in-progress discovery. | Assumption |
| D3 | Who asks "The work is Size <L or XL>, too large for one issue. Run discovery on it?"? | `lets-shape` asks it, for every caller, with the recommendation yes. On yes it runs discovery from Ingest. On anything else it stops, says the work is too large and discovery was declined, and shapes nothing; a step then reports failed. This replaces *Shape one issue* step 6's offer-and-stop. | Assumption |
| D4 | Until #267 lands, how does the shape step learn that lets-go already searched for the idea and the user said no issue matches? | The shape prompt's header line for an idea says so. `lets-shape`'s *Find or create the issue* skips its own search when its input says the search ran. | Assumption |
| D5 | Does `lets-shape` name its own confirmation questions, and recommend a glossary owner? | Yes, for every caller. No recommendation for: each discovery phase's confirmation, the Phase 5 story table, the packet confirmation in *Confirm, then write*, and the product and move-the-map questions. When the glossary handoff asks who carries the edits, recommend the first story in dependency order. | Assumption |
| D6 | What is shape's one sentence, given that there is no change yet? | For an issue: ``Invoke the `lets-shape` skill for issue #<i>, and stop where it stops.`` For an idea: ``Invoke the `lets-shape` skill for the idea above, and stop where it stops.`` The end state (no change, the default branch, a clean tree except the discovery maps) is stated once in `lets-shape`, beside its rule that it never creates a change. | Assumption |
| D7 | Where do the new requirements go? | Extend the `discovery-checkpoints` capability with the resume and Finalize cases, the mode order and the discovery question. Rewrite lets-go's requirements "The shape step shapes an idea or an unshaped issue", "The shape step asks before it runs discovery" and the step-prompt requirement to describe what the run does, not what the prompt says. | Assumption |
| D8 | What evidence accepts the story, beyond the bats checks and `wc -l` counts? | Bats checks, plus an author's walkthrough in the pull request of the four ways a round can start (resume, Finalize started, discovery yes, shape one issue), traced against the new `lets-shape` text. | Assumption |
| D9 | What stays out of scope? | lets-go's own discovery query and title search in *Start from an idea* (#267), and the shape step's name. | Evidence: #264 packet, **Scope** |
| D10 | Does the done report's evidence format move? | No. Its shape lines (`issue #<i>: <title>`, `epic #<parent>: <title>`, `story #<story>: <title>`) already sit in the step prompt's report section in `references/step-prompt.md`, so *What shape runs* can drop its copy. | Evidence: `skills/lets-go/references/step-prompt.md` |

Note: lets-go confirmed this ledger on the user's standing instruction for this run, which is to take lets-go's recommendation whenever it has one. lets-go checked that the ledger matches the answers given. The user did not read the ledger.

## Changes from the story

None. D2, D3 and D5 change `lets-shape` slightly for users who run it directly: an input wins over an unrelated in-progress discovery, a yes to the discovery question goes straight into discovery, and the glossary owner question shows a suggested answer.

Confirmed by user: yes
