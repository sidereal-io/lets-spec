## Story

#311 skill-contract-checks-in-node — a text that names a lets command,
flag, field, link, skill or file that does not exist fails a Node test.
https://github.com/sidereal-io/lets-spec/issues/311

Parent: #308, *Epic: lets is tested through its commands, and bats is
gone*. Its *Shared decisions* section applies to this story. Stacked on
#309 (`sync-tests-in-node`, pull request #322), whose helper module in
`tests/support/lets.ts` this story extends.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which texts do the checks read? | Every skill's `SKILL.md` and reference files, every schema's `schema.yaml` and templates, `overlays/AGENTS.md`, `README.md` and `docs/*.md`. | Evidence: #311 packet, *Scope: in* |
| D2 | Where does a contract check get the names it expects? | From the code: the command table and what a command prints. Never from a list typed into the test. | Evidence: #308 *Shared decisions*; #311 packet |
| D3 | Does `lets` change? | No. | Evidence: #308 *Shared decisions* |
| D4 | Does this story delete `tests/skill-interfaces.bats` or any test in it? | No. #312 deletes them. The bats tests keep running beside the new Node tests until then. | Evidence: #311 packet, *Scope: out* |
| D5 | Does this story check fixed sentences or form (line width, list numbering, a link for each section named, a link for each glossary term)? | No. | Evidence: #311 packet, *Scope: out*; #308 *Shared decisions* |
| D6 | Does this story write the check that each `lets-*` schema loads in the OpenSpec CLI (kind 4)? | No. #310 carries it over from `tests/openspec-compat.bats`. | Evidence: #311 packet |
| D7 | Is a skill a text names checked against the flow that ships the text? | Yes, by `flows.json`, as the bats test "each skill a schema or config names is one its flow ships" does. Links are also checked inside each published flow, as "writing reference inputs resolve inside each published flow" and "lets-go's links resolve in each published flow" do. | Evidence: #311 packet; `tests/skill-interfaces.bats` |
| D8 | Is the check that each `gh` command a text names is one `gh --help` knows in scope, with `gh` on `PATH` in the flake check that runs these tests? | Yes. The flake's `node-tests` check has no `gh` today, so this story adds it. | Evidence: #311 packet, *Scope: in*; `flake.nix` `node-tests` |
| D9 | When a new check finds a broken name in a text, is fixing the text in scope? | Yes. | Evidence: #311 packet, *Scope: in* |
| D10 | Are the bats tests of the bats file's own helper functions carried over? | No. | Evidence: #311 packet |
| D11 | How is the test strategy chosen for the build? | By `skills/lets-verify-contracts/SKILL.md` in this checkout, not test-first. | User (lets-go run note) |
| D12 | How do the new tests find which commands and flags `lets` has? | Run `lets <command> --help` for each command and read the Commands and Options lists it prints. `lets` does not change. | Assumption |
| D13 | Does this story check the JSON fields and result values a text reads (kind 2)? | No. Kind 2 moves to a new story, blocked by this one, that first agrees a fixed way to write a field or value. This story keeps kinds 1 and 3 and the `gh` check. | User |
| D14 | How is each check seen to fail once? | A test runs the check on a small text written for the test, holding one broken name, and expects the finding to name that file and that name. | Assumption |

## Changes from the story

- **Split out: kind 2, the check that each JSON field and result value a
  text reads is one the command prints.** No rule finds those words in
  today's texts without many false hits, so the new story first agrees a
  fixed way to write a field or value, then checks it. No bats test checks
  fields today, so #312 does not wait for it. New issue: #328,
  `skill-field-checks-in-node`, a Must story under #308, blocked by #311.

Confirmed by user: yes
