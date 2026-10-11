import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const ROOT = 'D:/Claude/DHR';
const OUT = 'D:/Claude/Q-Design/reviews';
const state = JSON.parse(fs.readFileSync('D:/Claude/tmp/qd-carnet-pages/private-state.json', 'utf8'));
const u = new URL(state.databaseUrl);
if (u.hostname !== '127.0.0.1' || u.port !== '55432' || u.pathname !== '/qd_carnet_visual') throw new Error('Isolated DB required');
const require = createRequire(path.join(ROOT, 'package.json'));
const pg = require('pg');
const db = new pg.Client({ connectionString: state.databaseUrl });
await db.connect();
const list = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => d.isDirectory() ? list(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const files = list(path.join(ROOT, 'app')).filter((f) => f.endsWith('.tsx'));
const sourcePath = (f) => path.relative(ROOT, f).replaceAll('\\', '/');
const routePath = (f) => '/' + sourcePath(f).split('/').slice(1, -1).filter((p) => !p.startsWith('(')).join('/');
const accessSource = fs.readFileSync(path.join(ROOT, 'lib/access.ts'), 'utf8');
const accessRows = [...accessSource.matchAll(/\{\s*group:\s*'([^']*)',\s*label:\s*'([^']*)',\s*path:\s*'([^']*)',\s*marks:\s*'([^']*)'\s*\}/g)]
  .map(([, group, label, route, marks]) => ({ group, label, route, marks }));
const pages = files.filter((f) => path.basename(f) === 'page.tsx').map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const route = routePath(file);
  return { route, source: sourcePath(file), kind: route.startsWith('/print/') ? 'print' : /\[/.test(route) ? 'dynamic' : 'screen',
    roleDeclaration: accessRows.find((r) => r.route === route) ?? null,
    redirects: [...source.matchAll(/redirect\((['"`])([^'"`]+)\1\)/g)].map((m) => m[2]),
    queryKeys: [...new Set([...source.matchAll(/\b(?:sp|params)\.([a-zA-Z][a-zA-Z0-9_]*)/g)].map((m) => m[1]))],
    browserStatus: 'pending', screenshot: null };
});
const states = files.map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const evidence = source.split(/\r?\n/).flatMap((line, i) => /<(Dialog|ActionSheet|Empty|Denied)|useDialog\(|useState|role="alert"/.test(line) ? [{ line: i + 1, text: line.trim() }] : []);
  return { source: sourcePath(file), evidence };
}).filter((r) => r.evidence.length);
const query = async (sql) => (await db.query(sql)).rows;
const fixtures = {
  users: await query(`select u.id,u.login_code,u.full_name,array_agg(r.role::text) roles from app_user u join user_role r on r.user_id=u.id where u.can_login and u.is_active group by u.id order by u.login_code`),
  workOrders: await query(`select id,batch_no,status::text from work_order order by issued_at desc`),
  materialLots: await query(`select id,lot_no from material_lot order by received_at desc limit 12`),
  productLots: await query(`select id,lot_no,work_order_id,status::text,qty_available from product_lot order by lot_no limit 12`),
  equipment: await query(`select id,code,name from equipment order by code`),
  dayRecords: await query(`select distinct work_order_id,day_no,worker_id from process_record order by work_order_id,day_no limit 12`),
  printStates: await query(`select kind::text,count(*)::int from record_print group by kind order by kind`),
};
await db.end();
fs.mkdirSync(OUT, { recursive: true });
const report = { generatedAt: new Date().toISOString(), product: 'Q-Carnet', baseUrl: state.baseUrl,
  isolation: { host: u.hostname, port: Number(u.port), database: u.pathname.slice(1), syntheticOnly: true },
  roleOrder: ['SYS_ADMIN','PROD_MGR','WORKER','QP','VIEWER'], pageCount: pages.length,
  accessScreenCount: accessRows.length, pages, runtimeBoundaries: files.filter((f) => /\/(loading|error|not-found)\.tsx$/.test(f.replaceAll('\\','/'))).map(sourcePath), states, fixtures };
fs.writeFileSync(path.join(OUT, 'carnet-pages-inventory.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, accessScreens: accessRows.length, stateSources: states.length, fixtures: Object.fromEntries(Object.entries(fixtures).map(([k,v]) => [k,v.length])) }, null, 2));
