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
  skill_does_not_say lets-review-plan "\`lets-go\`'s build step" ||
    { echo "lets-review-plan still runs in lets-go's build step"; false; }
  skill_does_not_say lets-review-plan 'lets-build'
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

# says_exit_3 <skill>: the skill says what exit 3 of a delegate command means.
says_exit_3() {
  skill_says "$1" '**3**: no fresh session can run here, for example because no resolver started one'
}

@test "each skill that delegates to a subagent says exit 3 also means no resolver started a session" {
  for skill in lets-review-build lets-review-plan lets-go; do
    says_exit_3 "$skill"
  done
}

@test "the exit 3 check matches the sentence across a line break" {
  fixture_file lets-go SKILL.md '**3**: no fresh session can run here, for example' 'because no resolver started one'
  says_exit_3 lets-go
}

@test "the exit 3 check names a skill without the sentence" {
  fixture_file lets-review-plan references/delegate.md 'Exit codes are elsewhere.'
  run says_exit_3 lets-review-plan
  [ "$status" -eq 1 ] || { echo "it passed on a skill without the sentence"; false; }
  [[ "$output" == *lets-review-plan* ]] || { echo "it said: $output"; false; }
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

# skill_files <skill>: the skill's SKILL.md, then each of its reference
# files. Fixture tests point skills_dir at a folder of their own.
skill_files() {
  local dir="${skills_dir:-$repo/skills}/$1" file
  echo "$dir/SKILL.md"
  for file in "$dir"/references/*.md; do
    [ -f "$file" ] && echo "$file"
  done
  return 0
}

# skill_text <skill>: the skill's files as one text, each run of whitespace
# one space, so a string may wrap across lines.
skill_text() {
  local file
  skill_files "$1" | while IFS= read -r file; do cat "$file"; echo; done | tr -s '[:space:]' ' '
}

# skill_says <skill> <fixed text>: the skill's SKILL.md or a reference file
# holds the text, which may wrap across lines.
skill_says() {
  skill_text "$1" | grep -qF -- "$2" || { echo "$1 does not say: $2"; return 1; }
}

# skill_does_not_say [-i] <skill> <fixed text>: no file skill_says reads
# holds the text. -i ignores case.
skill_does_not_say() {
  local case=()
  [ "$1" = -i ] && { case=(-i); shift; }
  ! skill_text "$1" | grep -q "${case[@]}" -F -- "$2" || { echo "$1 still says: $2"; return 1; }
}

# skill_has_section <skill> <name>: a line of the skill's SKILL.md or a
# reference file is a heading with that name, at any level.
skill_has_section() {
  local level heading=() files
  for level in '#' '##' '###' '####' '#####' '######'; do heading+=(-e "$level $2"); done
  mapfile -t files < <(skill_files "$1")
  grep -qxF "${heading[@]}" -- "${files[@]}" || { echo "$1 has no heading: $2"; return 1; }
}

# steps_in_one_table <skill>: plan, review-plan, build and review-build each
# have one row, a line that starts | `<step>` |, and all four rows sit in one
# table, a run of lines that start with |, in one file of the skill.
steps_in_one_table() {
  local files rows step count wrong=()
  mapfile -t files < <(skill_files "$1")
  # Each step row, as <step>, a tab, and <file>:<table>.
  rows="$(awk '
    FNR == 1 { table = 0; inside = 0 }
    !/^\|/ { inside = 0; next }
    !inside { table++; inside = 1 }
    match($0, /^\| `[a-z-]+` \|/) { print substr($0, 4, RLENGTH - 6) "\t" FILENAME ":" table }' "${files[@]}")"
  for step in plan review-plan build review-build; do
    count="$(grep -c "^$step"$'\t' <<<"$rows" || true)"
    [ "$count" -eq 1 ] || wrong+=("$step has $count rows")
  done
  count="$(grep -E $'^(plan|review-plan|build|review-build)\t' <<<"$rows" | cut -f2 | sort -u | wc -l)"
  [ "$count" -le 1 ] || wrong+=("the steps sit in $count tables")
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s step table: %s\n' "$1" "${wrong[@]}"; return 1; }
}

# fixture_file <skill> <path> <line>...: writes the lines to the file in a
# skills folder under the test's temporary folder, gives the skill a SKILL.md
# if it has none, and points the helpers at that folder.
fixture_file() {
  skills_dir="$BATS_TEST_TMPDIR/skills"
  mkdir -p "$(dirname "$skills_dir/$1/$2")"
  printf '%s\n' "${@:3}" >"$skills_dir/$1/$2"
  [ -f "$skills_dir/$1/SKILL.md" ] || printf '# %s\n' "$1" >"$skills_dir/$1/SKILL.md"
}

@test "skill_says finds a string that wraps across two lines of a reference file" {
  fixture_file lets-go references/records.md 'The fixture records' 'disagree: here.'
  skill_says lets-go 'The fixture records disagree: here.'
}

@test "skill_says names a string no file of the skill holds" {
  fixture_file lets-go references/records.md 'Nothing to see.'
  run skill_says lets-go 'Records disagree:'
  [ "$status" -eq 1 ] || { echo "it passed on a string no fixture file holds"; false; }
  [ "$output" = 'lets-go does not say: Records disagree:' ] || { echo "it said: $output"; false; }
}

@test "skill_does_not_say fails on a phrase only a reference file holds" {
  fixture_file lets-go references/records.md 'Write VERDICT: here.'
  run skill_does_not_say lets-go 'VERDICT:'
  [ "$status" -eq 1 ] || { echo "it passed on a phrase a reference file holds"; false; }
  [ "$output" = 'lets-go still says: VERDICT:' ] || { echo "it said: $output"; false; }
}

@test "skill_does_not_say -i fails on the phrase in another case" {
  fixture_file lets-go references/steps.md 'Skipped Propose: once.'
  run skill_does_not_say -i lets-go 'skipped propose'
  [ "$status" -eq 1 ] || { echo "it passed on the phrase in another case"; false; }
}

@test "skill_does_not_say passes when no file holds the phrase" {
  fixture_file lets-go references/records.md 'Nothing to see.'
  skill_does_not_say lets-go 'VERDICT:'
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
    skill_does_not_say lets-review-plan "$phrase"
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
    skill_does_not_say lets-build "$phrase"
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

# step_table_fixture <header> <row>...: a lets-go fixture whose SKILL.md
# holds one table, with the header, its divider line and the rows.
step_table_fixture() {
  fixture_file lets-go SKILL.md '# lets-go' '' "$1" '|---|---|---|---|' "${@:2}" '' 'Text.'
}

@test "the step table check passes a table with another header and no shape row" {
  step_table_fixture '| Step | Skill | Record | Skip line |' \
    '| `plan` | a | b | c |' '| `review-plan` | a | b | c |' '| `build` | a | b | c |' '| `review-build` | a | b | c |'
  steps_in_one_table lets-go
}

@test "the step table check names a step with two rows" {
  step_table_fixture '| Step | Skill | Record | Skip line |' \
    '| `plan` | a | b | c |' '| `review-plan` | a | b | c |' '| `build` | a | b | c |' '| `build` | d | e | f |' \
    '| `review-build` | a | b | c |'
  run steps_in_one_table lets-go
  [ "$status" -eq 1 ] || { echo "it passed on two build rows"; false; }
  [[ "$output" == *'build has 2 rows'* ]] || { echo "it said: $output"; false; }
}

@test "the step table check fails when the steps sit in two tables" {
  step_table_fixture '| Step | Skill | Record | Skip line |' '| `plan` | a | b | c |' '| `review-plan` | a | b | c |'
  fixture_file lets-go references/build.md '| Step | Skill |' '|---|---|' '| `build` | a |' '| `review-build` | a |'
  run steps_in_one_table lets-go
  [ "$status" -eq 1 ] || { echo "it passed on steps in two tables"; false; }
  [[ "$output" == *'the steps sit in 2 tables'* ]] || { echo "it said: $output"; false; }
}

@test "lets-go keeps its steps in one table" {
  steps_in_one_table lets-go
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
    skill_does_not_say lets-review-build "$phrase"
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

@test "the section check finds a section in a reference file" {
  fixture_file lets-go references/glossary-preflight.md '## Check the checkpoint' 'Steps.'
  skill_has_section lets-go 'Check the checkpoint'
}

@test "the section check finds a section at another heading level" {
  fixture_file lets-go SKILL.md '# lets-go' '## Route' 'Text.'
  skill_has_section lets-go 'Route'
}

@test "the section check names a missing section" {
  fixture_file lets-go SKILL.md '# lets-go' '### Claimed' 'Text that says Claim.'
  run skill_has_section lets-go 'Claim'
  [ "$status" -eq 1 ] || { echo "it passed on a skill with no Claim heading"; false; }
  [ "$output" = 'lets-go has no heading: Claim' ] || { echo "it said: $output"; false; }
}

@test "lets-go's Start holds the sections that find, confirm, route and claim the issue" {
  local section
  for section in 'Find the source of demand' 'Confirm the packet' 'Route' 'Glossary preflight' 'Claim' 'Import the glossary checkpoint' \
    'Check the prerequisite' 'Check the checkpoint' 'Import the commits' 'Recover from a failed import'; do
    skill_has_section lets-go "$section"
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
    skill_does_not_say lets-go "$phrase"
  done
}

@test "lets-go with nothing takes the next ready issue" {
  skill_says lets-go 'Picked #<i>: <title>, the next ready issue.'
  skill_does_not_say lets-go '`lets-go` needs an issue number or an idea' ||
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
    skill_does_not_say lets-go "$phrase"
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
  skill_does_not_say lets-go 'If an open issue blocks it, say so and stop' ||
    { echo "Find the source of demand still stops on a blocker of its own"; false; }
  skill_says lets-go 'go back to the step of *Start* that ran it'
  skill_says lets-go 'When *Pick the first ready story* or *Claim* ran it, go back to that step'
  skill_does_not_say lets-go 'Otherwise, go on to [Confirm the packet](#confirm-the-packet).' ||
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
  skill_says lets-go 'epic #<parent>: <title>'
  skill_says lets-go 'story #<story>: <title>'
  skill_says lets-go 'Picked #<i>: <title>, the first ready story under #<parent>.'
  skill_says lets-go 'docs: the discovery map from #<parent>'
  skill_says lets-go 'Discovery status: in-progress'
  skill_says lets-go "gh issue list --state open --search '\"Discovery status: in-progress\" in:body' --json number,title,body"
  skill_says lets-go '*Resume mode*'
  skill_says lets-go 'Finalize has started on that parent'
  skill_says lets-go 'the edits are that discovery'"'"'s confirmed phases'
  for phrase in '#153 adds' '#154 adds' '`lets-go` needs an issue number, and stop' \
    'end with a failed report that says so and names'; do
    skill_does_not_say lets-go "$phrase"
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
  skill_says lets-go '.workspace/lets-go/<session>-prompt.md'
  skill_says lets-go '.workspace/lets-delegate/<session>.prompt.md'
  skill_says lets-go 'step-report'
}

@test "lets-go relays a step's questions" {
  skill_says lets-go '.workspace/lets-go/<session>-answers.yaml'
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
  skill_does_not_say lets-go '#150 adds resuming' || { echo "lets-go still defers resuming to #150"; false; }
}

@test "lets-go dates each skipped step from Git and GitHub" {
  skill_says lets-go 'Skipped plan: the plan is ready, tasks.md committed <date> (<sha>).'
  skill_says lets-go 'Skipped review plan: the Plan review in pull request #<pr> says <verdict> for <sha>, committed <date>.'
  skill_says lets-go 'Skipped build: every task is ticked, last task commit <date> (<sha>).'
  skill_says lets-go 'Skipped review build: archived <date> (<sha>); pull request #<pr> is ready for review.'
  skill_does_not_say lets-go 'with a Code review section' ||
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
  skill_says lets-go '<shape-name>'
  skill_says lets-go '<session>'
  for old in '<n>' '<p>' '<name>-<step>' '<name>-shape' '<url>' '<issue URL>' '<words>'; do
    run grep -nF -- "$old" "$repo/skills/lets-go/SKILL.md"
    [ "$status" -eq 1 ] || { echo "lets-go still says $old: $output"; false; }
  done
}

# placeholder_rows: the first cell of each row of lets-go's Placeholders
# table, without its backticks.
placeholder_rows() {
  awk '/^## Placeholders$/ { on = 1; next } /^## / { on = 0 } on && /^\|/' "$repo/skills/lets-go/SKILL.md" |
    tail -n +3 | cut -d'|' -f2 | sed -E 's/^ *`?//; s/`? *$//'
}

@test "lets-go lists each placeholder once" {
  local placeholder rows count wrong=()
  rows="$(placeholder_rows)"
  while IFS= read -r placeholder; do
    count="$(grep -cxF -- "$placeholder" <<<"$rows" || true)"
    [ "$count" -eq 1 ] || wrong+=("$placeholder has $count rows")
  done < <(grep -oE '<[A-Za-z][^<>]*>' "$repo/skills/lets-go/SKILL.md" | sort -u)
  [ "${#wrong[@]}" -eq 0 ] || { printf 'the Placeholders table: %s\n' "${wrong[@]}"; false; }
}

# prose_placeholders <file>: each placeholder outside fenced code and inline
# code spans, as <line>: <placeholder>. GitHub reads one there as an HTML
# tag. A fence closes only on a line of its own character, at least as long
# as the line that opened it, so a four-backtick fence holds three-backtick
# ones. A code span closes on a run of as many backticks as opened it.
prose_placeholders() {
  awk '
    function run(s, i,   n) { n = 0; while (substr(s, i + n, 1) == "`") n++; return n }
    fence == "" && match($0, /^ *(```+|~~~+)/) {
      fence = substr($0, RSTART, RLENGTH); sub(/^ */, "", fence); next
    }
    fence != "" {
      line = $0; sub(/^ */, "", line); sub(/ *$/, "", line)
      if (line ~ /^(`+|~+)$/ && substr(line, 1, 1) == substr(fence, 1, 1) && length(line) >= length(fence)) fence = ""
      next
    }
    /^ *$/ { span = 0; next }
    {
      text = ""
      for (i = 1; i <= length($0); ) {
        c = substr($0, i, 1)
        if (c == "`") {
          n = run($0, i)
          if (span == 0) span = n; else if (n == span) span = 0
          i += n; continue
        }
        if (span == 0) text = text c
        i++
      }
      while (match(text, /<[A-Za-z][^<>]*>/)) {
        print NR ": " substr(text, RSTART, RLENGTH); text = substr(text, RSTART + RLENGTH)
      }
    }' "$1"
}

@test "lets-go writes no placeholder outside code" {
  run prose_placeholders "$repo/skills/lets-go/SKILL.md"
  [ -z "$output" ] || { echo "lets-go has placeholders outside code:"; echo "$output"; false; }
}

@test "the placeholder check reads a fence inside a longer fence as code" {
  local file="$BATS_TEST_TMPDIR/fences.md"
  printf '%s\n' '````text' '```step-report' 'outcome: done' '```' '<inside>' '````' '<outside>' >"$file"
  run prose_placeholders "$file"
  [ "$output" = '7: <outside>' ] || { echo "it found: $output"; false; }
}

@test "the placeholder check reads a two-backtick code span as code" {
  local file="$BATS_TEST_TMPDIR/spans.md"
  printf '%s\n' 'Write `` `#<i>` `` here, not <bare>.' >"$file"
  run prose_placeholders "$file"
  [ "$output" = '1: <bare>' ] || { echo "it found: $output"; false; }
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
    skill_does_not_say lets-go "$phrase"
  done
}

@test "lets-go names the five steps, and no old step name" {
  local phrase
  skill_says lets-go 'Done plan: <date>. <evidence>'
  skill_says lets-go 'Done build: <date>. <evidence>'
  skill_says lets-go 'Done review build: <date>. <evidence>'
  for phrase in 'Skipped propose' 'Skipped apply' 'propose review' 'apply review' \
    'propose-review' 'apply-review' '--for propose' '--for apply'; do
    skill_does_not_say -i lets-go "$phrase"
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
    skill_does_not_say lets-go "$phrase"
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
  skill_does_not_say lets-plan 'lets delegate'
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
  skill_does_not_say lets-write-tasks 'approved plan' ||
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
