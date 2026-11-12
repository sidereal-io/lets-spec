## 1. Authoring guidance

- [ ] 1.1 [easy] The MODIFIED export example retains the signed-out scenario (verify: bats tests/skill-interfaces.bats --filter 'authoring wording: modified export')
- [ ] 1.2 [easy] The ledger refers to design only when the flow has one (verify: bats tests/skill-interfaces.bats --filter 'authoring wording: design reference')
- [ ] 1.3 [easy] Flows without design locate implementation decisions through schema ledger requirements (verify: bats tests/skill-interfaces.bats --filter 'authoring wording: no-design flow')
- [ ] 1.4 [easy] ADR readability rewrites preserve supersession relationships (verify: bats tests/skill-interfaces.bats --filter 'authoring wording: ADR rewrite')
- [ ] 1.5 [easy] New-capability authors find capability paths before existing-requirement guidance (verify: bats tests/skill-interfaces.bats --filter 'authoring wording: capability paths')
