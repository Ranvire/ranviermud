'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');

function runScenario(args) {
  return spawnSync(process.execPath, ['util/scenario-runner.js', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

test('scenario runner help exits successfully', () => {
  const result = runScenario(['--help']);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--commands-file/);
  assert.match(result.stdout, /--command-line/);
});

test('scenario runner executes command lines in order and fails fast on first unknown command', () => {
  const result = runScenario(['--command-line', 'unknown-first', '--command-line', 'unknown-second']);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[info\] scenario starting \(commands=2\)/);
  assert.match(result.stderr, /\[error\] command 1\/2 not found: unknown-first/);
  assert.doesNotMatch(result.stderr, /unknown-second/);
});

test('scenario runner command file ignores comments and blank lines', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ranvier-scenario-'));
  const commandsPath = path.join(tmpDir, 'scenario.commands');

  fs.writeFileSync(commandsPath, '# comment\n\nunknown-alpha\n\n# another\nunknown-beta\n', 'utf8');

  const result = runScenario(['--commands-file', commandsPath]);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[info\] scenario starting \(commands=2\)/);
  assert.match(result.stderr, /\[error\] command 1\/2 not found: unknown-alpha/);
  assert.doesNotMatch(result.stderr, /unknown-beta/);
});

test('scenario runner reports error for missing --commands-file value', () => {
  const result = runScenario(['--commands-file']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value for --commands-file/);
});

test('scenario runner reports error for missing --command-line value', () => {
  const result = runScenario(['--command-line']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value for --command-line/);
});

test('scenario runner legacy --command/--args fallback builds one command line', () => {
  const result = runScenario(['--command', 'legacy-unknown', '--args', 'abc def']);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /\[info\] scenario starting \(commands=1\)/);
  assert.match(result.stderr, /\[error\] command 1\/1 not found: legacy-unknown/);
});
