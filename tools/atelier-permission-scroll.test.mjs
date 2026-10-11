import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../Q-Atelier/package.json', import.meta.url));
const ts = require('typescript'), postcss = require('postcss');
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const hash = source => createHash('sha256').update(source.replaceAll('\r\n', '\n')).digest('hex');
const ledger = JSON.parse(read('../reviews/atelier-permission-scroll-migration.json'));
const source = read('../../Q-Atelier/app/(app)/admin/permissions-matrix/page.tsx');

test('matrix change exactly preserves all role, authentication and permission logic', () => {
  const row = ledger.records[0];
  assert.equal(hash(source), row.afterHash);
  let original = source;
  for (const edit of [...row.edits].reverse()) {
    assert.equal(original.slice(edit.start, edit.start + edit.after.length), edit.after);
    original = original.slice(0, edit.start) + edit.before + original.slice(edit.start + edit.after.length);
  }
  assert.equal(hash(original), row.beforeHash);
  assert.equal(row.edits.length, 5);
  for (const edit of row.edits) assert.ok(
    edit.after.includes('stickyFirstCol tall>') || edit.after === '<div className="qd-table-scroll-header"' ||
    edit.after === '' && edit.before.includes("position: 'sticky'"));
});

test('both real matrix renderers select bounded scrolling and a sticky opaque header', () => {
  const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  for (const name of ['MatrixSection', 'DocPermissionsSection']) {
    const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert.ok(fn);
    const wrappers = [], headers = [];
    function visit(node) {
      if (ts.isJsxElement(node)) {
        if (node.openingElement.tagName.getText(ast) === 'ScrollTable') wrappers.push(node);
        if (node.openingElement.attributes.properties.some(attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === 'className' && attr.initializer?.text === 'qd-table-scroll-header')) headers.push(node);
      }
      ts.forEachChild(node, visit);
    }
    visit(fn);
    assert.equal(wrappers.length, 1); assert.equal(headers.length, 1);
    for (const prop of ['stickyFirstCol', 'tall']) assert.ok(wrappers[0].openingElement.attributes.properties.some(attr => ts.isJsxAttribute(attr) && attr.name.getText(ast) === prop && !attr.initializer));
    assert.ok(wrappers[0].children.includes(headers[0]));
    assert.doesNotMatch(headers[0].openingElement.getText(ast), /position:|zIndex:|background:/);
  }
});

test('shared height and header layer remain mutable and print restores full document flow', () => {
  const common = postcss.parse(read('../patterns/components.css'));
  const recipe = postcss.parse(read('../patterns/foundation/atelier.css'));
  const vars = new Map(); common.walkRules(':root', rule => rule.walkDecls(d => vars.set(d.prop, d.value)));
  const rule = (css, selector, print = false) => {
    const matches = []; css.walkRules(r => {
      if (!r.selectors.includes(selector)) return;
      const isPrint = r.parent.type === 'atrule' && r.parent.name === 'media' && r.parent.params === 'print';
      if (isPrint === print) matches.push(r);
    });
    assert.equal(matches.length, 1, selector); return Object.fromEntries(matches[0].nodes.filter(n => n.type === 'decl').map(d => [d.prop, d.value]));
  };
  const tall = rule(recipe, '.qa-scroll-table--tall');
  const head = rule(common, '.qd-table-scroll-header');
  assert.equal(tall['overflow-y'], 'auto');
  assert.equal(tall['max-height'], 'var(--qd-table-scroll-max-height)');
  assert.equal(vars.get('--qd-table-scroll-max-height'), '70vh');
  assert.equal(head.position, 'sticky'); assert.equal(head.top, '0');
  assert.equal(head.background, 'var(--qd-surface)');
  assert.equal(head['z-index'], 'var(--qd-table-header-layer)');
  const resolve = (value, values) => value.replace(/var\((--[\w-]+)\)/g, (_, name) => values.get(name));
  vars.set('--qd-table-scroll-max-height', '55dvh'); vars.set('--qd-table-header-layer', '4');
  assert.equal(resolve(tall['max-height'], vars), '55dvh');
  assert.equal(resolve(head['z-index'], vars), '4');
  assert.equal(rule(recipe, '.qa-scroll-table--tall', true)['max-height'], 'none');
  assert.equal(rule(common, '.qd-table-scroll-header', true).position, 'static');
});

test('permission matrix rows cover intrinsic grid width without squeezing the header background', () => {
  const css = postcss.parse(read('../patterns/foundation/atelier.css'));
  const rules = [];
  css.walkRules('.qa-pm-matrix .qa-scroll-table-inner', rule => rules.push(rule));
  assert.equal(rules.length, 1);
  const decls = Object.fromEntries(rules[0].nodes.filter(n => n.type === 'decl').map(d => [d.prop, d]));
  assert.equal(decls.width.value, 'max-content');
  assert.equal(decls['min-width'].value, '100%');
  assert.equal(decls['min-width'].important, true, 'the shared ScrollTable inline squeezed minWidth must not leave grid tracks outside the header box');
  assert.equal(rules[0].parent.type, 'root', 'the same intrinsic document width must reach printZoom rather than clipping output');
  assert.doesNotMatch(rules[0].toString(), /\d+px|overflow:\s*hidden/);
});
