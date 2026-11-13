// A fake backlog provider whose keys look like Jira's, such as PROJ-12. Its
// adapter keeps its items in memory, and records each method it takes, so a
// test can drive every lets backlog command through a backlog provider that
// is not GitHub.
//
//   const jira = fakeProvider({ items: [jiraItem('PROJ-12')] });
//   const t = backlogDeps([], { config: JIRA_CONFIG });
//   await run(['item', 'PROJ-12'], t.deps, { ...PROVIDERS, jira: jira.provider });
//   jira.calls()
import type { Adapter, Candidate, Claim, Item } from '../../../../lets/src/backlog/adapter.ts';
import { BacklogError } from '../../../../lets/src/backlog/adapter.ts';
import type { Provider } from '../../../../lets/src/backlog/providers.ts';

export const JIRA_CONFIG = 'schema: lets-standard\nlets:\n  backlog:\n    provider: jira\n';
export const JIRA_KEY = /^[A-Z][A-Z0-9]*-[1-9][0-9]*$/;
export const LOGIN = 'octocat';

export const jiraItem = (key: string, extra: Partial<Item> = {}): Item => ({
  key, label: key, title: `${key.toLowerCase()} — outcome`, body: `body of ${key}`, url: `https://acme.atlassian.net/browse/${key}`, state: 'OPEN',
  kind: 'Story', priority: 'Must', size: 'S', status: 'Todo',
  assignees: [], blockedBy: [], parent: null, subIssues: [], ...extra,
});

export const jiraCandidate = (key: string, created: string, extra: Partial<Candidate> = {}): Candidate => ({
  key, label: key, title: `${key.toLowerCase()} — outcome`, url: `https://acme.atlassian.net/browse/${key}`,
  kind: 'Story', priority: 'Must', size: 'S', status: 'Todo', free: true, created, ...extra,
} as Candidate);

export function fakeProvider({ items = [], candidates = [] }: { items?: Item[]; candidates?: Candidate[] } = {}) {
  const calls: [string, ...unknown[]][] = [];
  const byKey = new Map(items.map((item) => [item.key, structuredClone(item)]));
  const comments = new Map<string, Claim[]>();
  let nextId = 1;
  const find = (key: string) => {
    const item = byKey.get(key);
    if (item === undefined) throw new BacklogError('not-found', `${key} does not exist`);
    return item;
  };
  const adapter: Adapter = {
    async listCandidates() { calls.push(['listCandidates']); return candidates; },
    async readItem(key) { calls.push(['readItem', key]); return structuredClone(find(key)); },
    async searchTitles(words) { calls.push(['searchTitles', words]); return [...byKey.values()].filter((i) => i.title.includes(words)).map(({ key, label, title }) => ({ key, label, title })); },
    async assignees(key) { calls.push(['assignees', key]); return [...find(key).assignees]; },
    async signedInLogin() { calls.push(['signedInLogin']); return LOGIN; },
    async claims(key) { calls.push(['claims', key]); find(key); return [...(comments.get(key) ?? [])]; },
    async postClaim(key, token) { calls.push(['postClaim', key]); comments.set(key, [...(comments.get(key) ?? []), { id: nextId++, login: LOGIN, token }]); },
    async deleteClaim(key, id) { calls.push(['deleteClaim', key, id]); comments.set(key, (comments.get(key) ?? []).filter((c) => c.id !== id)); },
    async assignSelf(key) { calls.push(['assignSelf', key]); const item = find(key); if (!item.assignees.includes(LOGIN)) item.assignees.push(LOGIN); },
    async unassignSelf(key) { calls.push(['unassignSelf', key]); const item = find(key); item.assignees = item.assignees.filter((a) => a !== LOGIN); },
    async setStatus(key, status) { calls.push(['setStatus', key, status]); find(key).status = status; },
  };
  const provider: Provider = {
    description: 'a fake backlog provider with Jira-style keys',
    parseKey: (text) => (JIRA_KEY.test(text) ? { key: text, label: text } : null),
    create: async () => { calls.push(['create']); return adapter; },
  };
  return { provider, calls: () => calls, item: (key: string) => byKey.get(key) };
}
