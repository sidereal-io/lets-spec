// lets sync creates the files a project owns when they are missing, then
// never edits them. It warns about their settings, and exits 0 when it
// warns, so a problem never stops a dev shell from starting.
import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { type TestContext, test } from 'node:test';
import { repo, tempDir } from '../support/lets.ts';
import { project, setSchema, useRelease } from './project.ts';

const release = useRelease();

const CONFIG = 'openspec/config.yaml';

test('sync creates each file the project needs, and names each one', async (t) => {
  const p = project(t);
  rmSync(join(p.path, CONFIG));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(p.read(CONFIG), readFileSync(join(release(), 'init', CONFIG), 'utf8'));
  assert.equal(readlinkSync(join(p.path, 'CLAUDE.md')), 'AGENTS.md');
  assert.equal(readlinkSync(join(p.path, '.claude/skills')), '../.agents/skills');
  assert.ok(output.includes('created AGENTS.md'), output);
  assert.ok(output.includes('created openspec/config.yaml'), output);
  assert.ok(output.includes('linked CLAUDE.md to AGENTS.md'), output);
  assert.ok(output.includes('linked .claude/skills to ../.agents/skills'), output);
});

test('a config sync just created needs no settings', async (t) => {
  const p = project(t);
  rmSync(join(p.path, CONFIG));
  await p.init();
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(output, '');
});

test("sync never edits the project's own config", async (t) => {
  const p = project(t);
  const config = '# Our config\nschema: lets-standard\ncontext: |\n  Our context.\n';
  p.write(CONFIG, config);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(p.read(CONFIG), config);
});

test('sync keeps a CLAUDE.md that is a file, and warns', async (t) => {
  const p = project(t);
  p.write('CLAUDE.md', 'claude text\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(p.read('CLAUDE.md'), 'claude text\n');
  assert.ok(output.includes('CLAUDE.md is not a link to AGENTS.md'), output);
});

test('sync keeps a .claude/skills that is a folder, and warns', async (t) => {
  const p = project(t);
  mkdirSync(join(p.path, '.claude/skills/mine'), { recursive: true });
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(lstatSync(join(p.path, '.claude/skills/mine')).isDirectory());
  assert.ok(output.includes('.claude/skills is not a link to ../.agents/skills'), output);
});

test('sync warns when the config names another schema', async (t) => {
  const p = project(t);
  p.write(CONFIG, setSchema(p.read(CONFIG), 'spec-driven'));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes("openspec/config.yaml sets schema to 'spec-driven'; it must be lets-standard"), output);
});

test('sync warns when the config sets no schema', async (t) => {
  const p = project(t);
  p.write(CONFIG, setSchema(p.read(CONFIG), null));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes('openspec/config.yaml sets no schema; it must be lets-standard'), output);
});

test('sync warns when the config has a schema it cannot read', async (t) => {
  const p = project(t);
  p.write(CONFIG, 'schema:\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes('openspec/config.yaml sets no schema'), output);
});

// The config release 0.7.0 wrote, whose code review rule names lets-review-code.
const config070 = readFileSync(join(repo, 'tests/lets/sync/fixtures/config-0.7.0.yaml'), 'utf8');
const staleRule = 'openspec/config.yaml names lets-review-code, which this release does not ship. Delete the operations.archive entry that names it: the lets-review-build skill runs the code review now.';

test('sync lists the code review rule release 0.7.0 wrote, once', async (t) => {
  const p = project(t);
  p.write(CONFIG, config070);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(output.split('\n').filter((line) => line.includes(`- ${staleRule}`)).length, 1, output);
});

test("sync ignores lets-review-code in the config's comments", async (t) => {
  const p = project(t);
  p.write(CONFIG, 'schema: lets-standard\n# lets-review-code\nx: 1 # lets-review-code\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(!output.includes('lets-review-code'), output);
});

test('sync lists a wrong schema beside the code review rule', async (t) => {
  const p = project(t);
  p.write(CONFIG, setSchema(config070, 'spec-driven'));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes("openspec/config.yaml sets schema to 'spec-driven'; it must be lets-standard"), output);
  assert.ok(output.includes(staleRule), output);
});

test('sync --check passes on a config that names lets-review-code', async (t) => {
  const p = project(t);
  await p.init();
  p.write(CONFIG, config070);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 0, output);
});

test('sync keeps a config link that points nowhere, and warns', async (t) => {
  const p = project(t);
  rmSync(join(p.path, CONFIG));
  symlinkSync('../nowhere.yaml', join(p.path, CONFIG));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(readlinkSync(join(p.path, CONFIG)), '../nowhere.yaml');
  assert.ok(output.includes('openspec/config.yaml is missing, and could not be created'), output);
});

test('sync works on the whole project when run from a folder inside it', async (t) => {
  const p = project(t);
  const deep = join(p.path, 'src/deep');
  mkdirSync(deep, { recursive: true });
  const { code, output } = await p.sync([], {}, deep);
  assert.equal(code, 0, output);
  assert.ok(existsSync(join(p.path, 'AGENTS.md')));
  assert.ok(existsSync(join(p.path, '.agents/skills/lets-build/SKILL.md')));
  assert.ok(!existsSync(join(deep, 'AGENTS.md')));
});

test('sync warns and exits 0 outside a git repo', async (t) => {
  const p = project(t);
  const tmp = tempDir(t);
  const outside = join(tmp, 'outside');
  mkdirSync(outside);
  const { code, output } = await p.sync([], { GIT_CEILING_DIRECTORIES: tmp }, outside);
  assert.equal(code, 0, output);
  assert.ok(output.includes('not inside a git repo'), output);
  assert.deepEqual(readdirSync(outside), []);
});

test('sync prints its usage', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync(['--help']);
  assert.equal(code, 0, output);
  assert.ok(output.startsWith('Usage: lets sync [--check]'), output);
  assert.ok(output.includes('Set up a project for lets-spec, and keep it set up.'), output);
  assert.ok(output.includes('LETS_SPEC_SKILLS=ignored'), output);
  assert.ok(output.replace(/\n+$/, '').endsWith('The Nix wrapper sets WORKFLOW_RELEASE.'), output);
});

test('sync refuses an unknown option', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync(['--force']);
  assert.equal(code, 2, output);
  assert.ok(output.includes("unknown option '--force'"), output);
});

test('sync refuses to run without a release', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: undefined });
  assert.equal(code, 1, output);
  assert.ok(output.includes('there is no release for flow'), output);
});

test('sync refuses a folder that is not a release', async (t) => {
  const p = project(t);
  const empty = join(tempDir(t), 'empty');
  mkdirSync(empty);
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: empty });
  assert.equal(code, 1, output);
  assert.ok(output.includes('is not a release of lets-spec'), output);
});

// A copy of the file's release that ships n schemas: none, or lets-standard
// plus n-1 copies named lets-extra<i>. lets sync owns only schemas named
// lets-*, so the copies are too.
function releaseWithSchemas(t: TestContext, n: number): string {
  const dir = join(tempDir(t), 'store', 'n-lets-spec-release');
  cpSync(release(), dir, { recursive: true, verbatimSymlinks: true });
  makeWritable(dir);
  const schemas = join(dir, 'overlay/openspec/schemas');
  if (n === 0) rmSync(join(schemas, 'lets-standard'), { recursive: true });
  for (let i = 1; i < n; i++) {
    cpSync(join(release(), 'overlay/openspec/schemas/lets-standard'), join(schemas, `lets-extra${i}`), { recursive: true, verbatimSymlinks: true });
  }
  return dir;
}

function makeWritable(path: string) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) return;
  chmodSync(path, stat.mode | 0o200);
  if (stat.isDirectory()) for (const entry of readdirSync(path)) makeWritable(join(path, entry));
}

test('sync refuses a release that holds no schema', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: releaseWithSchemas(t, 0) });
  assert.equal(code, 1, output);
  assert.ok(output.includes('holds no schema'), output);
  assert.ok(!existsSync(join(p.path, 'AGENTS.md')));
});

test('sync copies every schema a release holds', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: releaseWithSchemas(t, 2) });
  assert.equal(code, 0, output);
  assert.ok(existsSync(join(p.path, 'openspec/schemas/lets-standard/schema.yaml')));
  assert.ok(existsSync(join(p.path, 'openspec/schemas/lets-extra1/schema.yaml')));
});

test('sync refuses a release whose config names a schema it does not ship', async (t) => {
  const p = project(t);
  const dir = releaseWithSchemas(t, 2);
  rmSync(join(dir, 'overlay/openspec/schemas/lets-standard'), { recursive: true });
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: dir });
  assert.equal(code, 1, output);
  assert.ok(output.includes("names 'lets-standard', which the release does not ship"), output);
  assert.ok(!existsSync(join(p.path, 'AGENTS.md')));
});
