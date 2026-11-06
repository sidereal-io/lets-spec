<!-- Five tasks, in order, all in skills/lets-go/SKILL.md and tests/skill-interfaces.bats.
     Each task writes its bats check first, watches it fail, then edits the skill.
     The quoted phrases are the wording the tests pin; keep them word for word.
     Keep the file's 72-column wrap. skill_says folds white space, so a pinned
     phrase may wrap. Edit skills/lets-go/SKILL.md, never .agents/skills/. -->

## 1. The blocker rule comes before the call

- [ ] 1.1 [medium] *Start* step 3 reads the blockers with `gh issue view <i> --json title,blockedBy`, looks for the change's branch when one is open, and decides, before it runs *Find the source of demand*: with the branch, it names the open blockers and goes on; with no branch, it says which open issues block #<i> and stops. A new bats test, "lets-go states the blocker rule before it finds the source of demand", checks that, in *Start*, the blocker read comes before the call to *Find the source of demand* (D2) (verify: bats tests/skill-interfaces.bats -f 'blocker rule')
- [ ] 1.2 [easy] Case 1 of *Find the source of demand* takes the named issue and makes no blocker stop: it says "*Start* step 3 has read its blockers already", and no longer says "If an open issue blocks it, say so and stop". The check goes in the new test (D3) (verify: bats tests/skill-interfaces.bats -f 'blocker rule')
- [ ] 1.3 [easy] *Start* step 3 names the stop that still applies on a stacked branch: when *Check the prerequisite* finds an unresolved owner or checkpoint, "the prerequisite stop stands, even on a stacked branch". The pinned phrase in the test "lets-go picks the level from the Kind and relays at ask" becomes this one, and the skill no longer says "its stop stands" (D4, D7) (verify: bats tests/skill-interfaces.bats -f 'relays at ask')
- [ ] 1.4 [easy] *Find the source of demand* ends by returning, not by choosing the next section: "Otherwise, go on to [Confirm the packet](#confirm-the-packet)." becomes "go back to the step of *Start* that ran it", and *Start* step 3 ends by going on to step 4. The check goes in the new test (D5) (verify: bats tests/skill-interfaces.bats -f 'blocker rule')
- [ ] 1.5 [easy] The whole suite and the flake pass with the new wording: the Node tests, the type check, every bats test, and every flow and release build (verify: pnpm test && nix flake check)
