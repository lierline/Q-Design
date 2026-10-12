// Whole-source inverse for one CSS import. Existing metadata and boot scripts remain exact.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {scanArguments,cssProperties,hash} from './style-arguments-core.mjs';
import {beforeChoiceGlyphReview} from './choice-glyph-revalidation.mjs';
const root='D:/Claude/Q-Design',ref='63372ef3622c9ae2eb7f2584fc058f0d0167704b';
const req=createRequire('D:/Claude/Q-Atelier/package.json'),ts=req('typescript'),postcss=createRequire('D:/Claude/Q-Works/package.json')('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const serialize=j=>JSON.stringify(j,null,2)+'\n',read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const plans=[['maison','Q-Works','63a292194b882363fc6c1f3815f93c5664f8d7b5','maison-style-manual-review.json'],['carnet','DHR','b5e873e1f5ce646a76c8c53a6b1c37a26d8bc81f','carnet-script-boundaries.json']];
export function inspectMonoImport(before,after){
 const lines=before.split('\n'),line=lines.findIndex(s=>/^import ['"]\.\/globals\.css['"];\s*$/.test(s));assert(line>=0);
 const quote=lines[line].includes('"')?'"':"'",added=`import ${quote}./q-design.mono-fonts.css${quote};`;
 assert.equal(after,[...lines.slice(0,line+1),added,...lines.slice(line+1)].join('\n'),'Only the exact shared font import may change the root layout');
 return line+1;
}
export function beforeMaisonPullToRefreshRoot(after){
 const base=execFileSync('git',['show','160c7731e05400259ee75cc49274625b3a667e1a601e:app/layout.tsx'],{cwd:'D:/Claude/Q-Works',encoding:'utf8'}).replaceAll('\r\n','\n');
 const expected=base.replace('import { AppWindowTitle } from "@/components/shared/app-window-title";','import { AppWindowTitle } from "@/components/shared/app-window-title";\nimport { PullToRefresh } from "@/components/shared/pull-to-refresh";').replace('        <AppWindowTitle />','        <AppWindowTitle />\n        {/* 안드로이드 앱 안에서만: 맨 위에서 당기면 화면 전체를 다시 불러온다 */}\n        <PullToRefresh />');
 assert.equal(after,expected,'The completed Maison handoff may add only the exact pull-to-refresh root import and mount. Existing metadata, font registration and boot scripts must stay exact.');
 return base;
}
export function createMonoRootReviews(selected=['maison','carnet']){
 const sources=[],reports=[];
 for(const [product,repo,productRef,name] of plans){
  if(!selected.includes(product))continue;
  const folder='D:/Claude/'+repo,file='app/layout.tsx',before=execFileSync('git',['show',productRef+':'+file],{cwd:folder,encoding:'utf8'}).replaceAll('\r\n','\n'),after=read(folder+'/'+file),fontRoot=product==='maison'?beforeMaisonPullToRefreshRoot(after):after,insert=inspectMonoImport(before,fontRoot);
  const oldArgs=scanArguments(file,before,{ts,postcss,properties}),newArgs=scanArguments(file,after,{ts,postcss,properties});
  const fontArgs=scanArguments(file,fontRoot,{ts,postcss,properties});
  assert.deepEqual(fontArgs,oldArgs.map(a=>({...a,line:a.line>insert?a.line+1:a.line})),'Every metadata argument and boot-script fragment must remain exact');
  assert.deepEqual(newArgs.map(({line,...a})=>a),fontArgs.map(({line,...a})=>a),'The root shell mount must preserve every complete argument in order');
  const prior=JSON.parse(execFileSync('git',['show',ref+':reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})),next=JSON.parse(serialize(prior));let rebound=0;
  for(const row of next.records)if(row.path===file){
   assert.equal(row.sourceHash,hash(before));const oldLine=row.line;
   const argument=oldArgs.find(a=>a.line===oldLine&&hash(JSON.stringify([file,a.line,a.kind,a.property,a.value]))===row.argumentHash);assert(argument,'Exact prior reviewed argument must still exist');
   const line=newArgs[oldArgs.indexOf(argument)].line;
   row.sourceHash=hash(after);row.line=line;row.argumentHash=hash(JSON.stringify([file,line,argument.kind,argument.property,argument.value]));
   for(const e of row.evidence??[])if(e.path===file){if(e.hash)assert.equal(e.hash,hash(before));const oldEvidenceLine=before.split('\n')[e.line-1],newEvidenceLine=e.line===oldLine?line:e.line>insert?e.line+1:e.line;assert.equal(oldEvidenceLine,after.split('\n')[newEvidenceLine-1],'Only an exact unchanged evidence line may be rebound');if(e.hash)e.hash=hash(after);e.line=newEvidenceLine;}
   rebound++;
  }
  assert.equal(rebound,product==='maison'?2:12);
  sources.push({product,path:file,productRef,beforeHash:hash(before),afterHash:hash(after),insert});
  reports.push({name,rebound,beforeHash:hash(serialize(prior)),afterHash:hash(serialize(next)),next});
 }
 return {ref,sources,reports};
}
export function beforeMonoRootReport(name,current){
 current=beforeChoiceGlyphReview(name,current);
 if(name!=='maison-style-manual-review.json')return current;
 const result=createMonoRootReviews(['maison']),report=result.reports.find(r=>r.name===name);
 if(hash(serialize(current))===report.beforeHash)return current;
 assert.deepEqual(current,report.next,'Only the verified root import and mount fingerprints may be restored');
 return JSON.parse(execFileSync('git',['show',ref+':reviews/'+name],{cwd:root,encoding:'utf8'}));
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),filters=args.filter(a=>a.startsWith('--only=')),selected=filters.length?filters[0].slice(7).split(','):['maison','carnet'];
 if(filters.length>1||args.some(a=>!['--write','--check'].includes(a)&&!a.startsWith('--only='))||selected.some(p=>!['maison','carnet'].includes(p))||new Set(selected).size!==selected.length||filters.length&&args.includes('--write'))throw Error('Use --write or --check; scoped --only=maison,carnet is read-only.');
 const result=createMonoRootReviews(selected),proof={...result,reports:result.reports.map(({next,...r})=>r)};
 if(process.argv.includes('--write')){for(const r of result.reports)fs.writeFileSync(root+'/reviews/'+r.name,serialize(r.next));fs.writeFileSync(root+'/reviews/mono-root-revalidation.json',serialize(proof));}
 else{const saved=JSON.parse(read(root+'/reviews/mono-root-revalidation.json'));assert.deepEqual({...saved,sources:saved.sources.filter(s=>selected.includes(s.product)),reports:saved.reports.filter(r=>result.reports.some(current=>current.name===r.name))},proof);for(const r of result.reports)assert.deepEqual(JSON.parse(read(root+'/reviews/'+r.name)),r.next);}
 console.log(JSON.stringify({imports:result.sources.length,rebound:result.reports.reduce((n,r)=>n+r.rebound,0)}));
}
