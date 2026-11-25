// The texts an agent reads, split the way the contract checks read them:
// prose, code spans, fenced code lines and headings. Each check takes a
// root folder, so a test can point it at a small folder of its own.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** A broken name a check found: the file, relative to the root it read, and the name. */
export interface Finding {
  file: string;
  name: string;
}

/** A piece of a text, with the number of the line it starts on, from 1. */
export interface Piece {
  line: number;
  text: string;
}

/** A heading outside fenced code, with its anchor by GitHub's rule. */
export interface Heading {
  line: number;
  level: number;
  text: string;
  anchor: string;
}

/** One file, read once and split. */
export interface Text {
  /** The path relative to the root it was read under, with `/` between folders. */
  path: string;
  /** The absolute path. */
  file: string;
  /** Each line outside fenced code, with its code spans taken out. */
  prose: Piece[];
  /** Each code span outside fenced code. A span that crosses a line break holds a space there. */
  spans: Piece[];
  /** Each line inside a fenced code block, without the fences. */
  code: Piece[];
  headings: Heading[];
}

const cache = new Map<string, Text>();

/**
 * Reads `path` under `root` once, and gives the same `Text` on each later
 * call. Throws when the file cannot be read.
 */
export function readText(root: string, path: string): Text {
  const file = join(root, path);
  let text = cache.get(file);
  if (text === undefined) {
    text = splitText(path.split(sep).join('/'), file, readFileSync(file, 'utf8'));
    cache.set(file, text);
  }
  return text;
}

/**
 * The paths under `root` of every text an agent reads (D1), sorted: each
 * skill's files, each schema's `schema.yaml` and templates,
 * `overlays/AGENTS.md`, `README.md` and `docs/*.md`. A path that does not
 * exist is left out, so a small folder may hold only some of them. Throws
 * when a folder that exists cannot be read.
 */
export function textPaths(root: string): string[] {
  const paths = [
    ...skillFolders(root).flatMap((skill) => skillFiles(root, `skills/${skill}`)),
    ...folders(root, 'schemas').flatMap((schema) => [
      `schemas/${schema}/schema.yaml`,
      ...markdownIn(root, `schemas/${schema}/templates`),
    ]),
    'overlays/AGENTS.md',
    'README.md',
    ...markdownIn(root, 'docs'),
  ];
  return paths.filter((path) => isFile(join(root, path))).sort();
}

/** Every text an agent reads under `root`, as `textPaths` lists them, each read once. */
export function readTexts(root: string): Text[] {
  return textPaths(root).map((path) => readText(root, path));
}

/**
 * The folders of `<root>/skills` that hold a `SKILL.md`, sorted. A folder
 * without one is not a skill. None when `skills/` does not exist.
 */
export function skillFolders(root: string): string[] {
  return folders(root, 'skills').filter((name) => isFile(join(root, 'skills', name, 'SKILL.md')));
}

/**
 * The paths under `root` of one skill's texts: its `SKILL.md`, then each
 * Markdown file in its `references/` and `templates/` folders, sorted.
 */
export function skillFiles(root: string, skill: string): string[] {
  return [`${skill}/SKILL.md`, ...markdownIn(root, `${skill}/references`), ...markdownIn(root, `${skill}/templates`)];
}

/**
 * The anchor GitHub gives a heading, as the `github-slugger` package makes
 * it: lower case, without any character that is not a letter, mark,
 * number, connector, space or hyphen, each space a hyphen. `seen` holds
 * the anchors of the file's earlier headings: a repeat gets `-1`, then
 * `-2`. The new anchor is added to `seen`.
 */
export function headingAnchor(text: string, seen: Map<string, number>): string {
  const base = text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '').replace(/ /g, '-');
  let anchor = base;
  while (seen.has(anchor)) {
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    anchor = `${base}-${count}`;
  }
  seen.set(anchor, 0);
  return anchor;
}

function splitText(path: string, file: string, source: string): Text {
  const text: Text = { path, file, prose: [], spans: [], code: [], headings: [] };
  const seen = new Map<string, number>();
  let fence = '';
  // The length of the backtick run that opened the current code span, or 0.
  let span = 0;
  let spanText = '';
  let spanLine = 0;
  source.split('\n').forEach((raw, index) => {
    const line = index + 1;
    if (fence !== '') {
      const trimmed = raw.trim();
      if (/^(`+|~+)$/.test(trimmed) && trimmed[0] === fence[0] && trimmed.length >= fence.length) fence = '';
      else text.code.push({ line, text: raw });
      return;
    }
    const opening = /^ *(`{3,}|~{3,})/.exec(raw);
    if (opening) {
      fence = opening[1];
      span = 0;
      return;
    }
    if (raw.trim() === '') {
      // A blank line ends the paragraph, so an open span was never a span.
      span = 0;
      spanText = '';
      return;
    }
    let prose = '';
    if (span !== 0) spanText += ' ';
    for (let i = 0; i < raw.length;) {
      if (raw[i] === '`') {
        let n = 0;
        while (raw[i + n] === '`') n++;
        if (span === 0) {
          span = n;
          spanText = '';
          spanLine = line;
        } else if (n === span) {
          text.spans.push({ line: spanLine, text: spanText });
          span = 0;
        } else {
          spanText += raw.slice(i, i + n);
        }
        i += n;
        continue;
      }
      if (span === 0) prose += raw[i];
      else spanText += raw[i];
      i++;
    }
    text.prose.push({ line, text: prose });
    const heading = /^(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(raw);
    if (heading) {
      const content = headingContent(heading[2]);
      text.headings.push({ line, level: heading[1].length, text: content, anchor: headingAnchor(content, seen) });
    }
  });
  return text;
}

// The text a heading shows keeps a link's words, not its target. The
// anchor rule drops backticks and emphasis marks.
function headingContent(markdown: string): string {
  return markdown.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1');
}

function markdownIn(root: string, folder: string): string[] {
  const dir = join(root, folder);
  if (!isDirectory(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.md') && isFile(join(dir, name))).sort().map((name) => `${folder}/${name}`);
}

function folders(root: string, folder: string): string[] {
  const dir = join(root, folder);
  if (!isDirectory(dir)) return [];
  return readdirSync(dir).filter((name) => isDirectory(join(dir, name))).sort();
}

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

/** `path` relative to `root`, with `/` between folders. */
export function relativePath(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}
