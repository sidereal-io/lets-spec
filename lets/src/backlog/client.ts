import { randomUUID } from './runtime-context.ts';
import { readConfiguration } from './repository-config.ts';
import type { Selection } from './repository-config.ts';
import { dispatch } from './github-main.ts';
import { transaction } from './runtime-context.ts';
import { enumerate } from './selection.ts';
import type { Context } from './github.ts';
import { fail } from './github.ts';
export class Client {
  readonly selection: Selection;
  readonly context: Context;
  readonly timeoutMs: number;
  constructor(cwd: string, input: Record<string, any>) {
    this.selection = readConfiguration(cwd);
    if (typeof input.repository !== 'string' || !input.repository || typeof input.actor !== 'string' || !input.actor) fail('invalid_request', 'repository and authenticated actor are required');
    this.context = { cwd, provider: this.selection.provider, repository: input.repository, actor: input.actor, session: input.session ?? randomUUID(), ...(this.selection.backlog ? { backlog: this.selection.backlog } : {}) };
    this.timeoutMs = input.timeoutMs ?? (this.selection.provider === 'github' ? 180000 : 5000);
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 2_147_483_647) fail('invalid_request', 'timeoutMs must be positive and at most 2147483647');
  }
  call = async (operation: string, input: Record<string, any> = {}, mutationId?: string, session = this.context.session) => {
    const query = transaction.getStore()?.query;
    if (!query) fail('invalid_configuration', 'backlog actions require a resumable workflow');
    return dispatch({ protocol: 1, operation, context: { ...this.context, session }, input, ...(mutationId ? { mutationId } : {}) }, (name, variables) => query(name, variables, { ...this.context, session }));
  };
  connect = (session: string) => (operation: string, input?: Record<string, any>, key?: string) => this.call(operation, input, key, session);
  async resolve() {
    if (!this.context.backlog) {
      const projects = await enumerate(this.call, 'backlog.list');
      if (projects.length !== 1 || projects[0].provider !== this.context.provider) fail('invalid_configuration', `exactly one linked open backlog required; found ${projects.length}`);
      this.context.backlog = projects[0].id;
    }
    const check = await this.call('backlog.check');
    if (!check.valid || check.gaps.length) fail('invalid_configuration', 'backlog mappings are incomplete');
    return this;
  }
}
