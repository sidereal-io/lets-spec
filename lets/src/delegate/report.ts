// The step report: how a step's session says it ended. The session writes
// it last in its final message, as a fenced step-report block of YAML.
import { parse } from 'yaml';

// A question a step needs answered, with the answer it would pick, when it
// has one.
export type Question = { question: string; recommendation?: string };

export type Report =
  | { outcome: 'done'; evidence: string[] }
  | { outcome: 'needs-input'; questions: Question[] }
  | { outcome: 'failed'; reason: string };

// The report in the last step-report block of text.
export function readReport(text: string): Report {
  const value = parse(lastBlock(text)!);
  switch (value.outcome) {
    case 'done':
      return { outcome: 'done', evidence: value.evidence };
    case 'needs-input':
      return { outcome: 'needs-input', questions: value.questions.map(({ question, recommendation }: Question) =>
        (recommendation === undefined ? { question } : { question, recommendation })) };
    default:
      return { outcome: 'failed', reason: value.reason };
  }
}

// The body of the last fenced block tagged step-report, or null. A block
// opens with three or more backticks, and closes with a line of at least as
// many backticks and nothing else, as in CommonMark.
function lastBlock(text: string): string | null {
  const lines = text.split(/\r?\n/);
  let open: { size: number; report: boolean; start: number } | null = null;
  let last: string | null = null;
  lines.forEach((line, i) => {
    if (open === null) {
      const fence = /^ {0,3}(`{3,})([^`]*)$/.exec(line);
      if (fence) open = { size: fence[1].length, report: fence[2].trim() === 'step-report', start: i + 1 };
      return;
    }
    const close = /^ {0,3}(`{3,})[ \t]*$/.exec(line);
    if (close && close[1].length >= open.size) {
      if (open.report) last = lines.slice(open.start, i).join('\n');
      open = null;
    }
  });
  return last;
}
