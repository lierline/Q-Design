import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_RENDERER, resolvePinnedIconPackage, assertIconBrowserVersion, assertIconEncoderVersions, assertIconVersion, assertStoredIconFile, loadIconRuntime } from './app-icon-runtime.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function fixture(fn) {
  const parent = resolve(root, '../tmp');
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(join(parent, 'qd-icon-runtime-test-'));
  const real = realpathSync(dir), child = relative(realpathSync(parent), real);
  assert.ok(child.startsWith('qd-icon-runtime-test-') && !child.includes(sep));
  try { return fn(dir); }
  finally {
    assert.equal(realpathSync(dir), real);
    rmSync(real, { recursive: true, force: true });
  }
}
const packageAt = (dir, name, version) => {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version }));
  return dir;
};

test('a stale hoisted driver cannot replace the confirmed renderer in the pnpm store', () => fixture(dir => {
  packageAt(join(dir, 'node_modules/playwright'), 'playwright', '1.60.0');
  const pinned = packageAt(join(dir, 'node_modules/.pnpm/playwright@1.62.1/node_modules/playwright'), 'playwright', '1.62.1');
  assert.equal(resolvePinnedIconPackage(dir, 'playwright', ICON_RENDERER.playwright), pinned);
  assert.throws(() => resolvePinnedIconPackage(dir, 'playwright', '9.0.0'), /requires playwright@9\.0\.0.*playwright@1\.60\.0/);
}));

test('matching flat installs work and package identity is verified instead of trusting directory names', () => fixture(dir => {
  const flat = packageAt(join(dir, 'node_modules/sharp'), 'sharp', ICON_RENDERER.sharp);
  assert.equal(resolvePinnedIconPackage(dir, 'sharp', ICON_RENDERER.sharp), flat);
  packageAt(flat, 'different-package', ICON_RENDERER.sharp);
  assert.throws(() => resolvePinnedIconPackage(dir, 'sharp', ICON_RENDERER.sharp), /requires sharp@0\.34\.5/);
}));

test('a different browser or PNG encoder fails before output can be accepted', () => {
  assert.doesNotThrow(() => assertIconBrowserVersion(ICON_RENDERER.chromiumVersion));
  assert.throws(() => assertIconBrowserVersion('154.0.4258.62'), /Clear QD_BROWSER_CHANNEL/);
  assert.doesNotThrow(() => assertIconEncoderVersions(ICON_RENDERER));
  for (const key of ['sharp', 'vips', 'png', 'webp', 'zlib-ng']) {
    assert.throws(() => assertIconEncoderVersions({ ...ICON_RENDERER, [key]: 'changed' }), new RegExp(`encoder mismatch: ${key}`));
  }
});

test('same-version altered pixels or bytes cannot be blessed by a version-only or missing manifest', () => {
  const record = { version: '4', sha: 'approved-digest' };
  assert.doesNotThrow(() => assertIconVersion(record, '4', 'approved-digest', { checkOnly: true }));
  assert.throws(() => assertIconVersion(record, '4', 'different-digest'), /differs from approved v4/);
  assert.throws(() => assertIconVersion(null, '4', 'approved-digest', { checkOnly: true }), /manifest is missing/);
  assert.throws(() => assertIconVersion(record, '5', 'approved-digest', { checkOnly: true }), /manifest is stale/);
});

test('release check rejects a missing or changed generated file even if product copies still match', () => fixture(dir => {
  const file = join(dir, 'icon.png'), original = Buffer.from('approved-encoded-file');
  assert.throws(() => assertStoredIconFile(file, original), /asset missing/);
  writeFileSync(file, original);
  assert.doesNotThrow(() => assertStoredIconFile(file, original));
  const changed = Buffer.from(original); changed[0] ^= 1;
  writeFileSync(file, changed);
  assert.throws(() => assertStoredIconFile(file, original), /differs from the approved renderer/);
}));

test('the actual runtime resolves the approved Chromium metadata and native image encoders', () => {
  const runtime = loadIconRuntime(root);
  assert.equal(runtime.provenance.chromiumRevision, '1234');
  assert.equal(runtime.provenance.playwright, '1.62.1');
  assert.equal(runtime.sharp.versions.sharp, '0.34.5');
  assert.match(runtime.installCommand, /playwright.*cli\.js.*install chromium --only-shell/);
});
