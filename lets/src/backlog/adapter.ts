// The backlog adapter: the primitives another backend would do differently,
// and no more. An adapter returns data or throws. It never decides what is
// ready, how work ranks, or whether a claim may go ahead: policy.ts does.

// An item is named by its key, a string only its backlog provider reads,
// and shown to a person by its label, as the backlog provider writes it.
// lets never takes a key apart.

// One item of this repository on the backlog, with its fields. It may be
// closed. free: it is open, nobody is assigned to it, and no open issue
// blocks it. created: when it was created, in ISO 8601; it may be '' for an
// item that is not free, which can never be ready.
export type Candidate = {
  key: string;
  label: string;
  title: string;
  url: string;
  kind: string | null;
  priority: string | null;
  size: string | null;
  status: string | null;
  free: boolean;
  created: string;
};

export type Ref = { key: string; label: string; title: string };
// A related issue, which can sit in another repository: its URL names it.
export type Related = Ref & { url: string };

// One issue, as the adapter reads it. A field the backlog does not set, or
// every field of an issue that is not on the backlog, is null. subIssues
// holds every sub-issue, with its state: policy.ts keeps the open ones.
export type Item = {
  key: string;
  label: string;
  title: string;
  body: string;
  url: string;
  state: string;
  kind: string | null;
  priority: string | null;
  size: string | null;
  status: string | null;
  assignees: string[];
  blockedBy: (Related & { state: string })[];
  parent: (Related & { body: string }) | null;
  subIssues: (Related & { state: string })[];
};

// The Status values the claim writes.
export type Status = 'Todo' | 'In Progress';

// One active session claim, ordered by the backend's comment ID.
export type Claim = { id: number; login: string; token: string };

export type Adapter = {
  listCandidates(): Promise<Candidate[]>;
  readItem(key: string): Promise<Item>;
  searchTitles(words: string): Promise<Ref[]>;
  // The login of each user assigned to the item.
  assignees(key: string): Promise<string[]>;
  signedInLogin(): Promise<string>;
  claims(key: string): Promise<Claim[]>;
  // The writes. Each throws WriteFailed when the write fails or times out.
  postClaim(key: string, token: string): Promise<void>;
  deleteClaim(key: string, id: number): Promise<void>;
  assignSelf(key: string): Promise<void>;
  unassignSelf(key: string): Promise<void>;
  setStatus(key: string, status: Status): Promise<void>;
  // Mark the item done, in the backlog provider's own terms. When it is
  // done already, write nothing. A failed read of whether it is done throws
  // BacklogError; a failed write throws WriteFailed.
  complete(key: string): Promise<void>;
};

// The backlog cannot answer. code is what lets backlog prints as error.
export type ErrorCode = 'no-backlog' | 'several-backlogs' | 'backend-failed' | 'not-found' | 'unknown-backlog-provider';

export class BacklogError extends Error {
  readonly code: ErrorCode;
  readonly extra: Record<string, unknown>;
  constructor(code: ErrorCode, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.extra = extra;
  }
}

// A write failed, or timed out and may have happened. The message is the
// backend's own error.
export class WriteFailed extends Error {}
