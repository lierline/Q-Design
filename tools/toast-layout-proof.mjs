import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {beforeBannerFoundation,beforeBannerDist,beforeBannerCopy} from './carnet-banner-foundation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ref='cf00e72';
export const toastLayoutAppendix=`
/* Shared feedback placement, including safe-area edges on installed apps. */
:root {
  --qd-toast-max-width: 360px;
  --qd-toast-inset-top: calc(env(safe-area-inset-top, 0px) + var(--qd-space-5));
  --qd-toast-inset-right: calc(env(safe-area-inset-right, 0px) + var(--qd-space-5));
  --qd-toast-inset-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--qd-space-5));
  --qd-toast-inset-left: calc(env(safe-area-inset-left, 0px) + var(--qd-space-5));
  --qd-toast-width: min(var(--qd-toast-max-width), calc(100vw - var(--qd-toast-inset-left) - var(--qd-toast-inset-right)));
}
/* Sonner's unlayered defaults must not override shared dismissal controls. */
.qd-toast[data-sonner-toast] { padding-right: calc(var(--qd-control-height) + var(--qd-space-4)); }
.qd-toast[data-sonner-toast] [data-close-button] {
  left: auto !important;
  right: var(--qd-space-3) !important;
  top: var(--qd-space-3) !important;
  width: var(--qd-control-height) !important;
  height: var(--qd-control-height) !important;
  transform: none !important;
  border: 0 !important;
  border-radius: var(--qd-radius-control) !important;
  background: transparent !important;
  color: var(--qd-muted) !important;
}
.qd-toast[data-sonner-toast] [data-close-button]:hover { background: var(--qd-surface2) !important; color: var(--qd-text) !important; }
.qd-toast[data-sonner-toast] [data-close-button]:focus-visible { outline: var(--qd-focus-outline-width) solid var(--qd-accent); outline-offset: var(--qd-space-1); box-shadow: none; }
/* Central copy policy also overrides unlayered notification-library defaults. */
.qd-toast { word-break: var(--qd-copy-word-break) !important; overflow-wrap: var(--qd-copy-overflow-wrap) !important; }
`;
const files=['patterns/foundation.css','patterns/foundation/carnet.css'];
const correction={before:'  --qd-carnet-screen-w-3e6e4f30: min(24rem,calc(100vw-2rem));',after:'  --qd-carnet-screen-w-3e6e4f30: min(24rem, calc(100vw - 2rem));'};
export function applyToastLayout(file,source){source=source.replaceAll('\r\n','\n');if(file===files[0]){assert(!source.includes('--qd-toast-width:'),'New shared layout names only');return source+toastLayoutAppendix;}assert.equal(file,files[1]);assert.equal(source.split(correction.before).length,2,'Single legacy width correction');return source.replace(correction.before,correction.after);}
export function verifyToastLayout(file,before,after){assert.equal(after.replaceAll('\r\n','\n'),applyToastLayout(file,before),'Only exact shared toast placement and legacy calc syntax may change');}
export function retainToastLayoutEvidence(review){
 const records=files.map(file=>{
  const before=execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),after=file===files[1]?beforeBannerFoundation(fs.readFileSync(root+'/'+file,'utf8')):fs.readFileSync(root+'/'+file,'utf8').replaceAll('\r\n','\n');
  verifyToastLayout(file,before,after);return {file,before,after,beforeHash:hash(before),afterHash:hash(after)};
 });
 const visit=node=>{
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){node.forEach(visit);return;}
  const entry=records.find(r=>node.path===r.file&&node.hash===r.beforeHash&&Number.isInteger(node.line));
  if(entry){assert.notEqual(entry.before.split('\n')[node.line-1],undefined);assert.equal(entry.before.split('\n')[node.line-1],entry.after.split('\n')[node.line-1]);node.hash=entry.afterHash;}
  for(const [key,value] of Object.entries(node))if(key!=='supersededRecords')visit(value);
 };visit(review);return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const records=files.map(file=>{const before=execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),after=file===files[1]?beforeBannerFoundation(fs.readFileSync(root+'/'+file,'utf8')):fs.readFileSync(root+'/'+file,'utf8').replaceAll('\r\n','\n');verifyToastLayout(file,before,after);return {path:file,beforeHash:hash(before),afterHash:hash(after),before,after};});
 const intermediate=records[0].before+toastLayoutAppendix.split("/* Sonner's unlayered defaults")[0];
 records.push({...records[0],before:intermediate,beforeHash:hash(intermediate)});
 const previousShared=records[0].before+toastLayoutAppendix.split('/* Central copy policy also overrides')[0];
 records.push({...records[0],before:previousShared,beforeHash:hash(previousShared)});
 for(const [product,repo,productRef] of [['atelier','Q-Atelier','6b781a8'],['maison','Q-Works','260975d'],['carnet','DHR','93ce0ca']]){
  const distFile=`dist/q-design.foundation.${product}.css`,before=execFileSync('git',['show',ref+':'+distFile],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'),after=product==='carnet'?beforeBannerDist(fs.readFileSync(root+'/'+distFile,'utf8')):fs.readFileSync(root+'/'+distFile,'utf8').replaceAll('\r\n','\n');
  const oldShared=records[0].before.trimEnd(),newShared=records[0].after.trimEnd();
  assert.equal(before.split(oldShared).length,2);
  let expected=before.replace(oldShared,newShared);
  if(product==='carnet')expected=expected.replace(correction.before,correction.after);
  assert.equal(after,expected,'Generated foundation can only contain the exact canonical delta');
  const insertLine=before.slice(0,before.indexOf(oldShared)+oldShared.length).split('\n').length,addedLines=newShared.split('\n').length-oldShared.split('\n').length;
  records.push({path:distFile,before,after,beforeHash:hash(before),afterHash:hash(after),insertLine,addedLines});
  const copyFile='app/q-design.foundation.css',copyBefore=execFileSync('git',['show',productRef+':'+copyFile],{cwd:path.resolve(root,'../'+repo),encoding:'utf8'}).replaceAll('\r\n','\n'),copyAfter=product==='carnet'?beforeBannerCopy(fs.readFileSync(path.resolve(root,'../'+repo,copyFile),'utf8')):fs.readFileSync(path.resolve(root,'../'+repo,copyFile),'utf8').replaceAll('\r\n','\n');
  assert(copyBefore.includes(before));assert(copyAfter.includes(after));
  assert.equal(copyAfter,copyBefore.replace(before,after).replace('q-design-nav-sha256: '+hash(before),'q-design-nav-sha256: '+hash(after)),'Product copy must be generated from the verified foundation');
  records.push({path:copyFile,before:copyBefore,after:copyAfter,beforeHash:hash(copyBefore),afterHash:hash(copyAfter),insertLine:insertLine+copyBefore.slice(0,copyBefore.indexOf(before)).split('\n').length-1,addedLines});
  const previousDist=after.replace(newShared,previousShared.trimEnd()),previousInsertLine=previousDist.slice(0,previousDist.indexOf(previousShared.trimEnd())+previousShared.trimEnd().length).split('\n').length,newLines=newShared.split('\n').length-previousShared.trimEnd().split('\n').length;
  records.push({path:distFile,before:previousDist,after,beforeHash:hash(previousDist),afterHash:hash(after),insertLine:previousInsertLine,addedLines:newLines});
  const previousCopy=copyAfter.replace(after,previousDist).replace('q-design-nav-sha256: '+hash(after),'q-design-nav-sha256: '+hash(previousDist));
  records.push({path:copyFile,before:previousCopy,after:copyAfter,beforeHash:hash(previousCopy),afterHash:hash(copyAfter),insertLine:previousInsertLine+previousCopy.slice(0,previousCopy.indexOf(previousDist)).split('\n').length-1,addedLines:newLines});
 }
 const carnet=path.resolve(root,'../DHR');for(const file of runtimeFiles(carnet).filter(f=>/\.[jt]sx?$/.test(f)))assert(!fs.readFileSync(carnet+'/'+file,'utf8').includes('var(--qd-carnet-screen-w-3e6e4f30)'),'Legacy invalid calculation cannot remain a live caller: '+file);
 const proofPath=root+'/reviews/toast-layout-proof.json',prior=fs.existsSync(proofPath)?JSON.parse(fs.readFileSync(proofPath,'utf8')):null;
 const retained=prior?.ref===ref?[...prior.retained]:[];
 const currentReports=['atelier-size-renderer-review.json','atelier-write-guard-review.json','atelier-style-spread-review.json','atelier-style-bindings-review.json','atelier-style-consumer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-final-presentation-boundaries.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-html-content-review.json','atelier-dimension-flow-review.json','atelier-api-output-consumer-review.json','atelier-data-ratio-review.json','atelier-measured-coordinate-review.json','atelier-semantic-palette-review.json','atelier-color-flow-review.json','atelier-watermark-content-review.json','atelier-manual-styles-review.json','atelier-final-output-layout-review.json','atelier-opaque-surface-review.json','maison-style-manual-review.json','maison-layout-review.json','maison-style-consumer-review.json','maison-style-output-review.json','carnet-consumer-review.json','carnet-script-boundaries.json'];
 if(process.argv.includes('--retain'))for(const name of currentReports){
  const target=root+'/reviews/'+name;if(!fs.existsSync(target))continue;const review=JSON.parse(fs.readFileSync(target,'utf8'));let count=0;
  const visit=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}const entry=records.find(r=>node.path===r.path&&node.hash===r.beforeHash&&Number.isInteger(node.line));if(entry){const nextLine=entry.insertLine&&node.line>entry.insertLine?node.line+entry.addedLines:node.line;assert.equal(entry.before.split('\n')[node.line-1],entry.after.split('\n')[nextLine-1],'Changed evidence cannot be retained');assert.notEqual(entry.before.split('\n')[node.line-1],undefined);node.hash=entry.afterHash;node.line=nextLine;retained.push({report:name,path:entry.path,line:node.line});count++;}for(const [key,child] of Object.entries(node))if(key!=='supersededRecords')visit(child);};visit(review);
  if(count)fs.writeFileSync(target,JSON.stringify(review,null,2)+'\n');
 }
 const proof={ref,scope:'Exact shared toast placement and Sonner dismissal addendum, plus whitespace-only correction of the retired Carnet width calculation. Generated copies must contain only this canonical delta. Existing evidence is retained only at unchanged declaration lines; archives and changed declarations are not updated.',records:records.map(({path,beforeHash,afterHash})=>({path,beforeHash,afterHash})),retained};
 if(process.argv.includes('--check')){const saved=JSON.parse(fs.readFileSync(proofPath,'utf8'));for(const key of ['ref','scope','records'])assert.deepEqual(saved[key],proof[key]);}else fs.writeFileSync(proofPath,JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify({verified:true,retained:retained.length}));
}
