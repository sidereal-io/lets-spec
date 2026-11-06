## Why

A collaborator needs to review someone else's pull request without taking over its build workflow. Existing plan and build reviews serve the author's change; neither provides the independent PR comment described in #195.

## What Changes

- Add an explicitly invoked collaborator PR review skill that works against a recorded revision (D2).
- Review decisions and ADRs first, then implementation, using an examiner, challenger and mediator with bounded exchanges.
- Allow up to two additional focused passes when earlier evidence raises a concrete question.
- Publish one comment with grounded concerns ranked by perceived criticality, explicit uncertainty, completed passes and the reason for stopping.
- Prefer models different from the implementer's when its model is known and alternatives are available, without requiring model diversity (D1).
- Ship the skill in both flows and document its independent entry point.

## Capabilities

### New Capabilities

- `collaborator-pr-review`: Explicit review of an existing PR, including revision identity, adversarial examination, evidence thresholds, stopping rules and consolidated publication.

### Modified Capabilities

None. Existing delegation and domain-language requirements remain unchanged.

## Impact

Implementation touches a new skill under `skills/`, its review prompts and references, `flows.json`, usage documentation and skill interface tests. It reuses read-only delegation without adding a CLI strategy, resolver contract or hosted service.

The review creates no OpenSpec change in the target project, fixes no contributor code and writes no required review document there. Its only public write is the requested PR comment. This planning change itself follows the repository's normal workflow.
