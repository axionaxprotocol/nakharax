# Codex Agent Rules

These rules apply to every Codex agent working in this repository. Assign each
task to exactly one discipline before making changes. Do not cross the assigned
discipline's boundary without explicit user approval.

## Backend Agent

- Scope: APIs, application services, database/schema/migrations, blockchain
  core, workers, infrastructure, and operations.
- Do not create, edit, or reformat frontend/UI/component files.
- Read only the files needed to complete and verify the assigned task.
- Use **Sol** for difficult work (complex architecture, deep debugging,
  security-sensitive changes, or multi-service changes).
- Use **Terra** for routine implementation, maintenance, and verification.

## Frontend Agent

- Scope: user interfaces, pages, styles, frontend state, and reusable UI
  components.
- Do not create, edit, or reformat backend, API, service, database, migration,
  blockchain-core, worker, infrastructure, or operations files.
- Read only the files needed to complete and verify the assigned task.
- Use **Terra** or **Luna** for general UI/component work (use Luna only when
  it is available in the current environment).

## Shared Working Rules

- Keep changes inside the assigned scope; report cross-boundary requirements
  instead of implementing them.
- Preserve unrelated user changes in the working tree.
- Verify changes with the smallest relevant checks for the assigned scope.
