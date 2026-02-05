'use strict';

const assert = require('assert');

const {
  getBundleName,
  resolveBundleRemote,
} = require('../util/install-bundle');

describe('install-bundle helpers', function() {
  it('resolves bare bundle names to the Ranvire org', function() {
    const resolved = resolveBundleRemote('bundle-example-areas');
    assert.strictEqual(
      resolved,
      'https://github.com/Ranvire/bundle-example-areas'
    );
  });

  it('resolves org/repo shorthand to the GitHub URL', function() {
    const resolved = resolveBundleRemote('Ranvire/bundle-example-areas');
    assert.strictEqual(
      resolved,
      'https://github.com/Ranvire/bundle-example-areas'
    );
  });

  it('keeps explicit remotes untouched', function() {
    const httpsRemote = 'https://github.com/Ranvire/bundle-example-areas';
    assert.strictEqual(resolveBundleRemote(httpsRemote), httpsRemote);

    const sshRemote = 'git@github.com:Ranvire/bundle-example-areas.git';
    assert.strictEqual(resolveBundleRemote(sshRemote), sshRemote);
  });

  it('extracts the bundle name from a resolved remote', function() {
    const name = getBundleName('https://github.com/Ranvire/bundle-example-areas');
    assert.strictEqual(name, 'bundle-example-areas');
  });
});
