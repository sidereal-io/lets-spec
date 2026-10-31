## Story

#125 shape-folds-comments — shaping reads an issue's comments and folds the ones the user accepts into the packet. https://github.com/sidereal-io/lets-spec/issues/125

The user delegated this brainstorm to the agent. Each row below was decided by the agent on its own recommendation and the reason is in the row, except where the epic (#124) had already decided it.

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which command fetches the thread? | One `gh api graphql` query on the issue: each comment's `url`, `author { __typename login }`, `authorAssociation`, `createdAt` and `body`, with `pageInfo` for paging, plus the issue's `lastEditedAt`. `gh issue view --json comments` has no bot flag, and a REST path such as `gh api repos/...` fails the skill-interfaces test's `gh` check. `lastEditedAt` costs one field now and is the body's last edit that #126 needs. | Evidence: `tests/skill-interfaces.bats`, `gh api graphql` run on #102 |
| D2 | How is a comment labelled? | `candidate` when `authorAssociation` is OWNER, MEMBER or COLLABORATOR and the author is not a Bot; otherwise `outside`. The label is shown, never used to skip or hide a comment. | Evidence: #124 Shared decisions |
| D3 | What does the user see? | One numbered list, oldest first, one line per comment: its number, label, author, date and a one-sentence summary of what it asks for. The whole list is shown before any question, so the user sees the thread as a thread. | Assumption |
| D4 | What is asked, and about which comments? | One question per comment, in list order, with a recommended answer: fold or dismiss. A comment whose content is already in the body is recommended as dismiss, with that reason. Every comment gets a question: a short thread costs little, and skipping by judgement is the gate the epic forbids. | Assumption |
| D5 | What does a fold write, and when? | A fold changes the packet lines the comment affects. The edits ride the one body write the pass already makes at its confirm step, so the user sees the folded body whole and says yes once. No comment text is pasted in; the packet line is rewritten to say what is now true. | Assumption |
| D6 | What does the reply say? | Its first line is exactly `lets-shape read this thread.` Then one bullet per comment: `Folded:` or `Dismissed:`, the author and date, and what changed or why not. Posted with `gh issue comment` after the body write, so the reply is the newest event. The fixed first line is what #126 will match. | Evidence: #124 Shared decisions (the reply is the audit trail) |
| D7 | Is a reply posted when the thread is empty? | No. A reply only follows a thread that was read. An empty thread leaves no trace. | Assumption |
| D8 | Where does a fold go during Ingest? | The input is read-only, so a fold on the input issue's thread goes into the parent issue's scope or open questions, which Ingest writes anyway. The reply still goes on the thread that was read, and names the parent issue. | Evidence: `skills/lets-shape/SKILL.md`, "The input is read-only" |
| D9 | Where does each rule live? | The reference `skills/lets-shape/references/issue-comments.md` holds the stance, the query, the labels, the list format and the reply's shape. `SKILL.md` holds only the steps: when to read, ask, fold and reply. Other skills in #126 and #127 then read the same reference. | Evidence: #124 Must, "one shared reference" |
| D10 | Which spec? | A new flat capability `issue-comments`, beside the other flat specs. #126 and #127 add their requirements to it. | Evidence: `openspec list --specs` layout |
| D11 | New glossary terms? | None beyond *packet* and *fold*, already imported. `candidate` and `outside` are labels in one reference; promoting them is reuse that has not happened yet. | Evidence: `openspec/glossary.md`, domain-language reference |
| D12 | How does the test cover the new command? | `prose()` in `tests/skill-interfaces.bats` also lists `skills/*/references/*.md`, so every `gh` command in a reference is checked like one in a `SKILL.md`. The link test for `lets-shape` already resolves every `references/*.md` link. | Evidence: `tests/skill-interfaces.bats` |
| D13 | Out of scope, as the packet says | Build's stop on unread comments (#126), the brainstorm ledger row (#127), revision mode (#128), reactions, minimized comments and pull request review comments. | Evidence: #125 Scope, #124 Won't |

## Changes from the story

None. The story stands as written.

Confirmed by user: yes
