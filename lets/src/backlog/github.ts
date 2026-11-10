// The GitHub adapter: the backlog is the one open Project linked to the
// repository, and lets calls gh for each primitive, with the same commands
// and limits the skills ran before lets backlog existed.
import type { Io } from '../io.ts';
import type { Adapter, Candidate, Item, Ref, Status } from './adapter.ts';
import { BacklogError, WriteFailed } from './adapter.ts';

// Every gh call has a finite timeout. A read past it is gh-failed; a write
// past it is WriteFailed, because it may still have happened.
export const READ_TIMEOUT_MS = 60_000;
export const WRITE_TIMEOUT_MS = 60_000;
export const TIMED_OUT_WRITE = 'timed out; the write may have happened';

// The Project lookup the skills ran. It lists the Projects linked to the
// repository, and the owner's Projects that link back to it: a user-owned
// Project can be missing from the repository's own list for a while after
// it is linked, so neither list alone is enough.
export const LOOKUP_QUERY = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    nameWithOwner
    projectsV2(first: 100) { nodes { number title url closed owner { ... on User { login } ... on Organization { login } } } }
  }
  repositoryOwner(login: $owner) {
    ... on ProjectV2Owner {
      projectsV2(first: 100) { nodes { number title url closed owner { ... on User { login } ... on Organization { login } } repositories(first: 100) { nodes { nameWithOwner } } } }
    }
  }
}`;
export const LOOKUP_JQ = `.data.repository.nameWithOwner as $repo
  | {repo: $repo, projects: ([.data.repository.projectsV2.nodes[], (.data.repositoryOwner.projectsV2.nodes[] | select(any(.repositories.nodes[]; .nameWithOwner == $repo)))]
      | map(select(.closed | not) | {number, title, url, owner: .owner.login}) | unique_by(.owner, .number))}`;

// The windows the skills read: 500 Project items, and 500 unassigned,
// unblocked open issues.
export const ITEM_LIMIT = '500';
export const FREE_LIMIT = '500';

type Project = { number: number; title: string; url: string; owner: string };

const NOT_FOUND = /could not resolve to an? (issue|issueorpullrequest)/i;

type Gh = (args: string[], timeoutMs: number) => Promise<{ ok: true; stdout: string } | { ok: false; message: string; timedOut: boolean }>;

function ghRunner(io: Pick<Io, 'execFile'>, cwd: string): Gh {
  return async (args, timeoutMs) => {
    const result = await io.execFile('gh', args, { cwd, timeoutMs });
    const command = `gh ${args.slice(0, 2).join(' ')}`;
    if (result.timedOut) return { ok: false, message: `${command} timed out after ${timeoutMs / 1000} seconds`, timedOut: true };
    if (result.code === 0) return { ok: true, stdout: result.stdout };
    const message = result.stderr.trim() || (result.code === null ? 'gh could not start' : `${command} exited ${result.code}`);
    return { ok: false, message, timedOut: false };
  };
}

// A read: its JSON, or gh-failed. A missing issue is not-found.
async function read(gh: Gh, args: string[]): Promise<unknown> {
  const result = await gh(args, READ_TIMEOUT_MS);
  if (!result.ok) {
    if (NOT_FOUND.test(result.message)) throw new BacklogError('not-found', result.message);
    throw new BacklogError('gh-failed', result.message);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new BacklogError('gh-failed', `gh ${args.slice(0, 2).join(' ')} printed something other than JSON: ${result.stdout.slice(0, 200)}`);
  }
}

// A write: nothing, or WriteFailed with gh's error.
async function write(gh: Gh, args: string[]): Promise<void> {
  const result = await gh(args, WRITE_TIMEOUT_MS);
  if (result.ok) return;
  throw new WriteFailed(result.timedOut ? TIMED_OUT_WRITE : result.message);
}

// A connection gh exports as a list, or as { nodes }.
function nodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value;
  const inner = (value as { nodes?: unknown } | null)?.nodes;
  return Array.isArray(inner) ? inner : [];
}

const text = (value: unknown): string | null => (typeof value === 'string' && value !== '' ? value : null);

async function findProject(gh: Gh): Promise<{ repo: string; project: Project }> {
  const found = await read(gh, ['api', 'graphql', '-F', 'owner={owner}', '-F', 'name={repo}', '-f', `query=${LOOKUP_QUERY}`, '--jq', LOOKUP_JQ]) as { repo: string; projects: Project[] };
  const { repo, projects } = found;
  if (projects.length === 0) {
    throw new BacklogError('no-backlog', `No open Project is linked to ${repo}. Run the lets-setup-backlog skill to create one.`);
  }
  if (projects.length > 1) {
    throw new BacklogError('several-backlogs', `${projects.length} open Projects are linked to ${repo}. Unlink all but the backlog; lets never picks one.`, {
      projects: projects.map(({ title, url }) => ({ title, url })),
    });
  }
  return { repo, project: projects[0] };
}

// The GitHub adapter for the repository in cwd. Finds the Project first:
// none or several throw before any other call.
export async function createGithub(io: Pick<Io, 'execFile'>, cwd: string): Promise<Adapter> {
  const gh = ghRunner(io, cwd);
  const { repo, project } = await findProject(gh);
  const urls = new Map<number, string>();

  // This repository's items on the Project.
  const projectItems = async () => {
    const list = await read(gh, ['project', 'item-list', String(project.number), '--owner', project.owner, '--format', 'json', '--limit', ITEM_LIMIT]) as { items?: Record<string, unknown>[] };
    return (list.items ?? []).filter((item) => (item.content as { repository?: string } | undefined)?.repository === repo);
  };
  const fields = (item: Record<string, unknown> | undefined) => ({
    kind: text(item?.kind),
    priority: text(item?.priority),
    size: text(item?.size),
    status: text(item?.status),
  });

  const urlOf = async (issue: number) => {
    const known = urls.get(issue);
    if (known !== undefined) return known;
    const { url } = await read(gh, ['issue', 'view', String(issue), '--json', 'url']) as { url: string };
    urls.set(issue, url);
    return url;
  };

  return {
    async listCandidates() {
      const items = await projectItems();
      const free = await read(gh, ['issue', 'list', '--search', 'is:open no:assignee -is:blocked', '--limit', FREE_LIMIT, '--json', 'number']) as { number: number }[];
      const freeNumbers = new Set(free.map(({ number }) => number));
      return items.map((item): Candidate => {
        const content = item.content as { number: number; title: string; url: string };
        return { number: content.number, title: content.title, url: content.url, ...fields(item), free: freeNumbers.has(content.number) };
      });
    },

    async readItem(issue) {
      const raw = await read(gh, ['issue', 'view', String(issue), '--json', 'number,title,body,url,state,assignees,parent,blockedBy,subIssues']) as Record<string, unknown>;
      const items = await projectItems();
      const onProject = items.find((item) => (item.content as { number?: number }).number === issue);
      const parentRef = raw.parent as { number?: number; url?: string } | null | undefined;
      let parent: Item['parent'] = null;
      if (typeof parentRef?.number === 'number') {
        // A parent can sit in another repository, so read it by its URL.
        const which = typeof parentRef.url === 'string' ? parentRef.url : String(parentRef.number);
        let found: { number: number; title: string; body: string };
        try {
          found = await read(gh, ['issue', 'view', which, '--json', 'number,title,body']) as typeof found;
        } catch (error) {
          // The issue exists; only its parent could not be read.
          if (!(error instanceof BacklogError)) throw error;
          throw new BacklogError('gh-failed', `could not read the parent ${which} of #${issue}: ${error.message}`);
        }
        parent = { number: found.number, title: found.title, url: typeof parentRef.url === 'string' ? parentRef.url : '', body: found.body };
      }
      urls.set(issue, raw.url as string);
      return {
        number: raw.number as number,
        title: raw.title as string,
        body: raw.body as string,
        url: raw.url as string,
        state: raw.state as string,
        ...fields(onProject),
        assignees: nodes(raw.assignees).map((user) => user.login as string),
        blockedBy: nodes(raw.blockedBy).map((b) => ({ number: b.number as number, title: b.title as string, state: b.state as string, url: b.url as string })),
        parent,
        subIssues: nodes(raw.subIssues).filter((s) => s.state === 'OPEN').map((s) => ({ number: s.number as number, title: s.title as string, url: s.url as string })),
      };
    },

    async searchTitles(words) {
      const found = await read(gh, ['issue', 'list', '--state', 'open', '--search', `${words} in:title`, '--json', 'number,title']) as Ref[];
      return found.map(({ number, title }) => ({ number, title }));
    },

    async assignees(issue) {
      const { assignees, url } = await read(gh, ['issue', 'view', String(issue), '--json', 'assignees,url']) as { assignees: unknown; url: string };
      urls.set(issue, url);
      return nodes(assignees).map((user) => user.login as string);
    },

    assignSelf: (issue) => write(gh, ['issue', 'edit', String(issue), '--add-assignee', '@me']),
    unassignSelf: (issue) => write(gh, ['issue', 'edit', String(issue), '--remove-assignee', '@me']),

    async setStatus(issue, status: Status) {
      let url: string;
      try {
        url = await urlOf(issue);
      } catch (error) {
        throw new WriteFailed((error as Error).message);
      }
      await write(gh, ['project', 'item-edit', String(project.number), '--owner', project.owner, '--url', url, '--field', 'Status', '--value', status]);
    },
  };
}
