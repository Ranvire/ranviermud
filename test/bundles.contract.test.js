// @ts-check
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');

function runValidation(args) {
  return spawnSync(process.execPath, ['util/validate-bundles.js', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

test('bundle validation in engine mode returns parseable findings without errors', () => {
  const result = runValidation(['--engine', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const findings = JSON.parse(result.stdout);
  assert.ok(Array.isArray(findings), 'Expected findings to be a JSON array');

  const errors = findings.filter((finding) => finding.level === 'error');
  assert.equal(errors.length, 0, `Expected no error findings, got ${errors.length}`);
});

test('player validation mode completes and returns parseable findings', () => {
  const result = runValidation(['--engine', '--players', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const findings = JSON.parse(result.stdout);
  assert.ok(Array.isArray(findings), 'Expected findings to be a JSON array');
});
