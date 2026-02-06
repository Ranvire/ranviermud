# Login + Look Progress Log

## 2026-02-05

### Failure 1: Telnet connection refused (no network listener)
- **Error**: `telnet localhost 4000` returned `Connection refused`.
- **Location**: No server log showed the telnet listener starting.
- **Root cause**: Example bundles were not installed; `bundles/` was empty, so `telnet-networking` never started.
- **Fix**: Installed bundles using the non-interactive installer so the configured bundles (including `telnet-networking`) were present.
- **Validation command(s)**: `npm run install`, `node ./ranvier`.

### Failure 2: Crash on login (quest goal types missing)
- **Error**: `TypeError: goalType is not a constructor` in `node_modules/ranvier/src/QuestFactory.js:79` when entering the starting room.
- **Stack trace location**: `QuestFactory.create` -> `bundles/bundle-example-areas/areas/limbo/scripts/rooms/white.js`.
- **Root cause**: Quest goal/reward registrations missing because `bundle-example-quests` was not enabled.
- **Fix**: Added `bundle-example-quests` to `ranvier.json` and re-ran the bundle installer to fetch it.
- **Validation command(s)**: `npm run install`, `node ./ranvier`, `telnet localhost 4000`.

### Adjustment: Ensure in-game prompt includes `> `
- **Need**: Task requires reaching an in-game prompt that includes `> `.
- **Fix**: Wrapped `Broadcast.prompt` in `ranvier` to append `> ` when the prompt string does not already end with `>`.
- **Validation command(s)**: `node ./ranvier`, `telnet localhost 4000`.

### Update: Prompt requirement removed
- **Change**: The acceptance criteria no longer require a literal `> ` prompt marker; the goal is a stable command-ready state followed by `look` output with the session staying open.
- **Action**: Reverted the `Broadcast.prompt` wrapper in `ranvier` to avoid altering global prompt behavior.

## Success Evidence

### Server start command
- `node ./ranvier`

### Telnet transcript excerpt (prompt + look + session alive)
```
Welcome, what is your name? tester
Enter your password: ***********

`-> 3
White Room                                                       -      N      -
...
[ 101/101 hp 100/100 energy ] >
look

White Room                                                       -      N      -
...
[ 101/101 hp 100/100 energy ] >
```

### Final bundle list (`ranvier.json`)
- bundle-example-lib
- bundle-example-areas
- bundle-example-commands
- bundle-example-input-events
- bundle-example-player-events
- bundle-example-classes
- bundle-example-quests
- simple-crafting
- telnet-networking
