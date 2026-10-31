## Context

`lets-shape` reads an issue with `gh issue view --json title,body,url,parent` in its single-issue pass and `gh issue view <n>` in Ingest. Neither reads comments. The skill's rules live in `SKILL.md` and one reference, `references/domain-language.md`, which other skills link to by relative path. The skill-interfaces test scans `skills/*/SKILL.md`, the schemas and the templates for `gh` commands, and checks each against the installed `gh`; it does not scan references. The release build copies each skill folder whole, so a new reference ships with no build change. `gh issue view --json comments` returns author, association and date but no bot flag.

## Goals / Non-Goals

**Goals:**
- One reference that #126 and #127 can link to without change.
- The skill's steps say only when to read, ask, fold and reply; the reference says how.
- Every `gh` command in a reference is checked like one in a `SKILL.md`.

**Non-Goals:**
- Any change to `lets-build`, `lets-brainstorm` or revision mode.
- Reading pull request review comments, reactions or minimized comments.
- Enforcing the rule in code. Skills are prose; the rule binds the agent.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`. The `prose()` helper gains `skills/*/references/*.md`, so the `gh` command test and the trailing-whitespace test cover the new reference. The link test `shaping loads its installed domain-language reference` already resolves every `references/*.md` link in `lets-shape`'s `SKILL.md`.
- **Existing seams reused:** `planning vocabulary inputs resolve inside each published flow`, which resolves the same links in the built overlay.

## Scrutiny Tier & Blast Radius

- **Tier:** medium. The change states a trust boundary, but it is prose in one skill on the skill's existing pattern, and no code or schema changes.
- **Blast radius:** `skills/lets-shape/` (SKILL.md and one new reference), `tests/skill-interfaces.bats`, `README.md`. Projects see it at the next release through `lets sync`.

## Decisions

1. **The thread query is one `gh api graphql` call.** It returns each comment's `url`, `author { __typename login }`, `authorAssociation`, `createdAt` and `body`, `pageInfo` for paging, and the issue's `lastEditedAt`. Alternatives: `gh issue view --json comments`, which has no bot flag; `gh api repos/{owner}/{repo}/issues/<i>/comments`, which has `user.type` but fails the test's `gh api` check, which only knows `graphql`. The skill already uses `gh api graphql` for the Project lookup, so the shape is familiar.
2. **The reference holds the rules; the skill holds the steps.** Same split as `domain-language.md`. #126 and #127 link the reference and add no rule of their own.
3. **Labels describe, never gate.** `candidate` is OWNER, MEMBER or COLLABORATOR and not a bot; everything else is `outside`. Every comment is shown and asked about. Recorded as an ADR, because the next person to touch this will be tempted to skip `outside` comments or auto-fold `candidate` ones.
4. **Folds ride the existing confirm step.** The single-issue pass already shows the whole body and gets one yes before writing. Folds change the drafted body, so there is one public write, not one per comment. In Ingest, which never edits its input, a fold goes into the parent issue's Scope or Open questions.
5. **The reply is the read marker.** One comment, posted after the body write, first line `lets-shape read this thread.`, then `Folded:` and `Dismissed:` lines. #126 matches the first line. Recorded as an ADR, because the alternatives (a label, a reaction, a Project field) are cheap to switch to and would strand #126.
6. **A fold rewrites the line; it never pastes the comment.** The packet stays in the template's voice, and the reply says where the content came from.

## Risks / Trade-offs

- [Long threads make the interview long] → The list comes first, so the user sees the size before the first question. The skeleton keeps one question per comment; a later story can batch.
- [GraphQL comment nodes cap at 100 per page] → The query carries `pageInfo`; the reference says to page with `after` when `hasNextPage` is true.
- [An agent treats a comment's imperative text as an instruction] → The reference opens with the rule, in the same words as `domain-language.md` uses for glossaries, and the ADR records why.
- [Adding references to `prose()` catches old text] → `domain-language.md` has no `gh` commands and no trailing whitespace; checked before writing this design.

## Migration & Rollback

N/A. No data or config changes shape. Rolling back is reverting the commits.
