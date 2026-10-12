import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {manualDecisions} from './maison-style-manual.mjs';
import {planMaisonProductionCopy} from './maison-production-copy.mjs';
import {createProductionCopyBindings} from './maison-production-copy-bindings.mjs';
import {productionToolTransitions} from './maison-production-copy-tools.mjs';
import {beforePullStyleReport} from './maison-pull-presentation-ledger.mjs';
import {pullToolTransition} from './maison-pull-style-evidence.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='cf558742823fde296029bd18b8654c9d5050547e',tool='tools/maison-production-copy-style-review.mjs',manifest=root+'/reviews/maison-production-copy-style-review.json',ts=createRequire(repo+'/package.json')('typescript');
const read=f=>fs.readFileSync((/^(?:source|patterns|dist|tools)\//.test(f)?root:repo)+'/'+f,'utf8');
const hashNow=f=>{try{if(f===tool)return pullToolTransition().beforeHash;return hash(read(f));}catch{return null;}};
const oldDesign=f=>execFileSync('git',['show',ref+':'+f],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024});
function lineMap(record){
 const old=ts.createSourceFile(record.path,record.before,99,true,4),next=ts.createSourceFile(record.path,record.after,99,true,4),nodes=sf=>{const list=[];const visit=n=>{list.push(n);ts.forEachChild(n,visit);};visit(sf);return list;},a=nodes(old),b=nodes(next);assert.equal(a.length,b.length);for(const [i,n]of a.entries())assert.equal(n.kind,b[i].kind,'Copy formatting cannot alter syntax structure');
 return line=>{const index=a.findIndex(n=>old.getLineAndCharacterOfPosition(n.getStart(old)).line+1>=line);assert(index>=0);return next.getLineAndCharacterOfPosition(b[index].getStart(next)).line+1;};
}
const descriptor=r=>{const {line,sourceHash,argumentHash,decision,ruleId,reason,evidence,...rest}=r;return {...rest,value:rest.value.replaceAll('\r\n','\n')};};
export async function createProductionStyleReview(){
 const migration=await planMaisonProductionCopy(),changed=new Map(),maps=new Map();for(const r of migration.records){assert.equal(hashNow(r.path),r.afterHash);changed.set(r.path,{before:r.beforeHash,after:r.afterHash});maps.set(r.path,lineMap(r));}
 const bindings=await createProductionCopyBindings();assert.equal(hashNow('dist/q-design.copy-bindings.json'),bindings.proof.afterHash);changed.set('dist/q-design.copy-bindings.json',{before:bindings.proof.beforeHash,after:bindings.proof.afterHash});
 const rulesFile='patterns/copy-rules.json',rulesBefore=JSON.parse(oldDesign(rulesFile)),rulesAfter=JSON.parse(read(rulesFile));assert.deepEqual(rulesAfter,{...rulesBefore,additionalRuleFiles:[...rulesBefore.additionalRuleFiles,'patterns/professional-maison-production-copy.json']});changed.set(rulesFile,{before:hash(oldDesign(rulesFile)),after:hashNow(rulesFile)});
 for(const t of productionToolTransitions())changed.set(t.path,{before:t.beforeHash,after:t.afterHash});
 const before=JSON.parse(oldDesign('reviews/maison-style-decisions.json')),current=await beforePullStyleReport(JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8'))),byArgument=new Map(before.records.map(r=>[r.argumentHash,r])),pairs=new Map();
 for(const file of migration.records.map(r=>r.path)){const old=before.records.filter(r=>r.path===file),now=current.records.filter(r=>r.path===file);assert.equal(old.length,now.length);for(const [i,r]of now.entries()){assert.deepEqual(descriptor(r),descriptor(old[i]),'Complete styling candidate must remain identical');pairs.set(r.argumentHash,old[i]);}}
 const records=[];
 for(const r of current.records){
  const old=pairs.get(r.argumentHash)??byArgument.get(r.argumentHash);if(!old||!manualDecisions.has(old.decision))continue;
  if(!changed.has(r.path)&&r.sourceHash!==old.sourceHash)continue;assert.deepEqual(descriptor(r),descriptor(old));
  if(!old.evidence?.some(e=>changed.has(e.path)))continue;const evidence=[];let valid=true;
  for(const e of old.evidence){const c=changed.get(e.path);if(c){if(e.hash!==c.before){valid=false;break;}evidence.push({...e,hash:c.after,...(maps.has(e.path)&&Number.isInteger(e.line)?{line:maps.get(e.path)(e.line)}:{})});}else{if(hashNow(e.path)!==e.hash){valid=false;break;}evidence.push(e);}}if(!valid)continue;
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:old.decision,ruleId:'professional-production-copy-evidence',reason:'The exact current source is the verified fifteen-literal interface-copy transformation of the inspected baseline. Every complete appearance argument remains identical; only formatting may move its source line. Other source/code/evidence changes are rejected. Prior exact consumer proof: '+old.reason,evidence:[...evidence,{path:tool,line:1,hash:hashNow(tool)},...['tools/maison-production-copy.mjs','tools/maison-production-copy-bindings.mjs','tools/maison-production-copy-tools.mjs'].map(path=>({path,line:1,hash:hashNow(path)}))]});
 }
 return {version:1,reviewRef:ref,scope:'Exact existing argument and consumer evidence after verified professional copy only. Original unknowns stay unknown. No filename-wide approval or unseen appearance changes.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=await createProductionStyleReview();if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),report);console.log(JSON.stringify({records:report.records.length,passed:true}));
}
export async function beforeProductionStyleReport(current){
 current=await beforePullStyleReport(current);
 const before=JSON.parse(oldDesign('reviews/maison-style-decisions.json')),migration=await planMaisonProductionCopy(),changed=new Map(migration.records.map(r=>[r.path,r])),proof=await createProductionStyleReview(),manual=new Map(proof.records.map(r=>[r.argumentHash,r]));
 const evidenceChanges=new Map(migration.records.map(r=>[r.path,{before:r.beforeHash,after:r.afterHash,map:lineMap(r)}]));for(const t of productionToolTransitions())evidenceChanges.set(t.path,{before:t.beforeHash,after:t.afterHash});const bindings=await createProductionCopyBindings();evidenceChanges.set('dist/q-design.copy-bindings.json',{before:bindings.proof.beforeHash,after:bindings.proof.afterHash});evidenceChanges.set('patterns/copy-rules.json',{before:hash(oldDesign('patterns/copy-rules.json')),after:hashNow('patterns/copy-rules.json')});
 assert.equal(current.records.length,before.records.length);for(const[i,row]of current.records.entries()){const old=before.records[i];assert.deepEqual(descriptor(row),descriptor(old));const source=changed.get(row.path);assert.equal(row.sourceHash,source?.afterHash??old.sourceHash);const entry=manual.get(row.argumentHash);if(entry&&row.ruleId==='professional-production-copy-evidence'){for(const key of['decision','ruleId','reason','evidence'])assert.deepEqual(row[key],entry[key]);}else{for(const key of['decision','ruleId','reason'])assert.deepEqual(row[key],old[key]);const expected=old.evidence.map(e=>{const c=evidenceChanges.get(e.path);if(!c)return e;assert.equal(e.hash,c.before);return {...e,hash:c.after,...(c.map&&Number.isInteger(e.line)?{line:c.map(e.line)}:{})};});assert.deepEqual(row.evidence,expected);}}
 assert.deepEqual(current.counts,before.counts);assert.equal(current.fileHashes.length,before.fileHashes.length);for(const[i,file]of current.fileHashes.entries()){assert.equal(file.path,before.fileHashes[i].path);assert.equal(file.hash,changed.get(file.path)?.afterHash??before.fileHashes[i].hash);}const meta=r=>{const copy=structuredClone(r);for(const key of['generatedAt','fileHashes','records'])delete copy[key];return copy;};assert.deepEqual(meta(current),meta(before));return before;
}
