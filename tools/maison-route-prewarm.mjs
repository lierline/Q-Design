// Backend GET checks only. This never substitutes for actual CUA screen evidence.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(resolve(root,'../Q-Works/package.json'));
const {createServerClient}=require('@supabase/ssr');
const env=Object.fromEntries(readFileSync(resolve(root,'../Q-Works/.env.local'),'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith('#')&&line.includes('=')).map(line=>{const n=line.indexOf('=');return[line.slice(0,n).trim(),line.slice(n+1).trim().replace(/^["']|["']$/g,'')];}));
const authURL=new URL(env.NEXT_PUBLIC_SUPABASE_URL);
if(!['127.0.0.1','localhost'].includes(authURL.hostname)||authURL.port!=='54331')throw new Error('Only local Maison auth54331 allowed.');
const origin='http://127.0.0.1:3601';
const targets=JSON.parse(readFileSync(join(root,'reviews/maison-pages-targets.json'),'utf8')).targets;
const output=join(root,'reviews/maison-pages-http.json');
const results=existsSync(output)?JSON.parse(readFileSync(output,'utf8')).results:[];
const done=new Set(results.filter(row=>row.outcome==='rendered-response').map(row=>row.requestURL+'|'+row.account));
const sessions=new Map();
async function cookieFor(account){
  if(!account)return '';
  if(sessions.has(account))return sessions.get(account);
  const promise=(async()=>{
    let jar=[];
    const client=createServerClient(authURL.href,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>jar,setAll:items=>{for(const item of items){jar=jar.filter(c=>c.name!==item.name);jar.push(item);}}}});
    const {error}=await client.auth.signInWithPassword({email:account,password:account==='dev@q-maison.local'?'qworks-local-dev':'qdesign-local-review'});
    if(error)throw new Error(`Normal local login failed for ${account}: ${error.status}`);
    return jar.map(item=>`${item.name}=${item.value}`).join('; ');
  })();sessions.set(account,promise);return promise;
}
const captured=new Set();
const screenDir=join(root,'reviews/maison-pages/screens');
if(existsSync(screenDir))for(const file of readdirSync(screenDir).filter(file=>file.endsWith('.json'))){const r=JSON.parse(readFileSync(join(screenDir,file),'utf8'));if(r.actualURL===r.url&&!/(페이지를 찾을 수 없습니다|접근 권한이 없습니다)/.test(r.body??''))captured.add(r.url+'|'+(r.role==='anonymous'?'':r.role==='Viewer'?'qd-audit-initial@q-maison.local':'dev@q-maison.local'));}
const pending=targets.filter(target=>target.url&&!done.has(target.url+'|'+(target.account??''))&&!captured.has(target.url+'|'+(target.account??'')));
let cursor=0;
const save=()=>writeFileSync(output,JSON.stringify({updatedAt:new Date().toISOString(),origin,scope:'Normal-auth backend GET response checks and cold compile prewarming only. No browser rendering or visual compliance is asserted.',skippedExistingCUAEvidence:captured.size,results},null,2)+'\n');
const clean=text=>text.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
async function worker(){while(cursor<pending.length){const target=pending[cursor++];const account=target.account??'';if(new URL(target.url).origin!==origin)throw new Error('Unexpected audit origin');const started=Date.now();let row={route:target.route,requestURL:target.url,account,role:target.role};try{
  const cookie=await cookieFor(account);
  const response=await fetch(target.url,{headers:cookie?{cookie}:{},redirect:'manual',signal:AbortSignal.timeout(90000)});
  const html=await response.text();
  // RSC scripts contain the not-found boundary even for successful pages.
  // Read only actual response markup, and use headings for application denial text.
  const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
  const title=clean(/<title[^>]*>([\s\S]*?)<\/title>/.exec(markup)?.[1]??'');const headings=[...markup.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(match=>clean(match[1]));
  const errorText=/(페이지를 찾을 수 없습니다|접근 권한이 없습니다)/.exec(headings.join(' '))?.[1]??/(Application error:|Internal Server Error)/.exec(clean(markup))?.[1]??null;
  row={...row,status:response.status,location:response.headers.get('location'),title,headings,errorText,bytes:Buffer.byteLength(html),outcome:response.status>=300&&response.status<400?'redirect':response.status>=400||errorText?'error-response':'rendered-response'};
}catch(error){row={...row,outcome:'request-error',error:error.name+': '+error.message};}
row.elapsedMs=Date.now()-started;row.checkedAt=new Date().toISOString();const old=results.findIndex(item=>item.requestURL===row.requestURL&&item.account===row.account);if(old>=0)results[old]=row;else results.push(row);save();console.log(JSON.stringify({route:row.route,status:row.status,outcome:row.outcome,elapsedMs:row.elapsedMs}));}}
console.log(JSON.stringify({pending:pending.length,skippedCUA:captured.size,concurrency:1}));
await worker();save();console.log('Maison backend prewarming complete.');
