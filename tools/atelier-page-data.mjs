import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomBytes, randomUUID } from 'node:crypto';
const require = createRequire('D:/Claude/Q-Atelier/package.json');
const { createClient } = require('@supabase/supabase-js');
const ts = require('typescript');
const env = Object.fromEntries(readFileSync('D:/Claude/Q-Atelier/.env.development.local', 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).replace(/^["']|["']$/g, '')]; }));
const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.port !== '54321') throw new Error('Only the existing Q-Atelier local sandbox is allowed');
const client = createClient(url.href, env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
if (process.argv[2] === 'create-preview-invite') {
  // One explicit user-authorized, local-only synthetic invitation. Never send or claim it.
  const privatePath = 'D:/Claude/tmp/atelier-private-invite-preview.json';
  let fixture;
  if (existsSync(privatePath)) fixture = JSON.parse(readFileSync(privatePath, 'utf8'));
  else {
    fixture = { id: randomUUID(), token: randomBytes(24).toString('base64url'), email: 'qd-design-invite@q-atelier.local', expiresAt: new Date(Date.now() + 86400000).toISOString() };
    writeFileSync(privatePath, JSON.stringify(fixture, null, 2));
  }
  if (fixture.email !== 'qd-design-invite@q-atelier.local' || !fixture.token) throw new Error('Unexpected private fixture identity');
  const prior = await client.from('expert_invite_tokens').select('id,invited_email').eq('id', fixture.id).maybeSingle();
  if (prior.error) throw prior.error;
  if (prior.data && prior.data.invited_email !== fixture.email) throw new Error('Existing invite identity mismatch');
  if (!prior.data) {
    const admin = await client.from('profiles').select('id').eq('email', 'admin@q-atelier.local').single();
    if (admin.error) throw admin.error;
    const inserted = await client.from('expert_invite_tokens').insert({ id: fixture.id, token: fixture.token, invited_name: 'QDesign 로컬 검수', invited_email: fixture.email, message: '로컬 UI 검수용 초대입니다.', expires_at: fixture.expiresAt, created_by: admin.data.id }).select('id').single();
    if (inserted.error || inserted.data.id !== fixture.id) throw inserted.error ?? new Error('Unexpected inserted invitation');
  }
  const result = await client.rpc('validate_expert_invite_token', { p_token: fixture.token });
  if (result.error || result.data?.[0]?.valid !== true) throw result.error ?? new Error('Normal invite validation failed');
  fixture.url = `http://localhost:3600/experts/portal?invite=${encodeURIComponent(fixture.token)}`;
  fixture.signupURL = `http://localhost:3600/experts/portal/signup?invite=${encodeURIComponent(fixture.token)}`;
  writeFileSync(privatePath, JSON.stringify(fixture, null, 2));
  const evidence = { id: fixture.id, email: fixture.email, origin: url.origin, expiresAt: fixture.expiresAt, validated: true, scope: 'One explicit user-authorized synthetic local invitation. No external send, signup, credential entry, account creation or invite claim.', createdAt: new Date().toISOString() };
  writeFileSync('D:/Claude/Q-Design/reviews/atelier-invite-preview-fixture.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence));
} else if (process.argv[2] === 'invite-preview') {
  const { data, error } = await client.from('expert_invite_tokens').select('id,token,invited_email,expires_at,revoked,used_at').eq('revoked', false).is('used_at', null);
  if (error) throw error;
  const valid = data.filter(row => (!row.expires_at || new Date(row.expires_at) > new Date()) && /@(q-atelier\.local|example\.com|example\.test)$/.test(row.invited_email ?? ''));
  if (!valid.length) throw new Error('No existing unused synthetic local invitation');
  const row = valid[0];
  writeFileSync('D:/Claude/tmp/atelier-private-invite-preview.json', JSON.stringify({ id: row.id, url: `http://localhost:3600/experts/portal?invite=${encodeURIComponent(row.token)}`, signupURL: `http://localhost:3600/experts/portal/signup?invite=${encodeURIComponent(row.token)}` }, null, 2));
  console.log(JSON.stringify({ existingSyntheticInvites: valid.length, selectedId: row.id, operation: 'read-only preview link prepared; no invite issued, claimed or sent' }));
} else if (process.argv[2] === 'login') {
  const role = process.argv[3] ?? 'owner';
  if (!['owner', 'admin', 'expert', 'ra', 'qa', 'rd', 'production', 'rejected', 'unassigned'].includes(role)) throw new Error('Unknown local fixture role');
  const fixtureAlias = { rejected: 'dnew3', unassigned: 'dnew7' };
  const email = `${fixtureAlias[role] ?? role}@q-atelier.local`;
  const existing = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing.error) throw new Error('Local account lookup failed: '+existing.error.message);
  if (!existing.data.users.some(user => user.email === email)) throw new Error('Existing local account required');
  const { data, error } = await client.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  // Ephemeral local login link only. Never store a service key in evidence.
  console.log(`http://127.0.0.1:3600/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink&next=${role === 'expert' ? '/experts/inbox' : '/dashboard'}`);
} else {
  // Source inventory is syntax based: comments and example strings are not queries.
  const tablesIn = (file, code) => {
    const found = new Set();
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = node => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
        && node.expression.name.text === 'from' && node.arguments.length
        && ts.isStringLiteralLike(node.arguments[0])
        && !(ts.isPropertyAccessExpression(node.expression.expression)
          && node.expression.expression.name.text === 'storage')) found.add(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(source);
    return [...found];
  };
  const primaryTables = {
    '/admin/eval-sets/': 'eval_datasets', '/assessments/': 'assessments',
    '/audits/': 'internal_audits', '/authorized-reps/': 'authorized_representatives',
    '/calibration/': 'calibration_runs', '/capa/': 'capa', '/cleanroom/': 'cleanroom_zones',
    '/clinical-evaluations/': 'clinical_evaluations', '/complaints/': 'complaints',
    '/contracts/': 'contract_reviews', '/customer-property/': 'customer_properties',
    '/device-licenses/': 'device_licenses', '/equipment/': 'measuring_equipment',
    '/eu-mdr/': 'eu_mdr_tech_docs', '/fda-510k/': 'fda_510k_submissions',
    '/feedback/': 'customer_feedback', '/inbox/': 'review_assignments',
    '/letter-to-file/': 'letter_to_file', '/lots/': 'lot_records',
    '/management-reviews/': 'management_reviews', '/nmpa/': 'nmpa_submissions',
    '/nonconformances/': 'nonconformances', '/pmda/': 'pmda_submissions', '/pms/': 'pms_reports',
    '/process-templates/': 'process_templates', '/process-validations/': 'process_validations',
    '/production-equipment/': 'production_equipment', '/quality-objectives/': 'quality_objectives',
    '/recalls/': 'recalls', '/research/': 'research_projects', '/standards/': 'standards_register',
    '/sterilization/': 'sterilization_validations', '/suppliers/': 'suppliers',
    '/training/courses/': 'training_courses', '/training/records/': 'training_records',
    '/udi/': 'udi_records', '/vigilance/': 'vigilance_reports', '/experts/inbox/': 'review_assignments',
  };
  const { data: profiles, error: profileError } = await client.from('profiles')
    .select('id,email').in('email', ['owner@q-atelier.local', 'expert@q-atelier.local', 'admin@q-atelier.local']);
  if (profileError) throw profileError;
  const ids = Object.fromEntries(profiles.map(profile => [profile.email.split('@')[0], profile.id]));
  if (!ids.owner || !ids.expert || !ids.admin) throw new Error('Existing owner, expert and admin fixtures required');
  const { data: memberships, error: membershipError } = await client.from('org_members')
    .select('org_id,role,status').eq('user_id', ids.owner).eq('status', 'active');
  if (membershipError) throw membershipError;
  const ownerMembership = memberships.filter(row => row.role === 'owner');
  if (ownerMembership.length !== 1) throw new Error('One unambiguous owner fixture organization required');
  const orgId = ownerMembership[0].org_id;
  const created = [];
  if (process.argv.includes('--seed')) {
    // Existing isolated localhost sandbox only. Insert missing draft fixtures, never update data.
    const missingFixtures = {
      authorized_representatives: { region: 'eu', rep_type: 'ec_rep', company_name: '디자인 검증용 대리인', status: 'pending' },
      cleanroom_zones: { zone_name: '디자인 검증용 구역', iso_class: 'iso7', occupancy_state: 'at_rest', status: 'qualification' },
      measuring_equipment: { name: '디자인 검증용 측정기', equipment_type: '온도계', status: 'active' },
      letter_to_file: { device_name: '디자인 검증용 기기', change_description: '로컬 화면 검증을 위한 초안입니다.', status: 'draft' },
      lot_records: { lot_number: 'QD-DESIGN-LOCAL-001', status: 'in_production', quantity: 1, uom: 'EA' },
      pmda_submissions: { device_name: '디자인 검증용 기기', device_class: 'ii', status: 'preparing' },
      process_templates: { process_name: '디자인 검증용 공정', params: [{ name: '온도', unit: '℃', min: 18, max: 25, decimals: 1 }], active: true },
      process_validations: { process_name: '디자인 검증용 공정', rationale: '로컬 화면 검증용 계획입니다.', status: 'planning' },
      suppliers: { name: '디자인 검증용 공급자', supplier_type: 'standard', approval_status: 'pending' },
    };
    for (const [table, values] of Object.entries(missingFixtures)) {
      const existing = await client.from(table).select('id').eq('org_id', orgId).limit(1);
      if (existing.error) throw new Error(`${table}: ${existing.error.message}`);
      if (existing.data.length) continue;
      const inserted = await client.from(table).insert({ org_id: orgId, code: 'QD-DESIGN-001', created_by: ids.owner, ...values })
        .select('id,code').single();
      if (inserted.error) throw new Error(`${table}: ${inserted.error.message}`);
      created.push({ table, ...inserted.data });
    }
    const createdPath = 'D:/Claude/tmp/atelier-created-page-fixtures.json';
    const previous = existsSync(createdPath) ? JSON.parse(readFileSync(createdPath, 'utf8')) : { orgId, created: [] };
    if (previous.orgId !== orgId) throw new Error('Fixture ledger belongs to a different local organization');
    writeFileSync(createdPath, JSON.stringify({ orgId, created: [...previous.created, ...created] }, null, 2) + '\n');
  }
  const routes = JSON.parse(readFileSync('D:/Claude/tmp/qa-business-routes-initial.json', 'utf8'));
  for (const item of routes) {
    if (item.route === '/page.tsx') item.route = '/';
    const code = readFileSync(`D:/Claude/Q-Atelier/${item.file}`, 'utf8');
    item.tables = tablesIn(item.file, code);
    item.dynamic = /\[/.test(item.route);
    item.role = item.route.startsWith('/admin') || item.route.startsWith('/calibration') ? 'admin'
      : item.route.startsWith('/experts') || item.route.startsWith('/inbox') ? 'expert' : 'owner';
    if (['/experts', '/inbox'].includes(item.route)) { item.role = 'owner'; item.roleEvidence = 'Company app layout redirects expert accounts to /experts/inbox. These two company screens require normal organization membership; /experts additionally checks isOrgOwner.'; }
    if (item.file.startsWith('app/(auth)/') || item.file.startsWith('app/(public)/')
      || ['/','/auth/reset','/experts/farewell','/experts/portal','/experts/portal/login','/experts/portal/forgot','/experts/portal/reset','/experts/portal/signup'].includes(item.route)) item.role = 'anonymous';
    if (item.route.startsWith('/calibration')) item.roleEvidence = 'app/(app)/calibration/layout.tsx: isActiveAdmin, otherwise redirect /dashboard';
    if (item.route.startsWith('/admin')) item.roleEvidence = 'app/(app)/admin/layout.tsx: isActiveAdmin, otherwise redirect /dashboard';
    if (item.route === '/onboarding') { item.role = 'unassigned'; item.roleEvidence = 'Existing local dnew7 account is active and has no organization membership. No role or membership is changed.'; }
    if (item.route === '/pending-approval') { item.role = 'rejected'; item.roleEvidence = 'Existing local dnew3 account has account_status=rejected. This route displays the rejected variant; no account status is changed.'; }
    if (item.dynamic) {
      item.primaryTable = Object.entries(primaryTables).find(([prefix]) => item.route.startsWith(prefix))?.[1];
      if (!item.primaryTable) throw new Error(`Unmapped dynamic page: ${item.route}`);
    }
  }
  const data = {};
  for (const table of new Set(routes.flatMap(item => [...item.tables, ...(item.primaryTable ? [item.primaryTable] : [])]))) {
    const result = await client.from(table).select('*').limit(100);
    data[table] = result.error ? { error: result.error.message } : result.data;
  }
  for (const item of routes.filter(route => route.dynamic)) {
    const all = data[item.primaryTable];
    if (!Array.isArray(all)) { item.dataError = all.error; item.urls = []; continue; }
    const candidates = all.filter(row => item.primaryTable === 'review_assignments' ? row.expert_id === ids.expert
      : row.org_id ? row.org_id === orgId : true);
    const row = candidates.find(row => row.code === 'QD-DESIGN-001') ?? candidates[0];
    item.evidence = 'Local data mapping only; browser rendering is verified separately.';
    if (!row) { item.dataError = 'No matching local role/organization record'; item.urls = []; continue; }
    item.record = { id: row.id, ...(row.code ? { code: row.code } : {}), ...(row.status ? { status: row.status } : {}) };
    const base = item.route.replace('[id]', encodeURIComponent(row.id)).replace('[code]', encodeURIComponent(row.code));
    const kinds = base.includes('/audits/') ? ['audit_plan', 'audit_checklist', 'audit_report']
      : ['mr_agenda', 'mr_minutes', 'mr_report'];
    item.urls = base.includes('[kind]') ? kinds.map(kind => base.replace('[kind]', kind))
      : base.includes('[which]') ? ['plan', 'report'].map(which => base.replace('[which]', which)) : [base];
    if (item.urls.some(route => route.includes('[') || route.includes('undefined'))) throw new Error(`Incomplete route: ${item.route}`);
  }
  writeFileSync('D:/Claude/tmp/atelier-local-page-data.json', JSON.stringify(data, null, 2));
  writeFileSync('D:/Claude/Q-Design/reviews/atelier-pages-inventory.json', JSON.stringify(routes, null, 2) + '\n');
  console.log(JSON.stringify({ routes: routes.length, dynamic: routes.filter(item => item.dynamic).length,
    mapped: routes.filter(item => item.dynamic && item.urls.length).length, concreteUrls: routes.flatMap(item => item.urls ?? []).length,
    missing: routes.filter(item => item.dynamic && !item.urls.length).map(item => ({ route: item.route, error: item.dataError })),
    created, queryErrors: Object.fromEntries(Object.entries(data).filter(([, rows]) => !Array.isArray(rows)).map(([table, result]) => [table, result.error])) }, null, 2));
}
