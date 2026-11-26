<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#307 clear-guidance-keys — Mo can tell which session each guidance key steers, https://github.com/sidereal-io/lets-spec/issues/307

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Rename the guidance keys, or keep them and explain them? | Rename. One key per step, directly under `delegate`, with no `review` or `step` group: `delegate.shape`, `delegate.plan`, `delegate.review-plan`, `delegate.build`, `delegate.review-build` and `delegate.story`. | User |
| D2 | Which session does each new key steer? | `delegate.review-plan` steers the read-only plan reviewer (today's `delegate.review.plan`); `delegate.review-build` steers the read-only code reviewer (today's `delegate.review.code`). The review plan step's own session takes `delegate.plan`, and the review build step's own session takes `delegate.build`. `lets-review-plan` and `lets-review-pr` run alone also read `delegate.review-plan` and `delegate.review-build` for their reviewer. | User |
| D3 | What happens to the file version and to ADR-011? | The file moves to `version: 4`. ADR-011's rule that each key follows the command that reads it is replaced by a new decision record, not amended. | User |
| D4 | What shape does each new key take? | A mapping with a `guidance` leaf, such as `delegate.plan.guidance: Prefer claude.`, which leaves room for the effort setting from #88 at `delegate.plan.effort`. | Assumption |
| D5 | How does lets treat a lets config that still uses an old guidance key? | A version 3 file makes every lets command exit 2, as a wrong version does today, and the message lists each old guidance key in the file with its new key. A version 4 file that still has `delegate.review` or `delegate.step` makes `lets delegate review instructions` and `lets delegate step instructions` exit 2, naming each old key and its new one. The run commands ignore those keys, as they ignore guidance today. | Assumption |
| D6 | Where does the explanation of each guidance key live? | One table in the README's *Set up delegation* section, with one row per key: the session it steers, the command that reads it, the skill that runs that command, and a sensible value. The `lets delegate` help text and `docs/resolvers.md` each get one sentence saying that `delegate.review-plan` steers the plan reviewer while the review plan step's own session takes `delegate.plan`, and the same for build, with a pointer to the README. | Assumption |
| D7 | What does the README recommend as a sensible value for each key? | `review-plan` and `review-build`: a family other than the one that writes the change, because guidance outranks the review skills' own other-family rule. `plan` and `build`: the model you want doing that work; it also runs the review step's session, which fixes or rebuts the reviewer's findings, so a strong model, often the author's family. `story`: the model that should run a child `lets-go` session. `shape`: the model you want shaping. The table also says guidance only ranks and filters the listed models and never changes a skill's steps. | Assumption |
| D8 | Does a Node test check the README's table? | Yes. A test fails when the table lacks a row for a guidance key lets reads, or has a row for a key lets does not read. A `delegate-config` spec requirement backs it. | Assumption |
| D9 | Do the commands or their `--for` values change? | No. `lets delegate review --for plan` or `--for code`, and `lets delegate step --for <step>` or `--for story`, stay as they are. Only the config key each one reads changes. | Assumption |

## Changes from the story

- **Added: a flatter key structure than the packet's rename.** The packet asked for keys that name the session they steer. The user chose one key per step directly under `delegate`, with no `review` or `step` group (D1). Reason: each review step is one step, so it should need one piece of guidance, like plan and build.
- **Added: the review steps' own sessions lose their own key.** `delegate.step.review-plan` and `delegate.step.review-build` have no successor; those sessions take `delegate.plan` and `delegate.build` (D2). The user accepts the cost: a review step's own session can no longer be steered apart from plan or build.
- **Changed: ADR-011 is replaced, not amended** (D3). Its rule that each key follows the command that reads it no longer holds once `delegate.plan` steers both the plan step and the review plan step's session.
- **Added: a Node test that keeps the README's table in step with the keys lets reads** (D8). Reason: the `story` intent was added without the README saying which session it steers; a test turns the next gap into a failing check.
- **Not split.** The work fits one story: the config reader and its messages, the README table, the help text, `docs/resolvers.md`, the skills that name a key, the specs, the decision record and the test.

Confirmed by user: no
