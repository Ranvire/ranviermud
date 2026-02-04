# Ranvier Fork Audit (Phase 0)

## Current State Summary
- Single-package Node.js application with a thin wrapper (`ranvier`) that loads the `ranvier` engine package, reads `ranvier.json` (or `ranvier.conf.js`), and starts the game server. Core configuration and data sources live in `ranvier.json` and the `bundles/` + `data/` directories.
- No build/transpile step; runtime is direct CommonJS execution via `node ./ranvier`.
- Dependency tree is pinned via `package-lock.json` lockfile version 1 (npm v6 era).

## Current Node Version Support (as-is)
- `package.json` declares `engines.node >= 10.12.0`. The runtime entrypoint enforces this via a semver check at startup.
- README documents the same minimum Node requirement.

## Current Node/Runtime Assumptions
- CommonJS modules and Node globals (`process`, `__dirname`, `require`) throughout the entrypoint.
- Direct network server startup via Ranvier’s GameServer; defaults to telnet on configured port.
- Configuration must be provided via `ranvier.json` or `ranvier.conf.js`.

## Critical Paths (Must Not Break)
1. Server boots and listens on configured port.
2. Telnet connectivity (and websocket if configured by bundles).
3. Login and character creation flow.
4. Command parsing/dispatch path (command manager and event flow).
5. Persistence round-trip (player/account load/save) via file data sources.
6. Bundle loading for default content.

## Dependency Risk List (Top 10)
1. **`ranvier` (3.0.5)** – Core engine dependency; pins older transitive packages and governs all runtime behavior. Risk: unknown compatibility with modern Node LTS without validation.
2. **`optimist` (0.6.1)** – Deprecated CLI parser, unmaintained; can be incompatible with modern Node behaviors or security expectations.
3. **`commander` (2.19.0)** – Very old major; modern Node compatibility likely ok but lagging in security/bugfixes.
4. **`winston` (2.4.4)** – Old major; differences in transports and formatting vs modern Winston.
5. **`uuid` (3.3.2)** – Deprecated major; newer Node LTS encourages `uuid` v8+ or built-in `crypto` UUIDs.
6. **`semver` (5.6.0)** – Old major; should still function but lacks modern semver features and fixes.
7. **`sty` (version empty in package.json)** – Unpinned dependency is a reproducibility risk; lockfile pins 0.6.1 but `package.json` is ambiguous.
8. **`longjohn` (via `ranvier`)** – Deprecated/unmaintained stack trace helper; can be problematic on modern Node or with async stack trace changes.
9. **`pretty-error` (2.1.1)** – Old dependency chain (htmlparser2 3.x, etc.); risk of security issues and Node compatibility drift.
10. **`package-lock.json` v1 (npm6 era)** – Modern npm (v9/v10) will rewrite; may cause installation churn on newer Node.

## Missing Safety Rails
- **No automated tests** (unit, integration, or smoke tests).
- **No CI** to enforce compatibility across Node versions.
- **No documented dev/test commands** beyond `node ./ranvier` and bundle utilities.

## Recommended Target Node LTS
- **Node.js 20.x LTS**: current active LTS with long remaining support window, good performance, and compatibility with modern tooling. Selecting 20.x provides the best maintenance runway while keeping upgrades incremental.

## Proposed Staged Upgrade Plan (with Checkpoints & Rollback)

### Phase 1: Safety Rails (Low Risk, High Leverage)
- Add GitHub Actions CI:
  - Run lint (if added) + tests on **current baseline Node (10.12)** *if feasible* and **target Node 20.x**.
  - If Node 10.12 cannot run in CI, document that baseline as “best-effort” and rely on local verification.
- Add minimal test harness (Jest or Vitest):
  - Boot smoke test: start server in test mode and verify it reaches a “listening” state.
  - Command parsing/dispatch unit test.
  - Persistence round-trip test for a simple player object via file data source.
- Document local test commands in README.

**Checkpoint:** CI green on Node 20, tests pass locally.
**Rollback:** Revert CI/test changes if they interfere with runtime; no runtime code changes required.

### Phase 2: Node LTS Uplift (Incremental)
- Update `engines.node` to the target LTS after tests are passing.
- Upgrade only dependencies required to make tests pass on Node 20:
  - Start with tooling & low-risk libs; avoid sweeping upgrades.
- Ensure runtime boot and telnet login work on Node 20.
- Document manual telnet login verification steps.

**Checkpoint:** `npm install` + tests green on Node 20; server boots.
**Rollback:** Revert dependency changes in small PRs/commits to isolate regressions.

### Phase 3: Developer Experience (Optional, Low Risk)
- Add `.nvmrc` (or `.node-version`) for Node 20.
- Add `dev` and `smoke` scripts.
- Add ESLint only if missing and keep config minimal (avoid refactors).

**Checkpoint:** Developers can run `npm run dev` and `npm test` with clear docs.
**Rollback:** Remove DX-only additions if they cause friction; no runtime impact.

## Rollback Strategy (Overall)
- Keep changes in small PR-sized commits.
- Isolate dependency upgrades in separate commits; rollback by reverting the specific commit.
- For risky changes, add tests first and gate with CI before merging.
