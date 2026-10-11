// These three previously unresolved w bindings are organization data, not widths.
// No permission behavior or product source is changed by this review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {inspectWriteGuard,ts} from './atelier-write-guard-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(root,'../Q-Atelier');
const ruleId='exact-server-module-gate-consumer';
const paths=[
 'app/api/equipment/[id]/calibrations/[calId]/route.ts',
 'app/api/equipment/[id]/events/[evId]/route.ts',
 'app/api/suppliers/[id]/shipments/[shipId]/route.ts',
];
const producers=[
 ['lib/permissions/create-access.ts','60572a48fe4bd68be6599937ecf40247a98ef369e135e783a7534b8ad1ddc026','assertWriteRole'],
 ['lib/subscription/module-gate.ts','275bf4b79e7e30e5828f17d278c99bb0e67c59ad3669bbb2f8cf1222add1e8ac','moduleGate'],
];
export function createModuleGuardReview(){
 const evidence=producers.map(([file,expected,name])=>{
  const code=fs.readFileSync(repo+'/'+file,'utf8');assert.equal(hash(code),expected,'Server data producer changed and needs fresh review: '+file);
  const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert(fn);
  return {path:file,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:expected};
 });
 const decisions=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8'));
 const records=paths.map(file=>{
  const code=fs.readFileSync(repo+'/'+file,'utf8'),flow=inspectWriteGuard(code,{allowModuleGate:true});assert(flow,'Every consumer must remain in the exact reviewed data forms: '+file);
  // The earlier, narrower inspector must still leave these additional calls unresolved.
  assert.equal(inspectWriteGuard(code),null);
  const rows=decisions.records.filter(r=>r.path===file&&r.kind==='named-style-value'&&r.property==='w'&&r.line===flow.line&&r.value===flow.value);assert.equal(rows.length,1);
  const row=rows[0];assert.equal(row.sourceHash,hash(code));assert(['unknown','business-data'].includes(row.decision));
  if(row.decision==='business-data')assert.equal(row.ruleId,ruleId);
  return {path:file,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:'business-data',ruleId,reason:'This exact w binding is a server organization identity or guarded HTTP response. Its organization id is additionally passed as the second argument of the awaited, directly imported and unchanged moduleGate, which queries enabled modules and returns null or an HTTP response. Every use remains an inspected data consumer. Unknown calls, visual arguments, aliases and shadowed imports fail. This does not approve any renderer or caller styling.',evidence:[...evidence,...flow.consumers.map(c=>({path:file,line:c.line,hash:row.sourceHash}))],consumers:flow.consumers};
 });
 return {version:1,scope:'Three exact server data bindings previously left unresolved by the narrower permission-result review. Other variables, server files, the loadSheets call and downstream rendering are not exempted.',records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createModuleGuardReview(),file=root+'/reviews/atelier-module-guard-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log('Exact organization-data module consumers verified: '+report.records.length);
}
