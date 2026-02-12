#!/usr/bin/env node
// @ts-check
'use strict';

// CI-focused bundle installer: non-interactive and does not modify configuration.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const bundlesDir = path.join(repoRoot, 'bundles');
const configPath = path.join(repoRoot, 'ranvier.json');
const defaultOrg = 'Rantamuta';

function isDirEmpty(dirPath) {
  const entries = fs.readdirSync(dirPath);
  return entries.length === 0;
}

function ensureBundlesDir() {
  if (!fs.existsSync(bundlesDir)) {
    fs.mkdirSync(bundlesDir, { recursive: true });
  }
}

function readBundles() {
  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);
    if (Array.isArray(config.bundles)) {
      return config.bundles;
    }
  } catch (err) {
    console.warn(`Failed to read bundles from ${configPath}: ${err.message}`);
  }

  return [];
}

function installBundle(bundleName) {
  const bundlePath = path.join(bundlesDir, bundleName);
  if (fs.existsSync(bundlePath)) {
    if (!isDirEmpty(bundlePath)) {
      console.log(`Bundle "${bundleName}" already present, skipping.`);
      return;
    }
    fs.rmdirSync(bundlePath);
  }

  const repoUrl = `https://github.com/${defaultOrg}/${bundleName}.git`;
  console.log(`Cloning ${repoUrl}...`);
  const result = spawnSync('git', ['clone', '--depth', '1', repoUrl, bundlePath], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.warn(`Git clone failed for ${bundleName}, attempting tarball download...`);
    downloadTarball(bundleName, bundlePath);
  }
}

function downloadTarball(bundleName, bundlePath) {
  const branches = ['master', 'main'];
  const archiveBase = `https://github.com/${defaultOrg}/${bundleName}/archive/refs/heads`;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `${bundleName}-`));
  let downloaded = false;
  let tarballPath = '';

  for (const branch of branches) {
    tarballPath = path.join(tmpDir, `${bundleName}-${branch}.tar.gz`);
    const url = `${archiveBase}/${branch}.tar.gz`;
    const curl = spawnSync('curl', ['-L', '-f', '-o', tarballPath, url], {
      stdio: 'inherit',
    });
    if (curl.status === 0) {
      downloaded = true;
      break;
    }
  }

  if (!downloaded) {
    throw new Error(`Failed to download tarball for ${bundleName}`);
  }

  const extract = spawnSync('tar', ['-xzf', tarballPath, '-C', tmpDir], {
    stdio: 'inherit',
  });
  if (extract.status !== 0) {
    throw new Error(`Failed to extract tarball for ${bundleName}`);
  }

  const entries = fs.readdirSync(tmpDir).filter((entry) => entry.startsWith(`${bundleName}-`));
  if (entries.length === 0) {
    throw new Error(`Unable to find extracted bundle for ${bundleName}`);
  }

  const extractedPath = path.join(tmpDir, entries[0]);
  fs.renameSync(extractedPath, bundlePath);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function main() {
  ensureBundlesDir();
  const bundles = readBundles();
  const impliedBundles = {
    'bundle-example-classes': ['bundle-example-combat'],
  };
  const expandedBundles = new Set(bundles);
  for (const bundleName of bundles) {
    const extras = impliedBundles[bundleName] || [];
    for (const extra of extras) {
      expandedBundles.add(extra);
    }
  }

  if (expandedBundles.size === 0) {
    console.log('No bundles configured; skipping install.');
    return;
  }

  for (const bundleName of expandedBundles) {
    installBundle(bundleName);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
