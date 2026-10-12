import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {baseline,verifyBackNavigation} from './maison-back-navigation.mjs';
import {beforeMonoRootReport} from './mono-root-revalidation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works');
const req=createRequire(product+'/package.json'),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const names=['maison-style-manual-review','maison-style-spread-review','maison-style-bindings-review','maison-accent-review'];
const proofFile=root+'/reviews/maison-back-navigation-revalidation.json';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8')),serialize=j=>JSON.stringify(j,null,2)+'\n';
const id=(file,a)=>hash(JSON.stringify([file,a.line,a.kind,a.property,a.value]));
function bodies(){
 const migration=read(root+'/reviews/maison-back-navigation-migration.json');assert.equal(migration.baseline,baseline);assert.equal(migration.records.length,144);
 return new Map(migration.records.map(r=>{
  const before=execFileSync('git',['show',baseline+':'+r.path],{cwd:product,encoding:'utf8',maxBuffer:10*1024*1024}),after=execFileSync('git',['show','160c7731e05400259ee75cc49274625b3a667e1a601e:'+r.path],{cwd:product,encoding:'utf8',maxBuffer:10*1024*1024});
  verifyBackNavigation(before.replaceAll('\r\n','\n'),after.replaceAll('\r\n','\n'),r.path);
  assert.equal(hash(before.replaceAll('\r\n','\n')),r.beforeHash);assert.equal(hash(after.replaceAll('\r\n','\n')),r.afterHash);
  const scan=code=>new Map(scanArguments(r.path,code,{ts,postcss,properties}).map(a=>[id(r.path,a),a]));
  return[r.path,{before,after,beforeHash:hash(before),afterHash:hash(after),oldArgs:scan(before),newArgs:scan(after)}];
 }));
}
export function retainNavigationEvidence(input,sources){
 const output=structuredClone(input);
 for(const row of output.records){
  const b=sources.get(row.path);
  if(b){
   assert.equal(row.sourceHash,b.beforeHash);const old=b.oldArgs.get(row.argumentHash);assert(old,'Original review must identify an actual argument');
   assert.deepEqual(b.newArgs.get(row.argumentHash),old,'Changed arguments require a new review');
   if(Array.isArray(row.consumerContext))for(const context of row.consumerContext){
    const matches=code=>{const sf=ts.createSourceFile(row.path,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),result=[];const compact=s=>s.replace(/\s+/g,' ').trim();const visit=n=>{const start=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,end=sf.getLineAndCharacterOfPosition(n.end).line+1,text=compact(n.getText(sf));if(start<=context.line&&end>=context.line&&(text===context.text||(context.text.length===240&&text.startsWith(context.text))))result.push(text);ts.forEachChild(n,visit);};visit(sf);return result.sort();};
    const before=matches(b.before);assert(before.length,'Consumer context must resolve to actual full AST nodes');assert.deepEqual(matches(b.after),before,'Full consumer nodes must remain unchanged');
   }
   row.sourceHash=b.afterHash;
  }
  for(const e of row.evidence??[]){const source=sources.get(e.path);if(!source)continue;
   assert.equal(e.hash,source.beforeHash);assert(Number.isInteger(e.line)&&e.line>0);assert.equal(source.before.split('\n')[e.line-1],source.after.split('\n')[e.line-1],'Evidence lines must remain unchanged');e.hash=source.afterHash;
  }
 }
 return output;
}
export function beforeNavigationReport(name,current){
 current=beforeMonoRootReport(name+'.json',current);
 if(!fs.existsSync(proofFile))return current;
 const p=read(proofFile).reports.find(r=>r.name===name);if(!p)return current;
 assert.equal(hash(serialize(current)),p.afterHash);const before=structuredClone(current);
 for(const item of p.records){assert.deepEqual(before.records[item.index],item.after);before.records[item.index]=item.before;}
 assert.equal(hash(serialize(before)),p.beforeHash);return before;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2];assert(['--write','--check'].includes(mode)&&process.argv.length===3);const sources=bodies();
 if(mode==='--write'){
  assert(!fs.existsSync(proofFile));const reports=names.map(name=>{const before=read(root+'/reviews/'+name+'.json'),after=retainNavigationEvidence(before,sources),records=[];before.records.forEach((r,index)=>{if(JSON.stringify(r)!==JSON.stringify(after.records[index]))records.push({index,before:r,after:after.records[index]});});return{name,beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),records,after};});
  assert.deepEqual(reports.map(r=>r.records.length),[24,27,11,13]);
  for(const r of reports)fs.writeFileSync(root+'/reviews/'+r.name+'.json',serialize(r.after));
  fs.writeFileSync(proofFile,serialize({version:1,baseline,scope:'Exactly 75 unchanged arguments and unchanged evidence lines revalidated against the approved 144 class-only navigation edits.',reports:reports.map(({after,...r})=>r)}));
 }else{
  const proof=read(proofFile);assert.equal(proof.baseline,baseline);assert.deepEqual(proof.reports.map(r=>r.records.length),[24,27,11,13]);
  for(const name of names){const current=JSON.parse(execFileSync('git',['show','63372ef3622c9ae2eb7f2584fc058f0d0167704b:reviews/'+name+'.json'],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));assert.deepEqual(retainNavigationEvidence(beforeNavigationReport(name,current),sources),current);}
  const {createCurrentMaisonNavigation}=await import('./maison-current-navigation.mjs');assert.deepEqual(read(root+'/reviews/maison-current-navigation-review.json'),createCurrentMaisonNavigation(),'The completed handoff also requires fresh exact current navigation evidence');
 }
 console.log('Historical 75 decisions and 144 class edits revalidated. Current Maison navigation evidence checked separately.');
}
