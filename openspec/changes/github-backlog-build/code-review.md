# Code review

Reviewed: main a0aef6b64081bca8f250d031a6dc81ea8d5ba850..397647efb5511c3fa653e3989675bf7d7e1f9e2e

Reviewer: claude/claude-opus-5-5, fresh context, high effort. Independent: yes.
The reviewer worked read-only and ran no checks. The working tree stayed clean.
No REVIEW.md exists, so there were no additional repository review rules.

1. **High — default deadline. CONFIRMED**, fixed in `bc12feb`. GitHub workflow
   calls now default to a bounded 180-second deadline; the bare transport and
   other providers retain five seconds. A latency-injected CLI regression
   reproduces the old mid-claim interruption and passes with the new deadline.
   Read timeouts now report transient/no effects, while interrupted writes
   remain unknown.
2. **Medium — stuck desired-write keys. PARTLY CONFIRMED**, fixed in `bd23eae`
   for conclusive no-effect provider rejections. Their journal state now allows
   original-key retries after fresh ownership and state checks, for PR fields,
   completion and glossary body patches. Reference and glossary regressions
   verify the retry. **REFUTED in part:** an actually unknown outcome must not
   be declared absent or blindly retried merely because the desired value is
   not visible. The contract's Recovery section says unknown blocks retries
   and progression; design decision 5 requires conclusive pre-write evidence
   for absence. Those guards remain, and lost-response tests still cover
   reconciliation when current remote state proves application.
3. **Medium — published continuation handle. CONFIRMED**, fixed in `bc58f9e`.
   The private handle is distinct from the published session and token.
   Resume tests reject using the visible session. Raw CLI mutations require
   the original private handle, validated locally and omitted from the adapter
   request. The executable protocol remains a trusted-caller boundary, as the
   contract specifies; it does not authenticate direct provider writers.
4. **Medium — missing post-merge route. CONFIRMED**, fixed in `73080a9`.
   Explicit completion handoffs run before new demand, including on the
   default branch. The archived route now invokes completion. The skill keeps
   private continuation input and gives the user a concrete follow-up prompt;
   it never discovers authority by scanning shared Git storage. The source
   interface regression checks this route.
5. **Low — closing-number prefix collision. CONFIRMED**, fixed in `1351ee6`.
   A complete closing line must match the exact display reference. The caller
   regression starts with `Closes #20` and requires a separate `Closes #2`.
6. **Low — partial-provenance candidate starvation. CONFIRMED**, fixed in
   `75fe30e`. Next selection excludes active or malformed claim provenance
   even before assignment. A two-item executable test proves that the next
   eligible issue is selected instead.

Each fix commit addresses only its listed finding. Full repository and release
checks are rerun after the fixes. The live test PR was merged by the user;
completion and its idempotent replay both returned Done for the recorded item.
