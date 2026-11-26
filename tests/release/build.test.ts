// Black-box tests of build/build-release.mjs, which lays out a release for
// one flow, and of lets/build.mjs, which bundles lets for it. The flake
// runs the release build for each recipe in flows.json; these tests run it
// directly.
import assert from 'node:assert/strict';
import { accessSync, chmodSync, constants, copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse } from 'yaml';
import { generatedSkills, makeReadOnly, type ProgramResult, repo, run, tempDir, tree } from '../support/lets.ts';

const BUILD = join(repo, 'build', 'build-release.mjs');

/** Runs the release build of `source` with the generated skills in `generated`. */
function buildFrom(source: string, generated: string, out: string, ...args: string[]): Promise<ProgramResult> {
  return run(process.execPath, [BUILD, source, generated, out, ...args], { cwd: repo });
}

/**
 * Runs the release build on this repository, as the flake does:
 * `schemas` is comma-separated, and the first is the default.
 */
function build(out: string, schemas: string, ...skills: string[]): Promise<ProgramResult> {
  return buildFrom(repo, generatedSkills(`${out}.generated`), out, schemas, ...skills);
}

/** As `build`, and fails the test unless the build exits 0. */
async function built(out: string, schemas: string, ...skills: string[]): Promise<void> {
  const result = await build(out, schemas, ...skills);
  assert.equal(result.code, 0, `the build of ${schemas} into ${out} failed:\n${result.output}`);
}

/** The names in `dir`, sorted, as `ls` lists them, or `ls -A` with `all`. */
function ls(dir: string, all = false): string[] {
  return readdirSync(dir).filter((name) => all || !name.startsWith('.')).sort();
}

/** A copy of the build's sources from this repository, in `dir`. */
function copySource(dir: string): string {
  for (const folder of ['schemas', 'skills', 'overlays']) cpSync(join(repo, folder), join(dir, folder), { recursive: true });
  return dir;
}

function same(a: string, b: string) {
  assert.ok(readFileSync(a).equals(readFileSync(b)), `${b} differs from ${a}`);
}

test('the release links exactly the schemas and the skills it is given', async (t) => {
  const out = join(tempDir(t), 'out');
  await built(out, 'lets-standard,lets-minimal', 'lets-verify-contracts', 'lets-build');
  assert.deepEqual(ls(join(out, 'overlay'), true), ['.agents', 'openspec']);
  assert.deepEqual(ls(join(out, 'overlay', 'openspec'), true), ['schemas']);
  assert.deepEqual(ls(join(out, 'overlay', 'openspec', 'schemas')), ['lets-minimal', 'lets-standard']);
  assert.deepEqual(ls(join(out, 'overlay', '.agents', 'skills')), ['lets-build', 'lets-verify-contracts', 'openspec-propose']);
});

test("the release's schema is a full copy of the source's", async (t) => {
  const out = join(tempDir(t), 'out');
  await built(out, 'lets-standard', 'lets-verify-contracts');
  assert.equal(tree(join(out, 'overlay', 'openspec', 'schemas', 'lets-standard')), tree(join(repo, 'schemas', 'lets-standard')));
});

test('the release holds the rules sync keeps in AGENTS.md, and creates no AGENTS.md', async (t) => {
  const out = join(tempDir(t), 'out');
  await built(out, 'lets-standard', 'lets-verify-contracts');
  same(join(repo, 'overlays', 'AGENTS.md'), join(out, 'fragments', 'AGENTS.md'));
  assert.ok(!existsSync(join(out, 'init', 'AGENTS.md')), 'the release creates an AGENTS.md');
});

test("the release's config is the first schema's own, and names it", async (t) => {
  const out = join(tempDir(t), 'out');
  await built(out, 'lets-standard,lets-minimal', 'lets-verify-contracts');
  same(join(repo, 'overlays', 'openspec', 'config.d', 'lets-standard.yaml'), join(out, 'init', 'openspec', 'config.yaml'));
  rmSync(out, { recursive: true });
  await built(out, 'lets-minimal', 'lets-verify-contracts');
  assert.equal(parse(readFileSync(join(out, 'init', 'openspec', 'config.yaml'), 'utf8')).schema, 'lets-minimal');
  assert.ok(!existsSync(join(out, 'init', 'openspec', 'config.d')), 'the release ships config.d');
});

test("no release's config holds operations", async (t) => {
  const out = join(tempDir(t), 'out');
  for (const schema of ['lets-standard', 'lets-minimal']) {
    rmSync(out, { recursive: true, force: true });
    await built(out, schema, 'lets-verify-contracts');
    const config: unknown = parse(readFileSync(join(out, 'init', 'openspec', 'config.yaml'), 'utf8'));
    assert.ok(!(config instanceof Object && Object.hasOwn(config, 'operations')), `the ${schema} release's config holds operations`);
  }
});

test('the build works from a read-only source, as in the Nix store', async (t) => {
  const tmp = tempDir(t);
  const out = join(tmp, 'out');
  const source = copySource(join(tmp, 'source'));
  makeReadOnly(source);
  const result = await buildFrom(source, generatedSkills(join(tmp, 'generated')), out, 'lets-standard', 'lets-shape');
  assert.equal(result.code, 0, result.output);
  assert.ok(statSync(join(out, 'overlay', '.agents', 'skills', 'lets-shape', 'SKILL.md')).isFile());
});

test('the build works when there are no generated skills', async (t) => {
  const tmp = tempDir(t);
  const out = join(tmp, 'out');
  mkdirSync(join(tmp, 'generated'));
  const result = await buildFrom(repo, join(tmp, 'generated'), out, 'lets-standard', 'lets-verify-contracts');
  assert.equal(result.code, 0, result.output);
  assert.deepEqual(ls(join(out, 'overlay', '.agents', 'skills')), ['lets-verify-contracts']);
});

test("the build fails when the generated skills' folder is missing", async (t) => {
  const tmp = tempDir(t);
  const result = await buildFrom(repo, join(tmp, 'nosuch'), join(tmp, 'out'), 'lets-standard', 'lets-verify-contracts');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes(`there is no folder of generated skills at ${join(tmp, 'nosuch')}`), result.output);
});

test('the build fails with too few arguments, and prints its usage', async (t) => {
  const tmp = tempDir(t);
  const result = await run(process.execPath, [BUILD, repo, tmp, join(tmp, 'out')], { cwd: repo });
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('usage: build-release.mjs <source> <generated> <out> <schemas> [skill...]'), result.output);
});

test('the build fails on an unknown schema in the list', async (t) => {
  const result = await build(join(tempDir(t), 'out'), 'lets-standard,nosuch', 'lets-verify-contracts');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('there is no schema named nosuch'), result.output);
});

test('the build fails on a schema with no config of its own', async (t) => {
  const tmp = tempDir(t);
  const source = copySource(join(tmp, 'source'));
  rmSync(join(source, 'overlays', 'openspec', 'config.d', 'lets-minimal.yaml'));
  const result = await buildFrom(source, generatedSkills(join(tmp, 'generated')), join(tmp, 'out'), 'lets-minimal', 'lets-verify-contracts');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('there is no config for lets-minimal in overlays/openspec/config.d/'), result.output);
});

test('the build fails on an unknown skill', async (t) => {
  const result = await build(join(tempDir(t), 'out'), 'lets-standard', 'lets-verify-contracts', 'nosuch');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('there is no skill named nosuch'), result.output);
});

test('the build fails on a skill listed twice', async (t) => {
  const result = await build(join(tempDir(t), 'out'), 'lets-standard', 'lets-verify-contracts', 'lets-verify-contracts');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('lets-verify-contracts is listed twice'), result.output);
});

test("the build fails when an authored skill has a generated skill's name", async (t) => {
  const tmp = tempDir(t);
  const generated = generatedSkills(join(tmp, 'generated'));
  mkdirSync(join(generated, 'lets-verify-contracts'));
  const result = await buildFrom(repo, generated, join(tmp, 'out'), 'lets-standard', 'lets-verify-contracts');
  assert.equal(result.code, 1, result.output);
  assert.ok(result.output.includes('lets-verify-contracts has the same name as a generated OpenSpec skill'), result.output);
});

// The tarball's bin/lets is this bundle. A mise project runs it with its own
// node, from anywhere, with no node_modules beside it.
test('the lets bundle is one executable script that runs with no node_modules', async (t) => {
  const tmp = tempDir(t);
  const bundled = await run(process.execPath, ['build.mjs', join(tmp, 'build')], { cwd: join(repo, 'lets') });
  assert.equal(bundled.code, 0, bundled.output);
  const bin = join(tmp, 'bin', 'lets');
  mkdirSync(join(tmp, 'bin'));
  // As `cp -p`, which keeps the mode.
  copyFileSync(join(tmp, 'build', 'lets'), bin);
  chmodSync(bin, statSync(join(tmp, 'build', 'lets')).mode);
  accessSync(bin, constants.X_OK);
  const text = readFileSync(bin, 'utf8');
  assert.equal(text.split('\n')[0], '#!/usr/bin/env node');
  assert.ok(text.includes('lets: needs Node 26'), 'the bundle has no Node version check');
  assert.deepEqual(ls(join(tmp, 'bin'), true), ['lets']);
  mkdirSync(join(tmp, 'empty'));
  const result = await run(process.execPath, [bin, '--version'], { cwd: join(tmp, 'empty') });
  assert.equal(result.code, 0, result.output);
  assert.equal(result.output.replace(/\n+$/, ''), '0.0.0-dev');
});

test('each flow ships the authored domain-language reference', async (t) => {
  const out = join(tempDir(t), 'out');
  const { flows } = JSON.parse(readFileSync(join(repo, 'flows.json'), 'utf8')) as { flows: Record<string, { schemas: string[]; skills: string[] }> };
  for (const flow of ['standard', 'minimal']) {
    const release = join(out, flow);
    await built(release, flows[flow].schemas.join(','), ...flows[flow].skills);
    same(join(repo, 'skills', 'lets-shape', 'references', 'domain-language.md'), join(release, 'overlay', '.agents', 'skills', 'lets-shape', 'references', 'domain-language.md'));
    assert.ok(!existsSync(join(release, 'init', 'openspec', 'glossary.md')), `the ${flow} release creates a glossary`);
    assert.ok(!existsSync(join(release, 'overlay', 'openspec', 'glossary.md')), `the ${flow} release ships a glossary`);
  }
});
