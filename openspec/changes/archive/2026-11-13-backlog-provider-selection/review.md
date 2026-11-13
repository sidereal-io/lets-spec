## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family (gpt/gpt-6-astra, through the t3 resolver)
- **Independent**: yes
- **Tool restrictions**: read-only; the tree was clean before and after (`gitClean: true`)
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, ADR-025, ADR-026, the glossary entry *Backlog provider*, and the relevant source files, at commit `5dc3dab6`

## Findings

### 🔴 Critical (blocking)

1. **A `lets:` block that lets cannot read silently selects GitHub.** (Check: contradictions.) With `lets: {backlog: {provider: jria}}`, design.md's Decision 2 and its Risks entry made the reader return `null`, which means `github`, so `claim 136` could write to GitHub issue #136. That contradicts D5 and the selection requirement. **CONFIRMED.**

### 🟡 Moderate

2. **Building the adapter runs the Project lookup before the key is checked.** (Check: contradictions.) The spec says `item PROJ-12` on GitHub is `not-found` with no `gh` call. But `createGithub` (`lets/src/backlog/github.ts:104`) looks up the Project before it returns. **CONFIRMED.**
3. **A key containing a comma breaks `--only` and `--exclude`.** (Check: assumptions.) design.md Decision 3 keeps comma lists, and D3 allows any non-empty key. **REBUTTED, with a design note** (see Rebuttals).
4. **`lets backlog key` has no literal-argument rule.** (Check: scenario testability, contradictions.) `can't` breaks the shell quoting, and `--help` would print help instead of `null`. **CONFIRMED.**
5. **The last tie-break compares keys.** (Check: contradictions.) design.md Decision 4 broke equal times by `key`. That contradicts ADR-025, and as strings `"10"` sorts before `"9"`, which changes GitHub's order. **CONFIRMED.**
6. **The new `lets-backlog` Purpose forbids `gh` calls that the plan keeps.** (Check: contradictions.) The Purpose said a skill "never runs the backlog provider's commands itself". But the unchanged `lets-go` requirement at `openspec/specs/lets-go/spec.md:1556` keeps the comment read, the body edit and the pull request calls as `gh`. **CONFIRMED.**
7. **ADR-026 narrows ADR-011 without saying so.** (Check: contradictions.) ADR-011 puts all of lets's settings in one user file. ADR-026 called it person-only, and adr.md called ADR-011 unchanged. **CONFIRMED.**

### 📌 Suggestions

8. **Bare "provider" remained in a few places, and one sentence ran past 30 words.** (Check: plain language, glossary.) The bare uses were design.md's "fake provider" and ADR-025's "that provider". The long sentence was the first sentence of the `lets-go` label requirement. **CONFIRMED.**

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

The reviewer suggested REVISE because of finding 1. Each open finding, including the Critical, is fixed by a small, unambiguous edit listed below, so the verdict is APPROVE_WITH_CHANGES.

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. **For finding 1.**
   - The `lets-backlog` selection requirement returns `unknown-backlog-provider` for a top-level `lets:` the command cannot read as block style, and runs no backend command.
   - A new scenario covers flow style.
   - design.md Decision 2 and its Risks entry match: only real absence means `github`.
2. **For finding 2.** design.md Decision 1: `item`, `claim`, `release`, `--only` and `--exclude` run `parseKey` before the adapter is built. `null` is `not-found` with no backend call.
3. **For finding 4.**
   - The `key` requirement reads text after `--` literally, with a scenario for `-- --help`.
   - The `lets-go` input rule runs `lets backlog key -- '<word>'` with the existing apostrophe rule, with a scenario for `can't`.
   - design.md Decision 6 matches.
4. **For finding 5.** design.md Decision 4: ties sort stably by `created` and never compare keys. The GitHub adapter returns candidates in issue-number order.
5. **For finding 6.** The `lets-backlog` Purpose says skills never run the backlog provider's commands "for the reads and claims these commands cover".
6. **For finding 7.**
   - ADR-026 says it narrows ADR-011.
   - ADR-011 carries a note that points to ADR-026.
   - adr.md describes the narrowing.
7. **For finding 8.** Qualify the bare uses, and split the long sentence in the `lets-go` label requirement.
8. **For finding 3.** design.md Decision 3 states that a key never holds a comma, as a rule on every backlog provider's key form.

CHANGES_APPLIED: yes

## Rebuttals

1. **Fixed** by changes 1 and 2:
   - `specs/lets-backlog/spec.md`, the selection requirement and its *A lets block in flow style* scenario;
   - design.md Decision 2 and the Risks entry.
2. **Fixed** by change 2: design.md Decision 1.
3. **Rebutted (Moderate), with a design note.** No backlog provider shipped or planned under #52 uses a comma in its keys: GitHub numbers, Jira and Linear `ABC-12`, and Beads `bd-a1b2`. Making `--only` and `--exclude` repeatable flags would change every `lets-go` call and spec scenario that passes a list, for a key form nobody uses. design.md Decision 3 now records the rule, and says that a backlog provider with commas in its keys would need repeated flags.
4. **Fixed** by change 3:
   - `specs/lets-backlog/spec.md`, the `key` requirement and its *Text that looks like an option* scenario;
   - `specs/lets-go/spec.md`, the input rule and its *One word with an apostrophe* scenario;
   - design.md Decision 6.
5. **Fixed** by change 4: design.md Decision 4.
6. **Fixed** by change 5: the Purpose of `openspec/specs/lets-backlog/spec.md`.
7. **Fixed** by change 6:
   - the opening note of ADR-026 and the new note in ADR-011;
   - adr.md's ADR-011 entry.
8. **Fixed** by change 7: design.md Decision 1, ADR-025's consequences, and the `lets-go` label requirement.
