import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { PARTS } from './sync-parts.mjs';
import { copyProblems } from './audit-coverage-core.mjs';

const ROOT = 'D:/Claude/Q-Design', PRODUCT = 'D:/Claude/Q-Atelier';
const require = createRequire(PRODUCT + '/package.json');
const ts = require('typescript'), React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ledger = JSON.parse(fs.readFileSync(ROOT + '/source/style-adapters/atelier-backgrounds.json', 'utf8'));
const canonical = fs.readFileSync(ROOT + '/' + ledger.canonical, 'utf8');
const sha = value => createHash('sha256').update(value).digest('hex');

function load(code, overrides = new Map(), filename = ledger.product, cache = new Map()) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } }).outputText;
  const localRequire = id => {
    if (!id.startsWith('@/') && !id.startsWith('.')) return require(id);
    const local = id.startsWith('@/') ? id.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(filename), id));
    const file = ['.ts', '.tsx'].map(extension => local + extension).find(candidate => overrides.has(candidate) || fs.existsSync(PRODUCT + '/' + candidate));
    assert.ok(file, `Missing test dependency: ${id}`);
    if (!cache.has(file)) cache.set(file, load(overrides.get(file) ?? fs.readFileSync(PRODUCT + '/' + file, 'utf8'), overrides, file, cache));
    return cache.get(file);
  };
  new Function('require', 'exports', 'module', compiled)(localRequire, module.exports, module);
  return module.exports;
}

test('approved background artwork preserves exact rendered markup through both product wrappers', () => {
  const output = load(canonical);
  for (const [file, before] of Object.entries(ledger.baseline)) {
    const name = path.basename(file, '.tsx');
    const wrapper = load(fs.readFileSync(PRODUCT + '/' + file, 'utf8'), new Map(), file);
    for (const sample of before.rendered) {
      assert.equal(sha(renderToStaticMarkup(React.createElement(output[name], sample.props))), sample.hash, `${name} approved markup`);
      assert.equal(sha(renderToStaticMarkup(React.createElement(wrapper[name], sample.props))), sample.hash, `${name} product markup`);
    }
  }
});

test('central artwork mutations reach the real wrapper and unsynced artwork is rejected', () => {
  const part = PARTS.find(item => item.src === ledger.canonical);
  assert.ok(part);
  const product = fs.readFileSync(PRODUCT + '/' + ledger.product, 'utf8');
  assert.deepEqual(copyProblems(part, canonical, product), []);
  const mutated = canonical.replace('strokeWidth="200"', 'strokeWidth="220"');
  assert.notEqual(mutated, canonical);
  assert.ok(copyProblems(part, mutated, product).length > 0);
  const wrapper = load(fs.readFileSync(PRODUCT + '/components/RibbonBackground.tsx', 'utf8'),
    new Map([[ledger.product, mutated]]), 'components/RibbonBackground.tsx');
  assert.match(renderToStaticMarkup(React.createElement(wrapper.RibbonBackground)), /stroke-width="220"/);
  const runtimeFile = 'lib/design/q-design-runtime.ts';
  const runtime = fs.readFileSync(PRODUCT + '/' + runtimeFile, 'utf8');
  const changedRuntime = runtime.replace(/("?durationSeconds"?\s*:\s*)1\.7/, '$12.3');
  assert.notEqual(changedRuntime, runtime);
  const entrance = load(canonical, new Map([[runtimeFile, changedRuntime]]));
  assert.equal((renderToStaticMarkup(React.createElement(entrance.EntranceRibbon)).match(/dur="2.3s"/g) ?? []).length, 6);
});
