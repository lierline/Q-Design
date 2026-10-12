import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {beforeCopyLeafOffsets} from './atelier-copy-leaf-offsets.mjs';
test('leaf location projection restores only exact reviewed offset changes and rejects content edits',()=>{
 const root='D:/Claude/Q-Design',name='atelier-parameter-leaves-review.json',current=JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8')),proof=JSON.parse(fs.readFileSync(root+'/reviews/atelier-copy-leaf-offsets.json','utf8'));
 const before=beforeCopyLeafOffsets(name,current);assert.equal(proof.changes.length,2);assert.deepEqual(beforeCopyLeafOffsets(name,before),before);
 for(const c of proof.changes)assert.deepEqual(before.flows[c.flow].leaves[c.leaf],c.before);
 const bad=structuredClone(current);bad.flows[proof.changes[0].flow].defaultValue='unreviewed';assert.throws(()=>beforeCopyLeafOffsets(name,bad));
});
