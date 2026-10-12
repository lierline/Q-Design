import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {applyBindings,termsForFile,formatProductCopy,normalizeCopy} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {beforeMaisonCaptionRoles} from './maison-caption-roles.mjs';
import {beforeMaisonProductionCopy} from './maison-production-copy.mjs';
import {beforeProductionCopyRules} from './maison-production-copy-bindings.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works';
export const maisonCopyProductRef='0b7e83970ce52dc170efbf25e950f310ee338693';
export const maisonCopyReviewedPaths=[
  "app/(app)/inspections/new/new-inspection-form.tsx",
  "app/(app)/audits/body-form.tsx",
  "app/(app)/dashboard/calendar-event-dialog.tsx",
  "app/(app)/help/content.ts",
  "app/(app)/inspections/[id]/approval-ui.tsx",
  "app/(app)/inspections/actions.ts",
  "app/(app)/nc/[id]/page.tsx",
  "app/(app)/nc/actions.ts",
  "app/(app)/nc/approval-ui.tsx",
  "app/(app)/purchasing/analysis/saving-register-dialog.tsx",
  "app/(app)/purchasing/analysis/savings-tab.tsx",
  "app/(app)/purchasing/order-actions.ts",
  "app/(app)/recalls/[id]/page.tsx",
  "app/(app)/risks/[id]/risk-approval-panel.tsx",
  "app/(app)/risks/approval-actions.ts",
  "app/(app)/safety/incidents/[id]/page.tsx",
  "app/(app)/safety/incidents/incident-actions.ts",
  "app/(app)/safety/incidents/incident-approval-ui.tsx",
  "app/(app)/safety/incidents/incidents-tab.tsx",
  "app/(app)/settings/roles/access-header.tsx",
  "app/(floor)/floor/actions.ts",
  "components/layout/mobile-sidebar.tsx",
  "components/layout/sidebar.tsx",
  "components/shared/approval-flow.tsx",
  "lib/documents/modify-gate.ts",
  "lib/help/page-help.ts",
  "lib/nc/approval-rules.ts",
  "lib/permissions/draft-author.ts",
  "lib/supabase/types.ts",
  "lib/validators/calendar-events.ts"
];
export async function inspectMaisonProfessionalSources(){
 const rules=beforeProductionCopyRules(JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.json','utf8')));
 const terms=[...rules.terms,...rules.additionalRuleFiles.flatMap(file=>JSON.parse(fs.readFileSync(root+'/'+file,'utf8')).terms)];
 const req=createRequire(product+'/package.json'),ts=req('typescript'),postcss=req('postcss');
 const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 const records=[];
 for(const file of maisonCopyReviewedPaths){
  const before=execFileSync('git',['show',maisonCopyProductRef+':'+file],{cwd:product,encoding:'utf8'});
  const after=beforeMaisonCaptionRoles(file,beforeMaisonProductionCopy(file,fs.readFileSync(product+'/'+file,'utf8'))),result=applyBindings(file,before,[],termsForFile(terms,'maison',file));
  const expected=await formatProductCopy(product,file,result.after);
  assert.equal(hash(after),hash(expected),'Only inspected display literals and product formatting may change: '+file);
  const normalized=code=>code.replaceAll('\r\n','\n');
  const oldArgs=scanArguments(file,normalized(before),{ts,postcss,properties}),newArgs=scanArguments(file,normalized(after),{ts,postcss,properties});
  assert.equal(newArgs.length,oldArgs.length,'No candidate can be added or omitted: '+file);
  let displayArguments=0;
  for(const [i,old] of oldArgs.entries()){
   const current=newArgs[i];
   if(file==='app/(app)/help/content.ts'&&old.kind==='object-property'&&old.property==='content'&&old.value!==current.value){
    assert(result.changes.some(c=>c.raw===old.value),'Only an inspected help literal can be rebound');
    assert.deepEqual(current,{...old,value:normalizeCopy(old.value,termsForFile(terms,'maison',file))});displayArguments++;
   }else assert.deepEqual(current,old,'Complete style argument changed: '+file+':'+old.line);
  }
  records.push({path:file,beforeHash:hash(before),afterHash:hash(after),literalChanges:result.changes.length,styleArguments:oldArgs.length,displayArguments});
 }
 return {version:1,productRef:maisonCopyProductRef,scope:'Exact whole-source proof for reviewed display copy. Complete styling arguments, business codes, control flow, permissions and database operations remain unchanged.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const proof=await inspectMaisonProfessionalSources().catch(e=>{console.error(e.message);process.exit(1)}),file=root+'/reviews/maison-professional-copy-evidence.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(proof,null,2)+'\n');
 else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),proof);
 console.log(JSON.stringify({files:proof.records.length,literals:proof.records.reduce((n,r)=>n+r.literalChanges,0),styleArguments:proof.records.reduce((n,r)=>n+r.styleArguments,0)}));
}

