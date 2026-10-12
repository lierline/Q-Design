import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
import {responsiveProfilePath as profileGridPath,responsiveProfileSources as profileGridSources,normalizeResponsiveProfile as normalizeProfileGrid,responsiveDesignRef as ref} from './atelier-profile-responsive-source.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json'),ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const bodies=profileGridSources(),read=p=>normalizeProfileGrid(fs.readFileSync(p,'utf8')),serialize=j=>JSON.stringify(j,null,2)+'\n';
assert([bodies.beforeHash,bodies.afterHash].includes(hash(read(repo+'/'+profileGridPath))),'Unrelated product changes');
const scan=code=>new Map(scanArguments(profileGridPath,code,{ts,postcss,properties}).map(r=>[hash(JSON.stringify(r)),r]));const oldArgs=scan(bodies.before),newArgs=scan(bodies.after);
function contexts(code,line,text){const sf=ts.createSourceFile(profileGridPath,code,99,true,4),compact=s=>s.replace(/\s+/g,' ').trim(),matches=[];function visit(n){const at=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,end=sf.getLineAndCharacterOfPosition(n.end).line+1,full=compact(n.getText(sf));if(at<=line&&end>=line&&(full===compact(text)||text.length===240&&full.startsWith(compact(text))))matches.push(full);ts.forEachChild(n,visit);}visit(sf);return matches.sort();}
function flowCaller(code,caller,prop){const sf=ts.createSourceFile(profileGridPath,code,99,true,4),matches=[];function visit(n){if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===caller.line&&n.tagName.getText(sf)===caller.tag){const attr=n.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.text===prop);if(caller.value==null){assert(!attr);assert.equal(caller.argumentHashes.length,0);}else{assert(attr&&sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line+1===caller.attributeLine);assert.equal(attr.initializer?.getText(sf),caller.value);}matches.push(n.getText(sf));}ts.forEachChild(n,visit);}visit(sf);assert.equal(matches.length,1);return matches[0];}
const reviewSource=read(root+'/tools/atelier-style-review.mjs');const names=[...reviewSource.matchAll(/'((?:atelier-)[a-z-]+\.json)'/g)].map(m=>m[1]);
names.push('atelier-parameter-leaves-review.json');
const prepared=[];let records=0,evidence=0;
for(const name of [...new Set(names)]){
 if(name==='atelier-profile-responsive-review.json')continue; // Fresh nine-input proof, absent from the pinned prior review set.
 const before=JSON.parse(execFileSync('git',['show',ref+':reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})),after=structuredClone(before),changes=[],metadataChanges=[];
 for(const [index,row] of (after.records??[]).entries()){
  if(row.path===profileGridPath){assert.equal(row.sourceHash,bodies.beforeHash);assert.deepEqual(newArgs.get(row.argumentHash),oldArgs.get(row.argumentHash));assert(oldArgs.has(row.argumentHash),'Changed arguments require fresh review');
   for(const c of row.consumerContext??[]){const old=contexts(bodies.before,c.line,c.text);assert(old.length);assert.deepEqual(contexts(bodies.after,c.line,c.text),old,'Changed complete consumer AST cannot inherit a review');}
   row.sourceHash=bodies.afterHash;records++;
  }
  for(const e of row.evidence??[])if(e.path===profileGridPath){assert.equal(e.hash,bodies.beforeHash);assert.equal(hash(row.path===profileGridPath?bodies.after:read(repo+'/'+row.path)),row.sourceHash);const old=bodies.before.split('\n')[e.line-1],next=bodies.after.split('\n')[e.line-1];assert(old!==undefined&&old===next,'Changed evidence line requires fresh review');e.hash=bodies.afterHash;evidence++;}
  if(JSON.stringify(row)!==JSON.stringify(before.records[index]))changes.push({index,before:before.records[index],after:row});
 }
 function metadata(value,location){
  if(!value||typeof value!=='object')return;
  if(value.path===profileGridPath&&value.hash===bodies.beforeHash){
   assert(location.includes('evidence')&&Number.isInteger(value.line),'Unrecognized declaration evidence');
   assert.equal(bodies.before.split('\n')[value.line-1],bodies.after.split('\n')[value.line-1],'Changed declaration line requires fresh review');
   metadataChanges.push({location:[...location,'hash'],kind:'unchanged-declaration-line',before:bodies.beforeHash,after:bodies.afterHash});value.hash=bodies.afterHash;
  }
  if(value.path===profileGridPath&&value.sourceHash===bodies.beforeHash){
   const sourceIndex=location[0]==='files'&&JSON.stringify(Object.keys(value).sort())==='["path","sourceHash"]';
   if(!sourceIndex){
    if(typeof value.consumer==='string'){assert(Number.isInteger(value.line));const old=contexts(bodies.before,value.line,value.consumer);assert(old.length);assert.deepEqual(contexts(bodies.after,value.line,value.consumer),old,'Changed caller AST cannot inherit metadata');}
    else if(name==='atelier-fold-grid-review.json'&&location[0]==='calls'){for(const [line,text]of [[value.line,value.value],[value.styleLine,value.context]]){const old=contexts(bodies.before,line,text);assert(old.length);assert.deepEqual(contexts(bodies.after,line,text),old,'Complete foldGrid expression and JSX opening must remain identical');}}
    else{assert(location[0]==='flows'&&location[2]==='callers'&&(typeof value.value==='string'||value.value==null),'Unrecognized caller metadata: '+name+' '+location.join('.')+' '+Object.keys(value).join(','));const flow=after.flows[location[1]],prop=flow.prop,caller={...value,tag:value.tag??flow.component};assert.deepEqual(value.argumentHashes.map(h=>newArgs.get(h)),value.argumentHashes.map(h=>oldArgs.get(h)));assert(value.argumentHashes.every(h=>oldArgs.has(h)));assert.equal(flowCaller(bodies.before,caller,prop),flowCaller(bodies.after,caller,prop),'Complete JSX opening props must remain identical');}
   }
   metadataChanges.push({location:[...location,'sourceHash'],kind:sourceIndex?'exact-source-inventory':'unchanged-complete-caller',before:bodies.beforeHash,after:bodies.afterHash});value.sourceHash=bodies.afterHash;
  }
  for(const [key,item]of Object.entries(value))metadata(item,[...location,key]);
 }
 for(const [key,value]of Object.entries(after))if(key!=='records')metadata(value,[key]);
 if(changes.length||metadataChanges.length)prepared.push({name,before,after,changes,metadataChanges});
}
const proof={version:2,ref,path:profileGridPath,beforeHash:bodies.beforeHash,afterHash:bodies.afterHash,scope:'One exact responsive layout expression and one copy spacing correction only. Existing arguments, complete consumer AST contexts and referenced declarations must remain identical. Repeated caller metadata also requires identical complete JSX. No new decision is approved.',reports:prepared.map(p=>({name:p.name,beforeHash:hash(serialize(p.before)),afterHash:hash(serialize(p.after)),changes:[...p.changes.map(c=>({location:['records',c.index],before:c.before,after:c.after})),...p.metadataChanges]}))};
if(process.argv.includes('--write')){assert.equal(hash(read(repo+'/'+profileGridPath)),bodies.afterHash);for(const p of prepared)assert.equal(hash(read(root+'/reviews/'+p.name)),hash(serialize(p.before)),'Only exact pinned reports may be rebound');for(const p of prepared)fs.writeFileSync(root+'/reviews/'+p.name,serialize(p.after));fs.writeFileSync(root+'/reviews/atelier-profile-responsive-revalidation.json',serialize(proof));}
else if(process.argv.includes('--check')){for(const p of prepared)assert.equal(hash(read(root+'/reviews/'+p.name)),hash(serialize(p.after)));assert.deepEqual(JSON.parse(read(root+'/reviews/atelier-profile-responsive-revalidation.json')),proof);}
console.log(JSON.stringify({reports:prepared.length,records,evidence,callerMetadata:prepared.reduce((n,p)=>n+p.metadataChanges.length,0)}));
