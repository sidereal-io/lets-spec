---
name: lets-go
description: Take one shaped chore from its issue to a pull request ready for review, in one run. Start claims the issue here; propose, apply and apply review each run in a fresh session, and every question a step has comes back to this conversation. Use when the user names a chore issue and wants it built end to end, or says lets-go with an issue number.
---

# Let's go

Take one shaped chore to a pull request ready for review, in one run.
*Start* claims the issue in this session. Then each step runs in a
fresh session: propose, apply, then apply review. A step never asks the
user. It ends with a report, and this session asks the user for it. Run
every command below from the repo root.

`lets-go` reuses the `lets-build` skill. It names the sections of
`lets-build` it runs, and repeats none of them.

## Start

1. Take the issue number the user gave as `<i>`. If they gave none, say
   that `lets-go` needs an issue number, and stop.
2. Find the default branch as `lets-build` does, and run
   `git branch --show-current`. If you are on another branch, say that
   running `lets-build` on it carries its change on, and that #150 adds
   resuming a run. Stop.
3. Run `lets-build`'s *Find the source of demand* for the named issue,
   then its *Confirm the packet*. A stop either section makes stands, as
   `lets-build` reports it. A packet that fails sends the user to
   `lets-shape`, as `lets-build` says.
4. In *Confirm the packet*, check the Kind as soon as you have read the
   issue's fields from the Project. If it is not Chore, say that #152
   adds Stories and Bugs to `lets-go`, say to run `lets-build` on #<i>,
   and stop. Read no parent epic.
5. When *Confirm the packet* passes, shape is done. Print:

   ```text
   Skipped shape: #<i>'s packet is complete, last edited <date>.
   ```

   `<date>` is the day of the issue's `lastEditedAt`, from the thread
   query in *Confirm the packet*, as `YYYY-MM-DD`. When it is null, the
   body was never edited. Use the day the issue was created:

   ```bash
   gh issue view <i> --json createdAt --jq .createdAt
   ```

6. Run `lets-build`'s *Route*, then its *Claim*. Keep the route line: the
   propose step needs it. A stop *Claim* makes stands. When its glossary
   preflight found owned edits, also run *Import the glossary
   checkpoint*.
7. *Claim* creates the change's branch, `<name>`. Switch to it if you are
   not on it, and stay on it for the whole run.
8. Print the interactivity level:

   ```text
   Interactivity: recommend, because #<i> is a Chore.
   ```

   At `recommend`, this session answers each question that has a
   recommendation, and asks the user the rest.

*Start* runs in this session. It is not a step, and has no step report.
