---
name: lets-verify-contracts
description: Use when implementing features, bug fixes, or refactors from a specification. Replaces strict unit-test-first TDD with a Constrain-Synthesize-Verify workflow built around types, black-box acceptance tests, and system invariants.
---

# Constrain, Synthesize, Verify

Do **not** write mock-heavy unit tests before the implementation exists. Premature unit tests lock in bad internal architecture and encourage brittle mocks. Instead, constrain the solution space with types and contracts first, synthesize the implementation cleanly, and verify behavior at public boundaries.

## Phase 1: Constrain (Contracts & Types First)

Before writing implementation logic, define the exact boundaries of the change:

1. **Define Data Shapes & Interfaces:** Write all public types, schemas (e.g., TypeScript interfaces, Zod/Pydantic schemas, Go structs/interfaces, Rust traits), and function signatures first.
2. **Document Invariants:** Add brief docstrings on public entry points stating pre-conditions, post-conditions, and error states.
3. **Establish the Red State via Compiler:** Run the type-checker, linter, or compiler. The build must recognize the new contracts before you write business logic.

## Phase 2: Synthesize (Implementation)

Implement the logic to satisfy the spec and the contracts from Phase 1:

1. **Top-Down Cohesion:** Write the cleanest internal structure needed to fulfill the public contract. Refactor internal helpers freely without worrying about breaking internal tests.
2. **Zero Premature Unit Tests:** Do not write isolated unit tests for private helpers or internal collaborators during this phase.
3. **Static Verification:** Run the compiler, type-checker, and linter until there are zero errors or warnings.

## Phase 3: Verify (Black-Box & Invariants)

Verify the implementation strictly against the **original specification**, not the internal code structure.

### 1. Black-Box Acceptance Tests (Primary)
* Test exclusively through the **highest public boundary** (CLI command, HTTP/RPC endpoint, public module API, or database state transition).
* Use real dependencies, in-memory stores, or ephemeral containers rather than mocks.
* Assert on observable outcomes (return values, exit codes, persisted state, emitted events)—never on internal call counts or private state.

### 2. Property-Based & Invariant Tests (For Logic-Heavy Code)
When implementing parsers, algorithms, state machines, or financial/math rules, prefer property-based tests (e.g., `fast-check`, `hypothesis`, `proptest`, `rapid`) over hardcoded example lists:
* **Round-trip properties:** `decode(encode(x)) == x`
* **Idempotency:** `f(f(x)) == f(x)`
* **Conservation/Invariants:** Domain rules that must hold across all valid inputs.

### 3. Targeted Unit Tests (Exception Only)
Write a narrow unit test *only* for:
* A pure function with complex branching logic that is awkward to trigger from the public boundary.
* A specific regression bug fix (reproduce the bug at the lowest *public* boundary possible, then fix it).

## Hard Rules (Anti-Patterns to Reject)

* **NO Internal Mocks:** Never mock internal functions, modules, or classes (`jest.mock`, `vi.mock`, `unittest.mock.patch` on internal code). Only mock true external I/O boundaries (third-party HTTP APIs, system clock, randomness) if a real/local substitute is unavailable.
* **NO Tautological Tests:** Never test language features, type guarantees already enforced by the compiler, trivial getters/setters, or framework wiring.
* **NO Coverage Padding:** Do not write low-value tests solely to inflate line-coverage metrics. Every test must guard a real spec requirement or invariant.
* **NO Implementation Coupling:** If refactoring internal code without changing external behavior breaks a test, the test is flawed—rewrite or delete it.

## Exit Criteria

Before marking the task complete:
- [ ] All public contracts/types are defined and pass strict type-checking/linting.
- [ ] Every requirement in the spec is covered by at least one black-box acceptance or invariant test.
- [ ] Zero tests assert on internal implementation details or mock internal collaborators.
- [ ] The full test suite passes cleanly.
