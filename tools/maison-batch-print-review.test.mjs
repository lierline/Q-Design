import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectBatchColumns,createBatchPrintReview} from './maison-batch-print-review.mjs';
const root='D:/Claude/Q-Design',file='D:/Claude/Q-Works/app/(app)/production/print/batch-record-sheet.tsx';
test('private Grid refuses raw callers, changed units, escaped helpers or nonnumeric columns',()=>{
 const code=fs.readFileSync(file,'utf8');inspectBatchColumns(code);
 for(const changed of [code.replace('qdPrint.batchColumns.stageHeading','[46, 12, 15, 15, 12]'),code.replace('width: `${w}%`','width: `${w}px`'),code+'\nconst passed = Grid;\n',code.replace('readonly number[]','readonly string[]')]){assert.notEqual(changed,code);assert.throws(()=>inspectBatchColumns(changed));}
});
test('all eight current manufacturing expressions reproduce exact independently recorded evidence',async()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-batch-print-review.json','utf8'));assert.deepEqual(await createBatchPrintReview(),saved);assert.equal(saved.records.length,8);
});
