// lets go records applies lets-review-plan's Check an earlier review in code
// (lets/src/go/plan-review.ts), and the skill's text stays the rule
// (ADR-031). This fails when the text drops a string the code depends on,
// so a reworded rule fails here instead of drifting from the code.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { repo } from '../support/lets.ts';

const SKILL = 'skills/lets-review-plan/SKILL.md';

// Each string the code reads or applies: the section's lines and lists,
// the fix item's form, and the two commands of rules 3 and 4.
const RULE = [
  '## Plan review',
  'Reviewed: ',
  '- **Verdict:** ',
  '- **Required changes:**',
  '- **Rebuttals:**',
  'Fixed in <commit>',
  'git merge-base --is-ancestor <sha> HEAD',
  'git log --oneline <sha>..HEAD -- openspec/changes/<name>/ docs/decisions/',
  "':(exclude)openspec/changes/<name>/tasks.md'",
];

// The strings of RULE that text does not hold, with its whitespace
// collapsed, so a line wrap in the skill fails nothing.
function missing(text: string): string[] {
  const flat = text.replace(/\s+/g, ' ');
  return RULE.filter((want) => !flat.includes(want.replace(/\s+/g, ' ')));
}

test(`${SKILL} holds each string of Check an earlier review that lets go records depends on`, () => {
  const gone = missing(readFileSync(join(repo, SKILL), 'utf8'));
  assert.deepEqual(gone, [], `${SKILL} no longer holds: ${gone.join(' | ')}. Change lets/src/go/plan-review.ts with the rule, then this list.`);
});

test('the check names each missing string, and reads a string wrapped across lines', () => {
  const wrapped = RULE.join('\n').replace('git merge-base --is-ancestor', 'git merge-base\n  --is-ancestor');
  assert.deepEqual(missing(wrapped), []);
  assert.deepEqual(missing(RULE.filter((want) => want !== '- **Rebuttals:**' && want !== 'Reviewed: ').join('\n')), ['Reviewed: ', '- **Rebuttals:**']);
});
