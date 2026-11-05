// Check openspec/config.yaml. Node has no YAML parser, so this reads lines:
// the top-level `schema:` line, and any line that names a retired skill.
import type { Io } from '../io.ts';

// The value of the first top-level `schema:` line, or null when absent or empty.
// Removes surrounding whitespace, a trailing `# comment`, and one pair of
// matching quotes.
export function schemaOf(text: string) {
  for (const line of text.split(/\r?\n/)) {
    const match = /^schema:(.*)$/.exec(line);
    if (!match) continue;
    const value = unquote(match[1].trim());
    return value === '' ? null : value;
  }
  return null;
}

function unquote(raw: string) {
  const quote = raw[0];
  if (quote === '"' || quote === "'") {
    const end = raw.indexOf(quote, 1);
    if (end !== -1) return raw.slice(1, end).trim();
  }
  return withoutComment(raw).trim();
}

function withoutComment(text: string) {
  return text.replace(/(^|\s)#.*$/, '');
}

// The warnings about the project's config. Returns lines; prints nothing.
export function checkConfig({ io, configPath, schemaName }: { io: Io; configPath: string; schemaName: string }) {
  // A folder at the path counts as missing.
  const text = io.isDir(configPath) ? null : io.readFile(configPath);
  if (text === null) return [`${configPath} is missing, and could not be created.`];
  const warnings: string[] = [];
  const schema = schemaOf(text);
  if (schema === null) warnings.push(`${configPath} sets no schema; it must be ${schemaName}.`);
  else if (schema !== schemaName) warnings.push(`${configPath} sets schema to '${schema}'; it must be ${schemaName}.`);
  // Earlier releases wrote a rule into the config that runs this skill.
  if (text.split(/\r?\n/).some((line) => withoutComment(line).includes('lets-review-code'))) {
    warnings.push(
      `${configPath} names lets-review-code, which this release does not ship. Delete the operations.archive entry that names it: the lets-review-build skill runs the code review now.`,
    );
  }
  return warnings;
}
