load support/common

# Agents read the skills, schemas and rules, then run the commands and open
# the files they name. These tests check that every name still points at
# something real, so a rename breaks a test, not an agent.

# The text agents read.
prose() {
  printf '%s\n' "$repo"/skills/*/SKILL.md "$repo"/skills/*/references/*.md \
    "$repo"/schemas/*/schema.yaml "$repo"/schemas/*/templates/*.md "$repo"/overlays/AGENTS.md
}

# mentions <pattern>: each distinct match of the extended regex in the prose.
mentions() {
  prose | xargs grep -ohE "$1" | sort -u
}

@test "each skill is named for its folder" {
  local dir name
  for dir in "$repo"/skills/*/; do
    name="$(basename "$dir")"
    [ "$(sed -n 's/^name: //p' "$dir/SKILL.md" | head -n 1)" = "$name" ] ||
      { echo "$name/SKILL.md has another name"; false; }
  done
}

# A gh command in a code block starts its line; in a sentence it follows a
# backtick. gh answers an unknown command with its group's help, and exits
# 0, so the test reads the usage line instead.
@test "each gh command the prose names is one gh knows" {
  local group command found=0
  while read -r group command; do
    found=1
    # gh api takes an endpoint, not a command. Its help names graphql.
    if [ "$group" = api ]; then
      gh api --help 2>&1 | grep -qE "^  \\\$ gh api $command( |$)" ||
        { echo "gh api has no endpoint: $command"; false; }
      continue
    fi
    gh "$group" "$command" --help 2>&1 | grep -qE "^  gh $group $command( |$)" ||
      { echo "gh has no command: gh $group $command"; false; }
  done < <(mentions '(^ *|`)gh [a-z]+ [a-z-]+' | sed -E 's/^[ `]*gh //' | sort -u)
  [ "$found" -eq 1 ]
}

@test "each schema template the prose names exists" {
  local mention
  while IFS= read -r mention; do
    [ -f "$repo/schemas/${mention#openspec/schemas/}" ] || { echo "no such template: $mention"; false; }
  done < <(mentions 'openspec/schemas/[a-z-]+/templates/[a-z-]+\.md')
}

# flow_skills <flow>: the skills flows.json ships with the flow, one per line.
flow_skills() {
  jq -r --arg flow "$1" '.flows[$flow].skills[]' "$repo/flows.json"
}

# named_skills <file>: each name the file calls a skill, as `name` skill,
# even across a line break.
named_skills() {
  tr -s '[:space:]' ' ' <"$1" | grep -oE '`[a-z-]+` skill' | cut -d'`' -f2 | sort -u
}

# flow_texts <flow>: the files lets-spec gives a flow's agent besides its
# skills: each schema the flow ships, and the flow's config.
flow_texts() {
  local schema
  for schema in $(jq -r --arg flow "$1" '.flows[$flow].schemas[]' "$repo/flows.json"); do
    echo "$repo/schemas/$schema/schema.yaml"
  done
  echo "$repo/overlays/openspec/config.d/lets-$1.yaml"
}

# A skill no schema step calls is still reachable when another skill the
# flow ships calls it. lets-review-build is reached through lets-go's
# review build row.
@test "each skill a flow ships, other than an entry point, is named by its schema, its config or a skill the flow ships" {
  local flow skill shipped named text
  for flow in standard minimal; do
    shipped="$(flow_skills "$flow")"
    [ -n "$shipped" ] || { echo "flows.json lists no skills for $flow"; false; }
    named="$(
      for text in $(flow_texts "$flow"); do named_skills "$text"; done
      for skill in $shipped; do named_skills "$repo/skills/$skill/SKILL.md"; done
    )"
    for skill in $shipped; do
      case "$skill" in lets-go | lets-shape | lets-setup-backlog) continue ;; esac
      grep -qx "$skill" <<<"$named" ||
        { echo "$flow ships $skill, but none of its schema, config or skills name it"; false; }
    done
  done
}

@test "lets-go ships in both flows with a routing row" {
  local flow file request='Take a shaped story, bug or chore, or an idea in words, to a ready pull request in one run'
  for flow in standard minimal; do
    flow_skills "$flow" | grep -qx lets-go || { echo "$flow does not ship lets-go"; false; }
  done
  grep -qxF "| $request | The \`lets-go\` skill |" "$repo/overlays/AGENTS.md" ||
    { echo "overlays/AGENTS.md has no routing row for lets-go"; false; }
  grep -qxF "| $request | \`lets-go\` |" "$repo/README.md" ||
    { echo "README.md has no usage row for lets-go"; false; }
  for file in overlays/AGENTS.md README.md; do
    run grep -nF '| Take a shaped chore to a ready pull request in one run |' "$repo/$file"
    [ "$status" -eq 1 ] || { echo "$file keeps the chore-only row: $output"; false; }
    run grep -nF '| Take a shaped story, bug or chore to a ready pull request in one run |' "$repo/$file"
    [ "$status" -eq 1 ] || { echo "$file keeps the row without the idea: $output"; false; }
  done
}

@test "both routing tables send the next story to lets-go" {
  local file
  grep -qxF "| Start the next story, or move the current branch's change on | The \`lets-go\` skill |" "$repo/overlays/AGENTS.md" ||
    { echo "overlays/AGENTS.md has no next-story row for lets-go"; false; }
  grep -qxF '| Start the next story, or carry on the change on your current branch | `lets-go` |' "$repo/README.md" ||
    { echo "README.md has no next-story row for lets-go"; false; }
  for file in overlays/AGENTS.md README.md; do
    run grep -nE '^\| .* \| (The )?`lets-build`( skill)? \|$' "$repo/$file"
    [ "$status" -eq 1 ] || { echo "$file points a row at lets-build: $output"; false; }
  done
}

@test "nothing lets-spec ships sends the user to lets-build on the default branch" {
  run bash -c "cat '$repo'/skills/*/SKILL.md '$repo'/skills/*/references/*.md '$repo'/schemas/*/schema.yaml '$repo'/overlays/AGENTS.md | tr -s '[:space:]' ' ' | grep -oF 'run \`lets-build\` on the default branch'"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "each skill a schema or config names is one its flow ships, or a generated OpenSpec skill" {
  local flow skill text
  for flow in standard minimal; do
    for text in $(flow_texts "$flow"); do
      for skill in $(named_skills "$text"); do
        case "$skill" in openspec-*) continue ;; esac
        flow_skills "$flow" | grep -qx "$skill" ||
          { echo "${text#"$repo/"} names $skill, which the $flow flow does not ship"; false; }
      done
    done
  done
}

@test "each marker a schema reads is one its templates write" {
  local flow
  for flow in standard minimal; do
    grep -qF 'Confirmed by user:' "$repo/schemas/lets-$flow/schema.yaml" || continue
    grep -qF 'Confirmed by user:' "$repo/schemas/lets-$flow/templates/brainstorm.md" ||
      { echo "the $flow schema reads Confirmed by user:, but templates/brainstorm.md does not write it"; false; }
  done
}

# The plan review records in the pull request, so no schema has a review
# step, and nothing in a schema reads a verdict.
@test "no schema has a review step or reads a verdict" {
  local phrase
  [ ! -e "$repo/schemas/lets-standard/templates/review.md" ] ||
    { echo "schemas/lets-standard/templates/review.md still exists"; false; }
  [ -z "$(yq -r '.artifacts[] | select(.id == "review") | .id' "$repo/schemas/lets-standard/schema.yaml")" ] ||
    { echo "lets-standard still has a review artifact"; false; }
  [ "$(yq -r '.artifacts[] | select(.id == "tasks") | .requires | sort | join(",")' "$repo/schemas/lets-standard/schema.yaml")" = adr,specs ] ||
    { echo "lets-standard's tasks does not require adr and specs"; false; }
  for phrase in 'VERDICT:' 'CHANGES_APPLIED:' 'review.md'; do
    run grep -rnF -- "$phrase" "$repo/schemas"
    [ "$status" -eq 1 ] || { echo "schemas/ still says $phrase: $output"; false; }
  done
}

# schema_step <flow> <id>: the step's block in the flow's schema, on one line.
schema_step() {
  awk -v id="$2" '$0 == "  - id: " id || $0 == id ":" { on = 1; next } /^  - id: |^[a-z]+:/ { on = 0 } on' \
    "$repo/schemas/lets-$1/schema.yaml" | tr -s '[:space:]' ' '
}

@test "each flow's brainstorm says a change starts from lets-go" {
  local flow
  for flow in standard minimal; do
    grep -qF '`lets-go` picked and claimed it' <<<"$(schema_step "$flow" brainstorm)" ||
      { echo "the $flow brainstorm does not say lets-go claimed the story"; false; }
    grep -qF 'a change starts from the `lets-go` skill' <<<"$(schema_step "$flow" brainstorm)" ||
      { echo "the $flow brainstorm does not send a missing story to lets-go"; false; }
  done
}

@test "each flow's apply says lets-build runs it, and lets-review-build finishes the change" {
  local flow
  for flow in standard minimal; do
    grep -qF 'The `lets-build` skill runs this step.' <<<"$(schema_step "$flow" apply)" ||
      { echo "the $flow apply does not name lets-build"; false; }
    grep -qF 'When every task is done, stop. The `lets-review-build` skill finishes the change.' <<<"$(schema_step "$flow" apply)" ||
      { echo "the $flow apply does not stop for lets-review-build"; false; }
  done
  grep -qF '`lets-go` has the plan reviewed with the `lets-review-plan` skill' <<<"$(schema_step standard apply)" ||
    { echo "the standard apply does not say lets-go has the plan reviewed"; false; }
}

@test "no schema names Finish the change" {
  run grep -rnF 'Finish the change' "$repo/schemas"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "lets-review-plan runs as lets-go's review plan step" {
  skill_says lets-review-plan "\`lets-go\`'s review plan step"
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-review-plan/SKILL.md" | grep -qF -- "\`lets-go\`'s build step" ||
    { echo "lets-review-plan still runs in lets-go's build step"; false; }
  run grep -nF 'lets-build' "$repo/skills/lets-review-plan/SKILL.md"
  [ "$status" -eq 1 ] || { echo "lets-review-plan still names lets-build: $output"; false; }
}

@test "each flow's brainstorm says comments are evidence" {
  local flow step
  for flow in standard minimal; do
    step="$(awk '/^  - id: brainstorm$/ { on = 1; next } /^  - id: / { on = 0 } on' "$repo/schemas/lets-$flow/schema.yaml" | tr -s '[:space:]' ' ')"
    grep -qF 'comments are evidence' <<<"$step" ||
      { echo "the $flow schema's brainstorm step does not say comments are evidence"; false; }
    grep -qF 'Evidence: #<n> comment (<author>, <date>)' "$repo/schemas/lets-$flow/templates/brainstorm.md" ||
      { echo "the $flow brainstorm template does not name the comment source"; false; }
  done
}

@test "every instruction block is a literal block, so its line breaks survive" {
  local schema
  for schema in "$repo"/schemas/*/schema.yaml; do
    [ "$(grep -c '^ *instruction:' "$schema")" -eq "$(grep -c '^ *instruction: |$' "$schema")" ] ||
      { echo "$schema has an instruction that is not a literal block"; false; }
    [ "$(grep -c '^ *instruction: |$' "$schema")" -ge 3 ] ||
      { echo "$schema has fewer instruction blocks than any flow needs"; false; }
  done
}

@test "the prose has no trailing whitespace" {
  run grep -n '[[:space:]]$' $(prose)
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "each skill that delegates to a subagent says exit 3 also means no resolver started a session" {
  for skill in lets-review-build lets-review-plan lets-go; do
    grep -q '\*\*3\*\*: no fresh session can run here, for example because no resolver started one' \
      "$repo/skills/$skill/SKILL.md" || { echo "$skill"; false; }
  done
}

@test "each lets delegate review, handoff or step the prose names is followed by instructions or run" {
  run bash -c "$(declare -f prose); repo='$repo'; prose | xargs grep -ohE 'lets delegate (review|handoff|step)( [^ \`]+)?' | grep -vE 'lets delegate (review|handoff|step) (instructions|run)$'"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "the docs name lets delegate review, handoff or step only with instructions or run" {
  run bash -c "grep -ohE 'lets delegate (review|handoff|step)( [^ \`]+)?' '$repo/README.md' '$repo'/docs/*.md | grep -vE 'lets delegate (review|handoff|step) (instructions|run)$'"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "one page describes each resolver, and the README links to each section" {
  for name in t3 cli subagent; do
    grep -qx "## \`$name\`" "$repo/docs/resolvers.md" || { echo "no section for $name"; false; }
    grep -qF "(docs/resolvers.md#$name)" "$repo/README.md" || { echo "no README link to $name"; false; }
  done
  grep -qx '### After a t3 update' "$repo/docs/resolvers.md"
  grep -qF '(docs/resolvers.md#after-a-t3-update)' "$repo/README.md"
  [ ! -e "$repo/docs/resolvers" ]
}

@test "the README's warning about #58 is gone" {
  run grep -n 'issues/58' "$repo/README.md"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "the README names where the guidance lives, and --for" {
  grep -qF 'delegate.<strategy>.<intent>.guidance' "$repo/README.md"
  grep -qF -- '--for' "$repo/README.md"
}

# skill_says <skill> <fixed text>: the skill's SKILL.md holds the text,
# which may wrap across lines.
skill_says() {
  tr -s '[:space:]' ' ' < "$repo/skills/$1/SKILL.md" | grep -qF -- "$2" || { echo "$1 does not say: $2"; return 1; }
}

@test "each review skill asks lets for its intent's options, then runs with a ranked list" {
  for pair in lets-review-plan:plan lets-review-build:code; do
    skill="${pair%%:*}" intent="${pair##*:}"
    skill_says "$skill" "lets delegate review instructions --for $intent"
    skill_says "$skill" "lets delegate review run --for $intent"
    skill_says "$skill" "--model <first> --model <second>"
    skill_says "$skill" "delegate.review.$intent.guidance"
  done
}

@test "lets-review-plan starts from the change alone" {
  grep -qx '## Start' "$repo/skills/lets-review-plan/SKILL.md" || { echo "lets-review-plan has no Start"; false; }
  skill_says lets-review-plan "git log --format='%(trailers:key=Co-Authored-By,valueonly)'"
}

@test "lets-review-plan records in the pull request, and checks an earlier review" {
  local phrase
  skill_says lets-review-plan 'Reviewed: <sha>'
  skill_says lets-review-plan '**Plan review**'
  skill_says lets-review-plan '- **Verdict:**'
  skill_says lets-review-plan '## Check an earlier review'
  skill_says lets-review-plan 'git merge-base --is-ancestor <sha> HEAD'
  skill_says lets-review-plan 'git log --oneline <sha>..HEAD -- openspec/changes/<name>/ docs/decisions/'
  skill_says lets-review-plan "':(exclude)openspec/changes/<name>/tasks.md'"
  skill_says lets-review-plan '`openspec-update-change` skill'
  skill_says lets-review-plan 'each fix commit holds up'
  for phrase in 'review.md' '`review` artifact' '`review` instruction'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-review-plan/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-review-plan still says: $phrase"; false; }
  done
}

@test "lets-review-build records its review in its own section of the pull request" {
  skill_says lets-review-build 'Reviewed: <base> <base-sha>..<head-sha>'
  skill_says lets-review-build '**Code review**'
  skill_says lets-review-build '## Code review'
  skill_says lets-review-build 'gh pr edit --body-file'
}

@test "lets-review-build finishes the change after its review" {
  skill_says lets-review-build 'operationGuidance'
  skill_says lets-review-build '`openspec-verify-change` skill'
  skill_says lets-review-build '`openspec-archive-change` skill'
  skill_says lets-review-build 'gh pr ready'
}

@test "each review skill ranks by the guidance, then other families, then the order given" {
  for skill in lets-review-build lets-review-plan; do
    skill_says "$skill" "the guidance first, then families other than the author's, then the order the options came in"
  done
}

@test "each review skill takes the subagent step when there are no options" {
  for skill in lets-review-build lets-review-plan; do
    skill_says "$skill" "When \`options\` is empty, whatever the resolver, skip the command and take the [subagent step]"
  done
}

@test "each skill that delegates lets the guidance only rank and filter models" {
  for skill in lets-review-build lets-review-plan lets-go; do
    skill_says "$skill" "The guidance only ranks and filters the listed models"
  done
}

@test "lets-build runs openspec-apply-change test-first" {
  skill_says lets-build '`openspec-apply-change` skill'
  skill_says lets-build '`lets-test-first` skill'
}

@test "lets-build is the build step and nothing else" {
  local phrase
  for phrase in 'Finish the change' 'gh project' 'lets delegate' 'lets-review-plan' 'Find the source of demand'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-build/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-build still says: $phrase"; false; }
  done
}

@test "lets-build sends each state it does not build to the skill that handles it" {
  skill_says lets-build 'Say that `lets-go` starts an issue, and stop.'
  skill_says lets-build 'run the `lets-plan` skill'
  skill_says lets-build 'the `lets-review-build` skill finishes the change'
}

@test "nothing lets-spec ships names a section of lets-build" {
  run grep -rnF "\`lets-build\`'s *" "$repo/skills" "$repo/schemas" "$repo/overlays"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "lets-go keeps its steps in one table, under the pinned header" {
  skill_says lets-go '| Step | Skill | Done when | Record | Skip line |'
  run grep -cxF '| Step | Skill | Done when | Record | Skip line |' "$repo/skills/lets-go/SKILL.md"
  [ "$output" -eq 1 ] || { echo "lets-go has $output step tables"; false; }
}

@test "lets-go's review plan row runs the lets-review-plan skill" {
  grep -qF '`lets-review-plan` skill' <<<"$(step_row review-plan)" || { echo "the review plan row does not run lets-review-plan"; false; }
}

@test "lets-go's build row runs the lets-build skill on every schema" {
  grep -qF '`lets-build` skill' <<<"$(step_row build)" || { echo "the build row does not run lets-build"; false; }
  ! grep -qF 'lets-review-plan' <<<"$(step_row build)" || { echo "the build row names lets-review-plan"; false; }
}

# review_build_start: lets-review-build's Start section, on one line.
review_build_start() {
  awk '/^## Start$/ { on = 1; next } /^## / { on = 0 } on' "$repo/skills/lets-review-build/SKILL.md" | tr -s '[:space:]' ' '
}

@test "lets-review-build reviews the code when the flow's schema is lets-standard" {
  local phrase
  for phrase in 'openspec/config.yaml' '`lets-standard`' '[run the review](#run-the-review)'; do
    grep -qF -- "$phrase" <<<"$(review_build_start)" || { echo "lets-review-build's Start does not say: $phrase"; false; }
  done
}

@test "lets-review-build finishes at once on any other schema" {
  grep -qF -- 'On any other schema, go straight to [Finish the change](#finish-the-change)' <<<"$(review_build_start)"
}

@test "lets-review-build assumes no flow in its description or its finish" {
  local phrase
  for phrase in 'on the standard flow' 'Finish once the **Code review** section covers the branch'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-review-build/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-review-build still says: $phrase"; false; }
  done
}

@test "both flows ship lets-review-build" {
  local flow
  for flow in standard minimal; do
    flow_skills "$flow" | grep -qx lets-review-build || { echo "$flow does not ship lets-review-build"; false; }
  done
}

@test "lets-go's review build row runs the lets-review-build skill" {
  grep -qF '`lets-review-build` skill' <<<"$(step_row review-build)" || { echo "the review build row does not run lets-review-build"; false; }
  ! grep -qF 'Finish the change' <<<"$(step_row review-build)" || { echo "the review build row names a section"; false; }
}

@test "the README's minimal flow adds lets-review-build" {
  grep -E '^\| Skills it adds \|' "$repo/README.md" | awk -F'|' '{ print $(NF-1) }' | grep -qF '`lets-review-build`' ||
    { echo "README.md's minimal Skills it adds cell does not name lets-review-build"; false; }
}

@test "nothing lets-spec ships names lets-review-code" {
  run grep -rn lets-review-code "$repo/skills" "$repo/schemas" "$repo/overlays" "$repo/flows.json"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

@test "lets-go's Start holds the sections that find, confirm, route and claim the issue" {
  local section
  for section in 'Find the source of demand' 'Confirm the packet' 'Route' 'Glossary preflight' 'Claim' 'Import the glossary checkpoint'; do
    grep -qx "### $section" "$repo/skills/lets-go/SKILL.md" || { echo "lets-go has no heading: $section"; false; }
  done
  for section in 'Check the prerequisite' 'Check the checkpoint' 'Import the commits' 'Recover from a failed import'; do
    grep -qx "#### $section" "$repo/skills/lets-go/SKILL.md" || { echo "lets-go has no heading: $section"; false; }
  done
  skill_says lets-go 'gh issue view <i> --json createdAt'
  skill_says lets-go 'gh repo view --json defaultBranchRef --jq .defaultBranchRef.name'
  skill_says lets-go "Skipped shape: #<i>'s packet is complete, last edited <date>."
  # Claim sets the Status, so lets-go sets that field itself.
  skill_says lets-go 'gh project item-edit'
}

@test "lets-go names no section of lets-build" {
  local phrase
  for phrase in "\`lets-build\`'s *" 'reuses the `lets-build` skill' 'as `lets-build` does'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
}

@test "lets-go with nothing takes the next ready issue" {
  skill_says lets-go 'Picked #<i>: <title>, the next ready issue.'
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- '`lets-go` needs an issue number or an idea' ||
    { echo "lets-go still stops with nothing"; false; }
}

@test "lets-go runs next again with the same candidates after a lost race" {
  skill_says lets-go 'run `next` again with the same candidates, and go on from *Start* step 3 with the new issue'
}

@test "lets-go sends a failed step back to lets-go" {
  skill_says lets-go 'running `lets-go` again on that branch carries on from the first unfinished step'
}

@test "lets-go picks the level from the Kind and relays at ask" {
  local phrase
  skill_says lets-go 'Interactivity: <level>, because #<i> is a <Kind>.'
  skill_says lets-go 'Interactivity: <level>, because you asked for it.'
  skill_says lets-go 'gh issue view <i> --json title,blockedBy'
  skill_says lets-go 'the prerequisite stop stands, even on a stacked branch'
  skill_says lets-go 'The interactivity level is <level>.'
  skill_says lets-go 'Write the answer as the user gave it, with no marker'
  for phrase in '#152 adds' 'chores only' 'its stop stands'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
}

# start_step <n>: step <n> of lets-go's Start section, on one line.
start_step() {
  awk -v n="$1" '/^## Start$/ { start = 1; next } /^##/ { start = 0 }
    start && $0 ~ "^" n "\\. " { on = 1 } start && $0 ~ "^" (n + 1) "\\. " { on = 0 } on' \
    "$repo/skills/lets-go/SKILL.md" | tr -s '[:space:]' ' '
}

# An agent follows the skill in reading order, so a rule that comes after
# the call is one it reads too late.
@test "lets-go states the blocker rule before it finds the source of demand" {
  local step read call
  step="$(start_step 3)"
  read="${step%%"gh issue view <i> --json title,blockedBy"*}"
  call="${step%%"[Find the source of demand](#find-the-source-of-demand)"*}"
  [ "$read" != "$step" ] || { echo "Start step 3 does not read the blockers"; false; }
  [ "$call" != "$step" ] || { echo "Start step 3 does not run Find the source of demand"; false; }
  [ "${#read}" -lt "${#call}" ] ||
    { echo "Start step 3 runs Find the source of demand before it reads the blockers"; false; }
  skill_says lets-go '*Start* step 3 has read its blockers already'
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- 'If an open issue blocks it, say so and stop' ||
    { echo "Find the source of demand still stops on a blocker of its own"; false; }
  skill_says lets-go 'go back to the step of *Start* that ran it'
  skill_says lets-go 'When *Pick the first ready story* or *Claim* ran it, go back to that step'
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- 'Otherwise, go on to [Confirm the packet](#confirm-the-packet).' ||
    { echo "Find the source of demand still picks the next section"; false; }
  [[ "${step% }" == *'go on to step 4.' ]] || { echo "Start step 3 does not end by going on to step 4"; false; }
}

@test "lets-go reads go.level before it asks GitHub for anything" {
  local skill="$repo/skills/lets-go/SKILL.md" first_level first_gh
  skill_says lets-go 'Interactivity: <level>, because your lets config sets go.level.'
  skill_says lets-go 'lets go level'
  first_level=$(grep -n 'lets go level' "$skill" | head -1 | cut -d: -f1)
  first_gh=$(grep -nE '`gh ' "$skill" | head -1 | cut -d: -f1)
  [ "$first_level" -lt "$first_gh" ] ||
    { echo "lets go level is on line $first_level, after a GitHub call on line $first_gh"; false; }
}

@test "lets-go runs a shape step for an idea or an unshaped issue" {
  local phrase
  skill_says lets-go 'Done shape: <date>. <evidence>'
  skill_says lets-go 'Interactivity: ask, because shape has not run yet.'
  skill_says lets-go 'issue #<i>: <title>'
  skill_says lets-go 'issue-<i>'
  skill_says lets-go 'idea-<slug>'
  skill_says lets-go '--for shape'
  skill_says lets-go 'Failed shape:'
  skill_says lets-go 'at most once'
  skill_says lets-go 'holds another idea'
  skill_says lets-go 'Run discovery on it?'
  skill_says lets-go 'epic #<p>: <title>'
  skill_says lets-go 'story #<story>: <title>'
  skill_says lets-go 'Picked #<i>: <title>, the first ready story under #<p>.'
  skill_says lets-go 'docs: the discovery map from #<p>'
  skill_says lets-go 'Discovery status: in-progress'
  skill_says lets-go "gh issue list --state open --search '\"Discovery status: in-progress\" in:body' --json number,title,body"
  skill_says lets-go '*Resume mode*'
  skill_says lets-go 'Finalize has started on that parent'
  skill_says lets-go 'the edits are that discovery'"'"'s confirmed phases'
  for phrase in '#153 adds' '#154 adds' '`lets-go` needs an issue number, and stop' \
    'end with a failed report that says so and names'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
  # A large idea now runs discovery, so the README must not send it away.
  ! tr -s '[:space:]' ' ' < "$repo/README.md" | grep -qF -- 'An idea too large for one issue stops the run' ||
    { echo "README.md still says a large idea stops the run"; false; }
}

@test "lets-go runs each step through lets delegate step" {
  skill_says lets-go 'lets delegate step instructions --for <step>'
  skill_says lets-go 'lets delegate step run --for <step>'
  skill_says lets-go 'delegate.step.<step>.guidance'
  skill_says lets-go 'the guidance first, then the order the options came in'
  skill_says lets-go 'When `options` is empty, pass your own family'
  skill_says lets-go '.workspace/lets-go/<name>-<step>-prompt.md'
  skill_says lets-go '.workspace/lets-delegate/<name>-<step>.prompt.md'
  skill_says lets-go 'step-report'
}

@test "lets-go relays a step's questions" {
  skill_says lets-go '.workspace/lets-go/<name>-<step>-answers.yaml'
  skill_says lets-go '--answers-file'
  skill_says lets-go "lets-go accepted the step's recommendation; the user did not decide"
  skill_says lets-go 'asked a settled question again'
  skill_says lets-go 'Skipped review plan: not in the lets-minimal route.'
}

@test "lets-go resumes a change at its first unfinished step" {
  skill_says lets-go 'openspec instructions apply --change <name> --json'
  skill_says lets-go 'git status --porcelain'
  skill_says lets-go 'git fetch origin <name>'
  skill_says lets-go 'git merge --ff-only origin/<name>'
  skill_says lets-go 'git switch <name>'
  skill_says lets-go 'gh issue list --state open --search "<branch> in:title" --json number,title'
  skill_says lets-go 'Records disagree:'
  run grep -n '#150 adds resuming' "$repo/skills/lets-go/SKILL.md"
  [ "$status" -eq 1 ] || { echo "lets-go still defers resuming to #150: $output"; false; }
}

@test "lets-go dates each skipped step from Git and GitHub" {
  skill_says lets-go 'Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).'
  skill_says lets-go 'Skipped review plan: the Plan review in pull request #<p> says <verdict> for <sha>, committed <date>.'
  skill_says lets-go 'Skipped build: every task is ticked, last task commit <date> (<sha>).'
  skill_says lets-go 'Skipped review build: archived <date> (<sha>); pull request #<p> is ready for review.'
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- 'with a Code review section' ||
    { echo "lets-go still asks every flow for a Code review section"; false; }
  skill_says lets-go "git log -1 --diff-filter=A --format='%h %as' -- openspec/changes/<name>/tasks.md"
  skill_says lets-go "git log -1 --diff-filter=M --format='%h %as' -- openspec/changes/<name>/tasks.md"
  skill_says lets-go 'git log -1 --format=%as <sha>'
  skill_says lets-go 'gh pr view <name> --json number,body'
}

# A placeholder that names two things lets an agent send an issue number
# where the Project number belongs.
@test "lets-go gives each placeholder one meaning" {
  local old
  for old in '<n>'; do
    run grep -nF -- "$old" "$repo/skills/lets-go/SKILL.md"
    [ "$status" -eq 1 ] || { echo "lets-go still says $old: $output"; false; }
  done
}

# readme_lets_go: the README's lets-go section, on one line.
readme_lets_go() {
  awk '/^### `lets-go`/ { on = 1; next } /^### / { on = 0 } on' "$repo/README.md" | tr -s '[:space:]' ' '
}

@test "the README says each lets-go step runs in a fresh session" {
  grep -qF 'plan, review plan, build and review build, each in a fresh session' <<<"$(readme_lets_go)" ||
    { echo "the README's lets-go section does not list review plan as a step"; false; }
  ! grep -qF 'runs inside build' <<<"$(readme_lets_go)" ||
    { echo "the README still says review plan runs inside build"; false; }
}

@test "lets-go runs review plan as a step of its own" {
  skill_says lets-go '--for review-plan'
  skill_says lets-go '--name <name>-review-plan'
  skill_says lets-go 'Plan review: <verdict> for <sha>'
}

# Review plan is a step of its own, and its record is the Plan review
# section in the pull request, not review.md.
@test "lets-go reads review plan from the pull request" {
  local phrase
  skill_says lets-go '## Plan review'
  skill_says lets-go '- **Verdict:** '
  for phrase in 'review.md' 'VERDICT:' 'runs inside plan'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
}

@test "lets-go names the five steps, and no old step name" {
  local phrase
  skill_says lets-go 'Done plan: <date>. <evidence>'
  skill_says lets-go 'Done build: <date>. <evidence>'
  skill_says lets-go 'Done review build: <date>. <evidence>'
  for phrase in 'Skipped propose' 'Skipped apply' 'propose review' 'apply review' \
    'propose-review' 'apply-review' '--for propose' '--for apply'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qiF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
}

@test "each step prompt carries the route line and stops where its skill stops" {
  skill_says lets-go 'Schema: <schema>. <route line>'
  skill_says lets-go 'and stop where it stops'
}

# walk_section: lets-go's Walk the step table section, on one line.
walk_section() {
  awk '/^## Walk the step table$/ { on = 1; next } /^## / { on = 0 } on' "$repo/skills/lets-go/SKILL.md" | tr -s '[:space:]' ' '
}

@test "lets-go walks the step table and reads each row when it reaches it" {
  local phrase
  for phrase in '[The step table](#the-step-table)' 'openspec instructions apply --change <name> --json' \
    'gh pr view <name> --json number,body' '*Check an earlier review*' 'not before'; do
    grep -qF -- "$phrase" <<<"$(walk_section)" || { echo "the walk does not say: $phrase"; false; }
  done
}

@test "a review plan step that ran prints its line from its report" {
  local phrase
  skill_says lets-go 'Done review plan: <date>. <evidence>'
  for phrase in 'Done review plan: the Plan review' 'runs inside build' '#find-the-first-unfinished-step' '#print-the-skip-lines'; do
    ! tr -s '[:space:]' ' ' < "$repo/skills/lets-go/SKILL.md" | grep -qF -- "$phrase" ||
      { echo "lets-go still says: $phrase"; false; }
  done
}

@test "lets-go asks for a Code review section only on lets-standard" {
  local row
  row="$(grep -E '^\| An archive folder' "$repo/skills/lets-go/SKILL.md")"
  grep -qF '`lets-standard`' <<<"$row" || { echo "the archive row asks every flow for a Code review section"; false; }
  run grep -nE '^\| Build is done' "$repo/skills/lets-go/SKILL.md"
  [ "$status" -eq 1 ] || { echo "a built change with no Plan review is still a disagreement: $output"; false; }
}

@test "an archived change with no Plan review section is a disagreement" {
  local row
  row="$(grep -E '^\| An archived change on a schema other than `lets-minimal`' "$repo/skills/lets-go/SKILL.md")"
  grep -qF 'no **Plan review** section' <<<"$row" || { echo "lets-go has no disagreement for an archived change with no Plan review"; false; }
  grep -qF 'the records disagree if the pull request' <<<"$(walk_section)" ||
    { echo "the walk's review plan row does not check the section after archive"; false; }
}

# step_row <step>: lets-go's row for the step in its table of steps.
step_row() {
  grep -E "^\| \`$1\` \|" "$repo/skills/lets-go/SKILL.md"
}

@test "lets-plan runs openspec-propose and reads the change state when it stops" {
  skill_says lets-plan '`openspec-propose` skill'
  skill_says lets-plan 'openspec instructions apply --change <name> --json'
  skill_says lets-plan 'gh issue list --state open --search "<branch> in:title" --json number,title'
}

@test "lets-plan offers no handoff" {
  run grep -nF 'lets delegate' "$repo/skills/lets-plan/SKILL.md"
  [ "$status" -eq 1 ] || { echo "lets-plan says lets delegate: $output"; false; }
}

@test "both flows ship lets-plan" {
  local flow
  for flow in standard minimal; do
    flow_skills "$flow" | grep -qx lets-plan || { echo "$flow does not ship lets-plan"; false; }
  done
}

@test "lets-go's plan row runs the lets-plan skill" {
  grep -qF '`lets-plan` skill' <<<"$(step_row plan)" || { echo "the plan row does not run lets-plan"; false; }
  ! grep -qF 'openspec-propose' <<<"$(step_row plan)" || { echo "the plan row still names openspec-propose"; false; }
}

@test "lets-shape posts its reply with the gh command gh issue comment --body-file" {
  skill_says lets-shape 'gh issue comment <i> --body-file <file>'
}

# Resolve actual Markdown reference links as an installed skill would.
# Include source copies in an isolated fixture so a bad relative path fails.
assert_reference_links() {
  local text="$1" root="$2" base="${3:-$(dirname "$1")}" link found=0
  root="$(realpath "$root")"
  while IFS= read -r link; do
    found=1
    [ -f "$base/$link" ] || { echo "unresolved: $text -> $link"; return 1; }
    case "$(realpath "$base/$link")" in
      "$root"/*) ;;
      *) echo "reference escapes installed skills: $text -> $link"; return 1 ;;
    esac
  done < <(grep -oE '\]\([^)]*references/[^)]*\.md\)' "$text" | sed -E 's/^\]\(//;s/\)$//')
  [ "$found" -eq 1 ] || { echo "no reference input: $text"; return 1; }
}

@test "shaping loads its installed domain-language reference" {
  assert_reference_links "$repo/skills/lets-shape/SKILL.md" "$repo/skills"
}

# An anchored link would slip past assert_reference_links, so the link has none.
@test "shaping links its issue-comments reference" {
  grep -qF '](references/issue-comments.md)' "$repo/skills/lets-shape/SKILL.md"
}

@test "lets-go links its issue-comments reference" {
  grep -qF '](../lets-shape/references/issue-comments.md)' "$repo/skills/lets-go/SKILL.md"
}

@test "brainstorm links the issue-comments reference" {
  grep -qF '](../lets-shape/references/issue-comments.md)' "$repo/skills/lets-brainstorm/SKILL.md"
}

@test "brainstorm states the comment source form" {
  skill_says lets-brainstorm 'Evidence: #<n> comment (<author>, <date>)'
}

@test "lets-go's links resolve inside the source skills" {
  assert_reference_links "$repo/skills/lets-go/SKILL.md" "$repo/skills"
}

@test "lets-go states its watermark" {
  skill_says lets-go "The watermark is the later of the body's last edit and the newest read marker"
}

# prose() deduplicates matches, and SKILL.md already names gh api graphql, so
# this reads the reference itself.
@test "the issue-comments reference holds its fixed strings" {
  local text fixed
  text="$(tr -s '[:space:]' ' ' <"$repo/skills/lets-shape/references/issue-comments.md")"
  for fixed in 'lets-shape read this thread.' '`candidate`' '`outside`' '`read`' 'gh api graphql' 'Map updated:'; do
    grep -qF -- "$fixed" <<<"$text" || { echo "issue-comments.md does not say: $fixed"; false; }
  done
  grep -qE 'gh issue comment [^`]*--body-file' <<<"$text" ||
    { echo "issue-comments.md does not post with gh issue comment --body-file"; false; }
}

@test "Revision mode reads the thread of each open story the map links" {
  skill_says lets-shape "Read the thread of each open issue the map links"
}

@test "Ingest takes an accepted comment into the parent, as the issue-comments reference says" {
  skill_says lets-shape "Recommend taking it into the parent issue or dismissing it"
  skill_says lets-shape "gh issue edit <parent> --body-file <file>"
}

@test "the README shows the plan review in the pull request, after tasks" {
  grep -qF '| 7. | plan review |' "$repo/README.md" ||
    { echo "README.md has no plan review row after tasks"; false; }
  grep -qF '| A **Plan review** section in the pull request |' "$repo/README.md" ||
    { echo "README.md's plan review row names no Plan review section"; false; }
  run grep -nF 'review.md' "$repo/README.md"
  [ "$status" -eq 1 ] || { echo "README.md still says review.md: $output"; false; }
  ! tr -s '[:space:]' ' ' < "$repo/skills/lets-write-tasks/SKILL.md" | grep -qF 'approved plan' ||
    { echo "lets-write-tasks still says an approved plan"; false; }
}

@test "the README names lets-review-build for the code review and the finish" {
  grep -qF '| Independent code review | Yes | No |' "$repo/README.md" ||
    { echo "README.md's code review row is not Yes and No"; false; }
  grep -E '^\| Skills it adds \|' "$repo/README.md" | grep -qF '`lets-review-build`' ||
    { echo "README.md's Skills it adds row does not name lets-review-build"; false; }
  grep -E '^\| (9|10)\. \|' "$repo/README.md" | grep -cF '`lets-review-build`' | grep -qx 2 ||
    { echo "README.md's stages 9 and 10 do not both name lets-review-build"; false; }
}

@test "the README names no lets-review-code and no switch for the code review" {
  run grep -nE 'lets-review-code|#turning-the-code-review-off' "$repo/README.md"
  [ "$status" -eq 1 ] || { echo "$output"; false; }
}

load support/release

@test "planning vocabulary inputs resolve inside each published flow" {
  local flow schema skill out schemas
  for flow in standard minimal; do
    out="$BATS_TEST_TMPDIR/$flow"
    schemas="$(jq -r --arg flow "$flow" '.flows[$flow].schemas | join(",")' "$repo/flows.json")"
    build "$out" "$schemas" $(flow_skills "$flow")
    for skill in lets-shape lets-brainstorm lets-write-specs lets-go; do
      assert_reference_links "$out/overlay/.agents/skills/$skill/SKILL.md" "$out/overlay"
    done
    for schema in $(jq -r --arg flow "$flow" '.flows[$flow].schemas[]' "$repo/flows.json"); do
      (
        cd "$out/overlay"
        printf 'schema: %s\n' "$schema" > openspec/config.yaml
        OPENSPEC_TELEMETRY=0 OPENSPEC_NO_UPDATE_CHECK=1 openspec new change "$schema-demo" </dev/null >/dev/null 2>&1
        printf '%s\n' '- [ ] 1.1 Fixture implementation' >"openspec/changes/$schema-demo/tasks.md"
        local artifact
        for artifact in brainstorm specs apply; do
          OPENSPEC_TELEMETRY=0 OPENSPEC_NO_UPDATE_CHECK=1 openspec instructions "$artifact" --change "$schema-demo" --json </dev/null >"$out/instructions.json" 2>/dev/null
          jq -r .instruction "$out/instructions.json" >"$out/instruction.md"
          # Agents receive CLI text without its schema file location.
          assert_reference_links "$out/instruction.md" "$out/overlay" "$out/overlay"
        done
      )
    done
  done
}

@test "review vocabulary inputs resolve in the published standard flow" {
  local out="$BATS_TEST_TMPDIR/standard" skill
  build "$out" lets-standard,lets-minimal $(flow_skills standard)
  for skill in lets-review-plan lets-review-build; do
    assert_reference_links "$out/overlay/.agents/skills/$skill/SKILL.md" "$out/overlay"
  done
}

@test "installed reference containment accepts a symlinked root" {
  local real="$BATS_TEST_TMPDIR/real" alias="$BATS_TEST_TMPDIR/alias"
  mkdir -p "$real/skill/references"
  printf '# Method\n' >"$real/skill/references/method.md"
  printf '[Method](references/method.md)\n' >"$real/skill/SKILL.md"
  ln -s "$real" "$alias"
  assert_reference_links "$alias/skill/SKILL.md" "$alias"
}
