// Isolated actual-app visual audit. Never reads connection settings from env files.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = 'D:/Claude/DHR';
const OUT = 'D:/Claude/tmp/qd-carnet-pages';
const DB_DIR = path.join(OUT, 'postgres');
const PORT = 55432;
const APP_PORT = 3602;
const DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/qd_carnet_visual`;
if (new URL(DATABASE_URL).hostname !== '127.0.0.1' || path.dirname(DB_DIR) !== path.normalize(OUT)) throw new Error('Local isolation guard');
mkdirSync(OUT, { recursive: true });
const require = createRequire(path.join(ROOT, 'package.json'));
const EmbeddedPostgres = (await import(pathToFileURL(require.resolve('embedded-postgres')))).default;
const pg = require('pg');
const { hashPin } = await import(pathToFileURL(path.join(ROOT, 'scripts/pin.mjs')));
const statePath = path.join(OUT, 'private-state.json');
const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {
  databaseUrl: DATABASE_URL, baseUrl: `http://127.0.0.1:${APP_PORT}`,
  sessionSecret: randomBytes(32).toString('hex'), printSecret: randomBytes(32).toString('hex'),
  demoPin: String(Math.floor(Math.random() * 900000) + 100000), createdAt: new Date().toISOString(),
};
if (state.databaseUrl !== DATABASE_URL) {
  if (state.baseSeededAt || state.flowSeededAt) throw new Error('Saved connection does not match isolated database');
  state.databaseUrl = DATABASE_URL;
}
state.cronSecret ||= randomBytes(32).toString('hex');
writeFileSync(statePath, JSON.stringify(state, null, 2));
const env = { ...process.env, DATABASE_URL, MIGRATION_DATABASE_URL: DATABASE_URL,
  SESSION_SECRET: state.sessionSecret, PRINT_SECRET: state.printSecret, CRON_SECRET: state.cronSecret, DEMO_PIN: state.demoPin,
  PRINT_BASE: state.baseUrl, ALLOW_FROM: '', ALLOW_COUNTRY: '', ALLOW_REGION: '', ALLOW_CITY: '',
  SEED_DEMO_FORCE: '0', NEXT_TELEMETRY_DISABLED: '1', NODE_ENV: 'development' };
const pgServer = new EmbeddedPostgres({ databaseDir: DB_DIR, user: 'postgres', password: 'postgres',
  port: PORT, persistent: true, initdbFlags: ['--encoding=SQL_ASCII', '--no-locale', '--lc-messages=C'],
  onLog: (s) => { if (/FATAL|ERROR|PANIC|could not|Permission/i.test(s)) console.error(s); }, onError: console.error });
if (!existsSync(path.join(DB_DIR, 'PG_VERSION'))) await pgServer.initialise();
await pgServer.start();
console.log(`Isolated PostgreSQL started at 127.0.0.1:${PORT}`);
const admin = new pg.Client({ connectionString: DATABASE_URL.replace('/qd_carnet_visual', '/postgres') });
await admin.connect();
if (!(await admin.query("select 1 from pg_database where datname='qd_carnet_visual'")).rowCount) {
  await admin.query("create database qd_carnet_visual encoding 'UTF8' template template0 locale 'C'");
}
await admin.end();
const db = new pg.Client({ connectionString: DATABASE_URL });
await db.connect();
for (const file of readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  await db.query(readFileSync(path.join(ROOT, 'db/migrations', file), 'utf8'));
}
if (!(await db.query("select 1 from app_user where login_code='000000'")).rowCount) {
  const { rows } = await db.query(`insert into app_user(login_code,full_name,pin_hash,is_developer)
    values('000000','로컬 시각 감사 관리자',$1,true) returning id`, [await hashPin(state.demoPin)]);
  await db.query("insert into user_role(user_id,role) values($1,'SYS_ADMIN')", [rows[0].id]);
}
await db.end();
console.log('All local migrations applied');
async function seed(name) {
  const log = createWriteStream(path.join(OUT, `${name}.log`), { flags: 'a' });
  const child = spawn(process.execPath, [path.join(ROOT, 'scripts', `${name}.mjs`)], { cwd: ROOT, env, windowsHide: true });
  child.stdout.pipe(log); child.stderr.pipe(log);
  const code = await new Promise((resolve) => child.on('close', resolve));
  log.end();
  if (code) throw new Error(`${name} exited ${code}. See isolated audit log.`);
}
if (!state.baseSeededAt) { await seed('seed-demo'); state.baseSeededAt = new Date().toISOString(); writeFileSync(statePath, JSON.stringify(state, null, 2)); }
const nextLog = createWriteStream(path.join(OUT, 'next.log'), { flags: 'a' });
const next = spawn(process.execPath, [path.join(ROOT, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', String(APP_PORT)], { cwd: ROOT, env, windowsHide: true });
next.stdout.pipe(nextLog); next.stderr.pipe(nextLog);
let closing = false;
async function shutdown() { if (closing) return; closing = true; next.kill(); await pgServer.stop().catch(() => {}); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
next.on('close', async (code) => { console.log(`Next exited ${code}`); await shutdown(); });
let ready = false;
for (let attempt = 0; attempt < 120; attempt++) {
  try { const response = await fetch(`${state.baseUrl}/login`); if (response.ok) { ready = true; break; } } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) throw new Error('Local app did not become ready');
console.log(`Actual app ready at ${state.baseUrl}`);
if (!state.flowSeededAt) { await seed('seed-flow'); state.flowSeededAt = new Date().toISOString(); writeFileSync(statePath, JSON.stringify(state, null, 2)); }
console.log('Full local demo workflow seeded. Audit server remains running.');
await new Promise(() => {});
