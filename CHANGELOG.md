# Changelog

All entries follow `docs/CHANGELOG_POLICY.md`.

## Unreleased

### Bundle load order from config

- Summary:
  - The wrapper now passes the configured `bundles` array to the core bundle loader to enable explicit load ordering.
- Why:
  - Filesystem enumeration order is not guaranteed across platforms. Using config order makes override precedence deterministic and intentional.
- Impact:
  - With a core version that honors the optional `bundles` order argument, override precedence will follow config order.
  - With core v1.0 (no support), behavior remains unchanged (filesystem directory order).
- Migration/Action:
  - Explicitly order `bundles` in `ranvier.json` or `ranvier.conf.js` to reflect desired precedence.
- References:
  - PR: #26 Bundle load order from config
- Timestamp: 2026.02.10 17:38

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
