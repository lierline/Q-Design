import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createAtelierProofContext,compositionNodes} from './atelier-proof-context.mjs';
import {expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';
import {addChoiceColumnsNodes} from './atelier-choice-columns-review.mjs';
import {hash} from './style-arguments-core.mjs';
import {beforeAtelierProfessionalReview} from './atelier-professional-copy-revalidation.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',ref='cb5789de1676125fb2336e6fb46a0321d727afa2';
const manifest=root+'/reviews/atelier-choice-columns-ledger.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
const baseline=()=>JSON.parse(execFileSync('git',['show',ref+':reviews/atelier-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));
export function inspectChoiceLedger(current){
 current=beforeAtelierProfessionalReview('atelier-style-decisions.json',current);
 const before=baseline(),file='app/(app)/m/field-ui.tsx',context=createAtelierProofContext({expanded:true}),{ts,references,variables}=context;
 const code=fs.readFileSync(product+'/'+file,'utf8'),sf=ts.createSourceFile(file,code,99,true,4),locals=localBindings(ts,sf,hash,references),imports=sourceImports(ts,sf);
 const nodes=addChoiceColumnsNodes(ts,sf,new Map());
 const changes=[];assert.equal(current.records.length,before.records.length);
 const inverse=structuredClone(current);
 for(let i=0;i<before.records.length;i++){
  const old=before.records[i],row=current.records[i];
  if(serialize(old)===serialize(row))continue;
  assert.equal(old.path,file);assert.equal(old.line,157);assert(['gridTemplateColumns','style'].includes(old.property));assert.equal(old.decision,'unknown');
  assert.equal(row.decision,'delegated-renderer-parameter');assert.equal(row.ruleId,'proven-composition');
  const values=compositionNodes(ts,sf,old);assert.equal(values.length,1);
  const proof=expressionProof({ts,node:values[0],sf,property:row.property,imports,file,references,variables,locals,reviewedNodes:nodes,extendedAliases:true,numericParameterUnits:true});
  assert(proof&&proof.evidence.some(e=>e.delegatedReview));
  const evidence=[...new Map([{path:file,line:row.line,hash:row.sourceHash},...proof.evidence].map(e=>[JSON.stringify(e),e])).values()];
  assert.deepEqual(row.evidence,evidence);
  const restored={...row,decision:old.decision,ruleId:old.ruleId,reason:old.reason,evidence:old.evidence};assert.deepEqual(restored,old,'Every argument field must remain exact');
  changes.push({index:i,argumentHash:row.argumentHash,before:old,after:row});inverse.records[i]=old;
 }
 assert.equal(changes.length,2);
 assert.deepEqual(current.counts,{...before.counts,unknown:before.counts.unknown-2,'delegated-renderer-parameter':before.counts['delegated-renderer-parameter']+2});
 inverse.counts=before.counts;assert.deepEqual(inverse,before,'No other complete record, file fingerprint or inventory field can change');
 return {version:1,ref,beforeReportHash:hash(serialize(before)),afterReportHash:hash(serialize(current)),records:current.records.length,unknown:current.counts.unknown,changes};
}
export function beforeChoiceColumnsLedger(current){
 if(!fs.existsSync(manifest))return current;
 const before=baseline();if(hash(serialize(current))===hash(serialize(before)))return current;
 current=beforeAtelierProfessionalReview('atelier-style-decisions.json',current);
 assert.deepEqual(inspectChoiceLedger(current),JSON.parse(fs.readFileSync(manifest,'utf8')));return before;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=inspectChoiceLedger(JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')));
 if(process.argv.includes('--write'))fs.writeFileSync(manifest,serialize(result));
 else assert.deepEqual(result,JSON.parse(fs.readFileSync(manifest,'utf8')));
 console.log(JSON.stringify({records:result.records,changed:result.changes.length,unknown:result.unknown}));
}
