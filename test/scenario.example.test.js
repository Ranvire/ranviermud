'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');

test('scenario runner help exits successfully', () => {
  const result = spawnSync(process.execPath, ['util/scenario-runner.js', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--commands-file/);
  assert.match(result.stdout, /--command-line/);
});
