# Let's Spec

Let's Spec is a planning workflow for AI coding agents, built on OpenSpec.
This repository uses it on itself, pinned in `mise.toml` to the last
published release. The README's *Development* section describes the
layout.

## Where the source is

`skills/` and `schemas/` are the source of every skill and schema. The
copies in `.agents/skills/` and `openspec/schemas/` are what `lets sync`
wrote from the pinned release, and git ignores them. To change a skill,
edit it in `skills/`. The change reaches this repository's own copies at
the next release.

## Checks

Run all three before you push:

```bash
pnpm test          # the Node tests, then the type check
nix flake check    # also builds every flow and the release folder
mise run check     # OpenSpec validation; warnings fail too
```

## Fields a text reads

When a skill or document tells an agent to read a field or a value from
`lets backlog` output, write it in one of two forms. Then
[`tests/contracts/fields.test.ts`](tests/contracts/fields.test.ts)
checks it against what `lets backlog --help` prints, and a rename in
`lets` fails a test instead of misleading an agent.

- **A field:** a code span holding the name, then the word field, as in
  "keep its `claim` field". The word fields counts too, but only for the
  span right before it. To have each field checked, give each its own
  word: "the `write` field and the `message` field", not "the `write`
  and `message` fields".
- **A value:** one code span holding the field, a colon, one space and
  the value, as in `result: taken` or `error: no-backlog`. A placeholder
  value, as in `result: <result>`, names no value and is not checked.

The check reads a value span only when its field is one that
`lets backlog` prints, such as `result`, `error` or `write`. Any other
span of that shape passes, such as `ask: true` or `skip_specs: true`.
So a rename of the field itself is not caught there; a field span on
the old name still fails.

Leave these in plain code font, without the word field:

- **Other programs' fields and values:** those of `gh`, OpenSpec,
  `lets delegate`, `lets go questions` and step reports. Many share a
  name with a `lets backlog` field, such as `state` or `reason`, and
  would pass the check for the wrong reason.
- **What the `lets backlog` help does not list:** the entries of
  `blockedBy`, `parent` and `subIssues`, and backend values such as
  `OPEN` or `Epic`. Review checks these.


<!-- BEGIN lets-spec rules. lets sync rewrites this block: change lets-spec, not this text. -->
## Workflow

These rules come from lets-spec, and apply to every agent.

- **Plan product changes with OpenSpec.** Work in progress lives in
  `openspec/changes/`, specs in `openspec/specs/`, and decision records
  in `docs/decisions/`. A change starts with a brainstorm and ends with
  archive. The schema's instructions say what to do at each step in
  between. [Routing](#routing) says where each request starts.
- **One change is one branch and one pull request,** from propose to
  archive. Independent changes branch off the repository's default
  branch. A change that
  depends on another stacks: it branches off the other change's branch
  and targets its pull request.
- **One commit per unit of work,** with Conventional Commits: `feat:`,
  `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- **Run the project's checks** before you push, and fix what they
  report. The project's own instructions say how to run them.
- **When you review code, also apply the project's `REVIEW.md`,** if it
  has one.
- **The backlog is the GitHub Project linked to this repository.**
  `lets-shape` sets Kind, Priority, Size and Status; `lets-go`
  picks, claims and routes. Never set a Project field with `gh` outside
  those skills. Every piece of work is an issue, and its pull request
  says `Closes #<n>`. An epic is a parent issue with its stories as
  sub-issues. Dependencies are "blocked by" links on the story they
  block. Put a blocker on each story it blocks, never only on the epic:
  picking the next story cannot see a blocker on a parent issue. A
  "relates to" link never counts as a blocker.
- **The user owns the merge.** Never merge a pull request unless the
  user asks. Stacks merge bottom-up.
- **Change requests reopen an archived change.** If a ready pull request
  gets change requests, mark it as a draft again and `git revert` the
  archive commit. Make the fixes, archive again as the last commit, and
  mark it ready. A rejected pull request is closed and its branch
  deleted.
- **Never edit what lets-spec puts in the project:** this section,
  between its markers, the `lets-*` and `openspec-*` skills in
  `.agents/skills/` and the `lets-*` schema folders in
  `openspec/schemas/`. `lets sync` rewrites all of these, so an edit
  there is lost. Change lets-spec instead. Never run `openspec init` or
  `openspec update`; they write skills of their own.

### Routing

| Request | Start with |
|---|---|
| A large idea, or work that needs splitting or prioritizing | The `lets-shape` skill |
| A bug, a chore or a single story with no issue yet, or an issue with no packet | The `lets-shape` skill |
| Start the next story, or move the current branch's change on | The `lets-go` skill |
| Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run | The `lets-go` skill |
| Review an existing PR as a collaborator | The `lets-review-pr` skill |
| Set up or check this repository's backlog | The `lets-setup-backlog` skill |

### Domain language

Read `.agents/skills/lets-shape/references/domain-language.md` before
shaping, planning, implementing or reviewing. The shared glossary is
`openspec/glossary.md`, unless the `context` in `openspec/config.yaml`
names another file. A spec folder may hold its own `glossary.md` for
narrower meanings. Agree a term's meaning and scope with the user before
you write it down. Keep that meaning in code names and reviews.

### Writing

- **Write for people and agents** using plain language (ISO 24495-1).
  Readers must be able to find what they need, understand it and use it.
  This applies to skill instructions, questions, delegated prompts, reports
  and project documents. Read
  [Plain language](.agents/skills/lets-shape/references/plain-language.md)
  before writing or reviewing them. Check wording, structure and design
  against the reader's task. Preserve exact code, commands and formats.
- **Put scratch files in `.workspace/`** at the repo root, not in `/tmp`
  or a scratch path your tool suggests. Create it if it is missing, and
  keep it out of git. Anything worth keeping belongs in the repo or an
  issue.
<!-- END lets-spec rules -->
