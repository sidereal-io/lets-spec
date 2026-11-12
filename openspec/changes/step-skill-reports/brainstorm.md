## Story

#228 — step-skill-reports: make planning, build-state reports and idea searches usable by a fresh agent.
https://github.com/sidereal-io/lets-spec/issues/228

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Which findings belong here? | Correct only SLR-03, SLR-04, SLR-17 and SLR-18 from #226. | User |
| D2 | What must stay the same? | Preserve saved schemas, commands, permissions, stop points and routing precedence. | User |
| D3 | Where may lets-go change? | Limit edits to source-of-demand and idea search; leave Claim untouched for sibling #215. | User |
| D4 | What evidence is needed? | Add a separate Bats block, walk through representative reader tasks, and pass all three repository checks before pushing. | User |
| D5 | How does the current title search work? | lets backlog find takes the literal idea; the GitHub adapter adds in:title internally. | Evidence: skills/lets-go/SKILL.md and lets/src/backlog/github.ts |

## Changes from the story

None. Apply SLR-17 to the current backlog command, preserving its existing title qualifier.

Confirmed by user: yes
