import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLayoutHandoffHistory,verifyLayoutRetirement} from './maison-layout-handoff-history.mjs';
test('removed migration sites retain exact old and new source evidence without exempting replacement UI',()=>{
 const root='D:/Claude/Q-Design',saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-layout-handoff-retirements.json','utf8'));
 assert.deepEqual(createLayoutHandoffHistory(),saved);assert.equal(saved.records.length,10);
 const record=saved.records[0],entry={original:record.original,replacement:record.replacement},site={path:record.path,line:record.line};
 for(const changed of [{afterHash:'unreviewed'},{path:'app/(app)/other/page.tsx'},{original:'min-w-[1px]'},{reason:'all page styles approved'}])assert.throws(()=>verifyLayoutRetirement(entry,site,{...record,...changed}));
});
