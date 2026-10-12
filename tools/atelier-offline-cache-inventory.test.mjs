import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyOfflineRevisionSource,verifiesChoiceInventoryWithOfflineRevision} from './atelier-offline-cache-inventory.mjs';
test('only exact generated cache data can preserve the complete caller inventory',()=>{
 const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',file='public/q-design.offline-revision.js';
 const before=execFileSync('git',['show','45466f3f:'+file],{cwd:repo,encoding:'utf8'}),after=fs.readFileSync(repo+'/'+file,'utf8'),html=fs.readFileSync(root+'/dist/q-design.offline.atelier.html','utf8'),canonical=fs.readFileSync(root+'/dist/q-design.offline-revision.atelier.js','utf8');
 verifyOfflineRevisionSource(before,after,html,canonical);
 for(const altered of [after+'\nself.addEventListener("fetch",()=>{});',after.replace('// =============================================================================','self.unreviewed = true;\n// =============================================================================')])assert.throws(()=>verifyOfflineRevisionSource(before,altered,html,canonical));
 assert.throws(()=>verifyOfflineRevisionSource(before,after,html+'unreviewed',canonical));
 const review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-choice-columns-review.json','utf8'));
 assert(verifiesChoiceInventoryWithOfflineRevision(review.inventoryHash));assert.throws(()=>verifiesChoiceInventoryWithOfflineRevision('unreviewed'));
});
