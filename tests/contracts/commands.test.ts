// Each lets command and flag a text names is one lets has, by what
// `lets <command> --help` lists. A rename in lets then fails here, not in
// an agent that runs the old name.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { type LetsCommand, type LetsCommandTree, letsCommandTree, repo, tempDir } from '../support/lets.ts';
import { type Finding, readTexts, type Text } from './texts.ts';

// It copies the glossary, which names the step intents as
// `lets delegate step --for` takes them, not as a command that runs.
const GLOSSARY_COPY = 'skills/lets-go/references/terms.md';

const tree = letsCommandTree();

// Each lets command a text names: a code span that starts with `lets `, or
// a fenced code line where `lets ` starts the line or follows a prompt, a
// command substitution or a shell operator. A line that ends with `\`
// carries on to the next. A mention ends at a shell operator, a
// redirection or a comment, but not at a placeholder such as `<path>`.
function mentions(text: Text): string[] {
  const found = text.spans.map((span) => span.text).filter((span) => span.startsWith('lets '));
  for (const line of shellLines(text)) {
    for (const match of line.matchAll(/(?:^\s*|\$ +|\$\(|&&\s*|\|\s*|;\s*)(lets\s.*)$/g)) found.push(match[1]);
  }
  return found.map((mention) => mention.split(/\s#|\|\||&&|[|;&)]|(?:^|\s)\d*(?:>>?|<)(?!\w)/)[0].trim().replace(/\s+/g, ' '));
}

// The fenced code lines, each continued line joined to the one before.
function shellLines(text: Text): string[] {
  const lines: string[] = [];
  let previous = { line: 0, text: '' };
  for (const piece of text.code) {
    if (piece.line === previous.line + 1 && previous.text.endsWith('\\')) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + piece.text;
    } else {
      lines.push(piece.text);
    }
    previous = piece;
  }
  return lines;
}

// The finding a mention makes, or none. The walk takes each word that is a
// subcommand one level down. The first word that is not ends it.
function checkMention(mention: string, file: string, tree: LetsCommandTree): Finding | undefined {
  const words = mention.split(/\s+/).slice(1);
  let command = tree.get('') as LetsCommand;
  let at = 0;
  for (; at < words.length; at++) {
    if (!command.subcommands.includes(words[at])) break;
    command = tree.get([...command.path, words[at]].join(' ')) as LetsCommand;
  }
  const finding = { file, name: mention };
  const hasSubcommands = command.subcommands.length > 0;
  if (hasSubcommands && at < words.length && /^[a-z][a-z-]*$/.test(words[at])) return finding;
  // lets delegate names a family of commands; lets delegate review names
  // no command that runs.
  if (hasSubcommands && command.path.length > 1 && file !== GLOSSARY_COPY) return finding;
  const options = new Set([
    ...command.options,
    ...command.subcommands.flatMap((name) => (tree.get([...command.path, name].join(' ')) as LetsCommand).options),
  ]);
  for (const word of words.slice(at)) {
    if (!word.startsWith('-') || word === '--') continue;
    if (!options.has(word.split('=')[0])) return finding;
  }
  return undefined;
}

/** Each lets command or flag under `root` that lets does not have. */
async function commandFindings(root: string): Promise<Finding[]> {
  const commands = await tree;
  return readTexts(root).flatMap((text) =>
    mentions(text).flatMap((mention) => checkMention(mention, text.path, commands) ?? []));
}

function smallText(dir: string, path: string, lines: string[]) {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), `${lines.join('\n')}\n`);
}

test('each lets command and flag the texts name is one lets has', async () => {
  assert.deepEqual(await commandFindings(repo), []);
});

test('the commands check names a subcommand lets does not have', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', ['# Demo', '', 'Run `lets delegate reveiw run --for plan`.']);
  assert.deepEqual(await commandFindings(dir), [{ file: 'skills/demo/SKILL.md', name: 'lets delegate reveiw run --for plan' }]);
});

test('the commands check names a flag the command does not have', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'docs/demo.md', ['# Demo', '', '```bash', '$ lets sync \\', '    --force && git status', '```']);
  assert.deepEqual(await commandFindings(dir), [{ file: 'docs/demo.md', name: 'lets sync --force' }]);
});

test('the commands check names a mention that stops at a family of commands below the top level', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'README.md', ['# Demo', '', 'Then `lets delegate review --for plan` runs.']);
  assert.deepEqual(await commandFindings(dir), [{ file: 'README.md', name: 'lets delegate review --for plan' }]);
});

test('the commands check passes a top-level family, the end of options and a placeholder', async (t) => {
  const dir = tempDir(t);
  smallText(dir, 'skills/demo/SKILL.md', [
    '# Demo',
    '',
    '`lets delegate` runs a prompt in a fresh session.',
    'Run `lets backlog item <i>`, then `lets delegate step run --for build -- extra`.',
    '',
    '```bash',
    'result="$(lets backlog ready --only 3)"',
    '```',
  ]);
  assert.deepEqual(await commandFindings(dir), []);
});

test('the commands check passes the glossary copy naming the step intents', async (t) => {
  const dir = tempDir(t);
  smallText(dir, GLOSSARY_COPY, ['# Terms', '', 'An intent is what `lets delegate step --for` takes.']);
  assert.deepEqual(await commandFindings(dir), []);
});
