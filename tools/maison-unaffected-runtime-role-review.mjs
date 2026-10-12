// Preserve exact evidence for unchanged runtime members. Changed purchasing consumers are separate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {createHandoffRoleMigration} from './maison-handoff-roles.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='e6df209',name='reviews/maison-unaffected-runtime-role-review.json',tool='tools/maison-unaffected-runtime-role-review.mjs';
const ts=createRequire(repo+'/package.json')('typescript');
export function inspectStatRowReads(file,code){
 const sf=ts.createSourceFile(file,code,99,true,file.endsWith('x')?4:3),imports=new Set();
 for(const n of sf.statements)if(ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@/lib/design/q-design-runtime'&&n.importClause?.namedBindings&&ts.isNamedImports(n.importClause.namedBindings))for(const s of n.importClause.namedBindings.elements)if((s.propertyName??s.name).text==='qdMaison')imports.add(s.name.text);
 const reads=[];const visit=n=>{
  if(ts.isIdentifier(n)&&imports.has(n.text)&&!ts.isImportSpecifier(n.parent)){
   assert(ts.isPropertyAccessExpression(n.parent)&&n.parent.expression===n,'Runtime object cannot escape into an unreviewed consumer');
   if(n.parent.name.text==='statRowColumns'){
    const p=n.parent.parent;assert(ts.isPropertyAccessExpression(p)&&p.expression===n.parent,'Computed or whole column-map consumers require review');
    assert(['purchasingAnalysis','kpiClassification'].includes(p.name.text),'Unknown column role consumer');reads.push(p.name.text);
   }
  }ts.forEachChild(n,visit);
 };visit(sf);return reads;
}
export async function createUnaffectedRuntimeRoleReview(){
 const migration=await createHandoffRoleMigration();assert.equal(hash(fs.readFileSync(root+'/'+migration.canonical.path,'utf8')),hash(migration.canonical.after));
 const ownedCopy='lib/design/q-design-runtime.ts',copy=fs.readFileSync(repo+'/'+ownedCopy,'utf8');assert(copy.includes(migration.canonical.after.trim()),'Current exact runtime adapter must be exported');
 const impacted=new Set(['app/(app)/purchasing/analysis/savings-tab.tsx','app/(app)/purchasing/analysis/delivery-tab.tsx','app/(app)/purchasing/analysis/page.tsx']);
 const readers=[];
 for(const file of runtimeFiles(repo).filter(f=>/\.tsx?$/.test(f))){const code=fs.readFileSync(repo+'/'+file,'utf8');if(!code.includes('@/lib/design/q-design-runtime'))continue;const reads=inspectStatRowReads(file,code);if(reads.includes('purchasingAnalysis'))assert(impacted.has(file),'Changed role has an unreviewed consumer');if(reads.length)readers.push({path:file,hash:hash(code),reads});}
 assert.equal(readers.filter(r=>r.reads.includes('purchasingAnalysis')).length,3);
 const prior=JSON.parse(execFileSync('git',['show',ref+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024})),current=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),oldRows=new Map(prior.records.map(r=>[r.argumentHash,r]));
 const oldCopy=execFileSync('git',['show','f121284520f8a3b033c63e8e11f0b493fb3fede1:'+ownedCopy],{cwd:repo,encoding:'utf8'}),changes=new Map([[migration.canonical.path,{beforeHash:hash(migration.canonical.before),afterHash:hash(migration.canonical.after)}],[ownedCopy,{beforeHash:hash(oldCopy),afterHash:hash(copy)}]]);
 const currentHash=file=>{const base=/^(?:source|patterns|dist|tools)\//.test(file)?root:repo;return fs.existsSync(base+'/'+file)?hash(fs.readFileSync(base+'/'+file,'utf8')):null;};
 const records=[];
 for(const row of current.records){
  if(row.decision!=='unknown'&&row.ruleId!=='unaffected-runtime-member-evidence')continue;
  const old=oldRows.get(row.argumentHash);if(!old||old.decision==='unknown'||old.sourceHash!==row.sourceHash||impacted.has(row.path)||old.value.includes('purchasingAnalysis')||old.reason.includes('purchasingAnalysis'))continue;
  if(!old.evidence?.some(e=>changes.has(e.path)))continue;
  const evidence=[];let valid=true;
  for(const e of old.evidence){const change=changes.get(e.path);if(change){if(e.hash!==change.beforeHash){valid=false;break;}evidence.push({...e,hash:change.afterHash});}else{if(currentHash(e.path)!==e.hash){valid=false;break;}evidence.push(e);}}
  if(!valid)continue;
  records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:old.decision,ruleId:'unaffected-runtime-member-evidence',priorRuleId:old.ruleId,value:row.value,reason:'The complete candidate, consumer source and all other evidence remain exact. Only the runtime adapter fingerprint changes because the separately reviewed purchasingAnalysis field changes from 3 to 4. All direct runtime uses are inventoried; only the three inspected purchasing tabs consume that changed member. No computed column-map consumer or escaped whole runtime object is accepted. Prior exact consumer proof: '+old.reason,evidence:[...evidence,{path:tool,line:1,hash:currentHash(tool)}]});
 }
 return {version:1,reviewRef:ref,scope:'Only exact unchanged candidate/consumer evidence for unaffected numeric runtime members. Changed purchasing consumers and changed source candidates are excluded. No name-wide, numeric-value or file-wide styling approval.',canonical:migration.proof.canonical,readers,records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=await createUnaffectedRuntimeRoleReview();if(process.argv.includes('--write'))fs.writeFileSync(root+'/'+name,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(root+'/'+name,'utf8')),report);
 console.log(JSON.stringify({records:report.records.length,readers:report.readers.length,passed:true}));
}
