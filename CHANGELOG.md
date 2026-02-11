# Changelog

All entries follow `docs/CHANGELOG_POLICY.md`.

## Unreleased

### Bundle defaults

- Summary:
  - Restored `bundle-example-areas` and `simple-crafting` to the default bundle set.
  - `init` now ensures missing `quests.yml` files exist for installed bundle areas.
- Why:
  - Default bundles should boot cleanly while preserving the engine's strict quest loader.
  - The missing `quests.yml` files were causing load failures in example content.
- Impact:
  - Fresh installs include both bundles again.
  - `npm run init` now creates empty quest files where they are missing.
- Migration/Action:
  - None. Rerun `npm run init` if you want the missing quest files created.
- References:
  - None.
- Timestamp: 2026.02.11 17:29

### Package identity

- Summary:
  - Documented the decision to change this package name to `rantamuta-ranviermud` from `ranviermud`.
- Why:
  - The fork should be clearly distinguished from upstream RanvierMUD.
  - This package is not consumed as a dependency, so renaming would not provide compatibility benefits.
- Impact:
  - No runtime behavior change.
  - Only affects package metadata for tooling or future publishing decisions.
- Migration/Action:
  - None.
- References:
  - None.
- Timestamp: 2026.02.11 16:26

### Explicit startup failure handling

- Summary:
  - Added an explicit top-level catch around server initialization to handle startup failures from the core engine.
- Why:
  - Core bundle and area load failures now surface as thrown errors rather than terminating the process internally.
  - The wrapper is responsible for deciding how to log and exit on startup failure.
- Impact:
  - Startup failures now reliably result in a non-zero process exit and a visible stack trace.
  - Server startup still fails fast on invalid bundles or hydration errors.
- Migration/Action:
  - None.
  - Existing deployments will see clearer failure signaling and correct exit codes on startup errors.
- References:
  - PR: #15 Add explicit init error handling for core startup failures
- Timestamp: 2026.02.10 16:25
