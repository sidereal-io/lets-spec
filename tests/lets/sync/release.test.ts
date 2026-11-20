import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UsageError } from '../../../lets/src/sync/errors.ts';
import { compareVersions, findRelease, openspecVersionWarning } from '../../../lets/src/sync/release.ts';
import { fakeIo } from './fixtures/fake-io.ts';

const RELEASE = '/pkg/releases/standard';
const RELEASE_JSON = '/pkg/release.json';
const info = (openspec: string) => JSON.stringify({ version: '0.1.0', openspec, commit: 'abc' });

test('WORKFLOW_RELEASE wins over the flow', () => {
  const env = { WORKFLOW_RELEASE: '/elsewhere', LETS_SPEC_FLOW: 'minimal' };
  assert.equal(findRelease(env, '/pkg', fakeIo()), '/elsewhere');
});

test('the default flow is standard under packageRoot/releases', () => {
  const io = fakeIo({ dirs: [RELEASE] });
  assert.equal(findRelease({}, '/pkg', io), RELEASE);
});

test('LETS_SPEC_FLOW picks the flow', () => {
  const io = fakeIo({ dirs: ['/pkg/releases/minimal'] });
  const env = { LETS_SPEC_FLOW: 'minimal' };
  assert.equal(findRelease(env, '/pkg', io), '/pkg/releases/minimal');
});

test('a missing flow names the variable', () => {
  const env = { LETS_SPEC_FLOW: 'jira' };
  assert.throws(() => findRelease(env, '/pkg', fakeIo()), (error) => {
    assert.ok(error instanceof UsageError);
    assert.equal(error.message, "there is no release for flow 'jira' at /pkg/releases/jira. Set LETS_SPEC_FLOW to a flow this release ships, or WORKFLOW_RELEASE to a release folder.");
    return true;
  });
});

test('no release.json means no version warning', async () => {
  const io = fakeIo({ openspec: '1.2.3\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }), null);
});

test('a missing openspec command means no version warning', async () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: info('1.2.3') } });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }), null);
});

test('output that is not a version means no version warning', async () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: info('1.2.3') }, openspec: 'command not found: openspec\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }), null);
});

test('a release.json that is not JSON means no version warning', async () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: 'oops' }, openspec: '1.2.3\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }), null);
});

test('the same version means no version warning', async () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: info('1.2.3') }, openspec: '1.2.3\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }), null);
});

test('a different version is warned about', async () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: info('1.2.3') }, openspec: 'openspec 1.4.0\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release: RELEASE, io }),
    "the OpenSpec CLI on PATH is 1.4.0, but this release's openspec-* skills were generated from 1.2.3. Pin the CLI to 1.2.3.");
});

test('the warning reads the package release.json when the release lives elsewhere', async () => {
  const release = '/nix/store/abc-lets-spec-release-standard';
  const io = fakeIo({ files: { [RELEASE_JSON]: info('1.2.3') }, openspec: '1.4.0\n' });
  assert.equal(await openspecVersionWarning({ packageRoot: '/pkg', release, io }),
    "the OpenSpec CLI on PATH is 1.4.0, but this release's openspec-* skills were generated from 1.2.3. Pin the CLI to 1.2.3.");
});

test('versions compare major, minor and patch as numbers', () => {
  assert.equal(compareVersions('1.2.9', '1.2.10'), -1);
  assert.equal(compareVersions('1.10.0', '1.9.9'), 1);
  assert.equal(compareVersions('2.0.0', '10.0.0'), -1);
});

test('a prerelease is older than its release', () => {
  assert.equal(compareVersions('1.2.3-beta.1', '1.2.3'), -1);
  assert.equal(compareVersions('1.2.3', '1.2.3-beta.1'), 1);
});

test('prerelease identifiers compare by semver precedence', () => {
  // The example chain from the semver specification, item 11.
  const chain = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0'];
  for (let i = 0; i < chain.length - 1; i++) assert.equal(compareVersions(chain[i], chain[i + 1]), -1, `${chain[i]} < ${chain[i + 1]}`);
});

test('build metadata is ignored when versions compare', () => {
  assert.equal(compareVersions('1.2.3+nix', '1.2.3'), 0);
  assert.equal(compareVersions('1.2.3-rc.1+a', '1.2.3-rc.1+b'), 0);
});
