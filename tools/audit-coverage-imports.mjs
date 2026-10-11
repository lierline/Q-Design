import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { posix } from 'node:path';

const require = createRequire(new URL('../../Q-Works/package.json', import.meta.url));
const postcss = require('postcss');

// Q-Works is a valid pipeline target. Its HSL channel palette is checked by the
// palette/component gates, not by the older HEX-only product coverage list.
export const COLOR_AUDIT_TARGETS = ['Q-Atelier', 'Q-Works', 'Q-Forge', 'Q-Sonar', 'MedQraft 문서', 'MedQraft 홈'];

export const HEXRE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
export const normHex = value => {
  let hex = value.slice(1).toLowerCase();
  if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
  return '#' + hex.slice(0, 6);
};
export const colorSet = texts => new Set([...texts].flatMap(text => (text.match(HEXRE) ?? []).map(normHex)));

// Only outgoing, authored canonical patterns supplement dist. Mirrored source/
// files must never prove their own extraction completeness.
export function canonicalPatternPaths(parts) {
  return [...new Set(parts.filter(part => Object.keys(part.to ?? {}).length)
    .map(part => checkedPath(part.src)).filter(path => path.startsWith('patterns/')))];
}

export function parseCoverageArgs(args) {
  const onlyArgs = args.filter(arg => arg.startsWith('--only='));
  const positional = args.filter(arg => !arg.startsWith('--'));
  if (onlyArgs.length > 1 || positional.length > 1 || args.some(arg => arg.startsWith('--') && !arg.startsWith('--only='))) {
    throw new Error('Use audit-coverage.mjs [Q-Atelier path] [--only=product,product].');
  }
  let only = null;
  if (onlyArgs.length) {
    const names = onlyArgs[0].slice('--only='.length).split(',').map(value => value.trim());
    if (names.some(name => !name || !COLOR_AUDIT_TARGETS.includes(name)) || new Set(names).size !== names.length) {
      throw new Error('Invalid or duplicate --only target. Allowed: ' + COLOR_AUDIT_TARGETS.join(', '));
    }
    only = new Set(names);
  }
  return { source: positional[0] ?? 'D:/Claude/Q-Atelier', only };
}

function checkedPath(path) {
  if (typeof path !== 'string' || !path || /[\\\0]/.test(path) || path.startsWith('/') || /^[a-zA-Z][\w+.-]*:/.test(path)) {
    throw new Error('CSS import is not a repository-relative path: ' + path);
  }
  const normalized = posix.normalize(path);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new Error('CSS import escapes repository: ' + path);
  }
  return normalized;
}

function localImport(from, params) {
  // Imports may have a trailing layer/supports/media condition. Only their
  // first literal URL is relevant to reachability, regardless of that condition.
  const match = /^\s*(?:(["'])([^]*?)\1|url\(\s*(?:(["'])([^]*?)\3|([^\s()"']+))\s*\))/i.exec(params);
  if (!match) throw new Error(`Unsupported CSS import in ${from}: ${params}`);
  const value = match[2] ?? match[4] ?? match[5];
  if (/^(?:https?:|data:|\/\/)/i.test(value)) return null;
  if (/[\\\0]/.test(value) || value.startsWith('/') || /^[a-zA-Z][\w+.-]*:/.test(value)) {
    throw new Error(`Unsafe CSS import in ${from}: ${value}`);
  }
  let path;
  try { path = decodeURIComponent(value.split(/[?#]/, 1)[0]); }
  catch { throw new Error(`Invalid CSS import URL in ${from}: ${value}`); }
  if (!path) throw new Error(`Empty CSS import in ${from}`);
  if (/[\\\0]/.test(path) || path.startsWith('/') || /^[a-zA-Z][\w+.-]*:/.test(path)) {
    throw new Error(`Unsafe CSS import in ${from}: ${value}`);
  }
  // Tailwind and other bare package imports are not committed local CSS files.
  if (!path.startsWith('.') && !/\.css$/i.test(path)) return null;
  return checkedPath(posix.join(posix.dirname(from), path));
}

export function committedCssText(repo, path) {
  const target = checkedPath(path);
  const result = spawnSync('git', ['-C', repo, 'show', 'HEAD:' + target], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Cannot read committed CSS ${target}: ${(result.stderr || result.error?.message || 'git show failed').trim().slice(0, 300)}`);
  return result.stdout;
}

export function committedCssGraph(repo, entries, read = committedCssText) {
  const files = new Map();
  const visit = (requested, importer) => {
    const path = checkedPath(requested);
    if (files.has(path)) return;
    let text;
    try { text = read(repo, path); }
    catch (error) { throw new Error(`${error.message}${importer ? ` (imported from ${importer})` : ''}`); }
    if (typeof text !== 'string') throw new Error(`Missing committed CSS ${path}${importer ? ` (imported from ${importer})` : ''}`);
    // Mark before following imports so cycles and diamond graphs read once.
    files.set(path, text);
    const css = postcss.parse(text, { from: path });
    css.walkAtRules(/^import$/i, rule => {
      const dependency = localImport(path, rule.params);
      if (dependency !== null) visit(dependency, path);
    });
  };
  entries.forEach(path => visit(path));
  return files;
}
