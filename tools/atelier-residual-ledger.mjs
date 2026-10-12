import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';import {localBindings,sourceImports,expressionProof} from './atelier-style-proof.mjs';import {collectStyleObjectOrigins} from './atelier-style-origins.mjs';
import {proveResidualBusinessRecord} from './atelier-residual-business.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',ts=createRequire(product+'/package.json')('typescript'),serialize=v=>JSON.stringify(v,null,2)+'\n';
export const residualRef='c1e35663c3618196df176546fa3a88487dd942a7';let baseline;
export function residualBaseline(){return baseline??=JSON.parse(execFileSync('git',['show',residualRef+':reviews/atelier-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));}
export function proveStyleOriginRecord(record,code){
 assert.equal(record.kind,'object-property');assert.equal(hash(code),record.sourceHash);
 const sf=ts.createSourceFile(record.path,code,99,true,record.path.endsWith('x')?4:3);assert.equal(sf.parseDiagnostics.length,0);
 const locals=localBindings(ts,sf,hash),origins=collectStyleObjectOrigins({ts,sf,locals,hash}),key=`${record.line}:${record.property}:${record.value}`,consumers=origins.get(key);assert(consumers?.length,'A current symbol-resolved JSX style consumer is required');
 const nodes=[];const visit=n=>{if(ts.isPropertyAssignment(n)&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===record.line&&n.name.getText(sf).replace(/^['"]|['"]$/g,'')===record.property&&n.initializer.getText(sf)===record.value)nodes.push(n.initializer);ts.forEachChild(n,visit);};visit(sf);assert(nodes.length);
 const proofs=nodes.map(node=>expressionProof({ts,node,sf,property:record.property,imports:sourceImports(ts,sf),file:record.path,references:new Map(),variables:new Map(),locals}));assert(proofs.every(p=>p&&!p.central),'Only independently structural leaves qualify');
 assert.equal(record.decision,'structural-behavior');assert.equal(record.ruleId,'proven-composition');
 const own={path:record.path,line:record.line,hash:record.sourceHash};const expected=[...new Map([own,...proofs[0].evidence,...consumers].map(e=>[JSON.stringify(e),e])).values()];assert.deepEqual(record.evidence,expected);
 return {kind:'immutable-style-origin',consumers};
}
export function createResidualLedger(current){
 const before=residualBaseline();assert.equal(before.records.length,53991);assert.equal(before.counts.unknown,811);assert.equal(current.records.length,before.records.length);
 const source=new Map(),changes=[];for(const [index,old]of before.records.entries()){
  const row=current.records[index];if(JSON.stringify(old)===JSON.stringify(row))continue;
  assert.equal(old.decision,'unknown','An already decided argument cannot change in this classification-only batch');
  for(const key of new Set([...Object.keys(old),...Object.keys(row)]))if(!['decision','ruleId','reason','evidence'].includes(key))assert.deepEqual(row[key],old[key],'Argument/source/order must be preserved: '+index+'.'+key);
  if(!source.has(row.path))source.set(row.path,fs.readFileSync(product+'/'+row.path,'utf8'));
  const proof=row.ruleId==='exact-residual-business-consumer'?proveResidualBusinessRecord(row,source.get(row.path)):proveStyleOriginRecord(row,source.get(row.path));
  changes.push({index,path:row.path,line:row.line,property:row.property,argumentHash:row.argumentHash,beforeHash:hash(JSON.stringify(old)),afterHash:hash(JSON.stringify(row)),proof});
 }
 assert(changes.length);const count=r=>r.records.reduce((a,x)=>(a[x.decision]=(a[x.decision]??0)+1,a),{});assert.deepEqual(current.counts,count(current));const expectedCounts={...before.counts};for(const c of changes){expectedCounts.unknown--;const decision=current.records[c.index].decision;expectedCounts[decision]=(expectedCounts[decision]??0)+1;}assert.deepEqual(current.counts,expectedCounts);
 const bm=structuredClone(before),am=structuredClone(current);for(const m of [bm,am]){delete m.records;delete m.counts;}assert.deepEqual(am,bm,'No unrelated report metadata can change');
 return {version:1,ref:residualRef,scope:'Fresh immutable JSX style origins with independently structural leaves and explicitly reviewed exact business consumers only. Every source, argument and other full record remains identical. No implementation, default, dimension, color or caller override is approved by context alone.',beforeReportHash:hash(serialize(before)),afterReportHash:hash(serialize(current)),records:current.records.length,unchanged:current.records.length-changes.length,beforeUnknown:811,afterUnknown:current.counts.unknown,changes};
}
export function beforeResidualLedger(current){
 const before=residualBaseline();if(hash(serialize(current))===hash(serialize(before)))return current;
 const file=root+'/reviews/atelier-residual-ledger.json';if(!fs.existsSync(file))return current;
 const saved=JSON.parse(fs.readFileSync(file,'utf8'));assert.deepEqual(createResidualLedger(current),saved,'Current closure decisions must match fresh semantic proofs');return before;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const current=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')),report=createResidualLedger(current),file=root+'/reviews/atelier-residual-ledger.json';if(process.argv.includes('--write'))fs.writeFileSync(file,serialize(report));else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log(JSON.stringify({records:report.records,changed:report.changes.length,unknown:report.afterUnknown}));
}
