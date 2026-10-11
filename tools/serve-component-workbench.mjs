import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspace = resolve(root, '..');
const products = { atelier: 'Q-Atelier', maison: 'Q-Works', carnet: 'DHR' };
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const port = Number(process.env.QD_AUDIT_PORT || 4818);
createServer((request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const assets = path.match(/^\/product-assets\/(atelier|maison|carnet)\/(.*)$/);
    const base = assets ? join(workspace, products[assets[1]], 'public') : root;
    const file = resolve(base, '.' + (assets ? '/' + assets[2] : path));
    if (relative(base, file).startsWith('..')) { response.writeHead(403); response.end(); return; }
    const full = existsSync(file) && statSync(file).isDirectory() ? join(file, 'index.html') : file;
    if (!existsSync(full)) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(readFileSync(full));
  } catch { response.writeHead(400); response.end('Bad request'); }
}).listen(port, '127.0.0.1', () => console.log(`Component workbench: http://127.0.0.1:${port}/preview/components/atelier/`));
