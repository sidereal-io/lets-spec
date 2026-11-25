// lets backlog through the real entry, with a fake gh on PATH that answers
// the Project lookup and the title search, and logs its arguments.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ENTRY = fileURLToPath(new URL('../../../lets/bin/lets', import.meta.url));

function withFakeGh() {
  const dir = mkdtempSync(join(tmpdir(), 'lets-backlog-cli-'));
  const log = join(dir, 'gh.log');
  writeFileSync(join(dir, 'gh'), `#!/bin/sh
printf '%s\\n' "$*" >> "${log}"
case "$1 $2" in
  "api graphql") echo '{"repo":"acme/app","projects":[{"number":7,"title":"Backlog","url":"u","owner":"acme"}]}' ;;
  "issue list") echo '[]' ;;
  *) echo "unexpected: $*" >&2; exit 1 ;;
esac
`);
  chmodSync(join(dir, 'gh'), 0o755);
  return { dir, calls: () => readFileSync(log, 'utf8').trim().split('\n') };
}

function lets(dir: string, ...args: string[]): Promise<{ stdout: string; code: number }> {
  return letsIn(dir, dir, {}, ...args);
}

// lets run in cwd, with the fake gh in dir on PATH, and env added.
function letsIn(dir: string, cwd: string, env: Record<string, string>, ...args: string[]): Promise<{ stdout: string; code: number }> {
  return new Promise((done) => {
    execFile(process.execPath, [ENTRY, ...args], { cwd, env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ...env } }, (error, stdout) => {
      done({ stdout, code: error ? (error.code as number) : 0 });
    });
  });
}

test('lets backlog --help lists complete and its results, and says it reads, claims and completes work', async () => {
  const gh = withFakeGh();
  const { stdout, code } = await lets(gh.dir, 'backlog', '--help');
  assert.equal(code, 0);
  assert.match(stdout, /Read, claim and complete work/);
  assert.match(stdout, /^ {2}complete <i> +\{ result: completed \} \| \{ result: failed, message \}$/m);
});

test('lets backlog --help lists waves and its result', async () => {
  const gh = withFakeGh();
  const { stdout, code } = await lets(gh.dir, 'backlog', '--help');
  assert.equal(code, 0);
  assert.match(stdout, /^ {2}waves --only <keys>\n +\{ waves: \[\{ stories: \[\{ key, label, waitsFor, reason \}\] \}\] \}$/m);
});

test('lets backlog --help names the repository\'s lets config when it sets the backlog provider', async () => {
  const gh = withFakeGh();
  const repo = realpathSync(mkdtempSync(join(tmpdir(), 'lets-backlog-repo-')));
  await new Promise((done) => execFile('git', ['init', '-q'], { cwd: repo }, done));
  mkdirSync(join(repo, '.lets'));
  writeFileSync(join(repo, '.lets/config.yaml'), 'version: 3\nbacklog:\n  provider: github\n');
  const empty = mkdtempSync(join(tmpdir(), 'lets-backlog-xdg-'));
  const { stdout, code } = await letsIn(gh.dir, repo, { XDG_CONFIG_HOME: empty }, 'backlog', '--help');
  assert.equal(code, 0);
  assert.ok(stdout.includes(`The backlog provider is github, set in ${join(repo, '.lets/config.yaml')}`), stdout);
});

test('lets backlog --help says both files set the backlog provider, and the repository\'s wins', async () => {
  const gh = withFakeGh();
  const { stdout } = await lets(gh.dir, 'backlog', '--help');
  assert.match(stdout, /\$XDG_CONFIG_HOME\/lets\/config\.yaml/);
  assert.match(stdout, /\.lets\/config\.yaml/);
  assert.match(stdout, /repository's value wins/);
  assert.doesNotMatch(stdout, /cannot set it/);
});
