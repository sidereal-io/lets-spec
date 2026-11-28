<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

Skill text has no phrase tests (#336), so each task's verify command is
a search of the section that owns the rule, and review checks the
wording against the scenarios in `specs/`. Edit the sources in
`skills/`, never the copies in `.agents/skills/`. "The subsection" means
`### Questions the packet leaves to the user` in
`skills/lets-brainstorm/SKILL.md`, which design Decision 1 places
between *Read the thread* and *Settle the story*. Ledger rows are cited
as D1 to D5, design decisions as design §N.

## 1. lets-brainstorm finds and asks a question the packet leaves to the user

- [x] 1.1 [easy] The subsection exists and says the brainstorm looks only in the story's own packet, the issue body it already reads, and reads no parent epic's body. A comment never leaves a question to the user (D4, design §2) (verify: sed -n '/^### Questions the packet leaves to the user/,/^### Settle the story/p' skills/lets-brainstorm/SKILL.md | grep -qi 'comment') (✓ verify passed)
- [x] 1.2 [easy] The subsection says a line leaves a question to the user when it says a decision is not yet made by the user, or must be agreed with the user, in any wording and under any heading, names no phrase a packet must use, and quotes #328's lines "Where the expected fields and values come from is not yet decided by the user" and "Agree it with the user in the brainstorm" as examples (D1) (verify: sed -n '/^### Questions the packet leaves to the user/,/^### Settle the story/p' skills/lets-brainstorm/SKILL.md | grep -q 'Agree it with the user in the brainstorm') (✓ verify passed)
- [x] 1.3 [easy] The subsection says that a line the brainstorm cannot read for certain counts as leaving the question to the user, and that a line that only describes what the user does, naming no choice, is not unclear (D2) (verify: sed -n '/^### Questions the packet leaves to the user/,/^### Settle the story/p' skills/lets-brainstorm/SKILL.md | grep -qi 'cannot tell') (✓ verify passed)
- [ ] 1.4 [medium] The subsection says how to ask such a question, whoever runs the brainstorm: with no recommendation, with two or three options and their trade-offs, with no option called recommended, preferred or best, and quoting the packet line with the number of the issue it is in. It never settles the question from code, a document or an assumption, and the answer's ledger row has the source `User` (D3, D5) (verify: sed -n '/^### Questions the packet leaves to the user/,/^### Settle the story/p' skills/lets-brainstorm/SKILL.md | grep -qi 'no recommendation')
- [ ] 1.5 [easy] Three bullets make an exception for a question the packet leaves to the user, each linking the subsection: in *The stance*, the **Grounded** bullet, so such a question is asked even when the code seems to answer it; in *Settle the story*, the bullet on asking with a recommended answer and the bullet on leading with the recommended option (design §1) (verify: grep -c '(#questions-the-packet-leaves-to-the-user)' skills/lets-brainstorm/SKILL.md | grep -qx '[3-9]')

## 2. The step prompt gives no recommendation for such a question

- [ ] 2.1 [parallel] [easy] In `skills/lets-go/references/step-prompt.md`, the *Questions* section's sentence on questions with no recommendation also names a question that the story's packet leaves to the user, and names no section of `lets-brainstorm` (design §4) (verify: sed -n '/^## Questions/,/^## The report/p' skills/lets-go/references/step-prompt.md | tr '\n' ' ' | grep -q 'leaves to the user')

## 3. Integration [depends-on: 1, 2]

- [ ] 3.1 [easy] The project's three checks pass on the branch, including the link, field and term checks in `tests/contracts/` over the edited skills (verify: pnpm test && nix flake check && mise run check)
- [ ] 3.2 [medium] Pull request #363's description holds a walkthrough that traces three packet lines through the edited skill text to a `needs-input` question with no recommendation: #328's two lines, and the unclear line "The timeout is up to the user's preference, probably 30 seconds" (verify: gh pr view 363 --json body --jq .body | grep -qi 'walkthrough')

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
