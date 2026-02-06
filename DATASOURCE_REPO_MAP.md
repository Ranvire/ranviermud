# Ranvier datasource mapping: `ranvier-datasource-file`

## npm package
- **Name:** `ranvier-datasource-file`
- **Summary:** File-backed datasource implementations used by Ranvier to load JSON/YAML entities (e.g., account/player JSON via directory lookups).

## Upstream (canonical) repository
- **GitHub:** https://github.com/RanvierMUD/datasource-file
- **Owner/org:** `RanvierMUD`
- **Layout:** Standalone repository (not a monorepo).
- **What it contains:** The JSON/YAML `DataSource` implementations for file-backed storage (`JsonDataSource`, `JsonDirectoryDataSource`, `YamlDataSource`, etc.), exported as the `ranvier-datasource-file` npm package.

## How Ranvier consumes it
- **Configured in `ranvier.json`:** The core runtime expects file-based account/player storage via `JsonDirectoryDataSource` with `data/account` and `data/player` paths in the entity loader config. This ties the loader registry to datasource implementations from the package. 
- **Account loading path:** `AccountManager.loadAccount` uses the configured `EntityLoader` to fetch account data by username (which ultimately hits the datasource). 
- **Player loading path:** `PlayerManager.loadPlayer` uses the configured `EntityLoader` to fetch player data by username, then hydrates a `Player`. 
- **JSON read mechanism:** `JsonDataSource.fetchAll` uses `require()` to load JSON by path (with the module cache cleared). It does **not** use `fs.readFileSync` for JSON, so missing files surface as a `require()` error. 

## “Missing JSON logged as error” behavior
- **Where it lives:** `node_modules/ranvier-datasource-file/JsonDataSource.js` → `fetchAll` clears the module cache and calls `require(filepath)`. If the JSON file is missing or invalid, Node throws (typically “Cannot find module …”), which is the error bubbled up to callers. This is the core of the missing JSON error path. 

## Ranvire fork mapping
- **Fork under Ranvire:** https://github.com/Ranvire/datasource-file
- **Relationship:** This is a fork of `RanvierMUD/datasource-file` (the GitHub API metadata lists `RanvierMUD/datasource-file` as the parent/source).
