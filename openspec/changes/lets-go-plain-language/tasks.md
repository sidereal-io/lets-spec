<!-- Nine tasks. Each is one group of neighbouring sections of skills/lets-go/SKILL.md,
     rewritten as the ledger in brainstorm.md says: D6 for words, D7 for structure, D10 for
     a sentence that reads two ways, D11 for wrapping. One docs: commit per task. -->

## 1. The plain-language pass

Every verify command uses the three checks below. Paste them into the shell first.
`gate` is the no-change gate of D3, against the base commit. `readable <start> <end>`
is the readability check of D9 on the sections between two headings; `''` means the
start or the end of the file. `pinned` checks the spec's fixed-lines list. `bats
tests/skill-interfaces.bats` checks every pin on top.

```bash
f=skills/lets-go/SKILL.md; base=5d9870f
fenced() { awk 'match($0,/^ *(`{3,})/){l=RLENGTH; if(!n){n=l; print; next} else if(l>=n){n=0; print; next}} n' | sed 's/^ *//'; }
heads() { awk 'match($0,/^ *(`{3,})/){l=RLENGTH; if(!n){n=l} else if(l>=n){n=0}; next} !n && /^#/'; }
gate() { diff <(git show $base:$f | fenced) <(fenced <$f) && diff <(git show $base:$f | grep -oE '`[^`]+`' | sort -u) <(grep -oE '`[^`]+`' $f | sort -u) && diff <(git show $base:$f | heads) <(heads <$f) && diff <(git show $base:$f | grep -oE '\]\([^)]+\)' | sort -u) <(grep -oE '\]\([^)]+\)' $f | sort -u); }
readable() { awk -v s="$1" -v e="$2" 'BEGIN{on=(s=="")} $0==s{on=1} on && e!="" && $0==e{exit} on' $f | awk 'match($0,/^ *(`{3,})/){l=RLENGTH; if(!n){n=l}else if(l>=n){n=0}; next} n{next} /^ *\|/{next} /^#/{print ""; next} /^ *(-|[0-9]+\.) /{print ""} {print}' | sed -E 's/`[^`]*`/CODE/g; s/\*\*[^*]+\*\*/BOLD/g; s/\[[^]]*\]\([^)]*\)/LINK/g' | awk '/^ *$/{if(p!="")print p; p=""; next} {sub(/^ *(-|[0-9]+\.) /,""); p=p" "$0} END{if(p!="")print p}' | sed -E 's/([.!?])( |$)/\1\n/g' | awk 'NF>30{print "long ("NF"): "$0; bad=1} /(^|[^A-Za-z])([Ss]elect|[Tt]ell|[Dd]irector|[Ee]xecut)|in order to|prior to/{print "word: "$0; bad=1} END{exit bad}'; }
pinned() { awk '/^### Requirement: The prose holds the fixed lines/{on=1;next} on && /^### /{exit} on && /^- `/' openspec/specs/lets-go/spec.md | sed -E 's/^- `(.*)`$/\1/' | while IFS= read -r s; do tr -s '[:space:]' ' ' <$f | grep -qF -- "$s" || { echo "missing: $s"; return 1; }; done; }
```

The tests pin these prose phrases word for word, across line breaks. Keep each
one's words and their order; only the wrapping may move.

- `its *Check the prerequisite* still runs, and its stop stands`
- ``run `next` again with the same candidates, and go on from *Start* step 3 with the new issue``
- ``running `lets-go` again on that branch carries on from the first unfinished step``
- `Write the answer as the user gave it, with no marker`
- `asked a settled question again`
- `at most once`
- `holds another idea`
- `the edits are that discovery's confirmed phases`
- `the guidance first, then the order the options came in`
- ``When `options` is empty, pass your own family``
- `The guidance only ranks and filters the listed models`
- `**3**: no fresh session can run here, for example because no resolver started one`
- `The watermark is the later of the body's last edit and the newest read marker`
- `not before` and `the records disagree if the pull request`, inside *Walk the step table*

Three traps a rewrite can fall into. The file must not come to say `needs an issue
number, and stop` (it says `needs the issue number`), `runs inside build`, or `with a
Code review section`. No `` `gh ` `` code span may appear before the line that holds
`lets go level`. The rows of the step table, and the two disagreement rows that start
`| An archive folder` and `| An archived change on a schema other than`, stay as they are.

- [ ] 1.1 [medium] The front matter, the opening paragraphs and *Start* read in plain language: the description keeps every fact and its "Use when" sentence in sentences of at most 30 words, each of *Start*'s ten steps puts its condition before its action and names what each pointer points at, and `selects` becomes `picks` (verify: `gate && readable '' '### Find the source of demand' && bats tests/skill-interfaces.bats`)
- [ ] 1.2 [medium] *Find the source of demand*, *Confirm the packet* and *Route* read in plain language: `select` becomes `pick`, every pronoun has one plain referent, and the three cases of the source of demand each open with their condition (verify: `gate && readable '### Find the source of demand' '### Glossary preflight' && bats tests/skill-interfaces.bats`)
- [ ] 1.3 [easy] *Glossary preflight*, *Claim* and *Import the glossary checkpoint* read in plain language: the actor is named in each numbered step, and the words follow D6; the check is green before the edit, so the gate and the bats suite guard it (verify: `gate && readable '### Glossary preflight' '### Start from an idea' && bats tests/skill-interfaces.bats`)
- [ ] 1.4 [medium] *Start from an idea*, *Run the shape step*, *Pick the first ready story* and *Commit the discovery map* read in plain language: the 33-word sentence on the level becomes short sentences or a short list, and each cross-reference to *Start* says what it points at (verify: `gate && readable '### Start from an idea' '## Walk the step table' && bats tests/skill-interfaces.bats`)
- [ ] 1.5 [medium] *Walk the step table* and *Records that disagree* read in plain language: each row's "done" rule opens with its condition, and the prose cells of the disagreement table say what to fix in one sentence each, with the two pinned rows unchanged (verify: `gate && readable '## Walk the step table' '## The step table' && bats tests/skill-interfaces.bats`)
- [ ] 1.6 [easy] *The step table*, *Read the records* and *The change's name* read in plain language, with the step table's rows byte for byte as they are (verify: `gate && readable '## The step table' '## Write the prompt' && bats tests/skill-interfaces.bats`)
- [ ] 1.7 [easy] *Write the prompt*, *Run a step* and *Run a step in a subagent* read in plain language, with the prompt frame and every other fenced block unchanged (verify: `gate && readable '## Write the prompt' '## Read the report' && bats tests/skill-interfaces.bats`)
- [ ] 1.8 [medium] *Read the report*, *Relay the questions* and *End of the run* read in plain language: `Tell the user` becomes `Say`, the 31-word sentence on the walk's lines splits, and each outcome's bullet opens with the outcome (verify: `gate && readable '## Read the report' '' && bats tests/skill-interfaces.bats`)
- [ ] 1.9 [easy] The whole file passes every check, the words of D6 hold from end to end, and the pull request description names each sentence kept under D10, or says there was none (verify: `gate && readable '' '' && pinned && pnpm test && nix flake check`)
