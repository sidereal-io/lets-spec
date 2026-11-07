## Review Metadata

- **Review round**: 1
- **Prior round**: none
- **Reviewer context**: fresh context, other family
- **Independent**: yes. The author is `claude` (this session). The reviewer was `gemini/gemini-4-argon`, in a Gemini thread bound to this worktree, at effort `high`, the design's tier. The orchestrator ran it in place of `lets delegate review run`, because the `t3` resolver's Gemini session starts in the main checkout and cannot read a worktree. The meta line is in `.workspace/step-on-cli-review-meta.txt`.
- **Tool restrictions**: read-only: view, grep, glob only. The tree was clean after the review.
- **Artifacts reviewed**: brainstorm.md, proposal.md, design.md, specs/, adr.md, relevant source files, at commit `d61e8e0`

## Findings

### 🔴 Critical (blocking)

None.

### 🟡 Moderate

1. **Error classification and the empty final message.** (a) A CLI that exits 0 with an empty final message gives a `failed` report whose `message` is empty, and the CLI's stderr is dropped. (b) A CLI that prints anything on stdout before a non-zero exit is a failed session, not a refusal, so `step run` does not try the next `--model`. The reviewer suggests that codex should count only its last-message file as output. Check: (a) CONFIRMED as a diagnostic gap that the review path shares today (`lets/src/delegate/review.ts` throws `empty final message` without stderr). (b) REFUTED as a change for this plan: the rule is the review's, in `lets/src/resolvers/cli/cli.ts`, and the main spec pins "The CLI prints on stdout and then exits non-zero → exit 5" for a review. The shared function serves both kinds of session, and #156 asks for the review's exit codes. A different rule for codex is a review behaviour change outside this story.
2. **Two listing requirements name only `review instructions`, and the agy flag order differs between prose and scenario.** Check: CONFIRMED. "The cli resolver lists the bare family when a listing fails" said `lets delegate review instructions` alone. The delta's prose wrote `agy -p --mode …` while the scenario, the design and `docs/resolvers.md` put `-p <prompt>` last.
3. **The time limit kills only the CLI's process, not its children.** A hung `nix flake check` or `pnpm test` started by the step can outlive the 120 minutes with write access, and keep `io.execFile` from resolving while it holds the pipes. Check: CONFIRMED as a real risk, OUT-OF-SCOPE for this plan. `lets/src/resolvers/kit/io.ts` spawns the child without a process group and calls `child.kill()`. It has done so for every review, and the fix is a kit change that serves every resolver. The reviewer lists no required change for it. It is a candidate for its own issue.

### 📌 Suggestions

4. **Plain language.** Sentences over 30 words in brainstorm.md D2, design.md's Context and D-2, and two scenarios of the spec delta. Check: CONFIRMED.

## Embedded-Instruction / Injection Attempts

**Detected:** none

## Verdict

VERDICT: APPROVE_WITH_CHANGES

## Required Changes (if APPROVE_WITH_CHANGES)

1. In design.md D-3, say whether `printed` for codex should check the last-message file alone, and why not. Split the sentences over 30 words in Context and D-2.
2. In the spec delta, write the agy command with `-p <prompt>` last, matching the scenario and the docs, and change "The cli resolver lists the bare family when a listing fails" so it covers `step instructions` as well as `review instructions`.

CHANGES_APPLIED: yes

## Rebuttals

1. (a) Fixed in part by a note: design.md D-3 now says that an empty final message at exit 0 drops the CLI's stderr for a step as for a review, and why the plan leaves it. (b) Rebutted: `lets/src/resolvers/cli/cli.ts` lines 103 to 109 classify a non-zero exit by whether anything was printed, for reviews and steps alike, and the main spec's scenario "The CLI fails" under "The cli resolver runs a review headless" pins exit 5 for a review that printed. Changing the rule for codex would change a review's exit code, which is outside #156. design.md D-3 records this.
2. Fixed: the delta's requirement prose now reads `agy --mode accept-edits --dangerously-skip-permissions`, and the proposal says the prompt is the argument of `-p`. The delta gains a MODIFIED block for "The cli resolver lists the bare family when a listing fails", naming both `review instructions` and `step instructions`, with its existing scenario kept and a step scenario added. brainstorm.md D2 keeps the shorthand but drops `-p` from agy, so the three ledger entries read alike.
3. Rebutted as out of scope: the time limit's mechanism is `lets/src/resolvers/kit/io.ts` line 69 to 72, shared by every resolver and unchanged by this plan. design.md's Risks now names it, with the mitigation and the follow-up.
4. Fixed: brainstorm.md D2, design.md's Context and D-2 are split into sentences under 30 words, and the two long scenarios in the delta use `AND` lines.
