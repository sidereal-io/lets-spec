# Story run

Read this file only in a story run's child session: a `lets-go`
session whose request starts with
`You run a story run of a lets-go epic run:`.

An epic run has picked the story, claimed it, routed it and entered its
branch. This session walks the story's steps on that branch, and ends
with one step report, which the epic run reads. This session is not an
epic run: where a part of `SKILL.md` says what happens in an epic run,
that is for the epic run's own session, not for this one.

## Take up the story run

[Read the request](../SKILL.md#read-the-request) sends the run here,
after [Read the settings](../SKILL.md#read-the-settings) has found the
default branch and the current branch, `<branch>`.

1. Take these from the story prompt: `<i>`, `<name>` and `<parent>`
   from its first line; `<issue-url>`, `<schema>` and `<route line>`
   from its second line; `<mode>` from its `## Questions` section; and
   its `## Stack` section, when it has one, with the `<blocker>`,
   `<blocker-branch>` and `<blocker-pr>` it names. A story prompt with
   no `## Stack` section is for a story that is not stacked.
2. Check the branch. When `<branch>`, from `git branch --show-current`,
   is not `<name>`, run no step, and end the session with this report:

   ```step-report
   outcome: failed
   reason: "stopped: the story run is on <branch>, not <name>"
   ```

3. Run none of [Check the issue](../SKILL.md#check-the-issue),
   [Route](../SKILL.md#route),
   [Enter the branch](../SKILL.md#enter-the-branch),
   [Claim](../SKILL.md#claim) and
   [Set the question mode](../SKILL.md#set-the-question-mode): the epic
   run ran them for the story. Claim nothing, and stay on `<name>`.
4. Walk [The step table](../SKILL.md#the-step-table) from its top row
   on the branch `<name>`, as
   [Walk the step table](../SKILL.md#walk-the-step-table) says. Run
   each step that is not done as [Run a step](../SKILL.md#run-a-step)
   says, with the
   [subagent step](subagent.md#run-a-step-in-a-subagent) on that step's
   exit 3. Each step's prompt holds `<mode>` from the story prompt, and
   the story prompt's `## Stack` section when it has one, as
   [Write the prompt](step-prompt.md#write-the-prompt) says.
