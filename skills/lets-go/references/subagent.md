# The subagent step

Read this file when `lets delegate step run` exits 3, and the meta file
names a saved prompt.

## Run a step in a subagent

Take this step only when `lets delegate step run` exits 3, and the meta
file names the prompt `lets` saved,
`.workspace/lets-delegate/<session>.prompt.md`. That file holds the
prompt, with any answers added.

1. Run that prompt in a subagent that starts with no context from this
   session. It follows the saved prompt, works only in this repository
   on the branch `<name>`, or on the default branch for shape, and makes
   only the changes that the step calls for. In an epic run's walk, this
   repository is the story's worktree, `<path>`, as
   [Wait for the wave](epic-run.md#wait-for-the-wave) says.
2. Save the subagent's final message, unchanged and in full, to
   `.workspace/lets-go/<session>-message.md`. In an epic run's walk,
   that is `<path>/.workspace/lets-go/<session>-message.md`. Write it
   with your file writing tool, not with a shell command such as a
   heredoc or `echo`: quotes and backticks in the message would break
   the command.
3. Have `lets` read the step report from that message. In an epic run's
   walk, run this from `<path>`:

   ```bash
   lets delegate step read --message-file .workspace/lets-go/<session>-message.md \
     > .workspace/lets-go/<session>-report.json
   ```

   `lets` reads the last `step-report` block and checks it, as it does
   for `lets delegate step run`. Do not read the block, check it or add
   its date yourself.
4. Act on its exit code:
   - **0**: the report file holds the report, one JSON line, whatever
     its outcome. Read it as you read a report from
     `lets delegate step run` at exit 0.
   - **Anything else**: show the user its stderr, name the step, and
     stop. Do not read a report.
