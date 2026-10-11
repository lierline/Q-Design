// One dedicated local audit role, assigned to one synthetic account only.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const env=readFileSync(resolve(root,'../Q-Works/.env.local'),'utf8');
const url=new URL(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/m.exec(env)[1].trim().replace(/^["']|["']$/g,''));
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='54331')throw Error('Only local Maison54331 is allowed');
if(process.argv.slice(2).some(a=>a!=='--write'))throw Error('Unknown argument');
const account='8f51c824-0dca-4a07-9dbe-907cbff20185',tenant='d72cf6bb-2485-43b5-8f3f-8c126cf7b7c7',role='8cd431d1-3ed2-446b-ac9c-682de2b64b69',code='qd_audit_recall_form';
const scope={origin:url.origin,account,tenant,role,code,permissions:['recalls:read','recalls:create'],mode:process.argv.includes('--write')?'write':'dry-run'};
if(scope.mode==='dry-run'){console.log(JSON.stringify(scope));process.exit(0);}
const fingerprint=`jsonb_build_object(
 'roles',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'')) FROM public.roles t WHERE id<>'${role}'),
 'rolePermissions',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY role_id,permission_id)::text,'')) FROM public.role_permissions t WHERE role_id<>'${role}'),
 'userRoles',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY user_id,role_id)::text,'')) FROM public.user_roles t WHERE role_id<>'${role}'),
 'users',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'')) FROM public.users t))`;
const sql=`BEGIN;
SELECT id FROM public.users WHERE id='${account}' AND email='qd-audit-quality@q-maison.local' FOR UPDATE;
CREATE TEMP TABLE fixture_before ON COMMIT DROP AS SELECT ${fingerprint} AS value;
DO $fixture$
DECLARE n integer;
BEGIN
 IF (SELECT count(*) FROM public.users WHERE id='${account}' AND email='qd-audit-quality@q-maison.local' AND tenant_id='${tenant}' AND job_title='quality_manager' AND is_active=true)<>1 THEN RAISE EXCEPTION 'Exact account mismatch'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id='${account}' AND r.code='Quality_Manager') THEN RAISE EXCEPTION 'Existing quality role missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.roles WHERE id='${role}' OR code='${code}') THEN RAISE EXCEPTION 'Dedicated role already exists'; END IF;
 IF (SELECT count(*) FROM public.permissions WHERE code IN ('recalls:read','recalls:create'))<>2 THEN RAISE EXCEPTION 'Exact permission set missing'; END IF;
 INSERT INTO public.roles(id,tenant_id,code,name,description,is_system) VALUES('${role}','${tenant}','${code}','로컬 검수 전용 회수 양식','Isolated local synthetic fixture. Read and create only; never approve.',false);
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'Expected one new role'; END IF;
 INSERT INTO public.role_permissions(role_id,permission_id) SELECT '${role}',id FROM public.permissions WHERE code IN ('recalls:read','recalls:create');
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>2 THEN RAISE EXCEPTION 'Expected two permission links'; END IF;
 INSERT INTO public.user_roles(user_id,role_id) VALUES('${account}','${role}');
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'Expected one account link'; END IF;
 IF (SELECT count(*) FROM public.user_roles WHERE role_id='${role}')<>1 OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE role_id='${role}' AND user_id='${account}') THEN RAISE EXCEPTION 'Dedicated role assigned to another account'; END IF;
 IF (SELECT array_agg(p.code ORDER BY p.code) FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id='${role}')<>ARRAY['recalls:create','recalls:read']::text[] THEN RAISE EXCEPTION 'Unexpected permission set'; END IF;
 IF (SELECT value FROM fixture_before) IS DISTINCT FROM ${fingerprint} THEN RAISE EXCEPTION 'Existing shared role, permission, user link or user changed'; END IF;
END $fixture$;
SELECT json_build_object('roleId',r.id,'code',r.code,'tenantId',r.tenant_id,'isSystem',r.is_system,'userId',ur.user_id,'permissions',(SELECT json_agg(p.code ORDER BY p.code) FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=r.id),'existingStateUnchanged',true) FROM public.roles r JOIN public.user_roles ur ON ur.role_id=r.id WHERE r.id='${role}';
COMMIT;`;
const out=execFileSync('docker',['exec','-i','supabase_db_q-works','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});
const states=out.split(/\r?\n/).filter(s=>s.startsWith('{')).map(JSON.parse);
if(states.length!==1||states[0].userId!==account||states[0].existingStateUnchanged!==true)throw Error('Unexpected committed evidence');
const report={version:1,completedAt:new Date().toISOString(),...scope,database:'local Docker supabase_db_q-works',applicationOrigin:'http://127.0.0.1:3601',before:{dedicatedRoleExists:false,recallRolePermissions:[],sameTenantAsDev:true,qualitySeat:true,departmentMenuSource:'department-unset: normal full write default'},after:states[0],transaction:'Exact local origin, identity and tenant preconditions; one dedicated non-system role, two read/create permission links, one synthetic account link. Fingerprints verify every existing role, role permission, user role and public user is unchanged. Any SQL error terminates before COMMIT and rolls back.',scopeNote:'No approve permission, no existing shared role changes, no real user changes, no RLS or application guard changes, no remote database and no business form submission.',next:'Reload using normal synthetic quality login and inspect /recalls/new. Do not submit.'};
writeFileSync(resolve(root,'reviews/maison-pages-recall-role-fixture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
