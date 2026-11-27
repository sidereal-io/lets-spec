## Context

`lets-go` is prose that an agent follows. Four of its files change:
`skills/lets-go/SKILL.md` (1435 lines before this change),
`references/epic-run.md` (1020), `references/glossary-handoff.md` (176)
and `references/shape.md` (323). No code reads these rules: the only
automatic checks on them are the Node link check
(`tests/contracts/links.test.ts`) and the field check
(`tests/contracts/fields.test.ts`).

Five open pull requests change text in `skills/lets-go/` and
`openspec/glossary.md` (D1). This change must leave that text alone, so
that each of them still merges into this branch with no conflict there
(D3). Git reports a conflict when two edits change the same line or
lines that touch. One unchanged line between two edits is enough to
keep them apart.

Line numbers below are those of `skills/lets-go/` at commit `df1785c3`.
The plan commits change only `openspec/changes/`, so they hold until
the build's first edit. Read each range again before an edit; the
build's own edits move the lines below them.

### The text to leave alone

Do not change any line in these ranges. Each range already includes the
one line of context on each side of the other pull request's edit.

| File | Lines | What is there | Changed by |
|---|---|---|---|
| `SKILL.md` | 79–81 | Overview rows *Read the settings*, *Read the request*, *Start from an idea* | #348 |
| `SKILL.md` | 145–152 | Placeholder rows `<path>` to `<step>` (`<shape-name>`, `<slug>`, `<claim>`, `<idea>`, `<word>`) | #348, #356 |
| `SKILL.md` | 165–169 | Placeholder rows `<second>` to `<kebab-name>` (`<skill>`, `<plain-language-path>`, `<the sentence above>`) | #349 |
| `SKILL.md` | 277–287 | *Read the request*: the entry table's default-branch row and the paragraph on an idea with no letter or digit | #348 |
| `SKILL.md` | 425–427 | *Check the issue* step 5: its first line and the first line of the `complete` action | #348 |
| `SKILL.md` | 1150–1160 | *The step table*: its opening paragraphs | #349, #356 |
| `SKILL.md` | 1241–1280 | *The change's name* and *Run a step* steps 1, 2 and 4 | #348, #349, #351, #356 |
| `SKILL.md` | 1316–1335 | *Read the report*: the paragraphs that remove answers files | #348 |
| `references/epic-run.md` | 538–582, 603–605 | *Start the story run* steps 1 and 3 | #349, #351, #356 |
| `references/shape.md` | 27–33, 44–54, 111–119, 154–164, 304–324 | *Find the input's discovery*, *Run the shape step*, the closing line of *Commit the map in an epic run*, and *The shape step's name* | #348, #349 |
| `references/step-prompt.md`, `references/story-run.md` 49–51, `references/subagent.md`, `references/terms.md` | all | Not edited by this change | #349, #357, #356 |
| `openspec/glossary.md` | all | Not edited by this change (D5) | #357, #356 |

## Goals / Non-Goals

**Goals:**

- Each procedure result is described in one place, its procedure's
  closing list (D6).
- The *Run the epic* part lives only in `references/epic-run.md` (D7).
- The placeholder table holds only placeholders that more than one
  section uses, apart from the six named exceptions (D8).
- `git merge-tree` of this branch with each of the five branches names
  no conflicted path under `skills/lets-go/` and not
  `openspec/glossary.md` (D3).

**Non-Goals:**

- Any change to what a run does, prints or asks.
- The parts of #270 that wait for the five pull requests (D2): the
  `references/shape.md` fold and its two stubs, removing
  `references/terms.md`, and the excepted placeholder rows.
- The repeated epic-run stop sentence (D9) and any glossary edit (D5).
- New tests (D4).

## Test Seams

- **Primary test seam:** `pnpm test`. Its Node link check proves that
  every link still resolves once *Run the epic* leaves `SKILL.md`, in
  the source skills and in both published flows. Its field check covers
  each field and value span the edits touch.
- **Existing seams reused:** `nix flake check`, which builds both flows,
  and `mise run check`, which validates the OpenSpec change. Two
  one-off checks in `.workspace/`, run by hand and not committed: the
  `git merge-tree` loop of Decision 5, and a script that lists, for each
  placeholder, the sections that use it (Decision 4).

## Scrutiny Tier & Blast Radius

- **Tier:** medium
- **Blast radius:** the text of one skill, `lets-go`, in four of its
  files. No command, flag, output or schema changes. The risk is an
  agent that reads the trimmed text and loses a detail, or an edit that
  conflicts with one of the five pull requests.

## Decisions

### 1. Where each result is described

Each procedure's closing list, `It returns one of these results:`, is
the one place that says when a result is returned and what it carries.
A step names the result and the condition that selects it, such as
"return `commit-failed`". The part that runs the procedure gives the
action, and names a carried value only where the action uses it, such
as "show the branch's error it carries". A procedure that passes on a
result of another procedure names it in its own list and links the list
it comes from. The other option, describing each result inline where it
is returned, was rejected (D6): a part's action list would then be the
only list, and a procedure called from three places would describe its
results in none.

The edits, section by section:

| Section | Today | After |
|---|---|---|
| *Find the source of demand* (`SKILL.md` 897–983) | Case 2 says `matches` comes "with the issues in its `issues` field" | Case 2 names `matches` and `no-match`; the list says `matches` carries each issue's key, label and title from the `issues` field. `unresolved` in the list links the list of *Check the prerequisite* |
| *Confirm the packet* (985–1053) | The `epic` bullet lists the sub-issue fields; the `needs-shape` line says "naming the line"; the comments paragraph says what `needs-shape` carries | Each step names the result only. The closing list says what `epic` and `needs-shape` carry, including each unread comment's author, the date that put it past the watermark, and nothing of what a comment says |
| *Claim* (1055–1146) | Step 3 says what `taken` and `claim-failed` carry; step 4 says what `branch-failed` carries; the list says it again | Steps 3 and 4 name each result. The list holds what each carries: `taken` the names in the `assignees` field; `claim-failed` the `write` field, the `message` field and the claim token when present; `branch-failed` the branch's error, plus the release's `write` field and `message` field, or the error's `message` field. `unresolved` and `checkpoint-failed` link the list of *Glossary preflight* |
| *Check the issue* (`SKILL.md` 332–512, outside 425–427) | `stacked` says "The story is stacked on the `<blocker>` it carries"; `complete` says it carries the parent's **Shared decisions** (lines 434–436) | `stacked` says to go on with the `<blocker>` it carries. The **Shared decisions** sentence goes: *Confirm the packet*'s list holds it, and *Route* already says it needs them |
| *Enter the branch* (551–682) | `branch-failed` opens "[Claim](#claim) attempted release"; `commit-failed` ends "The maps' edits stay in the epic run's checkout" | Both sentences go. Each action keeps what it tells the user |
| *Check the prerequisite* (`glossary-handoff.md` 16–38) | One closing sentence | A closing list of `resolved` and `unresolved` |
| *Check the checkpoint* (40–110) | Steps 1 to 5 say "return `checkpoint-failed`, with what is missing / you found / differs / the conflict" | Each step says "return `checkpoint-failed`". The list says it carries what the failed check found, and names each kind |
| *What the preflight returns* (112–128) | Describes `verified`, `unresolved` and `checkpoint-failed` again | Describes `no-owned-edits`; for the other three, says it passes on what *Check the checkpoint* returns and links that list |
| *Import the glossary checkpoint* (130–176) | `imported` at the end of *Import the commits*; `import-failed` in step 5 of *Recover*; two `Return to` lines | A new `### What the import returns` after *Recover from a failed import* holds both results and the one `Return to the part that ran it, with the result.` The steps name the result only |
| *Take up a started story* (`epic-run.md` 790–859) | Its list describes `settled` and `fetch-failed` from *Stack the story*, and `edit-failed` from *Read a pull request's base* | Those three link the list they come from |
| *Commit the map in an epic run* (`shape.md` 228–303) | Steps 3 and 4 say "with Git's error" and what the commit holds | The steps name the result only; the list is unchanged. Line 304 and below stay as they are |

*Stack the story* and *Read a pull request's base* already describe
each result once, and stay as they are.

### 2. *Run the epic* moves wholly to `references/epic-run.md`

Remove the `## Run the epic` section of `SKILL.md` (lines 522–528).
Point every link to it, about 30 in `SKILL.md`, at
`references/epic-run.md#run-the-epic`: in the opening paragraphs, the
overview rows, the placeholder rows that stay, *Check the issue*,
*Enter the branch*, *Walk the step table*, *End of the run*, *Find the
source of demand* and *The step lines*. Links inside `epic-run.md`
already use `#run-the-epic`. Then add the stub's `Next:` line, with its
links made `../SKILL.md#…`, as the last line of the part's own text in
`epic-run.md`: after step 4, before `### Settle a story`.

### 3. Explain one-section placeholders where they are used

Delete the rows of the 12 placeholders of D8. Each one's section then
says what it stands for, at or before its first use. Most already do:

| Placeholder | Section | Already explained there? |
|---|---|---|
| `<other-branch>` | *Stack the story* | Yes |
| `<c>` | *Stack the story*, step 5 | No: add that it is the third such open blocker, as its key, as `<a>` and `<b>` are the first and second |
| `<keys>`, `<wave>`, `<wave-stories>`, `<other>` | *Run the epic* | Yes |
| `<map>`, `<copied paths>`, `<tracked paths>` | *Commit the map in an epic run* | Yes |
| `<evidence>` | *The step lines* | Yes |
| `<Kind>` | *Set the question mode* | No: add that it is the issue's Kind, which *Confirm the packet* carries |
| `<YYYY-MM-DD>` | *Enter the branch*, step 5 | No: add that it is the date in the archive folder's name |

The paragraph above the table that lists the label forms, `#<other>`
and `#<c>` among them, stays: it states a rule, and the
`## Placeholders` section does not count as a use.

The brainstorm counted 17 one-section placeholders; the script finds
18. The 18th, `<plain-language-path>`, sits in the rows #349 deletes,
so it stays as a sixth exception beside `<word>`, `<kebab-name>`,
`<one-line outcome>`, `<skill>` and `<the sentence above>`. The spec
names all six.

### 4. Check the placeholder rule with a one-off script

No test checks the placeholder table (D4). The build runs a short
script in `.workspace/` that finds each placeholder in `SKILL.md` and
the reference files, counts the sections it appears in, and compares
that with the table's rows. A section is the text under one heading, up
to the next heading. The script skips `## Placeholders`, and does not
treat a `#` line inside a code fence as a heading. It must report the six
exceptions as the only one-section rows, and no shared placeholder
without a row. The script stays uncommitted, like the merge check.

### 5. Prove the edits leave the five pull requests' text alone

After the last edit to `skills/lets-go/`, and again after the archive,
run:

```bash
for b in lets-go-shape-name lets-go-step-prompt subagent-report-in-lets clear-guidance-keys one-delegate-command; do
  git fetch -q origin "$b"
  git merge-tree --write-tree --name-only --no-messages HEAD "origin/$b" | tail -n +2 |
    grep -E '^(skills/lets-go/|openspec/glossary\.md$)' && echo "conflict with $b"
done
```

It must print nothing. Conflicts in `README.md`, `lets/src/main.ts` and
`openspec/specs/lets-go/spec.md` are there today and do not count (D3).

### 6. Record the size

The pull request records `wc -l` of the four changed files before
(the numbers in *Context*) and after (D10), and the cleanup section
that waits for the five pull requests.

No ADR: each decision is a text edit that a later edit can undo.

## Risks / Trade-offs

- [An edit lands on a line that touches another pull request's edit,
  and the merge conflicts] → Edit only outside the ranges in *The text
  to leave alone*, and run the merge check of Decision 5 before the
  pull request is marked ready.
- [Trimming a step's "with …" drops a detail an agent needs] → Move
  every such detail into the closing list before deleting it from the
  step; compare each list with the step text it replaces.
- [#348 and #349 change two of the same spec requirements, so
  `openspec/specs/lets-go/spec.md` conflicts when they merge after this
  pull request] → The cleanup section of the pull request says so; the
  merger keeps both changes. D3 leaves the spec outside the check.
- [A reader of the *Run the epic* row now opens a second file] →
  Accepted: the stub was a second jump already, and the link now goes
  straight to the steps.

## Migration & Rollback

N/A. Text only; revert the commits to roll back.
