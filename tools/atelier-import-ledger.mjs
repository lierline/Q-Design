import {beforeExpertFonts,expertFontPath} from './atelier-expert-font-source.mjs';
// Like the expert font source, the newer ledger pattern source is read back to the exact source these decisions were proven on.
import {beforeLedgerSourceIfLater} from './atelier-ledger-pattern-sources.mjs';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';import {expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';import {createAtelierProofContext,compositionNodes} from './atelier-proof-context.mjs';
import {beforeForwardedLedger} from './atelier-forwarded-ledger.mjs';
import {historicalTypographyEvidence} from './global-typography-evidence.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',serialize=v=>JSON.stringify(v,null,2)+'\n';
export const importRef='f3b4ee8bed831e3cf0ba111fd0cac53d372bdbc0';let baseline;
export function importBaseline(){return baseline??=JSON.parse(execFileSync('git',['show',importRef+':reviews/atelier-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));}
export function proveImportedComposition(record,code,context=createAtelierProofContext({expanded:true})){
 assert.equal(hash(code),record.sourceHash);assert(['object-property','style-expression','presentation-attribute'].includes(record.kind));
 const {ts,references,variables}=context,sf=ts.createSourceFile(record.path,code,99,true,record.path.endsWith('x')?4:3);assert.equal(sf.parseDiagnostics.length,0);
 const nodes=compositionNodes(ts,sf,record);assert(nodes.length,'Exact current argument AST is required');const imports=sourceImports(ts,sf),locals=localBindings(ts,sf,hash,references);
 const proofs=nodes.map(node=>expressionProof({ts,node,sf,property:record.property,imports,file:record.path,references,variables,locals}));assert(proofs.every(p=>p?.central),'Every authored branch must resolve independently to central values');
 assert.equal(record.decision,'token-reference-verified');assert.equal(record.ruleId,'proven-composition');
 assert.equal(record.reason,'Every result branch and authored value in this expression has independent source proof; no unknown fragment is ignored.');
 const expected=historicalTypographyEvidence([...new Map([{path:record.path,line:record.line,hash:record.sourceHash},...proofs[0].evidence].map(e=>[JSON.stringify(e),e])).values()],record.evidence);assert.deepEqual(record.evidence,expected);
 return {kind:'exact-import-composition',evidence:expected};
}
export function createImportLedger(current){
 if(hash(serialize(current))!==hash(serialize(importBaseline())))current=beforeForwardedLedger(current);
 const before=importBaseline();assert.equal(before.records.length,53991);assert.equal(before.counts.unknown,736);assert.equal(current.records.length,before.records.length);
 const context=createAtelierProofContext({expanded:true}),source=new Map(),changes=[];
 for(const [index,old]of before.records.entries()){
  const row=current.records[index];if(JSON.stringify(old)===JSON.stringify(row))continue;assert.equal(old.decision,'unknown','An earlier decision must remain identical');
  for(const key of new Set([...Object.keys(old),...Object.keys(row)]))if(!['decision','ruleId','reason','evidence'].includes(key))assert.deepEqual(row[key],old[key],'Argument, source and order are preserved: '+index+'.'+key);
  if(!source.has(row.path))source.set(row.path,(row.path===expertFontPath?beforeExpertFonts(fs.readFileSync(product+'/'+row.path,'utf8')):beforeLedgerSourceIfLater(row.path,fs.readFileSync(product+'/'+row.path,'utf8'))));const proof=proveImportedComposition(row,source.get(row.path),context);
  changes.push({index,path:row.path,line:row.line,property:row.property,argumentHash:row.argumentHash,beforeHash:hash(JSON.stringify(old)),afterHash:hash(JSON.stringify(row)),proof});
 }
 assert(changes.length);const count=r=>r.records.reduce((a,x)=>(a[x.decision]=(a[x.decision]??0)+1,a),{});assert.deepEqual(current.counts,count(current));const expectedCounts={...before.counts,unknown:736-changes.length,'token-reference-verified':before.counts['token-reference-verified']+changes.length};assert.deepEqual(current.counts,expectedCounts);
 const oldMeta=structuredClone(before),newMeta=structuredClone(current);for(const m of [oldMeta,newMeta]){delete m.records;delete m.counts;}assert.deepEqual(newMeta,oldMeta);
 return {version:1,ref:importRef,scope:'Exact new compositions only. Static imports discover candidates, never ownership. All authored branches resolve independently to central values. No source, argument, previously decided record or other metadata changes.',beforeReportHash:hash(serialize(before)),afterReportHash:hash(serialize(current)),records:current.records.length,unchanged:current.records.length-changes.length,beforeUnknown:736,afterUnknown:current.counts.unknown,changes};
}
export function beforeImportLedger(current){
 const before=importBaseline();if(hash(serialize(current))===hash(serialize(before)))return current;
 current=beforeForwardedLedger(current);
 const file=root+'/reviews/atelier-import-ledger.json';if(!fs.existsSync(file))return current;
 assert.deepEqual(createImportLedger(current),JSON.parse(fs.readFileSync(file,'utf8')),'Current import closure requires fresh source proofs');return before;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const current=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')),report=createImportLedger(current),file=root+'/reviews/atelier-import-ledger.json';if(process.argv.includes('--write'))fs.writeFileSync(file,serialize(report));else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);console.log(JSON.stringify({records:report.records,changed:report.changes.length,unknown:report.afterUnknown}));
}
