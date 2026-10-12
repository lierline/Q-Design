// Only seven control-height substitutions and two named role recipes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {beforeNavigationReport} from './maison-back-navigation-evidence.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works'),require=createRequire(product+'/package.json'),ts=require('typescript'),postcss=require('postcss');
const target='components/shared/page-skeleton.tsx',beforeHash='2b6ef0392988643e52e4570931023c9f0004c4707d50d07919c293a559734a9c',afterHash='44a41bb4bf676bfca99af266a6a7bf9953fb817fd567a1485e41aea3c25d91b7';
const norm=s=>s.replaceAll('\r\n','\n'),read=file=>fs.readFileSync(file,'utf8');
const properties=cssProperties(ts,read(path.join(path.dirname(require.resolve('typescript')),'lib.dom.d.ts')));
export function verifyLoadingControls(before,after,migration){
 before=norm(before);after=norm(after);assert.equal(hash(before),beforeHash);assert.equal(hash(after),afterHash);
 assert.equal(migration.path,target);assert.equal(migration.beforeHash,beforeHash);assert.equal(migration.afterHash,afterHash);assert.equal(migration.controlsChanged,7);
 assert.equal(migration.anchor,'const block = "qd-skeleton border";');assert.deepEqual(migration.addedDeclarations,['const control = "qd-skeleton h-[var(--qd-control-height)]";','const compact =\n  "qd-skeleton h-[var(--qd-control-height-sm)] qa-touch-44 [@media(pointer:coarse)]:min-h-[var(--qd-control-height)]";']);
 assert.equal(migration.changes.length,6);assert.equal(migration.changes.reduce((n,c)=>n+c.count,0),7);
 let expected=before.replace(migration.anchor,migration.anchor+'\n'+migration.addedDeclarations.join('\n'));
 for(const c of migration.changes){assert.equal(expected.split(c.before).length-1,c.count);expected=expected.replaceAll(c.before,c.after);}
 assert.equal(after,expected,'Only the exact seven control placeholders may change');
 assert(after.includes('className={`h-9 w-52 ${line}`}'),'Title placeholder keeps its independent height');
}
export function loadingControlBodies(){
 const migration=JSON.parse(read(root+'/reviews/maison-loading-control-migration.json')),before=read(root+'/'+migration.previous),canonical=read(root+'/'+migration.canonical),actual=read(product+'/'+target);
 verifyLoadingControls(before,canonical,migration);assert.equal(norm(actual),norm(canonical));
 const newline=actual.includes('\r\n')?'\r\n':'\n';
 let oldActual=actual.replace(migration.anchor+newline+migration.addedDeclarations.join('\n').replaceAll('\n',newline),migration.anchor);
 for(const c of migration.changes){assert.equal(oldActual.split(c.after).length-1,c.count);oldActual=oldActual.replaceAll(c.after,c.before);}
 assert.equal(hash(oldActual),beforeHash);
 return {migration,before:oldActual,after:actual,insertAfterLine:norm(before).split('\n').indexOf(migration.anchor)+1};
}
const candidateId=a=>hash(JSON.stringify([target,a.line,a.kind,a.property,a.value]));
function contextExists(code,line,text){
 const sf=ts.createSourceFile(target,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),compact=s=>s.replace(/\s+/g,' ').trim();let found=false;
 const visit=node=>{const start=sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,end=sf.getLineAndCharacterOfPosition(node.end).line+1;if(start<=line&&end>=line&&compact(node.getText(sf))===compact(text))found=true;if(!found)ts.forEachChild(node,visit);};visit(sf);return found;
}
export function retainLoadingControlEvidence(input,bodies=loadingControlBodies()){
 const {before,after,insertAfterLine}=bodies,review=structuredClone(input);
 const oldArgs=new Map(scanArguments(target,before,{ts,postcss,properties}).map(a=>[candidateId(a),a]));
 const newArgs=new Map(scanArguments(target,after,{ts,postcss,properties}).map(a=>[candidateId(a),a]));
 const insertedLines=bodies.migration.addedDeclarations.join('\n').split('\n').length;
 const relocate=line=>line>insertAfterLine?line+insertedLines:line;
 for(const row of review.records??[]){
  if(row.path!==target&&!(row.evidence??[]).some(e=>e.path===target))continue;
  if(row.path===target){
   assert.equal(row.sourceHash,beforeHash,'Only the exact prior reviewed source can retain evidence');
   const old=oldArgs.get(row.argumentHash);assert(old,'Old review must identify an actual lexical argument');
   const expected={...old,line:relocate(old.line)},next=newArgs.get(candidateId(expected));assert.deepEqual(next,expected,'Changed arguments cannot inherit an old decision');
   row.sourceHash=afterHash;row.line=next.line;row.argumentHash=candidateId(next);
   for(const context of row.consumerContext??[]){assert(Number.isInteger(context.line));assert(contextExists(before,context.line,context.text));context.line=relocate(context.line);assert(contextExists(after,context.line,context.text));}
  }
  for(const e of row.evidence??[])if(e.path===target){
   assert.equal(e.hash,beforeHash);const line=relocate(e.line);assert.equal(norm(before).split('\n')[e.line-1],norm(after).split('\n')[line-1],'Changed source line cannot retain evidence');e.hash=afterHash;e.line=line;
  }
 }
 return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--check']);const bodies=loadingControlBodies();
 for(const [name,count]of [['maison-style-manual-review',18],['maison-style-bindings-review',3]]){
  const proof=JSON.parse(read(root+'/reviews/'+name+'-loading-revalidation.json')),current=beforeNavigationReport(name,JSON.parse(read(root+'/reviews/'+name+'.json')));
  assert.equal(proof.records.length,count);assert.equal(hash(JSON.stringify(current,null,2)+'\n'),proof.afterReportHash);
  const reconstructed=structuredClone(current);
  for(const item of proof.records){assert.deepEqual(current.records[item.index],item.after);reconstructed.records[item.index]=item.before;}
  assert.equal(hash(JSON.stringify(reconstructed,null,2)+'\n'),proof.beforeReportHash,'All other review fields must remain unchanged');
  assert.deepEqual(retainLoadingControlEvidence(reconstructed,bodies),current);
 }
 console.log('Seven loading control heights verified; twenty-one unchanged exact argument or caller reviews retained.');
}
