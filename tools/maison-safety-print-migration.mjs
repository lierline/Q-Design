import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
const repo='D:/Claude/Q-Works',ref='7e5bd9be53fb61bb15fca676fde3e9400fdd377a';
function rawSafetyPlan(){
 const paths=['app/(app)/safety/incidents/incident-sheet.tsx','app/(app)/safety/monthly/month-sheet.tsx'],files=[];
 for(const file of paths){const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});let after=before.replaceAll('\r\n','\n'),edits=[];
 const replace=(from,to,sites)=>{assert.equal(after.split(from).length-1,sites,from);after=after.replaceAll(from,to);edits.push({from,to,sites});};
 replace('import { printStamp }','import { qdPrint } from "@/lib/design/q-design-print";\nimport { printStamp }',1);
 if(file===paths[0]){
  replace('import { qdPrint }','import type { CSSProperties } from "react";\nimport { qdPrint }',1);
  replace('const center = { textAlign: "center" as const };','const center: CSSProperties = { textAlign: "center" };',1);
  replace('const rowStyle = { height: "13mm" };','const rowStyle: CSSProperties = { height: qdPrint.height.v13mm };',1);
  replace('marginTop: "3mm"','marginTop: qdPrint.marginTop.v3mm',1);
  for(const [n,count]of [[7,1],[13,1],[29,1],[21,1],[15,2]])replace('width: "'+n+'%"','width: qdPrint.width.v'+n,count);
  replace('fontSize: "11pt"','fontSize: qdPrint.fontSize.v11pt',1);
  replace('wordBreak: "break-word"','overflowWrap: "break-word"',3);
 }else{
  replace('import type { CSSProperties } from "react";','import { qdSafetyPrint } from "@/lib/design/q-design-safety-print";',1);
  replace('const SLASH: CSSProperties = {\n  backgroundImage:\n    "linear-gradient(to top right, transparent calc(50% - 0.12mm), #000 50%, transparent calc(50% + 0.12mm))",\n  WebkitPrintColorAdjust: "exact",\n  printColorAdjust: "exact",\n};','const SLASH = qdSafetyPrint.unmeasured;',1);
  replace('`${82 / Math.max(data.areas.length, 1)}%`','`${qdSafetyPrint.areaWidthPercent / Math.max(data.areas.length, 1)}%`',1);
  replace('marginTop: "3mm"','marginTop: qdPrint.marginTop.v3mm',2);
  replace('width: "5%"','width: qdSafetyPrint.dayWidth',1);
  for(const n of[6,7])replace('width: "'+n+'%"','width: qdPrint.width.v'+n,1);
 }
 if(before.includes('\r\n'))after=after.replaceAll('\n','\r\n');files.push({file,before,after,edits});}
 return files;
}

export const safetyCanonicalPath='patterns/foundation/maison-safety-print.ts';
const formattedPlans=await Promise.all(rawSafetyPlan().map(async f=>({...f,after:await formatProductCopy(repo,f.file,f.after)})));
export function safetyPlan(){return structuredClone(formattedPlans);}
export function beforeSafetyPrint(file,code){const target=safetyPlan().find(f=>f.file===file);if(!target)return code;assert.equal(hash(code),hash(target.after),'Changed safety paper needs a fresh review');return target.before;}
export function safetyMigrationProof(){const files=safetyPlan();for(const f of files)beforeSafetyPrint(f.file,fs.readFileSync(repo+'/'+f.file,'utf8'));const canonical=fs.readFileSync('D:/Claude/Q-Design/'+safetyCanonicalPath,'utf8');assert.deepEqual(copyProblems({lang:'ts'},canonical,fs.readFileSync(repo+'/lib/design/q-design-safety-print.ts','utf8')),[],'Safety rules must be synchronized');return {version:1,productRef:ref,canonical:{path:safetyCanonicalPath,hash:hash(canonical)},files:files.map(f=>({path:f.file,beforeHash:hash(f.before),afterHash:hash(f.after),edits:f.edits})),scope:'Twenty-four exact source edit positions preserve the two official safety forms. Three legacy word-break values become standard overflow-wrap values. All record fields, row generation, approval arguments and form wording remain unchanged.'};}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const result=safetyMigrationProof(),manifest='D:/Claude/Q-Design/reviews/maison-safety-print-migration.json';if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({files:result.files.length,sites:result.files.reduce((n,f)=>n+f.edits.reduce((s,e)=>s+e.sites,0),0),passed:true}));}
