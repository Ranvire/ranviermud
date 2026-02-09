# Changelog Policy (Maintenance Releases)

This repository is a maintenance and stewardship fork of RanvierMUD. The changelog exists to document:

- user-visible changes,
- dependency and security actions,
- runtime/CI changes, and
- deliberate drifts or modernizations relative to the original RanvierMUD behavior or dependencies.

The policy below is intentionally lightweight. It should be followed by maintainers, downstream game repo owners, bundle authors, and automated agents working on the core engine.

## Canonical locations

- **Policy:** `docs/CHANGELOG_POLICY.md` (this document).
- **Entries:** `CHANGELOG.md` at the repo root.

## When to add an entry

Add or update a changelog entry when a change is:

- user-visible (behavior changes, error handling, logging, diagnostics),
- dependency or security related (upgrades, removals, vulnerability responses),
- runtime/CI related (Node version support, build tooling, CI matrices),
- compatibility-impacting (even if intended to be backward compatible),
- a deliberate drift or modernization from RanvierMUD behavior or dependencies.

## Required entry fields (per release or grouped change set)

Each changelog entry must include:

- **Summary:** short description of what changed.
- **Why:** motivation or rationale (especially for drifts/modernizations).
- **Impact:** who is affected and how (compatibility or operational impact).
- **Migration/Action:** required steps for downstream users, or “None.”
- **References:** relevant issues/PRs or commit identifiers if applicable.
- **Timestamp:** the *current* date and time in the format YYYY.MM.DD hh:mm

## Drift/modernization documentation

When documenting drift from RanvierMUD, be explicit about:

- the original RanvierMUD behavior or dependency,
- the current behavior or replacement,
- why the change was made,
- any operational or compatibility implications.

## Format (recommended)

Use a simple, consistent structure in `CHANGELOG.md`:

```
## Unreleased

### Drift / Modernization
- Summary:
  - ...
- Why:
  - ...
- Impact:
  - ...
- Migration/Action:
  - ...
- References:
  - ...
```

If a category has no changes, omit it. Keep entries short and scannable.
