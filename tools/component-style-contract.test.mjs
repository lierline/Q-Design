import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PARTS } from './sync-parts.mjs';

// Source contracts complement the real-browser fixtures. They do not claim to
// measure rendered geometry, contrast, focus behavior, or arbitrary CSS overrides.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const postcss = require('postcss');
const ts = require('typescript');
const read = path => readFileSync(path, 'utf8');
const canonicalPath = join(root, 'patterns/components.css');
const canonical = postcss.parse(read(canonicalPath), { from: canonicalPath });
const part = PARTS.find(item => item.src === 'patterns/components.css');
// 부품 소스는 Q-Design 정본 사본(patterns/component-implementations)에서 읽습니다. 제품 저장소는 읽지 않습니다.
const file = (product, relative) => join(root, 'patterns/component-implementations', product, relative);

function cssShape(container) {
  return container.nodes.filter(node => node.type !== 'comment').map(node => {
    if (node.type === 'decl') return ['decl', node.prop, node.value, Boolean(node.important)];
    if (node.type === 'rule') return ['rule', node.selector, cssShape(node)];
    if (node.type === 'atrule') return ['at', node.name, node.params, node.nodes ? cssShape(node) : []];
    throw new Error(`Unhandled CSS node: ${node.type}`);
  });
}

function mediaOf(rule) {
  const media = [];
  for (let parent = rule.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && parent.name === 'media') media.push(parent.params);
  }
  return media;
}

function declarations(selector, media = null) {
  const result = {};
  canonical.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    const contexts = mediaOf(rule);
    if (media === null ? contexts.length !== 0 : !contexts.some(value => media.test(value))) return;
    rule.walkDecls(decl => { result[decl.prop] = decl.value; });
  });
  return result;
}

const tokens = declarations(':root');
function pixels(value) {
  const match = /^var\((--[\w-]+)(?:,[^)]+)?\)$/.exec(value ?? '');
  const resolved = match ? tokens[match[1]] : value;
  assert.match(resolved ?? '', /^\d+(?:\.\d+)?px$/, `Expected a defined dimension, got ${value}`);
  return Number.parseFloat(resolved);
}

function source(product, relative) {
  const path = file(product, relative);
  return ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
}

function visit(node, callback) {
  callback(node);
  ts.forEachChild(node, child => visit(child, callback));
}

function classText(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isJsxExpression(node) && node.expression) return classText(node.expression);
  if (ts.isCallExpression(node)) return node.arguments.map(classText).join(' ');
  if (ts.isObjectLiteralExpression(node)) return node.properties.map(property => ts.isPropertyAssignment(property) ? classText(property.initializer) : '').join(' ');
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(classText).join(' ');
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ');
  if (ts.isConditionalExpression(node)) return `${classText(node.whenTrue)} ${classText(node.whenFalse)}`;
  return '';
}

function classSets(node) {
  const result = [];
  visit(node, child => {
    if (ts.isCallExpression(child) && child.expression.getText() === 'cva') {
      result.push(classText(child).split(/\s+/).filter(Boolean));
    }
    if (!ts.isJsxAttribute(child) || child.name.getText() !== 'className' || !child.initializer) return;
    const classes = classText(child.initializer).split(/\s+/).filter(Boolean);
    if (classes.length) result.push(classes);
  });
  return result;
}

function component(tree, name) {
  let found;
  visit(tree, node => {
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText() === name) found = node;
  });
  assert.ok(found, `Missing component ${name} in ${tree.fileName}`);
  return found;
}

// Evaluate only simple class selectors for the known close-button composition.
// Complex selectors and inline styles remain covered by the browser fixtures.
function simpleClassStyles(classes) {
  const result = {};
  canonical.walkRules(rule => {
    if (mediaOf(rule).length) return;
    const matches = rule.selectors.some(selector => {
      if (!/^(?:\.[\w-]+)+$/.test(selector)) return false;
      return selector.slice(1).split('.').every(name => classes.includes(name));
    });
    if (matches) rule.walkDecls(decl => { result[decl.prop] = decl.value; });
  });
  return result;
}

// Q-Design 이 써 넣는 사본만 대조합니다. 제품 globals.css 의 import 순서는 제품 쪽 일입니다.
test('every target holds an exact generated component canon in the components layer', () => {
  assert.ok(part, 'Missing component sync part');
  assert.equal(Object.keys(part.to).length, 3);
  for (const [product, target] of Object.entries(part.to)) {
    const copy = postcss.parse(read(target), { from: target });
    const layer = copy.nodes.find(node => node.type === 'atrule' && node.name === 'layer' && node.params === 'components');
    assert.ok(layer, `${product}: component copy must be in the components layer`);
    assert.deepEqual(cssShape(layer), cssShape(canonical), `${product}: regenerate the component copy`);
  }
});

test('shared dimensions preserve the approved scale and meaningful touch targets', () => {
  assert.equal(tokens['--qd-radius'], '10px');
  assert.equal(tokens['--qd-section-size'], '16px');
  for (const name of ['--qd-control-height', '--qd-control-icon']) assert.ok(pixels(tokens[name]) >= 44, name);
  assert.ok(pixels(tokens['--qd-control-height-sm']) >= 36);
  for (const selector of ['.qd-btn', '.qd-input', '.qd-text-action', '.qd-choice', '.qd-combobox-option',
    '.qd-filter-input', '.qd-filter-select', '.qd-filter-submit', '.qd-filter-clear', '.qd-pager-btn']) {
    assert.ok(pixels(declarations(selector, /pointer:\s*coarse/)['min-height']) >= 44, `${selector}: touch height`);
  }
  for (const selector of ['.qd-choice-hit', '.qd-calendar-day', '.qd-control-icon', '.qd-dialog-close', '.qd-mobile-menu']) {
    const styles = declarations(selector);
    assert.ok(pixels(styles['min-width']) >= 44, `${selector}: hit width`);
    assert.ok(pixels(styles['min-height']) >= 44, `${selector}: hit height`);
  }
});

test('overlay and feedback surfaces are opaque, token driven, and never blur the background', () => {
  for (const selector of ['.qd-dialog-content', '.qd-drawer-content', '.qd-tooltip', '.qd-popover', '.qd-notice', '.qd-toast']) {
    const styles = declarations(selector);
    assert.equal(styles.background, 'var(--qd-surface)', `${selector}: surface ownership`);
    assert.equal(styles['border-radius'], 'var(--qd-radius)', `${selector}: radius ownership`);
  }
  // 카드는 장부형(위 괘선 하나 · 2026-10-23 오너 결정 «3»). 떠 있는 층 안에서는 같은 변수가 상자 값이 된다.
  const card = declarations('.qd-card');
  assert.equal(card.background, 'var(--qd-card-face, transparent)', '.qd-card: 면 없음');
  assert.equal(card['border-width'], 'var(--qd-card-rule, 1px 0 0)', '.qd-card: 위 괘선만');
  assert.equal(card['border-radius'], 'var(--qd-card-radius, 0)', '.qd-card: 모서리 없음');
  let boxed = null;
  canonical.walkRules(rule => { if (rule.selector.includes(".qd-dialog-content") && rule.selector.includes('.qd-card--box')) boxed = rule; });
  assert.ok(boxed, '떠 있는 층 · 상자로 남길 자리의 묶음');
  const box = Object.fromEntries(boxed.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
  assert.equal(box['--qd-card-face'], 'var(--qd-surface)', '창 안의 카드: 면');
  assert.equal(box['--qd-card-radius'], 'var(--qd-radius-card, var(--qd-radius))', '창 안의 카드: 모서리');
  for (const role of ["[role='dialog']", "[role='menu']", '.qd-popover', '.qd-panel--warn']) assert.ok(boxed.selector.includes(role), `상자로 남는 자리: ${role}`);
  canonical.walkDecls(/backdrop-filter$/, decl => assert.equal(decl.value, 'none'));
  for (const selector of ['.qd-dialog-backdrop', '.qd-drawer-backdrop']) {
    assert.equal(declarations(selector)['backdrop-filter'], 'none');
  }
});

test('input states and reduced motion remain part of the shared canon', () => {
  assert.equal(declarations('.qd-input::placeholder').color, 'var(--qd-muted)');
  assert.equal(declarations('.qd-input::placeholder').opacity, '1');
  const disabled = declarations('.qd-input:disabled');
  assert.equal(disabled.background, 'var(--qd-bg)');
  assert.equal(disabled.color, 'var(--qd-muted)');
  assert.equal(disabled.cursor, 'not-allowed');
  // 잠긴 칸 · 꺼진 칸은 적는 칸과 같은 흰 상자 · 진한 테두리로 두지 않는다(2026-10-27)
  assert.equal(disabled['border-color'], 'var(--qd-border)');
  const readonly = declarations('.qd-input[readonly]');
  assert.equal(readonly.background, 'var(--qd-bg)');
  assert.equal(readonly['border-color'], 'var(--qd-border)');
  const reduced = declarations(':root', /prefers-reduced-motion:\s*reduce/);
  assert.equal(reduced['--qd-motion-fast'], '0ms');
  assert.equal(reduced['--qd-motion-normal'], '0ms');
  assert.equal(declarations('.qd-skeleton', /prefers-reduced-motion:\s*reduce/).animation, 'none');
});

const adapters = [
  ['atelier', 'lib/design/components.tsx', 'Modal', ['qd-dialog-backdrop', 'qd-dialog-content', 'qd-dialog-title']],
  ['atelier', 'lib/design/components.tsx', 'Drawer', ['qd-drawer-backdrop', 'qd-drawer-content', 'qd-drawer-title']],
  ['atelier', 'lib/design/components.tsx', 'In', ['qd-input']],
  ['atelier', 'lib/design/components.tsx', 'Sel', ['qd-input']],
  ['atelier', 'lib/design/components.tsx', 'Txt', ['qd-input']],
  ['maison', 'components/ui/dialog.tsx', 'DialogContent', ['qd-dialog-content', 'qd-dialog-close']],
  ['maison', 'components/ui/dialog.tsx', 'DialogOverlay', ['qd-dialog-backdrop']],
  ['maison', 'components/ui/sheet.tsx', 'SheetOverlay', ['qd-drawer-backdrop']],
  ['maison', 'components/ui/sheet.tsx', 'SheetContent', ['qd-dialog-close']],
  ['maison', 'components/ui/sheet.tsx', 'sheetVariants', ['qd-drawer-content']],
  ['maison', 'components/ui/button.tsx', 'buttonVariants', ['qd-btn', 'qd-text-action', 'qd-control-icon']],
  ['maison', 'components/ui/input.tsx', 'Input', ['qd-input']],
  ['maison', 'components/ui/textarea.tsx', 'Textarea', ['qd-input']],
  ['maison', 'components/ui/select.tsx', 'Select', ['qd-input']],
  ['maison', 'components/ui/checkbox.tsx', 'Checkbox', ['qd-choice-hit', 'qd-checkbox', 'qd-checkbox-mark']],
  ['carnet', 'components/dialog.tsx', 'Dialog', ['qd-dialog-backdrop', 'qd-dialog-content', 'qd-dialog-title']],
  ['carnet', 'components/ui.tsx', 'Msg', ['qd-notice']],
  ['carnet', 'components/ui.tsx', 'Progress', ['qd-progress', 'qd-progress-fill']],
];

for (const [product, relative, name, roles] of adapters) {
  test(`${product} ${name} consumes canonical roles without a blurred surface`, () => {
    const node = component(source(product, relative), name);
    const sets = classSets(node);
    const classes = new Set(sets.flat());
    for (const role of roles) assert.ok(classes.has(role), `${name}: missing ${role}`);
    for (const cls of classes) assert.doesNotMatch(cls, /(?:^|:)backdrop-blur(?:-|$)/);
    visit(node, child => {
      if (ts.isPropertyAssignment(child) && /^(?:Webkit)?backdropFilter$/.test(child.name.getText())) {
        assert.ok(ts.isStringLiteralLike(child.initializer) && child.initializer.text === 'none', `${name}: inline blur`);
      }
    });
    for (const set of sets.filter(value => value.includes('qd-dialog-close'))) {
      assert.ok(pixels(simpleClassStyles(set)['min-height']) >= 44, `${name}: composed close classes shrink below 44px`);
    }
  });
}

test('native wrappers preserve real input, select, textarea and checkbox elements', () => {
  for (const [product, relative, names, tags] of [
    ['atelier', 'lib/design/components.tsx', ['In', 'Sel', 'Txt'], ['input', 'select', 'textarea']],
    ['maison', 'components/ui/input.tsx', ['Input'], ['input']],
    ['maison', 'components/ui/select.tsx', ['Select'], ['select']],
    ['maison', 'components/ui/textarea.tsx', ['Textarea'], ['textarea']],
    ['maison', 'components/ui/checkbox.tsx', ['Checkbox'], ['input']],
  ]) {
    const tree = source(product, relative);
    names.forEach((name, index) => {
      let found = false;
      visit(component(tree, name), node => {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === tags[index]) found = true;
      });
      assert.ok(found, `${product} ${name}: native ${tags[index]} was replaced`);
    });
  }
});
