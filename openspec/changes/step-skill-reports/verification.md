# Step skill reports verification

## Method and limits

These are the author's reader walkthroughs of the source instructions, supported by source-interface tests. They are not fresh-agent comprehension exercises or human usability trials. The fresh Claude session reviewed the plan only. No claim of formal ISO compliance is made.

## Planning walkthroughs (SLR-03)

| Input | Instruction followed | Result |
|---|---|---|
| No change directory, no route | Read the first paragraph of Plan before Invoke | Stop before proposing; explain that lets-go routes and claims the issue. |
| Existing change, no route | Follow the continuation bullet | Continue the existing change; the new-change prerequisite does not stop it. |
| Existing change saves lets-standard, route says lets-minimal | Keep the saved .openspec.yaml schema | Continue on lets-standard. The current route cannot replace it. |
| New change, route says lets-minimal, flow says lets-standard | Follow the new-change bullet | Give propose the route and the lets-minimal override. |
| Existing change without a saved schema | Use the schema lets-go already set | Preserve caller resolution without inventing an override. |

The two focused planning tests failed before the correction and passed afterward.

## Build-state walkthroughs (SLR-04)

| Input | Instruction followed | Result |
|---|---|---|
| Query exits nonzero, prints authentication error | Guard immediately after query | Show actual stdout and stderr and stop; no invented state or retry. |
| Query exits zero, stdout is HTML or an array | Require a JSON object with nonempty string state | Show actual output and stop. |
| JSON object lacks state, or state is null/empty | Same guard | Show actual output and stop. |
| JSON has unknown state and instruction text | First matching table row | Show instruction and stop. |
| JSON has unknown state and no usable instruction | Row's fallback | Show full output and stop. |
| JSON has ready/blocked/all_done | Existing named-state rows | Preserve apply, plan and review-build routing respectively. |

The focused build-query test failed before the correction and passed afterward.

## Archive walkthroughs (SLR-04)

- An exact dated archive folder with no active change reaches the archive row. It reports archiving, states that the folder cannot establish PR readiness, and tells the reader to check the pull request. It does not mark the PR ready or launch another workflow.
- When an active change folder and an archive folder both exist, the active-change row still wins. The default-branch row still comes first.
- The failing archive test reproduced the original unsupported readiness assertion. Its corrected form checks the row's evidence, next action and precedence.

## Literal idea walkthroughs (SLR-17)

- For `fix $HOME display`, the first POSIX example passes one idea argument containing the literal `$HOME` characters, without expanding the environment variable.
- The second example closes and reopens single quotes around an escaped apostrophe. Its idea argument retains the apostrophe, double quotes, `$HOME`, `$(printf unsafe)` and backtick form exactly. Neither command substitution runs.
- The Bats test extracts both example commands directly from the skill and executes them with a shell argument recorder at the command boundary. The recorder receives three arguments: `backlog`, `find`, and the complete literal idea. The expected output is written independently in the test.
- The source text tells the reader to pass only the idea. The existing adapter at `lets/src/backlog/github.ts:172` appends the title qualifier itself; no CLI code changes are needed.
- The `matches` and `no-match` branches remain unchanged.

The focused idea test failed before examples were present and passed after the correction. This verifies the examples' shell behavior, not a reader's comprehension.

## Shaping and claim walkthroughs (SLR-18)

- With an idea and no existing issue, source-of-demand searches first. A no-match runs shaping, which can create the issue before any claim.
- Shaping's linked What shape runs still permits a parent, stories and a glossary holding branch, while forbidding a change or change branch during shaping.
- After shaping returns the issue, the run confirms its packet and claims it. Only then does it create the change branch, OpenSpec artifacts and implementation.
- The blanket `create anything` sentence is removed. The replacement names the concrete outputs and links the existing shaping permission; it adds no shaping permission or new ordering.
- A source comparison against origin/main confirmed that the Claim section and all following sections are unchanged. Every lets-go edit is within Find the source of demand.

## Verification assessment

- **Completeness:** implementation covers all four issue findings; tracked tasks carry their check evidence.
- **Correctness:** no requirement changes are declared (`skip_specs: true`), so delta-spec coverage and scenario mapping are not applicable. The reader cases above cover the issue's acceptance criteria.
- **Coherence:** the implementation follows the design's narrow edits and existing interface-test seam. Tests are appended as one self-contained #228 block. No CLI, schema, glossary or installed-copy changes are included.
- **Limits:** these are author walkthroughs and executable shell examples, not human usability validation. The completed PR's code review is assigned to the orchestrator by the user. The change remains active and the PR remains a draft pending that review; it has not been archived or claimed ready.
