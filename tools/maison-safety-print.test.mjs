import fs from 'node:fs';
import test from 'node:test';
import {beforeSafetyPrint,safetyMigrationProof} from './maison-safety-print-migration.mjs';
import assert from 'node:assert/strict';
import {safetyPlan} from './maison-safety-print-migration.mjs';
import {incidentPath,incidentFixture,monthFixture,renderSafety} from './maison-safety-print-fixture.mjs';
import {safetyDesignExports} from './maison-safety-print-fixture.mjs';
import {createRequire} from 'node:module';
const {JSDOM,VirtualConsole}=createRequire('D:/Claude/Q-Works/package.json')('jsdom'),parse=html=>new JSDOM(html,{virtualConsole:new VirtualConsole().on('jsdomError',e=>{if(e.type!=='css parsing')throw e;})}).window.document;
test('eight real safety form cases preserve all markup except reviewed text wrapping',async()=>{let count=0;
for(const f of safetyPlan())for(const n of(f.file===incidentPath?[0,1,7,9]:[0,1,7,12])){
 const data=f.file===incidentPath?incidentFixture(n,true):monthFixture(n,31),before=await renderSafety(f.file,f.before,data),after=await renderSafety(f.file,f.after,data);
 const expected=before.replaceAll('style="white-space:pre-wrap;word-break:break-word"','style="white-space:pre-wrap;overflow-wrap:break-word"');if(expected!==after){let index=0;while(expected[index]===after[index])index++;console.log(JSON.stringify({file:f.file,n,index,before:expected.slice(index-80,index+100),after:after.slice(index-80,index+100)}));}assert(expected===after,'Default markup changed beyond reviewed text wrapping: '+f.file+':'+n);count++;
 if(n===7)fs.writeFileSync('D:/Claude/tmp/qd-phase90-'+(f.file===incidentPath?'incident':'month')+'-after.html',after);
}
assert.equal(count,8);});
test('central safety and shared print changes reach both actual forms while data stays identical',async()=>{
const central=safetyDesignExports(),changed=structuredClone(central);changed.qdPrint.height.v13mm='14mm';changed.qdPrint.marginTop.v3mm='4mm';changed.qdPrint.width.v7='8%';changed.qdPrint.fontSize.v11pt='12pt';changed.qdSafetyPrint.dayWidth='6%';changed.qdSafetyPrint.areaWidthPercent=81;changed.qdSafetyPrint.unmeasured.backgroundImage=changed.qdSafetyPrint.unmeasured.backgroundImage.replace('#000','#345678');
for(const f of safetyPlan()){
 const data=f.file===incidentPath?incidentFixture(1,true):monthFixture(),before=parse(await renderSafety(f.file,f.after,data,central)),after=parse(await renderSafety(f.file,f.after,data,changed));assert.equal(before.body.textContent,after.body.textContent);assert.equal(before.querySelectorAll('td,th').length,after.querySelectorAll('td,th').length);assert(after.querySelector('[style*="margin-top:4mm"]'));
 if(f.file===incidentPath){assert(after.querySelector('[style*="height:14mm"]'));assert(after.querySelector('[style*="font-size:12pt"]'));assert(after.querySelector('col[style="width:8%"]'));}else{assert(after.querySelector('col[style="width:6%"]'));assert(after.querySelector('col[style="width:11.571428571428571%"]'));assert(after.querySelector('[style*="#345678"]'));}
}
});
test('whole source inverse rejects changed business fields or row generation',()=>{for(const f of safetyPlan()){assert.equal(beforeSafetyPrint(f.file,f.after),f.before);for(const bad of[f.after+'\nwriteBusinessRecord();\n',f.after.replace(f.file===incidentPath?'INCIDENT_PRINT_ROWS - data.entries.length':'data.lastDay',f.file===incidentPath?'99 - data.entries.length':'2')])assert.throws(()=>beforeSafetyPrint(f.file,bad));}assert.deepEqual(safetyMigrationProof(),JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-safety-print-migration.json','utf8')));});
