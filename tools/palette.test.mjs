import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildPalettes, buildCarnetPaletteRuntime, readInputs, hexToHsl, carnetBrand, stalePalettes } from './build-palette.mjs';
import { resolveIconTitleColor } from './icon-title-color.mjs';
import { PARTS } from './sync-parts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const postcss = require('postcss');
const ts = require('typescript');
const inputs = readInputs();
const [tokens, mappings] = inputs;
const outputs = buildPalettes(...inputs);
const read = path => readFileSync(path, 'utf8');
// 제품 입력은 커밋본에서 떠 온 고정 사본을 읽습니다(출처는 fixtures/palette/SOURCE.md).
const fixtures = join(root, 'tools/fixtures/palette');
const toneSource = read(join(fixtures, 'tone.ts'));
async function loadTone(runtime = buildCarnetPaletteRuntime(...inputs)) {
  const source = runtime + '\n' + toneSource.replace(/import\s*\{\s*CARNET_PALETTE\s*\}\s*from\s*['"]\.\/design\/q-design-palette['"];?/, '');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const tone = await loadTone();

function declarations(css, selector, media = 'screen') {
  const result = {};
  postcss.parse(css).walkRules(rule => {
    if (rule.selector !== selector || (rule.parent.name ?? null) !== 'media' || rule.parent.params !== media) return;
    rule.walkDecls(declaration => { result[declaration.prop] = declaration.value; });
  });
  return result;
}
const themeValues = (product, theme, css = outputs[product]) => declarations(css, mappings.products[product].selectors[theme]);
function hslToHex(value) {
  const match = /^([\d.]+) ([\d.]+)% ([\d.]+)%$/.exec(value);
  assert.ok(match, `Not HSL channels: ${value}`);
  const h = Number(match[1]), s = Number(match[2]) / 100, l = Number(match[3]) / 100;
  const a = s * Math.min(l, 1 - l);
  const channel = n => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return '#' + [0, 8, 4].map(channel).map(v => v.toString(16).padStart(2, '0')).join('');
}
const parseVars = css => Object.fromEntries(css.split(';').filter(Boolean).map(item => item.split(':')));

test('the baseline preserves every Atelier common token and Maison HSL semantics', () => {
  for (const theme of ['dark', 'light']) {
    assert.deepEqual(themeValues('atelier', theme), tokens.color[theme]);
    const maison = themeValues('maison', theme);
    for (const [property, spec] of Object.entries(mappings.products.maison.variables[theme])) {
      const expected = tokens.color[spec.theme ?? theme][spec.token];
      assert.equal(spec.format === 'hsl' ? hslToHex(maison[property]) : maison[property], expected, `${theme} ${property}`);
    }
    assert.equal(hslToHex(maison['--muted-foreground']), tokens.color[theme][theme === 'dark' ? '--qa-subtle' : '--qa-muted']);
    assert.equal(hslToHex(maison['--destructive-surface']), '#a83838');
  }
});

test('six-digit colors round trip through opacity-compatible HSL channels', () => {
  const colors = new Set(['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#010203']);
  for (const theme of ['dark', 'light']) for (const value of Object.values(tokens.color[theme])) if (/^#[\da-f]{6}$/i.test(value)) colors.add(value);
  for (const color of colors) assert.equal(hslToHex(hexToHsl(color)), color);
});

test('generated runtime palette and CSS share changed contrast inputs and default accent', async () => {
  const changed = structuredClone(inputs);
  changed[2].shared.dark['--qa-bg'] = '#080808';
  changed[2].shared.dark['--qa-surface'] = '#101010';
  changed[2].shared.dark['--qa-champagne'] = '#c9a878';
  const css = buildPalettes(...changed).carnet;
  const runtime = await loadTone(buildCarnetPaletteRuntime(...changed));
  const variables = themeValues('carnet', 'dark', css);
  assert.equal(runtime.CARNET_PALETTE.darkCanvas, variables['--dhr-canvas']);
  assert.equal(runtime.CARNET_PALETTE.darkSurface, variables['--dhr-surface']);
  assert.equal(runtime.CARNET_PALETTE.defaultBrandColor, '#c9a878');
  assert.equal(runtime.DEFAULT_BRAND_COLOR, '#b8935a', 'historical database sentinel must not change');
  assert.equal(runtime.darkTone('#b8935a'), runtime.darkTone('#c9a878'), 'default splash uses the central accent');
  assert.notEqual(runtime.darkVars('#562c8d'), tone.darkVars('#562c8d'), 'custom manufacturer derivation must use the current central background');
});

test('native title bar metadata reads the generated identity value without executing source', () => {
  const runtime = buildCarnetPaletteRuntime(...inputs);
  for (const path of ['layout.tsx', 'manifest.ts']) {
    const source = read(join(fixtures, path));
    assert.equal(resolveIconTitleColor('CARNET_PALETTE.themeColor', source, runtime), '#3d281d');
  }
  assert.equal(resolveIconTitleColor("'#3d281d'", '', ''), '#3d281d');
  assert.equal(resolveIconTitleColor('CARNET_PALETTE.themeColor', '', runtime), null);
  assert.equal(resolveIconTitleColor('process.exit()', '', runtime), null);
});

test('Maison existing theme declarations retain their rendered RGB values', () => {
  let count = 0;
  // 제품의 q-design.foundation.css 는 이 정본 산출물의 사본입니다.
  postcss.parse(read(join(root, 'dist/q-design.foundation.maison.css'))).walkRules(rule => {
    if (rule.parent.name !== 'layer' || rule.parent.params !== 'base') return;
    const theme = rule.selector === '.dark' ? 'dark' : rule.selector === ':root' ? 'light' : null;
    if (!theme) return;
    const actual = themeValues('maison', theme);
    rule.walkDecls(decl => {
      if (!(decl.prop in actual) || !/^[\d.]+ [\d.]+% [\d.]+%$/.test(decl.value)) return;
      assert.equal(hslToHex(actual[decl.prop]), hslToHex(decl.value), `${theme} ${decl.prop}`);
      count++;
    });
  });
  assert.ok(count >= 60, `Expected both complete theme mappings, got ${count}`);
});

test('Carnet preserves every existing non-brand hex color including its documented exceptions', () => {
  const css = postcss.parse(read(join(root, 'dist/q-design.foundation.carnet.css')));
  const originals = { dark: {}, light: {} };
  css.walkRules(rule => {
    const theme = rule.selectors.includes("html[data-theme='dark']") ? 'dark' : rule.selectors.includes("html[data-theme='light']") ? 'light' : null;
    if (!theme) return;
    rule.walkDecls(decl => { if (decl.prop.startsWith('--dhr-') && !decl.prop.startsWith('--dhr-brand') && /^#[\da-f]{6}$/i.test(decl.value)) originals[theme][decl.prop] = decl.value; });
  });
  for (const theme of ['dark', 'light']) {
    const actual = themeValues('carnet', theme);
    assert.ok(Object.keys(originals[theme]).length >= 25);
    for (const [property, value] of Object.entries(originals[theme])) assert.equal(actual[property], value, `${theme} ${property}`);
  }
});

test('Carnet default brand reproduces the actual runtime seven-step recipe', () => {
  for (const color of ['#b8935a', '#562c8d', '#123456', '#eeeeee']) {
    for (const theme of ['dark', 'light']) {
      const derived = carnetBrand(color, theme, { darkCanvas: '#0c0c0c', darkSurface: '#141414', lightSurface: '#f4f2ee', minimumContrast: 4.5 });
      const original = parseVars(theme === 'dark' ? tone.darkVars(color) : tone.lightVars(color));
      for (const [step, value] of Object.entries(derived)) assert.equal(value, original[`--dhr-brand${step === 'brand' ? '' : `-${step}`}`], `${color} ${theme} ${step}`);
    }
  }
});

test('one central text or background change propagates to qa, Maison HSL and dhr variables', () => {
  const changed = structuredClone(inputs);
  changed[2].shared.dark['--qa-text'] = '#ffffff';
  changed[2].shared.light['--qa-bg'] = '#ffffff';
  const result = buildPalettes(...changed);
  assert.equal(themeValues('atelier', 'dark', result.atelier)['--qa-text'], '#ffffff');
  assert.equal(hslToHex(themeValues('maison', 'dark', result.maison)['--foreground']), '#ffffff');
  assert.equal(themeValues('carnet', 'dark', result.carnet)['--dhr-ink'], '#ffffff');
  assert.equal(themeValues('atelier', 'light', result.atelier)['--qa-bg'], '#ffffff');
  assert.equal(hslToHex(themeValues('maison', 'light', result.maison)['--background']), '#ffffff');
  assert.equal(themeValues('carnet', 'light', result.carnet)['--dhr-canvas'], '#ffffff');
});

test('central accent updates default brand derivatives and fixed-theme legacy Maison colors', () => {
  const changed = structuredClone(inputs);
  changed[2].shared.dark['--qa-champagne'] = '#d6b56d';
  const result = buildPalettes(...changed);
  for (const theme of ['dark', 'light']) {
    const before = themeValues('carnet', theme), after = themeValues('carnet', theme, result.carnet);
    const expected = parseVars(theme === 'dark' ? tone.darkVars('#d6b56d') : tone.lightVars('#d6b56d'));
    for (const property of Object.keys(before).filter(name => name.startsWith('--dhr-brand'))) {
      assert.equal(after[property], `var(${property.replace('--dhr-brand', '--qd-company-brand')}, ${expected[property]})`);
    }
    assert.notEqual(after['--dhr-brand'], before['--dhr-brand']);
    assert.equal(hslToHex(themeValues('maison', theme, result.maison)['--qw-legacy-brand-copper']), '#d6b56d');
  }
});

test('screen overrides do not rewrite paper or fixed legacy print colors', () => {
  const changed = structuredClone(inputs);
  changed[2].shared.dark['--qa-champagne'] = '#d6b56d';
  const mutated = buildPalettes(...changed);
  assert.deepEqual(declarations(outputs.maison, ':root', 'print'), declarations(mutated.maison, ':root', 'print'));
  assert.equal(Object.keys(declarations(outputs.maison, ':root', 'print')).length, 23);
  for (const product of ['atelier', 'carnet']) {
    postcss.parse(outputs[product]).walkDecls(decl => assert.equal(decl.parent.parent.params, 'screen'));
  }
});

// 제품 사본 대조는 sync.mjs 의 몫입니다. 여기서는 내보내는 정본 산출물이 지금 만든 값과 같은지 봅니다.
test('all three generated palettes ship unlayered to one product each and the canonical output is current', () => {
  for (const product of Object.keys(outputs)) {
    const part = PARTS.find(item => item.src === `dist/q-design.palette.${product}.css`);
    assert.equal(part.layer, false);
    assert.equal(Object.values(part.to).length, 1);
    assert.equal(read(join(root, part.src)).replaceAll('\r\n', '\n'), outputs[product]);
  }
});

test('unknown tokens, unsafe values, insufficient contrast and invalid mappings fail closed', () => {
  const cases = [
    values => { values[2].shared.dark['--qa-typo'] = '#ffffff'; },
    values => { values[2].products.carnet.light.boddy = '#33302a'; },
    values => { values[2].shared.dark['--qa-text'] = 'red; display:none'; },
    values => { values[2].shared.dark['--qa-text'] = '#141414'; },
    values => { values[2].shared.dark['--qa-ctl'] = '#141414'; },
    values => { values[2].shared.dark['--qa-on-accent'] = '#b8935a'; },
    values => { values[1].products.maison.variables.dark['--foreground'].token = '--qa-missing'; },
    values => { values[1].products.maison.variables.dark['--foreground'].format = 'rgb'; },
    values => { values[1].products.carnet.variables.light['--dhr-body'].exception = 'missing'; },
    values => { values[1].products.carnet.selectors.dark = ':root'; },
  ];
  for (const mutate of cases) {
    const values = structuredClone(inputs);
    mutate(values);
    assert.throws(() => buildPalettes(...values), /Palette:/);
  }
});

test('check detects missing and stale generated palettes without changing them', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'qd-palette-test-'));
  try {
    mkdirSync(join(temporary, 'dist'));
    assert.equal(stalePalettes(outputs, temporary).length, 3);
    for (const [product, css] of Object.entries(outputs)) writeFileSync(join(temporary, `dist/q-design.palette.${product}.css`), css);
    assert.deepEqual(stalePalettes(outputs, temporary), []);
    const path = join(temporary, 'dist/q-design.palette.maison.css');
    const changed = read(path).replace('--foreground:', '--wrong-foreground:');
    writeFileSync(path, changed);
    assert.deepEqual(stalePalettes(outputs, temporary), ['maison']);
    assert.equal(read(path), changed);
  } finally {
    // The target is exactly the unique directory returned by mkdtempSync above.
    rmSync(temporary, { recursive: true, force: true });
  }
});
