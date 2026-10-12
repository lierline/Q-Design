// The six central glyph dimensions change representation, not their default size.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {consumerReviewFiles} from './atelier-consumer-review-files.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {createFreshProofCache} from './fresh-proof-cache.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',base='ba10c2d0679a64505cd2a6bb411c5978798d456e',manifest=root+'/reviews/choice-glyph-revalidation.json',temporary='D:/Claude/tmp/qd-phase83-glyph-report-baselines';
const serialize=v=>JSON.stringify(v,null,2)+'\n',norm=s=>s.replaceAll('\r\n','\n');
const glyphSourceCache=createFreshProofCache();
const productRefs={'Q-Atelier':['Q-Atelier','9f22faefa3bfb904f80be5c4c8a7dcf73ec59682'],'Q-Works':['Q-Works','e7be4ba17f345bf02704cb4735accadbb577e9f3'],'Q-Forge':['DHR','171aed618b5e6a5333d4d27aa5aa0389194cbf6d']};
const beforeCanonical=()=>norm(execFileSync('git',['show',base+':patterns/components.css'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}));
export function applyChoiceGlyphRules(before){
 const edits=[
  ['.qd-checkbox { width: 16px; height: 16px;','.qd-checkbox { width: var(--qd-choice-glyph-size); height: var(--qd-choice-glyph-size);'],
  ['.qd-checkbox-mark { width: 16px; height: 16px;','.qd-checkbox-mark { width: var(--qd-choice-glyph-size); height: var(--qd-choice-glyph-size);'],
  ['.qd-checkbox-icon { width: 12px; height: 12px;','.qd-checkbox-icon { width: calc(var(--qd-choice-glyph-size) * .75); height: calc(var(--qd-choice-glyph-size) * .75);']
 ];
 for(const [old,next]of edits){assert.equal(before.split(old).length,2,'One exact existing central glyph rule');before=before.replace(old,next);}return before;
}
export function beforeChoiceGlyphCanonical(code){
 if(!fs.existsSync(manifest))return code;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),source=saved.sources.find(s=>s.path==='patterns/components.css');
 if(hash(code)===source.beforeHash)return code;
 assert.equal(hash(code),source.afterHash,'Unreviewed canonical change after choice glyph migration');
 assert.deepEqual(inspectChoiceGlyphSources(),saved.sources);
 const before=beforeCanonical();assert.equal(hash(before),source.beforeHash);return before;
}
export function inspectChoiceGlyphSources(){
 const part=PARTS.find(p=>p.src==='patterns/components.css'),texts=new Map([[part.src,fs.readFileSync(root+'/'+part.src,'utf8')],...Object.entries(part.to).map(([key,full])=>[key,fs.readFileSync(full,'utf8')])]);
 return glyphSourceCache('exact-glyph-sources',[['complete-current-sources',texts]],()=>{
 const before=beforeCanonical(),after=norm(texts.get(part.src));assert.equal(after,applyChoiceGlyphRules(before));assert.match(after,/--qd-choice-glyph-size: 16px;/);
 const sources=[{path:part.src,beforeHash:hash(before),afterHash:hash(after)}];
 for(const [key,full]of Object.entries(part.to)){
  const copy=texts.get(key);assert.deepEqual(copyProblems(part,after,copy),[]);
  const [repo,ref]=productRefs[key],original=execFileSync('git',['show',ref+':app/q-design.components.css'],{cwd:'D:/Claude/'+repo,encoding:'utf8',maxBuffer:8*1024*1024});assert.deepEqual(copyProblems(part,before,original),[]);
  sources.push({path:(key==='Q-Atelier'?'':key==='Q-Works'?'maison/':'carnet/')+'app/q-design.components.css',key,beforeHash:hash(original),afterHash:hash(copy)});
 }
 return sources;
 });
}
const names=[...new Set([...consumerReviewFiles,'atelier-parameter-leaves-review.json','atelier-supplementary-parameter-review.json','atelier-choice-columns-review.json','atelier-style-decisions.json','maison-style-manual-review.json','maison-style-spread-review.json','maison-style-bindings-review.json','maison-accent-review.json','maison-current-navigation-review.json'])];
function changesFor(name,before,sources){
 const after=JSON.parse(serialize(before)),changes=[];
 const set=(owner,key,next,location)=>{if(owner[key]===next)return;changes.push({location:[...location,key],before:owner[key],after:next});owner[key]=next;};
 const req=createRequire(product+'/package.json'),ts=req('typescript'),postcss=createRequire(root+'/../Q-Works/package.json')('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 const oldCopy=fs.readFileSync(temporary+'/atelier-copy.css','utf8'),newCopy=fs.readFileSync(product+'/app/q-design.components.css','utf8'),scan=code=>scanArguments('app/q-design.components.css',code,{ts,postcss,properties,owner:'patterns/components.css'});
 const oldArgs=scan(oldCopy),newArgs=scan(newCopy);assert.equal(oldArgs.length,newArgs.length);
 const changedArgs=oldArgs.flatMap((old,i)=>{const current=newArgs[i];assert.deepEqual({...current,value:old.value},old,'Only complete glyph declaration values may change');return old.value===current.value?[]:[{old,current}];});assert.equal(changedArgs.length,6);
 const walk=(value,location)=>{
  if(!value||typeof value!=='object')return;
  const file=name.startsWith('maison-')&&value.path==='app/q-design.components.css'?'maison/'+value.path:value.path,source=sources.find(s=>s.path===file);
  for(const key of ['hash','sourceHash'])if(source&&value[key]===source.beforeHash)set(value,key,source.afterHash,location);
  if(name==='atelier-style-decisions.json'&&value.path==='app/q-design.components.css'&&value.argumentHash){
   const pair=changedArgs.find(({old})=>old.line===value.line&&old.kind===value.kind&&old.property===value.property&&old.value===value.value);
   if(pair){const {old,current}=pair;set(value,'value',current.value,location);
    const oldHash=hash(JSON.stringify(old)),newHash=hash(JSON.stringify(current));assert.equal(value.argumentHash,oldHash);set(value,'argumentHash',newHash,location);
   }
  }
  for(const [key,child]of Object.entries(value))walk(child,[...location,key]);
 };walk(after,[]);
 if(name==='maison-current-navigation-review.json'){const source=sources.find(s=>s.path==='patterns/components.css');assert.equal(after.centralHash,source.beforeHash);set(after,'centralHash',source.afterHash,[]);}
 return {name,beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),changes,after};
}
export function beforeChoiceGlyphReview(name,current){
 if(!fs.existsSync(manifest))return current;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),record=saved.reports.find(r=>r.name===name);if(!record||hash(serialize(current))===record.beforeHash)return current;
 assert.deepEqual(inspectChoiceGlyphSources(),saved.sources);assert.equal(hash(serialize(current)),record.afterHash,'Unexpected report content (choice glyph): '+name);
 const before=JSON.parse(serialize(current));for(const change of record.changes){const owner=change.location.slice(0,-1).reduce((v,k)=>v[k],before),key=change.location.at(-1);assert.deepEqual(owner[key],change.after);owner[key]=change.before;}
 assert.equal(hash(serialize(before)),record.beforeHash);return before;
}
export function historicalChoiceGlyphEvidence(evidence,recordEvidence){
 if(!fs.existsSync(manifest))return evidence;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8'));
 const relevant=(recordEvidence??[]).filter(e=>saved.sources.some(s=>s.path===e.path));
 for(const e of relevant){const source=saved.sources.find(s=>s.path===e.path);assert([source.beforeHash,source.afterHash].includes(e.hash),'Unknown historical glyph fingerprint');}
 const historical=new Set(relevant.filter(e=>saved.sources.find(s=>s.path===e.path).beforeHash===e.hash).map(e=>e.path));
 if(!historical.size)return evidence;
 assert.deepEqual(inspectChoiceGlyphSources(),saved.sources);
 for(const e of relevant){const source=saved.sources.find(s=>s.path===e.path);assert([source.beforeHash,source.afterHash].includes(e.hash),'Unknown historical glyph fingerprint');if(historical.has(e.path))assert.equal(e.hash,source.beforeHash,'Glyph evidence cannot mix source revisions');}
 return evidence.map(e=>{const source=saved.sources.find(s=>s.path===e.path);if(!source||!historical.has(e.path))return e;assert([source.beforeHash,source.afterHash].includes(e.hash));return {...e,hash:source.beforeHash};});
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--prepare')){
  assert(!fs.existsSync(manifest)&&!fs.existsSync(temporary),'Preserve the complete glyph review baseline');assert.equal(norm(fs.readFileSync(root+'/patterns/components.css','utf8')),beforeCanonical());fs.mkdirSync(temporary,{recursive:true});
  for(const name of names)if(fs.existsSync(root+'/reviews/'+name))fs.copyFileSync(root+'/reviews/'+name,temporary+'/'+name);
  const part=PARTS.find(p=>p.src==='patterns/components.css'),sources=[];for(const [key,full]of Object.entries(part.to)){const copy=fs.readFileSync(full,'utf8');assert.deepEqual(copyProblems(part,beforeCanonical(),copy),[]);sources.push({key,hash:hash(copy)});if(key==='Q-Atelier')fs.writeFileSync(temporary+'/atelier-copy.css',copy);}
  fs.writeFileSync(temporary+'/sources.json',serialize(sources));console.log('Exact glyph report baselines prepared.');
 }else if(process.argv.includes('--check')){
  const saved=JSON.parse(fs.readFileSync(manifest,'utf8'));assert.equal(saved.ref,base);assert.deepEqual(inspectChoiceGlyphSources(),saved.sources);
  for(const record of saved.reports)beforeChoiceGlyphReview(record.name,JSON.parse(fs.readFileSync(root+'/reviews/'+record.name,'utf8')));
  console.log(JSON.stringify({dimensions:6,reports:saved.reports.length,passed:true}));
 }else{
  const sources=inspectChoiceGlyphSources(),reports=names.filter(name=>fs.existsSync(temporary+'/'+name)).map(name=>changesFor(name,JSON.parse(fs.readFileSync(temporary+'/'+name,'utf8')),sources)).filter(r=>r.changes.length);
  const proof={version:1,ref:base,scope:'Only six central glyph dimensions use the existing 16px choice glyph role; the inner icon keeps the 0.75 ratio. Default dimensions, all other CSS, callbacks and data are unchanged. Full source/copy and exact report inverses remain mandatory.',sources,reports:reports.map(({after,...r})=>r)};
  if(process.argv.includes('--write')){assert(!fs.existsSync(manifest),'Do not overwrite the glyph migration proof');for(const record of reports)fs.writeFileSync(root+'/reviews/'+record.name,serialize(record.after));fs.writeFileSync(manifest,serialize(proof));}
  else{assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);for(const record of reports)assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/'+record.name,'utf8')),record.after);}
  console.log(JSON.stringify({dimensions:6,reports:reports.length,rebound:reports.reduce((n,r)=>n+r.changes.length,0)}));
 }
}
