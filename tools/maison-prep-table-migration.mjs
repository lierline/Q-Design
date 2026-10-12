import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {beforeMaisonProductionCopy} from './maison-production-copy.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref="d5cd6f5c732edf23b0ee10cd2f54350e0f8cb31c",manifest=root+'/reviews/maison-prep-table-migration.json';
export const prepTablePath="app/(app)/production/new/prep-sheet-fields.tsx",prepGlobalsPath='app/globals.css',prepCanonicalPath='patterns/foundation/maison-prep-table.css';
const edits=[
  {
    "from": "className={cn(\"rounded-md border\", !popovers && \"overflow-x-auto\")}",
    "to": "className={cn(\"qd-prep-table\", popovers && \"qd-prep-table--equipment\")}"
  },
  {
    "from": "className={cn(\"w-full text-sm\", !popovers && \"min-w-[40rem]\")}",
    "to": "className=\"qd-prep-table-grid text-sm\""
  },
  {
    "from": "목록이 표 안에 갇히므로, 이 표는 굴림 없이 폭에 맞춰 접는다(최소 폭 없음).",
    "to": "목록이 표 안에 갇히므로, 설비 표는 좁은 화면에서 항목별로 쌓는다."
  },
  {
    "from": "<Checkbox\n        checked={row.checked}",
    "to": "<label className=\"qd-prep-check\"><Checkbox\n        checked={row.checked}"
  },
  {
    "from": "aria-label={`${label} 확인`}\n      />",
    "to": "aria-label={`${label} 확인`}\n      /><span className=\"qd-prep-check-label\">확인</span></label>"
  },
  {
    "from": "className=\"text-muted-foreground hover:text-destructive\"",
    "to": "className=\"qd-prep-remove text-muted-foreground hover:text-destructive\""
  },
  {
    "from": "<td className={cn(TD, \"font-medium\")}>{r.name}</td>",
    "to": "<td className={cn(TD, \"font-medium\")} data-label=\"설비 및 초자명\">{r.name}</td>"
  },
  {
    "from": "<td className={TD} title={r.checked ? undefined : LOCKED}>",
    "to": "<td className={TD} title={r.checked ? undefined : LOCKED} data-label=\"설비 번호\">"
  },
  {
    "from": "<td className={cn(TD, \"text-xs\")}>",
    "to": "<td className={cn(TD, \"text-xs\")} data-label=\"검교정 일자\">"
  }
];
const git=file=>execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'});
export async function prepTablePlan(){const before=git(prepTablePath);let after=before;for(const edit of edits){assert.equal(after.split(edit.from).length-1,1);after=after.replace(edit.from,edit.to);}after=await formatProductCopy(repo,prepTablePath,after);const beforeGlobals=git(prepGlobalsPath),from='@import "./q-design.palette.css";';assert.equal(beforeGlobals.split(from).length-1,1);const afterGlobals=beforeGlobals.replace(from,from+'\n@import "./q-design.prep-table.css";');return [{path:prepTablePath,before,after,edits},{path:prepGlobalsPath,before:beforeGlobals,after:afterGlobals,edits:[{from,to:from+'\n@import "./q-design.prep-table.css";'}]}];}
export function beforePrepTableSource(file,code){if(![prepTablePath,prepGlobalsPath].includes(file))return code;code=beforeMaisonProductionCopy(file,code);const before=git(file);if(hash(before)===hash(code))return code;const oldIcons=JSON.parse(fs.readFileSync(root+'/reviews/maison-icon-handoff-migration.json','utf8')).records.find(r=>r.path===file);if(oldIcons&&hash(code)===oldIcons.beforeHash)return code;const saved=JSON.parse(fs.readFileSync(manifest,'utf8')).files.find(f=>f.path===file);assert(saved);assert.equal(saved.beforeHash,hash(before));assert.equal(hash(code),saved.afterHash,'Changed preparation source requires a fresh exact review');return before;}
export async function prepTableMigrationProof(){const files=await prepTablePlan();for(const f of files)assert.equal(hash(beforeMaisonProductionCopy(f.path,fs.readFileSync(repo+'/'+f.path,'utf8'))),hash(f.after),'Actual source must be the exact nine reviewed replacements and one import');const canonical=fs.readFileSync(root+'/'+prepCanonicalPath,'utf8');assert.deepEqual(copyProblems({lang:'css',layer:false},canonical,fs.readFileSync(repo+'/app/q-design.prep-table.css','utf8')),[]);return {version:1,productRef:ref,canonical:{path:prepCanonicalPath,hash:hash(canonical)},files:files.map(f=>({path:f.path,beforeHash:hash(f.before),afterHash:hash(f.after),edits:f.edits})),scope:'Nine exact preparation presentation edits and one stylesheet import. Business handlers, field data, process presets and reset semantics remain unchanged. Central CSS defines responsive equipment rows, wrapping, hit areas and shared grid width.'};}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const result=await prepTableMigrationProof();if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({files:result.files.length,sourceEdits:9,stylesheetImport:1,passed:true}));}
