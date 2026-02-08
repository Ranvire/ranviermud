#!/usr/bin/env node
'use strict';

const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const readline = require('readline');

const argv = process.argv.slice(2);
const assumeYes = argv.includes('--yes') || argv.includes('-y');
const allowDirty = argv.includes('--force') || argv.includes('--allow-dirty');

const gitRoot = cp.execSync('git rev-parse --show-toplevel').toString('utf8').trim();
process.chdir(gitRoot);

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
  const enabledBundles = [];

  if (!allowDirty) {
    const modified = cp.execSync('git status -uno --porcelain').toString();
    if (modified) {
      console.warn('You have uncommitted changes. For safety setup-bundles must be run on a clean repository.');
      console.warn('Use --force to bypass this check if you know what you are doing.');
      process.exit(1);
    }
  }

  // add each bundle as a submodule
  for (const bundle of defaultBundles) {
    const bundlePath = `bundles/${bundle}`;
    cp.execSync(`npm run install-bundle ${bundle}`);
  }
  console.info('Done.');

  console.info('Enabling bundles...');
  const ranvierJsonPath = __dirname + '/../ranvier.json';
  const ranvierJson = require(ranvierJsonPath);
  ranvierJson.bundles = defaultBundles.map(bundle => bundle.replace(/^.+\/([a-z\-]+)$/, '$1'));
  fs.writeFileSync(ranvierJsonPath, JSON.stringify(ranvierJson, null, 2));
  console.info('Done.');

  cp.execSync('git add ranvier.json');

  console.info(`
-------------------------------------------------------------------------------
Example bundles have been installed as submodules. It's recommended that you now
run the following commands:

  git commit -m "Install bundles"

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
