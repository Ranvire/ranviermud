#!/usr/bin/env node
'use strict';

const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const argv = process.argv.slice(2);
const assumeYes = argv.includes('--yes') || argv.includes('-y');
const allowDirty = argv.includes('--force') || argv.includes('--allow-dirty');

const gitRoot = cp.execSync('git rev-parse --show-toplevel').toString('utf8').trim();
process.chdir(gitRoot);

function isPathIgnored(targetPath) {
  const result = cp.spawnSync('git', ['check-ignore', '-q', targetPath], { stdio: 'ignore' });
  if (result.status === 0) {
    return true;
  }
  if (result.status === 1) {
    return false;
  }
  return false;
}

async function prompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve, reject) => {
    rl.question('Do you want to install the example bundles? [Y/n] ', resolve);
  });
}

async function main() {

  if (!assumeYes) {
    try {
      let answer = await prompt();

      if (answer === 'n') {
        throw 'foo';
      }
    } catch (err) {
      console.log('Done.');
      process.exit(0);
    }
  }

  const defaultBundles = [
    'https://github.com/Rantamuta/bundle-example-areas',
    'https://github.com/Rantamuta/bundle-example-channels',
    'https://github.com/Rantamuta/bundle-example-classes',
    'https://github.com/Rantamuta/bundle-example-combat',
    'https://github.com/Rantamuta/bundle-example-commands',
    'https://github.com/Rantamuta/bundle-example-debug',
    'https://github.com/Rantamuta/bundle-example-effects',
    'https://github.com/Rantamuta/bundle-example-input-events',
    'https://github.com/Rantamuta/bundle-example-lib',
    'https://github.com/Rantamuta/bundle-example-npc-behaviors',
    'https://github.com/Rantamuta/bundle-example-player-events',
    'https://github.com/Rantamuta/bundle-example-quests',
    'https://github.com/Rantamuta/simple-crafting',
    'https://github.com/Rantamuta/vendor-npcs',
    'https://github.com/Rantamuta/player-groups',
    'https://github.com/Rantamuta/progressive-respawn',
    'https://github.com/Rantamuta/telnet-networking',
    'https://github.com/Rantamuta/websocket-networking',
  ];
  const bundleNames = defaultBundles.map(bundle => bundle.replace(/^.+\/([a-z\-]+)$/, '$1'));
  const enabledBundles = [];

  if (!allowDirty) {
    const modified = cp.execSync('git status -uno --porcelain').toString();
    if (modified) {
      console.warn('You have uncommitted changes. For safety setup-bundles must be run on a clean repository.');
      console.warn('Use --force to bypass this check if you know what you are doing.');
      process.exit(1);
    }
  }

  // install each bundle
  for (const bundle of defaultBundles) {
    const bundlePath = `bundles/${bundle}`;
    cp.execSync(`npm run install-bundle ${bundle}`);
  }
  console.info('Done.');

  console.info('Ensuring area quests files...');
  const createdQuestFiles = [];
  for (const bundle of bundleNames) {
    const areasPath = path.join(gitRoot, 'bundles', bundle, 'areas');
    if (!fs.existsSync(areasPath) || !fs.statSync(areasPath).isDirectory()) {
      continue;
    }
    const areaDirs = fs.readdirSync(areasPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory());
    for (const areaDir of areaDirs) {
      const questPath = path.join(areasPath, areaDir.name, 'quests.yml');
      if (fs.existsSync(questPath)) {
        continue;
      }
      fs.writeFileSync(questPath, '[]\n');
      createdQuestFiles.push(path.join('bundles', bundle, 'areas', areaDir.name, 'quests.yml'));
    }
  }
  if (createdQuestFiles.length) {
    console.info(`Added ${createdQuestFiles.length} missing quests.yml file(s).`);
  }
  console.info('Done.');

  console.info('Enabling bundles...');
  const ranvierJsonPath = __dirname + '/../ranvier.json';
  const ranvierJson = require(ranvierJsonPath);
  ranvierJson.bundles = bundleNames;
  fs.writeFileSync(ranvierJsonPath, JSON.stringify(ranvierJson, null, 2));
  console.info('Done.');

  cp.execSync('git add ranvier.json');

  const bundlesIgnored = isPathIgnored('bundles/.bundle-ignore-check');
  const bundleMode = bundlesIgnored ? 'locally under bundles/ (ignored by git)' : 'as submodules';
  const commitHint = bundlesIgnored
    ? '  git commit -m "Enable example bundles"'
    : '  git commit -m "Install bundles"';

  console.info(`
-------------------------------------------------------------------------------
Example bundles have been installed ${bundleMode}. It's recommended that you now
run the following command to save the ranvier.json update:

${commitHint}

You're all set! See https://ranviermud.com for guides and API references
`);

  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
