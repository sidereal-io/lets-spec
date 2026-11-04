import { randomUUID } from 'node:crypto';
import { readConfiguration } from './config.ts';
import type { Selection } from './config.ts';
import { invoke } from './transport.ts';
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
    this.timeoutMs = input.timeoutMs ?? 5000;
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) fail('invalid_request', 'positive timeoutMs required');
  }
  call = async (operation: string, input: Record<string, any> = {}, mutationId?: string, session = this.context.session) => {
    return (await invoke(this.selection.executable, { protocol: 1, operation, context: { ...this.context, session }, input, ...(mutationId ? { mutationId } : {}) }, { timeoutMs: this.timeoutMs })).result;
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
