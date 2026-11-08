## Context

Both flows ship `lets-shape`, so its reference directory can hold shared
guidance without changing packaging. Domain-language guidance already uses
this pattern. The source skills differ from the pinned release used to plan
this change; edits belong in `skills/`, `schemas/` and `overlays/` only.

The current review check treats sentences over 30 words as a concern.
`lets-shape` promises a release plan in its description but forbids one in
its body. Some prose placeholders render as HTML, glossary-handoff lists
continue numbering across headings, and long procedures bury mode choices.

## Goals / Non-Goals

**Goals:** Give every skill a usable shared method; repair the concrete
wording and navigation problems found in the sweep; carry the criteria
through templates and fresh review sessions.

**Non-Goals:** Change workflow policy, rename agreed domain terms, change
CLI formats, add review stages or introduce a readability score gate.

## Test Seams

- **Primary test seam:** Built standard and minimal release files, using
  the existing release helpers in `tests/skill-interfaces.bats`.
- **Existing seams reused:** Existing routing, placeholder, anchor and
  exact-format checks; `pnpm test`; `nix flake check`.
- **Reader exercises:** Use representative skill selection, branching and
  review tasks in a fresh agent context. Check the resulting decisions
  against existing rules. Record evidence and limits in the change's
  verification notes. Present revised text for human review without claiming
  that an agent exercise establishes human comprehension.

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** All 13 source skills and their writing/review guidance
  in both flows. No executable application behavior or data migration.

## Decisions

1. **Use one shared reference.** Put `plain-language.md` under
   `skills/lets-shape/references/` and link it from each skill. This follows
   the existing shared-reference pattern and ships in both flows. Separate
   copies would drift; a new skill or packaging layer adds no needed behavior.
2. **Keep the reader's task central.** Include the user's definition,
   practical instructions for the four principles, and a short check for
   finding, understanding and using the information. Preserve necessary
   technical terms and explain them. Do not prescribe sentence quotas.
3. **Make targeted structural edits.** Expose mode choices and section
   links, break multi-action paragraphs into ordered instructions, fix
   misleading descriptions and protect placeholders in prose. Preserve
   existing conditions and their order. Do not rewrite clear sections merely
   to make every file look the same.
4. **Reach the actual consumer.** Add guidance to schema writing steps and
   relevant templates. Review prompt frames receive the criteria and the
   resolved shared-reference path; reading them in the caller is insufficient.
5. **Validate contracts and use separately.** Extend installed-reference
   checks to all shipped skills and schema instructions. Retain existing
   behavior checks. Use reader exercises for judgment; do not add tests
   that count synonyms, sentence lengths or occurrences of advice.

These choices are reversible documentation and packaging conventions, so
none needs a new architecture decision record.

## Risks / Trade-offs

- [A rewrite changes a condition] → Compare branches, stop rules, exact
  tokens and fenced command blocks with main, and run existing checks.
- [A shared link works only in this checkout] → Check both built releases,
  including prompts and schema instructions.
- [More guidance burdens every skill] → Keep one reference and brief,
  task-specific links; remove superseded sentence-style advice.
- [Agent success is mistaken for human usability] → Report the type of
  evidence and present examples without claiming a human trial occurred.

## Migration & Rollback

No data migration. A future release and `lets sync` distribute the source
changes. Revert the source commits to roll them back. The repository's
ignored pinned copies remain managed by `lets sync`.
