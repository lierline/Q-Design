import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {createSizeRendererReview} from './atelier-size-renderer-review.mjs';
import {createWidgetWidthReview} from './atelier-widget-width-review.mjs';
import {createRendererEnumReview} from './atelier-renderer-enum-review.mjs';
import {hash} from './style-arguments-core.mjs';import {PARTS} from './sync-parts.mjs';import {copyProblems} from './audit-coverage-core.mjs';
import {createRequire} from 'node:module';import {validateTypographyLinks} from './typography-links-core.mjs';
import {beforeAtelierProfessionalReview,historicalAtelierCopyEvidence} from './atelier-professional-copy-revalidation.mjs';
import {historicalChoiceGlyphEvidence} from './choice-glyph-revalidation.mjs';
const root='D:/Claude/Q-Design',manifest=root+'/reviews/global-typography-revalidation.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
const beforeProductRefs={maison:'09280b6a07c6d34bba4bc2e63c7656d45279e6cf',carnet:'69163745ec69a2cbcf6af82e3e4b23f456259ced'};
const productRoots={atelier:'D:/Claude/Q-Atelier',maison:'D:/Claude/Q-Works',carnet:'D:/Claude/DHR'};
const names=new Map([['atelier-size-renderer-review.json',createSizeRendererReview],['atelier-widget-width-review.json',createWidgetWidthReview],['atelier-renderer-enum-review.json',createRendererEnumReview]]);
export function inspectTypographySources(ref){
  assert(/^[a-f0-9]{40}$/.test(ref));const show=file=>execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
  const layer=fs.readFileSync(root+'/patterns/typography-links.css','utf8'),sources=[];
  validateTypographyLinks(fs.readFileSync(root+'/patterns/foundation.css','utf8'),layer,createRequire('D:/Claude/Q-Atelier/package.json')('postcss'));
  for(const part of PARTS.filter(p=>/^dist\/q-design\.foundation\.(atelier|maison|carnet)\.css$/.test(p.src))){
    const before=show(part.src),after=fs.readFileSync(root+'/'+part.src,'utf8'),target=Object.values(part.to)[0],copy=fs.readFileSync(target,'utf8');
    assert.equal(after.replaceAll('\r\n','\n'),before.trimEnd()+'\n\n'+layer.replaceAll('\r\n','\n').trimEnd()+'\n');assert.deepEqual(copyProblems(part,after,copy),[]);
    sources.push({path:part.src,beforeHash:hash(before),afterHash:hash(after)});
    const product=/\.foundation\.(\w+)\.css$/.exec(part.src)[1];
    const productRef=product==='atelier'?JSON.parse(show('source/_ORIGIN.json'))['원본'].qa['커밋']:beforeProductRefs[product];
    const oldCopy=execFileSync('git',['show',productRef+':app/q-design.foundation.css'],{cwd:productRoots[product],encoding:'utf8',maxBuffer:32*1024*1024});
    assert.deepEqual(copyProblems(part,before,oldCopy),[]);sources.push({path:(product==='atelier'?'':product+'/')+'app/q-design.foundation.css',beforeHash:hash(oldCopy),afterHash:hash(copy)});
  }
  return sources;
}
export function createTypographyRevalidation(ref){
  const sources=inspectTypographySources(ref),reports=[];
  for(const[name,create]of names){
    const before=JSON.parse(execFileSync('git',['show',ref+':reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})),current=beforeAtelierProfessionalReview(name,create()),inverse=JSON.parse(serialize(current)),changes=[];
    const walk=(value,location)=>{if(!value||typeof value!=='object')return;const source=sources.find(s=>s.path===value.path);if(source&&value.hash===source.afterHash){assert(Number.isInteger(value.line));changes.push({location:[...location,'hash'],before:source.beforeHash,after:source.afterHash});value.hash=source.beforeHash;}for(const[k,v]of Object.entries(value))walk(v,[...location,k]);};walk(inverse,[]);
    assert(changes.length);assert.deepEqual(inverse,before,'Fresh renderer/caller proof may change only the independently verified appended foundation fingerprint: '+name);
    reports.push({name,beforeHash:hash(serialize(before)),afterHash:hash(serialize(current)),changes});
  }
  return{version:1,ref,sources,scope:'Freshly regenerate all three affected renderer and caller reviews. Every prior argument, caller, selector, decision and evidence line stays exact. Only complete verified appended foundation fingerprints can change.',reports};
}
export function beforeGlobalTypographyReview(name,current){
  current=beforeAtelierProfessionalReview(name,current);
  if(!fs.existsSync(manifest))return current;const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),report=saved.reports.find(r=>r.name===name);if(!report||hash(serialize(current))===report.beforeHash)return current;
  assert.deepEqual(inspectTypographySources(saved.ref),saved.sources);assert.equal(hash(serialize(current)),report.afterHash);const before=structuredClone(current);
  for(const c of report.changes){const owner=c.location.slice(0,-1).reduce((v,k)=>v[k],before),key=c.location.at(-1);assert.equal(owner[key],c.after);owner[key]=c.before;}
  assert.equal(hash(serialize(before)),report.beforeHash);return before;
}
export function beforeGlobalTypographySource(file,code){
  if(!['dist/q-design.foundation.atelier.css','dist/q-design.foundation.maison.css','dist/q-design.foundation.carnet.css','app/q-design.foundation.css','maison/app/q-design.foundation.css','carnet/app/q-design.foundation.css'].includes(file)||!fs.existsSync(manifest))return code;
  const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),source=saved.sources.find(s=>s.path===file);if(hash(code)===source.beforeHash)return code;
  assert.deepEqual(inspectTypographySources(saved.ref),saved.sources);assert.equal(hash(code),source.afterHash);
  const product=file.startsWith('maison/')?'maison':file.startsWith('carnet/')?'carnet':'atelier';
  const ref=file.startsWith('dist/')?saved.ref:product==='atelier'?JSON.parse(execFileSync('git',['show',saved.ref+':source/_ORIGIN.json'],{cwd:root,encoding:'utf8'}))['원본'].qa['커밋']:beforeProductRefs[product];
  const gitFile=file.startsWith('dist/')?file:'app/q-design.foundation.css';
  const before=execFileSync('git',['show',ref+':'+gitFile],{cwd:file.startsWith('dist/')?root:productRoots[product],encoding:'utf8',maxBuffer:32*1024*1024});assert.equal(hash(before),source.beforeHash);return before;
}
export function historicalTypographyEvidence(evidence,recordEvidence){
  evidence=historicalChoiceGlyphEvidence(evidence,recordEvidence);
  evidence=historicalAtelierCopyEvidence(evidence,recordEvidence);
  if(!fs.existsSync(manifest))return evidence;
  const saved=JSON.parse(fs.readFileSync(manifest,'utf8')),relevant=(recordEvidence??[]).filter(e=>saved.sources.some(s=>s.path===e.path));
  if(!relevant.some(e=>saved.sources.find(s=>s.path===e.path).beforeHash===e.hash))return evidence;
  assert.deepEqual(inspectTypographySources(saved.ref),saved.sources);
  assert(relevant.every(e=>saved.sources.find(s=>s.path===e.path).beforeHash===e.hash),'Historical evidence cannot mix foundation revisions');
  return evidence.map(e=>{const source=saved.sources.find(s=>s.path===e.path);if(!source)return e;assert([source.beforeHash,source.afterHash].includes(e.hash),'Unknown foundation fingerprint');return{...e,hash:source.beforeHash};});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const ref=process.argv.find(a=>a.startsWith('--ref='))?.slice(6)??JSON.parse(fs.readFileSync(manifest,'utf8')).ref;
  const report=createTypographyRevalidation(ref);
  if(process.argv.includes('--write')){for(const[name,create]of names)fs.writeFileSync(root+'/reviews/'+name,serialize(create()));fs.writeFileSync(manifest,serialize(report));}
  else{assert.deepEqual(report,JSON.parse(fs.readFileSync(manifest,'utf8')));for(const p of report.reports)assert.equal(hash(serialize(beforeAtelierProfessionalReview(p.name,JSON.parse(fs.readFileSync(root+'/reviews/'+p.name,'utf8'))))),p.afterHash);}
  console.log(JSON.stringify({reports:report.reports.length,revalidatedEvidence:report.reports.reduce((n,p)=>n+p.changes.length,0)}));
}
