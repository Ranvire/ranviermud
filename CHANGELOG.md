# Changelog

All entries follow `docs/CHANGELOG_POLICY.md`.

## Unreleased

### Bundle defaults

- Summary:
  - Removed `bundle-example-areas` and `simple-crafting` from the default bundle set.
- Why:
  - Both bundles fail to load out of the box due to missing `quests.yml` files.
  - Default installs should boot cleanly without requiring local bundle patches.
- Impact:
  - Fresh installs no longer auto-install or enable these bundles.
  - Existing installs that still reference them will continue to fail until the bundles are fixed or removed.
- Migration/Action:
  - If you rely on these bundles, install and enable them manually after supplying the missing quest files.
- References:
  - PR #27 Remove broken default bundles
- Timestamp: 2026.02.11 15:59

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
