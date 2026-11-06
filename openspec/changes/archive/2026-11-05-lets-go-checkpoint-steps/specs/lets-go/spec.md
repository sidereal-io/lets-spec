## ADDED Requirements

### Requirement: Each numbered list in lets-go starts at 1 under its heading
In `skills/lets-go/SKILL.md` and every `skills/lets-go/references/*.md`, the first numbered item after each heading, outside fenced code blocks, SHALL be numbered `1.`. A list SHALL not carry on its numbers from the list under an earlier heading. *Check the prerequisite* SHALL number its steps 1 to 4, and *Check the checkpoint* SHALL number its steps from 1. Where one of these sections sends the agent to the other, it SHALL name the other section and link to it, and SHALL not refer to it by step number. The skill-interfaces check SHALL fail when a heading's first numbered item is not `1.`, and its output SHALL name the file, the heading and the number found.

#### Scenario: The checkpoint steps start at 1
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** the first numbered item after `#### Check the checkpoint` is `1.`, and the check passes

#### Scenario: A list that carries on across a heading
- **WHEN** a skills folder holds `lets-go/SKILL.md` with `### Steps` followed by `5. Read the base.`
- **THEN** the numbering check fails, and its output names `SKILL.md`, `### Steps` and `5.`

#### Scenario: A number inside a code block
- **WHEN** a heading is followed by a fenced code block whose first line is `5. not a step`, and then by `1. Read the base.`
- **THEN** the numbering check passes

### Requirement: The checkpoint names the prerequisite check it repeats
*Check the checkpoint* SHALL end by saying that, when the owner of the glossary definitions or the proposed base changed since *Find the source of demand* ran *Check the prerequisite*, the agent runs [Check the prerequisite](#check-the-prerequisite) again, before *Claim* claims the issue. It SHALL name that section and link to it. It SHALL not say `repeat steps 1 to 3`, and SHALL not say to go on with the packet, blocker and routing checks, which *Start* ran before *Claim*. When that second run finds an unresolved prerequisite, `lets-go` SHALL report it and stop, claiming nothing, whether the user named the issue or `next` picked it.

#### Scenario: The rerun is named
- **WHEN** the skill-interfaces test reads *Check the checkpoint* in `lets-go`
- **THEN** it finds a link to `#check-the-prerequisite` there, and no file of `lets-go` says `repeat steps 1 to 3` or `Go on with the normal packet, blocker and routing checks`

#### Scenario: The owner changed after next picked the story
- **WHEN** `next` picked #152, *Check the checkpoint* runs inside *Claim* step 2, and #152's glossary owner has changed to #150, whose pull request has not merged
- **THEN** `lets-go` runs *Check the prerequisite* again, reports that #150 owns the definitions and has not merged, and stops without assigning #152 or creating a branch

### Requirement: A failed checkpoint check stops before the claim and repairs nothing
Each check in *Check the checkpoint* that fails SHALL make `lets-go` report what it found and stop, before *Claim* assigns the issue or creates a branch. The run SHALL repair nothing: it SHALL not recover a missing commit, resolve a patch, drop or rewrite a commit, or change the working tree. The checks that stop are:

- a checkpoint commit or the recorded head is missing, or exists only in a local checkout;
- the range from the base to the head holds a merge, a commit that is not recorded, or a commit that touches a path other than the recorded glossary paths;
- the context the commits need is not on the proposed base;
- the owned paths do not match the shaping baseline;
- the rehearsal finds a partial or conflicting patch.

An edit that the rehearsal finds already present on the base SHALL not be a failure: the import skips it. *Check the checkpoint* SHALL not say `Resolve a partial or conflicting patch` or `do not claim until it is recovered`.

#### Scenario: A missing checkpoint
- **WHEN** the **Glossary handoff** of #152 records a checkpoint commit that `git cat-file -e` cannot find after the recorded branch is fetched
- **THEN** `lets-go` reports the missing commit, and stops without assigning #152 or creating a branch

#### Scenario: A conflicting patch
- **WHEN** the rehearsal in `.workspace/` finds that a checkpoint commit conflicts with `openspec/glossary.md` on the proposed base
- **THEN** `lets-go` reports the conflict, and stops without assigning the issue, creating a branch or editing the glossary

#### Scenario: An edit already present
- **WHEN** the rehearsal finds that the base already holds one of two checkpoint commits, and the other applies cleanly
- **THEN** `lets-go` goes on to claim the issue, and the import skips the commit already present

#### Scenario: The wording that repairs is gone
- **WHEN** the skill-interfaces test reads `lets-go`
- **THEN** no file of `lets-go` says `Resolve a partial or conflicting patch` or `do not claim until it is recovered`, and *Check the checkpoint* says to stop where a check fails
