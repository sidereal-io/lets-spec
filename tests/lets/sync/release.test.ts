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

const older = (found: string, pinned: string) =>
  `the OpenSpec CLI on PATH is ${found}, older than ${pinned}, which this release's openspec-* skills were generated from. Upgrade it to ${pinned} or later.`;
const withPin = (openspec: string) => fakeIo({ files: { [RELEASE_JSON]: info(openspec) } });

test('no release.json means no version warning', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '0.0.1', io: fakeIo() }), null);
});

test('a release.json that is not JSON means no version warning', () => {
  const io = fakeIo({ files: { [RELEASE_JSON]: 'oops' } });
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '0.0.1', io }), null);
});

test('an unknown CLI version means no version warning', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: null, io: withPin('1.2.3') }), null);
});

test('the same version means no version warning', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '1.2.3', io: withPin('1.2.3') }), null);
});

test('the same version with build metadata means no version warning', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '1.2.3+nix', io: withPin('1.2.3') }), null);
});

test('a newer CLI means no version warning', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '2.1.0', io: withPin('1.2.3') }), null);
});

test('an older CLI is warned about', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '1.1.0', io: withPin('1.2.3') }), older('1.1.0', '1.2.3'));
});

test('an older patch, compared as a number, is warned about', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '1.2.9', io: withPin('1.2.10') }), older('1.2.9', '1.2.10'));
});

test('a prerelease of the recorded version is warned about', () => {
  assert.equal(openspecVersionWarning({ packageRoot: '/pkg', version: '1.2.3-beta.1', io: withPin('1.2.3') }), older('1.2.3-beta.1', '1.2.3'));
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
