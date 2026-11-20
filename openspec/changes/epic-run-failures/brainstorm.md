<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#281 epic-run-failures — a failed story skips only the stories stacked on it, and the epic run goes on.
https://github.com/sidereal-io/lets-spec/issues/281

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which stops let the epic run go on past a story, instead of ending the whole epic run? | Every stop a story run reaches, the same way: a failed step, records that disagree, a merged or closed pull request, a prerequisite stop, a failed claim write, a `lets backlog` error, a `fetch-failed` from *Stack the story*. A broken backlog still ends the epic run, because the next pick's own `lets backlog ready` call fails. | Assumption |
| D2 | Does anything change for a stop outside a story run, such as a `lets backlog` error during the pick, or for a lost claim? | No. A stop between stories still ends the epic run, as *Backlog errors* says. A lost claim still settles the story with `not built, taken by <login>` and picks again. | Evidence: #281 Scope; `skills/lets-go/references/epic-run.md` (*A stop in an epic run*) |
| D3 | What if the checkout holds uncommitted changes outside `.workspace/` after a story fails or stops? | The epic run ends at that story, as today: the story's own line, then `not built, the epic run stopped at #<stopped-story>` for the rest. It goes on only when the tree is clean. lets-go moves no changes aside. | Assumption |
| D4 | Which stories depend on the failed or stopped story, and are skipped? | A story of the epic, not settled yet, whose open blockers include the failed story, or a story that depends on it in turn, following "blocked by" links between the epic's own stories through any number of levels. A link through an issue outside the epic does not count. | Assumption |
| D5 | What line does a skipped story get, and when? | `#<story> <story-name>: not built, it depends on #<failed>, which did not finish`, naming the failed or stopped story itself even when the dependence goes through other stories; several as `#<a> and #<b>`. Each skipped story is settled and printed right after the failed story's line, in the epic's order, so it is never picked. | Assumption |
| D6 | Does the failed or stopped story's own line change? | No. It stays `failed at <step name>: <reason>` or `stopped: <reason>`, after what the stop itself prints, such as the `Failed` line and the pull request's URL. | Evidence: #281 Scope; `skills/lets-go/references/epic-run.md` (*A stop in an epic run*) |
| D7 | Does the end of an epic run print a count, such as `2 built, 1 failed, 2 skipped`? | No. The per-story lines are the summary the story asks for. | Assumption |
| D8 | Does the epic run retry a failed step in the same run? | No. Retrying is out of scope; running `lets-go` again on the failed story's branch carries on, as today. | Evidence: #281 Scope (out) |

## Changes from the story

- Narrowed: the epic run goes on past a failed or stopped story only when the checkout is clean outside `.workspace/`. With uncommitted changes left behind, it still ends at that story (D3).
- Clarified: "stacked on it" means depending on it through "blocked by" links between the epic's stories, at any depth, not only a story already stacked on its branch. Dependents are not built yet when their blocker fails, so none has a branch (D4).
- Clarified: the summary is the per-story lines, with a new `not built` reason for a skipped story, and no count line (D5, D7).

Confirmed by user: no
