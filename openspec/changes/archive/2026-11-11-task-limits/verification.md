# Task-limits verification

Using change: task-limits, schema lets-standard.

## Completeness

All five tasks are complete. The three requirements map to the Size bullet, the continuation after the user's split decision, and the parallel eligibility table and paragraph. No implementation or spec coverage gap remains.

## Correctness

Author walkthroughs against the final source:

- Thirteen tasks: report the count and slice; stop without writing or committing tasks.md; wait for the user to decide in the brainstorm.
- Twelve tasks: within the retained five-to-twelve range, subject to the existing stop conditions.
- After the split: refresh earlier planning artifacts to remove the moved slice before task planning runs again. A caller requiring a question report receives the split decision without a recommended answer, with the count and slice as context.
- Nonadjacent tasks 1 and 3 share a file: neither qualifies for parallel, even if task 2 is disjoint.
- Unconnected sections share a file: compare them and reject parallel tags for the conflicting tasks.
- C depends on B depends on A: an indirect chain in either direction excludes ordered sections from comparison.
- B and C share only prerequisite A: compare B and C.
- Disjoint eligible tasks may still use parallel tags in standard flow; minimal flow's prohibition is unchanged.

All six focused Bats checks passed. The original five each failed on the missing instructions before passing; the two review regressions also failed before their fix. The complete suite is rerun after the review fixes before publishing.

## Coherence and review

Changes reuse the existing Bats source-prose seam, in one self-contained appended block. Skill edits stay in Size and Tags. No generated skill, schema, parser or glossary changes.

Claude Opus 5.5 independently reviewed origin/main at 35b2b02d through 8bbdebed. M1 was confirmed and fixed in 6304c5f4: explicit plan reconciliation and a delegated user decision without a recommendation. S1 was accepted in 26bb155e: name the parallel file comparison directly. No Critical finding remains. No REVIEW.md exists; AGENTS.md and CLAUDE.md were supplied as project context.

## Limits

These are author walkthroughs and automated interface assertions. They do not establish human comprehension. No human usability trial ran.
