import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readReport } from '../../../lets/src/delegate/report.ts';

// A final message that ends with a step-report block holding yaml.
const ending = (yaml: string, fence = '```') => `${fence}step-report\n${yaml}${fence}\n`;

test('a done report holds its evidence', () => {
  const text = ending('outcome: done\nevidence:\n  - commit 3f2a1c0\n  - "pull request #164"\n');
  assert.deepEqual(readReport(text), { outcome: 'done', evidence: ['commit 3f2a1c0', 'pull request #164'] });
});

test('a needs-input report keeps each question\'s recommendation', () => {
  const text = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n    recommendation: lets-minimal\n');
  assert.deepEqual(readReport(text), { outcome: 'needs-input', questions: [{ question: 'Which schema?', recommendation: 'lets-minimal' }] });
});

test('a question without a recommendation has none', () => {
  const text = ending('outcome: needs-input\nquestions:\n  - question: Which schema?\n');
  assert.deepEqual(readReport(text), { outcome: 'needs-input', questions: [{ question: 'Which schema?' }] });
});

test('a needs-input report keeps its questions in order', () => {
  const text = ending('outcome: needs-input\nquestions:\n  - question: First?\n  - question: Second?\n    recommendation: yes\n');
  assert.deepEqual(readReport(text), { outcome: 'needs-input', questions: [{ question: 'First?' }, { question: 'Second?', recommendation: 'yes' }] });
});

test('a failed report holds its reason', () => {
  assert.deepEqual(readReport(ending('outcome: failed\nreason: tests fail on main\n')), { outcome: 'failed', reason: 'tests fail on main' });
});

test('a shorter fence inside the block does not close it', () => {
  const text = ending('outcome: failed\nreason: |\n  ```\n  quoted line\n  ```\n', '````');
  assert.deepEqual(readReport(text), { outcome: 'failed', reason: '```\nquoted line\n```\n' });
});

test('prose before the block is not part of the report', () => {
  const text = `First paragraph.\n\nSecond paragraph.\n\n${ending('outcome: failed\nreason: no\n')}`;
  assert.deepEqual(readReport(text), { outcome: 'failed', reason: 'no' });
});

test('text after the block is ignored', () => {
  const text = `${ending('outcome: failed\nreason: no\n')}\nThat is all.\n`;
  assert.deepEqual(readReport(text), { outcome: 'failed', reason: 'no' });
});

test('the last step-report block is the report', () => {
  const text = `${ending('outcome: failed\nreason: first\n')}\n${ending('outcome: failed\nreason: last\n')}`;
  assert.deepEqual(readReport(text), { outcome: 'failed', reason: 'last' });
});

test('a step-report fence inside another fenced block opens no report', () => {
  const quoted = '````markdown\n```step-report\noutcome: failed\nreason: quoted\n```\n````\n';
  assert.deepEqual(readReport(`${ending('outcome: failed\nreason: real\n')}\n${quoted}`), { outcome: 'failed', reason: 'real' });
});
