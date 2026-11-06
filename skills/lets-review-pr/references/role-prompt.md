# Role prompt

Fill every placeholder before delegating. Include the complete common block in each examiner, challenger and response prompt; no role inherits the mediator's context.

```text
Role: <examiner, challenger, or examiner response>. Pass: <name and question>.
Work read-only in <absolute local Git repository>.
Target repository/PR: <identity and URL>.
Captured head: <full head-sha>. Captured base: <full base-sha>, ref <base-ref>.
Verified merge base: <full merge-base-sha>.
Complete diff/path-list evidence: <absolute paths>.
Read git diff <merge-base-sha> <head-sha> and git show <head-sha>:<path>.
Never use checkout files as evidence of this revision or refresh a moving ref.
Cite code at the captured head with full-SHA links and line numbers.
Report missing objects or unreadable or truncated evidence as coverage limits;
never claim a complete full pass with such gaps.
```
