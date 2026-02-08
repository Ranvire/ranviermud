# Dependency audit (pre-1.0 maintenance release)

## Scope & method

- `npm ci` completed and emitted deprecation warnings (captured below).
- `npm audit` failed with a 403 from the registry, so **no advisories could be retrieved** in this environment. Re-run `npm audit` in CI with registry access to complete the security advisory list, and treat results as advisory unless npm/lockfile are pinned.

## Dependency provenance (commands & outputs)

### Tooling versions

```
$ node -v
v22.21.1

$ npm -v
11.4.2
```

### Dependency tree lookups

```
$ npm ls sty uuid glob inflight --all
ranviermud@2.0.0 /workspace/ranviermud
├─┬ mocha@10.8.2
│ └─┬ glob@8.1.0
│   └── inflight@1.0.6
├─┬ ranvier@3.0.6 (git+ssh://git@github.com/Rantamuta/core.git#4db5507be3e2a7cc1b78e8ed672a69ceb5a5aac3)
│ ├── sty@0.6.1 deduped
│ └── uuid@3.3.2 deduped
├── sty@0.6.1
└── uuid@3.3.2

$ npm ls ranvier ranvier-datasource-file ranvier-telnet --all
ranviermud@2.0.0 /workspace/ranviermud
├── ranvier-datasource-file@1.0.3
├── ranvier-telnet@1.0.3 (git+ssh://git@github.com/Rantamuta/ranvier-telnet.git#cd25d4ea77a34dae58272827720880e2e082d360)
└── ranvier@3.0.6 (git+ssh://git@github.com/Rantamuta/core.git#4db5507be3e2a7cc1b78e8ed672a69ceb5a5aac3)
```

### Relevant `package.json` sections

```
"dependencies": {
  "commander": "^2.19.0",
  "optimist": "",
  "rando-js": "^0.2.0",
  "ranvier": "github:Rantamuta/core",
  "ranvier-datasource-file": "^1.0.3",
  "ranvier-telnet": "github:Rantamuta/ranvier-telnet",
  "semver": "^5.6.0",
  "sprintf-js": "^1.0.3",
  "sty": "",
  "uuid": "^3.3.2",
  "winston": "^2.4.4"
},
"devDependencies": {
  "git-url-parse": "^11.1.2",
  "mocha": "^10.8.2"
}
```

## Summary table

| Category | Package | Version | Direct/Transitive | Runtime/Dev | Introduced by | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Should fix if low risk | `sty` | 0.6.1 | Direct (also via `ranvier`) | Runtime | `sty` (direct) + `ranvier` | Deprecated (no longer supported) |
| Should fix if low risk | `uuid` | 3.3.2 | Direct (also via `ranvier`) | Runtime | `uuid` (direct) + `ranvier` | Deprecated (uses `Math.random()` in older versions) |
| Can defer | `glob` | 8.1.0 | Transitive | Dev-only | `mocha` | Deprecated; known vulnerabilities in old versions |
| Can defer | `inflight` | 1.0.6 | Transitive | Dev-only | `mocha` → `glob` | Deprecated; memory leak warnings |
| TBD (pending audit) | *(unknown)* | *(unknown)* | *(unknown)* | *(unknown)* | *(unknown)* | `npm audit` failed (403); advisory list missing |

## Detailed notes

### `sty@0.6.1`

- **Why it’s present**: listed in `dependencies` and also pulled in by `ranvier`.
- **Direct vs transitive**: direct dependency, plus transitive via `ranvier`.
- **Runtime vs dev**: runtime.
- **Deprecation**: package no longer supported.
- **Minimal upgrade path**: remove the direct dependency and follow `ranvier`’s supported styling/terminal-output dependency (if any), or pin a maintained replacement. If `ranvier` still depends on `sty`, upgrade `ranvier` to a release that removes or replaces it.
- **Risk of behavior change**: medium. Terminal formatting/output could change if the replacement handles styles differently.

### `uuid@3.3.2`

- **Why it’s present**: listed in `dependencies` and also pulled in by `ranvier`.
- **Direct vs transitive**: direct dependency, plus transitive via `ranvier`.
- **Runtime vs dev**: runtime.
- **Deprecation**: `uuid` v3 uses `Math.random()` in some cases; upstream recommends v7+. Whether this is “must fix” depends on usage (e.g., auth/security tokens vs game entity IDs).
- **Minimal upgrade path**: upgrade direct dependency to `uuid@^9` (or at least `^7`), and upgrade `ranvier` to a version that is compatible with newer `uuid`. If `ranvier` still depends on v3, coordinate an upgrade in `ranvier` first.
- **Risk of behavior change**: low to medium. API changes between major versions may require code adjustments (e.g., `uuid.v4()` import style).

### `glob@8.1.0`

- **Why it’s present**: transitive dependency of `mocha` (per `npm ls` output above).
- **Direct vs transitive**: transitive.
- **Runtime vs dev**: dev-only.
- **Deprecation**: old versions of `glob` are unsupported and include public vulnerabilities.
- **Minimal upgrade path**: upgrade `mocha` to a version that depends on `glob@^10` (or newer). If that is not feasible for a maintenance release, document and defer.
- **Risk of behavior change**: low. Only impacts test tooling, but newer `mocha` may change test runner behavior.

### `inflight@1.0.6`

- **Why it’s present**: transitive dependency of `glob@8.1.0` (via `mocha`), per `npm ls` output above.
- **Direct vs transitive**: transitive.
- **Runtime vs dev**: dev-only.
- **Deprecation**: not supported and leaks memory.
- **Minimal upgrade path**: upgrade `mocha` → `glob` to a version that no longer depends on `inflight`.
- **Risk of behavior change**: low. Test tooling only.

### Security advisories (`npm audit`)

- **Status**: `npm audit` failed with HTTP 403 from the registry. No advisories could be captured in this environment.
- **Action required**: re-run `npm audit` in CI (repeatable context) with registry access to populate this section and update the summary table accordingly. Treat advisories as inputs to triage unless npm/lockfile versions are pinned.

## Decision points (before any upgrades)

1. **Confirm provenance and scope** (done above)
   - Ensure all deprecations are attributed to the correct top-level dependencies and are correctly classified as runtime vs dev-only.
2. **Decide whether 1.0 allows dependency upgrades**
   - If upgrades are allowed, prioritize: runtime security > runtime deprecation > dev-only deprecation.
3. **Require smoke-suite success after each accepted change**
   - Validate behavior with existing smoke tests after each dependency bump to keep the maintenance release low-risk.
