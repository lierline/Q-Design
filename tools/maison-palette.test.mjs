import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPalettes, hexToHsl, readInputs } from './build-palette.mjs';

// Compile the real Maison import chain and Tailwind configuration. Only the
// generated palette is replaced in memory, so mutations never touch a product.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const maison = join(dirname(root), 'Q-Works');
const require = createRequire(join(maison, 'package.json'));
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const tailwind = require('tailwindcss');
const loadConfig = require('tailwindcss/loadConfig');
const resolveConfig = require('tailwindcss/resolveConfig');
const config = loadConfig(join(maison, 'tailwind.config.ts'));
const legacy = Object.entries(resolveConfig(config).theme.colors)
  .filter(([family]) => ['brand', 'status', 'severity'].includes(family))
  .flatMap(([family, values]) => Object.entries(values).map(([name, value]) => ({ family, name, value })));
const classes = legacy.map(({ family, name }) => `text-${family}-${name}`)
  .concat(['bg-brand-copper/15', 'border-severity-critical/50', 'text-status-approved', 'rounded-md', 'text-xs',
    'p-4', 'gap-6', '-mt-4', 'text-2xl', 'font-sans', 'font-mono', 'font-semibold', 'tracking-wide', 'shadow-lg',
    'stroke-[length:var(--qd-nav-icon-stroke)]',
    'qm-auth', 'qm-auth-card', 'qm-auth-form-inner', 'qm-auth-headline', 'qm-ribbon-1',
    'qm-main-band', 'qm-app-main', 'qm-command-input', 'qm-chart-label']);
const globalsPath = join(maison, 'app/globals.css');
const source = readFileSync(globalsPath, 'utf8');

async function compile(palette) {
  return (await postcss([
    postcssImport({ load: path => path.replaceAll('\\', '/').endsWith('/q-design.palette.css') ? palette : readFileSync(path, 'utf8') }),
    tailwind({ ...config, content: [{ raw: classes.join(' '), extension: 'html' }] }),
  ]).process(source, { from: globalsPath })).root;
}

function declarations(css, selector, media = null) {
  const values = {};
  css.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    const contexts = [];
    for (let ancestor = rule.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.type === 'atrule' && ancestor.name === 'media') contexts.push(ancestor.params);
    }
    if (media === null ? contexts.length > 0 : !contexts.includes(media)) return;
    rule.nodes.filter(node => node.type === 'decl').forEach(decl => { values[decl.prop] = decl.value; });
  });
  return values;
}

const [tokens, mappings, overrides] = readInputs(root);
const baseline = await compile(buildPalettes(tokens, mappings, overrides).maison);

test('every Maison legacy palette utility compiles to a generated variable with alpha support', () => {
  assert.equal(legacy.length, 23);
  for (const { family, name, value } of legacy) {
    const match = /^hsl\(var\((--qw-legacy-[\w-]+)\) \/ <alpha-value>\)$/.exec(value);
    assert.ok(match, `${family}.${name} must use a central HSL channel variable`);
    const property = match[1];
    const utility = declarations(baseline, `.text-${family}-${name}`).color;
    assert.ok(utility?.includes(`var(${property})`), `compiled text-${family}-${name} lost the variable`);
    for (const theme of ['dark', 'light']) {
      const selector = mappings.products.maison.selectors[theme];
      assert.ok(declarations(baseline, selector, 'screen')[property], `${property} missing in ${theme}`);
    }
    assert.ok(declarations(baseline, ':root', 'print')[property], `${property} missing in print`);
  }
  assert.equal(declarations(baseline, '.bg-brand-copper\\/15')['background-color'], 'hsl(var(--qw-legacy-brand-copper) / 0.15)');
  assert.equal(declarations(baseline, '.border-severity-critical\\/50')['border-color'], 'hsl(var(--qw-legacy-severity-critical) / 0.5)');
});

test('central palette mutation reaches existing brand, status and severity CSS while print stays on its baseline', async () => {
  const changed = structuredClone(overrides);
  changed.shared.dark['--qa-champagne'] = '#d4aa66';
  changed.shared.dark['--qa-state-green'] = '#86c47c';
  changed.shared.dark['--qa-red'] = '#d28686';
  const mutated = await compile(buildPalettes(tokens, mappings, changed).maison);
  for (const [selector, cssProperty, variable, value] of [
    ['.bg-brand-copper\\/15', 'background-color', '--qw-legacy-brand-copper', '#d4aa66'],
    ['.text-status-approved', 'color', '--qw-legacy-status-approved', '#86c47c'],
    ['.border-severity-critical\\/50', 'border-color', '--qw-legacy-severity-critical', '#d28686'],
  ]) {
    assert.equal(declarations(mutated, selector)[cssProperty], declarations(baseline, selector)[cssProperty]);
    assert.ok(declarations(mutated, selector)[cssProperty].includes(`var(${variable})`));
    for (const theme of ['dark', 'light']) {
      const rootSelector = mappings.products.maison.selectors[theme];
      const before = declarations(baseline, rootSelector, 'screen')[variable];
      const after = declarations(mutated, rootSelector, 'screen')[variable];
      assert.equal(after, hexToHsl(value));
      assert.notEqual(after, before, `${variable} must change in ${theme}`);
    }
    assert.equal(declarations(mutated, ':root', 'print')[variable], declarations(baseline, ':root', 'print')[variable]);
  }
  assert.equal(declarations(mutated, '.rounded-md')['border-radius'], 'var(--qd-radius)');
  assert.equal(declarations(mutated, '.text-xs')['font-size'], 'var(--qd-caption-size)');
});

test('legacy print aliases preserve the pre-migration palette and do not depend on screen media', () => {
  const expected = {
    'brand-forest': '#1c1a16', 'brand-forest-dark': '#0c0c0c', 'brand-forest-light': '#1b1b1b',
    'brand-forest-pale': '#f3f1ec', 'brand-forest-logo': '#0c0c0c', 'brand-copper': '#b8935a',
    'brand-copper-light': '#c9a878', 'brand-copper-dark': '#8a6838', 'brand-cream': '#faf9f6',
    'brand-white-gray': '#f3f1ec', 'brand-cool-gray': '#e2dfd8', 'brand-pink': '#f3f1ec',
    'brand-pink-dark': '#8a6838', 'brand-ink': '#0c0c0c', 'status-draft': '#928c86',
    'status-review': '#d49850', 'status-approved': '#7ab87a', 'status-published': '#6b8fc4',
    'status-rejected': '#c97a7a', 'status-obsolete': '#928c86', 'severity-critical': '#c97a7a',
    'severity-major': '#d49850', 'severity-minor': '#c9a878',
  };
  const print = declarations(baseline, ':root', 'print');
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(print[`--qw-legacy-${name}`], hexToHsl(value), name);
  }
});

test('real Maison utility CSS uses central live scales throughout the legacy utility layer', () => {
  for (const [selector, property, expected] of [
    ['.p-4', 'padding', 'calc(var(--qd-spacing-unit) * 4)'],
    ['.gap-6', 'gap', 'calc(var(--qd-spacing-unit) * 6)'],
    ['.text-2xl', 'font-size', 'var(--qd-font-size-24)'],
    ['.font-sans', 'font-family', 'var(--qd-font-family-ui)'],
    ['.font-mono', 'font-family', 'var(--qd-font-family-mono)'],
    ['.font-semibold', 'font-weight', 'var(--qd-font-weight-semibold)'],
    ['.tracking-wide', 'letter-spacing', 'var(--qd-tracking-wide)'],
  ]) assert.equal(declarations(baseline, selector)[property], expected, selector);
  assert.ok(declarations(baseline, '.-mt-4')['margin-top'].includes('--qd-spacing-unit'));
  assert.ok(declarations(baseline, '.shadow-lg')['--tw-shadow'].includes('--qd-shadow-overlay'));
  let iconStroke;
  baseline.walkRules(rule => {
    if (!rule.selector.startsWith('.stroke-\\[')) return;
    rule.walkDecls('stroke-width', decl => { iconStroke = decl.value; });
  });
  assert.equal(iconStroke, 'var(--qd-nav-icon-stroke)');
});

test('real auth, ribbon, shell and chart recipes read shared foundation parameters after Tailwind layering', () => {
  for (const [selector, property, token] of [
    ['.qm-auth', 'background', '--qd-auth-background'],
    ['.qm-auth-card', 'padding', '--qd-auth-card-padding'],
    ['.qm-auth-card', 'background', '--qd-auth-surface'],
    ['.qm-auth-form-inner', 'max-width', '--qd-auth-form-width'],
    ['.qm-auth-headline', 'font-size', '--qd-auth-title-size'],
    ['.qm-ribbon-1', 'animation', '--qd-ribbon-duration-1'],
    ['.qm-main-band', 'height', '--qd-main-band-height'],
    ['.qm-app-main', 'scroll-padding-top', '--qd-main-band-height'],
    ['.qm-command-input', 'height', '--qd-control-height'],
    ['.qm-chart-label', 'font-size', '--qd-chart-label-size'],
  ]) assert.ok(declarations(baseline, selector)[property]?.includes(token), `${selector} ${property} must retain ${token}`);
  assert.equal(declarations(baseline, ':root')['--qd-root-size'], '16px');
  assert.equal(declarations(baseline, ':root')['--qd-auth-shadow'], 'none');
  assert.equal(declarations(baseline, '.qm-auth-card::after').display, 'var(--qd-auth-card-corner-display)');
});
