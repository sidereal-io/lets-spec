<!-- Plain language: Help the next implementer find the approach, understand the choices and act on the plan. Explain necessary technical terms. Put each risk beside its mitigation and each open question beside the decision it affects. -->

## Context

- `skills/lets-brainstorm/SKILL.md` owns how the brainstorm questions the
  user. Its *Settle the story* list tells it to ask every question "with
  your recommended answer" and to "lead with the one you recommend". It
  has no exception, so a question the packet leaves to the user gets a
  recommendation like any other.
- Both schemas' brainstorm instruction, in
  `schemas/lets-standard/schema.yaml` and `schemas/lets-minimal/schema.yaml`,
  says "Read the story packet: the issue body" and then hands the
  questioning to `lets-brainstorm`.
- `skills/lets-go/references/step-prompt.md`, section *Questions*, tells
  a step to give a recommendation where it has one, and none for a
  confirmation question. `lets-go` at `auto` then takes each
  recommendation as the answer. A question with no recommendation
  already goes to the user at either mode, and its answer comes back
  with no marker, so the step records it as `User`. That path needs no
  change.
- A story run's child passes each question on with the step's
  `recommendation`, when there is one (`skills/lets-go/references/story-run.md`).
  A question without one passes through as it is.
- `lets backlog item <i>` prints the issue's `body` field and its
  `parent` field. The parent entry already holds the parent's body, so
  one call gives both packets. For #341 it holds epic #339 and its body.
- ADR-029 says a step skill owns its rules and the step prompt only
  names the skill. ADR-023 says a step asks through its report, and the
  prompt gives the report rules, which is why the prompt already names
  confirmation questions.
- Since #336 there are no phrase tests on skill text. Skill wording is
  checked by review, and `tests/contracts/` checks names, links, fields
  and terms.

## Goals / Non-Goals

**Goals:**

- One home for the rule: `lets-brainstorm` says how to find a question
  the packet leaves to the user, and how to ask it.
- The step prompt names that kind of question among those with no
  recommendation, so the report rule a step reads is complete.

**Non-Goals:**

- No change to what `lets-go` does with a recommendation at `auto` or
  `ask`, to the step report's format, or to `lets` code.
- No fixed phrase or section that packets must use, and no change to
  the issue templates in `skills/lets-shape/templates/`.
- No change to `lets-shape`'s own questions. Discovery and the shape
  step's confirmations already carry no recommendation.
- No change to the schemas' brainstorm instruction (Decision 3).

## Test Seams

- **Primary test seam:** review of the skill text against the specs'
  scenarios, by `lets-review-build`, whose reviewer is from another
  model family. A skill has no runtime that a test can drive, and the
  project dropped phrase tests on skill text in #336.
- **Existing seams reused:** `pnpm test`, whose `tests/contracts/`
  checks the edited texts' links, `lets backlog` field spans and terms,
  and `nix flake check`, which builds each flow with the edited skills.
  Each task also verifies with a `git grep` that the rule's key words
  are in the file that owns it.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** two skill texts, `skills/lets-brainstorm/SKILL.md`
  and `skills/lets-go/references/step-prompt.md`. Every brainstorm, in
  both flows, reads the first. Every step prompt holds the second. No
  code, command or data format changes.

## Decisions

### 1. A new subsection of the brainstorm's *Questioning* holds the rule

Add `### Questions the packet leaves to the user` to
`skills/lets-brainstorm/SKILL.md`, between *Read the thread* and
*Settle the story*. It says, in order:

1. Which packets to read: the story's, and the parent epic's when the
   story has one (D4). A comment never leaves a question to the user.
2. How to spot such a question: by meaning, any wording, any section,
   with #328's two lines quoted as examples (D1).
3. What to do with an unclear line: treat it as left to the user (D2).
4. How to ask it: no recommendation, two or three options with their
   trade-offs, no favorite in the text, the packet line quoted with the
   issue it comes from (D3, D5). Never settle it from code, a document
   or an assumption; its row's source is `User`.

*Settle the story* then gets one exception: its two recommendation
bullets link the new subsection for these questions.

The alternative was to put the rule in *Settle the story* itself. That
list is about the order and shape of every question, and the rule
would be one long bullet with an exception inside it. A subsection can
be linked from the step prompt and from the bullets.

### 2. One `lets backlog item` call reads both packets

The brainstorm runs `lets backlog item <i>` and reads the `body` field
and the `parent` field. When `parent` is not null, the parent's body is
in it. When the command prints an `error`, the brainstorm shows its
`message` and stops: it cannot tell what the epic leaves to the user,
and going on could ask a reserved question with a recommendation.

The alternative was `gh issue view` with the parent's number. It works
only on GitHub, and the backlog commands are provider-neutral.

### 3. The schemas stay as they are

The schemas' step 2 says "Read the story packet: the issue body", then
hands the questioning to `lets-brainstorm`. Reading the parent's packet
is part of how the brainstorm questions, so it belongs in the skill
(ADR-029). Adding it to both schemas as well would be a second copy of
the rule, in two files.

### 4. The step prompt names the question, and links nothing

In *Questions* of `step-prompt.md`, the sentence "Give none for a
question that asks the user to confirm something, …" gains a second
kind: a question the story's packet, or its parent epic's packet,
leaves to the user. It names no section of `lets-brainstorm`, because
the prompt names no section of a skill (the `lets-go` requirement on
the step prompt). How to spot such a question stays in the skill.

The prompt holds this sentence, not only the skill, because ADR-023
puts the report rules in the prompt, and the step reads them there
when it writes the `needs-input` report. Without it, the prompt would
say "give a recommendation where you have one" with no exception, and
contradict the skill.

## Risks / Trade-offs

- [An agent reads "agree with the user" in a packet as describing
  something already agreed, and gives a recommendation] → The examples
  quote #328's lines, which are of that form, and D2 says an unclear
  line goes to the user.
- [The rule catches lines that only describe the user's role, and asks
  more questions than needed] → Accepted (D2). The cost is one extra
  question for the user.
- [A question with no favorite reads as unhelpful, because the user
  gets no lead] → The trade-offs of each option carry the analysis.
  Accepted by D3.
- [An epic's reserved question reaches the user once per story] →
  Intended (D4). Each story's answer can differ, and its ledger records
  it.

## Migration & Rollback

N/A. The edited skills reach this repository's own copies at the next
release. To roll back, revert the commits.
