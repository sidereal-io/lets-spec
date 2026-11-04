import { METADATA, readMapped, validateMappings } from './items.ts';
import type { Item, Mappings } from './items.ts';
import { AdapterFailure } from './errors.ts';

export type Context = { cwd: string; repository: string; provider: string; actor: string; session: string; backlog?: string };
export type Query = (name: string, variables: Record<string, unknown>) => Promise<any>;
export function fail(category: string, message: string): never { throw new AdapterFailure(category, 'none', message); }
export class GitHub {
  readonly context: Context;
  readonly query: Query;
  constructor(context: Context, query: Query) { this.context = context; this.query = query; }
  variables(extra: Record<string, unknown> = {}) {
    const [owner, name, other] = this.context.repository.split('/');
    if (!owner || !name || other || this.context.provider !== 'github') fail('invalid_configuration', 'GitHub requires owner/repository scope');
    return { owner, name, ...extra };
  }
  async authenticate() {
    const data = await this.query('Actor', this.variables());
    if (data.viewer?.login !== this.context.actor) fail('authentication', 'requested actor differs from authenticated GitHub actor');
    if (data.repository?.nameWithOwner?.toLowerCase() !== this.context.repository.toLowerCase()) fail('not_found', 'repository unavailable');
    return data.repository.viewerPermission as string;
  }
  async pages(name: string, variables: Record<string, unknown>, connection: (data: any) => any): Promise<any[]> {
    const result: any[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    do {
      const page = connection(await this.query(name, { ...variables, cursor }));
      if (!page || !Array.isArray(page.nodes) || typeof page.pageInfo?.hasNextPage !== 'boolean') fail('unsupported', `incomplete ${name} enumeration`);
      result.push(...page.nodes);
      if (!page.pageInfo.hasNextPage) return result;
      const next = page.pageInfo.endCursor;
      if (typeof next !== 'string' || !next || seen.has(next)) fail('unsupported', `repeated or missing ${name} cursor`);
      seen.add(next); cursor = next;
    } while (true);
  }
  async linked(project: string): Promise<boolean> {
    return (await this.pages('ProjectRepositories', { id: project }, data => data.node?.repositories))
      .some(repo => repo?.nameWithOwner?.toLowerCase() === this.context.repository.toLowerCase());
  }
  async discover() {
    await this.authenticate();
    const direct = await this.pages('RepositoryProjects', this.variables(), data => data.repository?.projectsV2);
    const owner = await this.pages('OwnerProjects', this.variables(), data => data.repositoryOwner?.projectsV2);
    const linked = new Map<string, any>();
    for (const project of direct) if (project && !project.closed) linked.set(project.id, project);
    for (const project of owner) if (project && !project.closed && !linked.has(project.id) && await this.linked(project.id)) linked.set(project.id, project);
    return [...linked.values()].map(project => ({ provider: 'github', id: project.id, title: project.title, url: project.url }));
  }

  async project(mappings?: Mappings) {
    await this.authenticate();
    const id = this.context.backlog;
    if (!id) fail('invalid_configuration', 'selected Project required');
    const project = (await this.query('Project', { id })).node;
    if (!project || project.id !== id || project.closed || !await this.linked(id)) fail('invalid_configuration', 'selected open Project must link to this repository');
    const fields = await this.pages('ProjectFields', { id }, data => data.node?.fields);
    const selected: Mappings = mappings ? structuredClone(mappings) : {};
    if (!mappings) for (const [name, values] of Object.entries(METADATA)) {
      const matches = fields.filter(field => field.name === name);
      if (matches.length !== 1) fail('invalid_configuration', `exactly one ${name} field required`);
      const field = matches[0];
      selected[name] = { field: field.id, cardinality: 'one', values: {} };
      for (const value of values) {
        const options = (field.options ?? []).filter((option: any) => option.name === value);
        if (options.length !== 1) fail('invalid_configuration', `exactly one ${name}.${value} option required`);
        selected[name].values[value] = options[0].id;
      }
    }
    validateMappings(selected);
    for (const [name, mapping] of Object.entries(selected)) {
      const field = fields.find(field => field.id === mapping.field);
      if (mapping.cardinality !== 'one' || field?.dataType !== 'SINGLE_SELECT') fail('invalid_configuration', `${name} requires a single-select native field`);
      for (const value of Object.values(mapping.values)) if (!field.options.some((option: any) => option.id === value)) fail('invalid_configuration', `${name} option does not exist`);
    }
    return { project, mappings: selected };
  }

  async issue(id: string) {
    const issue = (await this.query('Issue', { id })).node;
    if (!issue || issue.id !== id || issue.repository?.nameWithOwner?.toLowerCase() !== this.context.repository.toLowerCase()) fail('not_found', 'issue does not belong to the selected repository');
    return issue;
  }
  async projectItem(id: string) {
    const items = await this.pages('IssueProjects', { id }, data => data.node?.projectItems);
    const matches = items.filter(item => item?.project?.id === this.context.backlog);
    if (matches.length !== 1) fail('not_found', 'issue must already belong to the selected Project');
    return matches[0].id as string;
  }
  async values(projectItem: string) {
    const fields = await this.pages('ItemValues', { id: projectItem }, data => data.node?.fieldValues);
    const values: Record<string, unknown> = {};
    for (const value of fields) if (value?.field?.id) {
      if (Object.hasOwn(values, value.field.id)) fail('invalid_configuration', 'ambiguous Project item field');
      values[value.field.id] = value.optionId ?? value.text;
    }
    return values;
  }
  async owners(id: string): Promise<string[]> {
    return (await this.pages('IssueOwners', { id }, data => data.node?.assignees)).map(owner => {
      if (typeof owner?.login !== 'string' || !owner.login) fail('unsupported', 'incomplete assignee');
      return owner.login;
    });
  }
  async read(id: string, mappings?: Mappings): Promise<Item> {
    const config = await this.project(mappings);
    const issue = await this.issue(id);
    const values = await this.values(await this.projectItem(id));
    return { identity: { provider: 'github', backlog: this.context.backlog!, id }, reference: `#${issue.number}`, url: issue.url,
      title: issue.title, body: issue.body, metadata: readMapped(values, config.mappings), owners: await this.owners(id) };
  }
  async packet(id: string, mappings?: Mappings) {
    const item = await this.read(id, mappings);
    const issue = await this.issue(id);
    const comments = await this.pages('IssueComments', { id }, data => data.node?.comments);
    return { item, parent: issue.parent, lastEditedAt: issue.lastEditedAt, comments };
  }

  async relationships(id: string, kind: string) {
    await this.issue(id);
    let issues;
    if (kind === 'parent') { const issue = await this.issue(id); issues = issue.parent ? [issue.parent] : []; }
    else if (kind === 'blocked_by' || kind === 'child') {
      const field = kind === 'blocked_by' ? 'blockedBy' : 'subIssues';
      issues = await this.pages(kind === 'blocked_by' ? 'IssueBlockers' : 'IssueChildren', { id }, data => data.node?.[field]);
    } else fail('unsupported', `relationship ${kind} is not supported`);
    return issues.map(issue => {
      if (typeof issue?.id !== 'string' || typeof issue.closed !== 'boolean') fail('unsupported', 'incomplete related issue state');
      return { identity: { provider: 'github', backlog: this.context.backlog!, id: issue.id }, status: issue.closed ? 'Done' : 'Todo' };
    });
  }
  async candidates(mappings?: Mappings): Promise<Item[]> {
    const config = await this.project(mappings);
    const items = await this.pages('ProjectItems', { id: this.context.backlog }, data => data.node?.items);
    const result: Item[] = [];
    for (const item of items) if (!item?.content?.closed && item?.content?.repository?.nameWithOwner?.toLowerCase() === this.context.repository.toLowerCase()) {
      result.push(await this.read(item.content.id, mappings));
    }
    return result;
  }
  async named(reference: string, mappings?: Mappings) {
    if (!/^#?[1-9][0-9]*$/.test(reference)) fail('invalid_request', 'GitHub item reference must be an issue number');
    const issue = (await this.query('NamedIssue', this.variables({ number: Number(reference.replace('#', '')) }))).repository?.issue;
    if (!issue?.id) fail('not_found', 'issue unavailable');
    return this.read(issue.id, mappings);
  }
}
