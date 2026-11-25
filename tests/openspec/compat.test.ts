// Each schema, read by the real OpenSpec CLI as a project links it in.
// lets-build trusts what the CLI reports about a change, so these tests pin
// that for every schema. Each test runs once for each schema, and every
// failure message names the schema. They run whichever openspec is on
// PATH, and check no version.
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { before, type TestContext, test } from 'node:test';
import { parse } from 'yaml';
import { type ProgramResult, repo, run, tempDir, tree } from '../support/lets.ts';

const SCHEMAS = ['lets-standard', 'lets-minimal'];
const MISSING = 'the OpenSpec CLI is missing from PATH: install it with mise, or run inside nix develop';
const STANDARD_CONFIG = join(repo, 'overlays', 'openspec', 'config.d', 'lets-standard.yaml');
const GLOSSARIES = ['openspec/glossary.md', 'openspec/specs/identity/glossary.md', 'openspec/specs/identity/user-auth/glossary.md'];

const GREETING_SPEC = `## ADDED Requirements

### Requirement: Greet by name
The app SHALL greet a known user by name when it opens.

#### Scenario: Known user opens the app
- **WHEN** a known user named Ada opens the app
- **THEN** the app shows "Hello, Ada"
`;

const RETIRE_SPEC = `## REMOVED Requirements

### Requirement: Respond to a request
**Reason**: This capability is retired.
**Migration**: Use billing authentication instead.

### Requirement: Reject unauthenticated requests
**Reason**: This capability is retired.
**Migration**: Use billing authentication instead.
`;

interface Artifact {
  id: string;
  generates: string;
  requires?: string[];
}

/** A project linked to one schema, holding one change named demo. */
interface Demo {
  schema: string;
  /** The project's root folder. */
  dir: string;
  /** The change's folder. */
  change: string;
}

// A skip would let pnpm test pass without the schema checks, so a missing
// CLI fails every test in the file.
before(async () => {
  const result = await openspec(['--version'], repo).catch(() => undefined);
  if (result === undefined) throw new Error(MISSING);
  // A broken mise shim is on PATH but exits non-zero.
  if (result.code !== 0) throw new Error(`${MISSING}\nopenspec --version exited ${result.code}:\n${result.output}`);
});

function openspec(args: string[], cwd: string): Promise<ProgramResult> {
  return run('openspec', args, { cwd, env: { OPENSPEC_TELEMETRY: '0', OPENSPEC_NO_UPDATE_CHECK: '1' } });
}

/** Runs a setup step, and throws with its output unless it exits 0. */
async function setup(demo: Demo, args: string[]): Promise<ProgramResult> {
  const result = await openspec(args, demo.dir);
  if (result.code !== 0) throw new Error(`${demo.schema}: openspec ${args.join(' ')} exited ${result.code}:\n${result.output}`);
  return result;
}

/** Runs a setup step that prints JSON, and returns it parsed. Throws when it fails or prints no JSON. */
async function setupJson(demo: Demo, args: string[]): Promise<any> {
  const result = await setup(demo, args);
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(`${demo.schema}: openspec ${args.join(' ')} printed no JSON:\n${result.output}`);
  }
}

/** A project in a new temporary folder, linked to `schema`, with one change named demo. */
async function newChange(t: TestContext, schema: string): Promise<Demo> {
  const dir = join(tempDir(t), schema);
  mkdirSync(join(dir, 'openspec', 'schemas'), { recursive: true });
  symlinkSync(join(repo, 'schemas', schema), join(dir, 'openspec', 'schemas', schema));
  writeFileSync(join(dir, 'openspec', 'config.yaml'), `schema: ${schema}\n`);
  const demo = { schema, dir, change: join(dir, 'openspec', 'changes', 'demo') };
  await setup(demo, ['new', 'change', 'demo']);
  return demo;
}

/** As `newChange`, for the standard flow, with the flow's own config, as lets sync creates it. */
async function newStandardChange(t: TestContext): Promise<Demo> {
  const demo = await newChange(t, 'lets-standard');
  copyFileSync(STANDARD_CONFIG, join(demo.dir, 'openspec', 'config.yaml'));
  return demo;
}

/** The schema's artifacts, in the order it lists them. */
function artifacts(schema: string): Artifact[] {
  return parse(readFileSync(join(repo, 'schemas', schema, 'schema.yaml'), 'utf8')).artifacts;
}

function write(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function read(demo: Demo, path: string): string {
  return readFileSync(join(demo.dir, path), 'utf8');
}

/**
 * Writes the file the artifact generates, from its template, with the
 * brainstorm confirmed and the tasks still to do.
 */
function writeArtifact(demo: Demo, id: string) {
  const artifact = artifacts(demo.schema).find((a) => a.id === id);
  if (artifact === undefined) throw new Error(`${demo.schema} has no artifact ${id}`);
  const { generates } = artifact;
  if (generates.startsWith('specs/')) {
    write(join(demo.change, 'specs', 'greeting', 'spec.md'), GREETING_SPEC);
  } else if (generates === 'tasks.md') {
    write(join(demo.change, 'tasks.md'), '## 1. Greeting\n\n- [ ] 1.1 Greet a known user by name\n');
  } else {
    const template = readFileSync(join(repo, 'schemas', demo.schema, 'templates', generates), 'utf8');
    write(join(demo.change, generates), template.replace(/^Confirmed by user: no$/gm, 'Confirmed by user: yes'));
  }
}

/** Ticks the first box on each line of the change's tasks.md, as `sed 's/- \[ \]/- [x]/'` does. */
function tickTasks(demo: Demo) {
  const path = join(demo.change, 'tasks.md');
  const text = readFileSync(path, 'utf8');
  writeFileSync(path, text.split('\n').map((line) => line.replace('- [ ]', '- [x]')).join('\n'));
}

function finishChange(demo: Demo) {
  for (const { id } of artifacts(demo.schema)) writeArtifact(demo, id);
  tickTasks(demo);
}

/** Completes the other artifacts without introducing an unrelated greeting delta. */
function finishWithoutSpecs(demo: Demo) {
  for (const { id } of artifacts(demo.schema)) if (id !== 'specs') writeArtifact(demo, id);
  tickTasks(demo);
}

/**
 * Each artifact's status, worked out from the schema's requires: done once
 * written, ready once all it requires is written, and blocked before.
 */
function expectedStatuses(schema: string, written: string[]): string {
  return artifacts(schema)
    .map((a) => `${a.id} ${written.includes(a.id) ? 'done' : (a.requires ?? []).every((r) => written.includes(r)) ? 'ready' : 'blocked'}`)
    .join('\n');
}

async function applyState(demo: Demo): Promise<string> {
  return (await setupJson(demo, ['instructions', 'apply', '--change', 'demo', '--json'])).state;
}

// Specs use distinct responses so a merge into the wrong capability is visible.
function writeMainSpec(demo: Demo, capability: string, response: string) {
  write(join(demo.dir, 'openspec', 'specs', capability, 'spec.md'), `# ${capability} Specification

## Purpose

Describe the observable request handling behavior of this service for its callers.

## Requirements

### Requirement: Respond to a request
The service SHALL return "${response}" for an authenticated request.

#### Scenario: Authenticated request
- **WHEN** an authenticated caller sends a request
- **THEN** the service returns "${response}"

### Requirement: Reject unauthenticated requests
The service SHALL reject unauthenticated requests.

#### Scenario: Unauthenticated request
- **WHEN** an unauthenticated caller sends a request
- **THEN** the service responds with status 401
`);
}

function writeModifiedSpec(demo: Demo, capability: string, response: string) {
  write(join(demo.change, 'specs', capability, 'spec.md'), `## MODIFIED Requirements

### Requirement: Respond to a request
The service SHALL return "${response}" for an authenticated request.

#### Scenario: Authenticated request
- **WHEN** an authenticated caller sends a request
- **THEN** the service returns "${response}"
`);
}

async function newGroupedChange(t: TestContext, schema: string): Promise<Demo> {
  const demo = await newChange(t, schema);
  finishWithoutSpecs(demo);
  writeMainSpec(demo, 'identity/user-auth', 'identity-old');
  writeMainSpec(demo, 'billing/user-auth', 'billing-old');
  writeMainSpec(demo, 'shared/auth', 'shared-old');
  return demo;
}

/** The spec IDs `openspec list --specs` reports, sorted. */
async function specIds(demo: Demo): Promise<string[]> {
  const listed = await setupJson(demo, ['list', '--specs', '--json']);
  return (listed.specs as { id: string }[]).map((spec) => spec.id).sort();
}

/** Runs a command whose exit code is a check, and fails the test unless it exits 0. */
async function succeeds(demo: Demo, args: string[]): Promise<ProgramResult> {
  const result = await openspec(args, demo.dir);
  assert.equal(result.code, 0, `${demo.schema}: ${result.output}`);
  return result;
}

function assertMerged(demo: Demo, capabilities: string[]) {
  for (const capability of capabilities) {
    const text = read(demo, `openspec/specs/${capability}/spec.md`);
    assert.ok(text.includes('The service SHALL reject unauthenticated requests.'), `${demo.schema}: ${capability} lost a requirement`);
    assert.ok(!text.includes('-old"'), `${demo.schema}: ${capability} still holds its old response`);
  }
}

// Project vocabulary is deliberately outside change deltas. Discovery and
// archive must leave these bytes to the author, including after retirement.
function seedGlossaries(demo: Demo) {
  for (const path of GLOSSARIES) write(join(demo.dir, path), `Project definition at ${path}\n`);
}

function assertGlossaries(demo: Demo) {
  for (const path of GLOSSARIES) {
    assert.equal(read(demo, path).replace(/\n+$/, ''), `Project definition at ${path}`, `${demo.schema}: ${path} changed`);
  }
}

/** jq's `length`: 0 for null, the count of an array's items or an object's keys, a string's length. */
function jqLength(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (Array.isArray(value) || typeof value === 'string') return value.length;
  if (typeof value === 'object') return Object.keys(value).length;
  return Math.abs(Number(value));
}

test('each schema is valid', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newChange(t, schema);
    await succeeds(demo, ['schema', 'validate', schema]);
  }
});

test('each artifact becomes ready exactly when all it requires is written', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newChange(t, schema);
    const written: string[] = [];
    for (const id of ['', ...artifacts(schema).map((a) => a.id)]) {
      if (id !== '') {
        writeArtifact(demo, id);
        written.push(id);
      }
      const expected = expectedStatuses(schema, written);
      const status = await setupJson(demo, ['status', '--change', 'demo', '--json']);
      const actual = (status.artifacts as { id: string; status: string }[]).map((a) => `${a.id} ${a.status}`).join('\n');
      assert.equal(actual, expected, `${schema}, after writing: ${written.join(' ') || 'nothing'}\nexpected:\n${expected}\ngot:\n${actual}`);
    }
  }
});

// lets-build reads these three states, and stops on any other.
test('apply reports blocked, then ready, then all_done as a change moves', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newChange(t, schema);
    assert.equal(await applyState(demo), 'blocked', `${schema}: not blocked`);
    for (const { id } of artifacts(schema)) writeArtifact(demo, id);
    assert.equal(await applyState(demo), 'ready', `${schema}: not ready`);
    tickTasks(demo);
    assert.equal(await applyState(demo), 'all_done', `${schema}: not all_done`);
  }
});

test('a finished change passes strict validation, and archives into a main spec', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newChange(t, schema);
    finishChange(demo);
    await succeeds(demo, ['validate', 'demo', '--strict']);
    await succeeds(demo, ['archive', 'demo', '--yes']);
    assert.ok(read(demo, 'openspec/specs/greeting/spec.md').includes('Requirement: Greet by name'), `${schema}: the greeting spec is not merged`);
    assert.ok(!existsSync(demo.change), `${schema}: the change is still there`);
  }
});

test('archive updates existing flat capabilities at their original paths', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newChange(t, schema);
    finishWithoutSpecs(demo);
    writeMainSpec(demo, 'backend-api', 'backend-old');
    writeMainSpec(demo, 'frontend-checkout', 'frontend-old');
    writeMainSpec(demo, 'shared-auth', 'shared-old');
    const sharedBefore = readFileSync(join(demo.dir, 'openspec/specs/shared-auth/spec.md'));
    writeModifiedSpec(demo, 'backend-api', 'backend-new');
    writeModifiedSpec(demo, 'frontend-checkout', 'frontend-new');

    await succeeds(demo, ['validate', 'demo', '--strict']);
    await succeeds(demo, ['archive', 'demo', '--yes']);

    assert.ok(read(demo, 'openspec/specs/backend-api/spec.md').includes('The service SHALL return "backend-new"'), `${schema}: backend-api not updated`);
    assert.ok(read(demo, 'openspec/specs/frontend-checkout/spec.md').includes('The service SHALL return "frontend-new"'), `${schema}: frontend-checkout not updated`);
    assertMerged(demo, ['backend-api', 'frontend-checkout']);
    assert.ok(readFileSync(join(demo.dir, 'openspec/specs/shared-auth/spec.md')).equals(sharedBefore), `${schema}: shared-auth changed`);
    assert.ok(!existsSync(demo.change), `${schema}: the change is still there`);
  }
});

test('grouped capabilities keep distinct full IDs', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    assert.deepEqual(await specIds(demo), ['billing/user-auth', 'identity/user-auth', 'shared/auth'], `${schema}: wrong spec IDs`);
    const identity = await succeeds(demo, ['show', 'identity/user-auth', '--type', 'spec']);
    assert.ok(identity.output.includes('return "identity-old"'), `${schema}: ${identity.output}`);
    const billing = await succeeds(demo, ['show', 'billing/user-auth', '--type', 'spec']);
    assert.ok(billing.output.includes('return "billing-old"'), `${schema}: ${billing.output}`);
  }
});

test('each schema recognizes grouped delta files as completed specs', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    writeModifiedSpec(demo, 'identity/user-auth', 'identity-new');
    writeModifiedSpec(demo, 'billing/user-auth', 'billing-new');
    const status = await setupJson(demo, ['status', '--change', 'demo', '--json']);
    const specs = (status.artifacts as { id: string; status: string }[]).find((a) => a.id === 'specs');
    assert.equal(specs?.status, 'done', `${schema}: specs is not done`);
    const expected = [join(demo.change, 'specs/billing/user-auth/spec.md'), join(demo.change, 'specs/identity/user-auth/spec.md')];
    const actual = [...(status.artifactPaths.specs.existingOutputPaths as string[])].sort();
    assert.deepEqual(actual, expected, `${schema}: ${actual.join('\n')}`);
  }
});

test('archive keeps grouped capabilities at their full paths', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    const sharedBefore = readFileSync(join(demo.dir, 'openspec/specs/shared/auth/spec.md'));
    writeModifiedSpec(demo, 'identity/user-auth', 'identity-new');
    writeModifiedSpec(demo, 'billing/user-auth', 'billing-new');
    await succeeds(demo, ['validate', 'demo', '--strict']);
    await succeeds(demo, ['archive', 'demo', '--yes']);

    assert.ok(read(demo, 'openspec/specs/identity/user-auth/spec.md').includes('The service SHALL return "identity-new"'), `${schema}: identity/user-auth not updated`);
    assert.ok(read(demo, 'openspec/specs/billing/user-auth/spec.md').includes('The service SHALL return "billing-new"'), `${schema}: billing/user-auth not updated`);
    assertMerged(demo, ['identity/user-auth', 'billing/user-auth']);
    assert.ok(readFileSync(join(demo.dir, 'openspec/specs/shared/auth/spec.md')).equals(sharedBefore), `${schema}: shared/auth changed`);
    assert.ok(!existsSync(join(demo.dir, 'openspec/specs/user-auth')), `${schema}: archive made a flat user-auth`);
    assert.ok(!existsSync(demo.change), `${schema}: the change is still there`);
  }
});

test('archive refuses a shortened existing capability path without changing main specs', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    const before = tree(join(demo.dir, 'openspec', 'specs'));
    // A valid delta sorts before the bad path, exposing a partial merge too.
    writeModifiedSpec(demo, 'billing/user-auth', 'billing-new');
    writeModifiedSpec(demo, 'user-auth', 'identity-new');
    await succeeds(demo, ['validate', 'demo', '--strict']);
    // Archive can report refusal without a nonzero exit: check its outcome.
    const archive = await openspec(['archive', 'demo', '--yes'], demo.dir);
    assert.ok(archive.output.includes('target spec does not exist'), `${schema}: ${archive.output}`);
    assert.ok(archive.output.includes('No files were changed'), `${schema}: ${archive.output}`);
    assert.equal(tree(join(demo.dir, 'openspec', 'specs')), before, `${schema}: the main specs changed`);
    assert.ok(statSync(demo.change).isDirectory(), `${schema}: the change is gone`);
  }
});

// lets-build follows the archive guidance the CLI returns. The standard
// flow's own config, as lets sync creates it in a project, adds none.

test("archive returns no guidance from the standard flow's config", async (t) => {
  const demo = await newStandardChange(t);
  const archive = await setupJson(demo, ['instructions', 'archive', '--change', 'demo', '--json']);
  assert.equal(jqLength(archive.operationGuidance), 0, `${demo.schema}: ${JSON.stringify(archive.operationGuidance)}`);
});

test("the standard flow's config names no operation the CLI rejects", async (t) => {
  const demo = await newStandardChange(t);
  const apply = await succeeds(demo, ['instructions', 'apply', '--change', 'demo', '--json']);
  assert.ok(!apply.stderr.includes('Unknown operation ID'), `${demo.schema}: ${apply.stderr}`);
});

test('glossaries do not change grouped capability discovery', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    seedGlossaries(demo);
    assert.deepEqual(await specIds(demo), ['billing/user-auth', 'identity/user-auth', 'shared/auth'], `${schema}: wrong spec IDs`);
    assertGlossaries(demo);
  }
});

test('grouped delta archive preserves project glossary bytes', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    seedGlossaries(demo);
    writeModifiedSpec(demo, 'identity/user-auth', 'identity-new');
    await succeeds(demo, ['archive', 'demo', '--yes']);
    assert.ok(read(demo, 'openspec/specs/identity/user-auth/spec.md').includes('return "identity-new"'), `${schema}: identity/user-auth not updated`);
    assertGlossaries(demo);
  }
});

test('retiring a capability leaves glossary cleanup to its author', async (t) => {
  for (const schema of SCHEMAS) {
    const demo = await newGroupedChange(t, schema);
    seedGlossaries(demo);
    writeFileSync(join(demo.change, '.openspec.yaml'), `schema: ${schema}\nretire_capabilities: true\n`);
    write(join(demo.change, 'specs', 'identity', 'user-auth', 'spec.md'), RETIRE_SPEC);
    await succeeds(demo, ['archive', 'demo', '--yes']);
    assert.ok(!existsSync(join(demo.dir, 'openspec/specs/identity/user-auth/spec.md')), `${schema}: the retired spec is still there`);
    assertGlossaries(demo);
  }
});
