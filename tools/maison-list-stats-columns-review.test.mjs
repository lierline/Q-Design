import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectOptionalStatsColumns,createStatsColumnsReview} from './maison-list-stats-columns-review.mjs';
import {inspectStatsHistory} from './maison-list-stats-current-review.mjs';
test('optional columns cannot escape or silently become a different renderer parameter',()=>{
 const code=fs.readFileSync('D:/Claude/Q-Works/components/shared/list-stats.tsx','utf8');inspectOptionalStatsColumns(code);
 for(const altered of [code.replace('<StatRow cols={cols}>','<Unreviewed cols={cols}>'),code.replace('cols?: number;','cols?: string;'),code.replace('<StatRow cols={cols}>','<StatRow cols={2}>'),code.replace('const spec = SPECS[menu];','paint(cols); const spec = SPECS[menu];')])assert.throws(()=>inspectOptionalStatsColumns(altered));
});
test('the exact current forwarding record reproduces its complete source evidence',async()=>{
 assert.deepEqual(inspectStatsHistory(await createStatsColumnsReview()),JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-list-stats-columns-review.json','utf8')));
});

test("current forwarding history refuses changed targets, borrowed source evidence and extra entries",async()=>{const current=await createStatsColumnsReview();for(const mutate of[r=>r.records[0].value="{unreviewed}",r=>r.records[0].evidence[1].hash="borrowed",r=>r.records.push(r.records[0])]){const copy=structuredClone(current);mutate(copy);assert.throws(()=>inspectStatsHistory(copy));}});
