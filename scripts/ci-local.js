#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const auditJsonPath = path.join(repoRoot, 'audit.json');
const auditTempPath = path.join(os.tmpdir(), `ranviermud-audit-${process.pid}.json`);

function runCommand(command) {
  const result = spawnSync(command.bin, command.args, {
    cwd: repoRoot,
    stdio: command.captureStdoutTo ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    env: { ...process.env },
    encoding: command.captureStdoutTo ? 'utf8' : undefined,
  });

  if (result.error) {
    console.error(result.error.message);
    return result.status || 1;
  }

  if (command.captureStdoutTo) {
    const output = typeof result.stdout === 'string' ? result.stdout : '';
    fs.writeFileSync(command.captureStdoutTo, output);
  }

  if (result.signal) {
    console.error(`Command terminated by signal ${result.signal}`);
    return 1;
  }

  if (!command.allowFailure && typeof result.status === 'number' && result.status !== 0) {
    return result.status;
  }

  return 0;
}

function runCommands(commands) {
  for (const command of commands) {
    const exitCode = runCommand(command);
    if (exitCode !== 0) {
      return exitCode;
    }
  }
  return 0;
}

function ensureCleanWorkingTree() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    env: { ...process.env },
    encoding: 'utf8',
  });

  if (result.error) {
    console.error(result.error.message);
    return result.status || 1;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    return result.status;
  }

  if (result.stdout.trim()) {
    console.error('Working tree is not clean.');
    return 1;
  }

  return 0;
}

const steps = [
  // CI: actions/checkout@v4 (SKIPPED)
  // Reason: local runs use the current working tree.
  // CI: Use Node.js 22 (SKIPPED)
  // Reason: local runs use the current Node installation.
  // CI: Report Node.js and npm versions
  {
    label: 'Report Node.js and npm versions',
    commands: [
      { bin: nodeCmd, args: ['-v'] },
      { bin: npmCmd, args: ['-v'] },
    ],
  },
  // CI: Install dependencies
  {
    label: 'Install dependencies',
    commands: [
      { bin: npmCmd, args: ['ci'] },
    ],
  },
  // CI: Capture npm audit report (JSON)
  {
    label: 'Capture npm audit report (JSON)',
    commands: [
      { bin: npmCmd, args: ['audit', '--json'], allowFailure: true, captureStdoutTo: auditJsonPath },
    ],
  },
  // CI: Upload npm audit report (SKIPPED)
  // Reason: CI-only artifact upload.
  // CI: Ensure clean working tree
  {
    label: 'Ensure clean working tree',
    run: ensureCleanWorkingTree,
  },
  // CI: Install bundles (CI)
  {
    label: 'Install bundles (CI)',
    commands: [
      { bin: npmCmd, args: ['run', 'ci:init'] },
    ],
  },
  // CI: Smoke test login
  {
    label: 'Smoke test login',
    commands: [
      { bin: npmCmd, args: ['run', 'smoke:login'] },
    ],
  },
  // CI: Run tests
  {
    label: 'Run tests',
    commands: [
      { bin: npmCmd, args: ['test'] },
    ],
  },
];

for (const step of steps) {
  console.log(`\n==> ${step.label}`);
  const exitCode = step.run ? step.run() : runCommands(step.commands);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
