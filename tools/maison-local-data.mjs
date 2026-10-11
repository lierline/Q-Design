import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = resolve(root, '../Q-Works');
const config = readFileSync(join(product, '.env.local'), 'utf8');
const raw = /^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/m.exec(config)?.[1].trim().replace(/^["']|["']$/g, '');
const target = new URL(raw);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '54331') throw new Error('Maison audit requires its named local Supabase stack on54331');
const query = sql => execFileSync('docker', ['exec', '-i', 'supabase_db_q-works', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], { input: sql, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const catalog = JSON.parse(query(`SELECT coalesce(json_agg(t),'[]') FROM (
  SELECT c.table_name, json_agg(json_build_object('name',c.column_name,'type',c.udt_name) ORDER BY c.ordinal_position) AS columns
  FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name
  WHERE c.table_schema='public' AND t.table_type IN ('BASE TABLE','VIEW') GROUP BY c.table_name
) t;`));
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const requested = new Set(JSON.parse(readFileSync(join(root, 'reviews/maison-pages-inventory.json'), 'utf8')).routes.flatMap(route => [...route.directTables, ...route.dependencyTables]));
// Capture record identifiers/status only. Names, emails, content, credentials and
// personal data are unnecessary for choosing a concrete route.
const tables = catalog.filter(table => requested.has(table.table_name) && table.columns.some(column => column.name === 'id'));
const statements = tables.map(table => {
  const columns = table.columns.filter(column => column.type === 'uuid' || ['status', 'state', 'approval_status', 'review_kind', 'risk_status', 'is_active', 'must_change_password'].includes(column.name)).map(column => quote(column.name));
  if (!columns.includes('"id"')) columns.unshift('"id"');
  const active = table.columns.some(column => column.name === 'deleted_at') ? ' WHERE deleted_at IS NULL' : '';
  const name = table.table_name.replaceAll("'", "''");
  return `SELECT jsonb_build_object('table','${name}','count',(SELECT count(*) FROM public.${quote(table.table_name)}${active}),'rows',coalesce((SELECT jsonb_agg(r) FROM (SELECT ${columns.join(',')} FROM public.${quote(table.table_name)}${active} ORDER BY (id::text LIKE '5a3b1e00-%') DESC,id LIMIT 12) r),'[]'));`;
});
const rows = query('BEGIN READ ONLY;\n' + statements.join('\n') + '\nROLLBACK;').split(/\r?\n/).filter(line => line.startsWith('{')).map(JSON.parse);
const temp = resolve(root, '../tmp/maison-pages-audit');
mkdirSync(temp, { recursive: true });
writeFileSync(join(temp, 'local-records.json'), JSON.stringify({ source: 'local Docker supabase_db_q-works, read-only transaction', capturedAt: new Date().toISOString(), tables: rows }, null, 2) + '\n');
console.log(JSON.stringify({ queriedTables: rows.length, populatedTables: rows.filter(row => row.count > 0).length, emptyTables: rows.filter(row => row.count === 0).map(row => row.table) }, null, 2));
