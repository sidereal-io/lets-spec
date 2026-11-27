# Discovery: Let's Spec

> The living map behind the backlog: who the product serves and the journeys it supports.
> Stories are GitHub issues; each discovery run's scope and decisions live in its parent issue.

## Personas

### People who use Let's Spec

#### Mo — maintainer of a project that uses Let's Spec

- **Who**: a developer who plans with AI coding agents across several repositories
- **Goal**: the same planning rules in every repository, followed by the agents
- **Pain today**: each project keeps its own copy of the rules and the copies drift apart; agents jump to code before anyone has planned
- **Success looks like**: a change goes from idea to merged pull request with a plan and a second opinion, in every repository, without hand-fixing the tooling first

### People who build Let's Spec

#### Andrew — maintainer of Let's Spec

- **Who**: the person who writes the skills and the `lets` command, and releases them
- **Goal**: see the workflow fail on their own repository before a user does
- **Pain today**: a workflow tool is hard to test without running it for real on a project
- **Success looks like**: this repository plans every change with Let's Spec, and each release carries the fixes that found

> **Implication**: Andrew walks Mo's journey on this repository after every release. A stage that is partial for Mo is partial for Andrew too, so the maintainer feels each gap first.

## Journey Map

Stage status checked against the code on 2026-11-25.

### People who use Let's Spec

**Plan and build with agents** (Mo):

```
  Set it up ──► Set up the backlog ──► Shape ──► Build ──► Review ──► Merge ──► Update
      │               │                 │          │          │          │         │
   partial         partial           partial    partial    partial   supported supported
```

1. **Set it up** — install with Nix or mise, run `lets sync`, describe the project — partial: setup remains several documented steps run by hand; flow and skills mode live outside the project's config ([#65](https://github.com/sidereal-io/lets-spec/issues/65)).
2. **Set up the backlog** — create or check the repository's linked GitHub Project — partial: GitHub Project creation and field checks exist, but setup does not converge views, options and workflows ([#65](https://github.com/sidereal-io/lets-spec/issues/65)). Shared GitHub setup ([#137](https://github.com/sidereal-io/lets-spec/issues/137)) and selection/checking for Beads ([#138](https://github.com/sidereal-io/lets-spec/issues/138)), Linear ([#140](https://github.com/sidereal-io/lets-spec/issues/140)) and Jira Cloud ([#142](https://github.com/sidereal-io/lets-spec/issues/142)) remain open.
3. **Shape** — turn an idea, bug or chore into GitHub issues with packets and dependencies — partial: GitHub shaping reads comments and folds accepted decisions into packets. Publishing and resuming discovery through the shared boundary remains open for GitHub ([#137](https://github.com/sidereal-io/lets-spec/issues/137)), Beads ([#139](https://github.com/sidereal-io/lets-spec/issues/139)), Linear ([#141](https://github.com/sidereal-io/lets-spec/issues/141)) and Jira Cloud ([#144](https://github.com/sidereal-io/lets-spec/issues/144)); shaping a single Jira Cloud packet is also open ([#143](https://github.com/sidereal-io/lets-spec/issues/143)).
4. **Build** — select and claim a ready GitHub issue, then plan and build it through a pull request — partial: GitHub selection, claiming and OpenSpec handoff exist; packet checks detect unread comments and brainstorm can cite confirmed comment evidence. The Beads ([#138](https://github.com/sidereal-io/lets-spec/issues/138)), Linear ([#140](https://github.com/sidereal-io/lets-spec/issues/140)) and Jira Cloud ([#142](https://github.com/sidereal-io/lets-spec/issues/142)) paths remain open. From a T3 Code session, an epic run needs help by hand: story runs do not start ([#325](https://github.com/sidereal-io/lets-spec/issues/325)), a step that waits on a background review is read as failed ([#326](https://github.com/sidereal-io/lets-spec/issues/326)), the run does not start from a T3 worktree ([#340](https://github.com/sidereal-io/lets-spec/issues/340)), `auto` can answer a question the packet leaves to the user ([#341](https://github.com/sidereal-io/lets-spec/issues/341)), and waves wait over paths only read ([#343](https://github.com/sidereal-io/lets-spec/issues/343), [#345](https://github.com/sidereal-io/lets-spec/issues/345)).
5. **Review** — plan and code reviews request a fresh session and prefer another family, using the models the resolver reports — partial: review plan guesses the plan author's family when `lets-go` ran the plan ([#342](https://github.com/sidereal-io/lets-spec/issues/342)).
6. **Merge** — the user merges the pull request; archive is the last commit — supported.
7. **Update** — move the pin, sync and commit — supported.

### People who build Let's Spec

**Release and dogfood** (Andrew):

```
  Change ──► Release ──► Bump the pin here ──► Walk Mo's journey
     │          │               │                     │
  partial   supported        partial               partial
```

1. **Change** — plan, implement and check one issue on one branch and pull request — partial: a reworded sentence and a refactor no longer break tests, but bats still runs ([#313](https://github.com/sidereal-io/lets-spec/issues/313)), no test runs `lets` commands in sequence ([#321](https://github.com/sidereal-io/lets-spec/issues/321)), and no test checks the fields a text reads from `lets backlog` ([#328](https://github.com/sidereal-io/lets-spec/issues/328)).
2. **Release** — push a tag; the workflow builds and publishes the tarball — supported.
3. **Bump the pin here** — move `mise.toml` to the release and run `lets sync` — partial: done by hand after each release.
4. **Walk Mo's journey** — use the skills for this repository's own work — partial: see Mo's journey above.

## Backlog

Stories are GitHub issues: <https://github.com/sidereal-io/lets-spec/issues>.
