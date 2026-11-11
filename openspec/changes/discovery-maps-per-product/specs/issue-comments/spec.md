## MODIFIED Requirements

### Requirement: Revision mode reads the thread of each open story the map links
In Revision mode step 1, after the stale-link check and before it re-annotates the stages, `lets-shape` SHALL read the thread of each open issue the map links. The map is the run's map: in a repository with several products, the map of the run's product, and no other product's map. It SHALL take the issues from the map's `issues/<n>` links, keep the ones the issue list reports as open, and handle them one at a time in ascending number. For each issue it SHALL fetch the thread as the reference says and show the reference's list. It SHALL ask about each comment not labelled `read`. It SHALL write the fold and the map change the answers call for. When it asked at least one question on the issue, it SHALL fetch again until nothing is new, and then reply. It SHALL not read closed issues, or open issues the map does not link.

#### Scenario: Two open stories and a closed one
- **WHEN** the map links #87 and #102, which are open, and #26, which is closed
- **THEN** shaping shows the thread of #87, then of #102, and does not fetch the thread of #26

#### Scenario: A story with no comments
- **WHEN** an open linked story has no comments
- **THEN** shaping asks nothing about it, posts no reply on it, and moves to the next issue

#### Scenario: Another product's story
- **WHEN** the run uses `openspec/discovery/web-shop.md`, which links the open issue #87, and `openspec/discovery/warehouse.md` links the open issue #90
- **THEN** shaping shows the thread of #87, and does not fetch the thread of #90

#### Scenario: The skill says it
- **WHEN** the skill-interfaces test reads `skills/lets-shape/SKILL.md`
- **THEN** it finds the sentence `Read the thread of each open issue the map links`
