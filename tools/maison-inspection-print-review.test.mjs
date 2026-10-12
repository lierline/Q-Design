import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMeasurementConsumer,createInspectionPrintReview} from './maison-inspection-print-review.mjs';
const root='D:/Claude/Q-Design',file='D:/Claude/Q-Works/app/(app)/inspections/[id]/record-sheet.tsx';
test('measurement consumer rejects unreviewed denominator, empty fallback and header appearance',()=>{
 const code=fs.readFileSync(file,'utf8');inspectMeasurementConsumer(code);
 for(const changed of [code.replace('/ dims.length','/ (dims.length + 1)'),code.replace('item.dims && item.dims.length > 0 ? item.dims : ["측정값"]','item.dims ?? []'),code.replace('spec.headerStrip ? { marginTop: qdPrint.marginTop.v3mm }','spec.headerStrip ? { marginTop: "8mm" }')]){assert.notEqual(changed,code);assert.throws(()=>inspectMeasurementConsumer(changed));}
});
test('saved inspection expression and unchanged print evidence reproduce exact current sources only',async()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-inspection-print-review.json','utf8')),current=await createInspectionPrintReview();assert.deepEqual(current,saved);assert.equal(current.records.filter(r=>r.ruleId==='exact-inspection-print-expression').length,3);assert.equal(new Set(current.records.map(r=>r.argumentHash)).size,current.records.length);
});
