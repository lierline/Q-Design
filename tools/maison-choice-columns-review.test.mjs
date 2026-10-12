import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {choiceColumnTokens,createMaisonChoiceColumnsReview} from './maison-choice-columns-review.mjs';
test('choice columns reject raw dimensions, arbitrary selectors and unrelated utilities',()=>{
 assert.deepEqual(choiceColumnTokens('grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'),['grid-cols-2','sm:grid-cols-3','lg:grid-cols-6']);
 for(const value of ['grid-cols-[12rem_1fr]','grid-cols-13','text-red-500 grid-cols-3','[&>input]:grid-cols-3','3','[46,12,15,15,12]'])assert.equal(choiceColumnTokens(value),null);
});
test('every current exact choice-column input resolves to the owned renderer and compiled relative tracks',async()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-choice-columns-review.json','utf8'));assert.deepEqual(await createMaisonChoiceColumnsReview(),saved);
 assert(saved.records.length>0);assert.equal(new Set(saved.records.map(r=>r.argumentHash)).size,saved.records.length);assert(saved.records.every(r=>r.consumer.endsWith('#ChoiceBoxes')||r.consumer.endsWith('#ChoiceGrid')));
});
