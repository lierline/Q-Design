import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='8b7b49abe742e30709513a153fd82055842eab46',review=root+'/reviews/maison-purchasing-docs-role.json';
const files=['app/(app)/purchasing/analysis/page.tsx','components/shared/list-stats.tsx'];
export function beforePurchasingDocsRole(pathname,code){
 if(!files.includes(pathname)||!fs.existsSync(review))return code;
 const p=JSON.parse(fs.readFileSync(review,'utf8')).records.find(r=>r.path===pathname);assert(p);if(hash(code)===p.beforeHash)return code;assert.equal(hash(code),p.afterHash,'Unreviewed purchasing docs source');
 const before=execFileSync('git',['show',ref+':'+pathname],{cwd:repo,encoding:'utf8'});assert.equal(hash(before),p.beforeHash);return before;
}
export async function inspectPurchasingDocsRole(){
 const records=[];
 for(const file of files){
  const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});let changed=before;
  const replace=(from,to)=>{assert.equal(changed.split(from).length,2,'One exact docs role site: '+file);changed=changed.replace(from,to);};
  if(file===files[0]){
   replace('<ListStats menu="/purchasing/analysis#docs" tenantId={tenantId} />','<ListStats menu="/purchasing/analysis#docs" tenantId={tenantId} cols={qdMaison.statRowColumns.purchasingAnalysis} />');
   changed='import { qdMaison } from "@/lib/design/q-design-runtime";\n'+changed;
  }else{
   replace('export async function ListStats({\n  menu,\n  tenantId,\n  scope,','export async function ListStats({\n  menu,\n  tenantId,\n  scope,\n  cols,');
   replace('  scope?: readonly StatWhere[];','  scope?: readonly StatWhere[];\n  /** Optional presentation columns; omitted callers retain automatic card count. */\n  cols?: number;');
   replace('<StatRow>','<StatRow cols={cols}>');
  }
  const after=await formatProductCopy(repo,file,changed);records.push({path:file,before,after,beforeHash:hash(before),afterHash:hash(after)});
 }
 return {records,proof:{version:1,productRef:ref,role:'qdMaison.statRowColumns.purchasingAnalysis',scope:'The purchasing page passes its central four-card role through ListStats to StatRow for the docs tab. Other ListStats callers retain automatic card count. Only the optional presentation argument, role import and product formatting change. Database counts, filters, permissions, upload actions and cards remain unchanged.',records:records.map(({before,after,...r})=>r)}};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {records,proof}=await inspectPurchasingDocsRole();
 if(process.argv.includes('--write')){assert(!fs.existsSync(review));for(const r of records)assert.equal(hash(fs.readFileSync(repo+'/'+r.path,'utf8')),r.beforeHash);for(const r of records)fs.writeFileSync(repo+'/'+r.path,r.after);fs.writeFileSync(review,JSON.stringify(proof,null,2)+'\n');}
 else{assert.deepEqual(JSON.parse(fs.readFileSync(review,'utf8')),proof);for(const r of records)assert.equal(hash(fs.readFileSync(repo+'/'+r.path,'utf8')),r.afterHash);}
 console.log(JSON.stringify({roleSites:1,passed:true}));
}
