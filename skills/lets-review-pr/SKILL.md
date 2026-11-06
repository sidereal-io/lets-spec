---
name: lets-review-pr
description: Use for an explicit full collaborator PR review of an existing pull request, including someone else's PR. Reviews decisions and implementation and publishes one advisory comment. Author finishing uses lets-review-build; explicit plan-only review uses lets-review-plan.
---

# Review a collaborator's PR

Run only on explicit invocation. Identify one repository and PR URL before delegating; ask for missing identity. You are the mediator. Do not create or advance an OpenSpec change, edit contributor code, require a target review document or issue an approval or changes-required verdict. The only public write is one consolidated PR comment.

## Capture the revision

Create a unique run directory under `.workspace/` in the invoking project. Preserve `git status --porcelain` before and after the review. Record the capture start time in UTC.

1. Resolve the explicit URL with `gh pr view <pr-url> --json url,number,title,body,headRefOid,baseRefOid,baseRefName,headRepository,headRepositoryOwner`. Record the target base repository identity from the PR URL/API, head SHA, base SHA, base ref and capture time. Distinguish a fork's head repository from the repository receiving the PR.
2. Delegation needs a local Git repository: verify the target repository identity before using any remote's PR refs. Inspect remotes; never assume `origin` belongs to the target. For another repository, fetch from its explicitly identified URL into run-scoped refs, for example `git fetch --no-tags <target-url> refs/pull/<number>/head:refs/lets-review/<run>/head refs/heads/<base-ref>:refs/lets-review/<run>/base`. Never switch the user's checkout, reset, stash or replace its files. Preserve user changes.
3. Verify `git cat-file -e <head-sha>^{commit}` and the equivalent for the captured base SHA. If refs raced, fetch the recorded objects explicitly and verify them; stop if they cannot be obtained. Never replace a captured SHA with the fetched branch tip. Record `git merge-base <base-sha> <head-sha>` and verify that commit too.
4. Save the complete `git diff <merge-base-sha> <head-sha>` and changed-path list in the run directory. Missing objects or unreadable/truncated evidence prevent claiming a complete full pass. Report that prerequisite or limitation rather than silently reviewing less.

All passes use those objects. Read files with `git show <head-sha>:<path>`, never from the current working tree as revision evidence. Code links use `<target-url>/blob/<head-sha>/<path>#L<line>`. Before publication read the current PR head again. If it advanced, publish for the captured head and state that newer commits were not reviewed. If the check fails, state that the current head could not be checked. Each invocation captures afresh; reassess prior feedback instead of inheriting its dispositions.

Use [the role prompt](references/role-prompt.md) for every role.
