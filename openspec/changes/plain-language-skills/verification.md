# Plain-language sweep: evidence and limits

Story #224 applies the user's confirmed definition to people and agents
under epic #194. The source review started from main at
`6524fbff438faa0894d67bba9e5d81b034c774fd` on 2026-11-08.

## What the review found and changed

The review found five recurring problems: incomplete audience coverage,
sentence-style proxies for clarity, buried navigation, a misleading skill
description, and writing criteria that did not reach delegated reviewers.
The revisions address these without changing workflow policy.

Every skill now links to the same method in
`skills/lets-shape/references/plain-language.md`. Both flows already ship
that directory. Schema instructions, writing templates, the shared writing
rule and actual delegated prompts carry the guidance to their readers.

| Skill reviewed | Revision or retained behavior |
|---|---|
| lets-brainstorm | Questions identify the decision and give enough context to answer; prose placeholders display literally. Confirmation rules remain. |
| lets-build | Readers apply the state table from top to bottom and report the state and next action. The handoff remains unchanged. |
| lets-go | The entry point links to settings; the step prompt carries writing guidance and its resolved path. Report keys and values remain unchanged. |
| lets-plan | Issue, branch, change name and route are distinguished; existing stop conditions remain. |
| lets-review-build | The actual review prompt supplies reader-task criteria. Dense instructions are separated without changing the review or archive sequence. |
| lets-review-plan | Reader difficulties replace the 30-word proxy; the delegated prompt receives the method. Verdicts and review bounds remain. |
| lets-review-pr | Navigation exposes the capture, delegation, mediation and publication sequence. Each role receives the criteria; material limits stay beside findings. |
| lets-setup-backlog | Setup navigation identifies the applicable path and puts consequences before confirmation. Exact fields remain. |
| lets-shape | The description names its real backlog output; mode links appear early, discovery terms are explained, and handoff lists restart under each heading. |
| lets-test-first | Red, green, refactor and test substitutes are explained; behavior-focused test guidance remains. |
| lets-write-adrs | Future readers check the decision, reasons and consequences instead of sentence style alone. Record criteria and formats remain. |
| lets-write-specs | Readers check actor, condition and observable outcome. Required headings and SHALL/MUST syntax remain. |
| lets-write-tasks | Standalone tasks identify the behavior, context and completion evidence. Checkbox, tag and dependency formats remain. |

Supporting references and templates were inspected with their callers.
Clear instructions and exact formats were retained; a full sweep does not
require rewriting every paragraph.

## Representative changes for human review

- **Finding the right workflow:** `lets-shape` previously promised a
  release plan while its body prohibited one. Its description now promises
  the backlog issues it actually creates, with discovery mode links near
  the start.
- **Understanding a review finding:** the old plan check flagged sentences
  over 30 words. The new check identifies the reader's task, the text, the
  difficulty and its consequence, then proposes a practical correction.
- **Using a report:** `outcome: needs-input` remains exact. Explanations
  belong in the existing free-text fields or surrounding prose; renaming
  the key or value would invalidate the report.

## Fresh-agent reader exercise

A fresh GPT-6 Astra agent read the revised sources without the author's
conversation. It worked read-only, without running live workflows or
contacting services. This was a same-family exercise, not cross-family
independent validation.

| Reader task | Observed result |
|---|---|
| Select a skill for six requests | Correctly selected shaping, planning, building, collaborator review, ADR writing and task writing, with their outputs and stop conditions. It identified that shaping does not produce a release-plan document. |
| Follow the glossary handoff | With no owned edits, it skipped the ownership question. With shared edits and no chosen owner, it left ownership to the user and dependent work unresolved while allowing unrelated work. |
| Review “After verification, proceed.” | Identified the missing verification reference and next action. It proposed asking or recovering authoritative context instead of inventing permission. This was a deliberately incomplete sample, not an unresolved instruction in the implementation. |
| Review a clear sentence longer than 30 words | Reported no defect based on length alone and preserved the ownership conditions and output scope. |
| Consider renaming a report key and value | Rejected the incompatible format change and proposed explanatory prose around the unchanged contract. |

The exercise demonstrates successful finding, interpretation and judgment
for these sampled tasks by one agent. It does not establish human usability,
successful live workflow execution, exhaustive comprehension or formal ISO
compliance. No human reader trial has run. The examples above and the pull
request expose the revised text for human review; approval of the plan is
not treated as usability evidence.

## Automated and source checks

The release test now follows writing-reference links from every shipped
skill, supporting reference/template and schema writing step in both flows.
Its missing-link failure was observed before adding the shared reference.
The expanded installed-reference check passes. Existing tests continue to
check routing, report tokens, prompt placeholders and release packaging.

Comparing fenced blocks with main found changes only where the delegated
prompt criteria were intentionally added. Existing command blocks and
machine-readable report blocks remain intact. The diff was also inspected
for changes to conditions, order, permissions and stop points.

Final repository checks and the code review are recorded below when complete.
