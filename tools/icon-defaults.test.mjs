import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const maison = join(dirname(root), 'Q-Works');
const require = createRequire(join(maison, 'package.json'));
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const ts = require('typescript');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const selectorParser = createRequire(require.resolve('tailwindcss/package.json'))('postcss-selector-parser');

// Execute the canonical factory itself. Product copies are checked by sync; this
// test must also be useful before those copies have been regenerated.
const source = readFileSync(join(root, 'patterns/react-icon.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: 'react-icon.tsx',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const iconModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, iconModule, iconModule.exports);
const Icon = iconModule.exports.createIcon('TestIcon', React.createElement('path', { d: 'M16 16h224v224H16z' }));
const canonical = postcss.parse(readFileSync(join(root, 'patterns/components.css'), 'utf8'));
const defaults = [];
const tokens = {};
canonical.walkRules(rule => {
  if (rule.selector === ':root') rule.walkDecls(decl => { tokens[decl.prop] = decl.value; });
  if (rule.selector.includes('qd-phosphor-icon')||rule.selector==='.qd-icon--sm') defaults.push(rule.clone());
});
assert.ok(defaults.length, 'The canonical icon dimension rule must exist');
// 유틸리티는 Q-Design 정본 preset(메종 사본의 원본)으로 만듭니다. 제품 설정 파일은 읽지 않습니다.
const presetSource = readFileSync(join(root, 'patterns/foundation/maison-tailwind.ts'), 'utf8');
const presetModule = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(presetSource, {
  fileName: 'maison-tailwind.ts',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText)(require, presetModule, presetModule.exports);
const utilityCss = (await postcss([tailwind({
  presets: [presetModule.exports.default],
  content: [{ raw: 'w-4 h-4 size-4', extension: 'html' }],
})]).process('@tailwind utilities;', { from: undefined })).root;
const utilities = utilityCss.nodes.filter(node => node.type === 'rule');

function render(props = {}) {
  return new JSDOM(renderToStaticMarkup(React.createElement(Icon, props))).window.document.querySelector('svg');
}

function compare(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// This deliberately covers only the unlayered dimension selectors above.
// JSDOM does not implement CSS specificity correctly, so do not use its computed
// style as proof. Parse the real selectors and apply the normal author cascade;
// unsupported selector forms fail instead of silently approximating them.
function specificity(selector) {
  const value = [0, 0, 0];
  const ast = selectorParser().astSync(selector);
  assert.equal(ast.nodes.length, 1);
  const visit = node => {
    if (node.type === 'pseudo' && node.value === ':where') return;
    if (node.type === 'id') value[0]++;
    else if (node.type === 'class' || node.type === 'attribute') value[1]++;
    else if (node.type === 'tag') value[2]++;
    else if (!['root', 'selector', 'universal', 'combinator'].includes(node.type)) {
      assert.fail(`Unsupported selector in icon dimension test: ${selector}`);
    }
    node.nodes?.forEach(visit);
  };
  visit(ast);
  return value;
}

function dimension(svg, property, { size = tokens['--qd-icon-size'], smallSize=tokens['--qd-icon-size-sm'], order = 'canonical-last', rules = defaults } = {}) {
  // SVG presentation attributes precede ordinary author CSS declarations.
  let winner = { rank: [0, 0, 0, 0, 0, -1], value: svg.getAttribute(property) };
  const candidates = order === 'canonical-last' ? [...utilities, ...rules] : [...rules, ...utilities];
  candidates.forEach((rule, index) => {
    for (const selector of rule.selectors) {
      if (!svg.matches(selector)) continue;
      const weight = specificity(selector);
      rule.nodes.filter(node => node.type === 'decl' && node.prop === property).forEach(decl => {
        const candidate = { rank: [Number(Boolean(decl.important)), 0, ...weight, index], value: decl.value };
        if (compare(candidate.rank, winner.rank) >= 0) winner = candidate;
      });
    }
  });
  const inline = svg.style.getPropertyValue(property);
  if (inline) {
    const candidate = { rank: [Number(svg.style.getPropertyPriority(property) === 'important'), 1, 0, 0, 0, 0], value: inline };
    if (compare(candidate.rank, winner.rank) >= 0) winner = candidate;
  }
  return winner.value?.replaceAll('var(--qd-icon-size)', size).replaceAll('var(--qd-icon-size-sm)',smallSize);
}

function utilityDimension(selector, property) {
  const rule = utilities.find(item => item.selector === selector);
  assert.ok(rule, `Actual Tailwind output is missing ${selector}`);
  const declaration = rule.nodes.find(item => item.type === 'decl' && item.prop === property);
  assert.ok(declaration, `${selector} does not set ${property}`);
  return declaration.value;
}

test('an unspecified icon follows the live central size and retains its no-CSS fallback', () => {
  const svg = render();
  assert.equal(svg.getAttribute('width'), '20');
  assert.equal(svg.getAttribute('height'), '20');
  assert.equal(svg.getAttribute('data-qd-default-size'), '');
  assert.equal(svg.getAttribute('data-qd-icon'), 'TestIcon');
  for (const property of ['width', 'height']) {
    assert.equal(dimension(svg, property), '20px');
    assert.equal(dimension(svg, property, { size: '24px' }), '24px');
  }
});

test('numeric and CSS-unit size props retain both axes across a central mutation', () => {
  for (const size of [0, 28, '1.5em']) {
    const svg = render({ size });
    assert.equal(svg.hasAttribute('data-qd-default-size'), false);
    for (const property of ['width', 'height']) {
      assert.equal(dimension(svg, property, { size: '24px' }), String(size));
    }
  }
});

test('explicit dimensions retain precedence over size, including a single explicit axis', () => {
  for (const [props, expected] of [
    [{ width: 30, height: 34 }, ['30', '34']],
    [{ size: 28, width: 30 }, ['30', '28']],
    [{ size: 28, height: '2em' }, ['28', '2em']],
    [{ width: 30 }, ['30', '20']],
    [{ height: 34 }, ['20', '34']],
  ]) {
    const svg = render(props);
    assert.equal(svg.hasAttribute('data-qd-default-size'), false);
    assert.deepEqual(['width', 'height'].map(property => dimension(svg, property, { size: '24px' })), expected);
  }
});

test('actual Tailwind width and size utilities beat the default even when canonical CSS comes last', () => {
  for (const className of ['w-4 h-4', 'size-4']) {
    const svg = render({ className });
    assert.ok(svg.classList.contains('qd-phosphor-icon'));
    assert.equal(svg.getAttribute('data-qd-default-size'), '');
    for (const property of ['width', 'height']) {
      const selector = className === 'size-4' ? '.size-4' : property === 'width' ? '.w-4' : '.h-4';
      const expected = utilityDimension(selector, property);
      for (const order of ['canonical-last', 'canonical-first']) {
        assert.equal(dimension(svg, property, { size: '24px', order }), expected);
      }
    }
  }
});

test('the class override regression probe rejects the old two-class specificity', () => {
  const oldRule = postcss.parse('.qd-phosphor-icon[data-qd-default-size] { width: var(--qd-icon-size); height: var(--qd-icon-size); }').nodes;
  const svg = render({ className: 'w-4 h-4' });
  assert.equal(dimension(svg, 'width', { size: '24px', rules: oldRule }), '24px');
  assert.notEqual(dimension(svg, 'width', { size: '24px', rules: oldRule }), utilityDimension('.w-4', 'width'));
  assert.equal(dimension(svg, 'width', { size: '24px' }), utilityDimension('.w-4', 'width'));
});

test('a utility can override one axis while the other still follows the central default', () => {
  const svg = render({ className: 'w-4' });
  assert.equal(dimension(svg, 'width', { size: '24px' }), utilityDimension('.w-4', 'width'));
  assert.equal(dimension(svg, 'height', { size: '24px' }), '24px');
});

test('inline dimensions and alignment remain explicit overrides', () => {
  const svg = render({ size: 28, className: 'w-4 h-4', style: { width: 31, height: '2em', verticalAlign: 'middle' } });
  assert.equal(dimension(svg, 'width', { size: '24px' }), '31px');
  assert.equal(dimension(svg, 'height', { size: '24px' }), '2em');
  assert.equal(svg.style.verticalAlign, 'middle');
});

test('default alignment remains a live central reference and accessibility semantics stay intact', () => {
  const svg = render();
  assert.equal(tokens['--qd-icon-align'], '-0.18em');
  assert.equal(svg.style.verticalAlign, 'var(--qd-icon-align, -0.18em)');
  assert.equal(svg.style.flexShrink, '0');
  assert.equal(svg.getAttribute('aria-hidden'), 'true');
  assert.equal(svg.getAttribute('focusable'), 'false');
  const labelled = render({ 'aria-label': 'Search', strokeWidth: 3, absoluteStrokeWidth: true });
  assert.equal(labelled.hasAttribute('aria-hidden'), false);
  assert.equal(labelled.getAttribute('stroke'), 'none');
  assert.equal(labelled.getAttribute('fill'), 'currentColor');
  assert.equal(labelled.hasAttribute('absoluteStrokeWidth'), false);
});

test('the named small-icon role binds both dimensions to its own central variable',()=>{
  const rule=defaults.find(rule=>rule.selector==='.qd-icon--sm');
  assert.equal(tokens['--qd-icon-size-sm'],'16px');
  for(const property of ['width','height'])assert.equal(rule.nodes.find(node=>node.prop===property).value,'var(--qd-icon-size-sm)');
  const svg=render({className:'qd-icon--sm'});
  assert.equal(svg.getAttribute('data-qd-default-size'),'');
  assert.ok(compare(specificity('.qd-icon--sm'),specificity(':where(.qd-phosphor-icon[data-qd-default-size])'))>0);
  for(const property of ['width','height']){
    assert.equal(dimension(svg,property,{size:'24px'}),'16px');
    assert.equal(dimension(svg,property,{size:'24px',smallSize:'18px'}),'18px');
  }
});
