import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mapping = JSON.parse(readFileSync(resolve(root, 'patterns/react-icons.json'), 'utf8'));
const check = process.argv.includes('--check');
const outputs = new Map();
const hashes = {};
outputs.set('_icon.tsx', readFileSync(resolve(root, 'patterns/react-icon.tsx'), 'utf8'));
outputs.set('LICENSE', readFileSync(resolve(root, 'vendor/phosphor/LICENSE'), 'utf8'));
for (const [name, source] of Object.entries(mapping)) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || !/^[a-z][a-z-]*$/.test(source)) throw new Error(`Invalid icon ${name}`);
  const svg = readFileSync(resolve(root, `vendor/phosphor/regular/${source}.svg`), 'utf8');
  if (!svg.includes('viewBox="0 0 256 256"') || /<(script|foreignObject|image|use|style)\b|\bon\w+\s*=|\bhref\s*=|<!DOCTYPE|<!ENTITY/i.test(svg)) throw new Error(`Unsafe SVG: ${source}`);
  const body = svg.replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  // Official Regular assets contain only paths. Fail closed if upstream changes their shape.
  if (!/^(?:<path\s+d="[^"]+"\s*\/>\s*)+$/.test(body)) throw new Error(`Unsupported SVG shape: ${source}`);
  outputs.set(`${name}.tsx`, `'use client';\n\n// Generated from Phosphor ${source} (Regular), MIT. See LICENSE.\nimport { createIcon } from './_icon';\n\nexport const ${name} = createIcon('${source}', <>${body}</>);\n`);
  hashes[name] = { source, sha256: createHash('sha256').update(svg).digest('hex') };
}
outputs.set('manifest.json', JSON.stringify(hashes, null, 2) + '\n');
for (const [file, content] of outputs) {
  const path = resolve(root, 'dist/react-icons', file);
  if (check) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) throw new Error(`Out of date: ${path}`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}
console.log(`${check ? 'Verified' : 'Built'} ${Object.keys(mapping).length} direct React icon modules.`);
