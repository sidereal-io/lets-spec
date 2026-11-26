// Each schema template a text names is a file lets-spec ships. An agent
// sent to copy a template that is gone copies nothing.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { repo, tempDir } from '../support/lets.ts';
import { type Finding, readTexts } from './texts.ts';

/**
 * Each `openspec/schemas/<schema>/templates/<file>.md` a text under `root`
 * names that is no file in `<root>/schemas/`. The project's path names
 * the file the release copies from the source.
 */
function templateFindings(root: string): Finding[] {
  return readTexts(root).flatMap((text) => {
    const named = new Set([...text.source.matchAll(/openspec\/schemas\/([a-z-]+\/templates\/[a-z-]+\.md)/g)].map((match) => match[0]));
    return [...named]
      .filter((name) => !existsSync(join(root, 'schemas', name.slice('openspec/schemas/'.length))))
      .map((name) => ({ file: text.path, name }));
  });
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

test('each schema template the texts name exists', () => {
  assert.deepEqual(templateFindings(repo), []);
});

test('the template check names a template that does not exist', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'schemas/lets-demo/templates/tasks.md', ['# Tasks']);
  smallText(dir, 'skills/lets-plan/SKILL.md', [
    '# lets-plan',
    '',
    'Copy `openspec/schemas/lets-demo/templates/tasks.md`, then',
    '`openspec/schemas/lets-demo/templates/review.md`.',
  ]);
  assert.deepEqual(templateFindings(dir), [{ file: 'skills/lets-plan/SKILL.md', name: 'openspec/schemas/lets-demo/templates/review.md' }]);
});
