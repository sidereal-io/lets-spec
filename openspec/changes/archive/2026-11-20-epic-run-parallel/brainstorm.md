<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#286 epic-run-parallel — the stories in one wave run at once, each in its own worktree, and their questions come one at a time, https://github.com/sidereal-io/lets-spec/issues/286

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story build, and what does it leave out? | The story runs of one wave run at the same time, each in its own git worktree. The epic run asks their questions one at a time, removes each worktree once its story is built, and starts the next wave once every story of this one is settled. Starting the next wave before this one ends is out. | Evidence: #286 packet, Scope |
| D2 | Can two stories of the same wave stack on each other? | No. No chain of blocked-by links joins two stories of a wave, so each blocker of a story is in an earlier wave, and is settled before the story's wave starts. | Evidence: `openspec/glossary.md` (Wave) and `lets backlog waves` |
| D3 | Does every story run get its own git worktree, even in a wave of one story? | Yes, so there is one way of running. The epic run's own checkout stays on the default branch for the whole run, and the `git switch <default>` after each story goes away. | Assumption |
| D4 | Where does the epic run create each story's worktree? | At `.workspace/lets-go/worktrees/<name>/` in the epic run's checkout: git already ignores it, and working files go in `.workspace/`. | Assumption |
| D5 | Who prepares a new worktree, which lacks every ignored file? | The epic run runs `lets sync` in the new worktree when the project ignores its skills, so the child finds the `lets-go` skill and the lets schemas. Nothing else: installing dependencies is left to the steps. | Assumption |
| D6 | Which stories of the current wave start at once, and is there a limit? | Every story of the current wave that is ready and passes the usual checks (prerequisite, packet, claim) starts at once, with no limit. | Assumption |
| D7 | How does the epic run run several child sessions at once and learn when each ends? | Through `lets`, so it works on any agent host whose shell can run `lets`: a way to start `lets delegate step run --for story` in the background, and a command that waits for the next child to end and says which one it was. | Assumption |
| D8 | How do the questions of children running at once reach the user? | One child's `needs-input` report at a time, in the order the reports arrive, with the question mode applied as today and each question prefixed with its story, such as `#286:`. The other children keep running; the child that asked starts again once its whole report is answered. | Assumption |
| D9 | What happens to a story's worktree when its story run ends, and do uncommitted changes still end the epic run? | Built: the epic run removes the worktree and keeps the branch. Stopped or failed: the worktree is kept, the story's line ends with `; its worktree is at <path>`, and the other stories go on. Uncommitted changes no longer end the epic run. A worktree that cannot be removed is kept, and its line says so. | Assumption |
| D10 | What does the epic run do for a story whose child session cannot start (exit 3)? | The story waits until the wave's running children end. Then the epic run walks its steps in its own session, inside the story's worktree, one story at a time. | Assumption |
| D11 | On resume, what happens to a story whose branch is already checked out in a worktree? | The epic run uses that worktree when it has no uncommitted changes. Otherwise it settles the story with `stopped: its worktree at <path> has changes that are not committed`, and goes on. | Assumption |
| D12 | In what order are the story lines printed? | In the order the stories settle, as today. A stacked line names its blocker, so the merge order stays clear. | Assumption |
| D13 | Do the glossary entries *Story run* and *Wave* change? | Yes. *Story run* gains that it runs in a git worktree of its own, which the epic run removes once the story is built. *Wave* becomes stories the epic run builds at the same time, starting the next wave once every story of this one is settled. | Assumption |

## Changes from the story

- Added: `lets` commands to start a story run in the background and to wait for the next one to end (D7). The packet's Relevant code already names `lets/src/delegate/step.ts`.
- Added: `lets sync` in each new worktree when the project ignores its skills (D5).
- Changed: changes that are not committed now stop only their own story, not the whole epic run, and the epic run no longer switches back to the default branch after each story (D3, D9).
- Added: edits to the glossary entries *Story run* and *Wave* (D13), committed on this branch as their own `docs:` commit.

Confirmed by user: yes
