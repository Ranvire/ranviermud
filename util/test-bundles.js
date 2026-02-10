#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function loadConfig(root) {
  const confPath = path.join(root, 'ranvier.conf.js');
  const jsonPath = path.join(root, 'ranvier.json');

  if (fs.existsSync(confPath)) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(confPath);
  }

  if (fs.existsSync(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  throw new Error('No ranvier.json or ranvier.conf.js found');
}

function main() {
  const root = process.cwd();
  const config = loadConfig(root);
  const bundles = Array.isArray(config.bundles) ? config.bundles : [];
  let failed = false;

  for (const bundle of bundles) {
    const bundlePath = path.join(root, 'bundles', bundle);
    const packagePath = path.join(bundlePath, 'package.json');

    if (!fs.existsSync(packagePath)) {
      console.log(`[skip] ${bundle}: no package.json`);
      continue;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!pkg.scripts || !pkg.scripts.test) {
      console.log(`[skip] ${bundle}: no test script`);
      continue;
    }

    console.log(`[run] ${bundle}: npm test`);
    const result = spawnSync('npm', ['test'], {
      cwd: bundlePath,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    if (result.status !== 0) {
      failed = true;
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
