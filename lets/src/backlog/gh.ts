import { spawn } from 'node:child_process';
import { AdapterFailure } from './errors.ts';
import type { Query } from './github.ts';
const info = 'pageInfo { hasNextPage endCursor }';
const project = 'id title url closed';
const issue = 'id number title body url closed lastEditedAt repository { nameWithOwner } parent { id number body closed repository { nameWithOwner } }';
export const QUERIES: Record<string, string> = {
  FieldText: 'mutation FieldText($project:ID!,$item:ID!,$field:ID!,$text:String!) { updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{text:$text}}) { projectV2Item { id } } }',
  FieldStatus: 'mutation FieldStatus($project:ID!,$item:ID!,$field:ID!,$option:String!) { updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}) { projectV2Item { id } } }',
  Unassign: 'mutation Unassign($issue:ID!,$actor:ID!) { removeAssigneesFromAssignable(input:{assignableId:$issue,assigneeIds:[$actor]}) { assignable { id } } }',
  Assign: 'mutation Assign($issue:ID!,$actor:ID!) { addAssigneesToAssignable(input:{assignableId:$issue,assigneeIds:[$actor]}) { assignable { id } } }',

  Actor: 'query Actor($owner:String!,$name:String!) { viewer { login id } repository(owner:$owner,name:$name) { nameWithOwner viewerPermission } }',
  RepositoryProjects: `query RepositoryProjects($owner:String!,$name:String!,$cursor:String) { repository(owner:$owner,name:$name) { projectsV2(first:100,after:$cursor) { nodes { ${project} } ${info} } } }`,
  OwnerProjects: `query OwnerProjects($owner:String!,$cursor:String) { repositoryOwner(login:$owner) { ... on ProjectV2Owner { projectsV2(first:100,after:$cursor) { nodes { ${project} } ${info} } } } }`,
  ProjectRepositories: `query ProjectRepositories($id:ID!,$cursor:String) { node(id:$id) { ... on ProjectV2 { repositories(first:100,after:$cursor) { nodes { nameWithOwner } ${info} } } } }`,
  Project: `query Project($id:ID!) { node(id:$id) { ... on ProjectV2 { ${project} viewerCanUpdate } } }`,
  ProjectFields: `query ProjectFields($id:ID!,$cursor:String) { node(id:$id) { ... on ProjectV2 { fields(first:100,after:$cursor) { nodes { ... on ProjectV2Field { id name dataType } ... on ProjectV2SingleSelectField { id name dataType options { id name } } ... on ProjectV2IterationField { id name dataType } } ${info} } } } }`,
  Issue: `query Issue($id:ID!) { node(id:$id) { ... on Issue { ${issue} } } }`,
  NamedIssue: 'query NamedIssue($owner:String!,$name:String!,$number:Int!) { repository(owner:$owner,name:$name) { issue(number:$number) { id } } }',
  IssueOwners: `query IssueOwners($id:ID!,$cursor:String) { node(id:$id) { ... on Issue { assignees(first:100,after:$cursor) { nodes { login id } ${info} } } } }`,
  IssueProjects: `query IssueProjects($id:ID!,$cursor:String) { node(id:$id) { ... on Issue { projectItems(first:100,after:$cursor,includeArchived:true) { nodes { id project { id } } ${info} } } } }`,
  ItemValues: `query ItemValues($id:ID!,$cursor:String) { node(id:$id) { ... on ProjectV2Item { fieldValues(first:100,after:$cursor) { nodes { ... on ProjectV2ItemFieldSingleSelectValue { optionId field { ... on ProjectV2SingleSelectField { id } } } ... on ProjectV2ItemFieldTextValue { text field { ... on ProjectV2Field { id } } } } ${info} } } } }`,
  IssueComments: `query IssueComments($id:ID!,$cursor:String) { node(id:$id) { ... on Issue { comments(first:100,after:$cursor) { nodes { id body createdAt updatedAt author { login } } ${info} } } } }`,
  IssueBlockers: `query IssueBlockers($id:ID!,$cursor:String) { node(id:$id) { ... on Issue { blockedBy(first:100,after:$cursor) { nodes { id closed repository { nameWithOwner } } ${info} } } } }`,
  IssueChildren: `query IssueChildren($id:ID!,$cursor:String) { node(id:$id) { ... on Issue { subIssues(first:100,after:$cursor) { nodes { id closed repository { nameWithOwner } } ${info} } } } }`,
  ProjectItems: `query ProjectItems($id:ID!,$cursor:String) { node(id:$id) { ... on ProjectV2 { items(first:100,after:$cursor) { nodes { id content { ... on Issue { id closed repository { nameWithOwner } } } } ${info} } } } }`,
};
/** Only the gh process boundary is substituted by adapter tests. */
export function ghQuery(cwd: string): Query {
  return async (name, variables) => {
    const query = QUERIES[name];
    if (!query) throw new AdapterFailure('invalid_request', 'none', 'unknown GitHub operation');
    const mutation = query.startsWith('mutation');
    for (let attempt = 0; ; attempt++) {
      try { return await execute(cwd, query, variables, mutation); }
      catch (error) {
        if (mutation || !(error instanceof AdapterFailure) || error.category !== 'transient' || attempt >= 1) throw error;
      }
    }
  };
}
function execute(cwd: string, query: string, variables: Record<string, unknown>, mutation: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', ['api', 'graphql', '--input', '-'], { cwd, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    let bytes = 0; const chunks: Buffer[] = []; const diagnostics: Buffer[] = [];
    const interrupted = () => new AdapterFailure(mutation ? 'unknown_outcome' : 'transient', mutation ? 'unknown' : 'none', 'GitHub invocation interrupted');
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(interrupted()); }, 4500);
    const collect = (target: Buffer[]) => (chunk: Buffer) => { bytes += chunk.length; if (bytes > 1024 * 1024) { child.kill('SIGKILL'); clearTimeout(timer); reject(interrupted()); } else target.push(chunk); };
    child.stdout.on('data', collect(chunks)); child.stderr.on('data', collect(diagnostics));
    child.on('error', () => { clearTimeout(timer); reject(new AdapterFailure('invalid_configuration', 'none', 'gh executable unavailable')); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (signal) { reject(interrupted()); return; }
      let response;
      try { response = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { reject(interrupted()); return; }
      if (code !== 0 || response.errors?.length) {
        const types = (response.errors ?? []).map((error: any) => error.type);
        const stderr = Buffer.concat(diagnostics).toString('utf8');
        const category = types.includes('FORBIDDEN') ? 'permission' : types.includes('NOT_FOUND') ? 'not_found' : /401|authenticate|auth login/i.test(stderr) ? 'authentication' : mutation ? 'unknown_outcome' : 'unsupported';
        reject(new AdapterFailure(category, mutation && (!['permission', 'authentication', 'not_found'].includes(category) || response.data) ? 'unknown' : 'none', 'GitHub request failed; check authentication, permissions and supported API fields')); return;
      }
      resolve(response.data);
    });
    child.stdin.on('error', () => {}); child.stdin.end(JSON.stringify({ query, variables }));
  });
}
