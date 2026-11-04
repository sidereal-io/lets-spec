import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { invoke } from '../../../../lets/src/backlog/transport.ts';
import { METADATA } from '../../../../lets/src/backlog/items.ts';
export const page = (nodes: any[], hasNextPage = false, endCursor: string | null = null) => ({ nodes, pageInfo: { hasNextPage, endCursor } });
export const context = { cwd: process.cwd(), provider: 'github', repository: 'owner/repo', actor: 'me', session: 's', backlog: 'P' };
export const item = { provider: 'github', backlog: 'P', id: 'I' };
export function data() {
  return {
    Actor: { viewer: { login: 'me', id: 'U' }, repository: { nameWithOwner: 'owner/repo', viewerPermission: 'WRITE' } },
    Project: { node: { id: 'P', closed: false, viewerCanUpdate: true } },
    RepositoryProjects: { repository: { projectsV2: page([{ id: 'P', closed: false, title: 'Backlog', url: 'https://github.com/users/owner/projects/1' }]) } },
    OwnerProjects: { repositoryOwner: { projectsV2: page([]) } },
    ProjectRepositories: { node: { repositories: page([{ nameWithOwner: 'owner/repo' }]) } },
    ProjectFields: { node: { fields: page([...Object.entries(METADATA).map(([name, values]) => ({ id: `F-${name}`, name, dataType: 'SINGLE_SELECT', options: values.map(name => ({ id: `V-${name}`, name })) })), ...['claim', 'reference'].map(name => ({ id: `F-${name}`, name: `Lets ${name}`, dataType: 'TEXT' }))]) } },
    Issue: { node: { id: 'I', number: 2, title: 'story', body: 'full packet', url: 'https://github.com/owner/repo/issues/2', repository: { nameWithOwner: 'owner/repo' }, closed: false, lastEditedAt: null, parent: null } },
    NamedIssue: { repository: { issue: { id: 'I' } } },
    IssueOwners: { node: { assignees: page([]) } },
    IssueProjects: { node: { projectItems: page([{ id: 'PI', project: { id: 'P' } }]) } },
    ItemValues: { node: { fieldValues: page(Object.entries({ Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' }).map(([field, value]) => ({ field: { id: `F-${field}` }, optionId: `V-${value}` }))) } },
    IssueComments: { node: { comments: page([]) } },
    IssueBlockers: { node: { blockedBy: page([]) } },
    ProjectItems: { node: { items: page([{ content: { id: 'I', repository: { nameWithOwner: 'owner/repo' } } }]) } },
  };
}
export async function withGithub(run: (fixture: { call: (operation: string, input?: any, mutationId?: string) => Promise<any>; cwd: string; state: () => any; set: (name: string, value: any) => void }) => Promise<void>, overrides: Record<string, any> = {}) {
  mkdirSync('.workspace', { recursive: true });
  const cwd = mkdtempSync(join(process.cwd(), '.workspace/github-'));
  const path = join(cwd, 'state.json');
  writeFileSync(path, JSON.stringify({ responses: { ...data(), ...overrides }, calls: [] }));
  mkdirSync(join(cwd, 'openspec')); writeFileSync(join(cwd, 'openspec/config.yaml'), 'schema: lets-standard\n');
  const gh = join(cwd, 'gh');
  writeFileSync(gh, `#!${process.execPath}\nimport {readFileSync,writeFileSync} from 'node:fs'; let input=''; for await(const chunk of process.stdin) input+=chunk; const request=JSON.parse(input); const name=request.query.match(/(?:query|mutation) (\\w+)/)[1]; const path=${JSON.stringify(path)}; const state=JSON.parse(readFileSync(path,'utf8')); state.calls.push({name,variables:request.variables}); writeFileSync(path,JSON.stringify(state)); console.log(JSON.stringify({data:state.responses[name]}));`);
  chmodSync(gh, 0o700);
  const entry = fileURLToPath(new URL('../../../../lets/src/backlog/github-entry.ts', import.meta.url));
  const adapter = join(cwd, 'adapter');
  writeFileSync(adapter, `#!${process.execPath}\nprocess.env.PATH=${JSON.stringify(cwd)}; await import(${JSON.stringify(entry)});`); chmodSync(adapter, 0o700);
  try {
    await run({ cwd, state: () => JSON.parse(readFileSync(path, 'utf8')), set: (name, value) => { const state = JSON.parse(readFileSync(path, 'utf8')); state.responses[name] = value; writeFileSync(path, JSON.stringify(state)); },
      call: async (operation, input = {}, mutationId) => (await invoke(adapter, { protocol: 1, operation, context: { ...context, cwd }, input, ...(mutationId ? { mutationId } : {}) }, { timeoutMs: 15000 })).result });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
