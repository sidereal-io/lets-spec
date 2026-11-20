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

   When the story prompt ends with an `## Answers` section, first
   [Give the answers to the step](#give-the-answers-to-the-step) at the
   first row that is not done. When a step reports `needs-input`,
   [Pass the questions up](#pass-the-questions-up) instead of relaying
   them.

## Pass the questions up

When a step reports `needs-input`, this session answers none of its
questions, at either question mode: the epic run applies `<mode>`, and
asks the user. Take these actions in place of
[Relay the questions](../SKILL.md#relay-the-questions):

1. Apply the settled-question check of
   [Relay the questions](../SKILL.md#relay-the-questions). When any
   question's exact text is already in
   `.workspace/lets-go/<session>-answers.yaml`, the step did not read
   its answers. Pass no question up, and end the session with a
   `failed` report whose reason is
   `stopped: the <step name> step asked a settled question again`.
2. Count the round. Append one line to
   `.workspace/lets-go/<session>-rounds.txt`, then count its lines:

   ```bash
   date -u +%Y-%m-%dT%H:%M:%SZ >> .workspace/lets-go/<session>-rounds.txt
   wc -l < .workspace/lets-go/<session>-rounds.txt
   ```

   The count is the step's rounds in this story run, this one included.
   The epic run cleared the file before the story's first child
   session, and leaves it alone between rounds.
3. End the session with a `needs-input` report that holds the step's
   questions, in the step's order, each with the step's
   `recommendation` when it has one. Copy each question and
   recommendation word for word: the answers come back keyed by the
   question's exact text. From the step's sixth round, when the count
   is 6 or more, give each question `ask: true` too, so that the epic
   run asks the user, whatever `<mode>` is:

   ```step-report
   outcome: needs-input
   questions:
     - question: "Which schema should the change use?"
       recommendation: "lets-minimal"
       ask: true
   ```

   Before the sixth round, give no question `ask`.

## Give the answers to the step

When the story prompt ends with an `## Answers` section, the epic run
has answered the questions of this story run's last `needs-input`
report. Each `- Q:` and `A:` pair is one question and its answer. Give
them to the step that asked:

1. At the first row of the walk that is not done, read
   `.workspace/lets-go/<session>-report.json`, the step's last report.
2. When it holds a `needs-input` report, append each pair of the
   `## Answers` section whose question is one of that report's
   questions to `.workspace/lets-go/<session>-answers.yaml`, in order,
   as [Relay the questions](../SKILL.md#relay-the-questions) writes
   pairs. Keep the pairs of earlier rounds.
3. Run the step again, as [Run a step](../SKILL.md#run-a-step) says,
   with the same prompt file and
   `--answers-file .workspace/lets-go/<session>-answers.yaml`. Ask for
   the options again, and rank them again.

When that report is not `needs-input`, or a pair matches none of its
questions, run no step, and end the session with this report:

```step-report
outcome: failed
reason: "stopped: the answers match no question the <step name> step asked"
```
