// Server-rendered route/role verification only. This is not a visual pass.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const DIR = 'D:/Claude/Q-Design/reviews';
const inventory = JSON.parse(fs.readFileSync(`${DIR}/carnet-pages-inventory.json`, 'utf8'));
const state = JSON.parse(fs.readFileSync('D:/Claude/tmp/qd-carnet-pages/private-state.json', 'utf8'));
if (new URL(state.baseUrl).hostname !== '127.0.0.1' || new URL(state.databaseUrl).port !== '55432') throw new Error('Local audit only');
process.env.SESSION_SECRET = state.sessionSecret;
const { sessionCookie, visibleText } = await import(pathToFileURL('D:/Claude/DHR/scripts/session-cookie.mjs'));
const users = Object.fromEntries(inventory.fixtures.users.flatMap((u) => u.roles.map((r) => [r,u])));
users.WORKER = inventory.fixtures.users.find((u) => u.login_code === '200100');
const f = inventory.fixtures;
const active = f.workOrders.find((w) => w.status === 'IN_PROCESS') ?? f.workOrders[0];
const completed = f.workOrders.find((w) => w.status === 'DONE') ?? f.workOrders[1];
const day = f.dayRecords.find((r) => r.work_order_id === completed.id) ?? f.dayRecords[0];
const material = f.materialLots[0], product = f.productLots[0], equipment = f.equipment[0];
const releaseLot = f.productLots.find((p) => p.work_order_id === completed.id && Number(p.qty_available) > 0);
const dynamic = {
  '/production/[id]': `/production/${active.id}`,
  '/work/[id]': `/work/${active.id}`,
  '/trace/[kind]/[id]': `/trace/batch/${completed.id}`,
  '/print/work-order/[id]': `/print/work-order/${completed.id}`,
  '/print/cover/[id]': `/print/cover/${completed.id}`,
  '/print/label-request/[id]': `/print/label-request/${completed.id}`,
  '/print/release-request/[id]': `/print/release-request/${completed.id}?sel=${releaseLot.id}:1`,
  '/print/day-record/[id]/all': `/print/day-record/${completed.id}/all`,
  '/print/day-record/[id]/[day]/[worker]': `/print/day-record/${day.work_order_id}/${day.day_no}/${day.worker_id}`,
  '/print/label/[id]': `/print/label/${material.id}`,
  '/print/equipment-log/[id]': `/print/equipment-log/${equipment.id}`,
};
const cases = inventory.pages.map((p) => ({ sourceRoute: p.route, route: dynamic[p.route] ?? p.route,
  role: p.route.startsWith('/work') ? 'WORKER' : p.route === '/login' ? 'anonymous' : 'SYS_ADMIN',
  state: 'default', source: p.source }));
cases.push(
  { route: `/production/${completed.id}`, role: 'SYS_ADMIN', state: 'completed-batch' },
  { route: `/work/${completed.id}`, role: 'WORKER', state: 'completed-batch' },
  { route: `/trace/material/${material.id}`, role: 'SYS_ADMIN', state: 'material-genealogy' },
  { route: `/trace/product/${product.id}`, role: 'SYS_ADMIN', state: 'product-genealogy' },
  { route: '/production?status=CANCELLED', role: 'SYS_ADMIN', state: 'empty-filter' },
  { route: '/material?q=VISUAL_AUDIT_NO_MATCH', role: 'SYS_ADMIN', state: 'empty-search' },
  { route: '/settings/items?q=VISUAL_AUDIT_NO_MATCH', role: 'SYS_ADMIN', state: 'empty-search' },
  { route: '/work?scan=VISUAL_AUDIT_NO_MATCH', role: 'WORKER', state: 'unmatched-scan' },
  { route: '/trace?q=VISUAL_AUDIT_NO_MATCH', role: 'SYS_ADMIN', state: 'unmatched-trace' },
  { route: '/trace/verify?q=VISUAL_AUDIT_NO_MATCH', role: 'SYS_ADMIN', state: 'unmatched-print' },
  { route: '/settings/users', role: 'QP', state: 'permission-denied' },
  { route: '/board/cost', role: 'VIEWER', state: 'viewer-read-only' },
  { route: '/production', role: 'QP', state: 'quality-read-only' },
  { route: '/qd-audit-missing-page', role: 'SYS_ADMIN', state: 'not-found' },
);
async function probe(c) {
  const response = await fetch(state.baseUrl + c.route, { redirect: 'manual', headers: c.role === 'anonymous' ? {} : { cookie: sessionCookie(users[c.role].id) } });
  const html = await response.text();
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  const redirect = response.headers.get('location') ?? /<meta id="__next-page-redirect"[^>]*content="\d+;url=([^"]+)"/.exec(html)?.[1] ?? null;
  const headings = [...stripped.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map((m) => visibleText(m[1]));
  const text = visibleText(stripped);
  const outcome = redirect ? 'redirect' : /data-denied/.test(stripped) ? 'denied' : /data-next-error|<nextjs-portal|NEXT_HTTP_ERROR_FALLBACK;500/.test(html) ? 'render-error' : response.status === 404 ? 'not-found' : response.status !== 200 ? `http-${response.status}` : headings.length ? 'server-rendered' : 'shell-only';
  return { ...c, url: state.baseUrl + c.route, httpStatus: response.status, outcome, redirect, headings,
    expectedBodyIndicators: headings.slice(0,4), bodyExcerpt: text.slice(0,1300),
    visualStatus: 'pending', screenshot: null };
}
const routeResults = [];
for (const c of cases) { const r = await probe(c); routeResults.push(r); console.log(`${r.role} ${r.route}: ${r.outcome} ${r.headings[0] ?? ''}`); }
const roleResults = process.argv.includes('--routes-only') ? JSON.parse(fs.readFileSync(`${DIR}/carnet-pages-http.json`, 'utf8')).roleResults : [];
for (const [index, role] of (process.argv.includes('--routes-only') ? [] : inventory.roleOrder.entries())) {
  for (const p of inventory.pages.filter((p) => p.roleDeclaration)) {
    const r = await probe({ route: p.route, role });
    const expected = { '●': 'server-rendered', X: 'denied', '-': 'redirect' }[p.roleDeclaration.marks[index]];
    roleResults.push({ role, route: p.route, expected, outcome: r.outcome, matches: expected === r.outcome, redirect: r.redirect });
  }
  console.log(`Role ${role}: ${roleResults.filter((r) => r.role === role && r.matches).length}/32 match`);
}
const report = { generatedAt: new Date().toISOString(), baseUrl: state.baseUrl, isolation: inventory.isolation,
  note: 'HTTP evidence only. Browser screenshots and visible human review remain required.',
  routeResults, roleResults, failedRoles: roleResults.filter((r) => !r.matches) };
fs.writeFileSync(`${DIR}/carnet-pages-http.json`, JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(`${DIR}/carnet-pages-manifest.json`, JSON.stringify({ generatedAt: report.generatedAt, baseUrl: state.baseUrl,
  login: { path: '/login', codes: Object.fromEntries(Object.entries(users).map(([r,u]) => [r,u.login_code])),
    pinLocation: 'D:/Claude/tmp/qd-carnet-pages/private-state.json: demoPin (local synthetic fixture only)' },
  pages: routeResults.map(({ bodyExcerpt,...r }) => r) },null,2)+'\n');
console.log(JSON.stringify({ cases: routeResults.length, roleChecks: roleResults.length, failedRoles: report.failedRoles.length }));
