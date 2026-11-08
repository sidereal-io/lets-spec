import { validateResponse } from './protocol.ts';
import type { PullRequest } from './types.ts';

/** Match the GitHub CLI's qualified branch lookup: open first, then newest. */
export function selectPullRequest(candidates: unknown[], scope: {
  repository: string; branch: string; headRepository?: string;
}): PullRequest | null {
  for (const pullRequest of candidates)
    validateResponse({ protocol: 1, ok: true, result: { pullRequest } }, 0, 'pull-request.read');
  const matches = (candidates as PullRequest[]).filter((pr) => pr !== null &&
    pr.repository === scope.repository && pr.headRef === scope.branch &&
    pr.headRepository === (scope.headRepository ?? scope.repository));
  return matches.toSorted((a, b) => Number(b.state === 'OPEN') - Number(a.state === 'OPEN') ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;
}
