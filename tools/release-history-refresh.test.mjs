import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {beforePublicFingerprints} from './atelier-public-contract-refresh.mjs';
import {beforeNavigationInventory} from './maison-navigation-inventory-refresh.mjs';
const root='D:/Claude/Q-Design';
test('public report refresh preserves all classifications and admits only twelve actual canonical choice bindings',()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')),old=beforePublicFingerprints(current);assert.equal(current.records.length,53997);assert.equal(old.counts.unknown,580);assert.deepEqual(current.counts,old.counts);
 for(const mutate of[r=>r.records.find(x=>x.path==='public/__sim.html'&&x.property==='width'&&x.value==='var(--qd-choice-glyph-size)').value='18px',r=>r.records.find(x=>x.path==='public/offline.html').evidence[0].hash='borrowed',r=>r.records.find(x=>x.decision==='unknown').decision='business-data']){const altered=structuredClone(current);mutate(altered);assert.throws(()=>beforePublicFingerprints(altered));}
});
test('current navigation refresh preserves every link while binding the complete pinned app source inventory',()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8')),old=beforeNavigationInventory(current);assert.equal(current.records.length,147);assert.deepEqual(current.records,old.records);assert.notEqual(current.inventoryHash,old.inventoryHash);
 for(const mutate of[r=>r.records[0].href='"/unreviewed"',r=>r.centralHash='borrowed',r=>r.records.pop()]){const altered=structuredClone(current);mutate(altered);assert.throws(()=>beforeNavigationInventory(altered));}
});
