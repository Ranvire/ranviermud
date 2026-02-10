'use strict';

const fs = require('fs');
const cp = require('child_process');
const os = require('os');
const commander = require('commander');
const parse = require('git-url-parse');

const DEFAULT_ORG = 'Rantamuta';
const GITHUB_HOST = 'github.com';

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
  const bundlePath = `bundles/${name}`;
  const bundlesIgnored = isPathIgnored('bundles/.bundle-ignore-check') || isPathIgnored(bundlePath);
  const useSubmodule = !bundlesIgnored;

  if (fs.existsSync(`${gitRoot}/${bundlePath}`)) {
    console.error('Bundle already installed');
    process.exit(0);
  }

  try {
    cp.execSync(`git ls-remote ${remote}`);
  } catch (err) {
    process.exit(0);
  }

  if (useSubmodule) {
    console.log("Adding bundle...");
    cp.execSync(`git submodule add -f ${remote} ${bundlePath}`);
  } else {
    console.log("Cloning bundle (ignored by git)...");
    if (!fs.existsSync(`${gitRoot}/bundles`)) {
      fs.mkdirSync(`${gitRoot}/bundles`, { recursive: true });
    }
    cp.execSync(`git clone ${remote} ${bundlePath}`);
  }

  console.log("Installing deps...")
  if (fs.existsSync(`${gitRoot}/${bundlePath}/package.json`)) {
    const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';
    cp.spawnSync(npmCmd, ['install', '--no-audit'], {
      cwd: `${gitRoot}/${bundlePath}`
    });
  }

  if (useSubmodule) {
    console.log(`Bundle installed. Commit the bundle with: git commit -m \"Added ${name} bundle\"`);
  } else {
    console.log(`Bundle installed locally at ${bundlePath}. No git changes were made.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getBundleName,
  resolveBundleRemote,
};
