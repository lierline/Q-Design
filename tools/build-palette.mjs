import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const THEMES = ['dark', 'light'];
const HEX = /^#[0-9a-f]{6}$/i;
const CUSTOM_PROPERTY = /^--[A-Za-z][\w-]*$/;
const fail = message => { throw new Error(`Palette: ${message}`); };
const keys = (value, allowed, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label}: unknown key ${key}`);
};
const safe = (value, label) => {
  if (typeof value !== 'string' || !value.trim() || /[;{}@\r\n]/.test(value) || /(?:url|var)\s*\(/i.test(value)) fail(`${label}: unsafe CSS value`);
  return value;
};
const rgb = value => {
  if (!HEX.test(value)) fail(`expected six-digit hex, got ${value}`);
  return [1, 3, 5].map(index => parseInt(value.slice(index, index + 2), 16));
};
const hex = channels => '#' + channels.map(value => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => hex(rgb(a).map((value, index) => value + (rgb(b)[index] - value) * t));
const luminance = color => rgb(color).map(value => value / 255).map(value => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);

// Channel-only output is required by Maison hsl(var(--token) / <alpha-value>).
export function hexToHsl(value) {
  const [r, g, b] = rgb(value).map(channel => channel / 255);
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), delta = hi - lo;
  const lightness = (hi + lo) / 2;
  let hue = 0, saturation = 0;
  if (delta) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    hue = 60 * (hi === r ? ((g - b) / delta) % 6 : hi === g ? (b - r) / delta + 2 : (r - g) / delta + 4);
    if (hue < 0) hue += 360;
  }
  const number = value => Number(value.toFixed(6));
  return `${number(hue)} ${number(saturation * 100)}% ${number(lightness * 100)}%`;
}

// Same contrast and mixing rules as Carnet lib/tone.ts. The parity test guards
// this owned default recipe; custom manufacturer colors still use tone.ts.
export function carnetBrand(color, theme, { darkCanvas, darkSurface, lightSurface, minimumContrast }) {
  let base = color;
  const background = theme === 'dark' ? darkCanvas : lightSurface;
  const target = theme === 'dark' ? '#ffffff' : '#000000';
  if (contrast(base, background) < minimumContrast) {
    base = target;
    for (let t = .05; t <= 1; t += .05) {
      const next = mix(color, target, t);
      if (contrast(next, background) >= minimumContrast) { base = next; break; }
    }
  }
  return theme === 'dark' ? {
    brand: base, deep: mix(base, '#ffffff', .18), mid: mix(base, '#000000', .18),
    soft: mix(base, darkCanvas, .92), tint: mix(base, darkSurface, .88),
    line: mix(base, darkSurface, .62), pale: mix(base, darkSurface, .38),
  } : {
    brand: base, deep: mix(base, '#000000', .28), mid: mix(base, '#ffffff', .22),
    soft: mix(base, '#ffffff', .94), tint: mix(base, '#ffffff', .91),
    line: mix(base, '#ffffff', .7), pale: mix(base, '#ffffff', .45),
  };
}

function buildPaletteOutputs(tokens, mappings, overrides) {
  keys(mappings, ['version', 'products'], 'mappings');
  keys(overrides, ['version', 'description', 'shared', 'products', 'carnetBrand', 'carnetPlatform'], 'overrides');
  if (mappings.version !== 1 || overrides.version !== 1) fail('unsupported schema version');
  keys(mappings.products, ['atelier', 'maison', 'carnet'], 'products');
  keys(overrides.products, ['atelier', 'maison', 'carnet'], 'product overrides');
  for (const product of ['atelier', 'maison', 'carnet']) {
    if (!mappings.products[product] || !overrides.products[product]) fail(`missing product ${product}`);
  }
  keys(overrides.shared, THEMES, 'shared overrides');
  const palette = {};
  for (const theme of THEMES) {
    palette[theme] = { ...tokens.color[theme] };
    for (const [key, value] of Object.entries(overrides.shared[theme])) {
      if (!(key in palette[theme])) fail(`unknown shared token ${theme}.${key}`);
      safe(value, key);
      if (HEX.test(palette[theme][key]) && !HEX.test(value)) fail(`${key} must remain a six-digit hex color`);
      palette[theme][key] = value;
    }
    for (const [foreground, minimum] of [['text', 4.5], ['subtle', 4.5], ['muted', 4.5], ['ctl', 3]]) {
      for (const background of ['bg', 'surface', 'surface2']) {
        const ratio = contrast(palette[theme][`--qa-${foreground}`], palette[theme][`--qa-${background}`]);
        if (ratio < minimum) fail(`${theme} ${foreground}/${background} contrast ${ratio.toFixed(2)} < ${minimum}`);
      }
    }
    const actionContrast = contrast(palette[theme]['--qa-on-accent'], palette[theme]['--qa-champagne']);
    if (actionContrast < 4.5) fail(`${theme} action text contrast ${actionContrast.toFixed(2)} < 4.5`);
  }
  for (const [product, values] of Object.entries(overrides.products)) {
    keys(values, THEMES, `${product} exceptions`);
    for (const theme of THEMES) for (const [name, value] of Object.entries(values[theme])) safe(value, `${product}.${theme}.${name}`);
  }
  const usedExceptions = new Set();
  function resolveValue(spec, theme, product) {
    keys(spec, ['token', 'theme', 'exception', 'brand', 'runtime', 'format'], `${product} mapping`);
    if (['token', 'exception', 'brand'].filter(key => key in spec).length !== 1) fail('each mapping needs exactly one source');
    if (spec.theme && !THEMES.includes(spec.theme)) fail(`unknown theme ${spec.theme}`);
    const sourceTheme = spec.theme ?? theme;
    let value;
    if (spec.token) {
      value = palette[sourceTheme][spec.token];
      if (!value) fail(`unknown token ${sourceTheme}.${spec.token}`);
    } else if (spec.exception) {
      value = overrides.products[product]?.[sourceTheme]?.[spec.exception];
      if (!value) fail(`unknown exception ${product}.${sourceTheme}.${spec.exception}`);
      usedExceptions.add(`${product}.${sourceTheme}.${spec.exception}`);
    } else {
      value = brands[sourceTheme][spec.brand];
      if (!value) fail(`unknown brand step ${spec.brand}`);
    }
    safe(value, 'resolved value');
    if (spec.format && spec.format !== 'hsl') fail(`unknown format ${spec.format}`);
    if (spec.format === 'hsl') value = hexToHsl(value);
    if (spec.runtime) {
      if (!CUSTOM_PROPERTY.test(spec.runtime)) fail('invalid runtime property');
      value = `var(${spec.runtime}, ${value})`;
    }
    return value;
  }
  keys(overrides.carnetBrand, ['source', 'darkCanvas', 'darkSurface', 'lightSurface', 'minimumContrast', 'note'], 'Carnet brand recipe');
  const recipe = overrides.carnetBrand;
  if (!(recipe.minimumContrast >= 4.5 && recipe.minimumContrast <= 21)) fail('brand minimum contrast must be 4.5..21');
  const brandColor = resolveValue(recipe.source, 'dark', 'carnet');
  const context = {
    darkCanvas: resolveValue(recipe.darkCanvas, 'dark', 'carnet'),
    darkSurface: resolveValue(recipe.darkSurface, 'dark', 'carnet'),
    lightSurface: resolveValue(recipe.lightSurface, 'light', 'carnet'),
    minimumContrast: recipe.minimumContrast,
  };
  const brands = Object.fromEntries(THEMES.map(theme => [theme, carnetBrand(brandColor, theme, context)]));
  const outputs = {};
  for (const [product, map] of Object.entries(mappings.products)) {
    keys(map, ['selectors', 'copyTokens', 'variables', 'printVariables', 'note'], `${product} config`);
    keys(map.selectors, THEMES, `${product} selectors`);
    keys(map.variables, THEMES, `${product} variables`);
    if (map.copyTokens !== undefined && typeof map.copyTokens !== 'boolean') fail('copyTokens must be boolean');
    const lines = [
      '/* Generated by tools/build-palette.mjs. Edit patterns/palette-overrides.json.',
      '   The committed token snapshot remains the baseline. Screen only; paper keeps its own palette.',
      '   Unlayered html:root selectors outrank legacy root values without !important. */',
      '@media screen {',
    ];
    for (const theme of THEMES) {
      if (!/^html:root(?::not\([^{}]+\)|\[[^{}]+\]|\.dark)$/.test(map.selectors[theme])) fail('unsafe or insufficiently specific selector');
      const declarations = map.copyTokens ? { ...palette[theme] } : {};
      for (const [property, spec] of Object.entries(map.variables[theme])) {
        if (!CUSTOM_PROPERTY.test(property)) fail(`invalid property ${property}`);
        declarations[property] = resolveValue(spec, theme, product);
      }
      lines.push(`  ${map.selectors[theme]} {`);
      for (const [property, value] of Object.entries(declarations)) lines.push(`    ${property}: ${value};`);
      lines.push('  }');
    }
    lines.push('}');
    // Legacy Maison utilities formerly contained literals, including in print.
    // Preserve those fixed-theme baseline values without applying screen overrides.
    if (map.printVariables) {
      lines.push('@media print {', '  :root {');
      for (const [property, spec] of Object.entries(map.printVariables)) {
        keys(spec, ['token', 'theme', 'format'], 'print mapping');
        if (!CUSTOM_PROPERTY.test(property) || !THEMES.includes(spec.theme)) fail('invalid print mapping');
        let value = tokens.color[spec.theme][spec.token];
        if (!value) fail(`unknown print token ${spec.token}`);
        safe(value, 'print value');
        if (spec.format !== 'hsl') fail('print legacy channels require HSL');
        value = hexToHsl(value);
        lines.push(`    ${property}: ${value};`);
      }
      lines.push('  }', '}');
    }
    lines.push('');
    outputs[product] = lines.join('\n');
  }
  for (const [product, values] of Object.entries(overrides.products)) {
    for (const theme of THEMES) for (const name of Object.keys(values[theme])) {
      if (!usedExceptions.has(`${product}.${theme}.${name}`)) fail(`unused exception ${product}.${theme}.${name}`);
    }
  }
  keys(overrides.carnetPlatform, ['themeColor', 'note'], 'Carnet platform');
  if (!HEX.test(overrides.carnetPlatform.themeColor)) fail('Carnet platform themeColor must be a six-digit hex color');
  const runtime = '/* Generated by tools/build-palette.mjs. Edit patterns/palette-overrides.json. */\n'
    + 'export const CARNET_PALETTE = ' + JSON.stringify({ ...context, defaultBrandColor: brandColor, themeColor: overrides.carnetPlatform.themeColor }, null, 2) + ' as const;\n';
  return { css: outputs, runtime };
}

export const buildPalettes = (...args) => buildPaletteOutputs(...args).css;
export const buildCarnetPaletteRuntime = (...args) => buildPaletteOutputs(...args).runtime;

export function readInputs(root = ROOT) {
  const read = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
  return [read('dist/q-design.tokens.json'), read('patterns/palette-mappings.json'), read('patterns/palette-overrides.json')];
}

export function stalePalettes(outputs, root = ROOT) {
  return Object.entries(outputs).filter(([product, css]) => {
    try { return readFileSync(join(root, `dist/q-design.palette.${product}.css`), 'utf8').replaceAll('\r\n', '\n') !== css; }
    catch { return true; }
  }).map(([product]) => product);
}

function main() {
  const check = process.argv.includes('--check');
  const built = buildPaletteOutputs(...readInputs());
  const outputs = built.css;
  const stale = check ? stalePalettes(outputs) : [];
  for (const [product, css] of Object.entries(outputs)) {
    const path = join(ROOT, `dist/q-design.palette.${product}.css`);
    if (check) {
      if (stale.includes(product)) console.error(`Stale palette: ${path}`);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, css);
    }
  }
  const runtimePath = join(ROOT, 'dist/q-design.palette.carnet.ts');
  if (check) {
    let actual;
    try { actual = readFileSync(runtimePath, 'utf8').replaceAll('\r\n', '\n'); } catch { /* Missing output is stale. */ }
    if (actual !== built.runtime) { stale.push('carnet runtime'); console.error(`Stale palette: ${runtimePath}`); }
  } else writeFileSync(runtimePath, built.runtime);
  if (stale.length) process.exitCode = 1;
  else console.log(`Palette ${check ? 'check' : 'build'}: ${Object.keys(outputs).length} products, dark and light`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
