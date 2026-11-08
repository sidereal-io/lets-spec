import type { Capabilities } from './capabilities.ts';
import type { Item, Metadata } from './items.ts';
import type { Identity } from './protocol.ts';

export type WorkerContext = {
  cwd: string;
  provider: string;
  repository: string;
  backlog?: string;
  actor: string;
  session: string;
};
export type Claim = {
  assignees?: string[];
  assigneesComplete?: boolean;
  item?: Identity;
  verdict?: 'sole-actor' | 'unassigned' | 'other' | 'multiple' | 'status-mismatch' | 'unavailable' | 'pending-mutation';
  actor: string | null;
  session: string | null;
  token: string | null;
  status: string;
  guarantee: 'atomic' | 'best-effort';
};
export type Merge = { reference: string; merged: boolean; commit: string };
export type ItemPatch = { title?: string; body?: string; metadata?: Partial<Metadata> };
export type Repository = { id: string; owner: string; name: string; url: string; defaultBranch: string };
export type PullRequest = {
  id: string; repository: string; headRepository: string; number: number; url: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED'; isDraft: boolean; body: string; createdAt: string;
  baseRef: string; headRef: string; baseSha: string | null; headSha: string | null;
  mergeCommit: string | null; mergeRef: string | null;
};
export type InputMap = {
  'repository.read': Record<string, never>;
  'pull-request.read': { pullRequest?: string; branch?: string };
  'pull-request.create': { title: string; bodyFile: string; base: string; head: string; headRepository: string; item?: Identity };
  'pull-request.update': { pullRequest: string; bodyFile: string; item?: Identity };
  'pull-request.ready': { pullRequest: string; item?: Identity };
  'backlog.list': { cursor?: string };
  'backlog.create': { title: string };
  'backlog.check': Record<string, never>;
  'item.search': { query: string; cursor?: string };
  'item.read': { item: Identity; includeThread?: boolean };
  'item.create': { title: string; body: string; metadata: Metadata };
  'item.update': { item: Identity; patch: ItemPatch };
  'relationship.write': { item: Identity; target: Identity; kind: string; present: boolean };
  'relationship.list': { item: Identity; kind: string; cursor?: string };
  'candidate.list': { cursor?: string };
  'claim.acquire': { item: Identity };
  'claim.read': { item: Identity };
  'claim.release': { item: Identity; token: string };
  'reference.write': { item: Identity; reference: string };
  'completion.write': { item: Identity; merge: Merge };
  'mutation.read': { mutationId: string };
  'capability.read': Record<string, never>;
};
export type Operation = keyof InputMap;
export type BacklogRequest = {
  [O in Operation]: {
    protocol: 1;
    operation: O;
    context: WorkerContext;
    input: InputMap[O];
    mutationId?: string;
  };
}[Operation];
export type Page<T> = { items: T[]; complete: boolean; nextCursor: string | null };
export type LinkedBacklog = { provider: string; id: string; title?: string; url?: string };
export type ResultMap = {
  'repository.read': { repository: Repository };
  'pull-request.read': { pullRequest: PullRequest | null };
  'pull-request.create': { pullRequest: PullRequest };
  'pull-request.update': { pullRequest: PullRequest };
  'pull-request.ready': { pullRequest: PullRequest };
  'backlog.list': Page<LinkedBacklog>;
  'backlog.create': { backlog: string };
  'backlog.check': { valid: boolean; gaps: unknown[] };
  'item.search': Page<Item>;
  'item.read': { item: Item };
  'item.create': { item: Item };
  'item.update': { item: Item };
  'relationship.write': { present: boolean };
  'relationship.list': Page<{ identity: Identity; status: string }>;
  'candidate.list': Page<Item>;
  'claim.acquire': { claim: Claim };
  'claim.read': { claim: Claim };
  'claim.release': { released: boolean };
  'reference.write': { reference: string };
  'completion.write': { status: string };
  'mutation.read': {
    state: 'applied' | 'absent' | 'unknown';
    result?: Record<string, unknown>;
  };
  'capability.read': { capabilities: Capabilities };
};
export type BacklogCall = <O extends Operation>(
  operation: O,
  input: Record<string, unknown>,
  mutationId?: string,
  worker?: { actor: string; session: string },
) => Promise<ResultMap[O]>;

export type BacklogResponse =
  | { protocol: 1; ok: true; result: Record<string, unknown> }
  | {
      protocol: 1;
      ok: false;
      error: {
        category: import('./errors.ts').ErrorCategory;
        message: string;
        effects: 'none' | 'partial' | 'unknown';
      };
    };
