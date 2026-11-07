import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AdapterFailure } from '../../../../lets/src/backlog/errors.ts';
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
    ProjectFields: { node: { fields: page([...Object.entries(METADATA).map(([name, values]) => ({ id: `F-${name}`, name, dataType: 'SINGLE_SELECT', options: values.map(name => ({ id: `V-${name}`, name })) }))]) } },
    Issue: { node: { id: 'I', number: 2, title: 'story', body: 'full packet', url: 'https://github.com/owner/repo/issues/2', repository: { nameWithOwner: 'owner/repo' }, closed: false, lastEditedAt: null, parent: null } },
    NamedIssue: { repository: { issue: { id: 'I' } } },
    IssueOwners: { node: { assignees: page([]) } },
    IssueProjects: { node: { projectItems: page([{ id: 'PI', project: { id: 'P' } }]) } },
    ItemValues: { node: { fieldValues: page(Object.entries({ Kind: 'Story', Priority: 'Must', Size: 'S', Status: 'Todo' }).map(([field, value]) => ({ field: { id: `F-${field}` }, optionId: `V-${value}` }))) } },
    PullRequest: {repository:{pullRequest:{id:'PR',url:'https://github.com/owner/repo/pull/7',body:'Closes #2',merged:true,mergeCommit:{oid:'merge'},repository:{nameWithOwner:'owner/repo'}}}},
    PullClosingIssues: { repository: { pullRequest: { closingIssuesReferences: page([{ id: 'I', repository: { nameWithOwner: 'owner/repo' } }]) } } },
    IssueComments: { node: { comments: page([]) } },
    IssueBlockers: { node: { blockedBy: page([]) } },
    ProjectItems: { node: { items: page([{ content: { id: 'I', repository: { nameWithOwner: 'owner/repo' } } }]) } },
  };
}
export async function withGithub(run: (fixture: { call: (operation: string, input?: any, mutationId?: string, contextPatch?: Record<string, string>) => Promise<any>; command: (name: string, input?: any) => { status: number | null; result: any }; cwd: string; state: () => any; set: (name: string, value: any) => void }) => Promise<void>, overrides: Record<string, any> = {}) {
  mkdirSync('.workspace', { recursive: true });
  const cwd = mkdtempSync(join(process.cwd(), '.workspace/github-'));
  execFileSync('git', ['init', '--quiet'], { cwd });
  const path = join(cwd, 'state.json');
  writeFileSync(path, JSON.stringify({ responses: { ...data(), ...overrides }, calls: [] }));
  mkdirSync(join(cwd, 'openspec')); writeFileSync(join(cwd, 'openspec/config.yaml'), 'schema: lets-standard\n');
  const gh = join(cwd, 'gh');
  const ghEntry = fileURLToPath(new URL('./gh-process.mjs', import.meta.url));
  writeFileSync(gh, `#!${process.execPath}\nprocess.env.BACKLOG_TEST_STATE=${JSON.stringify(path)}; await import(${JSON.stringify(ghEntry)});`);
  chmodSync(gh, 0o700);
  const entry = fileURLToPath(new URL('../../../../lets/src/backlog/github-entry.ts', import.meta.url));
  const adapter = join(cwd, 'adapter');
  writeFileSync(adapter, `#!${process.execPath}\nprocess.env.PATH=${JSON.stringify(cwd + ":" + process.env.PATH)}; await import(${JSON.stringify(entry)});`); chmodSync(adapter, 0o700);
  symlinkSync(adapter, join(cwd, 'lets-backlog-github'));
  const main = fileURLToPath(new URL('./workflow-driver.ts', import.meta.url));
  try {
    await run({ cwd, command: (name, input = {}) => {
      const result = spawnSync(process.execPath, [main, name, ghEntry], { cwd, env: { ...process.env, BACKLOG_TEST_STATE:path, PATH: cwd + ':' + process.env.PATH }, encoding: 'utf8', input: JSON.stringify({ repository: context.repository, actor: context.actor, timeoutMs: 15000, ...input }) });
      if (!result.stdout) throw new Error(result.stderr);
      return { status: result.status, result: JSON.parse(result.stdout) };
    }, state: () => JSON.parse(readFileSync(path, 'utf8')), set: (name, value) => { const state = JSON.parse(readFileSync(path, 'utf8')); state.responses[name] = value; writeFileSync(path, JSON.stringify(state)); },
      call: async (operation, input = {}, mutationId, contextPatch = {}) => {
        const child = spawnSync(process.execPath,[main,'fixture-request',ghEntry],{cwd,env:{...process.env,BACKLOG_TEST_STATE:path},encoding:'utf8',input:JSON.stringify({protocol:1,operation,context:{...context,cwd,...contextPatch},input,...(mutationId?{mutationId}:{})})});
        if(!child.stdout)throw Error(child.stderr);
        const result=JSON.parse(child.stdout);
        if(result.error)throw new AdapterFailure(result.error.category,result.error.effects,result.error.message);
        return result;
      } });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
