// Normal local authentication and GET requests only. Browser evidence remains separate.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(root, '../Q-Atelier/package.json'));
const { createServerClient } = require('@supabase/ssr');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(readFileSync(resolve(root, '../Q-Atelier/.env.development.local'), 'utf8')
  .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).replace(/^["']|["']$/g, '')];
  }));
const authURL = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
if (!['127.0.0.1', 'localhost'].includes(authURL.hostname) || authURL.port !== '54321') throw new Error('Only the existing local Atelier stack on 54321 is allowed');
const admin = createClient(authURL.href, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const origin = 'http://127.0.0.1:3600';
const targets = JSON.parse(readFileSync(join(root, 'reviews/atelier-pages-inventory.json'), 'utf8'))
  .flatMap(item => (item.dynamic ? item.urls : [origin + item.route]).map(url => ({ ...item, url: new URL(url, origin).href })));
const output = join(root, 'reviews/atelier-pages-http.json');
const results = existsSync(output) ? JSON.parse(readFileSync(output, 'utf8')).results : [];
const done = new Set(results.filter(row => row.outcome === 'rendered-response').map(row => row.requestURL + '|' + row.role));
const sessions = new Map();
async function cookieFor(role) {
  if (role === 'anonymous') return '';
  if (!['owner', 'admin', 'expert'].includes(role)) throw new Error('Unexpected inventory role');
  if (!sessions.has(role)) sessions.set(role, (async () => {
    const email = `${role}@q-atelier.local`;
    const users = await admin.auth.admin.listUsers();
    if (users.error || !users.data.users.some(user => user.email === email)) throw new Error('Existing local fixture account required');
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (link.error) throw new Error(`Local magiclink failed: ${link.error.status}`);
    let jar = [];
    const client = createServerClient(authURL.href, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
      getAll: () => jar,
      setAll: items => { for (const item of items) { jar = jar.filter(cookie => cookie.name !== item.name); jar.push(item); } },
    } });
    const verified = await client.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
    if (verified.error) throw new Error(`Normal local authentication failed: ${verified.error.status}`);
    return jar.map(item => `${item.name}=${item.value}`).join('; ');
  })());
  return sessions.get(role);
}
const captured = new Set();
const localKey = (url, role) => new URL(url).pathname + new URL(url).search + '|' + role;
const screenDir = join(root, 'reviews/atelier-pages/screens');
if (existsSync(screenDir)) for (const file of readdirSync(screenDir).filter(file => file.endsWith('.json'))) {
  const record = JSON.parse(readFileSync(join(screenDir, file), 'utf8'));
  if (record.actualURL === record.url && !/(페이지를 찾을 수 없습니다|접근 권한이 없습니다)/.test(record.body ?? '')) captured.add(localKey(record.url, record.role));
}
const selectedRoute = process.argv.find(arg => arg.startsWith('--route='))?.slice('--route='.length);
// One cold compilation at a time while CUA is active. Owner business pages take priority.
const pending = targets.filter(target => selectedRoute ? target.route === selectedRoute
  : target.role === 'owner' && !done.has(target.url + '|' + target.role) && !captured.has(localKey(target.url, target.role)));
let cursor = 0;
const save = () => writeFileSync(output, JSON.stringify({ updatedAt: new Date().toISOString(), origin,
  scope: 'Normal local auth and backend GET response checks with cold compilation. No browser rendering or visual compliance is asserted.',
  skippedExistingCUAEvidence: captured.size, results }, null, 2) + '\n');
const clean = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
async function worker() {
  while (cursor < pending.length) {
    const target = pending[cursor++];
    if (new URL(target.url).origin !== origin) throw new Error('Unexpected audit origin');
    const started = Date.now();
    let row = { route: target.route, requestURL: target.url, role: target.role };
    try {
      const cookie = await cookieFor(target.role);
      const response = await fetch(target.url, { headers: cookie ? { cookie } : {}, redirect: 'manual', signal: AbortSignal.timeout(90000) });
      const html = await response.text();
      const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
      const title = clean(/<title[^>]*>([\s\S]*?)<\/title>/.exec(markup)?.[1] ?? '');
      const headings = [...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(match => clean(match[1]));
      const errorText = /(페이지를 찾을 수 없습니다|접근 권한이 없습니다)/.exec(headings.join(' '))?.[1]
        ?? /(Application error:|Internal Server Error)/.exec(clean(markup))?.[1] ?? null;
      row = { ...row, status: response.status, location: response.headers.get('location'), title, headings, errorText, bytes: Buffer.byteLength(html),
        outcome: response.status >= 300 && response.status < 400 ? 'redirect' : response.status >= 400 || errorText ? 'error-response' : 'rendered-response' };
    } catch (error) { row = { ...row, outcome: 'request-error', error: error.name + ': ' + error.message }; }
    row.elapsedMs = Date.now() - started; row.checkedAt = new Date().toISOString();
    const old = results.findIndex(item => item.requestURL === row.requestURL && item.role === row.role);
    if (old >= 0) results[old] = row; else results.push(row);
    save(); console.log(JSON.stringify({ route: row.route, status: row.status, outcome: row.outcome, elapsedMs: row.elapsedMs }));
  }
}
console.log(JSON.stringify({ pending: pending.length, skippedCUA: captured.size, concurrency: 1 }));
await worker(); save();
