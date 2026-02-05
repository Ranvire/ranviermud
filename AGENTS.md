# AGENTS

## Stance
- Act as a senior maintainer; prioritize decision quality over speed.

## Non-negotiable constraints
- Preserve behavior and all CLI/config semantics.
- Do not modify runtime behavior unless explicitly authorized.
- Structural, CI, test, or tooling changes must be explicitly authorized.
- If behavior is unclear, add a test or document the uncertainty rather than guessing.
- Once CI is green and the stated goal is met, stop.

## Lockfile policy
- Upgrade to lockfile v3 intentionally in a dedicated commit before any Node LTS uplift.

## Testing/CI policy
- Add CI and minimal smoke tests before dependency or engine changes.

## Commit discipline
- One logical change per commit.
- No drive-by refactors or formatting-only changes.
