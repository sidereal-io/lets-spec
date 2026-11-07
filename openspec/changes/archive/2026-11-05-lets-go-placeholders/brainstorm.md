**Why:** GitHub drops `#<i>` and `#<p>` from `lets-go` and italicises the text after them. Three placeholders also mean two things each, so an agent can send an issue number where the Project number belongs. This story fixes both before the later stories in epic #194 reword the file.

## Story

#197 lets-go-placeholders — every placeholder in lets-go has one meaning and renders as written, https://github.com/sidereal-io/lets-spec/issues/197

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which files does the story change? | `skills/lets-go/SKILL.md`, `tests/skill-interfaces.bats` and the `lets-go` spec. The same bare placeholders in `lets-brainstorm` (L98), `lets-plan` (L32) and `lets-shape` (L282) stay out. | Assumption (decided by recommendation) |
| D2 | Which placeholders get a new name? | Only those that name two things, or a thing that has two names. `<i>` (the run's issue) and `<name>` (the change's name) keep their names: once shape has a name of its own, each has one meaning. They also match `lets-build` and `lets-shape`. | Assumption (decided by recommendation) |
| D3 | What replaces `<n>`? | `<project>` for the Project number. Where `<n>` is an issue: `#<i>` for the request's number, both `Picked` lines and the shape report's `issue` line, and `#<story>` for each `story` line. | Assumption (decided by recommendation) |
| D4 | What replaces `<p>`? | `<parent>` for the parent issue, which `gh issue view <parent> --json body` already uses, and `<pr>` for the pull request. | Assumption (decided by recommendation) |
| D5 | How do shape's name and the step file names stop sharing `<name>`? | `<shape-name>` is `issue-<i>` or `idea-<slug>`. `<session>` is a step's session label: `<name>-<step>`, or `<shape-name>-shape` for shape. `--name` and the file names in `.workspace/lets-go/` and `.workspace/lets-delegate/` use `<session>`. `<name>` is set at *Start* step 3 from the title, so it is set again after shape returns. | Assumption (decided by recommendation) |
| D6 | What about one thing with two names? | `<url>` and `<issue URL>` become `<issue-url>`. `<words>` becomes `<idea>`. Other placeholders keep their names. | Assumption (decided by recommendation) |
| D7 | What does the Placeholders section hold, and where is it? | A `## Placeholders` section after the opening paragraphs and before *Start*. It holds a table with one row per placeholder in the file: the placeholder, what it stands for, and where the run sets it. | Assumption (decided by recommendation) |
| D8 | How is A1 fixed? | Every placeholder in prose goes in backticks, with its `#`: `` `#<i>` ``, `` `#<parent>` ``. | Evidence: #197 Scope |
| D9 | What do the tests check? | No `<…>` placeholder in `lets-go` outside fenced code and inline code; the fence check matches fence length, because the prompt frame's four-backtick fence holds three-backtick blocks. Each placeholder in the file is a row of the Placeholders table. The pinned strings follow the new names. | Assumption (decided by recommendation) |
| D10 | How does the spec change? | One added requirement for the placeholder rule. Each `lets-go` requirement that quotes a renamed placeholder is modified, so the spec and the skill use the same names. | Assumption (decided by recommendation) |

## Changes from the story

- The Scope's example names `<issue>` and `<change>` are not used. `<i>` and `<name>` keep their names (D2). This keeps the story at Size S and leaves the most-pinned strings, such as `gh issue view <i> --json title,blockedBy`, as they are.
- Added `<story>`, `<session>` and `<issue-url>`, and `<words>` merged into `<idea>` (D3, D5, D6). Each fixes a second meaning or a second name that the Findings did not list.
- The same rendering bug in `lets-brainstorm`, `lets-plan` and `lets-shape` is out of scope, and no issue was filed for it (D1).

Confirmed by user: yes
