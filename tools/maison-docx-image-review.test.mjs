import {beforeWorkspaceTargets} from './workspace-targets-review.mjs';
import {beforeTextValuesReport} from './maison-docx-values-review.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createImageReview,inspectImageBounds,verifyImageSource,beforeImageStyleReport,imagePath} from './maison-docx-image-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ts=createRequire(repo+'/package.json')('typescript');
const read=f=>fs.readFileSync(repo+'/'+f,'utf8');
function load(code){const module={exports:{}};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,Uint8Array,DataView,Set});return module.exports;}
const png=(w,h)=>{const bytes=new Uint8Array(30);bytes.set([0x89,0x50,0x4e,0x47]);const v=new DataView(bytes.buffer);v.setUint32(16,w);v.setUint32(20,h);return bytes;};
function boxOf(alias,qd){return alias==='LOGO_BOX'?qd.docxBoxes.logo:alias==='PHOTO_BOX'?qd.docxBoxes.photo:qd.signatures.approval;}
function extent(xml){const matches=[...xml.matchAll(/(?:wp:extent|a:ext) cx="(\d+)" cy="(\d+)"/g)].map(m=>[Number(m[1]),Number(m[2])]);assert.equal(matches.length,2);assert.deepEqual(matches[0],matches[1]);return matches[0];}
test('every actual image-box producer resolves to a verified canonical size and altered pipeline is rejected',()=>{
 const boxes=inspectImageBounds();assert.equal(boxes.length,4);for(const f of[imagePath,'lib/documents/form-common.ts','lib/documents/form-fill.ts','app/api/documents/form/route.ts'])assert.throws(()=>verifyImageSource(f,read(f)+'\n'));
 const f='lib/documents/form-common.ts';assert.throws(()=>inspectImageBounds(new Map([[f,read(f).replace('LOGO_BOX.w','914')]])));
 const current=createImageReview();assert.deepEqual(current,JSON.parse(fs.readFileSync(root+'/reviews/maison-docx-image-review.json')));assert.equal(current.records.length,17);assert(!current.records.some(r=>r.line===98));
});
test('intrinsic dimensions and actual XML fitting preserve aspect ratio and respond to canonical box changes',()=>{
 const image=load(read(imagePath)),canonical=load(fs.readFileSync(root+'/patterns/foundation/maison-print.ts','utf8')).qdPrint,boxes=inspectImageBounds();let cases=0;
 assert.deepEqual(JSON.parse(JSON.stringify(image.readImageSize(png(200,100)))),{width:200,height:100});
 const jpeg=new Uint8Array([255,216,255,224,0,4,0,0,255,192,0,11,8,0,100,0,200,1,1,17,0]);assert.deepEqual(JSON.parse(JSON.stringify(image.readImageSize(jpeg))),{height:100,width:200});
 for(const producer of boxes)for(const[w,h]of[[200,100],[100,200],[100,100],[800,100],[100,800]]){
  const b=boxOf(producer.alias,canonical),bytes=png(w,h),xml=new image.DocxImageSink(100).add({bytes,contentType:'image/png',maxWidthMm:b.w,maxHeightMm:b.h,alt:'local geometry fixture'}),[cx,cy]=extent(xml);
  assert(cx<=b.w*36000&&cy<=b.h*36000);assert(Math.abs(cx/cy-w/h)<0.0001);assert(cx===b.w*36000||cy===b.h*36000);cases++;
  const changed=structuredClone(canonical),next=boxOf(producer.alias,changed);next.w*=1.5;next.h*=1.5;const[x,y]=extent(new image.DocxImageSink(100).add({bytes,contentType:'image/png',maxWidthMm:next.w,maxHeightMm:next.h,alt:'local geometry fixture'}));assert(Math.abs(x-cx*1.5)<=1&&Math.abs(y-cy*1.5)<=1);
 }
 assert.equal(cases,20);
});
test('complete image-review ledger inverse refuses unrelated decisions and borrowed evidence',()=>{
 const current=beforeTextValuesReport(beforeWorkspaceTargets(JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json')))),before=beforeImageStyleReport(current);assert.equal(before.counts.unknown,643);assert.equal(current.counts.unknown,626);
 const altered=structuredClone(current);altered.records.find(r=>r.decision==='unknown').decision='business-data';assert.throws(()=>beforeImageStyleReport(altered));
 const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='exact-docx-image-geometry').evidence[0].hash='borrowed';assert.throws(()=>beforeImageStyleReport(borrowed));
});
