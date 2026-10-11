import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export const FONT_FAMILIES = [
  { name: 'JetBrains Mono', q: 'JetBrains+Mono:wght@400;500;600;700', slug: 'jetbrains-mono', weights: ['400', '500', '600', '700'] },
  { name: 'Cormorant Garamond', q: 'Cormorant+Garamond:wght@400;500;600;700', slug: 'cormorant-garamond', weights: ['400', '500', '600', '700'] },
];
export const FONT_SUBSETS = ['latin', 'latin-ext'];
export const FONT_CACHE_PATH = 'patterns/font-cache.json';
const SOURCE = 'source/fonts/fonts.ts';
const CSS = 'dist/q-design.fonts.css';
const fail = message => { throw new Error(`Font cache: ${message}`); };
const sha = content => createHash('sha256').update(content).digest('hex');

export function assertWoff2(buffer, name) {
  if (buffer.length <= 1000 || buffer.subarray(0, 4).toString('latin1') !== 'wOF2'
      || buffer.readUInt32BE(8) !== buffer.length || buffer.readUInt32BE(16) === 0) {
    fail(`invalid or truncated WOFF2 ${name}`);
  }
}

// A changed source import, dynamic configuration, new weight, or italic request
// must be reviewed before this normal-only self-host package can be considered complete.
export function assertFontSource(source, families = FONT_FAMILIES, subsets = FONT_SUBSETS) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');
  const imports = [...code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g)];
  if (imports.length !== 1 || imports[0][1].trim() !== 'Cormorant_Garamond') fail('source font imports changed; update the self-host requirements');
  const call = /Cormorant_Garamond\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(code)?.[1];
  if (!call) fail('source font configuration is not a literal object');
  const readArray = name => {
    const value = new RegExp(`\\b${name}\\s*:\\s*\\[([^\\]]*)\\]`).exec(call)?.[1];
    if (!value || !/^\s*(['"][\w-]+['"]\s*,?\s*)+$/.test(value)) fail(`source ${name} must be a literal array`);
    return [...value.matchAll(/['"]([\w-]+)['"]/g)].map(match => match[1]);
  };
  const family = families.find(item => item.name === 'Cormorant Garamond');
  if (!family || readArray('weight').some(value => !family.weights.includes(value))) fail('source requests uncached Cormorant weight');
  if (readArray('subsets').some(value => !subsets.includes(value))) fail('source requests uncached subset');
  if (readArray('style').some(value => value !== 'normal')) fail('source requests italic; normal-only brand rule requires review');
}

export function inspectFontCache(root, { families = FONT_FAMILIES, subsets = FONT_SUBSETS, read = readFileSync } = {}) {
  const source = read(join(root, SOURCE), 'utf8');
  assertFontSource(source, families, subsets);
  const css = read(join(root, CSS), 'utf8');
  const expected = new Map([['PretendardVariable.woff2', { family: 'Pretendard Variable', weight: '45 920' }]]);
  for (const family of families) for (const weight of family.weights) for (const subset of subsets) {
    expected.set(`${family.slug}-${weight}-${subset}.woff2`, { family: family.name, weight, subset });
  }
  const found = new Set();
  const faces = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@font-face\s*\{([^}]+)\}/g)];
  const files = {};
  for (const [, body] of faces) {
    const get = property => new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();
    const sourceFile = /^url\(['"]?\.\.\/source\/fonts\/([\w.-]+\.woff2)['"]?\)\s+format\(['"]woff2(?:-variations)?['"]\)$/.exec(get('src') ?? '')?.[1];
    const wanted = expected.get(sourceFile);
    if (!wanted || found.has(sourceFile)) fail(`unexpected or duplicate cached face ${sourceFile ?? get('src')}`);
    if (get('font-family')?.replace(/^['"]|['"]$/g, '') !== wanted.family || get('font-weight') !== wanted.weight
        || get('font-style') !== 'normal' || get('font-display') !== 'swap') fail(`cached face requirements differ: ${sourceFile}`);
    if (wanted.subset && !/^U\+[0-9A-F?,-]+(?:\s*,\s*U\+[0-9A-F?,-]+)*$/i.test(get('unicode-range') ?? '')) fail(`missing unicode range: ${sourceFile}`);
    const buffer = read(join(root, 'source/fonts', sourceFile));
    assertWoff2(buffer, sourceFile);
    files[sourceFile] = { bytes: buffer.length, sha256: sha(buffer) };
    found.add(sourceFile);
  }
  const missing = [...expected.keys()].filter(name => !found.has(name));
  if (missing.length) fail(`missing cached faces: ${missing.join(', ')}`);
  return {
    version: 1,
    note: 'Explicit offline cache for fetch-fonts.mjs. Refreshed only after a complete online build. Changed requirements or source need review and a fresh build.',
    requirementsSha256: sha(JSON.stringify({ families, subsets })),
    source: { path: SOURCE, sha256: sha(source.replaceAll('\r\n', '\n')) },
    stylesheet: { path: CSS, sha256: sha(css.replaceAll('\r\n', '\n')) },
    files,
  };
}

export function verifyFontCache(root, options = {}) {
  const read = options.read ?? readFileSync;
  let stored;
  try { stored = JSON.parse(read(join(root, FONT_CACHE_PATH), 'utf8')); }
  catch { fail('manifest missing or invalid; run the online font build before using --offline'); }
  const actual = inspectFontCache(root, options);
  if (stored.version !== actual.version || stored.requirementsSha256 !== actual.requirementsSha256) fail('download requirements changed; offline reuse refused');
  if (stored.source?.sha256 !== actual.source.sha256) fail('source font declaration changed; offline reuse refused');
  if (stored.stylesheet?.sha256 !== actual.stylesheet.sha256) fail('cached font CSS changed; offline reuse refused');
  if (JSON.stringify(stored.files) !== JSON.stringify(actual.files)) fail('cached WOFF2 contents changed; offline reuse refused');
  return { faces: Object.keys(actual.files).length, bytes: Object.values(actual.files).reduce((sum, file) => sum + file.bytes, 0) };
}
