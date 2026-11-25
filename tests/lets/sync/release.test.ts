// compareVersions orders versions by semver precedence. It stays a unit
// test: a pure function with many branches, each of which would otherwise
// need a copy of the lets package and a whole sync run.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareVersions } from '../../../lets/src/sync/release.ts';

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
