import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSafetyPrintReview} from './maison-safety-print-review.mjs';
import {safetyPlan,beforeSafetyPrint} from './maison-safety-print-migration.mjs';
test('changed width fallbacks, unmeasured aliases and record counts cannot reuse exact safety proof',()=>{
 const monthly=safetyPlan()[1];for(const changed of[monthly.after.replace('qdSafetyPrint.areaWidthPercent','82'),monthly.after.replace('qdSafetyPrint.unmeasured','{background: "red"}'),monthly.after.replace('data.lastDay','913')])assert.throws(()=>beforeSafetyPrint(monthly.file,changed));
});
test('all five specific compositions reproduce their current saved evidence',()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-safety-print-review.json','utf8'));
 assert.deepEqual(createSafetyPrintReview(),saved);
});
