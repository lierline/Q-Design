import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { referencesPublicAsset, publicAssetConsumerFiles } from './sync-html-consumers.mjs';

const root = join(tmpdir(), 'q-design-html-consumer-fixture');
const asset = join(root, 'public/offline.html');
const check = (code, path = 'public/sw.js') => referencesPublicAsset(code, join(root, path), asset, root);

test('service-worker precache and fallback URLs consume the public HTML copy', () => {
  assert.equal(check("const OFFLINE_ASSETS = ['/offline.html', '/icon.png']; cache.addAll(OFFLINE_ASSETS);"), true);
  assert.equal(check("return caches.match('/offline.html');"), true);
  assert.equal(check('return caches.match(`./offline.html?v=2#retry`);'), true);
  assert.equal(check(String.raw`return caches.match('/off\u006cine.html');`), true);
});

test('importScripts consumes a generated public JavaScript revision copy', () => {
  const revision = join(root, 'public/q-design.offline-revision.js');
  assert.equal(referencesPublicAsset("importScripts('/q-design.offline-revision.js');", join(root, 'public/sw.js'), revision, root), true);
  assert.equal(referencesPublicAsset("// importScripts('/q-design.offline-revision.js');", join(root, 'public/sw.js'), revision, root), false);
});

test('comments, dynamic paths, external URLs and another directory do not prove a reference', () => {
  for (const code of ["// caches.match('/offline.html')", "/* '/offline.html' */", "caches.match('/help/offline.html')", "fetch('https://example.com/offline.html')", "fetch('//example.com/offline.html')", 'fetch(`/offline.${suffix}`)']) {
    assert.equal(check(code), false, code);
  }
});

test('static document and JSX navigation references are recognized', () => {
  assert.equal(check('<iframe src="./offline.html"></iframe>', 'public/index.html'), true);
  assert.equal(check('<a href=/offline.html>Offline</a>', 'public/index.html'), true);
  assert.equal(check('<object data="/offline.html?standalone=1"></object>', 'public/index.html'), true);
  assert.equal(check('<!-- <iframe src="/offline.html"> -->', 'public/index.html'), false);
  assert.equal(check('<div data-src="/offline.html"></div>', 'public/index.html'), false);
  assert.equal(check('const A=()=> <a href="/offline.html">Offline</a>;', 'app/page.tsx'), true);
});

test('relative public URLs resolve from the consuming file directory', () => {
  assert.equal(check('fetch("offline.html")', 'public/workers/sw.js'), false);
  assert.equal(check('fetch("../offline.html")', 'public/workers/sw.js'), true);
  assert.equal(check('<iframe src="../offline.html">', 'public/help/index.html'), true);
});

test('consumer file list excludes the HTML copy itself and keeps service workers', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'q-design-html-consumers-'));
  try {
    mkdirSync(join(fixture, 'public'));
    const html = join(fixture, 'public/offline.html'), worker = join(fixture, 'public/sw.js'), unrelated = join(fixture, 'public/other.js');
    writeFileSync(html, '<a href="/offline.html">Retry</a>');
    writeFileSync(worker, "caches.match('/offline.html')");
    writeFileSync(unrelated, "const message='offline documentation';");
    assert.deepEqual(publicAssetConsumerFiles(html, fixture, [html, worker, unrelated]), [worker]);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
