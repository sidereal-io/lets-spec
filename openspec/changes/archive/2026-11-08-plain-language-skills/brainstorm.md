## Story

[#224 — Make skill instructions and outputs usable by people and agents](https://github.com/sidereal-io/lets-spec/issues/224),
part of [epic #194](https://github.com/sidereal-io/lets-spec/issues/194).

## Decisions

| # | Question | Answer | Source |
|---|---|---|---|
| D1 | Review only, or implement? | Review all skills on main and implement the revisions. | User |
| D2 | Who must the communication serve? | Both people and agents must be able to find what they need, understand it and use it, through clear wording, structure and design. | User |
| D3 | Where does this work belong? | Extend epic #194 with a full sweep of all 13 skills, their instructions, outputs, shared guidance and review checks. | User |
| D4 | What if an instruction's meaning is uncertain? | Stop and ask the user before choosing a meaning that affects the work. | User |
| D5 | What must a clearer instruction preserve? | Preserve workflow behavior, permissions, domain meanings and machine-readable formats. | User |
| D6 | How will we assess clarity? | Check representative reader tasks for relevance, findability, understanding and use; sentence length alone is not a pass or fail. | User |
| D7 | Does guidance need to reach both flows and fresh review sessions? | Both flows ship skills, and delegated reviewers receive explicit prompts rather than the author's conversation. | Evidence: flows.json; skills/lets-review-plan/SKILL.md; skills/lets-review-pr/references/role-prompt.md |

## Changes from the story

None. The user placed the full sweep under epic #194 before the story was
filed. Its existing skill-specific fixes remain part of the starting point.

Confirmed by user: yes
