// Retire exact deleted migration sites. Current replacement UI keeps its separate live audit.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works';
export const layoutHistoryRefs={before:'160c7731e05400259ee75cc49274625b3a667e1a601e',after:'f121284520f8a3b033c63e8e11f0b493fb3fede1'};
const reviewed=[
 ['app/(app)/nc/[id]/page.tsx',371,'The detail page now delegates occurrence editing to OccurrenceForm; the prior asymmetric two-column wrapper is absent.'],
 ['app/(app)/capa/plan-form.tsx',274,'The edited CAPA plan form uses a separate central 520px table; its former 420px table is absent.'],
 ['app/(app)/contracts/[id]/page.tsx',401,'The migrated contract detail composes ContractEvalFlow and named responsive grids; the former asymmetric split is absent.'],
 ['app/(app)/documents/[id]/approval-panel.tsx',447,'The migrated approval controls no longer contain the prior 52px minimum-width element.'],
 ['app/(app)/inspections/[id]/page.tsx',395,'Inspection detail now composes named responsive sections and InspectionRecordSheet; the old asymmetric split is absent.'],
 ['app/(app)/nc/new/new-nc-form.tsx',169,'The legacy form file was deleted; nc/new/page.tsx imports the shared OccurrenceForm.'],
 ['app/(app)/safety/incidents/[id]/page.tsx',148,'The migrated incident detail no longer contains the prior asymmetric split wrapper.'],
 ['app/(app)/suppliers/[id]/page.tsx',198,'The migrated supplier detail no longer contains the prior asymmetric split wrapper.'],
 ['app/(app)/production/new/new-production-form.tsx',432,'The migrated production form uses named responsive grids; the former 36rem minimum-width element is absent.'],
 ['app/(app)/risks/[id]/risk-approval-panel.tsx',213,'The migrated risk approval controls no longer contain the prior 64px minimum-width element.'],
];
const git=(ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024});
export function createLayoutHandoffHistory(){
 const plan=JSON.parse(fs.readFileSync(root+'/reviews/maison-layout-migration.json','utf8'));
 const records=reviewed.map(([file,line,reason])=>{
  const entries=plan.entries.filter(e=>e.sites.some(s=>s.path===file&&s.line===line));assert.equal(entries.length,1);
  const entry=entries[0],before=git(layoutHistoryRefs.before,file);assert(before.includes(entry.replacement),'The exact prior migration must have shipped');
  const exists=fs.existsSync(repo+'/'+file);let afterHash=null;
  if(exists){const after=git(layoutHistoryRefs.after,file);assert.equal(hash(fs.readFileSync(repo+'/'+file,'utf8')),hash(after));assert(!after.includes(entry.original)&&!after.includes(entry.replacement),'A remaining visual argument cannot be retired');afterHash=hash(after);}
  else assert.equal(execFileSync('git',['ls-tree',layoutHistoryRefs.after,'--',file],{cwd:repo,encoding:'utf8'}).trim(),'','Deleted path cannot exist');
  const replacement=file==='app/(app)/nc/new/new-nc-form.tsx'?{path:'app/(app)/nc/new/page.tsx',hash:hash(git(layoutHistoryRefs.after,'app/(app)/nc/new/page.tsx'))}:undefined;
  return {path:file,line,original:entry.original,replacement:entry.replacement,beforeHash:hash(before),afterHash,reason,...(replacement?{replacementConsumer:replacement}:{})};
 });
 return {version:1,refs:layoutHistoryRefs,scope:'Ten exact legacy visual sites removed by the completed feature handoff. The pinned old token-bearing source and whole current source/deletion are verified. This neither exempts replacement renderers nor approves their live appearance or business behavior.',records};
}
export function verifyLayoutRetirement(entry,site,record){
 assert.equal(record.path,site.path);assert.equal(record.line,site.line);assert.equal(record.original,entry.original);assert.equal(record.replacement,entry.replacement);
 const expected=createLayoutHandoffHistory().records.find(r=>r.path===site.path&&r.line===site.line);assert.deepEqual(record,expected,'Retirement evidence differs');
 if(record.replacementConsumer){const code=fs.readFileSync(repo+'/'+record.replacementConsumer.path,'utf8');assert.equal(hash(code),record.replacementConsumer.hash);assert(code.includes('import { OccurrenceForm } from "../occurrence-form"')&&code.includes('<OccurrenceForm'));}
 return true;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=createLayoutHandoffHistory(),target=root+'/reviews/maison-layout-handoff-retirements.json';
 if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),report);
 console.log(JSON.stringify({retiredSites:report.records.length,passed:true}));
}
