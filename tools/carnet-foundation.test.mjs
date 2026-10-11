import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { composeFoundation } from './build-foundation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = join(root, '../DHR');
const require = createRequire(join(product, 'package.json'));
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const ts = createRequire(join(root, '../Q-Atelier/package.json'))('typescript');
const read = path => readFileSync(path, 'utf8');
const globals = read(join(product, 'app/globals.css'));
const recipe = read(join(root, 'patterns/foundation/carnet.css'));
const shared = read(join(root, 'patterns/foundation.css'));
const theme = read(join(root, 'patterns/foundation/carnet-theme.css'));

function declarations(css, selector, print = false) {
  const result = {};
  postcss.parse(css).walkRules(rule => {
    if (rule.selector !== selector) return;
    let node = rule.parent, inPrint = false;
    while (node) { if (node.type === 'atrule' && node.name === 'media' && node.params === 'print') inPrint = true; node = node.parent; }
    if (inPrint !== print) return;
    rule.nodes.filter(node => node.type === 'decl').forEach(decl => { result[decl.prop] = decl.value; });
  });
  return result;
}

test('Carnet entrypoint contains only imports and receives the central Tailwind preset', () => {
  const ast = postcss.parse(globals);
  for (const node of ast.nodes) assert.ok(node.type === 'comment' || (node.type === 'atrule' && node.name === 'import'), node.toString());
  assert.equal(ast.nodes.filter(node => node.name === 'import').at(-1).params, '"./q-design.theme.css"');
  assert.ok(read(join(product, 'app/layout.tsx')).includes("import './globals.css'"));
});

test('coarse controls inherit common height while field operations retain their separate target', () => {
  const ast = postcss.parse(recipe);
  const targetRules = [];
  ast.walkAtRules('media', media => {
    if (media.params !== '(max-width: 767px), (pointer: coarse)') return;
    media.walkDecls(decl => {
      if (decl.prop === 'min-height' || decl.prop === 'min-width') targetRules.push(decl);
    });
  });
  assert.equal(targetRules.length, 5);
  for (const decl of targetRules) assert.equal(decl.value, 'var(--qd-control-height)', decl.parent.selector);
  assert.equal(declarations(recipe, '.login-field')['min-height'], 'var(--tap-touch)');
  assert.match(recipe, /--tap-touch:\s*var\(--qd-field-control-height\)/);
});

test('actual Tailwind 4 compilation preserves live foundation variables', async () => {
  const source = '@import "tailwindcss" source(none);\n@source inline("p-4 text-xs text-sm rounded-lg leading-relaxed font-sans font-bold tracking-wide shadow-sm transition");\n' + theme;
  const result = await postcss([tailwind({ base: product, optimize: false })]).process(source, { from: join(product, 'app/__foundation-contract.css') });
  const checks = {
    '.p-4': ['padding', '--qd-spacing-unit'],
    '.text-xs': ['font-size', '--qd-font-size-12'],
    '.text-sm': ['font-size', '--qd-font-size-14'],
    '.rounded-lg': ['border-radius', '--qd-radius-lg'],
    '.leading-relaxed': ['line-height', '--qd-line-height-relaxed'],
    '.font-sans': ['font-family', '--qd-font-family-ui'],
    '.font-bold': ['font-weight', '--qd-font-weight-bold'],
    '.tracking-wide': ['letter-spacing', '--qd-tracking-wide'],
    '.shadow-sm': ['--tw-shadow', '--qd-shadow-sm'],
  };
  for (const [selector, [property, variable]] of Object.entries(checks)) assert.ok(declarations(result.css, selector)[property]?.includes(variable), `${selector} ${property} is not connected to ${variable}`);
  assert.ok(declarations(result.css, '.text-xs')['line-height'].includes('--qd-line-height-12'));
});

test('every promoted utility compiles and its recorded central variable is defined', async () => {
  const inventory = JSON.parse(read(join(root, 'source/style-adapters/carnet-utility-values.json')));
  const candidates = [...new Set(inventory.occurrences.map(item => item.replacement))];
  assert.ok(inventory.occurrences.length >= 260);
  const source = '@import "tailwindcss" source(none);\n@source inline(' + JSON.stringify(candidates.join(' ')) + ');\n' + theme;
  const built = await postcss([tailwind({ base: product, optimize: false })]).process(source, { from: join(product, 'app/__utility-contract.css') });
  const selectors = new Set();
  postcss.parse(built.css).walkRules(rule => selectors.add(rule.selector.replace(/\\(.)/g, '$1')));
  const definitions = new Set();
  postcss.parse(shared + recipe + read(join(root, 'patterns/components.css'))).walkDecls(decl => definitions.add(decl.prop));
  for (const item of inventory.occurrences) {
    assert.ok(selectors.has('.' + item.replacement), `Tailwind did not emit ${item.replacement}`);
    assert.ok(definitions.has(item.variable), `Central variable missing: ${item.variable}`);
    assert.ok(read(join(product, item.file)).includes(item.replacement), `Caller detached: ${item.file} ${item.replacement}`);
  }
});

test('authored runtime TSX contains no detached numeric arbitrary utility values', () => {
  const failures = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.tsx?$/.test(file)) {
        const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const visit = node => {
          if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
            for (const match of node.text.matchAll(/(?:[\w@.:/-]+)-\[([^\[\]\r\n]+)\]/g)) {
              const value = match[1];
              if (/\d/.test(value) && !value.includes('var(')) failures.push(`${file}: ${match[0]}`);
            }
          }
          ts.forEachChild(node, visit);
        };
        visit(source);
      }
    }
  };
  for (const directory of ['app', 'components', 'lib']) walk(join(product, directory));
  assert.deepEqual(failures, []);
});

test('auth, decorative background and attribution consume the central recipe', () => {
  const css = composeFoundation(shared, recipe, 'carnet');
  assert.equal(declarations(css, '.carnet-auth-form')['max-width'], 'var(--qd-auth-form-width)');
  assert.equal(declarations(css, '.login-card').padding, 'var(--qd-auth-card-padding)');
  assert.equal(declarations(css, '.login-headline')['font-size'], 'var(--qd-auth-title-size)');
  assert.equal(declarations(css, '.login-field')['min-height'], 'var(--tap-touch)');
  assert.match(css, /--tap-touch:\s*var\(--qd-field-control-height\)/);
  assert.equal(declarations(css, '.watermark-tile > span').color, 'var(--qd-text)');
  assert.equal(declarations(css, '.watermark-tile > span')['font-family'], 'var(--qd-font-family-ui)');
  assert.equal(declarations(css, '.carnet-ribbon-path-primary').d, 'var(--qd-carnet-ribbon-path-primary)');
  const watermark = read(join(product, 'components/watermark.tsx'));
  assert.doesNotMatch(watermark, /data:image|dangerouslySetInnerHTML|backgroundImage/);
  assert.match(watermark, /length:\s*64/);
  assert.match(watermark, /aria-hidden/);
  assert.equal(declarations(css, '.watermark')['pointer-events'], 'none');
});

test('paper keeps A4 and machine label geometry with print-only hidden controls', () => {
  const sheet = declarations(recipe, '.sheet');
  assert.deepEqual([sheet.width, sheet['min-height'], sheet.padding, sheet.background], ['210mm', '297mm', '14mm 12mm 16mm', '#fff']);
  const printSheet = declarations(recipe, '.sheet', true);
  assert.deepEqual([printSheet.width, printSheet.padding, printSheet['box-shadow']], ['auto', '0', 'none']);
  const label = declarations(recipe, '.sheet.sheet--label', true);
  assert.deepEqual([label.width, label.height, label.padding, label.overflow], ['100mm', '60mm', '2.5mm 3mm', 'hidden']);
  assert.equal(declarations(recipe, '.no-print, .watermark, .back-fab', true).display, 'none');
  const pages = [];
  postcss.parse(recipe).walkAtRules('page', node => pages.push(node.toString()));
  assert.ok(pages.some(page => page.includes('A4 portrait') && page.includes('14mm 12mm 16mm 12mm')));
  assert.ok(pages.some(page => page.includes('100mm 60mm')));
});

test('tooltip placement measures centrally sized panels and reads central inset/gap', () => {
  const source = read(join(product, 'lib/tooltip-placement.ts'));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  let values = { '--qd-tooltip-inset': '12px', '--qd-tooltip-gap': '8px' };
  new Function('exports', 'window', 'require', code)(exports, { innerWidth: 640, innerHeight: 480 }, name => {
    assert.equal(name, './css-metrics');
    return { cssLengthPixels: (_panel, key) => Number.parseFloat(values[key]) };
  });
  const panel = { getBoundingClientRect: () => ({ width: 380, height: 100 }) };
  assert.deepEqual(exports.tooltipPosition(panel, { x: 630, y: 450, top: 420 }, 'right'), { left: 248, top: 312 });
  values = { '--qd-tooltip-inset': '24px', '--qd-tooltip-gap': '20px' };
  assert.deepEqual(exports.tooltipPosition(panel, { x: 630, y: 450, top: 420 }, 'right'), { left: 236, top: 300 });
  assert.deepEqual(exports.tooltipPosition(panel, { x: 4, y: 30, top: 10 }, 'left'), { left: 24, top: 50 });
});
