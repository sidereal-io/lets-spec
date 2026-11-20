**Why:** Since #273 removed the OpenSpec pin, a mise project updates Let's Spec with the same two commands every time, so a scheduled workflow can do it and open the pull request, but nobody has tested the sketch in #277.

<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#288 automate-lets-spec-updates — a scheduled workflow keeps a mise project on the latest Let's Spec release.
https://github.com/sidereal-io/lets-spec/issues/288

This change stacks on #273, built in pull request #289 on the branch `openspec-cli-is-the-projects-own`.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which projects does the workflow serve? | mise projects only. Nix projects keep Dependabot's `nix` entry. Renovate configuration is out. | Evidence: #288 body, *Scope* |
| D2 | What does the workflow run? | `mise upgrade`, then `mise exec -- lets sync`, on a schedule and on `workflow_dispatch`. It opens a pull request only when either command changed a file. | Evidence: #288 body, *Scope*; #277 body, *Keeping a project up to date from CI* |
| D3 | Why `mise exec -- lets sync`, not `lets sync`? | CI does not run `mise activate`, so the `enter` hook never fires and `lets` is not on `PATH`. | Evidence: README, *With mise*; `.github/workflows/ci.yml` |
| D4 | Which files does the update change? | `mise.lock`, because the README's `"latest"` entries keep `mise.toml` unchanged, plus whatever `lets sync` wrote. The workflow relies on the project committing `mise.lock`, as the README already tells it to. | Evidence: README, *With mise* |
| D5 | Which token opens the pull request? | A token other than `GITHUB_TOKEN`, read from a repository secret. The section says why: a pull request opened with `GITHUB_TOKEN` starts no workflows, so the project's CI would not run on it. | Evidence: #288 body, *Scope* |
| D6 | What catches an update pull request that is incomplete? | The project's own CI, running `mise exec -- lets sync --check`. The update workflow adds no check of its own. | Evidence: #277 body, *Keeping a project up to date from CI* |
| D7 | Where does the README put the section? | `### Automate updates`, inside *Updating*, after *With mise*, since it automates those three steps. | Assumption |
| D8 | When may the README show the workflow? | Only after it passed the end-to-end test. The README's YAML is the file that ran, unchanged. | Evidence: #288 body, *Scope* (when); Assumption (unchanged) |
| D9 | What do the pull request's branch, title and commit say? | Branch `chore/update-lets-spec`, title and commit `chore: update Let's Spec`. | Evidence: #277 body, *Keeping a project up to date from CI* |
| D10 | Which schedule does the README show? | Weekly, Mondays at 06:00 UTC (`0 6 * * 1`), plus `workflow_dispatch` for a manual run. The workflow tested later on GitHub keeps this schedule, so the tested file is the file the README shows. | User (first from #277 body, *Keeping a project up to date from CI*) |
| D11 | Which action versions does the workflow use? | The major versions the end-to-end test ran with: `actions/checkout@v7` and `jdx/mise-action@v2`, as this repository's CI uses, and the current major of `peter-evans/create-pull-request`. | Assumption |
| D12 | Does the workflow work in both skills modes? | Yes, unchanged. In `ignored` mode the pull request holds only `mise.lock` and any rules or `.gitignore` change, because git ignores the copies. | Assumption |
| D13 | Which token does the README tell projects to use? | A fine-grained personal access token that can reach only the project's repository, with Contents: Read and write and Pull requests: Read and write, stored as the repository secret `UPDATE_TOKEN`. The section also names a GitHub App token (`actions/create-github-app-token`) for organizations that do not want a token tied to one person. | Assumption (lets-go accepted the recommendation) |
| D14 | May the end-to-end test create a repository, token, secret or workflow run on GitHub? | No. This change creates nothing on GitHub and tests the commands locally only. | User |
| D15 | What must the end-to-end test on GitHub show, when it runs later? | (a) From a `v0.7.0` pin, one pull request that moves `mise.lock` to `v0.8.0` or later, with what `lets sync` wrote. (b) The project's CI starts on that pull request, and `mise exec -- lets sync --check` passes. (c) A second run opens no second pull request. | Assumption (lets-go accepted the recommendation) |
| D16 | What does the local test in this change show? | In a throwaway mise project in `.workspace/`, pinned to `v0.7.0`: `mise upgrade` then `mise exec -- lets sync` moves `mise.lock` to the latest release and writes the new files; `mise exec -- lets sync --check` then passes; a second run changes nothing. The workflow YAML passes a syntax check. The pull request description records these results and the GitHub steps still to do. | Assumption (lets-go adapted the recommendation to D14) |
| D17 | The README must wait for the test on GitHub, but this pull request closes #288, which asks for the README section. What does this change deliver? | The pull request adds the README section and its workflow YAML, tested locally. Its description says not to merge until the end-to-end test on GitHub passes. The tasks cover only the local test, so the run can still reach a ready pull request; the user holds the merge. This keeps `Closes #288` and one pull request for the story, and the README's YAML stays the file that is later tested (D8, D10). | Assumption (lets-go accepted the recommendation) |

## Changes from the story

- **The end-to-end test on GitHub is not part of this change.** The story says the workflow is tested end to end before the README shows it. The user chose to create nothing on GitHub for this change (D14), so this change tests the commands locally only (D16). This pull request adds the README's *Automate updates* section, but must not merge until the workflow has passed the end-to-end test on GitHub (D15, D17). The pull request says that this test is still to do. Source: User.

Confirmed by user: yes
