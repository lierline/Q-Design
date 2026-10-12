import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {manualDecisions} from './maison-style-manual.mjs';
import {planMaisonWorkflowCopy} from './maison-workflow-copy.mjs';
import {createWorkflowCopyBindings} from './maison-workflow-copy-bindings.mjs';
import {beforeProductionCopyRules,beforeProductionCopyBindings} from './maison-production-copy-bindings.mjs';
import {beforeMaisonProductionCopy} from './maison-production-copy.mjs';
import {beforeProductionStyleReport} from './maison-production-copy-style-review.mjs';
import {productionToolTransitions} from './maison-production-copy-tools.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='bfcc8e680c8ad9838b2161eed1912b5faea773ac',tool='tools/maison-workflow-copy-style-review.mjs',manifest=root+'/reviews/maison-workflow-copy-style-review.json',ts=createRequire(repo+'/package.json')('typescript');
const read=f=>fs.readFileSync((/^(?:source|patterns|dist|tools)\//.test(f)?root:repo)+'/'+f,'utf8');
const hashNow=f=>{try{if(f===tool)return productionToolTransitions().find(r=>r.path===tool).beforeHash;return hash(read(f));}catch{return null;}};
const oldDesign=f=>execFileSync('git',['show',ref+':'+f],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024});
function lineMap(record){
 const old=ts.createSourceFile(record.path,record.before,99,true,4),next=ts.createSourceFile(record.path,record.after,99,true,4),nodes=sf=>{const list=[];const visit=n=>{list.push(n);ts.forEachChild(n,visit);};visit(sf);return list;},a=nodes(old),b=nodes(next);assert.equal(a.length,b.length);for(const [i,n]of a.entries())assert.equal(n.kind,b[i].kind,'Copy formatting cannot alter syntax structure');
 return line=>{const index=a.findIndex(n=>old.getLineAndCharacterOfPosition(n.getStart(old)).line+1>=line);assert(index>=0);return next.getLineAndCharacterOfPosition(b[index].getStart(next)).line+1;};
}
const descriptor=r=>{const {line,sourceHash,argumentHash,decision,ruleId,reason,evidence,...rest}=r;return {...rest,value:rest.value.replaceAll('\r\n','\n')};};
export async function createWorkflowStyleReview(){
 const migration=await planMaisonWorkflowCopy(),changed=new Map(),maps=new Map();for(const r of migration.records){assert.equal(hash(beforeMaisonProductionCopy(r.path,read(r.path))),r.afterHash);changed.set(r.path,{before:r.beforeHash,after:r.afterHash});maps.set(r.path,lineMap(r));}
 const bindings=await createWorkflowCopyBindings();assert.equal(hash(JSON.stringify(beforeProductionCopyBindings(JSON.parse(read('dist/q-design.copy-bindings.json'))),null,2)+'\n'),bindings.proof.afterHash);changed.set('dist/q-design.copy-bindings.json',{before:bindings.proof.beforeHash,after:bindings.proof.afterHash});
 const rulesFile='patterns/copy-rules.json',rulesBefore=JSON.parse(oldDesign(rulesFile)),rulesAfter=beforeProductionCopyRules(JSON.parse(read(rulesFile)));assert.deepEqual(rulesAfter,{...rulesBefore,additionalRuleFiles:[...rulesBefore.additionalRuleFiles,'patterns/professional-maison-workflow-copy.json']});changed.set(rulesFile,{before:hash(oldDesign(rulesFile)),after:hash(JSON.stringify(rulesAfter,null,2)+'\n')});
 const before=JSON.parse(oldDesign('reviews/maison-style-decisions.json')),current=await beforeProductionStyleReport(JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8'))),byArgument=new Map(before.records.map(r=>[r.argumentHash,r])),pairs=new Map();
 for(const file of migration.records.map(r=>r.path)){const old=before.records.filter(r=>r.path===file),now=current.records.filter(r=>r.path===file);assert.equal(old.length,now.length);for(const [i,r]of now.entries()){assert.deepEqual(descriptor(r),descriptor(old[i]),'Complete styling candidate must remain identical');pairs.set(r.argumentHash,old[i]);}}
 const records=[];
 for(const r of current.records){
  if(r.decision!=='unknown'&&r.ruleId!=='professional-workflow-copy-evidence')continue;const old=pairs.get(r.argumentHash)??byArgument.get(r.argumentHash);if(!old||!manualDecisions.has(old.decision))continue;
  if(!changed.has(r.path)&&r.sourceHash!==old.sourceHash)continue;assert.deepEqual(descriptor(r),descriptor(old));
  if(!old.evidence?.some(e=>changed.has(e.path)))continue;const evidence=[];let valid=true;
  for(const e of old.evidence){const c=changed.get(e.path);if(c){if(e.hash!==c.before){valid=false;break;}evidence.push({...e,hash:c.after,...(maps.has(e.path)&&Number.isInteger(e.line)?{line:maps.get(e.path)(e.line)}:{})});}else{if(hashNow(e.path)!==e.hash){valid=false;break;}evidence.push(e);}}if(!valid)continue;
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:old.decision,ruleId:'professional-workflow-copy-evidence',reason:'The exact current source is the verified nineteen-literal interface-copy transformation of the inspected baseline. Every complete appearance argument remains identical; only formatting may move its source line. Other source/code/evidence changes are rejected. Prior exact consumer proof: '+old.reason,evidence:[...evidence,{path:tool,line:1,hash:hashNow(tool)}]});
 }
 return {version:1,reviewRef:ref,scope:'Exact existing argument and consumer evidence after verified professional copy only. Original unknowns stay unknown. No filename-wide approval or unseen appearance changes.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=await createWorkflowStyleReview();if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),report);console.log(JSON.stringify({records:report.records.length,passed:true}));
}
