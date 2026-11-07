// The step report: how a step's session says it ended. The session writes
// it last in its final message, as a fenced step-report block of YAML.
import { parse } from 'yaml';
import { UsageError } from '../resolvers/kit/errors.ts';

// A question a step needs answered, with the answer it would pick, when it
// has one.
export type Question = { question: string; recommendation?: string };

// A failed report that lets wrote, because the session gave none it could
// read, also holds the session's final message as message.
export type Report =
  | { outcome: 'done'; evidence: string[] }
  | { outcome: 'needs-input'; questions: Question[] }
  | { outcome: 'failed'; reason: string; message?: string };

const OUTCOMES = ['done', 'needs-input', 'failed'];

// The report in the last step-report block of text. When there is none, or
// it is not a valid report, a failed report that says what is wrong.
export function readReport(text: string): Report {
  try {
    return checked(lastBlock(text));
  } catch (error) {
    if (!(error instanceof Unreadable)) throw error;
    return { outcome: 'failed', reason: error.message, message: text };
  }
}

class Unreadable extends Error {}

function checked(block: string | null): Report {
  if (block === null) throw new Unreadable('the final message has no step-report block');
  let value: unknown;
  try {
    value = parse(block);
  } catch (error) {
    throw new Unreadable(`the step-report block is not YAML: ${(error as Error).message.split('\n')[0].replace(/:$/, '')}`);
  }
  if (!isObject(value)) throw new Unreadable('the step-report block must hold a mapping');
  const { outcome } = value;
  if (!OUTCOMES.includes(outcome as string)) {
    throw new Unreadable(`the step-report outcome must be done, needs-input or failed, got ${JSON.stringify(outcome) ?? String(outcome)}`);
  }
  if (outcome === 'done') {
    const { evidence } = value;
    if (!Array.isArray(evidence) || evidence.length === 0 || !evidence.every((line) => typeof line === 'string')) {
      throw new Unreadable('a done step-report must hold evidence, a non-empty list of strings');
    }
    return { outcome, evidence };
  }
  if (outcome === 'needs-input') {
    const { questions } = value;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Unreadable('a needs-input step-report must hold questions, a non-empty list');
    }
    return { outcome, questions: questions.map(question) };
  }
  if (typeof value.reason !== 'string') throw new Unreadable('a failed step-report must hold a reason, a string');
  return { outcome: 'failed', reason: value.reason };
}

// One entry of a needs-input report's questions. A null recommendation is
// none.
function question(entry: unknown, i: number): Question {
  if (!isObject(entry) || typeof entry.question !== 'string') {
    throw new Unreadable(`questions[${i}] must be a mapping with a question, a string`);
  }
  const { recommendation } = entry;
  if (recommendation === undefined || recommendation === null) return { question: entry.question };
  if (typeof recommendation !== 'string') throw new Unreadable(`questions[${i}].recommendation must be a string`);
  return { question: entry.question, recommendation };
}

// A question from a needs-input report, and the user's answer to it.
export type Answer = { question: string; answer: string };

// The pairs in text, the answers file at path. Throws a UsageError naming
// --answers-file unless it is a non-empty list of pairs with text in both.
export function readAnswers(text: string, path: string): Answer[] {
  const fail = (message: string) => new UsageError(`--answers-file ${path} ${message}`);
  let value: unknown;
  try {
    value = parse(text);
  } catch (error) {
    throw fail(`is not YAML: ${(error as Error).message.split('\n')[0].replace(/:$/, '')}`);
  }
  if (!Array.isArray(value) || value.length === 0) throw fail('must be a non-empty list of question and answer pairs');
  return value.map((entry: unknown, i: number) => {
    const hasText = (field: string) => isObject(entry) && typeof entry[field] === 'string' && entry[field].trim() !== '';
    if (!hasText('question') || !hasText('answer')) throw fail(`entry ${i + 1} must hold a question and an answer, each with text`);
    const { question, answer } = entry as Answer;
    return { question, answer };
  });
}

// prompt, then a section that settles each question with its answer. Each
// further line of a question or answer is indented, so it stays inside its
// item, and a line such as "- Q:" in an answer cannot pass as a new pair.
export function withAnswers(prompt: string, answers: Answer[]): string {
  const indented = (text: string) => text.replace(/\s+$/, '').replaceAll('\n', '\n  ');
  const items = answers.map(({ question, answer }) => `- Q: ${indented(question)}\n  A: ${indented(answer)}\n`);
  const head = prompt.endsWith('\n') ? prompt : `${prompt}\n`;
  return `${head}\n## Answers\n\nThese questions from the last step report are settled. Do not ask them again.\n\n${items.join('')}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
