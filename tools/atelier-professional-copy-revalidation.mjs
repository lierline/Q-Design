// Exact whole-source copy edits precede every fingerprint revalidation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties,runtimeFiles} from './style-arguments-core.mjs';
import {consumerReviewFiles} from './atelier-consumer-review-files.mjs';
import {beforeChoiceGlyphReview,historicalChoiceGlyphEvidence} from './choice-glyph-revalidation.mjs';
import {createFreshProofCache} from './fresh-proof-cache.mjs';
import {beforeCopyLeafOffsets} from './atelier-copy-leaf-offsets.mjs';
import {verifiesChoiceInventoryWithOfflineRevision} from './atelier-offline-cache-inventory.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier';
export const atelierCopyRef='ba10c2d0679a64505cd2a6bb411c5978798d456e',atelierCopyProductRef='75ea93d0cc9264e04353c2d7bd4553929fbf6b3d';
const manifest=root+'/reviews/atelier-professional-copy-revalidation.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
const copySourceCache=createFreshProofCache();
const names=[...new Set([...consumerReviewFiles,'atelier-parameter-leaves-review.json','atelier-supplementary-parameter-review.json','atelier-choice-columns-review.json','atelier-style-decisions.json'])];
const show=(repo,ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8',maxBuffer:128*1024*1024});
export function inspectAtelierProfessionalSources(){
 const ruleText=fs.readFileSync(root+'/patterns/professional-atelier-copy.json','utf8'),terms=JSON.parse(ruleText).terms,files=[...new Set(terms.flatMap(t=>t.paths))].sort(),texts=new Map(files.map(file=>[file,fs.readFileSync(product+'/'+file,'utf8')]));
 const req=createRequire(product+'/package.json'),domText=fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8');
 return copySourceCache('exact-professional-copy-sources',[['rules',new Map([['patterns/professional-atelier-copy.json',ruleText],['lib.dom.d.ts',domText]])],['complete-current-sources',texts]],()=>{
 const ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,domText);
 const sources=[];
 for(const file of files){
  const before=show(product,atelierCopyProductRef,file),after=texts.get(file);
  const result=applyBindings(file,before,[],termsForFile(terms,'atelier',file));
  assert.equal(after.replaceAll('\r\n','\n'),result.after.replaceAll('\r\n','\n'),'Only reviewed display literals may change: '+file);
  const newline=after.includes('\r\n')?'\r\n':'\n',alignedBefore=before.replaceAll('\r\n','\n').replaceAll('\n',newline);
  assert.deepEqual(scanArguments(file,after,{ts,postcss,properties}),scanArguments(file,alignedBefore,{ts,postcss,properties}),'Every style argument must stay exact: '+file);
  sources.push({path:file,beforeHash:hash(before),afterHash:hash(after),literalChanges:result.changes.length});
 }
 return sources;
 });
}
export function beforeAtelierProfessionalSource(file,code){
 if(!fs.existsSync(manifest))return code;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),record=saved.sources.find(r=>r.path===file);if(!record||hash(code)===record.beforeHash)return code;
 assert.equal(hash(code),record.afterHash,'Unreviewed source after professional copy: '+file);
 assert.deepEqual(inspectAtelierProfessionalSources(),saved.sources);
 const before=show(product,atelierCopyProductRef,file);assert.equal(hash(before),record.beforeHash);return before;
}
export function createAtelierCopyRevalidation(){
 const sources=inspectAtelierProfessionalSources(),reports=[];
 for(const name of names){
  const previous=JSON.parse(show(root,atelierCopyRef,'reviews/'+name)),current=structuredClone(previous),changes=[];
  const visit=(value,location)=>{
   if(!value||typeof value!=='object')return;
   const source=sources.find(s=>s.path===value.path);
   for(const key of ['hash','sourceHash'])if(source&&value[key]===source.beforeHash){
    changes.push({location:[...location,key],before:source.beforeHash,after:source.afterHash});value[key]=source.afterHash;
   }
   for(const [key,v] of Object.entries(value))visit(v,[...location,key]);
  };visit(current,[]);
  if(name==='atelier-choice-columns-review.json'){
   let inventoryHash=hash(JSON.stringify(runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)).map(p=>[p,hash(fs.readFileSync(product+'/'+p,'utf8'))])));
   if(fs.existsSync(manifest)){const saved=JSON.parse(fs.readFileSync(manifest,'utf8')).reports.find(r=>r.name===name),recorded=saved?.changes.find(c=>c.location.length===1&&c.location[0]==='inventoryHash')?.after;if(recorded&&inventoryHash!==recorded){assert(verifiesChoiceInventoryWithOfflineRevision(recorded));inventoryHash=recorded;}}
   changes.push({location:['inventoryHash'],before:previous.inventoryHash,after:inventoryHash});current.inventoryHash=inventoryHash;
  }
  if(changes.length)reports.push({name,beforeHash:hash(serialize(previous)),afterHash:hash(serialize(current)),changes,current});
 }
 return {version:1,ref:atelierCopyRef,productRef:atelierCopyProductRef,scope:'Only reviewed display literals change. Every complete styling argument is identical. Exact source/evidence fingerprints are rebound; no decision, value, line or caller is approved or omitted.',sources,reports};
}
export function beforeAtelierProfessionalReview(name,current){
 current=beforeCopyLeafOffsets(name,current);
 if(fs.existsSync(manifest)){
  const known=JSON.parse(fs.readFileSync(manifest,'utf8')).reports.find(r=>r.name===name);
  if(known&&hash(serialize(current))===known.beforeHash)return current;
 }
 current=beforeChoiceGlyphReview(name,current);
 if(!fs.existsSync(manifest))return current;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),report=saved.reports.find(r=>r.name===name);
 if(!report||hash(serialize(current))===report.beforeHash)return current;
 assert.deepEqual(inspectAtelierProfessionalSources(),saved.sources);
 assert.equal(hash(serialize(current)),report.afterHash,'Unexpected report content: '+name);
 const before=JSON.parse(serialize(current));
 for(const change of report.changes){const owner=change.location.slice(0,-1).reduce((v,k)=>v[k],before),key=change.location.at(-1);assert.equal(owner[key],change.after);owner[key]=change.before;}
 assert.equal(hash(serialize(before)),report.beforeHash);return before;
}
export function historicalAtelierCopyEvidence(evidence,recordEvidence){
 evidence=historicalChoiceGlyphEvidence(evidence,recordEvidence);
 if(!fs.existsSync(manifest))return evidence;
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),relevant=(recordEvidence??[]).filter(e=>saved.sources.some(s=>s.path===e.path));
 if(!relevant.some(e=>saved.sources.find(s=>s.path===e.path).beforeHash===e.hash))return evidence;
 assert.deepEqual(inspectAtelierProfessionalSources(),saved.sources);
 assert(relevant.every(e=>saved.sources.find(s=>s.path===e.path).beforeHash===e.hash),'Historical copy evidence cannot mix revisions');
 return evidence.map(e=>{const source=saved.sources.find(s=>s.path===e.path);if(!source)return e;assert([source.beforeHash,source.afterHash].includes(e.hash),'Unknown copy fingerprint');return {...e,hash:source.beforeHash};});
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=createAtelierCopyRevalidation(),proof={...result,reports:result.reports.map(({current,...r})=>r)};
 if(process.argv.includes('--write')){for(const r of result.reports)fs.writeFileSync(root+'/reviews/'+r.name,serialize(r.current));fs.writeFileSync(manifest,serialize(proof));}
 else{assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);for(const r of result.reports)assert.deepEqual(beforeChoiceGlyphReview(r.name,beforeCopyLeafOffsets(r.name,JSON.parse(fs.readFileSync(root+'/reviews/'+r.name,'utf8')))),r.current);}
 console.log(JSON.stringify({files:result.sources.length,literals:result.sources.reduce((n,s)=>n+s.literalChanges,0),reports:result.reports.length,rebound:result.reports.reduce((n,r)=>n+r.changes.length,0)}));
}
