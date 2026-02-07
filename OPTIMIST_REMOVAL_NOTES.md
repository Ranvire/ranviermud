# Optimist Removal Notes

- `optimist` was only required in `ranvier` and its `argv` binding was never referenced; no other file uses `optimist` or `argv` from it.
- CLI parsing is handled by `commander` in `ranvier`, which defines `port`, `verbose`, and `prettyErrors` and reads those fields directly.
- `GameServer.startup(commander)` (from `node_modules/ranvier/src/GameServer.js`) only emits the `startup` event with the `commander` object; it does not read fields itself.
- The only `startup` listener that reads CLI options is `bundles/telnet-networking/server-events/telnet-server.js`, which reads `commander.port` (provided by `commander`). No listener uses `optimist`.
