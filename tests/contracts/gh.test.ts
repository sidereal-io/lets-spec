// Each gh command a text names is one the real gh knows. The skills still
// run gh themselves (ADR-021), so a command gh renamed would fail in an
// agent's hands.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { type EnvChanges, pinnedEnv, repo, tempDir } from '../support/lets.ts';
import { type Finding, readTexts } from './texts.ts';

// Each `gh <group> <command>` at the start of a code span or a fenced code
// line, with the files that name it.
function ghMentions(root: string): Map<string, string[]> {
  const mentions = new Map<string, string[]>();
  for (const text of readTexts(root)) {
    for (const piece of [...text.spans.map((span) => span.text), ...text.code.map((line) => line.text.trimStart())]) {
      // The command is the whole word, so `gh pr view2` is not `gh pr view`;
      // a flag such as `gh pr --help` is no command. For `gh api`, the word
      // stops at the `/` of an endpoint.
      const match = /^gh ([a-z]+ [a-z][\w-]*)/.exec(piece);
      if (match === null) continue;
      const files = mentions.get(match[1]) ?? [];
      if (!files.includes(text.path)) files.push(text.path);
      mentions.set(match[1], files);
    }
  }
  return mentions;
}

// gh's help for the arguments. gh answers an unknown command with its
// group's help and exits 0, so only the text tells.
function ghHelp(args: string[], env: EnvChanges): Promise<string> {
  return new Promise((done, fail) => {
    execFile('gh', [...args, '--help'], { env: pinnedEnv({ GH_CONFIG_DIR: tempDir(), GH_NO_UPDATE_NOTIFIER: '1', ...env }) }, (error, stdout, stderr) => {
      if (error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        fail(new Error('gh is not on PATH. The gh check runs the real gh: add it to PATH, as the flake and mise.toml do.'));
      } else {
        done(stdout + stderr);
      }
    });
  });
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Each `gh <group> <command>` a text under `root` names that the real gh
 * does not know: its `--help` has no usage line that starts with it. For
 * `gh api`, the word after it is an endpoint, which must start one of the
 * examples in `gh api --help`, such as `graphql`. Each file that names it
 * gets a finding. Rejects, naming gh, when gh is not on `PATH`; `env`
 * changes the environment gh runs in.
 */
async function ghFindings(root: string, env: EnvChanges = {}): Promise<Finding[]> {
  const mentions = [...ghMentions(root)];
  const known = await Promise.all(mentions.map(async ([mention]) => {
    const [group, command] = mention.split(' ');
    if (group === 'api') {
      return new RegExp(`^\\s+\\$ gh api ${escape(command)}( |$)`, 'm').test(await ghHelp(['api'], env));
    }
    return new RegExp(`^\\s+gh ${escape(mention)}( |$)`, 'm').test(await ghHelp([group, command], env));
  }));
  return mentions.flatMap(([mention, files], index) => known[index] ? [] : files.map((file) => ({ file, name: `gh ${mention}` })));
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

test('each gh command the texts name is one gh knows', async () => {
  assert.ok(ghMentions(repo).size > 0, 'the texts name no gh command, so the check reads nothing');
  assert.deepEqual(await ghFindings(repo), []);
});

test('the gh check names a command gh does not know', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', [
    '# Demo',
    '',
    'Run `gh pr view 12`, then `gh api graphql -f query=@q.graphql`, `gh pr --help`',
    'and `gh api --method POST graphql`:',
    '',
    '```bash',
    'gh pr merge-all --auto',
    'gh pr view2 12',
    '```',
  ]);
  assert.deepEqual(await ghFindings(dir), [
    { file: 'skills/demo/SKILL.md', name: 'gh pr merge-all' },
    { file: 'skills/demo/SKILL.md', name: 'gh pr view2' },
  ]);
});

test('the gh check fails, naming gh, when gh is not on PATH', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', ['# Demo', '', 'Run `gh pr view 12`.']);
  await assert.rejects(ghFindings(dir, { PATH: tempDir(t) }), /gh is not on PATH/);
});
