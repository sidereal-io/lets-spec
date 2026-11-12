## Context

The source skills are the release inputs. The current backlog adapter now adds `in:title` internally, so the pinned finding's old `gh` example must not return. Six sibling stories are being built concurrently; #215 owns Claim edits.

## Goals / Non-Goals

**Goals:** Make prerequisites, saved-schema precedence, state-query failures, archive evidence and literal idea arguments explicit at the point of use.

**Non-Goals:** No new policy, CLI changes, review behavior, Claim edits, or generated skill/schema edits.

## Test Seams

- **Primary test seam:** `tests/skill-interfaces.bats`, with an independent block for #228.
- **Existing seams reused:** Source interface assertions and shell argument capture; author walkthroughs cover interpretation that static tests cannot prove.

## Scrutiny Tier & Blast Radius

- **Tier:** low
- **Blast radius:** Three skill documents and their source interface tests; both flows ship the corrected skills.

## Decisions

1. Check directory existence before invoking propose. Continue an existing change with its saved `.openspec.yaml` schema; apply route selection only to creation or a change with no saved schema, following lets-go's existing precedence.
2. Stop immediately on a failed query or unusable state output, displaying the actual output. For an unknown state, display `instruction` when present, otherwise the full output. Keep the table order unchanged and remove the unsupported archive-to-readiness inference.
3. Keep `lets backlog find` and explain POSIX single quotes, the embedded-apostrophe escape, and the existing title qualifier. Include literal dollar, quote and command-substitution examples that tests can execute against an argument recorder.
4. Name the change branch, OpenSpec artifacts and implementation as outputs needing a prior claim. Link What shape runs for the issue, parent, story and glossary holding-branch exceptions. Keep the Claim section untouched.
5. Use focused static checks for ordering and guard visibility plus executable quoting examples. Record reader walkthroughs separately rather than claiming that string checks establish comprehension.

## Risks / Trade-offs

- [Wording could choose new behavior] → Compare each revision with the existing route, apply and shaping contracts and the four acceptance criteria sets.
- [Static tests can mirror phrasing] → Assert section ordering and key contracts, execute shell examples, and document author walkthrough limits.
- [Concurrent edits can conflict] → Confine lets-go edits to source-of-demand and append one named test block.

## Migration & Rollback

N/A. Revert the documentation and test commits to roll back.
