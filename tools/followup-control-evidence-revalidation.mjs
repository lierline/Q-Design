// Retain prior decisions only for identical arguments after this exact reviewed delta.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {hash,cssProperties,scanArguments} from './style-arguments-core.mjs';
const root=path.resolve(import.meta.dirname,'..'),designRef='c6592704870b6bc4d1fe0b68a1436075d23dbc73';
const normalize=s=>s.replaceAll('\r\n','\n');
const prior=(repo,ref,file)=>normalize(execFileSync('git',['show',`${ref}:${file}`],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024}));
const canonical='patterns/components.css',before=prior(root,designRef,canonical),after=normalize(fs.readFileSync(path.join(root,canonical),'utf8'));
const marker='/* Visible native file controls share the same outer target';const at=after.indexOf(marker);assert(at>=0);assert.equal(after.slice(0,at).trimEnd(),before.trimEnd(),'Existing canonical component rules changed');
const products=[['atelier','Q-Atelier','3c7eaa201063937200e939ca3ce488eeceb5801c'],['maison','Q-Works','a74d7ab64bba6b2f2bd7dbcbf6ba7fc7c8f60f1c'],['carnet','Q-Forge','3610286e47c982ef4e8c1afad43cbb404b483b36']];
const changes=[];
for(const [product,key,ref] of products){
 const repo=path.resolve(root,'..',key==='Q-Forge'?'DHR':key),part=PARTS.find(p=>p.src===canonical&&p.to[key]);assert(part);const copy=path.relative(repo,part.to[key]).replaceAll('\\','/'),oldCopy=prior(repo,ref,copy),newCopy=normalize(fs.readFileSync(path.join(repo,copy),'utf8'));
 assert.deepEqual(copyProblems(part,before,oldCopy),[]);assert.deepEqual(copyProblems(part,after,newCopy),[]);
 const deltas=new Map([[canonical,{before,after}], [copy,{before:oldCopy,after:newCopy}]]);
 if(product==='atelier'){
  const file='components/PasskeyCard.tsx',old=prior(repo,ref,file),now=normalize(fs.readFileSync(path.join(repo,file),'utf8'));
  const expected=old.replace('// 운영 인증 서버에서 꺼져 있으면 절 머리까지 통째로 숨는다(모든 사용자에게 «아직 안 켜짐» 칸을 보이지 않으려고).','// 운영 인증 서버에서 꺼져 있으면 통합 설정의 절은 숨기고, 전용 화면에는 비밀번호 로그인 안내를 표시한다.').replace('  // 확인 중이거나 서버에서 꺼져 있으면 아무것도 그리지 않는다(절 머리까지)','  // 통합 설정의 숨김 동작은 유지하고, 전용 화면이 빈 화면으로 남지 않게 한다.').replace("  if (gate === 'loading' || gate === 'off') return null;","  if (gate === 'loading' || (gate === 'off' && heading)) return null; if (gate === 'off') return <Alert kind=\"info\">지문 · 얼굴 로그인은 현재 제공되지 않습니다. 이메일과 비밀번호로 로그인해 주세요.</Alert>;");
  const intermediate=prior(repo,'4646c2ba',file);assert.equal(intermediate,expected,'The recorded intermediate presentation must match the reviewed delta');assert.equal(now,intermediate.replace('로그인해 주세요.','로그인하십시오.'),'Only the formal login guidance may change');deltas.set(file,{before:intermediate,after:now});
 }
 if(product==='carnet')continue; // No Carnet manual reports reference this delta.
 if(product==='maison')for(const file of ['components/shared/list-stats.tsx','app/(app)/warehouses/[id]/warehouse-items-panel.tsx']){
  const old=prior(repo,ref,file),now=normalize(fs.readFileSync(path.join(repo,file),'utf8'));let restored=now;
  if(file==='components/shared/list-stats.tsx'){const oldLines=old.split('\n'),newLines=now.split('\n');assert.equal(oldLines.length,newLines.length);const changed=newLines.flatMap((line,i)=>line===oldLines[i]?[]:[i]);assert.equal(changed.length,2);for(const i of changed){assert.equal(oldLines[i].trim(),'label: "사용중",');assert.equal(newLines[i].trim(),'label: "사용 중",');newLines[i]=oldLines[i];}restored=newLines.join('\n');assert(restored===old,'Only the two reviewed list labels may differ');}
  else {restored=now.replace('className="qd-control-icon qd-control-icon--danger disabled:opacity-50"','className="rounded-md p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"').replace('<X aria-hidden="true" />','<X className="h-3 w-3" />');assert.equal(restored,old,'Warehouse behavior or another source statement changed');}
  deltas.set(file,{before:old,after:now});
 }
 const req=createRequire(path.join(repo,'package.json')),ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 const oldArguments=new Map();
 const unchangedArguments=file=>{if(!oldArguments.has(file)){const d=deltas.get(file);const current=new Set(scanArguments(file,d.after,{ts,postcss,properties}).map(a=>hash(JSON.stringify(product==='atelier'?a:[file,a.line,a.kind,a.property,a.value]))));oldArguments.set(file,current);}return oldArguments.get(file);};
 // Match the exact registered manual report names. Do not touch generated decision reports.
 const names=product==='atelier'?['atelier-style-spread-review.json','atelier-style-bindings-review.json','atelier-style-consumer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-final-presentation-boundaries.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-html-content-review.json','atelier-dimension-flow-review.json','atelier-api-output-consumer-review.json','atelier-data-ratio-review.json','atelier-measured-coordinate-review.json','atelier-semantic-palette-review.json','atelier-color-flow-review.json','atelier-watermark-content-review.json','atelier-chart-layout-review.json']:product==='maison'?['maison-style-manual-review.json','maison-style-spread-review.json','maison-style-bindings-review.json','maison-accent-review.json']:[];
 for(const name of names){const full=path.join(root,'reviews',name);if(!fs.existsSync(full))continue;const report=JSON.parse(fs.readFileSync(full,'utf8'));let dirty=false;
  for(const record of report.records??[]){const own=deltas.get(record.path);
   if(own&&record.sourceHash===hash(own.before)){if(!unchangedArguments(record.path).has(record.argumentHash))continue;record.sourceHash=hash(own.after);dirty=true;changes.push({product,report:name,path:record.path,argumentHash:record.argumentHash,scope:'Identical argument, identical line; only the separately reviewed control/copy delta changed.'});}
   for(const e of record.evidence??[]){const d=deltas.get(e.path);if(!d||e.hash!==hash(d.before))continue;
    if(own&&!unchangedArguments(record.path).has(record.argumentHash))continue;
    const current=normalize(fs.readFileSync(path.join(repo,record.path),'utf8'));assert.equal(hash(current),record.sourceHash,'Consumer has an unrelated change');assert.equal(d.before.split('\n')[e.line-1],d.after.split('\n')[e.line-1],'Evidence line changed');e.hash=hash(d.after);dirty=true;changes.push({product,report:name,path:record.path,argumentHash:record.argumentHash,evidencePath:e.path,evidenceLine:e.line});
   }
  }if(dirty&&process.argv.includes('--write'))fs.writeFileSync(full,JSON.stringify(report,null,2)+'\n');
 }
}
const result={scope:'No new argument is approved. Exact canonical append, fingerprint-verified copies, two reviewed copy labels, one warehouse icon-control replacement and dedicated unavailable-passkey guidance. Unchanged source arguments/evidence lines only, using each product reviewer\'s actual argument hash format.',designRef,beforeHash:hash(before),afterHash:hash(after),changes};if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'reviews/followup-control-evidence-revalidation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({evidenceUpdates:changes.length,write:process.argv.includes('--write')}));
