<!-- Plain language: Write questions and answers so a reader without the conversation can understand each decision and its source. Keep the confirmation marker exactly as written. -->

## Story

#341 packet-reserved-questions — a question the packet leaves to the user carries no recommendation, so lets-go asks the user at auto.
https://github.com/sidereal-io/lets-spec/issues/341

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | How does the brainstorm recognize that the packet leaves a question to the user? | By meaning: any line that says a decision is not yet made by the user, or must be agreed with the user, in any wording or section. The skill quotes #328's two lines as examples. | Assumption |
| D2 | What does the brainstorm do when it cannot tell whether a line leaves the decision to the user? | Treats it as left to the user, and asks it with no recommendation. | Assumption |
| D3 | What does a question left to the user show? | Two or three options with their trade-offs. No favorite, in the text or in the `recommendation`. | Assumption |
| D4 | Which packets can leave a question to the user? | Only the story's own packet, the issue body. The brainstorm reads no parent epic's body. The parent-epic case is left out of #341: an epic's *Shared decisions* hold one decision for every story, so asking it in each story's brainstorm could record different answers, and asking it once would need a fold into the epic's packet, beyond a Size S bug. This change files no issue for it, and no skill lists the case on its own. The `lets-go` run that plans this change reports it to the user, who decides whether to shape it. | User |
| D5 | Does a question left to the user quote the packet line that leaves it to them? | Yes. The quote tells the user why this question came to them at `auto`, and lets them say the packet was wrong. | Assumption |

## Changes from the story

None.

Confirmed by user: yes
