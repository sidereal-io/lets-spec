## 1. A brief waiting status

- [ ] 1.1 [easy] A `t3` review whose run reads `waiting` with no pending request on one poll, then `completed` with a final message and no proposed plan on the next, returns that message. `waitForText` stops treating `run.status === 'waiting'` alone as a question, and its comment says why (verify: node --test tests/lets/resolvers/t3/t3.test.ts)
- [ ] 1.2 [easy] A `t3` review whose thread holds a pending request fails at once with `the session stopped to ask (thread <id>)`, both while the run is `waiting` and while it is `running`. The test *run fails when the session stops to ask* holds a pending request in both cases (verify: node --test tests/lets/resolvers/t3/t3.test.ts)
- [ ] 1.3 [easy] A `t3` review whose run stays `waiting` with no pending request past its time limit fails with `TimeoutError`, naming the thread (verify: node --test tests/lets/resolvers/t3/t3.test.ts)
- [ ] 1.4 [easy] `docs/resolvers.md`'s `t3` section has one bullet, after the one on refusals: a review exits 5 when the session asks a question and waits for an answer, the thread stays so you can answer it in T3 Code, and a run T3 shows as `waiting` for a moment does not count (verify: grep -n "waiting" docs/resolvers.md)

## 2. Integration [depends-on: 1]

- [ ] 2.1 [easy] Every project check passes (verify: pnpm test && nix flake check && mise run check)

## Deviations Ledger
