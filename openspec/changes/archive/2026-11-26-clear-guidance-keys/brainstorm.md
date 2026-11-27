<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#307 clear-guidance-keys — each step has one guidance key, and --for names a step, https://github.com/sidereal-io/lets-spec/issues/307

The first story of epic #352, *each session of a lets-go run is its own step*.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Rename the guidance keys, or keep them and explain them? | Rename. One key per step, directly under `delegate`, with no `review` or `step` group: `delegate.shape`, `delegate.plan`, `delegate.review-plan`, `delegate.build`, `delegate.review-build` and `delegate.story`. | User |
| D2 | Which session does each new key steer? | `delegate.review-plan` steers the read-only plan reviewer (today's `delegate.review.plan`); `delegate.review-build` steers the read-only code reviewer (today's `delegate.review.code`). The review plan step's own session takes `delegate.plan`, and the review build step's own session takes `delegate.build`. `lets-review-plan` and `lets-review-pr` run alone also read `delegate.review-plan` and `delegate.review-build` for their reviewer. The rule for the review steps' own sessions is temporary: epic #352's stories #354 and #355 remove it, when `lets-go` starts each reviewer itself. | User |
| D3 | What happens to the file version and to ADR-011? | The file moves to `version: 4`. ADR-011's rule that each key follows the command that reads it is replaced by a new decision record, not amended. | User |
| D4 | What shape does each new key take? | A mapping with a `guidance` leaf, such as `delegate.plan.guidance: Prefer claude.`, which leaves room for the effort setting from #88 at `delegate.plan.effort`. | Assumption |
| D5 | How does lets treat a lets config that still uses an old guidance key? | A version 3 file makes every lets command exit 2, as a wrong version does today, and the message lists each old guidance key in the file with its new key. A version 4 file that still has `delegate.review` or `delegate.step` makes `lets delegate review instructions` and `lets delegate step instructions` exit 2, naming each old key and its new one. The run commands ignore those keys, as they ignore guidance today. | Assumption |
| D6 | Where does the explanation of each guidance key live? | One table in the README's *Set up delegation* section, with one row per key: the session it steers, the command that reads it, the skill that runs that command, and a sensible value. The `lets delegate` help text and `docs/resolvers.md` each get one sentence saying that `delegate.review-plan` steers the plan reviewer while the review plan step's own session takes `delegate.plan`, and the same for build, with a pointer to the README. | Assumption |
| D7 | What does the README recommend as a sensible value for each key? | `review-plan` and `review-build`: a family other than the one that writes the change, because guidance outranks the review skills' own other-family rule. `plan` and `build`: the model you want doing that work; it also runs the review step's session, which fixes or rebuts the reviewer's findings, so a strong model, often the author's family. `story`: the model that should run a child `lets-go` session. `shape`: the model you want shaping. The table also says guidance only ranks and filters the listed models and never changes a skill's steps. | Assumption |
| D8 | Does a Node test check the README's table? | Yes. A test fails when the table lacks a row for a guidance key lets reads, or has a row for a key lets does not read. A `delegate-config` spec requirement backs it. | Assumption |
| D9 | Do the commands or their `--for` values change? | The commands stay. `lets delegate review` takes `--for review-plan` and `--for review-build`, in place of `--for plan` and `--for code`, so `--for` always names a step, and the reviewer commands read `delegate.review-plan` and `delegate.review-build`. `lets-review-plan`, `lets-review-build` and `lets-review-pr` pass the new values. `lets delegate step --for <step>` and `--for story` stay as they are. | User |

## Changes from the story

The first four changes are against the packet as first written. The packet reshaped on 2026-11-26 holds them.

- **Added: a flatter key structure than the packet's rename.** The packet asked for keys that name the session they steer. The user chose one key per step directly under `delegate`, with no `review` or `step` group (D1). Reason: each review step is one step, so it should need one piece of guidance, like plan and build.
- **Added: the review steps' own sessions lose their own key.** `delegate.step.review-plan` and `delegate.step.review-build` have no successor; those sessions take `delegate.plan` and `delegate.build` (D2). The user accepts the cost: a review step's own session can no longer be steered apart from plan or build.
- **Changed: ADR-011 is replaced, not amended** (D3). Its rule that each key follows the command that reads it no longer holds once `delegate.plan` steers both the plan step and the review plan step's session.
- **Added: a Node test that keeps the README's table in step with the keys lets reads** (D8). Reason: the `story` intent was added without the README saying which session it steers; a test turns the next gap into a failing check.
- **Changed: `--for` names a step** (D9). The ledger first kept `lets delegate review --for plan` and `--for code`. On 2026-11-26, after confirming the ledger, the user chose `--for review-plan` and `--for review-build`, so that `--for` always names a step. Reason: with the old values, `--for plan` under `review` read the reviewer's key and `--for plan` under `step` the plan step's key.
- **Not split.** The work fits one story, the first of epic #352: the config reader and its messages, `review`'s `--for` values, the README table, the help text, `docs/resolvers.md`, the skills that name a key or pass `--for`, the specs, the decision record and the test.

Confirmed by user: yes
