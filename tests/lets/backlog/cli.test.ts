// lets backlog through the real entry, with a fake gh on PATH that answers
// the Project lookup and the title search, and logs its arguments.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
  return new Promise((done) => {
    execFile(process.execPath, [ENTRY, ...args], { cwd: dir, env: { ...process.env, PATH: `${dir}:${process.env.PATH}` } }, (error, stdout) => {
      done({ stdout, code: error ? (error.code as number) : 0 });
    });
  });
}

test('find searches words after -- as words, even one that looks like a flag', async () => {
  const gh = withFakeGh();
  const { stdout, code } = await lets(gh.dir, 'backlog', 'find', '--', '--help');
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(stdout), { issues: [] });
  assert.ok(gh.calls().includes('issue list --state open --search --help in:title --json number,title'), gh.calls().join('\n'));
});

test('a usage error through the real entry exits 2 with nothing on stdout', async () => {
  const gh = withFakeGh();
  const { stdout, code } = await lets(gh.dir, 'backlog', 'item');
  assert.equal(code, 2);
  assert.equal(stdout, '');
});
