import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = resolve(root, '../Q-Works');
const inventory = JSON.parse(readFileSync(join(root, 'reviews/maison-pages-inventory.json'), 'utf8'));
const local = JSON.parse(readFileSync(resolve(root, '../tmp/maison-pages-audit/local-records.json'), 'utf8'));
const records = new Map(local.tables.map(table => [table.table, table]));
const fixturePath=join(root,'reviews/maison-pages-fixtures.json');
const fixture=existsSync(fixturePath)?JSON.parse(readFileSync(fixturePath,'utf8')):null;
// Parent-record identity is explicit. A checklist/report route takes the parent
// plan ID, even when its first query happens to read a child table.
const parentTables = {
  '/audits/': 'audits', '/capa/plans/': 'capa_plans', '/change-requests/': 'change_requests',
  '/complaints/': 'complaints', '/concessions/': 'concessions', '/contracts/': 'contract_reviews',
  '/customer/surveys/': 'customer_satisfaction_surveys', '/design/changes/': 'design_changes',
  '/design/programs/': 'rnd_programs', '/design/': 'design_projects', '/document-dispatch/': 'doc_dispatch_requests',
  '/documents/distribution/disposals/': 'document_disposals', '/documents/distribution/': 'document_transfers',
  '/documents/external/': 'external_documents', '/documents/': 'documents', '/drawings/': 'drawings',
  '/equipment/': 'equipment', '/improvements/': 'improvements', '/inbound/': 'customer_inbounds',
  '/inspections/': 'inspections', '/knowledge/': 'knowledge_items', '/kpi/evaluations/': 'monitoring_plans',
  '/kpi/': 'kpis', '/meetings/': 'meetings', '/nc/': 'nonconformities', '/notices/': 'notices',
  '/objectives/': 'quality_objectives', '/production/': 'production_records', '/purchasing/orders/': 'purchase_orders',
  '/purchasing/quotes/': 'purchase_quotes', '/purchasing/specs/': 'purchase_specs', '/purchasing/': 'purchase_requests',
  '/qc-charts/': 'qc_charts', '/recalls/': 'recalls', '/returns/': 'customer_returns',
  '/reviews/agendas/': 'review_agendas', '/risks/': 'risk_register', '/safety/incidents/': 'safety_incidents',
  '/safety/': 'environment_checks', '/settings/audit-logs/': 'audit_logs', '/shipping/': 'shipment_approvals',
  '/specs/': 'product_barcodes', '/store/': 'store_sales', '/suppliers/reports/': 'supplier_evaluation_reports',
  '/suppliers/': 'suppliers', '/traceability/': 'item_codes', '/training/plans/': 'training_plans',
  '/training/': 'trainings', '/warehouses/': 'warehouses',
};
const orderedPrefixes = Object.keys(parentTables).sort((a, b) => b.length - a.length);
const kinds = { contracts: ['review', 'change'], nc: ['occurrence', 'disposition'], risks: ['plan', 'report'] };
const targets = inventory.routes.map(route => {
  const source = readFileSync(join(product, route.file), 'utf8');
  const title = /metadata\s*:\s*Metadata\s*=\s*\{\s*title:\s*"([^"]+)"/.exec(source)?.[1] ?? null;
  const visibleText = [...source.matchAll(/<(?:PageHead|h1)\b[^>]*\btitle="([^"]+)"/g)].map(match => match[1]);
  const parentPrefix = orderedPrefixes.find(prefix => route.route.startsWith(prefix));
  const table = route.dynamicParameters.length ? parentTables[parentPrefix] ?? null : null;
  const rows = table ? records.get(table)?.rows ?? [] : [];
  const candidates = [];
  const stateOf = record => Object.fromEntries(Object.entries(record).filter(([key]) => /status$|^state$|^review_kind$/.test(key)));
  if (!route.dynamicParameters.length) candidates.push({ path: route.route, recordState: null });
  else for (const record of rows) {
    if (!record.id) continue;
    const printKinds = route.dynamicParameters.includes('kind') ? kinds[route.domain] ?? [] : [null];
    for (const kind of printKinds) {
      if (record.review_kind && kind && record.review_kind !== kind) continue;
      candidates.push({ path: route.route.replace('[id]', String(record.id)).replace('[kind]', kind), recordState: stateOf(record) });
    }
  }
  // Edit routes need a draft. Detail/print routes prefer submitted/approved data.
  // Keep other states separately; an expected business redirect is never a screen pass.
  const draft = candidate => /^(draft|rejected)$/i.test(candidate.recordState?.approval_status ?? candidate.recordState?.status ?? '');
  candidates.sort((a,b)=>(Number(draft(a))-Number(draft(b)))*(route.kind==='edit'?-1:1));
  const blocked = route.dynamicParameters.length && !candidates.length ? `No active local ${table ?? 'mapped parent table'} record` : null;
  return {
    route: route.route, file: route.file, role: route.route==='/change-initial-password'?'Viewer': ['(auth)', '(legal)'].includes(route.group) ? 'anonymous' : 'SaaS_Admin',
    account: route.route==='/change-initial-password'?'qd-audit-initial@q-maison.local': ['(auth)', '(legal)'].includes(route.group)?null:'dev@q-maison.local',
    group: route.group, domain: route.domain, kind: route.kind,
    url: candidates[0] ? 'http://127.0.0.1:3601' + candidates[0].path : null,
    expected: { pathname: candidates[0]?.path ?? null, titleIncludes: title, visibleTextAny: visibleText,
      requireBusinessMain: route.group === '(app)' && route.route !== '/change-initial-password',
      rejectLoginRedirect: route.group === '(app)' || route.group === '(floor)',
      rejectDeniedMenu: true, rejectNotFound: true,
      note: route.route==='/change-initial-password'?'Requires the dedicated initial account. An established user redirecting to dashboard does not verify this screen.':route.kind === 'print' ? 'Draft/unsupported form redirects must be recorded as gated, never as print-screen pass.' : null },
    parentTable: table, availableRecords: records.get(table)?.count ?? null,
    stateVariants: candidates.map(candidate => ({ url: 'http://127.0.0.1:3601' + candidate.path, recordState: candidate.recordState })),
    candidateStates: route.candidateStates, sourcePermissions: route.permissions,
    loadingFiles: route.loading, errorFiles: route.errors,
    status: blocked ? 'blocked-local-data' : 'ready-for-real-browser', blocked,
    evidence: [],
  };
});
const report = { generatedAt: new Date().toISOString(), sourceSnapshotAt: local.capturedAt,
  environment: { origin: 'http://127.0.0.1:3601', database: 'local Docker supabase_db_q-works', role: 'SaaS_Admin', account: 'dev@q-maison.local', auth: 'normal password login, no bypass', changes: fixture?`${fixture.rows} additive local synthetic records and six dedicated normal-auth accounts; existing records and users unchanged.`:'Read-only database inspection; no seed mutations yet.', fixtureEvidence:fixture?'reviews/maison-pages-fixtures.json':null,roleEvidence:'reviews/maison-pages-accounts.json' },
  summary: { total: targets.length, ready: targets.filter(target => target.url).length, blocked: targets.filter(target => !target.url).length },
  targets };
writeFileSync(join(root, 'reviews/maison-pages-targets.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report.summary, blockers: targets.filter(target => !target.url).map(target => ({ route: target.route, table: target.parentTable })) }, null, 2));
