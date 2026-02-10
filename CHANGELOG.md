# Changelog

All entries follow `docs/CHANGELOG_POLICY.md`.

## Unreleased

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
