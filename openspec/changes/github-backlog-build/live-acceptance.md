# Live acceptance evidence

Status: complete. The user merged the test PR; verified completion and its
idempotent replay both returned Done. No PR was merged by the implementation agent.

The implementation was exercised on 2026-11-04 in
[mstelz/test-repo-pls-ignore](https://github.com/mstelz/test-repo-pls-ignore)
and its [linked Project](https://github.com/users/mstelz/projects/7), node
`PVT_kwHOAETBZ84BqGjf`.

## Tested versions

- Initial read/selection bundle: `24ab17e3aee4b87015d251925be36b5b1a6efb00`.
- Corrected live lifecycle bundle: `29ee646ca649d37cf630db48467d255f4f0665eb`.
- Final implementation adds the separately tested named-Epic policy fix in
  `ed5156d`; the live main fixture is a Story.
- Test PR: [#7](https://github.com/mstelz/test-repo-pls-ignore/pull/7).
- Test implementation commit: `42f57f23f136efa9bb3d4b276d5cdec889d64e26`.
- Test archive commit: `a42d589aedd51962d83980cd345de83b84661da0`.
- User-owned merge commit: `fef1ac4c162fb0edb840b6489f0b5aae480b7227`,
  merged at 2026-11-04T15:20:24Z. The code-host caller verified this exact PR
  before completion and idempotent replay.

## Preparation

The repository was empty. Setup created a minimal main commit, the required
`Lets claim` and `Lets reference` text fields, and six issue packets with
shared metadata. This is fixture preparation, not lifecycle evidence.
Only the designated test repository and Project were mutated.

## Implemented-flow results

| Case | Live item | Observed result |
|---|---|---|
| Blocked named selection | [#1](https://github.com/mstelz/test-repo-pls-ignore/issues/1), blocked by #2 | `lets backlog select` returned conflict; no claim was attempted. |
| Owned named selection | [#3](https://github.com/mstelz/test-repo-pls-ignore/issues/3) | Selection returned conflict for an already assigned issue. |
| Next ordering/exclusions | #1 through #6 | Selection skipped blocked #1, Wont #2 and assigned #3; chose #4 ahead of #5 and #6. |
| Real branch failure | [#4](https://github.com/mstelz/test-repo-pls-ignore/issues/4) | Claim succeeded. Creating an existing `main` branch failed. Release with the original handle succeeded; fresh `claim.read` showed no actor and Todo before cleanup. |
| Lost real mutation response | [#5](https://github.com/mstelz/test-repo-pls-ignore/issues/5) | A wrapper ran the real packaged adapter and discarded its successful acquire response. The caller reported unknown effects with its original handle. Explicit continuation reconciled that same claim, verified In Progress and then released it. No replacement acquire was needed. |
| Main selection and claim | [#6](https://github.com/mstelz/test-repo-pls-ignore/issues/6) | The packaged CLI selected and verified the existing Story. Its scoped issue ID is `I_kwDOViNEiM8AAAABcdzv4Q`. |
| Planning identity | #6 | OpenSpec created the minimal change. `bind`, `resume` and `packet` succeeded through the new commands. The committed identity contains no handle or token. |
| Exact PR association | #6 / PR #7 | `reference` stored the exact PR URL and retained `Closes #6`. |
| Unmerged completion | PR #7 | `complete` returned conflict, effects none, with “associated PR is not merged.” It made no Done transition. |
| Archive continuation | #6 | OpenSpec archived the fixture. `resume` succeeded using the archived identity and original explicit handle. A fresh read after PR readiness confirmed In Progress. |

The first live assignment attempt exposed a GraphQL fragment error after
provenance had been written. Read-only inspection established Todo, no owners
and matching provenance. The mutation now selects the Issue fragment of
Assignable, with a process-boundary regression test. The original
provenance-only partial claim was released through the implemented CLI and its
original handle before a fresh acquire. This failed attempt was not counted
as a successful claim or silently retried.

## Checks and cleanup

`pnpm test` passed after review fixes: 567 Node tests, type checking, and
133 Bats checks.
`nix flake check` passed after review fixes on x86_64-linux, including the
complete isolated adapter-kit suite and both executable bundles. An initial
post-review run hit four process-fixture deadlines; its rerun passed.

The negative-case issues #1–#5 are owned disposable fixtures. #4 and #5 were
released through the implemented flow before being closed. The setup-only
assignment on #3 was removed, and #1–#3 were closed. No unrelated
issue or Project data is removed. After verified completion and replay, #6 was closed and its acceptance-owned
assignment was removed. The provenance fields remain as historical evidence
and as shared fixture prerequisites; no unrelated fields were removed.

## Merge-gated completion

The user merged PR #7. `lets backlog complete` used the archived identity,
original explicit handle and associated URL; it verified the merge commit
through the code host and returned Done. The identical invocation then
returned Done again without another transition. Cleanup followed these checks.

The subsequent code review corrected workflow deadlines, private handle
separation, raw CLI mutation guards, conclusive no-effect write retries,
post-merge routing, exact closing lines and partial-provenance exclusions.
Those fixes have process-boundary regression coverage and full repository and
release validation. Public session values can no longer substitute for the
private continuation handle. The live run above retains its exact tested
bundle commits rather than being relabeled as a run of later corrections.
Private inputs and raw responses remain outside tracked artifacts.
