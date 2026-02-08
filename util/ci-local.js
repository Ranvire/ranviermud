#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const steps = [
  { label: 'npm ci', args: ['ci'] },
  { label: 'npm run ci:init', args: ['run', 'ci:init'] },
  { label: 'npm test', args: ['test'] },
  { label: 'npm run smoke:login', args: ['run', 'smoke:login'] },
  { label: 'npm pack', args: ['pack'] },
];

function runStep(step) {
  console.log(`\n==> ${step.label}`);
  const result = spawnSync(npmCmd, step.args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env },
  });

  if (result.error) {
    console.error(result.error.message);
    return result.status || 1;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    return result.status;
  }

  if (result.signal) {
    console.error(`Command terminated by signal ${result.signal}`);
    return 1;
  }

  return 0;
}

for (const step of steps) {
  const exitCode = runStep(step);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
