import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {reverseResponsiveChart} from './atelier-migration-inverse.mjs';
const proof=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-followup-controls-migration.json',import.meta.url),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
test('five reviewed UI deltas restore pinned source and historical line endings exactly',()=>{
 assert.equal(proof.records.length,5);
 for(const entry of proof.records){
  const source=fs.readFileSync('D:/Claude/Q-Atelier/'+entry.path,'utf8');
  const restored=reverseResponsiveChart(entry.path,source);
  assert.equal(hash(restored.replaceAll('\r\n','\n')),entry.beforeHash,entry.path);
  assert.equal(hash(restored),entry.beforeRawHash,entry.path);
 }
});
test('an unrelated source edit cannot inherit the reviewed UI delta proof',()=>{
 for(const entry of proof.records){
  const source=fs.readFileSync('D:/Claude/Q-Atelier/'+entry.path,'utf8');
  assert.throws(()=>reverseResponsiveChart(entry.path,source+'\n// Unreviewed extra change\n'),/latest finite source/,entry.path);
 }
});
