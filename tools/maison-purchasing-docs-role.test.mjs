import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPurchasingDocsRole,beforePurchasingDocsRole} from './maison-purchasing-docs-role.mjs';
test('docs role passes through only the inspected page and optional presentation argument',async()=>{
 const {records,proof}=await inspectPurchasingDocsRole(),saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-purchasing-docs-role.json','utf8'));
 assert.deepEqual(proof,saved);assert.equal(records.length,2);
 for(const r of records){assert.equal(beforePurchasingDocsRole(r.path,r.after),r.before);assert.throws(()=>beforePurchasingDocsRole(r.path,r.after+'\nconst unreviewed=true;'));}
});
