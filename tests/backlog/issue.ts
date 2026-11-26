// A stand-in GitHub issue: it answers the gh calls of lets backlog claim,
// release and complete on one issue, from state the stand-in gh keeps
// between calls. The stand-in imports this file for each call, so it
// imports nothing at run time. Not named *.test.ts, so node --test does
// not run it.
import type { StandInAnswer, StandInReply } from '../support/lets.ts';

/** A comment as `gh api …/comments` prints it. */
export interface Comment {
  id: number;
  body: string;
  user: { login: string; type: string };
  author_association: string;
}

/** One issue, as the stand-in keeps it between calls. */
export interface IssueState {
  /** The logins assigned, in the order they were added. */
  assignees: string[];
  /** The comment pages, as `--paginate --slurp` prints them. A post goes on the last page. */
  pages: Comment[][];
  /** The id the next posted comment gets. */
  nextId: number;
  /** Each Status value written, in order. */
  status: string[];
  state: 'OPEN' | 'CLOSED';
  /**
   * Comments another session posts just after this session's first post,
   * each onto its page. Added once, then emptied.
   */
  rivals: { page: number; comment: Comment }[];
  /** When set, every comment read after the first post fails with this error. */
  readsFailAfterPost?: string;
  /** Whether a comment was posted. */
  posted: boolean;
  /**
   * When true, deleting a comment another login wrote fails with `HTTP 403`.
   * The race tests set it. A claim deletes earlier claims by any login, so
   * other tests leave it unset.
   */
  ownDeletesOnly?: boolean;
}

/** The row's `data`: the issue, and the login of the session whose `gh` this is. */
export interface IssueData {
  number: number;
  login: string;
}

const REPO = 'acme/app';
const PROJECT = '7';
const OWNER = 'acme';

const json = (value: unknown): StandInReply => ({ stdout: `${JSON.stringify(value)}\n` });
const fail = (stderr: string): StandInReply => ({ stderr: `${stderr}\n`, code: 1 });

/**
 * Answers one `gh` call on the issue `data.number` of `acme/app`, whose
 * backlog is Project 7 of `acme`, as `data.login`, and changes `state` as
 * GitHub would. A call it does not know exits 127, naming the call.
 */
export const answerIssue: StandInAnswer = ({ args, state, data }) => {
  const issue = state as IssueState;
  const { number, login } = data as IssueData;
  const n = String(number);
  const url = `https://github.com/${REPO}/issues/${n}`;
  const is = (...expected: string[]) => args.length === expected.length && expected.every((arg, i) => arg === args[i]);

  if (is('api', 'user')) return json({ login });
  if (is('issue', 'view', n, '--json', 'assignees,url')) return json({ assignees: issue.assignees.map((user) => ({ login: user })), url });
  if (is('issue', 'view', n, '--json', 'url')) return json({ url });
  if (is('issue', 'view', n, '--json', 'state')) return json({ state: issue.state });
  if (is('issue', 'edit', n, '--add-assignee', '@me')) {
    if (!issue.assignees.includes(login)) issue.assignees.push(login);
    return {};
  }
  if (is('issue', 'edit', n, '--remove-assignee', '@me')) {
    issue.assignees = issue.assignees.filter((user) => user !== login);
    return {};
  }
  const body = args[5] ?? '';
  if (body.startsWith('body=') && is('api', `repos/${REPO}/issues/${n}/comments`, '--method', 'POST', '-f', body)) {
    const comment: Comment = { id: issue.nextId++, body: body.slice('body='.length), user: { login, type: 'User' }, author_association: 'OWNER' };
    issue.pages.at(-1)!.push(comment);
    if (!issue.posted) {
      for (const { page, comment: rival } of issue.rivals) {
        while (issue.pages.length <= page) issue.pages.push([]);
        issue.pages[page].push(rival);
      }
      issue.rivals = [];
    }
    issue.posted = true;
    return json(comment);
  }
  if (is('api', `repos/${REPO}/issues/${n}/comments`, '--paginate', '--slurp')) {
    if (issue.posted && issue.readsFailAfterPost !== undefined) return fail(issue.readsFailAfterPost);
    return json(issue.pages);
  }
  const deleted = /^repos\/acme\/app\/issues\/comments\/([0-9]+)$/.exec(args[1] ?? '');
  if (deleted && is('api', args[1], '--method', 'DELETE')) {
    const id = Number(deleted[1]);
    const page = issue.pages.find((comments) => comments.some((c) => c.id === id));
    if (page === undefined) return fail('gh: Not Found (HTTP 404)');
    const comment = page.find((c) => c.id === id)!;
    if (issue.ownDeletesOnly && comment.user.login !== login) return fail('gh: Must have admin rights to Repository. (HTTP 403)');
    page.splice(page.indexOf(comment), 1);
    return {};
  }
  const value = args[10] ?? '';
  if (is('project', 'item-edit', PROJECT, '--owner', OWNER, '--url', url, '--field', 'Status', '--value', value)) {
    issue.status.push(value);
    return {};
  }
  if (is('issue', 'close', n, '--reason', 'completed')) {
    issue.state = 'CLOSED';
    return {};
  }
  return { stderr: `gh: the stand-in issue ${n} has no answer for gh ${JSON.stringify(args)}\n`, code: 127 };
};
