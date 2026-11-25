// Each skill a text names is one lets-spec has, and one the flow ships
// where the flow's own files name it. An agent told to run a skill its
// flow lacks has nothing to run.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { repo, tempDir } from '../support/lets.ts';
import { type Finding, readText, readTexts, skillFiles, skillFolders, type Text } from './texts.ts';

interface Flow {
  schemas: string[];
  skills: string[];
}

function readFlows(root: string): Record<string, Flow> {
  return JSON.parse(readFileSync(join(root, 'flows.json'), 'utf8')).flows;
}

// Each name the text calls a skill, as `<name>` skill, even across a line
// break. "the `ignored` skills mode" names no skill.
function namedSkills(text: Text): string[] {
  return [...new Set([...text.source.matchAll(/`([a-z0-9-]+)`\s+skill(?!s)/g)].map((match) => match[1]))];
}

// The files lets-spec gives a flow's agent besides its skills: each schema
// the flow ships, and the config the release makes from its first schema's.
function flowTexts(root: string, flow: Flow): Text[] {
  return [
    ...flow.schemas.map((schema) => `schemas/${schema}/schema.yaml`),
    `overlays/openspec/config.d/${flow.schemas[0]}.yaml`,
  ].map((path) => readText(root, path));
}

/**
 * The skill names under `root` that point at nothing: a skill a text names
 * that is no folder of `skills/` and no generated `openspec-*` skill; a
 * skill a flow's schemas or config name that `flows.json` does not ship
 * with that flow; and a skill whose `name:` is not its folder.
 */
function skillNameFindings(root: string): Finding[] {
  const known = new Set(skillFolders(root));
  const generated = (name: string) => name.startsWith('openspec-');
  const findings: Finding[] = readTexts(root).flatMap((text) =>
    namedSkills(text).filter((name) => !known.has(name) && !generated(name)).map((name) => ({ file: text.path, name })));
  for (const flow of Object.values(readFlows(root))) {
    for (const text of flowTexts(root, flow)) {
      for (const name of namedSkills(text)) {
        if (!flow.skills.includes(name) && !generated(name)) findings.push({ file: text.path, name });
      }
    }
  }
  for (const skill of known) {
    const text = readText(root, `skills/${skill}/SKILL.md`);
    const name = /^name: *(.*)$/m.exec(text.source)?.[1].trim() ?? '';
    if (name !== skill) findings.push({ file: text.path, name });
  }
  return findings;
}

// The skills the routing table in overlays/AGENTS.md sends a request to:
// each `<name>` skill in its Routing section. A user starts these, so no
// other text needs to name them.
function entryPoints(root: string): string[] {
  const text = readText(root, 'overlays/AGENTS.md');
  const at = text.headings.findIndex((heading) => heading.text === 'Routing');
  if (at === -1) return [];
  const next = text.headings.find((heading, index) => index > at && heading.level <= text.headings[at].level);
  const lines = text.source.split('\n').slice(text.headings[at].line, next ? next.line - 1 : undefined);
  return namedSkills({ ...text, source: lines.join('\n') });
}

/**
 * Each skill a flow ships that nothing in the flow reaches: no entry
 * point of the routing table, and named by none of the flow's schemas,
 * its config or the files of a skill it ships. Each finding names
 * `flows.json` and the skill.
 */
function unreachedSkillFindings(root: string): Finding[] {
  const entries = new Set(entryPoints(root));
  return Object.values(readFlows(root)).flatMap((flow) => {
    const named = new Set([
      ...flowTexts(root, flow).flatMap(namedSkills),
      ...flow.skills.flatMap((skill) => skillFiles(root, `skills/${skill}`))
        .filter((path) => existsSync(join(root, path)))
        .flatMap((path) => namedSkills(readText(root, path))),
    ]);
    return flow.skills.filter((skill) => !entries.has(skill) && !named.has(skill)).map((name) => ({ file: 'flows.json', name }));
  });
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

// A small project with one flow, whose schema and config name only what
// it ships. Each test adds the one broken name it shows.
function smallProject(dir: string) {
  writeFileSync(join(dir, 'flows.json'), JSON.stringify({ flows: { demo: { schemas: ['lets-demo'], skills: ['lets-go', 'lets-build'] } } }));
  smallText(dir, 'skills/lets-go/SKILL.md', ['---', 'name: lets-go', '---', '# lets-go', '', 'Run the `lets-build`', 'skill, then the `openspec-archive-change` skill.']);
  smallText(dir, 'skills/lets-build/SKILL.md', ['---', 'name: lets-build', '---', '# lets-build']);
  smallText(dir, 'skills/lets-review-plan/SKILL.md', ['---', 'name: lets-review-plan', '---', '# lets-review-plan']);
  smallText(dir, 'schemas/lets-demo/schema.yaml', ['instruction: The `lets-build` skill runs this step.']);
  smallText(dir, 'overlays/openspec/config.d/lets-demo.yaml', ['schema: lets-demo', '# The `ignored` skills mode keeps copies out of git.']);
  smallText(dir, 'overlays/AGENTS.md', ['# Rules', '', '### Routing', '', '| Request | Start with |', '|---|---|', '| Anything | The `lets-go` skill |', '', '### Writing', '', 'The `lets-review-plan` skill is no entry point.']);
}

test('each skill the texts name exists, ships with each flow that names it, and is named for its folder', () => {
  assert.deepEqual(skillNameFindings(repo), []);
});

test('the skills check passes a small project whose names all resolve', (t) => {
  const dir = tempDir(t);
  smallProject(dir);
  assert.deepEqual(skillNameFindings(dir), []);
});

test('the skills check names a skill that is no folder of skills/', (t) => {
  const dir = tempDir(t);
  smallProject(dir);
  smallText(dir, 'docs/guide.md', ['# Guide', '', 'Then run the `lets-review-code` skill.']);
  assert.deepEqual(skillNameFindings(dir), [{ file: 'docs/guide.md', name: 'lets-review-code' }]);
});

test("the skills check names a skill a flow's schema names but the flow does not ship", (t) => {
  const dir = tempDir(t);
  smallProject(dir);
  smallText(dir, 'schemas/lets-demo/schema.yaml', ['instruction: The `lets-review-plan` skill reviews the plan.']);
  assert.deepEqual(skillNameFindings(dir), [{ file: 'schemas/lets-demo/schema.yaml', name: 'lets-review-plan' }]);
});

test('the skills check names a skill whose name is not its folder', (t) => {
  const dir = tempDir(t);
  smallProject(dir);
  smallText(dir, 'skills/lets-build/SKILL.md', ['---', 'name: lets-make', '---', '# lets-build']);
  assert.deepEqual(skillNameFindings(dir), [{ file: 'skills/lets-build/SKILL.md', name: 'lets-make' }]);
});

test('each skill a flow ships is an entry point, or named by the flow', () => {
  assert.deepEqual(unreachedSkillFindings(repo), []);
});

test('the reach check names a shipped skill that nothing in its flow names', (t) => {
  const dir = tempDir(t);
  smallProject(dir);
  assert.deepEqual(unreachedSkillFindings(dir), []);
  writeFileSync(join(dir, 'flows.json'), JSON.stringify({ flows: { demo: { schemas: ['lets-demo'], skills: ['lets-go', 'lets-build', 'lets-review-plan'] } } }));
  assert.deepEqual(unreachedSkillFindings(dir), [{ file: 'flows.json', name: 'lets-review-plan' }]);
});
