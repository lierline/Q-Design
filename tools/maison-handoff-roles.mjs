// Exact restoration of numeric role links in the migrated Maison feature screens.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
import {beforePurchasingDocsRole} from './maison-purchasing-docs-role.mjs';
import {beforeInspectionPrint} from './maison-inspection-print-migration.mjs';
import {beforeMaisonWorkflowCopy} from './maison-workflow-copy.mjs';
import {beforeBatchPrintSource} from './maison-batch-print-migration.mjs';
import {beforePrepTableSource} from './maison-prep-table-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='f121284520f8a3b033c63e8e11f0b493fb3fede1',designRef='e6df209';
const review=root+'/reviews/maison-handoff-role-migration.json';
export const handoffRolePlans=[
 {path:'app/(app)/purchasing/analysis/savings-tab.tsx',addImport:'import { qdMaison } from "@/lib/design/q-design-runtime";\n',from:'<StatRow>',to:'<StatRow cols={qdMaison.statRowColumns.purchasingAnalysis}>',role:'qdMaison.statRowColumns.purchasingAnalysis'},
 {path:'app/(app)/purchasing/analysis/delivery-tab.tsx',addImport:'import { qdMaison } from "@/lib/design/q-design-runtime";\n',from:'<StatRow>',to:'<StatRow cols={qdMaison.statRowColumns.purchasingAnalysis}>',role:'qdMaison.statRowColumns.purchasingAnalysis'},
 {path:'app/(app)/inspections/[id]/record-sheet.tsx',from:'maxHeightMm={16}',to:'maxHeightMm={qdPrint.companyMark.headerMaxHeightMm}',role:'qdPrint.companyMark.headerMaxHeightMm'},
 {path:'app/(app)/production/print/batch-record-sheet.tsx',addImport:'import { qdPrint } from "@/lib/design/q-design-print";\n',from:'maxHeightMm={14}',to:'maxHeightMm={qdPrint.companyMark.maxHeightMm}',role:'qdPrint.companyMark.maxHeightMm'},
];
export function applyHandoffRoleSource(plan,before){
 assert.equal(before.split(plan.from).length,2,'Only the exact reviewed role site may change: '+plan.path);
 if(plan.addImport)assert(!before.includes(plan.addImport.trim()),'Role import is already present');
 return (plan.addImport??'')+before.replace(plan.from,plan.to);
}
export function beforeMaisonHandoffRoles(file,code){
 code=beforePrepTableSource(file,code);
 code=beforeBatchPrintSource(file,code);
 code=beforeInspectionPrint(file,code);
 code=beforePurchasingDocsRole(file,code);
 if(!fs.existsSync(review))return code;
 const record=JSON.parse(fs.readFileSync(review,'utf8')).records.find(r=>r.path===file);if(!record||hash(code)===record.beforeHash)return code;
 // Earlier exact icon/caption inverses may already have restored this source.
 // Only their complete recorded snapshots are idempotent, never partial matches.
 const predecessors=[['maison-icon-handoff-migration.json','beforeHash'],['maison-caption-migration.json','beforeHash'],['maison-caption-migration.json','afterHash']];
 for(const [name,key]of predecessors){const prior=JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8')).records.find(r=>r.path===file);if(prior&&hash(code)===prior[key])return code;}
 assert.equal(hash(code),record.afterHash,'Unreviewed source after numeric role restoration: '+file);
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});assert.equal(hash(before),record.beforeHash);return before;
}
export function verifyIdentityHandoffSite(site){
 const targets={
  'app/(app)/inspections/[id]/print/page.tsx':{original:'16',oldRole:'qdPrint.companyMark.headerMaxHeightMm',child:'app/(app)/inspections/[id]/record-sheet.tsx',renderer:'InspectionRecordSheet'},
  'app/(app)/production/print/page.tsx':{original:'11',oldRole:'qdPrint.companyMark.bandMaxHeightMm',child:'app/(app)/production/print/batch-record-sheet.tsx',renderer:'BatchRecordSheet'},
 };
 const target=targets[site.path];if(!target)return false;
 assert.equal(site.component,'CompanyMark');assert.equal(site.property,'maxHeightMm');assert.equal(site.original,target.original);assert.equal(site.replacement,target.oldRole);
 const before=execFileSync('git',['show','160c7731e05400259ee75cc49274625b3a667e1a601e:'+site.path],{cwd:repo,encoding:'utf8'});
 assert(before.includes(site.property+'={'+site.replacement+'}'),'Prior identity role must have shipped');
 const current=fs.readFileSync(repo+'/'+site.path,'utf8'),pinned=execFileSync('git',['show',ref+':'+site.path],{cwd:repo,encoding:'utf8'});
 assert.equal(hash(current),hash(pinned),'Unreviewed print route after feature handoff');
 assert(!current.includes('<CompanyMark')&&current.includes('<'+target.renderer),'Only the inspected delegation may replace the former identity site');
 const proof=JSON.parse(fs.readFileSync(review,'utf8')),record=proof.records.find(r=>r.path===target.child);assert(record);
 const code=beforeBatchPrintSource(target.child,beforeInspectionPrint(target.child,fs.readFileSync(repo+'/'+target.child,'utf8')));assert.equal(hash(code),record.afterHash);assert(code.includes(record.to));
 return true;
}
export async function createHandoffRoleMigration(){
 const canonical='patterns/foundation/maison-runtime.ts',before=execFileSync('git',['show',designRef+':'+canonical],{cwd:root,encoding:'utf8'});
 assert.equal(before.split('purchasingAnalysis: 3').length,2);
 const after=before.replace('purchasingAnalysis: 3','purchasingAnalysis: 4'),records=[];
 for(const plan of handoffRolePlans){
  const source=execFileSync('git',['show',ref+':'+plan.path],{cwd:repo,encoding:'utf8'}),next=await formatProductCopy(repo,plan.path,applyHandoffRoleSource(plan,source));
  records.push({...plan,beforeHash:hash(source),afterHash:hash(next),before:source,after:next});
 }
 const proof={version:1,productRef:ref,designRef,scope:'Four exact numeric appearance role links. Purchasing rows retain the current four-card layout and gain a dedicated central column input. Existing 16mm inspection and 14mm manufacturing logo limits are retained. Imports and product formatting are the only other source changes; no data, eligibility, callbacks, record fields or form structure change.',canonical:{path:canonical,beforeHash:hash(before),afterHash:hash(after)},records:records.map(({before,after,...r})=>r)};
 return {proof,records,canonical:{path:canonical,before,after}};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {proof,records,canonical}=await createHandoffRoleMigration();
 if(process.argv.includes('--write')){
  assert(!fs.existsSync(review),'Do not overwrite the exact numeric role baseline');
  assert.equal(hash(fs.readFileSync(root+'/'+canonical.path,'utf8')),hash(canonical.before));
  for(const r of records)assert.equal(hash(fs.readFileSync(repo+'/'+r.path,'utf8')),hash(r.before));
  fs.writeFileSync(root+'/'+canonical.path,canonical.after);for(const r of records)fs.writeFileSync(repo+'/'+r.path,r.after);fs.writeFileSync(review,JSON.stringify(proof,null,2)+'\n');
 }else{
  assert.deepEqual(JSON.parse(fs.readFileSync(review,'utf8')),proof);assert.equal(hash(fs.readFileSync(root+'/'+canonical.path,'utf8')),hash(canonical.after));
  for(const r of records)assert.equal(hash(beforeBatchPrintSource(r.path,beforeMaisonWorkflowCopy(r.path,beforeInspectionPrint(r.path,fs.readFileSync(repo+'/'+r.path,'utf8'))))),hash(r.after));
 }
 console.log(JSON.stringify({files:records.length,roleSites:records.length,passed:true}));
}
