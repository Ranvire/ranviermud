'use strict';

const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const commander = require('commander');
const parse = require('git-url-parse');

const DEFAULT_ORG = 'Ranvier';
const GITHUB_HOST = 'github.com';

const gitRoot = cp.execSync('git rev-parse --show-toplevel').toString('utf8').trim();
process.chdir(gitRoot);

function resolveBundleRemote(remote) {
  if (!remote) {
    return remote;
  }

  if (/^(https?|git|ssh):\/\//i.test(remote) || remote.startsWith('git@')) {
    return remote;
  }

  const repoPath = remote.includes('/') ? remote : `${DEFAULT_ORG}/${remote}`;
  return `https://${GITHUB_HOST}/${repoPath}`;
}

function getBundleName(remote) {
  return parse(remote).name;
}

function main() {
  commander.command('install-bundle <remote url>');
  commander.parse(process.argv);

  if (commander.args.length < 1) {
    console.error(`Syntax: ${process.argv0} <remote url>`);
    process.exit(0);
  }

  const [remoteArg] = commander.args;
  const remote = resolveBundleRemote(remoteArg);
  const name = getBundleName(remote);

  if (fs.existsSync(`${gitRoot}/bundles/${name}`)) {
    console.error('Bundle already installed');
    process.exit(0);
  }

  try {
    cp.execSync(`git ls-remote ${remote}`);
  } catch (err) {
    process.exit(0);
  }

  console.log("Adding bundle...");
  cp.execSync(`git submodule add ${remote} bundles/${name}`);

  console.log("Installing deps...")
  if (fs.existsSync(`${gitRoot}/bundles/${name}/package.json`)) {
    const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';
    cp.spawnSync(npmCmd, ['install', '--no-audit'], {
      cwd: `${gitRoot}/bundles/${name}`
    });
  }

  console.log(`Bundle installed. Commit the bundle with: git commit -m \"Added ${name} bundle\"`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getBundleName,
  resolveBundleRemote,
};
