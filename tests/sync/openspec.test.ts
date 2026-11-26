// lets sync needs the OpenSpec CLI that the project installs (ADR-027). It
// warns when no CLI is on PATH, or when the CLI is older than the version
// the package's release.json records; --check fails only on a missing one.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type TestContext, test } from 'node:test';
import { letsPackage, pathWith, standIn } from '../support/lets.ts';
import { project, useRelease } from './project.ts';

const release = useRelease();

const MISSING = 'the OpenSpec CLI is not on PATH, and the openspec-* skills need it. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".';
const CHECK_MISSING = 'lets-spec: the OpenSpec CLI is not on PATH. Install it, for example with mise: "npm:@fission-ai/openspec" = "latest".';
const OLDER = "- the OpenSpec CLI on PATH is 1.1.0, older than 1.2.3, which this release's openspec-* skills were generated from. Upgrade it to 1.2.3 or later.";

// The release.json a published package holds.
const RELEASE_JSON = JSON.stringify({ version: '0.1.0', openspec: '1.2.3', commit: 'abc' });

const ignored = { LETS_SPEC_SKILLS: 'ignored' };

// A PATH with git and no OpenSpec CLI, whatever this machine has installed.
const noCli = (t: TestContext) => ({ PATH: pathWith(t, ['git']) });

// Replaces the project's stand-in openspec with one that prints `version`.
const cliPrints = (bin: string, version: string) => standIn(bin, 'openspec', [{ args: ['--version'], stdout: version }]);

test('sync says what to install when no OpenSpec CLI is on PATH', async (t) => {
  const p = project(t);
  const { code, stderr, output } = await p.sync([], noCli(t));
  assert.equal(code, 0, output);
  assert.equal(stderr, `lets-spec: 1 problem(s) to fix:\n- ${MISSING}\n`);
});

test('sync says only what to install when no OpenSpec CLI is on PATH and the package has a release.json', async (t) => {
  const p = project(t);
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  const { code, stderr, output } = await p.sync([], noCli(t), { lets });
  assert.equal(code, 0, output);
  assert.equal(stderr, `lets-spec: 1 problem(s) to fix:\n- ${MISSING}\n`);
});

test('sync counts an OpenSpec CLI that exits non-zero as missing', async (t) => {
  const p = project(t);
  const cli = standIn(p.bin, 'openspec', [{ args: ['--version'], code: 1 }]);
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  const { code, stderr, output } = await p.sync([], {}, { lets });
  assert.equal(code, 0, output);
  assert.equal(stderr, `lets-spec: 1 problem(s) to fix:\n- ${MISSING}\n`);
  assert.deepEqual(cli.calls(), [['--version']]);
});

test("sync asks the OpenSpec CLI its version once, in the project's root, when run from a folder inside it", async (t) => {
  const p = project(t);
  const cli = cliPrints(p.bin, '1.3.0\n');
  const deep = join(p.path, 'src/deep');
  mkdirSync(deep, { recursive: true });
  const { code, output } = await p.sync([], {}, { cwd: deep });
  assert.equal(code, 0, output);
  assert.deepEqual(cli.calls(), [['--version']]);
  assert.deepEqual(cli.folders(), [p.path]);
});

test('sync says nothing about an OpenSpec CLI that prints no version', async (t) => {
  const p = project(t);
  const cli = cliPrints(p.bin, '');
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  const { code, stderr, output } = await p.sync([], {}, { lets });
  assert.equal(code, 0, output);
  assert.equal(stderr, '');
  assert.deepEqual(cli.calls(), [['--version']]);
});

test('--check fails when no OpenSpec CLI is on PATH, in committed mode', async (t) => {
  const p = project(t);
  await p.init();
  const { code, stderr, output } = await p.sync(['--check'], noCli(t));
  assert.equal(code, 1, output);
  assert.equal(stderr, `${CHECK_MISSING}\n`);
});

test('--check fails when no OpenSpec CLI is on PATH, in ignored mode', async (t) => {
  const p = project(t);
  await p.init(ignored);
  const { code, stderr, output } = await p.sync(['--check'], { ...ignored, ...noCli(t) });
  assert.equal(code, 1, output);
  assert.equal(stderr, `${CHECK_MISSING}\n`);
});

test("sync warns about a CLI older than the package's release.json, with the package's own release", async (t) => {
  const p = project(t);
  cliPrints(p.bin, '1.1.0\n');
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON, releases: { standard: release() } });
  const { code, stderr, output } = await p.sync([], { WORKFLOW_RELEASE: undefined }, { lets });
  assert.equal(code, 0, output);
  assert.ok(stderr.startsWith('lets-spec: 1 problem(s) to fix:\n'), output);
  assert.ok(stderr.includes(`${OLDER}\n`), output);
});

test("sync warns about a CLI older than the package's release.json, with WORKFLOW_RELEASE set", async (t) => {
  const p = project(t);
  cliPrints(p.bin, '1.1.0\n');
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  const { code, stderr, output } = await p.sync([], {}, { lets });
  assert.equal(code, 0, output);
  assert.equal(stderr, `lets-spec: 1 problem(s) to fix:\n${OLDER}\n`);
});

test("--check passes with a CLI older than the package's release.json", async (t) => {
  const p = project(t);
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  await p.init();
  const cli = cliPrints(p.bin, '1.1.0\n');
  const { code, output } = await p.sync(['--check'], {}, { lets });
  assert.equal(code, 0, output);
  assert.equal(output, '');
  assert.deepEqual(cli.calls(), [['--version']]);
});

test('sync gives no version warning when release.json is not JSON', async (t) => {
  const p = project(t);
  const cli = cliPrints(p.bin, '1.1.0\n');
  const lets = letsPackage(t, { releaseJson: 'oops' });
  const { code, stderr, output } = await p.sync([], {}, { lets });
  assert.equal(code, 0, output);
  assert.equal(stderr, '');
  assert.deepEqual(cli.calls(), [['--version']]);
});

test("sync gives no version warning for a CLI the same as or newer than the package's release.json", async (t) => {
  const p = project(t);
  const lets = letsPackage(t, { releaseJson: RELEASE_JSON });
  for (const version of ['1.2.3', '2.1.0']) {
    const cli = cliPrints(p.bin, `${version}\n`);
    const { code, stderr, output } = await p.sync([], {}, { lets });
    assert.equal(code, 0, output);
    assert.equal(stderr, '', `CLI ${version}`);
    assert.deepEqual(cli.calls(), [['--version']], `CLI ${version}`);
  }
});
