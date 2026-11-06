# Consolidated advisory comment

Fill this template; omit unused finding placeholders. Publish no transcript or verdict.

```markdown
Reviewed PR: <URL>
Reviewed head: <full SHA and commit link>
Captured base: <full SHA and ref>; merge base: <full SHA>.
Capture interval: <UTC start/end>; context sources: <PR/issue/comment IDs and URLs,
edit/collection times or compact source list identifying the captured inputs>.
Head check: <unchanged / newer commits were not reviewed / current head could not be checked>.

Completed passes: <decision, implementation, focused questions; name any incomplete/skipped pass>.
Stopping reason: <no substantive question / verified approach concern / trial limit / incomplete prerequisite>.
Models: <actual models by role/pass; attributed implementer set or unknown;
diversity and CLI compatibility limits; offline-summary use versus direct source access>.
Limits: <coverage, unavailable context/sources, safe-execution limits and other material uncertainty>.

Concerns, ordered by perceived criticality (reviewer's consequence assessment):

1. **<criticality and concern>**. Confidence: <level and basis>.
   Observation: <verified facts with captured-head links/lines>.
   Interpretation: <why those facts suggest the concern; distinguish risk from proven defect>.
   Likely consequence: <meaningful scenario and impact>.
   Uncertainty: <what remains unknown, what was checked, what could resolve it>.
   Suggested next step: <proportionate remedy or discussion; leave the decision with people>.

Unresolved questions:
- <consequential disagreement, competing evidence, needed human input>.

<For a clean result: No substantive supported concern survived the completed passes.
Explain scope and limits; do not issue approval.>
<For early exit: name the verified approach concern and explain why implementation
review would be premature.>
<Omitted lower-ranked detail, if any; preserve essential uncertainty/questions.>
```
