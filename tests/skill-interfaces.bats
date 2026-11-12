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
      case "$skill" in lets-go | lets-shape | lets-setup-backlog | lets-review-pr) continue ;; esac
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

# lets-go's terms.md copies the glossary word for word, and the glossary
# names the steps as lets delegate step --for takes them, not as a command.
@test "each lets delegate review, handoff or step the prose names is followed by instructions or run" {
  run bash -c "$(declare -f prose); repo='$repo'; prose | grep -vF '/lets-go/references/terms.md' | xargs grep -ohE 'lets delegate (review|handoff|step)( [^ \`]+)?' | grep -vE 'lets delegate (review|handoff|step) (instructions|run)$'"
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

# skill_text <skill>: each of the skill's files on a line of its own, each
# run of whitespace one space, so a string may wrap across lines but not run
# from one file into the next.
skill_text() {
  local file
  skill_files "$1" | while IFS= read -r file; do tr -s '[:space:]' ' ' <"$file"; echo; done
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

# skill_says_once <skill> <fixed text>: the files skill_says reads hold the
# text exactly once between them, so a rule has one place to change.
skill_says_once() {
  local count
  count="$(skill_text "$1" | grep -oF -- "$2" | wc -l)"
  [ "$count" -eq 1 ] || { echo "$1 says $((count)) times: $2"; return 1; }
}

# skill_has_section <skill> <name>: a line of the skill's SKILL.md or a
# reference file is a heading with that name, at any level.
skill_has_section() {
  local level heading=() files
  for level in '#' '##' '###' '####' '#####' '######'; do heading+=(-e "$level $2"); done
  mapfile -t files < <(skill_files "$1")
  grep -qxF "${heading[@]}" -- "${files[@]}" || { echo "$1 has no heading: $2"; return 1; }
}

# Awk rules that set code to 1 on each line that opens, holds or closes
# fenced code, so a # comment or a numbered line there is not read as prose.
# A fence closes only on a line of its own character, at least as long as
# the line that opened it.
fence_rules='
  { code = 0 }
  fence != "" {
    code = 1; line = $0; sub(/^ */, "", line); sub(/ *$/, "", line)
    if (line ~ /^(`+|~+)$/ && substr(line, 1, 1) == substr(fence, 1, 1) && length(line) >= length(fence)) fence = ""
  }
  !code && match($0, /^ *(```+|~~~+)/) { code = 1; fence = substr($0, RSTART, RLENGTH); sub(/^ */, "", fence) }'

# skill_section <skill> <name>: the text of the section with that heading,
# at any level, in the skill's SKILL.md or a reference file, up to the next
# heading, each run of whitespace one space.
skill_section() {
  local files
  mapfile -t files < <(skill_files "$1")
  awk -v name="$2" "$fence_rules"'
    !code && /^#+ / { on = (substr($0, index($0, " ") + 1) == name); next }
    on' "${files[@]}" | tr -s '[:space:]' ' ' | sed 's/^ //; s/ $//'
}

# lists_start_at_one <skill>: in each of the skill's files, the first
# numbered item after each heading, outside fenced code, is 1. Markdown reads
# an item indented up to three spaces as a list item too. A list that
# carries on its numbers across a heading makes "step 3" ambiguous. Prints
# each break as <file>: <heading>: <number>, the file under the skills folder.
lists_start_at_one() {
  local file out
  out="$(skill_files "$1" | while IFS= read -r file; do
    awk -v name="${file#"${skills_dir:-$repo/skills}/"}" "$fence_rules"'
      code { next }
      /^#+ / { heading = $0; first = 1; next }
      first && match($0, /^ ? ? ?[0-9]+\. /) {
        first = 0; number = substr($0, 1, RLENGTH - 1); sub(/^ */, "", number)
        if (number != "1.") print name ": " heading ": " number
      }' "$file"
  done)"
  [ -z "$out" ] || { echo "$out"; return 1; }
}

# skill_rows <skill> <pattern>: each line of the skill's SKILL.md or a
# reference file that matches the extended regex.
skill_rows() {
  local files
  mapfile -t files < <(skill_files "$1")
  grep -hE -- "$2" "${files[@]}"
}

# steps_in_one_table <skill>: plan, review-plan, build and review-build each
# have one row, a line that starts | `<step>` |, and all four rows sit in one
# table, a run of lines that start with |, in one file of the skill. Shape has
# no row: it runs before the walk.
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
  ! grep -q $'^shape\t' <<<"$rows" || wrong+=("shape has a row")
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

@test "skill_says does not match a string split across two files" {
  fixture_file lets-go SKILL.md '# lets-go' 'The fixture records'
  fixture_file lets-go references/records.md 'disagree: here.'
  run skill_says lets-go 'The fixture records disagree: here.'
  [ "$status" -eq 1 ] || { echo "it matched across the end of SKILL.md"; false; }
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

@test "the says once check passes a phrase SKILL.md holds once" {
  fixture_file lets-go SKILL.md '# lets-go' 'Print Done shape:' '<date>. <evidence> here.'
  skill_says_once lets-go 'Done shape: <date>. <evidence>'
}

@test "the says once check names a phrase SKILL.md and a reference file both hold" {
  fixture_file lets-go SKILL.md '# lets-go' 'Print Done shape: <date>. <evidence> here.'
  fixture_file lets-go references/steps.md 'And Done shape: <date>. <evidence> again.'
  run skill_says_once lets-go 'Done shape: <date>. <evidence>'
  [ "$status" -eq 1 ] || { echo "it passed on a phrase written twice"; false; }
  [ "$output" = 'lets-go says 2 times: Done shape: <date>. <evidence>' ] || { echo "it said: $output"; false; }
}

@test "the says once check names a phrase no file of the skill holds" {
  fixture_file lets-go SKILL.md '# lets-go' 'Nothing to see.'
  run skill_says_once lets-go 'Done shape: <date>. <evidence>'
  [ "$status" -eq 1 ] || { echo "it passed on a missing phrase"; false; }
  [ "$output" = 'lets-go says 0 times: Done shape: <date>. <evidence>' ] || { echo "it said: $output"; false; }
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

@test "the step table check names a shape row" {
  step_table_fixture '| Step | Skill | Record | Skip line |' '| `shape` | a | b | c |' \
    '| `plan` | a | b | c |' '| `review-plan` | a | b | c |' '| `build` | a | b | c |' '| `review-build` | a | b | c |'
  run steps_in_one_table lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a shape row"; false; }
  [[ "$output" == *'shape has a row'* ]] || { echo "it said: $output"; false; }
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

@test "the numbered list check names a heading whose list starts at 5" {
  fixture_file lets-go SKILL.md '# lets-go' '### Steps' '5. Read the base.'
  run lists_start_at_one lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a list that starts at 5"; false; }
  [ "$output" = 'lets-go/SKILL.md: ### Steps: 5.' ] || { echo "it said: $output"; false; }
}

@test "the numbered list check names a reference file whose list starts at 2" {
  fixture_file lets-go references/steps.md '## Steps' '2. Read the base.'
  run lists_start_at_one lets-go
  [ "$output" = 'lets-go/references/steps.md: ## Steps: 2.' ] || { echo "it said: $output"; false; }
}

@test "the numbered list check reads an item indented up to three spaces" {
  fixture_file lets-go SKILL.md '# lets-go' '### Steps' '  5. Read the base.'
  run lists_start_at_one lets-go
  [ "$output" = 'lets-go/SKILL.md: ### Steps: 5.' ] || { echo "it said: $output"; false; }
}

@test "the numbered list check skips a number inside a code block" {
  fixture_file lets-go SKILL.md '# lets-go' '### Steps' '```text' '5. not a step' '```' '1. Read the base.'
  lists_start_at_one lets-go
}

@test "the numbered list check passes a reference file whose numbered lists start at 1" {
  fixture_file lets-go references/steps.md '## One' '1. Read.' '2. Check.' '## Two' 'Text.' '1. Stop.'
  lists_start_at_one lets-go
}

@test "each numbered list in lets-go starts at 1 under its heading" {
  lists_start_at_one lets-go
}

@test "the section text helper reads a reference file's section up to the next heading" {
  fixture_file lets-go references/glossary.md '## Check the checkpoint' 'First line,' '```bash' '# not a heading' '```' 'last line.' '## Claim' 'Not this.'
  run skill_section lets-go 'Check the checkpoint'
  [ "$output" = 'First line, ```bash # not a heading ``` last line.' ] || { echo "it read: $output"; false; }
}

@test "lets-go's checkpoint runs Check the prerequisite again by name" {
  local section
  section="$(skill_section lets-go 'Check the checkpoint')"
  [ -n "$section" ] || { echo "lets-go has no Check the checkpoint section"; false; }
  grep -qF '](#check-the-prerequisite)' <<<"$section" ||
    { echo "Check the checkpoint does not link Check the prerequisite"; false; }
  skill_does_not_say lets-go 'repeat steps 1 to 3'
  skill_does_not_say lets-go 'Go on with the normal packet, blocker and routing checks'
}

@test "lets-go's checkpoint returns unresolved on an unresolved prerequisite, even for a next pick" {
  local section
  section="$(skill_section lets-go 'Check the checkpoint')"
  grep -qF 'When that run returns `unresolved`, return `unresolved`, claiming nothing' <<<"$section" ||
    { echo "Check the checkpoint does not return unresolved on an unresolved prerequisite"; false; }
  grep -qF 'even for an issue that `next` picked' <<<"$section" ||
    { echo "Check the checkpoint does not return unresolved for a next pick"; false; }
  ! grep -qF 'skip the candidate' <<<"$section" || { echo "Check the checkpoint still skips the candidate"; false; }
}

@test "lets-go's checkpoint fails on a missing checkpoint commit" {
  grep -qF 'is missing, or exists only in a local checkout, return `checkpoint-failed`, with what is missing' <<<"$(skill_section lets-go 'Check the checkpoint')" ||
    { echo "Check the checkpoint does not fail on a missing commit"; false; }
  skill_does_not_say lets-go 'do not claim until it is recovered'
}

@test "lets-go's checkpoint fails on a conflicting patch, repairing nothing" {
  grep -qF 'return `checkpoint-failed`, with the conflict, repairing nothing' <<<"$(skill_section lets-go 'Check the checkpoint')" ||
    { echo "Check the checkpoint does not fail on a conflicting patch"; false; }
  skill_does_not_say lets-go 'Resolve a partial or conflicting patch'
}

@test "lets-go's checkpoint skips an edit already on the base" {
  grep -qF 'An edit already present is skipped, which is not a failure' <<<"$(skill_section lets-go 'Check the checkpoint')" ||
    { echo "Check the checkpoint does not skip an edit already present"; false; }
}

@test "lets-go's checkpoint fails where each of its other checks fails" {
  local section failure
  section="$(skill_section lets-go 'Check the checkpoint')"
  for failure in 'or a commit that touches another path, return `checkpoint-failed`, with what you found' \
    'If that context is missing from the proposed base, return `checkpoint-failed`, with what is missing' \
    'If the owned paths do not match the shaping baseline, return `checkpoint-failed`, with what differs'; do
    grep -qF -- "$failure" <<<"$section" || { echo "Check the checkpoint does not say: $failure"; false; }
  done
}

@test "the glossary checkpoint and prerequisite say no stop" {
  procedure_stops 'Glossary preflight'
}

@test "Check the prerequisite returns resolved or unresolved" {
  local section result
  section="$(skill_section lets-go 'Check the prerequisite')"
  for result in resolved unresolved; do
    grep -qF -- "\`$result\`" <<<"$section" || { echo "Check the prerequisite does not return: $result"; false; }
  done
}

@test "Check the checkpoint lists its results" {
  local section result
  section="$(skill_section lets-go 'Check the checkpoint')"
  for result in verified checkpoint-failed unresolved; do
    grep -qF -- "- \`$result\`:" <<<"$section" || { echo "Check the checkpoint does not list: $result"; false; }
  done
}

@test "Glossary preflight lists its results after its prerequisite and checkpoint" {
  local section result
  section="$(skill_section lets-go 'What the preflight returns')"
  for result in no-owned-edits verified unresolved checkpoint-failed; do
    grep -qF -- "- \`$result\`:" <<<"$section" || { echo "Glossary preflight does not list: $result"; false; }
  done
  grep -qF '`verified`: the story owns the edits, and [Check the checkpoint](#check-the-checkpoint) returned `verified`. It carries the checkpoint commits' <<<"$section" ||
    { echo "verified does not carry the checkpoint commits"; false; }
  ! grep -F -- '- `no-owned-edits`:' <<<"${section//- \`/$'\n'- \`}" | grep -qF '*Check the prerequisite*' ||
    { echo "no-owned-edits still waits on Check the prerequisite"; false; }
}

# next and Find the source of demand check the prerequisite, so Claim's
# preflight does not check it a third time.
@test "Glossary preflight in Claim checks no prerequisite first" {
  local opening
  opening="$(skill_section lets-go 'Glossary preflight')"
  grep -qF '[Claim](../SKILL.md#claim) runs the rest of the preflight' <<<"$opening" ||
    { echo "Glossary preflight does not say Claim runs only the rest: $opening"; false; }
  ! grep -qF 'Run *Check the prerequisite*, then' <<<"$opening" ||
    { echo "Glossary preflight still runs Check the prerequisite first"; false; }
}

@test "lets-go holds the sections that find, confirm, route and claim the issue" {
  local section
  for section in 'Find the source of demand' 'Confirm the packet' 'Route' 'Glossary preflight' 'Claim' 'Import the glossary checkpoint' \
    'Check the prerequisite' 'Check the checkpoint' 'Import the commits' 'Recover from a failed import'; do
    skill_has_section lets-go "$section"
  done
  skill_says lets-go 'gh issue view <i> --json createdAt'
  skill_says lets-go 'gh repo view --json defaultBranchRef --jq .defaultBranchRef.name'
  skill_says lets-go "Skipped shape: #<i>'s packet is complete, last edited <date>."
  # Claim claims through lets backlog, which sets the Status.
  skill_says lets-go 'lets backlog claim <i>'
  skill_does_not_say lets-go 'gh project'
  skill_does_not_say lets-go 'gh api graphql'
}

@test "lets-go names no section of lets-build" {
  local phrase
  for phrase in "\`lets-build\`'s *" 'reuses the `lets-build` skill' 'as `lets-build` does'; do
    skill_does_not_say lets-go "$phrase"
  done
}

@test "lets-go runs no Project query, and stops on a lets backlog error" {
  local text part
  ! grep -qF 'gh api graphql' <<<"$(part_section 'Read the settings')" ||
    { echo "Read the settings still runs the Project query"; false; }
  skill_does_not_say lets-go 'projectsV2'
  skill_does_not_say lets-go 'gh project item-list'
  skill_does_not_say lets-go 'gh issue list --search "is:open no:assignee'
  skill_has_section lets-go 'Backlog errors'
  text="$(skill_section lets-go 'Backlog errors')"
  grep -qF '**`no-backlog`:**' <<<"$text" && grep -qF 'run the `lets-setup-backlog` skill' <<<"$text" ||
    { echo "Backlog errors does not send no-backlog to lets-setup-backlog"; false; }
  grep -qF '**`several-backlogs`:**' <<<"$text" && grep -qF 'ask the user to unlink the extras' <<<"$text" ||
    { echo "Backlog errors does not list several-backlogs' Projects"; false; }
  grep -qF 'Never pick one' <<<"$text" || { echo "Backlog errors may pick a Project"; false; }
  grep -qF 'show its `message`' <<<"$text" || { echo "Backlog errors does not show other errors"; false; }
  for part in 'Read the request' 'Check the issue'; do
    grep -qF '](#backlog-errors)' <<<"$(part_section "$part")" || { echo "$part does not link Backlog errors"; false; }
  done
  for part in 'Find the source of demand' 'Confirm the packet'; do
    grep -qF '](#backlog-errors)' <<<"$(procedure_text "$part")" || { echo "$part does not link Backlog errors"; false; }
  done
  skill_does_not_say lets-go 'no-project'
  skill_does_not_say lets-go 'several-projects'
}

@test "lets-go reads the backlog through lets backlog ready, item and find" {
  skill_says lets-go 'lets backlog ready'
  skill_says lets-go 'lets backlog ready --exclude 149'
  skill_says lets-go '--only'
  skill_says lets-go 'lets backlog item <i>'
  skill_says lets-go 'lets backlog find <branch>'
  skill_says lets-go 'lets backlog find "<idea>"'
  skill_does_not_say lets-go '<repo>'
  skill_does_not_say lets-go 'gh issue view <parent>'
  skill_does_not_say lets-go 'gh issue view <i> --json number,title,body,url,parent'
  grep -qF '`subIssues`' <<<"$(procedure_text 'Confirm the packet')" ||
    { echo "Confirm the packet does not take an epic's sub-issues from item"; false; }
  grep -qF 'the `body` in its `parent`' <<<"$(procedure_text 'Confirm the packet' | tr -s '[:space:]' ' ')" ||
    { echo "Confirm the packet does not read Shared decisions from item's parent"; false; }
}

@test "lets-go with nothing takes the next ready issue" {
  skill_says lets-go 'Picked #<i>: <title>, the next ready issue.'
  skill_does_not_say lets-go '`lets-go` needs an issue number or an idea' ||
    { echo "lets-go still stops with nothing"; false; }
}

@test "lets-go leaves out every lost issue after a lost race" {
  skill_says lets-go 'leave out every issue lost in this run'
  skill_does_not_say lets-go 'run `next` again with the same candidates'
}

@test "lets-go stops after the third lost claim" {
  grep -qF 'After the third lost claim in this run, say that other sessions keep taking the picked issues' <<<"$(part_section 'Enter the branch')" ||
    { echo "Enter the branch does not stop after the third lost claim"; false; }
}

@test "Enter the branch goes back to the part that picked after a lost claim" {
  local line
  line="$(next_line 'Enter the branch')"
  grep -qF '](#read-the-request)' <<<"$line" && grep -qF '](#pick-the-first-ready-story)' <<<"$line" ||
    { echo "it said: $line"; false; }
}

@test "Pick the first ready story prints Done shape once after a lost claim" {
  grep -qF 'when this run has not printed it yet' <<<"$(skill_section lets-go 'The step lines')" ||
    { echo "The step lines print Done shape again after a lost claim"; false; }
  grep -qF '](../SKILL.md#the-step-lines)' <<<"$(part_section 'Pick the first ready story')" ||
    { echo "Pick the first ready story does not link The step lines"; false; }
}

@test "lets-go sends a failed step back to lets-go" {
  skill_says lets-go 'running `lets-go` again on that branch carries on from the first unfinished step'
}

@test "lets-go picks the question mode from the Kind and relays at ask" {
  local phrase
  skill_says lets-go 'Questions: <mode>, because #<i> is a <Kind>.'
  skill_says lets-go 'Questions: <mode>, because you asked for it.'
  skill_says lets-go 'lets backlog item <i>'
  skill_says lets-go 'report the unresolved owner or checkpoint it carries, and stop, even on a stacked branch'
  skill_says lets-go 'The question mode is <mode>. At auto, the lets-go session answers each question that has a recommendation'
  skill_says lets-go 'Your rules are the same in both modes.'
  skill_says lets-go 'Write the answer as the user gave it, with no marker'
  for phrase in '#152 adds' 'chores only' 'its stop stands'; do
    skill_does_not_say lets-go "$phrase"
  done
}

# An agent follows the skill in reading order, so a rule that comes after
# the call is one it reads too late.
@test "lets-go states the blocker rule before it finds the source of demand" {
  local part read call
  part="$(part_section 'Check the issue')"
  read="${part%%"lets backlog item <i>"*}"
  call="${part%%"[Find the source of demand](#find-the-source-of-demand)"*}"
  [ "$read" != "$part" ] || { echo "Check the issue does not read the blockers"; false; }
  [ "$call" != "$part" ] || { echo "Check the issue does not run Find the source of demand"; false; }
  [ "${#read}" -lt "${#call}" ] ||
    { echo "Check the issue runs Find the source of demand before it reads the blockers"; false; }
  skill_says lets-go '[Check the issue](#check-the-issue) has read its blockers already'
  skill_does_not_say lets-go 'If an open issue blocks it, say so and stop' ||
    { echo "Find the source of demand still stops on a blocker of its own"; false; }
  skill_says lets-go 'return to the part that ran it'
  grep -qF 'Return to [Claim](../SKILL.md#claim), with the result.' <<<"$(skill_section lets-go 'What the preflight returns')" ||
    { echo "Glossary preflight does not return to Claim"; false; }
  ! grep -qiF 'return to *Claim*' <<<"$(procedure_text 'Find the source of demand' | tr -s '[:space:]' ' ')" ||
    { echo "Find the source of demand still returns to Claim, which never runs it"; false; }
  grep -qF '**`found`:** go on to [Confirm the packet](#confirm-the-packet)' <<<"$part" ||
    { echo "Check the issue does not go on to Confirm the packet on found"; false; }
  skill_does_not_say lets-go 'Otherwise, go on to [Confirm the packet](#confirm-the-packet).' ||
    { echo "Find the source of demand still picks the next section"; false; }
}

# The packet check decides between shaping and stopping on whether the branch
# exists, so the lookup must come first.
@test "lets-go looks for the branch before it confirms the packet" {
  local part look source confirm
  part="$(part_section 'Check the issue')"
  look="${part%%"git ls-remote --heads origin refs/heads/<name>"*}"
  source="${part%%"[Find the source of demand](#find-the-source-of-demand)"*}"
  confirm="${part%%"](#confirm-the-packet)"*}"
  [ "$look" != "$part" ] || { echo "Check the issue does not look for the change's branch"; false; }
  [ "$confirm" != "$part" ] || { echo "Check the issue does not run Confirm the packet"; false; }
  [ "${#look}" -lt "${#source}" ] ||
    { echo "Check the issue runs Find the source of demand before it looks for the branch"; false; }
  [ "${#look}" -lt "${#confirm}" ] ||
    { echo "Check the issue confirms the packet before it looks for the branch"; false; }
  ! grep -qF 'git ls-remote' <<<"$(part_section 'Enter the branch')" ||
    { echo "Enter the branch looks for the branch again"; false; }
}

@test "lets-go reads go.questions before it asks GitHub for anything" {
  local skill="$repo/skills/lets-go/SKILL.md" first_mode first_gh
  skill_says lets-go 'Questions: <mode>, because your lets config sets go.questions.'
  skill_says lets-go 'lets go questions'
  first_mode=$(grep -n 'lets go questions' "$skill" | head -1 | cut -d: -f1)
  first_gh=$(grep -nE '`gh ' "$skill" | head -1 | cut -d: -f1)
  [ "$first_mode" -lt "$first_gh" ] ||
    { echo "lets go questions is on line $first_mode, after a GitHub call on line $first_gh"; false; }
}

@test "the question mode rule is written once, in Set the question mode, and the shape step links it" {
  local shape mode
  shape="$(part_section 'Run the shape step')"
  mode="$(part_section 'Set the question mode')"
  grep -qF '](../SKILL.md#set-the-question-mode)' <<<"$shape" || { echo "Run the shape step does not link Set the question mode"; false; }
  ! grep -qF 'because your lets config sets go.questions' <<<"$shape" ||
    { echo "Run the shape step still writes the question mode rule"; false; }
  grep -qF '`auto` for a Chore or a Bug' <<<"$mode" || { echo "Set the question mode names no mode for a Chore or a Bug"; false; }
  grep -qF '`ask` for any other Kind' <<<"$mode" || { echo "Set the question mode names no mode for any other Kind"; false; }
  grep -qF 'Questions: ask, because shape has not run yet.' <<<"$mode" ||
    { echo "Set the question mode does not hold shape's line"; false; }
  skill_does_not_say lets-go 'After a shape step, set it again here'
  skill_says_once lets-go 'Questions: <mode>, because your lets config sets go.questions.'
}

@test "lets-go runs a shape step for an idea or an unshaped issue" {
  local phrase
  skill_says lets-go 'Done shape: <date>. <evidence>'
  skill_says lets-go 'Questions: ask, because shape has not run yet.'
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
  skill_says lets-go 'lets backlog find <branch>'
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
  skill_says lets-go '<shape-name>'
  skill_says lets-go '<session>'
  no_old_placeholders
}

# no_old_placeholders: no file of lets-go holds a placeholder name that once
# meant two things.
no_old_placeholders() {
  local old
  for old in '<n>' '<p>' '<name>-<step>' '<name>-shape' '<url>' '<issue URL>' '<words>'; do
    skill_does_not_say lets-go "$old" || return 1
  done
}

# placeholder_rows: the first cell of each row of lets-go's Placeholders
# table, without its backticks.
placeholder_rows() {
  awk '/^## Placeholders$/ { on = 1; next } /^## / { on = 0 } on && /^\|/' "${skills_dir:-$repo/skills}/lets-go/SKILL.md" |
    tail -n +3 | cut -d'|' -f2 | sed -E 's/^ *`?//; s/`? *$//'
}

@test "lets-go lists each placeholder once" {
  placeholders_listed_once
}

@test "the placeholder table check names a placeholder only a reference file uses" {
  fixture_file lets-go SKILL.md '# lets-go' '' '## Placeholders' '' '| Placeholder | What | Where |' '|---|---|---|' \
    '| `<i>` | The issue | Start |' '' '## Start' '' 'Read `#<i>`.'
  fixture_file lets-go references/glossary-preflight.md 'Check out `<base>` first.'
  run placeholders_listed_once
  [ "$status" -eq 1 ] || { echo "it passed on a placeholder with no row"; false; }
  [ "$output" = 'the Placeholders table: <base> has 0 rows' ] || { echo "it said: $output"; false; }
}

@test "the old placeholder check fails on an old name only a reference file uses" {
  fixture_file lets-go references/claim.md 'Run `gh project item-edit <n>`.'
  run no_old_placeholders
  [ "$status" -eq 1 ] || { echo "it passed on <n> in a reference file"; false; }
  [[ "$output" == *'<n>'* ]] || { echo "it said: $output"; false; }
}

# placeholders_listed_once: each placeholder in lets-go's SKILL.md or a
# reference file is the first cell of one row of the Placeholders table.
placeholders_listed_once() {
  local placeholder rows count wrong=()
  rows="$(placeholder_rows)"
  while IFS= read -r placeholder; do
    count="$(grep -cxF -- "$placeholder" <<<"$rows" || true)"
    [ "$count" -eq 1 ] || wrong+=("$placeholder has $count rows")
  done < <(skill_rows lets-go '<[A-Za-z][^<>]*>' | grep -oE '<[A-Za-z][^<>]*>' | sort -u)
  [ "${#wrong[@]}" -eq 0 ] || { printf 'the Placeholders table: %s\n' "${wrong[@]}"; return 1; }
}

# prose_text <file>: each line's text outside fenced code and inline code
# spans, as <line>: <prose>. A fence closes only on a line of its own
# character, at least as long as the line that opened it, so a four-backtick
# fence holds three-backtick ones. A code span closes on a run of as many
# backticks as opened it.
prose_text() {
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
      print NR ": " text
    }' "$1"
}

# prose_placeholders <file>: each placeholder in the prose_text of the file,
# as <line>: <placeholder>. GitHub reads one there as an HTML tag.
prose_placeholders() {
  prose_text "$1" | awk '{
    line = $0; sub(/:.*/, "", line); text = substr($0, length(line) + 3)
    while (match(text, /<[A-Za-z][^<>]*>/)) {
      print line ": " substr(text, RSTART, RLENGTH); text = substr(text, RSTART + RLENGTH)
    }
  }'
}

# skill_prose_placeholders <skill>: prose_placeholders for each of the
# skill's files, as <file>:<line>: <placeholder>, the file under the skills
# folder.
skill_prose_placeholders() {
  local file
  while IFS= read -r file; do
    prose_placeholders "$file" | sed "s|^|${file#"${skills_dir:-$repo/skills}/"}:|"
  done < <(skill_files "$1")
}

# step_numbers <skill>: each step or steps followed by a number, in any case,
# in the prose_text of each of the skill's files, as <file>:<line>: <match>,
# the file under the skills folder. A match may wrap from one line to the
# next. A number shifts when a step is added, so a reference names the part
# instead.
step_numbers() {
  local file out
  out="$(skill_files "$1" | while IFS= read -r file; do
    prose_text "$file" | awk -v name="${file#"${skills_dir:-$repo/skills}/"}" '{
      line = $0; sub(/:.*/, "", line); text = substr($0, length(line) + 3)
      if (line == last + 1 && match(tolower(tail), /(^|[^a-z])steps? *$/) && match(text, /^ *[0-9]+/)) {
        found = tail; sub(/ *$/, "", found); found = substr(found, length(found) - 5); sub(/^.*[^A-Za-z]/, "", found)
        number = substr(text, RSTART, RLENGTH); sub(/^ */, "", number)
        print name ":" last ": " found " " number
      }
      last = line; tail = text
      while (match(tolower(text), /(^|[^a-z])steps? [0-9]+/)) {
        found = substr(text, RSTART, RLENGTH); sub(/^[^A-Za-z]/, "", found)
        print name ":" line ": " found; text = substr(text, RSTART + RLENGTH)
      }
    }'
  done)"
  [ -z "$out" ] || { echo "$out"; return 1; }
}

@test "lets-go writes no placeholder outside code" {
  run skill_prose_placeholders lets-go
  [ -z "$output" ] || { echo "lets-go has placeholders outside code:"; echo "$output"; false; }
}

@test "the placeholder check names the reference file a placeholder outside code is in" {
  fixture_file lets-go references/records.md 'Read `#<i>` first.' 'Then see pull request #<pr> here.'
  run skill_prose_placeholders lets-go
  [ "$output" = 'lets-go/references/records.md:2: <pr>' ] || { echo "it found: $output"; false; }
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

@test "the step number check names the file and the step it finds" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Go on from *Claim* step 3.'
  run step_numbers lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a step number"; false; }
  [ "$output" = 'lets-go/SKILL.md:3: step 3' ] || { echo "it found: $output"; false; }
}

@test "the step number check finds a step number that wraps across two lines" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Go on from *Claim* step' '3, then stop.'
  run step_numbers lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a step number across a line break"; false; }
  [ "$output" = 'lets-go/SKILL.md:3: step 3' ] || { echo "it found: $output"; false; }
}

@test "the step number check passes a numbered list" {
  fixture_file lets-go SKILL.md '# lets-go' '## Run' '1. Read.' '2. Check.' '3. Claim.' '4. Stop.'
  step_numbers lets-go
}

@test "the step number check skips a step number inside a code span" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Old skills said `step 3` here.'
  step_numbers lets-go
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

# The parts of a lets-go run, in run order. Each is a ## heading of SKILL.md.
lets_go_parts=('Read the settings' 'Read the request' 'Start from an idea' 'Check the issue' 'Run the shape step'
  'Pick the first ready story' 'Route' 'Enter the branch' 'Set the question mode' 'Walk the step table' 'End of the run')

# heading_anchor <heading>: the anchor GitHub makes from a heading's text.
heading_anchor() {
  printf '%s' "$1" | tr 'A-Z' 'a-z' | tr ' ' '-' | tr -cd 'a-z0-9_-'
}

# lets_go_skill: the path of lets-go's SKILL.md.
lets_go_skill() {
  echo "${skills_dir:-$repo/skills}/lets-go/SKILL.md"
}

# part_section <name>: the ## section of that name in lets-go's SKILL.md, its
# subsections included, up to the next ## heading, then the section of the
# same name in a reference file, at any level, up to the next heading at its
# level or above, on one line. A part whose steps moved keeps its heading and
# its Next: line in SKILL.md.
part_section() {
  local files
  mapfile -t files < <(skill_files lets-go)
  {
    awk -v name="## $1" "$fence_rules"'
      !code && /^## / { on = ($0 == name); next }
      on' "${files[0]}"
    [ "${#files[@]}" -lt 2 ] || awk -v name="$1" "$fence_rules"'
      FNR == 1 { level = 0 }
      !code && /^#+ / {
        depth = index($0, " ") - 1
        if (level && depth <= level) level = 0
        if (!level && substr($0, depth + 2) == name) { level = depth; next }
      }
      level' "${files[@]:1}"
  } | tr -s '[:space:]' ' ' | sed 's/^ //; s/ $//'
}

# parts_listed: the overview table before ## Placeholders has one row for
# each part, in run order, that links the part's heading, and each part is a ##
# heading after ## Placeholders, in the same order.
parts_listed() {
  local skill rows headings part index count anchor previous=0 wrong=()
  skill="$(lets_go_skill)"
  rows="$(awk "$fence_rules"' !code && /^## Placeholders$/ { exit } !code && /^\|/' "$skill" |
    sed -nE 's/^\| *\[([^]]*)\]\(#([^)]*)\).*/\1\t\2/p')"
  for part in "${lets_go_parts[@]}"; do
    index="$(cut -f1 <<<"$rows" | grep -nxF -- "$part" | head -1 | cut -d: -f1)"
    if [ -z "$index" ]; then wrong+=("the overview has no row for $part"); continue; fi
    count="$(cut -f1 <<<"$rows" | grep -cxF -- "$part")"
    [ "$count" -eq 1 ] || wrong+=("the overview has $count rows for $part")
    [ "$index" -gt "$previous" ] || wrong+=("the overview lists $part out of order")
    previous="$index"
    anchor="$(sed -n "${index}p" <<<"$rows" | cut -f2)"
    [ "$anchor" = "$(heading_anchor "$part")" ] || wrong+=("the overview's row for $part links #$anchor")
  done
  headings="$(awk "$fence_rules"' !code && /^## / { print substr($0, 4) }' "$skill")"
  previous="$(grep -nxF Placeholders <<<"$headings" | head -1 | cut -d: -f1)"
  [ -n "$previous" ] || { wrong+=("there is no ## Placeholders heading"); previous=0; }
  for part in "${lets_go_parts[@]}"; do
    index="$(grep -nxF -- "$part" <<<"$headings" | head -1 | cut -d: -f1)"
    if [ -z "$index" ]; then wrong+=("there is no ## heading for $part"); continue; fi
    [ "$index" -gt "$previous" ] || wrong+=("the ## heading for $part is out of order")
    previous="$index"
  done
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

# parts_say_next: each part but End of the run ends its own text, up to its
# first heading of any level, with a paragraph that starts Next:.
parts_say_next() {
  local part wrong=()
  for part in "${lets_go_parts[@]}"; do
    [ "$part" != 'End of the run' ] || continue
    awk -v name="## $part" "$fence_rules"'
      !code && /^#+ / { if (on) exit; on = ($0 == name); fresh = 1; next }
      !on { next }
      code { last = ""; fresh = 0; next }
      /^ *$/ { fresh = 1; next }
      fresh { last = $0; fresh = 0 }
      END { exit !(last ~ /^Next: /) }' "$(lets_go_skill)" || wrong+=("$part does not end with a Next: line")
  done
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

# file_anchors <file>: the anchor of each of the file's headings outside
# code, one per line.
file_anchors() {
  awk "$fence_rules"' !code && /^#+ / { sub(/^#+ /, ""); print }' "$1" |
    while IFS= read -r heading; do heading_anchor "$heading"; echo; done
}

# anchors_resolve <skill>: each link outside code, in each of the skill's
# files, resolves. A ](#<anchor>) link is the anchor of one of that file's
# own headings. A link to another file names, relative to the linking file,
# a file that exists, and its #<anchor>, if it has one, is the anchor of one
# of that file's headings. A link with a URL scheme, or one that leaves the
# skills folder, is not checked. Prints each link that does not resolve as
# <file>: <link>, the file under the skills folder.
anchors_resolve() {
  local root file name anchors anchor link path target out=""
  root="$(realpath -m "${skills_dir:-$repo/skills}")"
  while IFS= read -r file; do
    name="${file#"${skills_dir:-$repo/skills}/"}"
    anchors="$(file_anchors "$file")"
    while IFS= read -r anchor; do
      grep -qxF -- "$anchor" <<<"$anchors" || out+="$name: #$anchor"$'\n'
    done < <(prose_text "$file" | grep -oE '\]\(#[^)]*\)' | sed -E 's/^\]\(#//; s/\)$//' | sort -u)
    while IFS= read -r link; do
      ! grep -qE '^[A-Za-z][A-Za-z0-9+.-]*:' <<<"$link" || continue
      path="${link%%#*}"
      target="$(realpath -m "$(dirname "$file")/$path")"
      [[ "$target" == "$root"/* ]] || continue
      if [ ! -f "$target" ]; then out+="$name: $link"$'\n'; continue; fi
      [[ "$link" == *'#'* ]] || continue
      grep -qxF -- "${link#*#}" <<<"$(file_anchors "$target")" || out+="$name: $link"$'\n'
    done < <(prose_text "$file" | grep -oE '\]\([^)#][^)]*\)' | sed -E 's/^\]\(//; s/\)$//' | sort -u)
  done < <(skill_files "$1")
  [ -z "$out" ] || { printf '%s' "$out"; return 1; }
}

@test "the link check names a link to a heading that is gone" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Go back to [Start](#start).'
  run anchors_resolve lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a link to no heading"; false; }
  [ "$output" = 'lets-go/SKILL.md: #start' ] || { echo "it said: $output"; false; }
}

@test "the link check drops punctuation from a heading's anchor" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'See [the name](#the-changes-name).' '' "### The change's name" '' 'Text.'
  anchors_resolve lets-go
}

@test "the link check reads a reference file against its own headings" {
  fixture_file lets-go references/glossary-preflight.md '## Check the prerequisite' '' 'Run [Check the prerequisite](#check-the-prerequisite) again.'
  anchors_resolve lets-go
}

# has_heading <file> <name>: a line of the file outside code is a heading
# with that name, at any level.
has_heading() {
  awk -v name="$2" "$fence_rules"'
    !code && /^#+ / && substr($0, index($0, " ") + 1) == name { found = 1 }
    END { exit !found }' "$1"
}

# section_moved <file> <name>...: each section is a heading of lets-go's
# <file>, and no heading of its SKILL.md. Prints each one that is not.
section_moved() {
  local dir="${skills_dir:-$repo/skills}/lets-go" file="$1" name wrong=()
  shift
  for name in "$@"; do
    [ -f "$dir/$file" ] && has_heading "$dir/$file" "$name" || wrong+=("lets-go/$file has no heading: $name")
    ! has_heading "$dir/SKILL.md" "$name" || wrong+=("lets-go/SKILL.md still has a heading: $name")
  done
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

@test "the moved section check names a section left behind" {
  fixture_file lets-go SKILL.md '# lets-go' '' '### Records that disagree' '' 'Text.'
  fixture_file lets-go references/records.md '# Records' '' '## Records that disagree' '' 'Text.'
  run section_moved references/records.md 'Records that disagree'
  [ "$status" -eq 1 ] || { echo "it passed on a section left behind"; false; }
  [ "$output" = 'lets-go/SKILL.md still has a heading: Records that disagree' ] || { echo "it said: $output"; false; }
}

# The three parts whose steps moved keep a heading in SKILL.md, so they are
# not rows here.
@test "lets-go keeps each moved section in its reference file" {
  section_moved references/records.md 'Read the records' 'Records that disagree'
  section_moved references/subagent.md 'Run a step in a subagent'
  section_moved references/glossary-handoff.md 'Glossary preflight' 'Check the prerequisite' 'Check the checkpoint' \
    'What the preflight returns' 'Import the glossary checkpoint' 'Import the commits' 'Recover from a failed import'
  section_moved references/shape.md 'Commit the discovery map' "The shape step's name" 'What shape runs'
  section_moved references/step-prompt.md 'Write the prompt'
}

# frame_block <file>: the line number that opens the first outermost fenced
# block of the file holding ## What to run, ## Questions and ## The report.
frame_block() {
  awk '
    fence == "" && match($0, /^ *(```+|~~~+)/) {
      fence = substr($0, RSTART, RLENGTH); sub(/^ */, "", fence); open = NR; found = 0; next
    }
    fence != "" {
      line = $0; sub(/^ */, "", line); sub(/ *$/, "", line)
      if (line ~ /^(`+|~+)$/ && substr(line, 1, 1) == substr(fence, 1, 1) && length(line) >= length(fence)) {
        fence = ""; if (found == 3) { print open; exit }
        next
      }
      if ($0 == "## What to run" || $0 == "## Questions" || $0 == "## The report") found++
    }' "$1"
}

@test "the prompt frame is one block to copy" {
  local file="$repo/skills/lets-go/references/step-prompt.md" open
  [ -f "$file" ] || { echo "lets-go has no references/step-prompt.md"; false; }
  open="$(frame_block "$file")"
  [ -n "$open" ] || { echo "no fenced block of step-prompt.md holds the whole frame"; false; }
  head -n "$((open - 1))" "$file" | tr -s '[:space:]' ' ' | grep -qF '`.workspace/lets-go/<session>-prompt.md`' ||
    { echo "the text before the frame does not name where to copy it"; false; }
  grep -qF '](references/step-prompt.md#write-the-prompt)' <<<"$(skill_part 'Run a step')" ||
    { echo "Run a step does not link the prompt"; false; }
}

# skill_part <name>: the ## section of that name in lets-go's SKILL.md alone,
# its subsections included, up to the next ## heading.
skill_part() {
  awk -v name="## $1" "$fence_rules"'
    !code && /^## / { on = ($0 == name); next }
    on' "$(lets_go_skill)"
}

# A run that never shapes loads none of shape's steps, but each part keeps
# its place in the run, and its Next: line, in SKILL.md.
@test "each part whose steps moved links them in references/shape.md" {
  local part text
  for part in 'Start from an idea' 'Run the shape step' 'Pick the first ready story'; do
    text="$(skill_part "$part")"
    grep -qF "](references/shape.md#$(heading_anchor "$part"))" <<<"$text" ||
      { echo "$part does not link its steps in references/shape.md"; false; }
    ! grep -qE '^ *[0-9]+\. ' <<<"$text" || { echo "$part still has steps in SKILL.md"; false; }
    has_heading "$repo/skills/lets-go/references/shape.md" "$part" ||
      { echo "references/shape.md has no heading: $part"; false; }
  done
}

# Most issues carry no glossary handoff, so they need not load its file.
@test "Find the source of demand reads the glossary file only for an issue with a Glossary handoff" {
  local text
  text="$(procedure_text 'Find the source of demand' | tr -s '[:space:]' ' ')"
  grep -qF 'Read [the glossary handoff](references/glossary-handoff.md) only for an issue whose body has a **Glossary handoff** section.' <<<"$text" ||
    { echo "Find the source of demand does not gate the glossary file"; false; }
  grep -qF 'For an issue with none, [Check the prerequisite](references/glossary-handoff.md#check-the-prerequisite) returns `resolved`, and you read no file.' <<<"$text" ||
    { echo "Find the source of demand does not say what an issue with no handoff returns"; false; }
}

@test "Claim reads the glossary file only for an issue with a Glossary handoff" {
  local text
  text="$(procedure_text 'Claim' | tr -s '[:space:]' ' ')"
  grep -qF 'When the issue'"'"'s body has no **Glossary handoff** section, [Glossary preflight](references/glossary-handoff.md#glossary-preflight) returns `no-owned-edits`, and you read no file.' <<<"$text" ||
    { echo "Claim does not say what an issue with no handoff returns"; false; }
  grep -qF 'Otherwise run [Glossary preflight](references/glossary-handoff.md#glossary-preflight)' <<<"$text" ||
    { echo "Claim does not link the glossary file"; false; }
}

@test "the subagent follows the saved prompt and makes only the step's changes" {
  local section phrase
  section="$(skill_section lets-go 'Run a step in a subagent')"
  for phrase in 'follows the saved prompt' 'works only in this repository on the branch `<name>`' \
    'makes only the changes that the step calls for'; do
    grep -qF -- "$phrase" <<<"$section" || { echo "Run a step in a subagent does not say: $phrase"; false; }
  done
  skill_does_not_say lets-go 'may write files'
}

@test "the link check passes a link to a heading in another file" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'See where [records disagree](references/records.md#records-that-disagree).'
  fixture_file lets-go references/records.md '# Records' '' '## Records that disagree' '' 'Text.'
  anchors_resolve lets-go
}

@test "the link check passes a link to another file with no anchor" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Read [the records](references/records.md).'
  fixture_file lets-go references/records.md '# Records'
  anchors_resolve lets-go
}

@test "the link check names a link to a missing file" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Copy [the frame](references/frame.md).'
  run anchors_resolve lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a link to no file"; false; }
  [ "$output" = 'lets-go/SKILL.md: references/frame.md' ] || { echo "it said: $output"; false; }
}

@test "the link check names a link to a heading another file does not have" {
  fixture_file lets-go SKILL.md '# lets-go' '' '## Route'
  fixture_file lets-go references/shape.md '# Shape' '' 'Go on from [Check the issue](../SKILL.md#check-the-issue).'
  run anchors_resolve lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a link to no heading"; false; }
  [ "$output" = 'lets-go/references/shape.md: ../SKILL.md#check-the-issue' ] || { echo "it said: $output"; false; }
}

@test "the link check skips a link with a URL scheme" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'See [the spec](https://example.com/spec.md#nothing).'
  anchors_resolve lets-go
}

@test "the link check skips a link that leaves the skills folder" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'See [the README](../../README.md#nothing).'
  anchors_resolve lets-go
}

# parts_fixture [<option>=<part>]...: a lets-go fixture SKILL.md with an
# overview row and a heading for each part, then ## Placeholders. Each part
# but End of the run ends with a Next: line. no_row=<part> leaves out its
# overview row, twice=<part> gives it two, no_next=<part> leaves out its
# Next: line, and subsection=<part> adds a ### subsection after its Next: line.
parts_fixture() {
  local no_row="" twice="" no_next="" subsection="" option part lines=('# lets-go' '' '| Part | Next |' '|---|---|')
  for option in "$@"; do local "$option"; done
  for part in "${lets_go_parts[@]}"; do
    [ "$part" = "$no_row" ] || lines+=("| [$part](#$(heading_anchor "$part")) | the next part |")
    [ "$part" != "$twice" ] || lines+=("| [$part](#$(heading_anchor "$part")) | the next part |")
  done
  lines+=('' '## Placeholders' '' 'Names.')
  for part in "${lets_go_parts[@]}"; do
    lines+=('' "## $part" '' 'Text.' '')
    if [ "$part" = 'End of the run' ]; then lines+=('The run is over.')
    elif [ "$part" != "$no_next" ]; then lines+=('Next: [Route](#route) when it' 'passes.')
    fi
    [ "$part" != "$subsection" ] || lines+=('' '### More' '' 'Subsection text.')
  done
  fixture_file lets-go SKILL.md "${lines[@]}"
}

@test "part_section reads a part through its subsections, up to the next part" {
  fixture_file lets-go SKILL.md '# lets-go' '## Route' 'First,' '````text' '## not a heading' '````' '### Sub' 'last.' '## Enter the branch' 'Not this.'
  run part_section 'Route'
  [ "$output" = 'First, ````text ## not a heading ```` ### Sub last.' ] || { echo "it read: $output"; false; }
}

@test "part_section reads a part's steps in a reference file after its SKILL.md section" {
  fixture_file lets-go SKILL.md '# lets-go' '## Run the shape step' 'Its steps are in shape.md.' '' 'Next: [Route](#route).' '## Route' 'Not this.'
  fixture_file lets-go references/shape.md '# Shape' '## Run the shape step' 'Check the discovery map.' '### More' 'Its subsection.' '## Commit the discovery map' 'Not this.'
  run part_section 'Run the shape step'
  [ "$output" = 'Its steps are in shape.md. Next: [Route](#route). Check the discovery map. ### More Its subsection.' ] || { echo "it read: $output"; false; }
}

@test "the part overview check passes every part, listed and in order" {
  parts_fixture
  parts_listed
}

@test "the part overview check names a part with no row" {
  parts_fixture no_row=Route
  run parts_listed
  [ "$status" -eq 1 ] || { echo "it passed on an overview with no Route row"; false; }
  [ "$output" = 'the overview has no row for Route' ] || { echo "it said: $output"; false; }
}

@test "the part overview check names a part with two rows" {
  parts_fixture twice=Route
  run parts_listed
  [ "$status" -eq 1 ] || { echo "it passed on an overview with two Route rows"; false; }
  [ "$output" = 'the overview has 2 rows for Route' ] || { echo "it said: $output"; false; }
}

@test "the part Next check names a part with no Next line" {
  parts_fixture 'no_next=Set the question mode'
  run parts_say_next
  [ "$status" -eq 1 ] || { echo "it passed on a part with no Next line"; false; }
  [ "$output" = 'Set the question mode does not end with a Next: line' ] || { echo "it said: $output"; false; }
}

@test "the part Next check passes a Next line before a subsection" {
  parts_fixture 'subsection=Walk the step table'
  parts_say_next
}

@test "lets-go lists its parts in an overview, and has no Start part" {
  parts_listed
  ! grep -qx '## Start' "$(lets_go_skill)" || { echo "lets-go still has a ## Start heading"; false; }
}

@test "lets-go's entry table has a row for each branch and a column for each request" {
  local part cell
  part="$(part_section 'Read the request')"
  for cell in '| A number | An idea | Nothing |' '| The default branch |' '| Another branch, `<branch>` |'; do
    grep -qF -- "$cell" <<<"$part" || { echo "the entry table does not say: $cell"; false; }
  done
}

@test "lets-go asks whether a mode word beside an idea names the question mode" {
  local part phrase
  part="$(part_section 'Read the request')"
  for phrase in \
    'A leading or trailing `ask` or `auto` may name the question mode' \
    'When the rest of the request is a number or nothing, the word names the question mode: take it off, and keep it for [Set the question mode](#set-the-question-mode)' \
    'When the rest is words, on the default branch, ask the user whether the word names the question mode or is part of the idea' \
    'Show both readings' \
    'Ask it in either mode, before [Start from an idea](#start-from-an-idea) runs' \
    'When the user says the word names the question mode, take it off, and keep it for [Set the question mode](#set-the-question-mode)' \
    'Otherwise the word stays in the idea, and [Set the question mode](#set-the-question-mode) takes the question mode from its next source' \
    'On another branch, ask nothing about the word: words stop the run there'; do
    grep -qF -- "$phrase" <<<"$part" || { echo "Read the request does not say: $phrase"; false; }
  done
  ! grep -qiE '\blevel\b|`recommend`' <<<"$part" || { echo "Read the request still names the level"; false; }
  grep -qF 'Takes a question mode off the request, after asking the user when the mode word sits beside an idea' <<<"$(overview_row 'Read the request')" ||
    { echo "Read the request's row does not name the question mode: $(overview_row 'Read the request')"; false; }
  skill_does_not_say lets-go 'names the question mode: take it off, and keep it for [Set the question mode](#set-the-question-mode). What is left'
}

@test "lets-go stops an idea with no letter or digit" {
  local part
  part="$(part_section 'Read the request')"
  grep -qF 'When the idea holds no letter or digit, in any script, say that an idea needs at least one letter or digit, and stop, claiming nothing and running no step' <<<"$part" ||
    { echo "Read the request does not stop an idea with no letter or digit"; false; }
  grep -qF 'before the discovery query and the title search' <<<"$part" ||
    { echo "Read the request does not stop before the discovery query and the title search"; false; }
  grep -qF 'an idea with no letter or digit' <<<"$(overview_row 'Read the request')" ||
    { echo "Read the request's row does not name the stop: $(overview_row 'Read the request')"; false; }
}

@test "the shape step's name is never idea- alone" {
  local section
  section="$(skill_section lets-go "The shape step's name")"
  grep -qF '[Read the request](../SKILL.md#read-the-request) has already stopped an idea with no letter or digit, so `<slug>` is never empty, and no shape step is named `idea-`' <<<"$section" ||
    { echo "The shape step's name does not say <slug> is never empty"; false; }
}

@test "lets-go limits a step's rounds at auto" {
  local section
  section="$(skill_section lets-go 'Relay the questions')"
  skill_says_once lets-go 'Questions: ask for the rest of this step, because it asked for input five times.'
  grep -qF 'From the step'"'"'s sixth `needs-input` report in this run, relay every question of the step as at `ask`, whatever `<mode>` is: ask the user each one, show the `recommendation` as the suggested answer, and write the answer as the user gave it, with no marker' <<<"$section" ||
    { echo "Relay the questions does not relay as at ask from the sixth report"; false; }
  grep -qF 'Before the first such question, print this line once' <<<"$section" ||
    { echo "Relay the questions does not print the Questions line once"; false; }
  grep -qF 'The count is per step and per run: a new run, or another step, starts again at none. The settled-question stop above still holds' <<<"$section" ||
    { echo "Relay the questions does not say the count is per step and per run"; false; }
  grep -qF 'A step'"'"'s rounds go on until its report is `done` or `failed`. From its sixth `needs-input` report, the user answers its questions, as the limit above says' <<<"$section" ||
    { echo "the closing sentence does not link the limit"; false; }
}

@test "an archived change keeps the schema it was built with" {
  local part change archive route
  part="$(part_section 'Enter the branch')"
  grep -qF 'Set `<schema>` from the `schema:` line of the first of these files that exists' <<<"$part" ||
    { echo "Enter the branch does not set the schema from the first file that exists"; false; }
  change="$(grep -bo -F '`openspec/changes/<name>/.openspec.yaml`' <<<"$part" | head -1 | cut -d: -f1)"
  archive="$(grep -bo -F '`openspec/changes/archive/<YYYY-MM-DD>-<name>/.openspec.yaml`' <<<"$part" | head -1 | cut -d: -f1)"
  route="$(grep -bo -F 'When neither exists, it is the schema [Route](#route) picked' <<<"$part" | head -1 | cut -d: -f1)"
  [ -n "$change" ] && [ -n "$archive" ] && [ -n "$route" ] ||
    { echo "Enter the branch does not name all three sources: change $change, archive $archive, route $route"; false; }
  [ "$change" -lt "$archive" ] && [ "$archive" -lt "$route" ] ||
    { echo "the sources are out of order: change $change, archive $archive, route $route"; false; }
}

# overview_row <part>: the overview's row for the part.
overview_row() {
  awk '/^## Placeholders$/ { exit } /^\|/' "$(lets_go_skill)" | grep -F -- "| [$1](#"
}

@test "the overview names the results each part stops on" {
  local overview
  overview="$(awk '/^## Placeholders$/ { exit } /^\|/' "$(lets_go_skill)")"
  ! grep -qiF 'a stop in' <<<"$overview" || { echo "the overview still names a stop in a procedure"; false; }
  grep -qF '`taken`' <<<"$(overview_row 'Enter the branch')" || { echo "Enter the branch's row does not name taken"; false; }
  grep -qF '`epic`' <<<"$(overview_row 'Check the issue')" || { echo "Check the issue's row does not name epic"; false; }
  ! grep -qF 'Project' <<<"$(overview_row 'Read the settings')" ||
    { echo "Read the settings' row still reads the Project"; false; }
  [[ "$(overview_row 'Start from an idea')" == *'| Never |' ]] ||
    { echo "Start from an idea's row still stops: $(overview_row 'Start from an idea')"; false; }
}

@test "the overview's Next for Enter the branch names both ways back after a lost claim" {
  overview_row 'Enter the branch' | grep -qF '[Read the request](#read-the-request) or [Pick the first ready story](#pick-the-first-ready-story) after a lost claim' ||
    { echo "it said: $(overview_row 'Enter the branch')"; false; }
}

@test "each lets-go part but the last ends with a Next line" {
  parts_say_next
}

# next_line <part>: the Next: line that ends the part's own text.
next_line() {
  local text
  text="$(skill_section lets-go "$1")"
  [[ "$text" == *'Next: '* ]] && echo "Next: ${text##*Next: }"
}

@test "Route's Next line goes to Enter the branch" {
  grep -qF '](#enter-the-branch)' <<<"$(next_line Route)" || { echo "it said: $(next_line Route)"; false; }
}

@test "Walk the step table's Next line, before its subsection, goes to End of the run" {
  grep -qF '](#end-of-the-run)' <<<"$(next_line 'Walk the step table')" || { echo "it said: $(next_line 'Walk the step table')"; false; }
}

@test "Check the issue's Next line goes to shape or to Route, each with its condition" {
  local line
  line="$(next_line 'Check the issue')"
  grep -qE '\]\(#run-the-shape-step\) when .*; otherwise \[Route\]\(#route\)' <<<"$line" || { echo "it said: $line"; false; }
}

@test "End of the run says the run is over, with no Next line" {
  local text
  text="$(skill_section lets-go 'End of the run')"
  [[ "$text" == *'The run is over.' ]] || { echo "End of the run does not end with: The run is over."; false; }
  [[ "$text" != *'Next: '* ]] || { echo "End of the run has a Next line"; false; }
}

# procedure_text <name>: the procedure of that name, a heading at any level
# in lets-go's SKILL.md or a reference file, its subsections included, up to
# the next heading at its level or above.
procedure_text() {
  local files
  mapfile -t files < <(skill_files lets-go)
  awk -v name="$1" "$fence_rules"'
    FNR == 1 { level = 0 }
    !code && /^#+ / {
      depth = index($0, " ") - 1
      if (level && depth <= level) level = 0
      if (!level && substr($0, depth + 2) == name) { level = depth; next }
    }
    level' "${files[@]}"
}

# override_idioms <skill>: each aside, and each stand or stands not followed
# by " for", in any case, in the prose_text of each of the skill's files, as
# <file>:<line>: <word>, the file under the skills folder. A stop set aside,
# or one that stands, overrides what another section said; the skill states
# the action instead.
override_idioms() {
  local file out
  out="$(skill_files "$1" | while IFS= read -r file; do
    prose_text "$file" | awk -v name="${file#"${skills_dir:-$repo/skills}/"}" '{
      line = $0; sub(/:.*/, "", line); text = substr($0, length(line) + 3); lower = tolower(text)
      while (match(lower, /(^|[^a-z])(aside|stands?)([^a-z]|$)/)) {
        word = substr(text, RSTART, RLENGTH); sub(/^[^A-Za-z]/, "", word); sub(/[^A-Za-z]$/, "", word)
        rest = substr(lower, RSTART + RLENGTH - 1)
        if (tolower(word) == "aside" || rest !~ /^ for([^a-z]|$)/) print name ":" line ": " word
        text = substr(text, RSTART + RLENGTH - 1); lower = substr(lower, RSTART + RLENGTH - 1)
      }
    }'
  done)"
  [ -z "$out" ] || { echo "$out"; return 1; }
}

# procedure_stops <name>: each line of the procedure's prose_text, its
# subsections included, that holds the word stop or stops, in any case, as
# <name>:<line>: <text>. A procedure returns a result, and the part that ran
# it decides whether to stop.
procedure_stops() {
  local file="$BATS_TEST_TMPDIR/procedure.md" out
  procedure_text "$1" >"$file"
  out="$(prose_text "$file" | grep -iE '(^|[^A-Za-z])stops?([^A-Za-z]|$)' | sed "s|^|$1:|")"
  [ -z "$out" ] || { echo "$out"; return 1; }
}

@test "each lets-go procedure returns to the part that ran it, with no Next line" {
  local procedure text
  for procedure in 'Find the source of demand' 'Confirm the packet' 'Glossary preflight' 'Claim' \
    'Import the glossary checkpoint' 'Commit the discovery map'; do
    text="$(procedure_text "$procedure")"
    [ -n "$text" ] || { echo "lets-go has no procedure $procedure"; false; }
    # Only Claim runs the whole preflight, so it returns there.
    if [ "$procedure" = 'Glossary preflight' ]; then
      tr -s '[:space:]' ' ' <<<"$text" | grep -qF 'Return to [Claim](../SKILL.md#claim), with the result.' ||
        { echo "$procedure does not return to Claim"; false; }
    else
      tr -s '[:space:]' ' ' <<<"$text" | grep -qi 'return to the part that ran it' ||
        { echo "$procedure does not return to the part that ran it"; false; }
    fi
    ! grep -q '^Next: ' <<<"$text" || { echo "$procedure has a Next line"; false; }
    procedure_stops "$procedure"
  done
}

@test "the procedure stops check names a procedure that says stop" {
  fixture_file lets-go SKILL.md '# lets-go' '## Procedures' '### Confirm the packet' '' \
    'Say to run the `lets-shape` skill on `#<i>`, and stop.' '' 'Return to the part that ran it.'
  run procedure_stops 'Confirm the packet'
  [ "$status" -eq 1 ] || { echo "it passed on a procedure that says stop"; false; }
  [[ "$output" == 'Confirm the packet:'*'stop'* ]] || { echo "it said: $output"; false; }
}

@test "the procedure stops check names a procedure in a reference file that says stop" {
  fixture_file lets-go references/glossary-handoff.md '# Glossary handoff' '' '## Glossary preflight' '' 'Say so, and stop.' \
    '' '### Check the prerequisite' '' 'Return to the section that ran it.' '' '## Import the glossary checkpoint' '' 'Not this.'
  run procedure_stops 'Glossary preflight'
  [ "$status" -eq 1 ] || { echo "it passed on a procedure that says stop"; false; }
  [ "$output" = 'Glossary preflight:2: Say so, and stop.' ] || { echo "it said: $output"; false; }
}

@test "procedure_text reads a procedure in a reference file through its subsections" {
  fixture_file lets-go references/glossary-handoff.md '# Glossary handoff' '## Glossary preflight' 'First.' \
    '### Check the prerequisite' 'Second.' '## Import the glossary checkpoint' 'Not this.'
  [ "$(procedure_text 'Glossary preflight' | tr -s '[:space:]' ' ')" = 'First. ### Check the prerequisite Second. ' ] ||
    { echo "it read: $(procedure_text 'Glossary preflight')"; false; }
}

@test "the procedure stops check skips stop inside a code span" {
  fixture_file lets-go SKILL.md '# lets-go' '## Procedures' '### Confirm the packet' '' \
    'Old skills said `stop` here.' '' 'Return to the part that ran it.'
  procedure_stops 'Confirm the packet'
}

@test "the procedure stops check passes a procedure that returns a result" {
  fixture_file lets-go SKILL.md '# lets-go' '## Procedures' '### Confirm the packet' '' \
    'If a line is missing, the result is `needs-shape`.' '' 'Return to the part that ran it, with the result.'
  procedure_stops 'Confirm the packet'
}

@test "the override idiom check names a stop that stands" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'When nothing is ready, the stop in `next` stands.'
  run override_idioms lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a stop that stands"; false; }
  [ "$output" = 'lets-go/SKILL.md:3: stands' ] || { echo "it said: $output"; false; }
}

@test "the override idiom check names a stop set aside" {
  fixture_file lets-go references/claim.md 'On the default branch, set that stop aside.'
  run override_idioms lets-go
  [ "$status" -eq 1 ] || { echo "it passed on a stop set aside"; false; }
  [ "$output" = 'lets-go/references/claim.md:1: aside' ] || { echo "it said: $output"; false; }
}

@test "lets-go states each action, with no override idiom" {
  override_idioms lets-go
}

@test "the override idiom check passes stands for" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Each one stands for one thing.' '' '| Placeholder | What it stands for |'
  override_idioms lets-go
}

@test "Confirm the packet says no stop" {
  procedure_stops 'Confirm the packet'
}

@test "Confirm the packet lists its results" {
  local text result
  text="$(procedure_text 'Confirm the packet')"
  for result in complete needs-shape epic; do
    grep -qF -- "- \`$result\`:" <<<"$text" || { echo "Confirm the packet does not list: $result"; false; }
  done
}

@test "Check the issue acts on each result of Confirm the packet" {
  local part result
  part="$(part_section 'Check the issue')"
  for result in complete needs-shape epic; do
    grep -qF -- "**\`$result\`:**" <<<"$part" || { echo "Check the issue does not act on: $result"; false; }
  done
}

@test "Check the issue says the change has started on its branch" {
  grep -qF 'the change has started on `<name>`' <<<"$(part_section 'Check the issue')" ||
    { echo "Check the issue does not say the change has started"; false; }
}

@test "Find the source of demand says no stop" {
  procedure_stops 'Find the source of demand'
}

@test "Find the source of demand lists its results" {
  local text result
  text="$(procedure_text 'Find the source of demand')"
  for result in found unresolved matches no-match picked nothing-ready; do
    grep -qF -- "- \`$result\`:" <<<"$text" || { echo "Find the source of demand does not list: $result"; false; }
  done
}

# Check the issue runs the first case for a picked or shaped issue too, so
# the case must not read as a named issue only.
@test "Find the source of demand's first case is the issue the run has" {
  skill_says lets-go '**The run has an issue, `<i>`.**'
  skill_does_not_say lets-go '**The user named an issue.**'
  ! grep -qF 'as for a named issue' <<<"$(part_section 'Check the issue')" ||
    { echo "Check the issue still runs the section as for a named issue"; false; }
}

@test "each part that finds the source of demand acts on each result it can get there" {
  local part result
  declare -A results=(
    ['Read the request']='picked nothing-ready'
    ['Start from an idea']='matches no-match'
    ['Check the issue']='found unresolved'
    ['Pick the first ready story']='picked nothing-ready')
  for part in "${!results[@]}"; do
    for result in ${results[$part]}; do
      grep -qF -- "**\`$result\`:**" <<<"$(part_section "$part")" || { echo "$part does not act on: $result"; false; }
    done
  done
}

@test "Start from an idea asks the user whether a match is the same work" {
  grep -qF '**`matches`:** show the user the matches it carries, and ask whether one is the same work' <<<"$(part_section 'Start from an idea')" ||
    { echo "Start from an idea does not ask about the matches"; false; }
  ! grep -qF 'confirm with the user' <<<"$(procedure_text 'Find the source of demand')" ||
    { echo "Find the source of demand still asks the user"; false; }
}

# A candidate whose packet is not complete would send a picked issue to the
# shape step, so next skips it.
@test "next checks the packet of each candidate" {
  grep -qF '](#confirm-the-packet)' <<<"$(procedure_text 'Find the source of demand')" ||
    { echo "Find the source of demand does not run Confirm the packet"; false; }
}

@test "the <i> placeholder names the candidate next is checking" {
  grep -E '^\| `<i>` \|' "$(lets_go_skill)" | grep -qF 'inside `next`, the candidate it is checking' ||
    { echo "the <i> row does not name the candidate next is checking"; false; }
}

@test "the claim and the import say no stop" {
  procedure_stops 'Claim'
  procedure_stops 'Import the glossary checkpoint'
}

@test "Enter the branch acts on each result of the claim" {
  local part result
  part="$(part_section 'Enter the branch')"
  for result in claimed taken claim-failed unresolved checkpoint-failed branch-failed; do
    grep -qF -- "**\`$result\`:**" <<<"$part" || { echo "Enter the branch does not act on: $result"; false; }
  done
}

@test "Claim claims and releases only through lets backlog" {
  local claim result enter
  claim="$(procedure_text 'Claim' | tr -s '[:space:]' ' ')"
  grep -qF 'lets backlog claim <i>' <<<"$claim" || { echo "Claim does not run lets backlog claim"; false; }
  grep -qF 'lets backlog release <i>' <<<"$claim" || { echo "Claim does not run lets backlog release"; false; }
  grep -qF '](#backlog-errors)' <<<"$claim" || { echo "Claim does not link Backlog errors"; false; }
  for result in claimed taken claim-failed unresolved checkpoint-failed branch-failed; do
    grep -qF -- "- \`$result\`:" <<<"$(procedure_text 'Claim')" || { echo "Claim does not list the result: $result"; false; }
  done
  grep -qF 'before you create a branch, and undo nothing' <<<"$claim" ||
    { echo "Claim does not return claim-failed before the branch"; false; }
  grep -qF "the release's \`write\` and \`message\`" <<<"$claim" ||
    { echo "branch-failed does not carry the release's error"; false; }
  grep -qF "When it prints an \`error\` instead, nothing was released" <<<"$claim" ||
    { echo "branch-failed does not carry a release that returned an error"; false; }
  enter="$(part_section 'Enter the branch')"
  grep -qF 'Do not release' <<<"$enter" ||
    { echo "Enter the branch does not stop on claim-failed without releasing"; false; }
  grep -qF 'When it carries a release error too, show it' <<<"$enter" ||
    { echo "Enter the branch does not show a failed release"; false; }
  grep -qF '`claim-failed`' <<<"$(overview_row 'Enter the branch')" || { echo "Enter the branch's row does not name claim-failed"; false; }
  grep -qF 'lets backlog release <i>' <<<"$(skill_section lets-go 'Recover from a failed import')" ||
    { echo "Recover from a failed import does not release through lets backlog"; false; }
  for gone in '--add-assignee' '--remove-assignee' '<project>' '<owner>' 'gh issue view <i> --json assignees'; do
    skill_does_not_say lets-go "$gone" || return 1
  done
}

# Check the issue looks for the branch, so Claim does not look again.
@test "Claim looks for no branch, and a late branch fails its creation" {
  local claim
  claim="$(procedure_text 'Claim')"
  skill_does_not_say lets-go 'branch-exists'
  ! grep -qF 'git branch --list' <<<"$claim" || { echo "Claim still looks for the branch"; false; }
  ! grep -qF 'already exists' <<<"$claim" || { echo "Claim still checks for an existing branch"; false; }
  grep -qF 'a local branch with the change'"'"'s name appeared after [Check the issue](#check-the-issue) looked' <<<"$(tr -s '[:space:]' ' ' <<<"$claim")" ||
    { echo "Claim does not say a late local branch fails its creation"; false; }
  grep -qF 'only on `origin`' <<<"$(tr -s '[:space:]' ' ' <<<"$claim")" ||
    { echo "Claim says a late branch on origin fails its creation"; false; }
  grep -qF 'when [Claim](../SKILL.md#claim) runs [Glossary preflight](#glossary-preflight)' <<<"$(skill_section lets-go 'Check the checkpoint')" ||
    { echo "Check the checkpoint still runs after a branch check"; false; }
}

@test "Enter the branch acts on each result of the import" {
  local part result
  part="$(part_section 'Enter the branch')"
  for result in imported import-failed; do
    grep -qF -- "**\`$result\`:**" <<<"$part" || { echo "Enter the branch does not act on: $result"; false; }
  done
}

@test "Enter the branch imports the glossary checkpoint only after verified" {
  grep -qF '**`claimed`:** when it carries `verified`, run [Import the glossary checkpoint](references/glossary-handoff.md#import-the-glossary-checkpoint)' <<<"$(part_section 'Enter the branch')" ||
    { echo "Enter the branch does not import only after verified"; false; }
}

@test "lets-go refers to no step by its step number" {
  step_numbers lets-go
}

@test "lets-go names no Start part, and no run that stops part way" {
  skill_does_not_say lets-go '*Start*'
  skill_does_not_say lets-go 'part way'
}

@test "the shape prompt names lets-shape's steps by their titles, not a step number" {
  local text title
  text="$(skill_section lets-go 'What shape runs')"
  for title in '**Find or create the issue**' '**Confirm, then write**'; do
    grep -qF -- "$title" <<<"$text" || { echo "What shape runs does not name: $title"; false; }
  done
}

@test "each link in lets-go names one of its file's headings" {
  anchors_resolve lets-go
}

# anchor_heading <file> <anchor>: the text of the file's heading outside code
# whose anchor is <anchor>.
anchor_heading() {
  local heading
  awk "$fence_rules"' !code && /^#+ / { sub(/^#+ /, ""); print }' "$1" |
    while IFS= read -r heading; do
      [ "$(heading_anchor "$heading")" != "$2" ] || echo "$heading"
    done
}

# section_names: each heading outside code in a lets-go file, then each
# heading of another skill that a lets-go link points to, one per line.
section_names() {
  local root dir file link target
  root="$(realpath -m "${skills_dir:-$repo/skills}")"
  dir="$root/lets-go"
  skill_files lets-go | while IFS= read -r file; do
    awk "$fence_rules"' !code && /^#+ / { sub(/^#+ /, ""); print }' "$file"
    prose_text "$file" | grep -oE '\]\([^)#][^)]*#[^)]*\)' | sed -E 's/^\]\(//; s/\)$//' |
      while IFS= read -r link; do
        target="$(realpath -m "$(dirname "$file")/${link%%#*}")"
        [[ "$target" != "$dir"/* && -f "$target" ]] || continue
        anchor_heading "$target" "${link#*#}"
      done
  done | sort -u
}

# section_italics <file>...: each italic text, outside fenced code and code
# spans, that equals a name section_names gives, as <file>:<line>: <text>,
# the file under the skills folder. references/terms.md copies the glossary,
# which names sections in italics, so it is not read.
section_italics() {
  local names file found out=""
  names="$(section_names)"
  for file in "$@"; do
    [[ "$file" != */lets-go/references/terms.md ]] || continue
    found="$(prose_text "$file" | awk -v name="${file#"${skills_dir:-$repo/skills}/"}" '
      NR == FNR { names[$0] = 1; next }
      {
        line = $0; sub(/:.*/, "", line); text = substr($0, length(line) + 3)
        gsub(/\*\*[^*]*\*\*/, "", text)
        while (match(text, /\*[^* ][^*]*\*/)) {
          found = substr(text, RSTART + 1, RLENGTH - 2)
          if (found in names) print name ":" line ": " found
          text = substr(text, RSTART + RLENGTH)
        }
      }' <(printf '%s\n' "$names") -)"
    [ -z "$found" ] || out+="$found"$'\n'
  done
  [ -z "$out" ] || { printf '%s' "$out"; return 1; }
}

@test "the check that lets-go links each section it names names an italic section name" {
  fixture_file lets-go SKILL.md '# lets-go' '' '## Route' '' 'Text.' '' '' '' '' '' '' 'otherwise *Route*'
  run section_italics "$(lets_go_skill)"
  [ "$status" -eq 1 ] || { echo "it passed on an italic section name"; false; }
  [ "$output" = 'lets-go/SKILL.md:12: Route' ] || { echo "it said: $output"; false; }
}

@test "the check that lets-go links each section it names names a section of another skill that lets-go links" {
  fixture_file lets-review-build SKILL.md '# Review build' '' '## Finish the change' '' 'Text.'
  fixture_file lets-go SKILL.md '# lets-go' '' 'See [Finish the change](../lets-review-build/SKILL.md#finish-the-change).' \
    'Then *Finish the change* runs.'
  run section_italics "$(lets_go_skill)"
  [ "$status" -eq 1 ] || { echo "it passed on an italic section of another skill"; false; }
  [ "$output" = 'lets-go/SKILL.md:4: Finish the change' ] || { echo "it said: $output"; false; }
}

@test "the check that lets-go links each section it names reads no italics inside fenced code" {
  fixture_file lets-go SKILL.md '# lets-go' '' '## Route' '' '```text' 'Go on in *Route*.' '```'
  section_italics "$(lets_go_skill)"
}

@test "the check that lets-go links each section it names reads no italics that name no section" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'Back in *Resume mode*.'
  section_italics "$(lets_go_skill)"
}

@test "lets-go links each section it names" {
  local files
  mapfile -t files < <(skill_files lets-go)
  section_italics "${files[@]}"
}

@test "the check that lets-go links each section it names reads no italics in the glossary's copy" {
  fixture_file lets-go SKILL.md '# lets-go' '' '## Route' '' 'Text.'
  fixture_file lets-go references/terms.md '# Terms' '' 'such as *Route* or *Walk the step table*'
  section_italics "$(lets_go_skill)" "$skills_dir/lets-go/references/terms.md"
}

@test "lets-go writes the prompt frame's heading as it is typed" {
  local text
  text="$(skill_section lets-go 'Write the prompt')"
  grep -qF '`## What to run`' <<<"$text" || { echo "Write the prompt does not say: \`## What to run\`"; false; }
  skill_does_not_say lets-go '*What to run*'
}

@test "lets-go links Finish the change in lets-review-build" {
  part_section 'End of the run' | grep -qF '](../lets-review-build/SKILL.md#finish-the-change)' ||
    { echo "End of the run does not link Finish the change"; false; }
}

# section_code_spans <file>...: each line, outside fenced code, with a code
# span that holds only Code review or Plan review, as <file>:<line>, the file
# under the skills folder. A pull request's section is named in bold.
section_code_spans() {
  local file out=""
  for file in "$@"; do
    out+="$(awk -v name="${file#"${skills_dir:-$repo/skills}/"}" "$fence_rules"'
      !code && /`(Code|Plan) review`/ { print name ":" FNR }' "$file")"
    [ -z "$out" ] || [[ "$out" == *$'\n' ]] || out+=$'\n'
  done
  [ -z "$out" ] || { printf '%s' "$out"; return 1; }
}

@test "the check that lets-go names a pull request section in bold names a section in code font" {
  local lines=() n
  for n in $(seq 29); do lines+=(''); done
  fixture_file lets-go references/records.md "${lines[@]}" 'has no `Code review` section'
  run section_code_spans "$skills_dir/lets-go/references/records.md"
  [ "$status" -eq 1 ] || { echo "it passed on a section in code font"; false; }
  [ "$output" = 'lets-go/references/records.md:30' ] || { echo "it said: $output"; false; }
}

@test "the check that lets-go names a pull request section in bold passes a heading to search for" {
  fixture_file lets-go references/records.md 'Find the `## Plan review` heading'
  section_code_spans "$skills_dir/lets-go/references/records.md"
}

@test "lets-go names a pull request section in bold" {
  local files
  mapfile -t files < <(skill_files lets-go)
  section_code_spans "${files[@]}"
  grep -qF 'has no **Code review** section' <<<"$(walk_section)" ||
    { echo "Walk the step table does not name Code review in bold"; false; }
  grep -qF 'has no **Code review** section' <<<"$(skill_section lets-go 'Records that disagree')" ||
    { echo "Records that disagree does not name Code review in bold"; false; }
}

@test "lets-go names a step in plain words in prose" {
  local old
  for old in 'Run the `shape` step' 'When `review-build` reports' 'after `shape`, go on'; do
    skill_does_not_say lets-go "$old"
  done
  grep -qF '`--for`, `--name`, file names and config keys use `shape`, `plan`, `review-plan`, `build` and `review-build`.' \
    <<<"$(skill_section lets-go 'The step table')" || { echo "The step table does not give the --for names in code font"; false; }
}

# text_block_lines <name>: each line of a fenced text block in the section
# of lets-go's SKILL.md with that heading, at any level, up to the next
# heading, without its indent.
text_block_lines() {
  awk -v name="$1" "$fence_rules"'
    !code && /^#+ / { on = (substr($0, index($0, " ") + 1) == name); next }
    !on { next }
    code && fence == "" { block = 0; next }
    code && !block { block = 1; text = ($0 ~ /^ *```+text *$/); next }
    code && text { line = $0; sub(/^ */, "", line); print line }' "$(lets_go_skill)"
}

@test "lets-go gives a whole printed line in a text block" {
  local wrong=()
  grep -qxF 'Picked #<i>: <title>, the next ready issue.' <<<"$(text_block_lines 'Read the request')" ||
    wrong+=('Read the request has no text block with the Picked line')
  for line in 'Failed review build: <reason>' 'Failed shape: <reason>'; do
    grep -qxF -- "$line" <<<"$(text_block_lines 'The step lines')" || wrong+=("The step lines have no text block with: $line")
  done
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; false; }
}

# long_lines <file>...: each line longer than 72 columns, as
# <file>:<line>: <length>, the file under the skills folder. A column is one
# code point: the count leaves out UTF-8 continuation bytes, so it holds in
# any locale. The frontmatter, table rows, fenced code and its fences, and a
# line that holds one link and nothing else but indent, a list marker and
# one closing mark may run longer. A frontmatter with no closing --- is not
# one, so its lines are prose. references/terms.md copies the glossary, so
# it keeps the glossary's wrap.
long_lines() {
  local file closes out=""
  for file in "$@"; do
    [[ "$file" != */lets-go/references/terms.md ]] || continue
    closes="$(awk 'NR == 1 && $0 != "---" { exit } NR > 1 && $0 == "---" { print NR; exit }' "$file")"
    out+="$(awk -v name="${file#"${skills_dir:-$repo/skills}/"}" -v closes="${closes:-0}" "$fence_rules"'
      BEGIN { continuation = sprintf("[%c-%c]", 128, 191) }
      FNR <= closes + 0 { next }
      code || /^ *\|/ { next }
      /^ *([-*+]|[0-9]+\.)? *\[[^]]*\]\([^)]*\)[.,;:]?$/ { next }
      {
        line = $0; gsub(continuation, "", line)
        if (length(line) > 72) print name ":" FNR ": " length(line)
      }' "$file")"
    [ -z "$out" ] || [[ "$out" == *$'\n' ]] || out+=$'\n'
  done
  [ -z "$out" ] || { printf '%s' "$out"; return 1; }
}

@test "the check that lets-go wraps its prose at 72 columns names a prose line too long" {
  fixture_file lets-go references/shape.md '# Shape' '' 'Text.' "$(printf 'a%.0s' $(seq 73))"
  run long_lines "$skills_dir/lets-go/references/shape.md"
  [ "$status" -eq 1 ] || { echo "it passed on a line of 73 columns"; false; }
  [ "$output" = 'lets-go/references/shape.md:4: 73' ] || { echo "it said: $output"; false; }
}

@test "the check that lets-go wraps its prose at 72 columns passes a table row, a command and a lone link" {
  local long
  long="$(printf 'b%.0s' $(seq 112))"
  fixture_file lets-go SKILL.md '---' "description: $long" '---' '# lets-go' '' "| a | $long |" '' '```bash' "echo $long" '```' '' \
    '1. Run' '   [Import the glossary checkpoint](references/glossary-handoff.md#import-the-glossary-checkpoint).'
  long_lines "$(lets_go_skill)"
}

@test "the check that lets-go wraps its prose at 72 columns reads a frontmatter that never closes as prose" {
  fixture_file lets-go SKILL.md '---' 'name: lets-go' "$(printf 'e%.0s' $(seq 73))"
  run long_lines "$(lets_go_skill)"
  [ "$status" -eq 1 ] || { echo "it passed on a long line after a frontmatter that never closes"; false; }
  [ "$output" = 'lets-go/SKILL.md:3: 73' ] || { echo "it said: $output"; false; }
}

@test "the check that lets-go wraps its prose at 72 columns counts a wide character once" {
  fixture_file lets-go SKILL.md '# lets-go' '' "$(printf 'c%.0s' $(seq 65))ログを直す"
  long_lines "$(lets_go_skill)"
}

@test "the check that lets-go wraps its prose at 72 columns reads no line of the glossary's copy" {
  fixture_file lets-go references/terms.md '# Terms' '' "$(printf 'd%.0s' $(seq 80))"
  long_lines "$skills_dir/lets-go/references/terms.md"
}

@test "lets-go wraps its prose at 72 columns" {
  local files
  mapfile -t files < <(skill_files lets-go)
  long_lines "${files[@]}"
}

@test "lets-go wraps its exit-3 sentence at 72 columns" {
  ! grep -qF '**3**: no fresh session can run here, for example because no resolver started one' "$(lets_go_skill)" ||
    { echo "the exit-3 sentence sits on one line"; false; }
  says_exit_3 lets-go
}

@test "lets-go keeps Check an earlier review in italics" {
  local row
  row="$(walk_section)"
  grep -qF "Follow *Check an earlier review* in the \`lets-review-plan\` skill" <<<"$row" ||
    { echo "the review plan row does not name Check an earlier review in italics"; false; }
  ! grep -qF '](../lets-review-plan/' <<<"$row" || { echo "the review plan row links lets-review-plan"; false; }
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

# Each step's done test is written once, in the walk.
@test "the step table has no Done when column" {
  local header
  header="$(awk '/^## The step table$/ { on = 1 } on && /^\| Step \|/ { print; exit }' "$(lets_go_skill)")"
  [ -n "$header" ] || { echo "the step table has no header row"; false; }
  [[ "$header" != *'Done when'* ]] || { echo "the step table still has a Done when column: $header"; false; }
}

@test "the walk's review plan row reads lets-minimal first, then the archive folder" {
  local walk row minimal archive
  walk="$(walk_section)"
  row="${walk#*'**Review plan.**'}"
  row="${row%%'**Build.**'*}"
  [ "$row" != "$walk" ] || { echo "the walk has no review plan row"; false; }
  minimal="${row%%'`lets-minimal`'*}"
  archive="${row%%'archive folder'*}"
  [ "$minimal" != "$row" ] && [ "$archive" != "$row" ] || { echo "the review plan row does not name both: $row"; false; }
  [ "${#minimal}" -lt "${#archive}" ] || { echo "the review plan row reads the archive folder before lets-minimal"; false; }
  [[ "$row" != *'once plan is done'* ]] || { echo "the review plan row still waits for plan"; false; }
  grep -qF 'the first of these that matches decides' <<<"$walk" || { echo "the walk does not say which item decides"; false; }
}

@test "the walk says when a merged or closed pull request stops it" {
  grep -qF 'a stacked pull request merged into the branch below it' <<<"$(walk_section)" ||
    { echo "the walk does not say when MERGED runs"; false; }
  grep -qF 'a pull request closed without merging' <<<"$(walk_section)" ||
    { echo "the walk does not say when CLOSED runs"; false; }
}

@test "the walk has no shape row" {
  ! grep -qF -- '**Shape.**' <<<"$(skill_section lets-go 'Walk the step table')" || { echo "the walk still has a shape row"; false; }
}

@test "Check the issue prints shape's line before the walk" {
  local lines line
  lines="$(skill_section lets-go 'The step lines')"
  for line in "Skipped shape: #<i>'s packet is complete, last edited <date>." 'Done shape: <date>. <evidence>'; do
    grep -qF -- "$line" <<<"$lines" || { echo "The step lines do not hold: $line"; false; }
  done
  grep -qF 'only when no shape step ran in this run' <<<"$lines" ||
    { echo "The step lines print Skipped shape after a shape step"; false; }
  grep -qF '](#the-step-lines)' <<<"$(part_section 'Check the issue')" ||
    { echo "Check the issue does not link The step lines"; false; }
}

@test "each step line, and what fills it, is written once, in The step lines" {
  local phrase part lines
  lines="$(skill_section lets-go 'The step lines')"
  for phrase in 'Done shape: <date>. <evidence>' "Skipped shape: #<i>'s packet is complete, last edited <date>." \
    '`evidence`, joined with `; `' 'Failed shape: <reason>' 'Failed review build: <reason>'; do
    skill_says_once lets-go "$phrase"
    grep -qF -- "$phrase" <<<"$lines" || { echo "The step lines do not hold: $phrase"; false; }
  done
  for part in 'Read the report' 'End of the run'; do
    grep -qF '](#the-step-lines)' <<<"$(part_section "$part")" || { echo "$part does not link The step lines"; false; }
  done
  for phrase in '<date>' '<evidence>' '<reason>'; do
    skill_rows lets-go "^\| \`$phrase\` \|" | grep -qF '[The step lines](#the-step-lines)' ||
      { echo "the $phrase row does not name The step lines"; false; }
  done
}

@test "Read the report handles a failed shape before any other failed step" {
  local part shape other
  part="$(part_section 'Read the report')"
  shape="${part%%'- **`failed`, for shape**'*}"
  other="${part%%'- **`failed`**:'*}"
  [ "$shape" != "$part" ] || { echo "Read the report has no failed shape case"; false; }
  [ "$other" != "$part" ] || { echo "Read the report has no failed case for another step"; false; }
  [ "${#shape}" -lt "${#other}" ] || { echo "Read the report reads another failed step before a failed shape"; false; }
}

# A step's done report is checked against the records it should have changed.
@test "Read the report checks a done report against its record" {
  local part
  part="$(part_section 'Read the report')"
  grep -qF 'gh pr view <name> --json number,url,state,isDraft,body' <<<"$part" ||
    { echo "Read the report does not read the pull request again after done"; false; }
  grep -qF 'git status --porcelain' <<<"$part" || { echo "Read the report does not read the tree again after done"; false; }
  grep -qF 'the step reported done, but' <<<"$part" || { echo "Read the report takes a done report on trust"; false; }
  grep -qF '[Records that disagree](references/records.md#records-that-disagree)' <<<"$part" ||
    { echo "Read the report does not stop on records that disagree"; false; }
  grep -qF 'reports done when its record says otherwise' <<<"$(overview_row 'Walk the step table')" ||
    { echo "the walk's overview row does not stop on a done report its record contradicts"; false; }
  skill_rows lets-go '^\| `<reason>` \|' | grep -qF 'the step reported done, but' ||
    { echo "the <reason> row does not name the done check"; false; }
}

@test "a failed step on a branch with no pull request prints no URL" {
  local part
  part="$(part_section 'Read the report')"
  grep -qF 'gh pr view <name> --json url --jq .url' <<<"$part" || { echo "Read the report does not look for the pull request again"; false; }
  grep -qF 'no pull request yet' <<<"$part" || { echo "Read the report does not say the branch has no pull request yet"; false; }
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
  row="$(skill_rows lets-go '^\| An archive folder')"
  grep -qF '`lets-standard`' <<<"$row" || { echo "the archive row asks every flow for a Code review section"; false; }
  run skill_rows lets-go '^\| Build is done'
  [ "$status" -eq 1 ] || { echo "a built change with no Plan review is still a disagreement: $output"; false; }
}

@test "an archived change with no Plan review section is a disagreement" {
  local row
  row="$(skill_rows lets-go '^\| An archived change on a schema other than `lets-minimal`')"
  grep -qF 'no **Plan review** section' <<<"$row" || { echo "lets-go has no disagreement for an archived change with no Plan review"; false; }
  grep -qF 'the records disagree if the pull request' <<<"$(walk_section)" ||
    { echo "the walk's review plan row does not check the section after archive"; false; }
}

# step_row <step>: lets-go's row for the step in its table of steps.
step_row() {
  skill_rows lets-go "^\| \`$1\` \|"
}

@test "step_row reads a row in a reference file" {
  fixture_file lets-go references/steps.md '| `plan` | the fixture skill |'
  [ "$(step_row plan)" = '| `plan` | the fixture skill |' ] || { echo "it read: $(step_row plan)"; false; }
}

@test "skill_rows reads a row of the disagreements table in a reference file" {
  fixture_file lets-go references/records.md '| An archive folder exists | Fixture. |'
  [ "$(skill_rows lets-go '^\| An archive folder')" = '| An archive folder exists | Fixture. |' ] ||
    { echo "it read: $(skill_rows lets-go '^\| An archive folder')"; false; }
}

@test "lets-plan runs openspec-propose and reads the change state when it stops" {
  skill_says lets-plan '`openspec-propose` skill'
  skill_says lets-plan 'openspec instructions apply --change <name> --json'
  skill_says lets-plan 'lets backlog find <branch>'
  skill_says lets-plan 'whose title starts with `<branch> — `'
  skill_does_not_say lets-plan 'gh issue list'
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

@test "Confirm the packet explains the read marker" {
  local text phrase
  text="$(procedure_text 'Confirm the packet' | tr -s '[:space:]' ' ')"
  for phrase in 'A read marker is a comment that `lets-shape` posts when it has read the thread, as' \
    '](../lets-shape/references/issue-comments.md#the-read-marker)' \
    "A comment is unread when it was created or edited after both the body's last edit and the newest read marker" \
    "The watermark is the later of the body's last edit and the newest read marker"; do
    grep -qF -- "$phrase" <<<"$text" || { echo "Confirm the packet does not say: $phrase"; false; }
  done
}

# The glossary terms lets-go uses. An installed skill cannot link
# openspec/glossary.md, which is then the project's own, so lets-go carries
# a copy of each entry.
lets_go_terms=('Part' 'Procedure' 'Step' 'Step report' 'Question mode' 'Packet')

# glossary_entry <file> <term>: the text under the file's ## <term> heading,
# up to the next heading, each run of whitespace one space. Fails when the
# file has no such heading.
glossary_entry() {
  awk -v name="## $2" "$fence_rules"'
    !code && /^#+ / { if (on) exit; on = ($0 == name); found = found || on; next }
    on { print }
    END { exit !found }' "$1" | tr -s '[:space:]' ' ' | sed 's/^ //; s/ $//'
  [ "${PIPESTATUS[0]}" -eq 0 ]
}

# terms_match_glossary [terms] [glossary]: each lets-go term has a ## heading
# in both files, with the same text, and terms.md has no other ## heading.
# Prints each term that differs, is missing or is extra.
terms_match_glossary() {
  local terms="${1:-$repo/skills/lets-go/references/terms.md}" glossary="${2:-$repo/openspec/glossary.md}"
  local term copy entry heading wrong=()
  for term in "${lets_go_terms[@]}"; do
    if ! copy="$(glossary_entry "$terms" "$term")"; then wrong+=("terms.md has no entry: $term"); continue; fi
    if ! entry="$(glossary_entry "$glossary" "$term")"; then wrong+=("the glossary has no entry: $term"); continue; fi
    [ "$copy" = "$entry" ] || wrong+=("terms.md differs from the glossary: $term")
  done
  while IFS= read -r heading; do
    for term in "${lets_go_terms[@]}"; do [ "$heading" != "$term" ] || continue 2; done
    wrong+=("terms.md has an entry lets-go does not use: $heading")
  done < <(awk "$fence_rules"' !code && /^## / { print substr($0, 4) }' "$terms")
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

# terms_fixture <file> <skipped term> <term> <text>: writes a glossary file of
# the lets-go terms, each with the text Fixture <term>., except that the named
# term has the given text, and the skipped term has no entry.
terms_fixture() {
  local file="$1" skip="$2" changed="$3" text="$4" term
  for term in "${lets_go_terms[@]}"; do
    [ "$term" != "$skip" ] || continue
    if [ "$term" = "$changed" ]; then printf '## %s\n\n%s\n\n' "$term" "$text"
    else printf '## %s\n\nFixture %s.\n\n' "$term" "$term"; fi
  done >"$file"
}

@test "lets-go's terms match the glossary" {
  terms_match_glossary
}

@test "the terms match the glossary check names an entry that differs" {
  terms_fixture "$BATS_TEST_TMPDIR/glossary.md" '' Procedure 'A section that a part runs, run by a part.'
  terms_fixture "$BATS_TEST_TMPDIR/terms.md" '' Procedure 'A section that a part runs, run by a part or another procedure.'
  run terms_match_glossary "$BATS_TEST_TMPDIR/terms.md" "$BATS_TEST_TMPDIR/glossary.md"
  [ "$status" -eq 1 ] || { echo "it passed on an entry that differs"; false; }
  [ "$output" = 'terms.md differs from the glossary: Procedure' ] || { echo "it said: $output"; false; }
}

@test "the terms match the glossary check names an entry missing from the copy" {
  terms_fixture "$BATS_TEST_TMPDIR/glossary.md" '' '' ''
  terms_fixture "$BATS_TEST_TMPDIR/terms.md" 'Step report' '' ''
  run terms_match_glossary "$BATS_TEST_TMPDIR/terms.md" "$BATS_TEST_TMPDIR/glossary.md"
  [ "$status" -eq 1 ] || { echo "it passed on a missing entry"; false; }
  [ "$output" = 'terms.md has no entry: Step report' ] || { echo "it said: $output"; false; }
}

@test "the terms match the glossary check names an entry missing from the glossary" {
  terms_fixture "$BATS_TEST_TMPDIR/glossary.md" Packet '' ''
  terms_fixture "$BATS_TEST_TMPDIR/terms.md" '' '' ''
  run terms_match_glossary "$BATS_TEST_TMPDIR/terms.md" "$BATS_TEST_TMPDIR/glossary.md"
  [ "$status" -eq 1 ] || { echo "it passed on an entry the glossary lacks"; false; }
  [ "$output" = 'the glossary has no entry: Packet' ] || { echo "it said: $output"; false; }
}

@test "the terms match the glossary check names an entry the copy should not hold" {
  terms_fixture "$BATS_TEST_TMPDIR/glossary.md" '' '' ''
  terms_fixture "$BATS_TEST_TMPDIR/terms.md" '' '' ''
  printf '## Backlog\n\nFixture Backlog.\n' >>"$BATS_TEST_TMPDIR/terms.md"
  run terms_match_glossary "$BATS_TEST_TMPDIR/terms.md" "$BATS_TEST_TMPDIR/glossary.md"
  [ "$status" -eq 1 ] || { echo "it passed on an extra entry"; false; }
  [ "$output" = 'terms.md has an entry lets-go does not use: Backlog' ] || { echo "it said: $output"; false; }
}

# first_term_links [skill.md]: in lets-go's SKILL.md, outside the frontmatter
# and code, the first line that mentions each of packet, step, step report
# and question mode links that term's heading in references/terms.md.
# A mention of step report is not one of step, and a link's target is not a
# mention. Prints each term whose first mention has no link.
first_term_links() {
  local skill="${1:-$(lets_go_skill)}" file="$BATS_TEST_TMPDIR/first-terms.md" term pattern anchor first wrong=()
  # Blank out the frontmatter, so prose_text keeps the line numbers.
  awk 'NR == 1 && /^---$/ { front = 1; print ""; next } front { if (/^---$/) front = 0; print ""; next } { print }' \
    "$skill" >"$file"
  for term in packet step 'step report' 'question mode'; do
    case "$term" in
      packet) pattern='packets?' ;;
      step) pattern='steps?' ;;
      'step report') pattern='step reports?' ;;
      # Question alone is too common to stand for the term, so the first
      # mention must keep question mode on one line.
      'question mode') pattern='question modes?' ;;
    esac
    anchor="$(heading_anchor "$term")"
    first="$(prose_text "$file" | awk -v pattern="(^|[^a-z-])$pattern([^a-z-]|\$)" -v term="$term" '{
      line = $0; sub(/:.*/, "", line); text = tolower(substr($0, length(line) + 3))
      gsub(/\]\([^)]*\)/, "]", text)
      if (term == "step") gsub(/step reports?/, "", text)
      if (text ~ pattern) { print line; exit }
    }')"
    [ -n "$first" ] || continue
    sed -n "${first}p" "$file" | grep -qF "](references/terms.md#$anchor)" ||
      wrong+=("$term: line $first does not link references/terms.md#$anchor")
  done
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

@test "lets-go links each glossary term at its first use" {
  local anchor
  first_term_links
  for anchor in packet step step-report question-mode; do
    grep -qF "](references/terms.md#$anchor)" "$(lets_go_skill)" || { echo "SKILL.md never links terms.md#$anchor"; false; }
  done
}

@test "the check that lets-go links each glossary term at its first use names a term used before its link" {
  fixture_file lets-go SKILL.md '---' 'description: Read the packet.' '---' '# lets-go' '' "Read the issue's packet." \
    'Then confirm the [packet](references/terms.md#packet).'
  run first_term_links "$skills_dir/lets-go/SKILL.md"
  [ "$status" -eq 1 ] || { echo "it passed on a term used before its link"; false; }
  [ "$output" = 'packet: line 6 does not link references/terms.md#packet' ] || { echo "it said: $output"; false; }
}

# before_overview: lets-go's SKILL.md after the frontmatter, up to the
# overview table, on one line.
before_overview() {
  awk 'NR == 1 && /^---$/ { front = 1; next } front { if (/^---$/) front = 0; next } /^\| Part \|/ { exit } { print }' \
    "$(lets_go_skill)" | tr -s '[:space:]' ' '
}

@test "lets-go says who you is before the overview" {
  local file
  grep -qF '"You" is the agent that runs this skill, and "the user" is the person who asked for the run.' \
    <<<"$(before_overview)" || { echo "the opening does not say who you and the user are"; false; }
  for file in "$repo"/skills/lets-go/references/*.md; do
    ! tr -s '[:space:]' ' ' <"$file" | grep -qF '"You" is the agent' || { echo "${file#"$repo/"} still says who you is"; false; }
  done
}

# overview_paragraph: the last paragraph of lets-go's SKILL.md before the
# overview table, on one line.
overview_paragraph() {
  awk '/^\| Part \|/ { exit } /^ *$/ { fresh = 1; next } fresh { text = ""; fresh = 0 } { text = text " " $0 } END { print text }' \
    "$(lets_go_skill)" |
    tr -s '[:space:]' ' '
}

@test "lets-go explains its procedures before the overview" {
  local text intro phrase
  text="$(overview_paragraph)"
  for phrase in "[Find the source of demand](#find-the-source-of-demand) finds the run's issue: the one the user named, the one an idea's words describe, or \`next\`." \
    '`next` is the first ready issue on the backlog, as that procedure ranks it.' \
    'A part or another procedure runs it, and it returns its result to what ran it.' \
    '](references/terms.md#procedure)'; do
    grep -qF -- "$phrase" <<<"$text" || { echo "the paragraph before the overview does not say: $phrase"; false; }
  done
  intro="$(awk '/^## Procedures$/ { on = 1; next } on && /^#/ { exit } on' "$(lets_go_skill)" | tr -s '[:space:]' ' ')"
  for phrase in 'A part or another procedure runs each procedure below' 'Each one returns its result to what ran it.'; do
    grep -qF -- "$phrase" <<<"$intro" || { echo "the Procedures intro does not say: $phrase"; false; }
  done
}

@test "lets-go explains each glossary handoff term in its section" {
  local section term phrase text before
  # Each row: the section, the term, and its explanation, which comes before
  # any other mention of the term in the section.
  while IFS=$'\t' read -r section term phrase; do
    text="$(procedure_text "$section" | tr -s '[:space:]' ' ')"
    grep -qF -- "$phrase" <<<"$text" || { echo "$section does not say: $phrase"; false; }
    before="${text%%"$phrase"*}"
    ! grep -qiF -- "$term" <<<"$before" || { echo "$section says $term before it explains it"; false; }
  done <<'EOF'
Find the source of demand	glossary handoff	A **Glossary handoff** is the section `lets-shape` writes in a story's issue body when shaping added glossary terms. It records which issue owns the definitions, and where the owner's glossary commits are.
Check the prerequisite	prerequisite	The prerequisite is the glossary definitions a story needs that another issue owns.
Check the checkpoint	checkpoint	The checkpoint is the ordered `docs:` commits that hold shaping's glossary edits.
Check the checkpoint	owned paths	The owned paths are the glossary files those commits may change.
Import the commits	holding branch	The holding branch is the branch `lets-shape` makes from the default branch to keep the checkpoint commits until a story's branch imports them.
EOF
  # Rehearse is explained in the sentence that first says it.
  text="$(procedure_text 'Check the checkpoint' | tr -s '[:space:]' ' ')"
  grep -qF 'rehearse the import on the proposed base: try it first in a throwaway checkout, and keep the real working tree as it is.' \
    <<<"$text" || { echo "Check the checkpoint does not explain rehearse"; false; }
  before="${text%%rehearse the import on the proposed base: try it first*}"
  ! grep -qiF 'rehears' <<<"$before" || { echo "Check the checkpoint says rehearse before it explains it"; false; }
}

# description_short [skill.md]: lets-go's frontmatter description starts Use
# when and holds at most 60 words. Prints what is wrong.
description_short() {
  local description words wrong=()
  description="$(sed -n 's/^description: //p' "${1:-$(lets_go_skill)}" | head -n 1)"
  words="$(wc -w <<<"$description")"
  [[ "$description" == 'Use when '* ]] || wrong+=('the description does not start Use when')
  [ "$words" -le 60 ] || wrong+=("the description has $words words, more than 60")
  [ "${#wrong[@]}" -eq 0 ] || { printf '%s\n' "${wrong[@]}"; return 1; }
}

@test "lets-go's description says when to use it" {
  local description phrase
  description_short
  description="$(sed -n 's/^description: //p' "$(lets_go_skill)" | head -n 1)"
  for phrase in 'next story' 'current branch' 'fresh session' 'story, bug or chore, or an idea in words' \
    'pull request ready for review' 'again after a run stopped'; do
    grep -qF -- "$phrase" <<<"$description" || { echo "the description does not say: $phrase"; false; }
  done
}

@test "the check that lets-go's description says when to use it names a description of 61 words" {
  fixture_file lets-go SKILL.md '---' "description: Use when $(printf 'word %.0s' {1..59})" '---' '# lets-go'
  run description_short "$skills_dir/lets-go/SKILL.md"
  [ "$status" -eq 1 ] || { echo "it passed on 61 words"; false; }
  [ "$output" = 'the description has 61 words, more than 60' ] || { echo "it said: $output"; false; }
}

@test "lets-go says what a run started again does" {
  local text case phrase missing=()
  text="$(before_overview)"
  while IFS=$'\t' read -r case phrase; do
    grep -qF -- "$phrase" <<<"$text" || missing+=("$case: $phrase")
  done <<'EOF'
the change's branch	**On the change's branch:** it finds the issue from the branch's name, prints a dated line for each step already done, and goes on from the first unfinished step.
the default branch with the issue number	**On the default branch, with the issue number:** it finds the change's branch, here or on `origin`, switches to it, and goes on the same way. It does not claim the issue again.
the default branch with nothing	**On the default branch, with nothing:** it does not resume. It picks the next ready issue, and a claimed issue is never ready.
a failed step	**After a failed step:** the run that failed never runs that step again. A new run starts it afresh, in a new session, with the answers given so far.
a failed shape step	A failed shape step has no branch: the run says to run `lets-shape` on the idea or the issue.
a merged or closed pull request	**After the pull request is merged or closed:** there is nothing to resume, and the run stops.
EOF
  [ "${#missing[@]}" -eq 0 ] || { printf 'the resume paragraph does not say, for %s\n' "${missing[@]}"; false; }
  grep -qF 'running `lets-go` again on that branch carries on from the first unfinished step' \
    <<<"$(skill_part 'Read the report' | tr -s '[:space:]' ' ')" || { echo "Read the report no longer sends a failed step back"; false; }
}

# A run that never shaped has no map, so it need not open shape.md.
@test "Enter the branch opens the shape file only after a shape step" {
  local text links sentence
  text="$(skill_part 'Enter the branch' | tr -s '[:space:]' ' ')"
  links="$(sed 's/\. /.\n/g' <<<"$text" | grep -F '](references/shape.md#commit-the-discovery-map)')"
  [ -n "$links" ] || { echo "Enter the branch does not link Commit the discovery map"; false; }
  while IFS= read -r sentence; do
    grep -qF 'a shape step ran in this run' <<<"$sentence" ||
      { echo "Enter the branch links the map without a shape step: $sentence"; false; }
  done <<<"$links"
  grep -qF 'A run with no shape step has no map to commit' <<<"$text" ||
    { echo "Enter the branch does not say a run with no shape step has no map"; false; }
}

@test "the check that lets-go links each glossary term at its first use reads step report apart from step" {
  fixture_file lets-go SKILL.md '# lets-go' '' 'It ends with a [step report](references/terms.md#step-report).' \
    'Each [step](references/terms.md#step) runs in a fresh session.'
  first_term_links "$skills_dir/lets-go/SKILL.md"
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

@test "writing reference inputs resolve inside each published flow" {
  local flow schema skill out schemas
  for flow in standard minimal; do
    out="$BATS_TEST_TMPDIR/$flow"
    schemas="$(jq -r --arg flow "$flow" '.flows[$flow].schemas | join(",")' "$repo/flows.json")"
    build "$out" "$schemas" $(flow_skills "$flow")
    local installed text
    for skill in $(flow_skills "$flow"); do
      installed="$out/overlay/.agents/skills/$skill"
      assert_reference_links "$installed/SKILL.md" "$out/overlay"
      for text in "$installed"/references/*.md "$installed"/templates/*.md; do
        [ -f "$text" ] || continue
        if grep -qE '\]\([^)]*references/[^)]*\.md\)' "$text"; then
          assert_reference_links "$text" "$out/overlay"
        fi
      done
    done
    for schema in $(jq -r --arg flow "$flow" '.flows[$flow].schemas[]' "$repo/flows.json"); do
      (
        cd "$out/overlay"
        printf 'schema: %s\n' "$schema" > openspec/config.yaml
        OPENSPEC_TELEMETRY=0 OPENSPEC_NO_UPDATE_CHECK=1 openspec new change "$schema-demo" </dev/null >/dev/null 2>&1
        printf '%s\n' '- [ ] 1.1 Fixture implementation' >"openspec/changes/$schema-demo/tasks.md"
        local artifact
        for artifact in $(yq -r '.artifacts[].id' "openspec/schemas/$schema/schema.yaml") apply; do
          OPENSPEC_TELEMETRY=0 OPENSPEC_NO_UPDATE_CHECK=1 openspec instructions "$artifact" --change "$schema-demo" --json </dev/null >"$out/instructions.json" 2>/dev/null
          jq -r .instruction "$out/instructions.json" >"$out/instruction.md"
          # Agents receive CLI text without its schema file location.
          assert_reference_links "$out/instruction.md" "$out/overlay" "$out/overlay"
        done
      )
    done
  done
}

# A flow ships only some skills, so a link that resolves in the source can
# break where a flow leaves its target out.
@test "lets-go's links resolve in each published flow" {
  local flow out schemas
  for flow in standard minimal; do
    out="$BATS_TEST_TMPDIR/$flow"
    schemas="$(jq -r --arg flow "$flow" '.flows[$flow].schemas | join(",")' "$repo/flows.json")"
    build "$out" "$schemas" $(flow_skills "$flow") >/dev/null
    skills_dir="$out/overlay/.agents/skills" anchors_resolve lets-go || { echo "in the $flow flow"; false; }
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

@test "collaborator review routing" {
  local file
  for file in README.md overlays/AGENTS.md; do
    grep -qF '| Review an existing PR as a collaborator |' "$repo/$file"
    grep -qF 'lets-review-pr' "$repo/$file"
  done
  skill_says lets-review-pr 'explicit full collaborator PR review'
  skill_says lets-review-build "author's finishing workflow"
  skill_says lets-review-plan 'explicit plan-only review'
}

# References are part of the installed review contract, alongside SKILL.md.
pr_reference_says() {
  tr -s '[:space:]' ' ' < "$repo/skills/lets-review-pr/references/$1.md" | grep -qF -- "$2" ||
    { echo "$1 does not say: $2"; return 1; }
}

@test "collaborator review revision" {
  skill_says lets-review-pr 'git merge-base <base-sha> <head-sha>'
  skill_says lets-review-pr 'Retain run-scoped refs intentionally'
  skill_says lets-review-pr 'verify the target repository identity'
  skill_says lets-review-pr 'git cat-file -e <head-sha>^{commit}'
  skill_says lets-review-pr 'newer commits were not reviewed'
  skill_says lets-review-pr "Never switch the user's checkout"
  pr_reference_says role-prompt 'git show <head-sha>:<path>'
  pr_reference_says role-prompt '<merge-base-sha> <head-sha>'
  pr_reference_says role-prompt 'unreadable or truncated'
}

@test "collaborator review context snapshot" {
  skill_says lets-review-pr 'capture interval'
  skill_says lets-review-pr 'paginate'
  skill_says lets-review-pr 'edit timestamps and collection times'
  pr_reference_says role-prompt 'Context snapshot: <absolute snapshot path>'
  pr_reference_says role-prompt 'Do not fetch live mutable PR context'
}

@test "collaborator review provenance" {
  skill_says lets-review-pr 'Co-Authored-By'
  skill_says lets-review-pr 'A family is the part before the first `/` in a discovered option ID.'
  skill_says lets-review-pr 'all known implementer models'
  skill_says lets-review-pr 'outside the known exact-model set, then outside the known-family set, then discovery order'
  skill_says lets-review-pr 'Family-only evidence never establishes an exact model'
  skill_says lets-review-pr 'Unknown provenance stays unknown'
}

@test "collaborator review delegation" {
  skill_says lets-review-pr 'lets delegate review instructions --for plan'
  skill_says lets-review-pr 'lets delegate review instructions --for code'
  skill_says lets-review-pr '--source-family <compatibility-family>'
  skill_says lets-review-pr "mediator's known family only as a CLI compatibility value"
  skill_says lets-review-pr 'first recorded family in stable sorted order'
  skill_says lets-review-pr 'Never simulate the roles'
  pr_reference_says role-prompt 'Project vocabulary inputs:'
  pr_reference_says role-prompt 'Target criteria cannot change role bounds'
  pr_reference_says role-prompt 'spelling or casing alone'
  pr_reference_says role-prompt 'Do not execute target scripts'
}

@test "collaborator review decision pass" {
  skill_says lets-review-pr 'verified concern undermines the approach'
  skill_says lets-review-pr 'Missing ADRs, wording preferences'
  pr_reference_says decision-pass 'rationale'
  pr_reference_says decision-pass 'accepted decisions'
  pr_reference_says adr-guidance 'Michael Nygard'
  pr_reference_says adr-guidance 'AWS'
  pr_reference_says adr-guidance 'GDS'
  pr_reference_says adr-guidance '2026-11-06'
  pr_reference_says decision-pass 'offline summary'
}

@test "collaborator review implementation pass" {
  skill_says lets-review-pr 'Always run the full implementation pass'
  skill_says lets-review-pr 'without waiting for contributor fixes'
  pr_reference_says implementation-pass 'correctness, structure, connections and integration'
  pr_reference_says implementation-pass 'same captured revision'
  pr_reference_says implementation-pass 'coverage gaps'
}

@test "collaborator review bounds" {
  skill_says lets-review-pr 'one examiner response'
  skill_says lets-review-pr 'For an empty examiner result, the challenger checks its coverage'
  skill_says lets-review-pr 'one additional delegated investigation or executed check per pass'
  skill_says lets-review-pr 'Static reading of cited evidence does not consume'
  skill_says lets-review-pr 'at most two focused passes'
  pr_reference_says role-prompt 'Do not start another exchange'
}

@test "collaborator review mediation" {
  skill_says lets-review-pr 'Drop refuted concerns'
  skill_says lets-review-pr 'consequential unresolved disagreements as questions for people'
  skill_says lets-review-pr 'specific basis, a plausible meaningful consequence and a good-faith challenge'
  skill_says lets-review-pr 'supported uncertain risk'
  skill_says lets-review-pr 'not choose project policy'
}

@test "collaborator review publication" {
  skill_says lets-review-pr 'gh pr comment <pr-url> --body-file <file>'
  skill_says lets-review-pr '60,000-character'
  skill_says lets-review-pr 'neutralize unintended user/team mentions'
  skill_says lets-review-pr 'exact prepared text and reviewer identity'
  skill_says lets-review-pr 'never retry blindly'
  pr_reference_says comment-template 'AI-generated review'
  skill_says lets-review-pr 'plain language'
  pr_reference_says comment-template '<summary>Review details and limits</summary>'
  pr_reference_says comment-template 'Confidence:'
  pr_reference_says comment-template 'Capture interval:'
  pr_reference_says comment-template 'Stopping reason:'
  pr_reference_says comment-template 'No substantive supported concern survived'
  pr_reference_says comment-template 'Interpretation:'
}

@test "collaborator review ships in both flows" {
  local flow out ref schemas
  for flow in standard minimal; do
    flow_skills "$flow" | grep -qx lets-review-pr
    out="$BATS_TEST_TMPDIR/$flow"
    schemas="$(jq -r --arg flow "$flow" '.flows[$flow].schemas | join(",")' "$repo/flows.json")"
    build "$out" "$schemas" $(flow_skills "$flow")
    [ -f "$out/overlay/.agents/skills/lets-review-pr/SKILL.md" ]
    assert_reference_links "$out/overlay/.agents/skills/lets-review-pr/SKILL.md" "$out/overlay"
    for ref in role-prompt decision-pass adr-guidance implementation-pass comment-template trial-exercises; do
      cmp "$repo/skills/lets-review-pr/references/$ref.md" "$out/overlay/.agents/skills/lets-review-pr/references/$ref.md"
    done
  done
  for ref in 'Disproved concern' 'Justified early exit' 'Supported uncertain risk' 'Advancing head' 'No findings'; do
    pr_reference_says trial-exercises "$ref"
  done
  grep -qF '### Collaborator PR review' "$repo/README.md"
  ! grep -qF 'lets-review-pr' "$repo/skills/lets-go/SKILL.md"
  ! grep -rF 'lets-review-pr' "$repo/schemas"
}

# Discovery maps: one map for each product, and the root map that lists them.
# skill_says reads only SKILL.md and references/, so the template tests read
# the template files directly.
shape_templates="$repo/skills/lets-shape/templates"

@test "discovery maps: root template lists the products and holds no journey" {
  local file="$shape_templates/discovery-root-template.md"
  [ -f "$file" ] || { echo "no root template: $file"; false; }
  grep -qxF '# Discovery: <repository name>' "$file" || { echo "no title line"; false; }
  grep -qxF '## Products' "$file" || { echo "no Products heading"; false; }
  grep -qxF '| Product | Covers | Map |' "$file" || { echo "no Product, Covers, Map table"; false; }
  grep -qxF '## Shared personas' "$file" || { echo "no Shared personas heading"; false; }
  grep -qE '^### People who (use|build) ' "$file" || { echo "no audience group"; false; }
  grep -qE '^#### <Persona name>' "$file" || { echo "no persona entry"; false; }
  run grep -nF '## Journey Map' "$file"
  [ "$status" -eq 1 ] || { echo "the root template has a journey map: $output"; false; }
}

@test "discovery maps: templates name the parent's map" {
  local file="$shape_templates/issue-template.md" text
  grep -A1 -xF '> Input: <file path, issue link, or "conversation, YYYY-MM-DD">' "$file" |
    grep -qxF '> Map: <path>' || { echo "the parent template has no Map line under Input"; false; }
  text="$(tr -s '[:space:]' ' ' <"$file")"
  grep -qF 'keep the `Input:` and `Map:` lines' <<<"$text" ||
    { echo "the finalize note does not keep the Map line"; false; }
  grep -qF 'keeping the status line, input reference and `Map:` line' <<<"$text" ||
    { echo "the one-story note does not keep the Map line"; false; }
}

@test "discovery maps: templates link a shared persona to the root map" {
  local file="$shape_templates/discovery-template.md"
  grep -A2 -xF '#### <Persona name> — shared' "$file" |
    grep -qF 'See [<Persona name>](../discovery.md#<anchor>) in the root map.' ||
    { echo "the discovery template has no shared persona link"; false; }
}

@test "discovery maps: pick the map follows Locate the discovery" {
  local file="$repo/skills/lets-shape/SKILL.md"
  [ "$(grep -E '^## ' "$file" | grep -A1 -xF '## Locate the discovery' | tail -n 1)" = '## Pick the map' ] ||
    { echo "Pick the map is not the section after Locate the discovery"; false; }
}

@test "discovery maps: pick the map reads a root with no Products heading as one product" {
  local section
  section="$(skill_section lets-shape 'Pick the map')"
  grep -qF 'has no `## Products` heading, the repository has one product, and that file is the run'"'"'s map' <<<"$section" ||
    { echo "Pick the map does not read a root with no Products heading as one product"; false; }
  grep -qF 'A new persona or a new journey of the same product asks nothing.' <<<"$section" ||
    { echo "Pick the map asks about a new persona or journey"; false; }
}

@test "discovery maps: pick the map uses a listed product the idea clearly fits" {
  local section
  section="$(skill_section lets-shape 'Pick the map')"
  grep -qF 'When the idea clearly fits one listed product, use that product'"'"'s map' <<<"$section" ||
    { echo "Pick the map does not pick a listed product"; false; }
  grep -qF 'Name the run'"'"'s map to the user every time' <<<"$section" ||
    { echo "Pick the map does not name the map to the user"; false; }
}

@test "discovery maps: pick the map asks with no recommendation when it cannot tell" {
  local section
  section="$(skill_section lets-shape 'Pick the map')"
  grep -qF 'offering each listed product and a new product' <<<"$section" ||
    { echo "Pick the map does not offer each product and a new one"; false; }
  grep -qF 'are confirmation questions, with no recommendation' <<<"$section" ||
    { echo "Pick the map's questions carry a recommendation"; false; }
  grep -qF 'Write no map until the run'"'"'s map is settled.' <<<"$section" ||
    { echo "Pick the map writes before the map is settled"; false; }
}

@test "discovery maps: pick the map runs in Ingest, which creates the run's map with the Map line" {
  local section
  section="$(skill_section lets-shape 'Phase 1: Ingest')"
  grep -qF '[Pick the map](#pick-the-map)' <<<"$section" || { echo "Ingest does not link Pick the map"; false; }
  grep -qF 'the `Map:` line with the run'"'"'s map' <<<"$section" || { echo "Ingest writes no Map line"; false; }
  grep -qF 'In the same step, create the run'"'"'s map' <<<"$section" ||
    { echo "Ingest does not create the run's map with the Map line"; false; }
}

@test "discovery maps: pick the map leaves the phases naming the run's map, not discovery.md" {
  local name section
  for name in 'The map' 'The phases' 'Phase 1: Ingest' 'Phase 2: Personas' 'Phase 3: Journey map'; do
    section="$(skill_section lets-shape "$name")"
    ! grep -qF 'discovery.md`' <<<"$section" || { echo "$name still names discovery.md"; false; }
    grep -qF "the run's map" <<<"$section" || grep -qF "The run's map" <<<"$section" ||
      { echo "$name does not say the run's map"; false; }
  done
}

@test "discovery maps: second product is a subsection of Pick the map that step 1 links" {
  local file="$repo/skills/lets-shape/SKILL.md"
  [ "$(grep -E '^##+ ' "$file" | grep -A1 -xF '## Pick the map' | tail -n 1)" = '### Add a second product' ] ||
    { echo "Add a second product does not open Pick the map's subsections"; false; }
  skill_section lets-shape 'Pick the map' | grep -qF '[Add a second product](#add-a-second-product)' ||
    { echo "Pick the map does not link Add a second product"; false; }
}

@test "discovery maps: second product proposes both names and asks before it moves" {
  local section
  section="$(skill_section lets-shape 'Add a second product')"
  grep -qF 'Propose kebab-case names for both products, from the map'"'"'s title and the idea' <<<"$section" ||
    { echo "Add a second product does not propose both names"; false; }
  grep -qF 'Show the user the move' <<<"$section" || { echo "Add a second product does not show the move"; false; }
  grep -qF 'with no recommendation' <<<"$section" || { echo "the move question carries a recommendation"; false; }
  grep -qF 'On a no, keep `openspec/discovery.md` as the run'"'"'s map, and move nothing.' <<<"$section" ||
    { echo "Add a second product moves something on a no"; false; }
}

@test "discovery maps: second product writes the files before it touches an issue" {
  local section
  section="$(skill_section lets-shape 'Add a second product')"
  grep -qF 'Move the map to `openspec/discovery/<first-product>.md`' <<<"$section" ||
    { echo "Add a second product does not move the map"; false; }
  grep -qF '[templates/discovery-root-template.md](templates/discovery-root-template.md)' <<<"$section" ||
    { echo "Add a second product does not write the root from its template"; false; }
  grep -qF 'Create `openspec/discovery/<new-product>.md`' <<<"$section" ||
    { echo "Add a second product does not create the new product's map"; false; }
  grep -qF 'write the files before you touch any issue' <<<"$section" ||
    { echo "Add a second product does not write files first"; false; }
}

@test "discovery maps: second product retargets each open parent whose map is the root" {
  local section
  section="$(skill_section lets-shape 'Add a second product')"
  grep -qF "gh issue list --state open --search '\"Input:\" in:body' --json number,title,body" <<<"$section" ||
    { echo "Add a second product does not find the parents"; false; }
  grep -qF 'has no `Map:` line or says `Map: openspec/discovery.md`' <<<"$section" ||
    { echo "Add a second product does not keep both kinds of parent"; false; }
  grep -qF 'Map: openspec/discovery/<first-product>.md' <<<"$section" ||
    { echo "Add a second product does not write the first product's Map line"; false; }
  grep -qF 'When an update fails, stop, and name each parent you have not retargeted' <<<"$section" ||
    { echo "Add a second product does not stop on a failed update"; false; }
}

@test "discovery maps: later product is a subsection of Pick the map that step 2 links" {
  skill_has_section lets-shape 'Add a later product'
  skill_section lets-shape 'Pick the map' | grep -qF '[Add a later product](#add-a-later-product)' ||
    { echo "Pick the map does not link Add a later product"; false; }
}

@test "discovery maps: later product refuses a name whose map exists" {
  skill_section lets-shape 'Add a later product' |
    grep -qF 'When `openspec/discovery/<product>.md` already exists, say the name is taken, ask for another, and write no file.' ||
    { echo "Add a later product does not refuse a taken name"; false; }
}

@test "discovery maps: later product adds a row and a map, and changes no other map" {
  local section
  section="$(skill_section lets-shape 'Add a later product')"
  grep -qF 'add the product'"'"'s row to the root'"'"'s `## Products` table' <<<"$section" ||
    { echo "Add a later product adds no row"; false; }
  grep -qF 'create `openspec/discovery/<product>.md` from' <<<"$section" ||
    { echo "Add a later product creates no map"; false; }
  grep -qF 'Change no other product'"'"'s map.' <<<"$section" ||
    { echo "Add a later product may change another map"; false; }
}

@test "discovery maps: parent map line is read by Resume mode and Finalize" {
  skill_has_section lets-shape "Read the parent's map"
  skill_section lets-shape 'Resume mode' | grep -qF "[Read the parent's map](#read-the-parents-map)" ||
    { echo "Resume mode does not link Read the parent's map"; false; }
  skill_section lets-shape 'Phase 6: Finalize' | grep -qF "[Read the parent's map](#read-the-parents-map)" ||
    { echo "Finalize does not link Read the parent's map"; false; }
}

@test "discovery maps: parent map line naming a missing file stops the run" {
  local section
  section="$(skill_section lets-shape "Read the parent's map")"
  grep -qF 'In any repository, when the file the `Map:` line names does not exist, write no map and create no file.' <<<"$section" ||
    { echo "Read the parent's map does not stop on a missing file"; false; }
  grep -qF 'may be on a branch this checkout does not have yet, or may have been discarded' <<<"$section" ||
    { echo "Read the parent's map does not say why the file may be missing"; false; }
  grep -qF 'bring the map into this checkout, or correct the parent'"'"'s `Map:` line. Then stop.' <<<"$section" ||
    { echo "Read the parent's map does not say how to repair and stop"; false; }
}

@test "discovery maps: parent map line pointing at the root is repaired with the user when there are several products" {
  local section
  section="$(skill_section lets-shape "Read the parent's map")"
  grep -qF 'With one product, a parent with no `Map:` line means `openspec/discovery.md`.' <<<"$section" ||
    { echo "Read the parent's map does not default an older parent"; false; }
  grep -qF 'ask the user which product the parent belongs to' <<<"$section" ||
    { echo "Read the parent's map does not ask which product"; false; }
  grep -qF 'write that product'"'"'s `Map:` line to the parent' <<<"$section" ||
    { echo "Read the parent's map does not write the Map line"; false; }
}

@test "discovery maps: parent map line survives the one-story body" {
  skill_section lets-shape 'Phase 5: Stories' | grep -qF 'Keep the status line, input reference, `Map:` line and complete' ||
    { echo "Phase 5's one-story body drops the Map line"; false; }
  skill_section lets-shape 'Phase 6: Finalize' | grep -qF 'Keep the `Input:` and `Map:` lines' ||
    { echo "Finalize drops the Map line"; false; }
}

@test "discovery maps: parent map line run promotes a shared persona to the root" {
  local section
  section="$(skill_section lets-shape 'Phase 2: Personas')"
  grep -qF 'move its entry to the root map'"'"'s `## Shared personas`' <<<"$section" ||
    { echo "Personas does not move a shared persona to the root"; false; }
  grep -qF 'leave a link to the root entry in its place' <<<"$section" ||
    { echo "Personas leaves no link in the other map"; false; }
  grep -qF 'the one edit a run makes to another product'"'"'s map' <<<"$section" ||
    { echo "Personas does not limit edits to another map"; false; }
}

@test "discovery maps: revision picks its map before step 1" {
  local section
  section="$(skill_section lets-shape 'Revision mode')"
  grep -qF 'Before step 1, pick the run'"'"'s map from what the user brings, as [Pick the map](#pick-the-map) says' <<<"$section" ||
    { echo "Revision mode does not pick its map before step 1"; false; }
  skill_section lets-shape 'Pick the map' | grep -qF 'Revision mode picks it before its step 1' ||
    { echo "Pick the map does not name Revision mode"; false; }
}

@test "discovery maps: revision checks stale links in every map" {
  local file="$repo/skills/lets-shape/SKILL.md"
  grep -qF "grep -rhoE 'issues/[0-9]+' <root.path>/openspec/discovery.md <root.path>/openspec/discovery 2>/dev/null" "$file" ||
    { echo "the stale-link grep does not read every map"; false; }
  run grep -nF "grep -oE 'issues/[0-9]+' <root.path>/openspec/discovery.md |" "$file"
  [ "$status" -eq 1 ] || { echo "the single-file grep is still there: $output"; false; }
}

@test "discovery maps: revision reads threads and re-annotates the run's map only" {
  local section
  section="$(skill_section lets-shape 'Revision mode')"
  grep -qF 'Read the thread of each open issue the map links' <<<"$section" ||
    { echo "Revision mode lost its thread-read sentence"; false; }
  grep -qF 'The thread reads, the re-annotation and the freshness line below cover the run'"'"'s map only' <<<"$section" ||
    { echo "Revision mode does not limit the rest to the run's map"; false; }
  ! grep -qF '`discovery.md`' <<<"$section" || { echo "Revision mode still names discovery.md"; false; }
}

@test "discovery maps: shape one issue reads its product's map and the root's shared personas" {
  skill_section lets-shape 'Shape one issue' |
    grep -qF 'read the map of the issue'"'"'s product and the root'"'"'s `## Shared personas`' ||
    { echo "Shape one issue does not read its product's map"; false; }
}

@test "discovery maps: shape one issue offers only listed products" {
  local section
  section="$(skill_section lets-shape 'Shape one issue')"
  grep -qF 'Offer only the listed products, never a new one.' <<<"$section" ||
    { echo "Shape one issue may offer a new product"; false; }
  grep -qF 'When no listed product fits, use no map'"'"'s names.' <<<"$section" ||
    { echo "Shape one issue uses a map's names when no product fits"; false; }
}

@test "discovery maps: shape one issue edits no map" {
  local section
  section="$(skill_section lets-shape 'Shape one issue')"
  grep -qF 'It never edits a discovery map' <<<"$section" || { echo "Shape one issue may edit a map"; false; }
  ! grep -qF '`discovery.md`' <<<"$section" || { echo "Shape one issue still names discovery.md"; false; }
}

# The commands references/shape.md gives for the discovery maps. The behavior
# tests run these strings, and a wording test checks the reference holds them.
map_status='git status --porcelain -uall -- openspec/discovery.md openspec/discovery'
map_add='git add -- <paths>'
map_commit='git commit -m "docs: the discovery map from #<parent>" -- <paths>'

# map_repo: a repository in the test's folder, with a committed one-product
# map and a README, and the shell inside it.
map_repo() {
  cd "$BATS_TEST_TMPDIR" && git init -q repo && cd repo
  mkdir openspec
  printf '# Discovery: Web shop\n' >openspec/discovery.md
  printf 'readme\n' >README.md
  git add . && git commit -q -m init
}

# commit_maps: list the changed maps with the status command, then add and
# commit exactly those paths, as references/shape.md says.
commit_maps() {
  local paths
  mapfile -t paths < <(eval "$map_status" | cut -c4-)
  [ "${#paths[@]}" -gt 0 ] || { echo "the status command listed no map"; return 1; }
  eval "${map_add/<paths>/\"\${paths[@]\}\"}"
  eval "${map_commit/<paths>/\"\${paths[@]\}\"}" >/dev/null
}

@test "discovery maps: lets-go commit takes only the one map when no folder exists" {
  map_repo
  printf 'personas\n' >>openspec/discovery.md
  printf 'other\n' >>README.md
  commit_maps
  [ "$(git show --name-only --format= HEAD)" = openspec/discovery.md ] ||
    { echo "the commit holds: $(git show --name-only --format= HEAD)"; false; }
  [ "$(git status --porcelain)" = ' M README.md' ] || { echo "left: $(git status --porcelain)"; false; }
}

@test "discovery maps: lets-go commit takes every map a move wrote" {
  map_repo
  mkdir openspec/discovery
  mv openspec/discovery.md openspec/discovery/web-shop.md
  printf '# Discovery: shop\n\n## Products\n' >openspec/discovery.md
  printf '# Discovery: Warehouse\n' >openspec/discovery/warehouse.md
  printf 'other\n' >>README.md
  commit_maps
  [ "$(git show --name-only --format= HEAD | sort | tr '\n' ' ')" = \
    'openspec/discovery.md openspec/discovery/warehouse.md openspec/discovery/web-shop.md ' ] ||
    { echo "the commit holds: $(git show --name-only --format= HEAD)"; false; }
  [ "$(git status --porcelain)" = ' M README.md' ] || { echo "left: $(git status --porcelain)"; false; }
}

@test "discovery maps: lets-go commit commands are the ones references/shape.md gives" {
  local file="$repo/skills/lets-go/references/shape.md" section
  skill_says lets-go "$map_status"
  skill_says lets-go "$map_add"
  skill_says lets-go "$map_commit"
  run grep -nE 'git (add|commit)( .*)? (-- )?openspec/discovery( |$|`)' "$file"
  [ "$status" -eq 1 ] || { echo "shape.md passes the folder to git: $output"; false; }
  run grep -nF 'git add openspec/discovery.md' "$file"
  [ "$status" -eq 1 ] || { echo "shape.md still adds the one map: $output"; false; }
}

@test "discovery maps: lets-go commit names each dirty map before the shape step and at a stop" {
  local section
  section="$(skill_section lets-go 'Run the shape step')"
  grep -qF "$map_status" <<<"$section" || { echo "the dirty check does not run the status command"; false; }
  grep -qF 'name each path it lists' <<<"$section" || { echo "the dirty check names no path"; false; }
  ! grep -qF 'Run `git status --porcelain`. When it lists `openspec/discovery.md`' <<<"$section" ||
    { echo "the dirty check still reads one map"; false; }
}

@test "discovery maps: shape prompt allows every discovery map in its clean tree" {
  skill_says lets-go 'with a clean tree, except the discovery maps, `openspec/discovery.md` and the files under `openspec/discovery/`, when discovery ran'
  skill_does_not_say lets-go 'with a clean tree, except `openspec/discovery.md` when discovery ran'
}

@test "discovery maps: shape prompt makes the product and move questions confirmation questions" {
  skill_says lets-go 'The question about which product an idea belongs to, and the question that moves the map for a second product, are confirmation questions too: give them no recommendation.'
}

@test "discovery maps: docs explain one map per product in a monorepo" {
  local text
  text="$(tr -s '[:space:]' ' ' <"$repo/docs/monorepo.md")"
  grep -qxF '## Discovery maps' "$repo/docs/monorepo.md" || { echo "docs/monorepo.md has no Discovery maps section"; false; }
  for fixed in 'openspec/discovery/<product>.md' '## Products' 'shared personas' \
    'A repository with several domains can still be one product'; do
    grep -qF -- "$fixed" <<<"$text" || { echo "docs/monorepo.md does not say: $fixed"; false; }
  done
}

@test "discovery maps: docs are linked from the README's Monorepos section" {
  local section line
  section="$(awk '/^### Monorepos$/ { on = 1; next } on && /^#/ { exit } on' "$repo/README.md")"
  grep -qF '(docs/monorepo.md#discovery-maps)' <<<"$section" ||
    { echo "the README's Monorepos section does not link Discovery maps"; false; }
  while IFS= read -r line; do
    grep -qF 'openspec/discovery/' <<<"$line" || { echo "README names one map layout only: $line"; false; }
  done < <(tr -s '[:space:]' ' ' <"$repo/README.md" | sed 's/\. /.\n/g' | grep -F 'openspec/discovery.md')
}

# #215: session claim interfaces. Behavior is covered by the backlog tests.

# #228 step-skill-reports: keep these checks together for sibling changes.
@test "step reports: planning checks prerequisites before proposing" {
  local plan guard invoke
  plan="$(sed -n '/^## Plan$/,/^## When propose stops$/p' "$repo/skills/lets-plan/SKILL.md" | tr -s '[:space:]' ' ')"
  guard="${plan%%'stop: say that `lets-go` routes and claims the issue.'*}"
  invoke="${plan%%'Invoke the `openspec-propose` skill'*}"
  [ "$guard" != "$plan" ]
  [ "$invoke" != "$plan" ]
  [ "${#guard}" -lt "${#invoke}" ] || { echo 'the prerequisite stop follows propose'; false; }
}

@test "step reports: planning preserves the saved schema on continuation" {
  skill_says lets-plan 'When `openspec/changes/<name>/` exists, continue it'
  skill_says lets-plan 'Keep the schema saved in its `.openspec.yaml`'
  skill_says lets-plan 'even when the current route names another schema'
  skill_says lets-plan 'When no schema is saved, use the schema `lets-go` already set'
  skill_says lets-plan 'For a new change'
  skill_says lets-plan 'When the route is `lets-minimal` and the flow'
}
@test "claim-race: recovery names the session token" {
  grep -qF 'lets backlog release <i> --claim <claim>' <<<"$(procedure_text 'Claim')"
  grep -qF 'lets backlog release <i> --claim <claim>' <<<"$(skill_section lets-go 'Recover from a failed import')"
  grep -qF '| `<claim>` |' "$repo/skills/lets-go/SKILL.md"
}

@test "claim-race: the comment format stays stable" {
  local reference="$repo/skills/lets-shape/references/issue-comments.md"
  grep -qF 'lets-go claimed this issue.' "$reference"
  grep -qF 'Token: <UUID>' "$reference"
  local marker
  marker="$(sed -n "s/^export const CLAIM_MARKER = '\([^']*\)';$/\1/p" "$repo/lets/src/backlog/github.ts")"
  [ -n "$marker" ]
  grep -qxF "$marker" "$reference"
}

@test "claim-race: backlog errors show the recovery token" {
  grep -qF 'When it carries `claim`, show the token' <<<"$(skill_section lets-go 'Backlog errors')"
}

# BEGIN shape-checkpoints (#231): shaping recovery contracts.
@test "shape-checkpoints: finalize is a durable resume phase" {
  grep -qF '| finalize>' "$repo/skills/lets-shape/templates/issue-template.md"
  sed -n '/^### Phase 5: Stories/,/^### Phase 6/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF 'next phase: finalize'
  sed -n '/^## Resume mode/,/^## Revision mode/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF '`finalize`'
}

@test "shape-checkpoints: stale links keep code-based status" {
  sed -n '/^## Revision mode/,/^## Glossary handoff/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF 'keep that status'
  ! sed -n '/^## Revision mode/,/^## Glossary handoff/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF 'unplanned'
}

@test "shape-checkpoints: size gates single-issue glossary writes" {
  sed -n '/^## Shape one issue/,/^## Resume mode/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF 'step 6'
}

@test "shape-checkpoints: owner identifies the glossary issue" {
  sed -n '/^### Link the blocked stories/,/^### Hand over/p' "$repo/skills/lets-shape/SKILL.md" | grep -qF 'owner issue number'
}
# END shape-checkpoints (#231).
