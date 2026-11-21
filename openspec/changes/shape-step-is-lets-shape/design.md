<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

`lets-go`'s shape prompt carries *What shape runs*, the last section of
`skills/lets-go/references/shape.md` (lines 176–241). Its rules fall
into three groups:

| Rule in *What shape runs* | Where `lets-shape` stands today |
|---|---|
| Resume an in-progress parent whose `Input:` names this input, and skip the restatement's confirmation | *Locate the discovery* checks "the user names one issue" first, so a resumed round for `#180` would shape #180 again. *Resume mode* always confirms its restatement. |
| Finish Finalize on a parent with no status line whose story table the answers confirmed | Nothing finds that parent: the in-progress query cannot, because Finalize removed the status line. |
| Run discovery from Ingest on a yes; ask the discovery question for L, XL or a large idea | *Shape one issue* step 6 offers discovery and stops. |
| Skip the title search for an idea | *Find or create the issue* always searches. |
| Confirmation questions get no recommendation; recommend the first story as glossary owner | Only *Pick the map* names its confirmation questions. The owner question has no recommendation. |
| Write the idea's words or `#<i>` in `Input:` | The template says `<file path, issue link, or "conversation, YYYY-MM-DD">`. |
| No change, end on the default branch, clean tree except the maps | *Handing off to lets-go* says discovery never creates changes. Nothing states the end state. |
| The done report's evidence lines | Already in the step prompt's report section (D10). |

Constraints:

- Every rule moves into `lets-shape` as its own rule, for every caller
  (D1). `lets-go` keeps only what it alone knows: the idea's words and
  whether its title search ran (D4).
- `lets-shape` must work with no `## Answers` section, for a user who
  runs it directly. The step prompt's `## Questions` section already
  tells a step how to turn a question into a `needs-input` report, so
  `lets-shape` only has to ask.
- #137 also edits `lets-shape`'s discovery query. Whichever lands
  second rebases.
- Baseline size, for the pull request: `skills/lets-go/SKILL.md` is
  1,404 lines, and the whole `lets-go` skill (`SKILL.md` and
  `references/*.md`) is 3,313 lines.

## Goals / Non-Goals

**Goals:**

- A fresh shape round finds where it stands from `lets-shape`'s text
  alone, in the four ways a round can start: resume, Finalize started,
  discovery yes, shape one issue.
- Each moved rule is written once, in the `lets-shape` section that
  does the work.
- The bats checks read each rule where it now lives.

**Non-Goals:**

- `lets-go`'s own in-progress query and title search in *Start from an
  idea*, and the shape step's name (#267, D9).
- Changing *Revision mode*, the phases' content, or the glossary
  checkpoint procedure.
- Folding `references/shape.md` back into `SKILL.md`. That is a later
  story of #263.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, run by
  `pnpm test`. It reads the source skills with `skill_says`,
  `skill_section` and `skill_does_not_say`, and checks the links and
  headings of `lets-go`.
- **Existing seams reused:** the same file's `section_moved`,
  `anchors_resolve` and `step_numbers` helpers, and
  `nix flake check`, which builds each flow and runs the link checks on
  the installed copies.

A skill has no runtime to drive, so the bats checks assert that each
rule exists in the skill that owns it, and that the shape prompt is one
sentence. The author's walkthrough in the pull request covers the order
of the paths (D8).

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** two skills, `lets-shape` and `lets-go`, and the
  contract between them: the shape prompt. No code, CLI or schema
  changes. A mistake shows as a shape step that resumes the wrong
  discovery, starts a second one, or asks a settled question again.
  `lets-go` already stops on that last case.

## Decisions

### 1. One path list in *Locate the discovery*

Rewrite step 4 of *Locate the discovery* as the five-item list from
the spec, first match wins. Define "the answers" once, just above it:
the answers the user gave in this session, or the `## Answers` section
of a resumed step. The other sections then say "the answers" and link
here.

Item 1 runs one query for both resume cases:

```bash
gh issue list --state open --limit 500 --search '"Input:" in:body' --json number,title,body
```

Keep each issue whose `Input:` line names this input. The parent's
status line then picks the case: in-progress goes to *Resume mode*; no
status line, with the story table confirmed in the answers, goes to
*Phase 6: Finalize*. Drop a parent in neither state, such as an open
epic whose discovery finished, before counting matches. With none
left, the list goes on to item 2. This is the query *Add a second
product* already uses, with `--limit 500` added: `gh issue list`
returns 30 issues by default, and open epics and single stories also
carry an `Input:` line.

Alternative: keep the in-progress query for resume and add the `Input:`
query only for Finalize. Rejected: two queries for one match, and the
Finalize case needs the wider one anyway. Item 5, no input, keeps the
in-progress query as it is.

"Names this input" means: the `Input:` line holds `#<i>` or the issue's
URL for an issue, the path for a file, or the idea word for word for an
idea in words. That matches what Ingest now writes (decision 4).

The sentence "An issue that holds a large idea is the input to a
discovery run instead. If you cannot tell which the user means, ask."
goes. Item 3 replaces it: a plainly large input gets the discovery
question; an unclear one goes to *Shape one issue*, where sizing
decides (D11).

### 2. The discovery question is written once

Add a subsection, *Ask about discovery*, under *Locate the discovery*.
It holds the question, `The work is Size <L or XL>, too large for one
issue. Run discovery on it?`, the recommendation `yes`, and both
outcomes. On yes: run discovery from Ingest with the input, and record
any tentative glossary meanings in the parent when Ingest writes it. On
anything else: stop, say the work is too large for one issue and
discovery was declined, and create no issue and no glossary
definition. For a large idea that has no Size yet, the question says
`L`.

*Locate the discovery* item 3 and *Shape one issue* step 6 link it.
Step 6 keeps its rule that no glossary definition is written before
sizing passes.

Alternative: write the question in step 6 and point item 3 at step 6.
Rejected: item 3 runs before any step of *Shape one issue*, so the link
would send a reader into the middle of a procedure that has not
started.

### 3. *Resume mode* settles confirmed phases

*Resume mode* step 2 gains one rule: when the answers confirmed phases
of this parent, skip the restatement's confirmation, and go to the
recorded next phase. Step 3's rule against re-asking confirmed sections
already covers the rest. Finalize needs no change of its own:
*Locate the discovery* item 1 sends the round there, and Finalize's
questions come after its status line removal, so the answers settle
them in order.

### 4. Ingest writes a matchable `Input:` line

Phase 1's checkpoint says what the `Input:` line holds: `#<i>` for an
issue, the path for a file, the idea word for word for an idea in
words. The parent template's placeholder changes to match. A long
conversation with no short idea keeps `conversation, YYYY-MM-DD`; it
cannot be matched word for word, and it does not have to be, because
only a caller that brings the same input again needs the match.

### 5. The search note and the confirmation questions

- *Shape one issue* step 1: "When the input says open issues were
  already searched and none is the same work, skip the search."
  `lets-go`'s idea header line in `references/step-prompt.md` carries
  that note, only when *Start from an idea* ran its title search (D4).
  When `lets-go` found an in-progress discovery instead, the header has
  no note, and `lets-shape` matches the parent itself.
- A short paragraph at the top of *The phases* lists the confirmation
  questions: each phase's confirmation, including Ingest's parent text
  and *Resume mode*'s restatement, the Phase 5 story table, and
  **Confirm, then write**. It links *Pick the map* for the two product
  questions, which keep their own sentence there. *Shape one issue*
  step 7 says its confirmation is one too.
- *Ask who carries the edits* step 1 recommends the first story in
  dependency order: for one story, its own pull request (D5).

### 6. The end state sits beside "never creates changes"

*Handing off to lets-go* gains one bullet: `lets-shape` creates no
change and no change branch; the issues and a glossary holding branch
are its own; it ends on the branch it started on, with no edits of its
own left in the tree, except the discovery maps when discovery ran
(D12).

### 7. `lets-go` keeps the sentence and the header facts

- `references/step-prompt.md`: the paragraph that puts *What shape
  runs* under `## What to run` becomes the two shape sentences. The idea
  header gains the search note, as an optional sentence.
- `references/shape.md`: delete *What shape runs*.
- `SKILL.md`: the three links to *What shape runs* change. *Find the
  source of demand* says shaping may create the issue, its parent and
  stories, and a glossary holding branch, with no link. The step table's
  intro says shape's skill is `lets-shape` and links *Write the prompt*.
  The placeholder rows for `<the sentence above>` and `<L or XL>`
  change: the first no longer names *What shape runs*, and the second
  goes, because `lets-go` no longer uses `<L or XL>`.

### 8. The bats checks move with the rules

In `tests/skill-interfaces.bats`:

- *lets-go runs a shape step for an idea or an unshaped issue*: drop
  the `lets-go` checks for `Run discovery on it?`, `*Resume mode*` and
  `Finalize has started on that parent`. Keep the ones `lets-go` still
  owns, such as `Discovery status: in-progress` (its own query, #267)
  and the evidence lines.
- *the shape prompt names lets-shape's steps by their titles*: replace
  with a check that `references/step-prompt.md` holds the two shape
  sentences, and that no `lets-go` file has a heading *What shape runs*.
  `section_moved` drops `What shape runs`.
- *shape prompt allows every discovery map in its clean tree* and
  *shape prompt makes the product and move questions confirmation
  questions*: read `lets-shape` instead of `lets-go`.
- New `lets-shape` checks, one per rule: the path list order, the
  answers definition, *Ask about discovery*, *Resume mode*'s skip, the
  `Input:` line, the search note, the confirmation list, the owner
  recommendation and the end state.

## Risks / Trade-offs

- [An agent reads the path list and still enters *Shape one issue* on a
  resumed round] → Item 1 is first and names both parent cases. The
  walkthrough in the pull request traces each of the four starts
  against the new text.
- [Item 1 matches two parents with the same `Input:`] → A finished
  epic is dropped before the count, so an old epic and this run's
  match as one. Two live parents with the same input are listed, and
  the user is asked which one, as a confirmation question. It never
  picks.
- [A large idea brought directly no longer runs *Revision mode*'s map
  check before Ingest] → Accepted in D11. The user can run `lets-shape`
  with no input to revise the map.
- [A direct user who stopped mid-Finalize and runs `lets-shape` with the
  same idea again has no answers, so item 1's Finalize case does not
  fire] → Same as today. The idea then gets the discovery question or
  *Shape one issue*. Not worse than now; noted for #263.
- [#137 edits the same query lines] → Whichever lands second rebases.
  The issue already says so.

## Migration & Rollback

N/A. Both skills ship in the next release, together. `lets sync`
installs them as a pair, so no installed `lets-go` runs against an old
`lets-shape`. Rollback is a revert of the build commits.
