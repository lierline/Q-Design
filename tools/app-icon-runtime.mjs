import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

// Reproduced the approved v4 set byte-for-byte on 2026-10-10. Chromium 154
// changes raster pixels; sharp 0.35.4 preserves pixels but changes PNG encoding.
// Keep the renderer independent of whichever package is currently hoisted.
// A deliberate renderer upgrade must reproduce the existing set or follow the
// existing artwork/version approval contract. Never update hashes to hide drift.
export const ICON_RENDERER = Object.freeze({
  playwright: '1.62.1',
  chromiumRevision: '1234',
  chromiumVersion: '151.0.7922.34',
  sharp: '0.34.5',
  vips: '8.17.3',
  png: '1.6.50',
  webp: '1.6.0',
  'zlib-ng': '2.2.5',
});

/** Support flat installs and pnpm without accepting a stale hoisted version. */
export function resolvePinnedIconPackage(root, name, version) {
  const nodeModules = join(root, 'node_modules');
  const candidates = [join(nodeModules, name)];
  const store = join(nodeModules, '.pnpm');
  if (existsSync(store)) {
    const prefix = `${name.replace('/', '+')}@${version}`;
    for (const entry of readdirSync(store).sort()) {
      if (entry === prefix || entry.startsWith(prefix + '_')) candidates.push(join(store, entry, 'node_modules', name));
    }
  }
  const found = [];
  for (const path of candidates) {
    const file = join(path, 'package.json');
    if (!existsSync(file)) continue;
    const pkg = JSON.parse(readFileSync(file, 'utf8'));
    if (pkg.name === name && pkg.version === version) return path;
    found.push(`${pkg.name}@${pkg.version}`);
  }
  throw new Error(`App icon renderer requires ${name}@${version} in ${root}. Found: ${found.join(', ') || 'none'}. Restore the pinned package; do not update icon hashes.`);
}

export function assertIconBrowserVersion(actual) {
  if (actual !== ICON_RENDERER.chromiumVersion) {
    throw new Error(`App icons require Chromium ${ICON_RENDERER.chromiumVersion}; launched ${actual}. Clear QD_BROWSER_CHANNEL and use the pinned Playwright browser. No icon files were written.`);
  }
}

export function assertIconEncoderVersions(versions) {
  for (const key of ['sharp', 'vips', 'png', 'webp', 'zlib-ng']) {
    if (versions[key] !== ICON_RENDERER[key]) throw new Error(`App icon encoder mismatch: ${key} ${versions[key] ?? 'missing'}; expected ${ICON_RENDERER[key]}. Restore the pinned renderer; do not update icon hashes.`);
  }
}

export function assertIconVersion(recorded, version, sha, { checkOnly = false } = {}) {
  if (checkOnly && !recorded) throw new Error('Approved app icon version manifest is missing.');
  if (recorded?.version === version && recorded.sha !== sha) throw new Error(`Rendered app icon fingerprint differs from approved v${version}. No files were written. Check the source artwork and pinned renderer before considering an intentional version change.`);
  if (checkOnly && recorded.version !== version) throw new Error(`App icon version manifest is stale: recorded v${recorded.version}, renderer v${version}.`);
}

export function assertStoredIconFile(path, expected) {
  if (!existsSync(path)) throw new Error(`Generated app icon asset missing: ${path}`);
  const sha = value => createHash('sha256').update(value).digest('hex');
  if (sha(readFileSync(path)) !== sha(expected)) throw new Error(`Generated app icon asset differs from the approved renderer: ${path}`);
}

export function loadIconRuntime(root) {
  const playwrightPath = resolvePinnedIconPackage(root, 'playwright', ICON_RENDERER.playwright);
  const sharpPath = resolvePinnedIconPackage(root, 'sharp', ICON_RENDERER.sharp);
  const require = createRequire(import.meta.url);
  const playwrightRequire = createRequire(join(playwrightPath, 'package.json'));
  const core = playwrightRequire.resolve('playwright-core/package.json');
  if (JSON.parse(readFileSync(core, 'utf8')).version !== ICON_RENDERER.playwright) throw new Error('App icon Playwright driver/core versions disagree.');
  const browsers = JSON.parse(readFileSync(join(core, '..', 'browsers.json'), 'utf8')).browsers;
  const browser = browsers.find(entry => entry.name === 'chromium-headless-shell');
  if (browser?.revision !== ICON_RENDERER.chromiumRevision || browser?.browserVersion !== ICON_RENDERER.chromiumVersion) throw new Error('App icon Chromium revision differs from the approved renderer.');
  const sharp = require(sharpPath);
  assertIconEncoderVersions(sharp.versions);
  return {
    chromium: require(playwrightPath).chromium,
    sharp,
    installCommand: `node "${join(playwrightPath, 'cli.js')}" install chromium --only-shell`,
    provenance: { ...ICON_RENDERER, platform: process.platform, arch: process.arch },
  };
}
