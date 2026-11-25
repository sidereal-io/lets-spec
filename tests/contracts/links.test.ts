// Each link a text holds resolves: its file exists, inside the folder the
// text is read from, and its #anchor is one of that file's headings. An
// agent that follows a broken link reads nothing, or the wrong part.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { buildRelease, repo, tempDir } from '../support/lets.ts';
import { type Finding, readText, readTexts, skillFiles, type Text } from './texts.ts';

interface Flow {
  schemas: string[];
  skills: string[];
}

const flows: Record<string, Flow> = JSON.parse(readFileSync(join(repo, 'flows.json'), 'utf8')).flows;

// Each link target in the text's prose, as written: `](<target>)`, without
// a title. A target with a URL scheme, or with a placeholder such as
// `discovery/<product>.md`, names no file of ours, so it is left out.
function linkTargets(text: Text): string[] {
  const targets = text.prose.flatMap((piece) => [...piece.text.matchAll(/\]\(([^)\s]+)(?:\s[^)]*)?\)/g)].map((match) => match[1]));
  return [...new Set(targets)].filter((target) => !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(target) && !/[<>]/.test(target));
}

/**
 * Each link of `text` that does not resolve. A link is read from `base`,
 * and its file must be inside `inside`, compared by real path. A link with
 * only an anchor names a heading of `text` itself.
 */
function linkFindings(text: Text, base: string, inside: string): Finding[] {
  const container = realpathSync(inside);
  return linkTargets(text).flatMap((target) => {
    const finding = { file: text.path, name: target };
    const hash = target.indexOf('#');
    const path = decodeURIComponent(hash === -1 ? target : target.slice(0, hash));
    const anchor = hash === -1 ? undefined : decodeURIComponent(target.slice(hash + 1));
    let headings = text.headings;
    if (path !== '') {
      const file = resolve(base, path);
      if (!existsSync(file) || !statSync(file).isFile()) return [finding];
      const real = realpathSync(file);
      if (!real.startsWith(container + sep)) return [finding];
      if (anchor === undefined) return [];
      headings = readText(dirname(real), real.slice(dirname(real).length + 1)).headings;
    }
    return headings.some((heading) => heading.anchor === anchor) ? [] : [finding];
  });
}

/**
 * Each link in the source tree under `root` that does not resolve. A
 * skill is installed without the rest of the repository, so its links
 * must stay inside `skills/`. `README.md` and `docs/*.md` resolve in the
 * repository.
 */
function sourceLinkFindings(root: string): Finding[] {
  return readTexts(root).flatMap((text) => {
    if (text.path.startsWith('skills/')) return linkFindings(text, dirname(text.file), join(root, 'skills'));
    if (text.path === 'README.md' || text.path.startsWith('docs/')) return linkFindings(text, dirname(text.file), root);
    return [];
  });
}

/**
 * Each link in a release that does not resolve inside its overlay, for
 * the skills and schemas the flow ships. An installed skill's files are
 * read from their own folder. Each `schema.yaml` and `fragments/AGENTS.md`
 * are read from the overlay's root, as an agent reads them in the project.
 * A flow ships only some skills, so a link that resolves in the source can
 * break here. Findings name files relative to `release`.
 */
function releaseLinkFindings(release: string, flow: Flow): Finding[] {
  const overlay = join(release, 'overlay');
  const skillTexts = flow.skills.flatMap((skill) => skillFiles(release, `overlay/.agents/skills/${skill}`))
    .filter((path) => existsSync(join(release, path)))
    .map((path) => readText(release, path));
  const rootTexts = [...flow.schemas.map((schema) => `overlay/openspec/schemas/${schema}/schema.yaml`), 'fragments/AGENTS.md']
    .map((path) => readText(release, path));
  return [
    ...skillTexts.flatMap((text) => linkFindings(text, dirname(text.file), overlay)),
    ...rootTexts.flatMap((text) => linkFindings(text, overlay, overlay)),
  ];
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

test('each link in the source skills, the README and the docs resolves', () => {
  assert.deepEqual(sourceLinkFindings(repo), []);
});

test('the link check names a link to a missing file', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/lets-go/SKILL.md', ['# lets-go', '', 'Copy [the frame](references/frame.md).']);
  assert.deepEqual(sourceLinkFindings(dir), [{ file: 'skills/lets-go/SKILL.md', name: 'references/frame.md' }]);
});

test('the link check names a link to a heading its own file does not have', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/lets-go/SKILL.md', ['# lets-go', '', 'Go back to [Start](#start).']);
  assert.deepEqual(sourceLinkFindings(dir), [{ file: 'skills/lets-go/SKILL.md', name: '#start' }]);
});

test('the link check names a link to a heading another file does not have', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/lets-go/SKILL.md', ['# lets-go', '', '## Route']);
  smallText(dir, 'skills/lets-go/references/shape.md', ['# Shape', '', 'Go on from [Check the issue](../SKILL.md#check-the-issue).']);
  assert.deepEqual(sourceLinkFindings(dir), [{ file: 'skills/lets-go/references/shape.md', name: '../SKILL.md#check-the-issue' }]);
});

test('the link check names a skill link that leaves the skills folder', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'README.md', ['# Demo']);
  smallText(dir, 'skills/lets-go/SKILL.md', ['# lets-go', '', 'See [the README](../../README.md).']);
  assert.deepEqual(sourceLinkFindings(dir), [{ file: 'skills/lets-go/SKILL.md', name: '../../README.md' }]);
});

test('the link check passes a URL, a placeholder, an emoji heading and a repeated heading', (t) => {
  const dir = tempDir(t);
  smallText(dir, 'README.md', [
    '# Demo',
    '',
    'See [the spec](https://example.com/spec.md#nothing), [your map](discovery/<product>.md),',
    '[Usage](#️-usage), [the Nix update](#with-nix-1), [the change name](docs/guide.md#the-changes-name)',
    'and [the guide](docs/guide.md "The guide").',
    '',
    '## ⚙️ Usage',
    '',
    '### With Nix',
    '',
    '## Updating',
    '',
    '### With Nix',
  ]);
  smallText(dir, 'docs/guide.md', ['# Guide', '', "## The change's name", '', 'Back to [the README](../README.md#demo).']);
  assert.deepEqual(sourceLinkFindings(dir), []);
});

for (const [name, flow] of Object.entries(flows)) {
  test(`each link resolves inside the published ${name} flow`, (t) => {
    const release = join(tempDir(t), name);
    buildRelease(release, flow.schemas, flow.skills);
    assert.deepEqual(releaseLinkFindings(release, flow), []);
  });
}

test('the published link check names a link to a skill the flow leaves out, through a linked folder', (t) => {
  const dir = tempDir(t);
  const real = join(dir, 'real');
  const flow = { schemas: ['lets-minimal'], skills: ['lets-go'] };
  smallText(real, 'overlay/.agents/skills/lets-go/SKILL.md', [
    '# lets-go',
    '',
    'Read [the terms](references/terms.md), then run [the review](../lets-review-plan/SKILL.md).',
  ]);
  smallText(real, 'overlay/.agents/skills/lets-go/references/terms.md', ['# Terms']);
  smallText(real, 'overlay/openspec/schemas/lets-minimal/schema.yaml', [
    'instruction: |',
    '  Read [Plain language](.agents/skills/lets-go/references/terms.md).',
  ]);
  smallText(real, 'fragments/AGENTS.md', ['# Rules', '', 'Start with [lets-go](.agents/skills/lets-go/SKILL.md).']);
  symlinkSync(real, join(dir, 'alias'));
  assert.deepEqual(releaseLinkFindings(join(dir, 'alias'), flow), [
    { file: 'overlay/.agents/skills/lets-go/SKILL.md', name: '../lets-review-plan/SKILL.md' },
  ]);
});
