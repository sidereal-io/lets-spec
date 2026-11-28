<!-- Plain language: Each task must make sense to an agent and reviewer without the planning conversation. Name an observable outcome, its location when needed, and how to verify it. Preserve checkbox syntax and tags. -->

<!-- Every task edits skill prose or the README; no task changes code.
     Test first means: run the task's verify command before the edit
     and see it fail, then make the edit and see it pass. The spec
     delta is already written: archive applies it, and no task edits
     openspec/specs/. design.md's Decisions say what each edit says.
     "Where the run is" means a sentence about the checkout the run is
     in; leave every sentence that means the branch <default> itself,
     such as a start point or a pull request's base (design.md,
     Decision 4). -->

## 1. The term

- [x] 1.1 [easy] `skills/lets-go/references/terms.md` holds a `## Checkout at the default branch` entry whose text is the `openspec/glossary.md` entry of the same name, word for word (design.md, Decision 5) (verify: `grep -q '^## Checkout at the default branch$' skills/lets-go/references/terms.md && node --test tests/contracts/terms.test.ts`) (✓ grep and `node --test tests/contracts/terms.test.ts` passed)

## 2. lets-go's SKILL.md [depends-on: 1]

- [x] 2.1 [medium] *Read the settings* in `skills/lets-go/SKILL.md` decides, once, whether the run is in a checkout at the default branch, and links the term to `references/terms.md#checkout-at-the-default-branch` there; task 2.3 links the earlier, first mention. On the default branch it runs no check. When the request starts with `You run a story run of a lets-go epic run:`, it runs no check either. On another branch it runs, in order and stopping at the first that fails: `lets backlog find <branch>`, keeping the matches for the entry table; `git status --porcelain -- . ':(exclude).workspace'`; then `git fetch origin <default>` and `git rev-parse HEAD origin/<default>`. A failed fetch shows Git's error and stops, claiming nothing. The run keeps the answer to its end (design.md, Decisions 1 to 3) (verify: `grep -qF "git status --porcelain -- . ':(exclude).workspace'" skills/lets-go/SKILL.md && grep -qF 'git rev-parse HEAD origin/<default>' skills/lets-go/SKILL.md && node --test tests/contracts/links.test.ts tests/contracts/fields.test.ts`) (✓ both greps and `node --test tests/contracts/links.test.ts tests/contracts/fields.test.ts` passed)
- [x] 2.2 [medium] *Read the request* in `skills/lets-go/SKILL.md` reads that answer: the entry table's first row is `A checkout at the default branch`, the prose around the table says "in a checkout at the default branch" where it said the run is on the default branch, the change's-branch search reads the matches *Read the settings* kept instead of running `lets backlog find <branch>` again, and the `<branch>` placeholder row says "when the checkout is not at the default branch" (design.md, Decision 4) (verify: `grep -qF '| A checkout at the default branch |' skills/lets-go/SKILL.md && grep -qF 'when the checkout is not at the default branch' skills/lets-go/SKILL.md && node --test tests/contracts/links.test.ts tests/contracts/fields.test.ts`) (✓ both greps and `node --test tests/contracts/links.test.ts tests/contracts/fields.test.ts` passed)
- [x] 2.3 [medium] The rest of `skills/lets-go/SKILL.md` acts in a checkout at the default branch as on the default branch: the opening resume bullets, whose mention of the term, now the first in `SKILL.md`, links `references/terms.md#checkout-at-the-default-branch` too, *Check the issue*'s `epic` case and its Next line, *Enter the branch* step 1, and *Claim* step 4, which creates `<name>` off `<default>` and, outside an epic run, switches this checkout to it. Each "stays on `<default>`" in *Enter the branch*, *The story's worktree* and *Claim* says "stays where it is" (design.md, Decisions 4 and 6; D5) (verify: `! grep -n 'stays on' skills/lets-go/SKILL.md && node --test tests/contracts/links.test.ts`) (✓ `! grep -n 'stays on' skills/lets-go/SKILL.md` and `node --test tests/contracts/links.test.ts` passed)

## 3. The reference files and the README [depends-on: 1]

- [ ] 3.1 [parallel] [easy] `skills/lets-go/references/epic-run.md` says the epic run's own checkout "stays where it is", in its opening paragraph and at the end of *A stop in an epic run*, and *Report the maps' edits* says the edits are uncommitted in the epic run's checkout, not on the default branch (verify: `! grep -n 'stays on\|uncommitted on the default branch' skills/lets-go/references/epic-run.md`)
- [ ] 3.2 [parallel] [easy] `skills/lets-go/references/shape.md` says where the run is as a checkout at the default branch: *Run the shape step* runs in a checkout at the default branch, *Name the maps' edits* and *Commit the discovery map* say the edits are in this checkout, and step 4 of *Commit the map in an epic run* says the checkout "stays clean". "From the committed default branch" in *Commit the map in an epic run* stays, because it names the branch itself (verify: `! grep -n 'on the default branch\|stays clean on' skills/lets-go/references/shape.md`)
- [ ] 3.3 [parallel] [easy] *Take up the story run* in `skills/lets-go/references/story-run.md` says that a story run's child checks only that `<branch>` is `<name>`, and does not read whether its checkout is at the default branch (verify: `grep -q 'checkout at the default branch' skills/lets-go/references/story-run.md`)
- [ ] 3.4 [parallel] [easy] The `lets-go` section of `README.md` says that `lets-go` also runs from a checkout at the default branch, such as a T3 Code worktree on a branch of its own, that an epic run's own checkout stays where it is, and that a stopped discovery whose map edits are uncommitted resumes only from a checkout on the default branch itself (design.md, Risks) (verify: `grep -q 'checkout at the default branch' README.md && ! grep -n 'stays on the$' README.md`)

## 4. Integration [depends-on: 2, 3]

- [ ] 4.1 [medium] Every check passes: `pnpm test`, `mise run check` and `nix flake check`. `grep -rn 'stays on' skills/lets-go` finds nothing, and `skills/lets-plan/` and `skills/lets-build/` are unchanged from `main` (D3) (verify: `nix flake check`)

## Deviations Ledger

<!-- Dated notes on small departures from the plan, written during apply. Stop and ask the user about a large one. -->
