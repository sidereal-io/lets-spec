<!-- Plain language: Lead with the problem and resulting behavior. Give a reader enough context to decide whether the scope solves that problem. Keep the required headings. -->

## Why

When an issue's packet says a decision is the user's, the brainstorm still
gives that question a recommendation. At `auto`, `lets-go` takes any
recommendation as the answer, so it decides the question without the user.
This happened to #328's two reserved questions in #308's run on 2026-11-25,
and #311's run had already done it once. Epic #339 needs it fixed, so an
epic run at `auto` leaves the user's decisions to the user.

## What Changes

- The brainstorm looks for questions left to the user in the story's own
  packet, the issue body it already reads. It reads no parent epic's
  packet (D4).
- It spots such a question by meaning, not by a fixed phrase: any line that
  says a decision is not yet made by the user, or must be agreed with the
  user, in any wording or section. The skill quotes #328's two lines as
  examples (D1).
- When it cannot tell whether a line leaves the decision to the user, it
  treats the line as if it does (D2).
- It asks such a question with no recommendation. The question gives two
  or three options with their trade-offs and names no favorite (D3). It
  quotes the packet line that leaves the question to the user (D5).
- The question goes to the user at either question mode, because it has no
  recommendation. The answer's ledger row is then `User`.
- The step prompt's *Questions* section adds this kind of question to the
  ones that carry no recommendation, beside confirmation questions.
- What `lets-go` does with a recommendation at `auto` stays as it is.
  Packets need no fixed phrase.

Left out: a question that a parent epic's packet leaves to the user. An
epic's *Shared decisions* hold one decision for every story under it.
Asking it in each story's brainstorm could record different answers to
that one decision, and asking it once would need a step that folds the
answer into the epic's packet, which is more than this Size S bug. So a
reserved line in an epic's packet is not caught by this change. This
change files no issue for it, and no skill lists the case on its own.
The `lets-go` run that plans this change reports it to the user, who
decides whether to shape it (D4).

## Capabilities

### New Capabilities

- `brainstorm-questions`: how the brainstorm finds and asks a question that
  the story's packet leaves to the user.

### Modified Capabilities

- `lets-go`: the requirement *The step prompt says what to run, the
  question mode, and how to report* adds a question the packet leaves to
  the user to the questions that carry no recommendation.

## Impact

- `skills/lets-brainstorm/SKILL.md`: the *Questioning* section gains the
  rule, and *The stance* and *Settle the story* link it as their
  exception.
- `skills/lets-go/references/step-prompt.md`: the *Questions* section.
- `openspec/specs/lets-go/spec.md` and a new
  `openspec/specs/brainstorm-questions/spec.md`, at archive.
- The copies in `.agents/skills/` change only at the next release.
- No code, command or report format changes. A `needs-input` question
  without a `recommendation` is already valid, and `lets-go` already asks
  the user such a question at `auto`.
