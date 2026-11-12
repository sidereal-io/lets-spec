// The backlog adapter: the primitives another backend would do differently,
// and no more. An adapter returns data or throws. It never decides what is
// ready, how work ranks, or whether a claim may go ahead: policy.ts does.

// One item of this repository on the backlog, with its fields. It may be
// closed. free: it is open, nobody is assigned to it, and no open issue
// blocks it.
export type Candidate = {
  number: number;
  title: string;
  url: string;
  kind: string | null;
  priority: string | null;
  size: string | null;
  status: string | null;
  free: boolean;
};

export type Ref = { number: number; title: string };
// A related issue, which can sit in another repository: its URL names it.
export type Related = Ref & { url: string };

// One issue, as the adapter reads it. A field the backlog does not set, or
// every field of an issue that is not on the backlog, is null. subIssues
// holds every sub-issue, with its state: policy.ts keeps the open ones.
export type Item = {
  number: number;
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
  readItem(issue: number): Promise<Item>;
  searchTitles(words: string): Promise<Ref[]>;
  // The login of each user assigned to the issue.
  assignees(issue: number): Promise<string[]>;
  // The writes. Each throws WriteFailed when the write fails or times out.
  signedInLogin(): Promise<string>;
  postClaim(issue: number, token: string): Promise<void>;
  claims(issue: number): Promise<Claim[]>;
  deleteClaim(issue: number, id: number): Promise<void>;
  assignSelf(issue: number): Promise<void>;
  unassignSelf(issue: number): Promise<void>;
  setStatus(issue: number, status: Status): Promise<void>;
};

// The backlog cannot answer. code is what lets backlog prints as error.
export type ErrorCode = 'no-backlog' | 'several-backlogs' | 'gh-failed' | 'not-found';

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
