// lets sync copies each skill and the schema from the release into the
// project. LETS_SPEC_SKILLS decides whether git tracks the copies:
// committed, the default, or ignored through a marked block in .gitignore.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildRelease, git, type LetsResult, pinnedEnv, repo, snapshot, tempDir } from '../support/lets.ts';
import { makeRelease, project, releaseFiles, shippedSkills, useRelease } from './project.ts';

const release = useRelease();

const skillsBlock = '# BEGIN lets-spec skills. lets sync rewrites this block: change lets-spec, not this text.\n/.agents/skills/lets-*\n/.agents/skills/openspec-*\n/openspec/schemas/lets-*\n# END lets-spec skills\n';

// The untrack command the tracked-copies problem gives.
const untrack = "git rm -r --cached --ignore-unmatch -- '.agents/skills/lets-*' '.agents/skills/openspec-*' 'openspec/schemas/lets-*'";

const ignored = { LETS_SPEC_SKILLS: 'ignored' };
const linksBegin = '# BEGIN lets-spec links. lets-sync rewrites this section.\n';
const linksEnd = '# END lets-spec links\n';

// Every path lets sync should write in this project.
const managedPaths = () => [...shippedSkills().map((skill) => `.agents/skills/${skill}`), 'openspec/schemas/lets-standard'];

const chomp = (text: string) => text.replace(/\n+$/, '');

const isLink = (path: string) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};

// Every link under each folder of root.
function linksUnder(root: string, ...folders: string[]): string[] {
  return folders.flatMap((folder) =>
    readdirSync(join(root, folder), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isSymbolicLink())
      .map((entry) => join(entry.parentPath, entry.name)));
}

// first, then later on the same stream, so the order of the two is the
// order lets wrote them.
function assertInOrder(result: LetsResult, first: string, later: string) {
  const found = [result.stdout, result.stderr].some((stream) => {
    const at = stream.indexOf(first);
    return at !== -1 && stream.indexOf(later, at + first.length) !== -1;
  });
  assert.ok(found, `expected ${JSON.stringify(first)}, then ${JSON.stringify(later)}, in:\n${result.output}`);
}

test('sync copies each skill and the schema into the project', async (t) => {
  const p = project(t);
  await p.init();
  for (const file of releaseFiles()) {
    assert.ok(!isLink(join(p.path, file)), `a link: ${file}`);
    assert.deepEqual(readFileSync(join(p.path, file)), readFileSync(join(release(), 'overlay', file)), `differs: ${file}`);
  }
  assert.deepEqual(linksUnder(p.path, '.agents/skills', 'openspec/schemas'), []);
});

test('a script keeps its executable bit', async (t) => {
  const p = project(t);
  await p.init();
  const mode = (file: string) => (statSync(join(p.path, file)).mode & 0o777).toString(8);
  assert.equal(mode('.agents/skills/lets-verify-contracts/scripts/check.sh'), '755');
  assert.equal(mode('.agents/skills/lets-verify-contracts/SKILL.md'), '644');
});

test('a fresh clone of a committed project passes --check and syncs quietly', async (t) => {
  const p = project(t);
  await p.init();
  p.git('add', '-A');
  assert.equal(p.git('commit', '--quiet', '-m', 'init').code, 0);
  const clone = join(tempDir(t), 'clone');
  assert.equal(git(p.path, 'clone', '--quiet', p.path, clone).code, 0);
  const checked = await p.sync(['--check'], {}, { cwd: clone });
  assert.equal(checked.code, 0, checked.output);
  assert.equal(checked.output, '');
  const synced = await p.sync([], {}, { cwd: clone });
  assert.equal(synced.code, 0, synced.output);
  assert.ok(!synced.output.includes('wrote'), synced.output);
});

test('sync copies the release in a git worktree, and git tracks the copies there', async (t) => {
  const p = project(t);
  await p.init();
  p.git('add', '-A');
  assert.equal(p.git('commit', '--quiet', '-m', 'init').code, 0);
  const tree = join(tempDir(t), 'tree');
  assert.equal(p.git('worktree', 'add', '--quiet', tree).code, 0);
  const { code, output } = await p.sync([], {}, { cwd: tree });
  assert.equal(code, 0, output);
  assert.ok(!output.includes('wrote'), output);
  assert.ok(existsSync(join(tree, '.agents/skills/lets-build/SKILL.md')));
  assert.notEqual(git(tree, 'check-ignore', '-q', '.agents/skills/lets-build').code, 0);
});

test('git does not ignore a managed path', async (t) => {
  const p = project(t);
  await p.init();
  for (const path of managedPaths()) {
    assert.notEqual(p.git('check-ignore', '-q', path).code, 0, `ignored: ${path}`);
  }
  p.git('add', '-A');
  assert.notEqual(p.git('ls-files', '.agents/skills/lets-build', 'openspec/schemas/lets-standard').stdout, '');
});

test('a second sync is quiet and changes nothing', async (t) => {
  const p = project(t);
  await p.init();
  const before = snapshot(p.path);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(output, '');
  assert.equal(snapshot(p.path), before);
});

test('a changed file is rewritten and reported', async (t) => {
  const p = project(t);
  await p.init();
  appendFileSync(join(p.path, '.agents/skills/lets-build/SKILL.md'), 'a local edit\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes('lets-spec: wrote 1 files. Commit them.'), output);
  assert.equal(p.read('.agents/skills/lets-build/SKILL.md'), readFileSync(join(release(), 'overlay/.agents/skills/lets-build/SKILL.md'), 'utf8'));
});

test('a skill the new release no longer ships is removed', async (t) => {
  const p = project(t);
  // lets-spawn is a real case: releases before lets delegate shipped it.
  const old = join(tempDir(t), 'old');
  makeRelease(old, ['lets-spawn']);
  await p.init({ WORKFLOW_RELEASE: old });
  assert.ok(existsSync(join(p.path, '.agents/skills/lets-spawn/SKILL.md')));
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(!existsSync(join(p.path, '.agents/skills/lets-spawn')));
  assert.ok(output.includes('lets-spec: removed .agents/skills/lets-spawn.'), output);
});

test('a skill of another name is left alone', async (t) => {
  const p = project(t);
  p.write('.agents/skills/brainstorming/SKILL.md', 'mine\n');
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.equal(p.read('.agents/skills/brainstorming/SKILL.md'), 'mine\n');
});

test('a project synced by the linked layout becomes copied', async (t) => {
  const p = project(t);
  // Lay the project out as the bash lets-sync did: a link at each managed
  // path into a store-named release, and a section in .git/info/exclude.
  const old = join(tempDir(t), 'store', 'abc-lets-spec-release');
  makeRelease(old);
  mkdirSync(join(p.path, '.agents/skills'), { recursive: true });
  mkdirSync(join(p.path, 'openspec/schemas'), { recursive: true });
  let exclude = `/local-notes\n${linksBegin}`;
  for (const path of managedPaths()) {
    symlinkSync(join(old, 'overlay', path), join(p.path, path));
    exclude += `/${path}\n`;
  }
  p.write('.git/info/exclude', exclude + linksEnd);
  assert.equal(p.git('check-ignore', '-q', '.agents/skills/lets-build').code, 0);

  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.deepEqual(linksUnder(p.path, '.agents/skills', 'openspec/schemas'), []);
  assert.equal(chomp(p.read('.git/info/exclude')), '/local-notes');
  for (const path of managedPaths()) {
    assert.ok(statSync(join(p.path, path)).isDirectory(), `not a folder: ${path}`);
    assert.notEqual(p.git('check-ignore', '-q', path).code, 0, `ignored: ${path}`);
  }
  assert.ok(output.includes(`lets-spec: wrote ${releaseFiles().length} files. Commit them.`), output);
});

test('links the linked layout made under pre-rename names are removed', async (t) => {
  const p = project(t);
  // Older releases linked skills and the schema under names lets sync no
  // longer owns. The exclude section lists them, so they are removed by it.
  const tmp = tempDir(t);
  const old = join(tmp, 'store', 'abc-lets-spec-release');
  const mine = join(tmp, 'mine');
  const renamed = ['.agents/skills/brainstorming', '.agents/skills/writing-specs', 'openspec/schemas/standard'];
  mkdirSync(join(p.path, '.agents/skills'), { recursive: true });
  mkdirSync(join(p.path, 'openspec/schemas'), { recursive: true });
  mkdirSync(mine);
  let exclude = `/local-notes\n${linksBegin}`;
  for (const path of renamed) {
    symlinkSync(join(old, 'overlay', path), join(p.path, path));
    exclude += `/${path}\n`;
  }
  // A link the project made, listed in the section by hand.
  symlinkSync(mine, join(p.path, '.agents/skills/my-skill'));
  exclude += '/.agents/skills/my-skill\n';
  p.write('.git/info/exclude', exclude + linksEnd);

  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  for (const path of renamed) {
    assert.ok(!isLink(join(p.path, path)), `still a link: ${path}`);
    assert.ok(output.includes(`lets-spec: removed ${path}.`), `not reported: ${path}\n${output}`);
  }
  assert.equal(readlinkSync(join(p.path, '.agents/skills/my-skill')), mine);
  assert.equal(chomp(p.read('.git/info/exclude')), '/local-notes');
  // git sees no link into a release.
  for (const path of p.git('ls-files', '--others', '--exclude-standard').stdout.split('\n').filter(Boolean)) {
    const target = isLink(join(p.path, path)) ? readlinkSync(join(p.path, path)) : '';
    assert.ok(!target.includes('-lets-spec-release'), `untracked link: ${path}`);
  }
});

test('an unpaired links marker in the exclude file is a warning, and the file is left alone', async (t) => {
  const p = project(t);
  const old = join(tempDir(t), 'store', 'abc-lets-spec-release');
  mkdirSync(join(p.path, '.agents/skills'), { recursive: true });
  symlinkSync(join(old, 'overlay/.agents/skills/brainstorming'), join(p.path, '.agents/skills/brainstorming'));
  const exclude = `${linksBegin}/.agents/skills/brainstorming\n`;
  p.write('.git/info/exclude', exclude);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes('- .git/info/exclude has a lets-spec links marker without its pair, so its old links were not removed. Delete the marker, and the lines between the markers, then run lets sync again.'), output);
  assert.equal(p.read('.git/info/exclude'), exclude);
  assert.ok(isLink(join(p.path, '.agents/skills/brainstorming')));
});

test('ignored mode writes the gitignore block and git ignores every managed path', async (t) => {
  const p = project(t);
  const first = await p.sync([], ignored);
  assert.equal(first.code, 0, first.output);
  assert.ok(first.output.includes('lets-spec: added the lets-spec skills block to .gitignore. Commit it.'), first.output);
  assert.ok(first.output.includes(`lets-spec: wrote ${releaseFiles().length} files. Git ignores them.`), first.output);
  assert.ok(!first.output.includes('Commit them.'), first.output);
  assert.ok(!first.output.includes('git rm'), first.output);
  assert.equal(p.read('.gitignore'), skillsBlock);
  for (const path of managedPaths()) {
    assert.equal(p.git('check-ignore', '-q', path).code, 0, `not ignored: ${path}`);
  }
  const second = await p.sync([], ignored);
  assert.equal(second.code, 0, second.output);
  assert.equal(second.output, '');
});

test('ignored mode rewrites a 0.4.0 skills block once', async (t) => {
  const p = project(t);
  p.write('.gitignore', '# BEGIN lets-spec skills. lets-sync rewrites this block: change lets-spec, not this text.\n/old\n# END lets-spec skills\n');
  const synced = await p.sync([], ignored);
  assert.equal(synced.code, 0, synced.output);
  assert.equal(p.read('.gitignore').split('\n').filter((line) => line.startsWith('# BEGIN lets-spec skills')).length, 1);
  assert.equal(p.read('.gitignore'), skillsBlock);
  const checked = await p.sync(['--check'], ignored);
  assert.equal(checked.code, 0, checked.output);
});

test("ignored mode keeps every byte of the project's own gitignore", async (t) => {
  const p = project(t);
  const own = ['', '/local-notes\n', '# A comment\n*.log\n\n', '!/keep-me\n/été\n'];
  const stale = '# BEGIN lets-spec skills. lets-sync rewrites this block: change lets-spec, not this text.\n/old\n# END lets-spec skills\n';
  const gitignore = () => readFileSync(join(p.path, '.gitignore'));
  for (const before of own) {
    for (const after of own) {
      const inputs = `before: ${JSON.stringify(before)}\nafter: ${JSON.stringify(after)}`;
      // The block is appended after a blank line.
      p.write('.gitignore', before);
      let result = await p.sync([], ignored);
      assert.equal(result.code, 0, result.output);
      assert.deepEqual(gitignore(), Buffer.from(`${before}\n${skillsBlock}`), `appended. ${inputs}`);
      // A current block stays where it is.
      appendFileSync(join(p.path, '.gitignore'), after);
      result = await p.sync([], ignored);
      assert.equal(result.code, 0, result.output);
      assert.deepEqual(gitignore(), Buffer.from(`${before}\n${skillsBlock}${after}`), `kept. ${inputs}`);
      // A stale block is rewritten in place.
      p.write('.gitignore', before + stale + after);
      result = await p.sync([], ignored);
      assert.equal(result.code, 0, result.output);
      assert.ok(result.output.includes('lets-spec: updated the lets-spec skills block in .gitignore. Commit it.'), result.output);
      assert.deepEqual(gitignore(), Buffer.from(before + skillsBlock + after), `rewritten. ${inputs}`);
    }
  }
});

test('ignored mode leaves a block with an unpaired marker unchanged, and warns', async (t) => {
  const p = project(t);
  p.write('.gitignore', '/mine\n# END lets-spec skills\n');
  const result = await p.sync([], ignored);
  assert.equal(result.code, 0, result.output);
  assert.equal(p.read('.gitignore'), '/mine\n# END lets-spec skills\n');
  assertInOrder(result, 'problem(s) to fix', '.gitignore has a lets-spec skills marker without its pair');
});

test('switching to committed removes the block and says what to add', async (t) => {
  const p = project(t);
  p.write('.gitignore', '/local-notes\n');
  await p.init(ignored);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(output.includes('lets-spec: removed the lets-spec skills block from .gitignore. Run: git add .agents/skills openspec/schemas, then commit.'), output);
  assert.equal(chomp(p.read('.gitignore')), '/local-notes');
  assert.notEqual(p.git('check-ignore', '-q', '.agents/skills/lets-build').code, 0);
});

test('switching to committed leaves an empty gitignore when it held only the block', async (t) => {
  const p = project(t);
  await p.init(ignored);
  const { code, output } = await p.sync();
  assert.equal(code, 0, output);
  assert.ok(existsSync(join(p.path, '.gitignore')));
  assert.equal(p.read('.gitignore'), '');
});

test('committed mode leaves a block with an unpaired marker unchanged, and warns', async (t) => {
  const p = project(t);
  p.write('.gitignore', '/mine\n# END lets-spec skills\n');
  const result = await p.sync();
  assert.equal(result.code, 0, result.output);
  assert.equal(p.read('.gitignore'), '/mine\n# END lets-spec skills\n');
  assertInOrder(result, 'problem(s) to fix', '.gitignore has a lets-spec skills marker without its pair, so its block was not updated.');
});

test('--check in committed mode fails on an unpaired marker in .gitignore', async (t) => {
  const p = project(t);
  await p.init();
  p.write('.gitignore', '# BEGIN lets-spec skills. lets-sync rewrites this block: change lets-spec, not this text.\n/mine\n');
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.ok(output.includes('lets-spec: .gitignore still has the lets-spec skills block. Run lets sync, then commit .gitignore.'), output);
});

test('switching to ignored says what to untrack until the copies are untracked', async (t) => {
  const p = project(t);
  await p.init();
  p.git('add', '-A');
  assert.equal(p.git('commit', '--quiet', '-m', 'committed').code, 0);
  const problem = `- git still tracks lets-spec copies that .gitignore ignores. Run: ${untrack}, then commit.`;
  let result = await p.sync([], ignored);
  assert.equal(result.code, 0, result.output);
  assertInOrder(result, 'problem(s) to fix', problem);
  assert.equal(p.git('check-ignore', '-q', '--no-index', '.agents/skills/lets-build').code, 0);
  result = await p.sync([], ignored);
  assert.equal(result.code, 0, result.output);
  assertInOrder(result, 'problem(s) to fix', problem);
  result = await p.sync(['--check'], ignored);
  assert.equal(result.code, 0, result.output);
  assert.equal(p.git('rm', '-r', '--cached', '--quiet', '--', '.agents/skills', 'openspec/schemas').code, 0);
  result = await p.sync([], ignored);
  assert.equal(result.code, 0, result.output);
  assert.ok(!result.output.includes('git still tracks'), result.output);
});

test('the untrack command from the problem untracks every managed path when a pattern matches nothing', async (t) => {
  const p = project(t);
  await p.init();
  const letsSkills = readdirSync(join(p.path, '.agents/skills'))
    .filter((skill) => skill.startsWith('lets-'))
    .map((skill) => `.agents/skills/${skill}`);
  assert.equal(p.git('add', '--', ...letsSkills, 'openspec/schemas').code, 0);
  assert.equal(p.git('commit', '--quiet', '-m', 'committed').code, 0);
  assert.equal(p.git('ls-files', '--', '.agents/skills/openspec-*').stdout, '');
  const { code, output } = await p.sync([], ignored);
  assert.equal(code, 0, output);
  const after = output.slice(output.indexOf('Run: git rm ') + 'Run: git rm '.length);
  const command = `git rm ${after.slice(0, after.indexOf(', then commit.'))}`;
  assert.equal(command, untrack);
  const ran = spawnSync('sh', ['-c', command], { cwd: p.path, env: pinnedEnv(), encoding: 'utf8' });
  assert.equal(ran.status, 0, ran.stderr);
  assert.equal(p.git('ls-files', '--', '.agents/skills/lets-*', '.agents/skills/openspec-*', 'openspec/schemas/lets-*').stdout, '');
  assert.ok(existsSync(join(p.path, '.agents/skills/lets-build/SKILL.md')));
  assert.ok(existsSync(join(p.path, 'openspec/schemas/lets-standard/schema.yaml')));
});

test('--check fails on a stale file and names it', async (t) => {
  const p = project(t);
  await p.init();
  appendFileSync(join(p.path, '.agents/skills/lets-build/SKILL.md'), 'a local edit\n');
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.ok(output.includes('lets-spec: .agents/skills/lets-build/SKILL.md is out of date. Run lets sync, then commit it.'), output);
});

test('--check fails on a missing skill and on an extra file', async (t) => {
  const p = project(t);
  await p.init();
  rmSync(join(p.path, '.agents/skills/lets-shape'), { recursive: true });
  p.write('.agents/skills/lets-build/extra.md', 'extra\n');
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.ok(output.includes('.agents/skills/lets-shape/SKILL.md is out of date'), output);
  assert.ok(output.includes('.agents/skills/lets-build/extra.md is out of date'), output);
});

test('--check in committed mode fails while .gitignore still has the block', async (t) => {
  const p = project(t);
  await p.init(ignored);
  const { code, output } = await p.sync(['--check']);
  assert.equal(code, 1, output);
  assert.ok(output.includes('lets-spec: .gitignore still has the lets-spec skills block. Run lets sync, then commit .gitignore.'), output);
});

test('--check in ignored mode passes without the skills present', async (t) => {
  const p = project(t);
  await p.init(ignored);
  rmSync(join(p.path, '.agents/skills'), { recursive: true });
  const { code, output } = await p.sync(['--check'], ignored);
  assert.equal(code, 0, output);
  assert.equal(output, '');
});

test('--check in ignored mode fails without a current block', async (t) => {
  const p = project(t);
  await p.init();
  const { code, output } = await p.sync(['--check'], ignored);
  assert.equal(code, 1, output);
  assert.ok(output.includes('lets-spec: .gitignore has no current lets-spec skills block. Run lets sync, then commit .gitignore.'), output);
});

test('an unknown LETS_SPEC_SKILLS is a usage error', async (t) => {
  const p = project(t);
  const { code, output } = await p.sync([], { LETS_SPEC_SKILLS: 'tracked' });
  assert.equal(code, 1, output);
  assert.ok(output.includes("error: LETS_SPEC_SKILLS must be committed or ignored, got 'tracked'."), output);
  assert.ok(!existsSync(join(p.path, 'AGENTS.md')));
});

test('sync preserves project vocabulary while installing the real reference', async (t) => {
  const p = project(t);
  const tmp = tempDir(t);
  const flows = JSON.parse(readFileSync(join(repo, 'flows.json'), 'utf8')) as { flows: Record<string, { schemas: string[]; skills: string[] }> };
  const vocabulary = ['openspec/glossary.md', 'openspec/specs/backend/glossary.md', 'openspec/specs/backend/checkout/glossary.md', 'docs/vocabulary.md'];
  const reference = '.agents/skills/lets-shape/references/domain-language.md';
  for (const flow of ['standard', 'minimal']) {
    const flowRelease = join(tmp, `${flow}-release`);
    buildRelease(flowRelease, flows.flows[flow].schemas, flows.flows[flow].skills);
    for (const mode of ['committed', 'ignored']) {
      const dir = join(tmp, `${flow}-${mode}`);
      mkdirSync(dir);
      assert.equal(git(dir, 'init', '--quiet').code, 0);
      const env = { WORKFLOW_RELEASE: flowRelease, LETS_SPEC_SKILLS: mode };
      let result = await p.sync([], env, { cwd: dir });
      assert.equal(result.code, 0, result.output);
      assert.ok(!existsSync(join(dir, 'openspec/glossary.md')));
      mkdirSync(join(dir, 'openspec/specs/backend/checkout'), { recursive: true });
      mkdirSync(join(dir, 'docs'));
      for (const path of vocabulary) writeFileSync(join(dir, path), `Project-owned ${path}\n`);
      result = await p.sync([], env, { cwd: dir });
      assert.equal(result.code, 0, result.output);
      assert.deepEqual(readFileSync(join(dir, reference)), readFileSync(join(repo, 'skills/lets-shape/references/domain-language.md')));
      for (const path of vocabulary) assert.equal(readFileSync(join(dir, path), 'utf8'), `Project-owned ${path}\n`);
      if (mode === 'ignored') {
        assert.equal(git(dir, 'check-ignore', '-q', reference).code, 0);
      } else {
        assert.equal(git(dir, 'add', reference).code, 0);
        assert.notEqual(git(dir, 'ls-files', reference).stdout, '');
      }
    }
  }
});
