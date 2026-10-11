import { createHash } from 'node:crypto';
import { relative } from 'node:path';

export const slash = value => value.replace(/\\/g, '/');
export const isTestSource = path => /(?:^|\/)__tests__(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/.test(slash(path));
export const keyframesIn = text => [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map(match => match[1]);

// Ownership is established by the export map, never by a filename prefix.
export function centralOutputs(parts, product, productRoot) {
  return parts.flatMap(part => {
    const destination = part.to[product];
    if (!destination) return [];
    const path = slash(relative(productRoot, destination));
    if (path === '..' || path.startsWith('../') || /^[A-Za-z]:/.test(path)) throw new Error(`Export is outside product root: ${destination}`);
    return [{ ...part, path }];
  });
}

export function copiedBody(text, lang = 'css') {
  const mark = text.indexOf('q-design-nav-sha256:');
  if (mark < 0) return text;
  if (lang === 'html') {
    const end = text.indexOf('-->', mark);
    return end < 0 ? text : text.slice(end + 3).replace(/^\r?\n/, '');
  }
  if (lang === 'ts') {
    const end = text.indexOf('// q-design-header-end', mark);
    if (end < 0) return text;
    const newline = text.indexOf('\n', end);
    return newline < 0 ? '' : text.slice(newline + 1);
  }
  const end = text.indexOf('*/', mark);
  return end < 0 ? text : text.slice(end + 2).replace(/^\r?\n/, '');
}

export function canonicalBody(part, source) {
  return part.lang !== 'ts' && part.layer !== false ? `@layer components {\n${source}}\n` : source;
}

const normalize = value => value.replace(/\r\n/g, '\n');
const digest = value => createHash('sha256').update(value).digest('hex');

export function copyProblems(part, source, copy) {
  if (source === null) return ['canonical source missing'];
  if (copy === null) return ['product copy missing'];
  const expected = canonicalBody(part, source);
  const body = copiedBody(copy, part.lang);
  const marker = copy.match(/q-design-nav-sha256:\s*([a-f0-9]{64})\b/)?.[1];
  const problems = [];
  if (normalize(body) !== normalize(expected)) problems.push('canonical body differs');
  // Git autocrlf may change line endings without changing the authored content.
  const hashes = new Set([expected, normalize(expected), normalize(expected).replace(/\n/g, '\r\n')].map(digest));
  if (!marker || !hashes.has(marker)) problems.push('canonical fingerprint differs');
  return problems;
}

// Only the Vite build directory is generated. Fixtures and screenshots stay in scope.
export const isCompiledWorkbench = path => /^preview\/components(?:\/|$)/.test(slash(path));
