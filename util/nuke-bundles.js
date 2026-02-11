#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const force = args.includes('--force');
const showHelp = args.includes('--help');

function printHelp() {
  console.log('Usage: node util/nuke-bundles.js [--force]');
  console.log('Empties ./bundles (leaves .gitkeep) and resets bundles to an empty array in ranvier.json and/or ranvier.conf.js.');
  console.log('--force  skip confirmation prompt');
}

function confirm() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('This will delete *everything* in ./bundles and set config bundles to empty []. Continue? (y/N) ', (answer) => {
      rl.close();
      const normalized = String(answer || '').trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

async function main() {
  if (showHelp) {
    printHelp();
    return;
  }

  if (!force) {
    const ok = await confirm();
    if (!ok) {
      console.log('[info] bundles:nuke canceled');
      process.exit(1);
      return;
    }
  }

  const root = process.cwd();
  const bundlesDir = path.join(root, 'bundles');
  const keepPath = path.join(bundlesDir, '.gitkeep');
  const jsonPath = path.join(root, 'ranvier.json');
  const confPath = path.join(root, 'ranvier.conf.js');
  const targets = [];

  if (fs.existsSync(jsonPath)) {
    targets.push({ type: 'json', path: jsonPath });
  }
  if (fs.existsSync(confPath)) {
    targets.push({ type: 'conf', path: confPath });
  }

  if (!targets.length) {
    console.error('[error] ranvier.json or ranvier.conf.js not found; nothing was changed.');
    process.exit(1);
    return;
  }

  fs.rmSync(bundlesDir, { recursive: true, force: true });
  fs.mkdirSync(bundlesDir, { recursive: true });
  fs.writeFileSync(keepPath, '');

  let hadError = false;

  for (const target of targets) {
    try {
      let data = null;
      if (target.type === 'json') {
        data = JSON.parse(fs.readFileSync(target.path, 'utf8'));
      } else {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        delete require.cache[require.resolve(target.path)];
        data = require(target.path);
      }

      if (!data || typeof data !== 'object') {
        throw new Error(`Config did not export an object: ${path.basename(target.path)}`);
      }

      data.bundles = [];

      if (target.type === 'json') {
        fs.writeFileSync(target.path, `${JSON.stringify(data, null, 2)}\n`);
      } else {
        fs.writeFileSync(target.path, `module.exports = ${JSON.stringify(data, null, 2)};\n`);
      }
    } catch (error) {
      hadError = true;
      console.error(`[error] failed to update ${path.basename(target.path)}: ${error.message}`);
    }
  }

  if (hadError) {
    process.exit(1);
    return;
  }

  console.log('[info] bundles:nuke complete');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
