// lets sync keeps the release's rules in a marked block of the project's
// AGENTS.md. The project owns the rest of the file. --check reports on the
// block and changes nothing.
import assert from 'node:assert/strict';
import { appendFileSync, chmodSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { snapshot, tempDir } from '../support/lets.ts';
import { fragment, makeRelease, project, rulesIn, useRelease } from './project.ts';

useRelease();

const staleBlock = '<!-- BEGIN lets-spec rules -->\nold rules\n<!-- END lets-spec rules -->\n';

// Text with no final newline loses it, as `$(cat file)` does in a shell.
const chomp = (text: string) => text.replace(/\n+$/, '');
const lines = (text: string) => chomp(text).split('\n');
// The text as one line, with runs of spaces squeezed, so a phrase can be
// found across a line break.
const oneLine = (text: string) => text.replaceAll('\n', ' ').replace(/ +/g, ' ');

test('sync creates AGENTS.md holding only the rules block', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  const agents = p.read('AGENTS.md');
  assert.equal(rulesIn(agents), fragment());
  assert.equal(lines(agents).filter((line) => !line.includes('lets-spec rules')).length, fragment().split('\n').length);
  assert.match(output, /created AGENTS\.md/);
});

// Guards the regression fixed in pull request #32: the rules said the skills
// were read-only links into the Nix store that git ignores. They are copies
// that lets sync rewrites, in both skills modes, so the rules say that, and
// say the same in both.
test('the rules say lets sync rewrites the copies, in both skills modes', async (t) => {
  const p = project(t);
  const rules: Record<string, string> = {};
  for (const mode of ['committed', 'ignored']) {
    rmSync(join(p.path, 'AGENTS.md'), { force: true });
    const { code, output } = await p.sync([], { LETS_SPEC_SKILLS: mode });
    assert.equal(code, 0, output);
    rules[mode] = rulesIn(p.read('AGENTS.md'));
    const text = oneLine(rules[mode]);
    assert.ok(!text.includes('git ignores'), mode);
    assert.ok(text.includes('the `lets-*` and `openspec-*` skills in `.agents/skills/` and the `lets-*` schema folders in `openspec/schemas/`. `lets sync` rewrites all of these, so an edit there is lost'), mode);
    assert.ok(!text.includes('read-only links'), mode);
    assert.ok(!text.includes('Nix store'), mode);
  }
  assert.equal(rules.committed, rules.ignored);
});

test("sync appends the rules after a blank line, and keeps the project's text", async (t) => {
  const p = project(t);
  p.write('AGENTS.md', '# My project\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  const agents = p.read('AGENTS.md');
  assert.equal(lines(agents)[0], '# My project');
  assert.equal(lines(agents)[1], '');
  assert.equal(rulesIn(agents), fragment());
  assert.match(output, /added the lets-spec rules to AGENTS\.md/);
});

test("sync ends the project's last line before it appends the rules", async (t) => {
  const p = project(t);
  p.write('AGENTS.md', '# My project');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  const [first, second, third] = lines(p.read('AGENTS.md'));
  assert.equal(first, '# My project');
  assert.equal(second, '');
  assert.ok(third.startsWith('<!-- BEGIN lets-spec rules'), third);
});

test('sync replaces stale rules, and keeps every byte around them', async (t) => {
  const p = project(t);
  await p.init();
  const block = readFileSync(join(p.path, 'AGENTS.md'));

  // Text that awk, sed or a shell could mangle.
  const around = [
    '',
    '# My project\n\n',
    'A backslash \\n, a double \\\\ and an & \n',
    'Tabs\tand trailing spaces  \n',
    'Unicode: é — →\n',
    'A Windows line\r\n',
    'Inline <!-- BEGIN lets-spec rules --> is not a marker\n',
  ];
  for (const before of around) {
    for (const after of [...around, 'Notes without a final newline']) {
      p.write('AGENTS.md', before + staleBlock + after);
      // A file that lacks a final newline gains one.
      const ending = after === '' || after.endsWith('\n') ? after : `${after}\n`;
      const expected = Buffer.concat([Buffer.from(before), block, Buffer.from(ending)]);

      const { code, output } = await p.sync();
      assert.equal(code, 0, output);
      assert.deepEqual(readFileSync(join(p.path, 'AGENTS.md')), expected, `before: ${JSON.stringify(before)}\nafter: ${JSON.stringify(after)}`);
      assert.match(output, /updated the lets-spec rules in AGENTS\.md/);
    }
  }
});

test('sync rewrites a 0.4.0 rules block once', async (t) => {
  const p = project(t);
  p.write('AGENTS.md', [
    '<!-- BEGIN lets-spec rules. lets-sync rewrites this block: change lets-spec, not this text. -->',
    'old rules',
    '<!-- END lets-spec rules -->',
    '',
  ].join('\n'));
  const synced = await p.sync();
  assert.equal(synced.code, 0, synced.output);
  assert.match(synced.output, /updated the lets-spec rules in AGENTS\.md/);
  assert.equal(lines(p.read('AGENTS.md')).filter((line) => line.startsWith('<!-- BEGIN lets-spec rules')).length, 1);
  const checked = await p.sync(['--check']);
  assert.equal(checked.code, 0, checked.output);
});

test('sync leaves current rules unchanged', async (t) => {
  const p = project(t);
  await p.init();
  const before = `# Before\n\n${chomp(p.read('AGENTS.md'))}\n## After\n`;
  p.write('AGENTS.md', before);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(output, '');
  assert.equal(p.read('AGENTS.md'), before);
});

test('sync keeps a backslash in the rules as written', async (t) => {
  const p = project(t);
  const release = join(tempDir(t), 'backslash');
  makeRelease(release);
  const rules = join(release, 'fragments', 'AGENTS.md');
  chmodSync(join(release, 'fragments'), 0o755);
  chmodSync(rules, 0o644);
  appendFileSync(rules, 'Run `printf "a\\nb"`.\n');
  p.write('AGENTS.md', staleBlock);
  const { code, output } = await p.sync([], { WORKFLOW_RELEASE: release });
  assert.equal(code, 0, output);
  assert.ok(lines(p.read('AGENTS.md')).includes('Run `printf "a\\nb"`.'));
});

test('sync writes through a linked AGENTS.md, and keeps its mode', async (t) => {
  const p = project(t);
  mkdirSync(join(p.path, 'docs'));
  writeFileSync(join(p.path, 'docs/AGENTS.md'), staleBlock);
  chmodSync(join(p.path, 'docs/AGENTS.md'), 0o600);
  symlinkSync('docs/AGENTS.md', join(p.path, 'AGENTS.md'));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(readlinkSync(join(p.path, 'AGENTS.md')), 'docs/AGENTS.md');
  assert.equal((lstatSync(join(p.path, 'docs/AGENTS.md')).mode & 0o777).toString(8), '600');
  assert.equal(rulesIn(p.read('docs/AGENTS.md')), fragment());
});

test('sync leaves rules with an unpaired marker unchanged, and warns', async (t) => {
  const p = project(t);
  await p.init();
  const block = lines(p.read('AGENTS.md'));
  const begin = block[0];
  const end = block[block.length - 1];
  const broken = [
    `${begin}\nrules\n`,
    `rules\n${end}\n`,
    `${end}\nrules\n${begin}\n`,
    `${begin}\n${begin}\nrules\n${end}\n`,
  ];
  for (const text of broken) {
    const before = `# Mine\n${text}`;
    p.write('AGENTS.md', before);
    const { code, output } = await p.sync();
    assert.equal(code, 0, output);
    assert.equal(p.read('AGENTS.md'), before, `text: ${JSON.stringify(text)}`);
    assert.match(output, /AGENTS\.md has a lets-spec rules marker without its pair/);
  }
});

test('check passes when the rules are current', async (t) => {
  const p = project(t);
  await p.init();
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 0, output);
  assert.equal(output, '');
});

test('check fails when the rules are stale', async (t) => {
  const p = project(t);
  await p.init();
  p.write('AGENTS.md', staleBlock);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.match(output, /AGENTS\.md's lets-spec rules are out of date/);
});

test('check fails when AGENTS.md has no rules', async (t) => {
  const p = project(t);
  p.write('AGENTS.md', '# My project\n');
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.match(output, /AGENTS\.md has no lets-spec rules/);
});

test('check fails when there is no AGENTS.md', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.match(output, /AGENTS\.md has no lets-spec rules/);
});

test('check fails when a rules marker has no pair', async (t) => {
  const p = project(t);
  await p.init();
  const block = lines(p.read('AGENTS.md'));
  p.write('AGENTS.md', `${block.slice(0, -1).join('\n')}\n`);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.match(output, /AGENTS\.md has a lets-spec rules marker without its pair/);
});

test('check changes nothing in the project', async (t) => {
  const p = project(t);
  await p.init();
  p.write('AGENTS.md', staleBlock);
  rmSync(join(p.path, '.agents/skills/lets-build'), { recursive: true });
  const before = snapshot(p.path);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.equal(snapshot(p.path), before);
});
