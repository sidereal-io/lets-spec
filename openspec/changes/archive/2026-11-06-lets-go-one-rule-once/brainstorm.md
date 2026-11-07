## Story

#202 lets-go-one-rule-once — each lets-go rule is written once, and a done report is checked against its record, https://github.com/sidereal-io/lets-spec/issues/202

The issue has no comments. The packet was never edited after it was created on 2026-11-05.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | What does the story change, and what stays as it is? | It changes `skills/lets-go/SKILL.md`, its tests and the `lets-go` spec. Each rule is defined once, a `done` report is checked (B6), every Kind gets a level (B8d), review plan's done test has an order (B8f), and branches that cannot run go or say when they run (C3). Nothing moves into `references/` (#203). Terms at first use stay for #204. | Evidence: #202 Scope and Findings |
| D2 | Do the blocker read and the parent's **Shared decisions** still need work? | No. #201 left one blocker read, in *Check the issue*, and one read of **Shared decisions**, in *Confirm the packet*. Nothing changes there. | Evidence: `skills/lets-go/SKILL.md`, *Check the issue* and *Confirm the packet* |
| D3 | Where is the level defined, and what does a Kind other than Chore, Bug or Story get (B8d)? | Once, in *Set the level*: the request's level, then the config's, then the Kind's. The Kind's is `recommend` for a Chore or a Bug, and `ask` for any other Kind, as *Confirm the packet* treats it as a Story. Before shape there is no Kind, so it is `ask`, with the line `Interactivity: ask, because shape has not run yet.` *Run the shape step* links to it. "After a shape step, set it again here" goes: *Set the level* runs once per run anyway. | Assumption (decided by recommendation) |
| D4 | Where are the printed lines defined? | Once, in one section: the form of each step's `Done`, `Skipped` and `Failed` line, shape's included, and the `<date>` and `<evidence>` rule. Each part that prints a line links to it. The `Interactivity` lines stay with the level (D3). Each `Picked` line is already written once, where it is printed. | Assumption (decided by recommendation) |
| D5 | How often does a run print shape's line? | `Done shape` once per run. After a lost claim, *Check the issue* does not print it again. A `Skipped shape` line is printed once per issue, so a new pick after a lost claim gets its own. | Assumption (decided by recommendation) |
| D6 | Where is the branch check? | Once, in *Check the issue*. *Claim* loses its own check and the `branch-exists` result. If a branch appears after the check, `git switch -c` fails, and *Claim* returns `branch-failed`, which releases the claim. | Assumption (decided by recommendation) |
| D7 | Where do the "no Project" and "several Projects" stops live? | The Project query runs once, in *Read the settings*, and that part stops when it finds none or several, before any other stop. *Find the source of demand* no longer returns `no-project` or `several-projects`, and the four parts that handled them lose those bullets. | User |
| D8 | How often is the prerequisite checked? | The rule is written once, in *Check the prerequisite*. It runs in `next` for each candidate, and in the first case of *Find the source of demand*, which *Check the issue* runs for every issue, a picked one included (D9). *Claim*'s preflight no longer runs it a third time: it runs only *Check the checkpoint*, which runs *Check the prerequisite* again only when the owner or the base has changed. | Assumption (decided by recommendation) |
| D9 | How often is the packet checked for an issue that `next` picked? | Twice, as #201 set up: `next` checks each candidate, and *Check the issue* checks the picked issue again, which catches a packet that changed in between. The rule is written once, in *Confirm the packet*, and both run it. | User |
| D10 | Where is each step's done test? | Once, in the walk. Each row's test is an ordered list, and the first item that matches decides. The step table loses its *Done when* column. | Assumption (decided by recommendation) |
| D11 | In what order does review plan's done test read the records (B8f)? | First, on `lets-minimal`, it is done. Second, when the archive folder exists, it is done, and the records disagree if the pull request has no **Plan review** section. Third, otherwise, the section must cover the plan. | Evidence: #202 Findings, B8f; the *Records that disagree* table |
| D12 | What happens after a `done` report from plan, review plan, build or review build (B6)? | The walk runs that row's done test again, with its disagreement rules. If the test fails, the step failed: print `Failed <step>: the step reported done, but <record> says otherwise.`, and end the walk as for any failed step. `<record>` names the record and what it says. | Evidence: #202 Findings, B6 (Fix) |
| D13 | Does shape need the same check (B6)? | No. After a shape step, *Check the issue* runs *Confirm the packet* again, and stops on a second `needs-shape`. | Evidence: `skills/lets-go/SKILL.md`, *Check the issue* |
| D14 | Which branches that cannot run go, and which say when they run? | Three go, beside D3 and D6. *Find the source of demand* loses "When *Claim* ran it, return to *Claim*", because *Claim* never runs it. Review plan on `lets-minimal` loses "once plan is done". The `MERGED` and `CLOSED` stops stay, with when they run: a stacked pull request merged into the branch below it, which leaves the issue open, or a closed issue the user named whose branch is still there. | Assumption (decided by recommendation) |
| D15 | Which spec requirements change? | In `lets-go`, the requirements that state these rules: the level (any other Kind), the walk (the check again, the order), the closed pull request (when it runs), *Start finds…* (the Project query, *Claim*, the prerequisite, the picked issue), and the results table. *lets-go runs for a Chore, a Bug or a Story* also covers any other Kind as a Story, and loses its old "stand" and "sets aside" sentence. | Assumption (decided by recommendation) |
| D16 | How do the tests change? | Each pinned phrase changes with its sentence. New checks: each step line's form and the `<date>` rule appear once; *Claim* returns no `branch-exists`; no part handles `no-project`; the walk runs the done test again after `done`; review plan's test starts with `lets-minimal`; the level names any other Kind. | Assumption (decided by recommendation) |
| D17 | Does the story add a glossary term? | No. "Done test" is plain words, explained where the walk uses it. | Assumption (decided by recommendation) |

## Changes from the story

- Added: the Project query runs once, in *Read the settings* (D7). The Scope does not list it, but #201 left the four copies of these stops for this story, and the fix is the same rule as C3. One effect: a repository with no single Project now stops there, before any other stop.
- Added: two more branches that cannot run go (D14), under the Scope's "remove the branches that cannot run".
- Added: *lets-go runs for a Chore, a Bug or a Story* is reworded (D15), because it states the Kinds that B8d changes.
- Nothing needed: the blocker read and **Shared decisions** are written once already (D2).
- Out of scope: the claim race, being shaped as a separate bug. The title search on a change's branch stays `--state open`.
- Nothing was cut, and nothing was split out. The story fits in about ten tasks.

The user chose D7 and D9. The orchestrator confirmed the rest of this ledger on the user's behalf, 2026-11-06.

Confirmed by user: yes
