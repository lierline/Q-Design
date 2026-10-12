// Scoped human interface copy only. Style expressions and business behavior stay exact.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {applyBindings,termsForFile,formatProductCopy} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='28ccbd4edb8f006ceaa722b21006fee31dea3bb8',manifest=root+'/reviews/maison-workflow-copy.json';
const req=createRequire(repo+'/package.json'),ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
export async function planMaisonWorkflowCopy(){
 const rules=JSON.parse(fs.readFileSync(root+'/patterns/professional-maison-workflow-copy.json','utf8')),files=[...new Set(rules.terms.flatMap(t=>t.paths))],records=[];
 for(const file of files){
  const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}),result=applyBindings(file,before,[],termsForFile(rules.terms,'maison',file)),after=await formatProductCopy(repo,file,result.after);assert(result.changes.length>0);
  const scan=code=>scanArguments(file,code.replaceAll('\r\n','\n'),{ts,postcss,properties}),oldArgs=scan(before),newArgs=scan(after);assert.equal(oldArgs.length,newArgs.length);
  for(const [i,a]of oldArgs.entries()){const {line,...value}=a,{line:nextLine,...nextValue}=newArgs[i];assert.deepEqual(nextValue,value,'Complete appearance argument changed: '+file+':'+line);}
  records.push({path:file,before,after,beforeHash:hash(before),afterHash:hash(after),literals:result.changes.length,styleArguments:oldArgs.length,changes:result.changes.map(c=>({line:c.line,kind:c.kind,from:c.original,to:c.emitted}))});
 }
 assert.equal(records.length,7);assert.equal(records.reduce((n,r)=>n+r.literals,0),19);
 return {records,proof:{version:1,productRef:ref,scope:'Nineteen exact authored interface literals in seven inspection and purchasing files. No stored codes, record content, permission, query, callback or appearance argument changes. Product formatting may move source lines only.',rules:{path:'patterns/professional-maison-workflow-copy.json',hash:hash(fs.readFileSync(root+'/patterns/professional-maison-workflow-copy.json','utf8'))},records:records.map(({before,after,...r})=>r)}};
}
export function beforeMaisonWorkflowCopy(file,code){
 if(!fs.existsSync(manifest))return code;
 const row=JSON.parse(fs.readFileSync(manifest,'utf8')).records.find(r=>r.path===file);if(!row||hash(code)===row.beforeHash)return code;
 for(const name of ['maison-handoff-role-migration.json','maison-purchasing-docs-role.json','maison-caption-migration.json','maison-icon-handoff-migration.json']){
  const prior=JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8')).records.find(r=>r.path===file);if(prior&&[prior.beforeHash,prior.afterHash].includes(hash(code)))return code;
 }
 assert.equal(hash(code),row.afterHash,'Unreviewed source after professional workflow copy');const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});assert.equal(hash(before),row.beforeHash);return before;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {records,proof}=await planMaisonWorkflowCopy();
 if(process.argv.includes('--write')){assert(!fs.existsSync(manifest));for(const r of records)assert.equal(hash(fs.readFileSync(repo+'/'+r.path,'utf8')),r.beforeHash);for(const r of records)fs.writeFileSync(repo+'/'+r.path,r.after);fs.writeFileSync(manifest,JSON.stringify(proof,null,2)+'\n');}
 else{assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);for(const r of records)assert.equal(hash(fs.readFileSync(repo+'/'+r.path,'utf8')),r.afterHash);}
 console.log(JSON.stringify({files:records.length,literals:proof.records.reduce((n,r)=>n+r.literals,0),passed:true}));
}
