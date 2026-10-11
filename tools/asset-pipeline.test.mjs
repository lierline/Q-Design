import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { FONT_FAMILIES, FONT_SUBSETS, assertFontSource, inspectFontCache, verifyFontCache } from './font-cache.mjs';
import { browserLaunchOptions } from './browser-launch.mjs';
import { parseIconTargets, canWriteIconTarget } from './icon-targets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(root, '../Q-Atelier/package.json'));
const ts = require('typescript');
const read = path => readFileSync(join(root, path), 'utf8');
function alteredReader(relative, mutate) {
  const target = join(root, relative);
  return (path, ...args) => {
    const value = readFileSync(path, ...args);
    return path === target ? mutate(value) : value;
  };
}

test('all 17 offline faces match current source, request, CSS and WOFF2 digests', () => {
  const result = verifyFontCache(root);
  assert.equal(result.faces, 17);
  assert.ok(result.bytes > 2_000_000);
});

test('explicit offline CLI never fetches or writes a file', () => {
  const file = pathToFileURL(join(root, 'tools/fetch-fonts.mjs')).href;
  const code = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    globalThis.fetch = () => { throw new Error('Unexpected network access'); };
    fs.writeFileSync = () => { throw new Error('Unexpected file write'); };
    fs.mkdirSync = () => { throw new Error('Unexpected directory write'); };
    syncBuiltinESMExports();
    process.argv.push('--offline');
    await import(${JSON.stringify(file)});
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: root, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /17 faces/);
});

test('a source fingerprint change refuses offline reuse even when existing faces still cover it', () => {
  assert.throws(() => verifyFontCache(root, { read: alteredReader('source/fonts/fonts.ts', value => value + '\n// Changed source declaration\n') }), /source font declaration changed/);
});

test('new source weights, subsets, family imports, and italic fail rather than shrinking the bundle', () => {
  const source = read('source/fonts/fonts.ts');
  for (const changed of [
    source.replace("'700'", "'800'"),
    source.replace("subsets: ['latin']", "subsets: ['greek']"),
    source.replace('import { Cormorant_Garamond }', 'import { Cormorant_Garamond, Roboto }'),
    source.replace("style: ['normal']", "style: ['italic']"),
  ]) assert.throws(() => assertFontSource(changed), /Font cache:/);
});

test('changed download requests refuse offline reuse', () => {
  const families = structuredClone(FONT_FAMILIES);
  families[0].q += '&text=changed';
  assert.throws(() => verifyFontCache(root, { families }), /download requirements changed/);
  assert.throws(() => verifyFontCache(root, { subsets: [...FONT_SUBSETS, 'greek'] }), /missing cached faces/);
});

test('missing family or weight is rejected before a candidate stylesheet is accepted', () => {
  const remove = css => css.replace(/@font-face\s*\{(?=[^}]*cormorant-garamond-700-latin\.woff2)[^}]+\}/, '');
  assert.throws(() => inspectFontCache(root, { read: alteredReader('dist/q-design.fonts.css', remove) }), /missing cached faces/);
});

test('a modified stylesheet, corrupt WOFF2 header, truncated file or altered payload refuses reuse', () => {
  assert.throws(() => verifyFontCache(root, { read: alteredReader('dist/q-design.fonts.css', css => css + '\n/* changed */\n') }), /cached font CSS changed/);
  const file = 'source/fonts/jetbrains-mono-400-latin.woff2';
  for (const corrupt of [
    value => Buffer.concat([Buffer.from('html'), value.subarray(4)]),
    value => value.subarray(0, value.length - 2),
  ]) assert.throws(() => verifyFontCache(root, { read: alteredReader(file, corrupt) }), /invalid or truncated WOFF2/);
  assert.throws(() => verifyFontCache(root, { read: alteredReader(file, value => {
    const changed = Buffer.from(value); changed[changed.length - 1] ^= 1; return changed;
  }) }), /cached WOFF2 contents changed/);
});

test('installed browser channels require explicit selection; the default stays bundled Chromium', () => {
  assert.deepEqual(browserLaunchOptions({}), { headless: true });
  assert.deepEqual(browserLaunchOptions({ QD_BROWSER_CHANNEL: 'msedge' }), { headless: true, channel: 'msedge' });
  assert.throws(() => browserLaunchOptions({ QD_BROWSER_CHANNEL: 'misspelled-edge' }), /Unsupported/);
});

test('scoped icon writes exclude Sonar while allowing the three named products', () => {
  const selected = parseIconTargets(['--write', '--only=Q-Atelier,Q-Works,Q-Forge']);
  for (const key of ['atelier', 'maison', 'carnet']) assert.equal(canWriteIconTarget(true, selected, key), true);
  assert.equal(canWriteIconTarget(true, selected, 'sonar'), false);
  for (const key of ['atelier', 'maison', 'carnet', 'sonar']) assert.equal(canWriteIconTarget(false, selected, key), false);
  assert.equal(canWriteIconTarget(true, parseIconTargets([]), 'sonar'), true);
  assert.deepEqual(parseIconTargets(['--only=Q-Maison,Q-Carnet']), new Set(['maison', 'carnet']));
  for (const args of [['--only='], ['--only=Q-Ateler'], ['--only=Q-Works', '--only=Q-Forge']]) assert.throws(() => parseIconTargets(args));
});

test('each product icon, mark and native target write remains under the scoped write guard', () => {
  const source = ts.createSourceFile('app-icons.mjs', read('tools/app-icons.mjs'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let targetWrites = 0;
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'writeFileSync' && node.arguments[0]?.getText(source) === 'target') {
      targetWrites++;
      let guarded = false;
      for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
        if (ts.isIfStatement(ancestor) && /\bwriteProduct\b/.test(ancestor.expression.getText(source))) guarded = true;
      }
      assert.ok(guarded, `Unguarded product write at ${source.getLineAndCharacterOfPosition(node.pos).line + 1}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.equal(targetWrites, 3);
  const calls = [...source.text.matchAll(/canWriteIconTarget\(write, onlyTargets, p\.key\)/g)];
  assert.equal(calls.length, 3);
});
