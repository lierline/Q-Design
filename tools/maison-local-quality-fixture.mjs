// Completes one synthetic local audit fixture. No remote mode or policy changes.
import { readFileSync,writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname,resolve,join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const raw=readFileSync(resolve(root,'../Q-Works/.env.local'),'utf8');
const match=/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/m.exec(raw);
const url=new URL(match[1].trim().replace(/^["']|["']$/g,''));
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='54331')throw Error('Only isolated local Maison on54331 is allowed');
if(process.argv.slice(2).some(arg=>arg!=='--write'))throw Error('Unknown argument');
const id='8f51c824-0dca-4a07-9dbe-907cbff20185';
const email='qd-audit-quality@q-maison.local';
if(!process.argv.includes('--write')){console.log(JSON.stringify({origin:url.origin,database:'supabase_db_q-works',id,email,field:'job_title',before:null,after:'quality_manager',mode:'dry-run'}));process.exit(0);}
const sql=`BEGIN;
SELECT id FROM public.users WHERE id='${id}' AND email='${email}' FOR UPDATE;
DO $fixture$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.users u WHERE u.id='${id}' AND u.email='${email}' AND u.is_active=true AND u.job_title IS NULL AND u.job_rank IS NULL AND EXISTS(SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND r.code='Quality_Manager');
 IF n<>1 THEN RAISE EXCEPTION 'Exact synthetic fixture preconditions did not match one row'; END IF;
END $fixture$;
SELECT json_build_object('phase','before','id',id,'email',email,'job_title',job_title,'job_rank',job_rank,'is_active',is_active,'quality_manager_seat',public.is_quality_manager(id)) FROM public.users WHERE id='${id}' AND email='${email}';
DO $fixture$
DECLARE n integer;
BEGIN
 UPDATE public.users SET job_title='quality_manager' WHERE id='${id}' AND email='${email}' AND is_active=true AND job_title IS NULL AND job_rank IS NULL;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Expected exactly one fixture update'; END IF;
 IF NOT public.is_quality_manager('${id}'::uuid) THEN RAISE EXCEPTION 'Quality seat verification failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id='${id}' AND email='${email}' AND job_title='quality_manager' AND job_rank IS NULL AND is_active=true) THEN RAISE EXCEPTION 'Unexpected fixture result'; END IF;
END $fixture$;
SELECT json_build_object('phase','after','id',id,'email',email,'job_title',job_title,'job_rank',job_rank,'is_active',is_active,'quality_manager_seat',public.is_quality_manager(id)) FROM public.users WHERE id='${id}' AND email='${email}';
COMMIT;`;
// ON_ERROR_STOP terminates the session before COMMIT on any error; PostgreSQL
// rolls back the open transaction. The advisory evidence never includes secrets.
const output=execFileSync('docker',['exec','-i','supabase_db_q-works','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});
const states=output.split(/\r?\n/).filter(s=>s.startsWith('{')).map(JSON.parse);
if(states.length!==2||states[0].phase!=='before'||states[1].phase!=='after'||states[1].quality_manager_seat!==true)throw Error('Unexpected committed fixture evidence');
const report={version:1,completedAt:new Date().toISOString(),origin:url.origin,applicationOrigin:'http://127.0.0.1:3601',database:'local Docker supabase_db_q-works',scope:'One pre-existing synthetic local quality audit account; only job_title was explicitly updated. Existing application audit triggers remain active. No real account, role, department, policy, auth credential or remote database changed.',transaction:'Exact identity and precondition checks, row lock, exactly one UPDATE, quality seat verification, then COMMIT. Any SQL error before COMMIT aborts and rolls back.',states,next:'Use normal password login and inspect /recalls/new without submitting the business form.'};
writeFileSync(join(root,'reviews/maison-pages-quality-fixture.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
