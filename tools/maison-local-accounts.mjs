// Normal invitation-triggered accounts for a local real-screen audit. No remote mode.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const env=Object.fromEntries(readFileSync(resolve(root,'../Q-Works/.env.local'),'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('#')&&line.includes('=')).map(line=>{const n=line.indexOf('=');return[line.slice(0,n).trim(),line.slice(n+1).trim().replace(/^["']|["']$/g,'')];}));
const url=new URL(env.NEXT_PUBLIC_SUPABASE_URL);
if(!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='54331')throw new Error('Only local Maison Supabase on54331 is allowed.');
if(!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Local admin credential missing.');
if(process.argv.slice(2).some(arg=>arg!=='--write'))throw new Error('Use --write to create dedicated local accounts.');
const specs=[['viewer','Viewer',false],['operator','Operator',false],['reviewer','Reviewer',false],['quality','Quality_Manager',false],['executive','Executive',false],['initial','Viewer',true]];
if(!process.argv.includes('--write')){console.log('Dry run:6 dedicated local normal-auth accounts; existing users unchanged.');process.exit(0);}
const query=sql=>execFileSync('docker',['exec','-i','supabase_db_q-works','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'}).trim();
const ids=JSON.parse(query("SELECT json_build_object('tenant',(SELECT id FROM public.tenants LIMIT 1),'department',(SELECT id FROM public.departments WHERE code='CO' LIMIT 1));"));
if(!ids.tenant||!ids.department)throw new Error('Local seed tenant/department missing.');
const accounts=[];
for(const [slug,role,initial]of specs){
  const email=`qd-audit-${slug}@q-maison.local`;
  const exists=query(`SELECT id FROM public.users WHERE email='${email}';`);
  if(exists){accounts.push({email,role,initial,status:'already present, unchanged'});continue;}
  const roleId=query(`SELECT id FROM public.roles WHERE code='${role}';`);
  if(!/^[\da-f-]{36}$/i.test(roleId))throw new Error('Missing expected local role '+role);
  const code='QDLOCAL'+randomUUID().replaceAll('-','').slice(0,10).toUpperCase();
  query(`INSERT INTO public.invitations(id,tenant_id,code,role_id,department_id,email,expires_at) VALUES(gen_random_uuid(),'${ids.tenant}','${code}','${roleId}','${ids.department}','${email}',now()+interval '1 day');`);
  const response=await fetch(new URL('/auth/v1/admin/users',url),{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,password:'qdesign-local-review',email_confirm:true,user_metadata:{name:`로컬 검증 ${role}`,invitation_code:code}})});
  if(!response.ok)throw new Error(`Local account create failed (${response.status}) for ${email}`);
  const user=await response.json();
  if(!/^[\da-f-]{36}$/i.test(user.id))throw new Error('Unexpected local auth response.');
  query(`UPDATE public.users SET must_change_password=${initial?'true':'false'} WHERE id='${user.id}' AND email='${email}';`);
  const actual=query(`SELECT r.code FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE ur.user_id='${user.id}';`);
  if(actual!==role)throw new Error(`Invitation did not produce expected local role for ${email}`);
  accounts.push({email,role,initial,status:'created through normal invitation trigger'});
}
writeFileSync(join(root,'reviews/maison-pages-accounts.json'),JSON.stringify({createdAt:new Date().toISOString(),origin:'http://127.0.0.1:3601',database:'local Docker supabase_db_q-works',auth:'normal password login; no middleware or session bypass',accounts},null,2)+'\n');
console.log(JSON.stringify({accounts:accounts.length,roles:accounts.map(account=>account.role),existingUsersModified:false}));
