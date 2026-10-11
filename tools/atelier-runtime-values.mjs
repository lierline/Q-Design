import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The numeric UI contract is declarative JSON objects with TypeScript const assertions. */
export function readRuntimeValues(root) {
  const source = readFileSync(join(root, 'source/design/atelier-runtime.ts'), 'utf8');
  const result = {};
  for (const match of source.matchAll(/export const (BP|LAYOUT|ICON|QDRuntime|QDPresentation|Z) = (\{[\s\S]*?\}) as const;/g)) {
    if (result[match[1]]) throw new Error(`Duplicate runtime group: ${match[1]}`);
    result[match[1]] = JSON.parse(match[2]);
  }
  const finite = (value, path) => {
    if (Array.isArray(value) && path.startsWith('QDPresentation.')) {
      if (!value.length) throw new Error(`Empty presentation array: ${path}`);
      value.forEach((child, index) => finite(child, `${path}.${index}`));
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) finite(child, `${path}.${key}`);
    } else if (path.startsWith('QDPresentation.') && typeof value === 'string' && value.length > 0) return;
    else if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Invalid numeric runtime value: ${path}`);
  };
  for (const name of ['BP', 'LAYOUT', 'ICON', 'QDRuntime']) {
    if (!result[name]) throw new Error(`Missing runtime group: ${name}`);
    finite(result[name], name);
  }
  if (result.QDPresentation) finite(result.QDPresentation, 'QDPresentation');
  if (result.Z) finite(result.Z, 'Z');
  return result;
}

/** Read an explicitly named generated-CSS recipe without executing TypeScript. */
export function readRuntimeTemplate(root, name) {
  if (!/^[A-Za-z][\w]*$/.test(name)) throw new Error('Invalid runtime recipe name');
  const source = readFileSync(join(root, 'source/design/atelier-runtime.ts'), 'utf8');
  const match = source.match(new RegExp('export function '+name+'\\([^)]*\\): string \\{ return `([\\s\\S]*?)`; \\}'));
  if (!match) throw new Error(`Missing canonical CSS recipe: ${name}`);
  return match[1];
}

/** Preserve probe syntax while resolving presentation values from the current central source. */
export function normalizeRuntimeReferences(text, root) {
  if (!/\b(?:QDRuntime|QDPresentation)\./.test(text)) return text;
  const values = readRuntimeValues(root);
  return text.replace(/\b(?:QDRuntime|QDPresentation)(?:\.[a-zA-Z_][\w]*|\[(?:[\d.]+|['"][\w.-]+['"])\]){2,}/g, expression => {
    const keys = [expression.match(/^\w+/)[0], ...[...expression.matchAll(/\.([a-zA-Z_][\w]*)|\[([\d.]+|['"][\w.-]+['"])\]/g)].map(match => match[1] ?? match[2].replace(/^['"]|['"]$/g, ''))];
    const value = keys.reduce((node, key) => node?.[key], values);
    if (typeof value === 'number') return String(value);
    if (keys[0] === 'QDPresentation' && typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
    if (keys[0] === 'QDPresentation' && value && typeof value === 'object') return JSON.stringify(value);
    throw new Error(`Unknown numeric runtime adapter: ${expression}`);
  });
}

/** Typography defaults are a JSON-only export. Read the canonical module, never a historical fallback. */
export function normalizeTypographyReferences(text, root) {
  if (!/\bQDText\./.test(text)) return text;
  const source = readFileSync(join(root, 'patterns/foundation/atelier-labels.ts'), 'utf8');
  const match = source.match(/export const QDText = (\{[\s\S]*?\}) as const;/);
  if (!match) throw new Error('Canonical typography object missing');
  const values = JSON.parse(match[1]);
  return text.replace(/\bQDText(?:\.[a-zA-Z_][\w]*){2,}/g, expression => {
    const value = expression.split('.').slice(1).reduce((node, key) => node?.[key], values);
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string') return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
    throw new Error(`Unknown typography adapter: ${expression}`);
  });
}

/** Media queries cannot consume CSS custom properties. Compile their named numeric inputs. */
export function resolveAtelierMedia(css, values) {
  return css.replace(/qd-bp\(([\w-]+)\)/g, (_, name) => {
    const below = name.endsWith('-max');
    const key = below ? name.slice(0, -4) : name;
    const value = values.BP[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 1) throw new Error(`Unknown or invalid central breakpoint: ${name}`);
    return `${value - (below ? 1 : 0)}px`;
  });
}
