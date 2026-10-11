import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {verifyExpertFieldAssociation} from './expert-field-association-proof.mjs';
import {reverseResponsiveChart} from './atelier-migration-inverse.mjs';

const proof=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-expert-field-association-migration.json',import.meta.url),'utf8'));
test('fragment association restores pinned component defaults and rejects unrelated changes',()=>{
 for(const row of proof.records){
  const source=fs.readFileSync('D:/Claude/Q-Atelier/'+row.path,'utf8');
  const before=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:'D:/Claude/Q-Atelier',encoding:'utf8'});
  verifyExpertFieldAssociation(before,source);
  assert.equal(hash(reverseResponsiveChart(row.path,source)),hash(before));
  assert.throws(()=>verifyExpertFieldAssociation(before,source.replace('marginBottom }}','marginBottom: 99 }}')),/Only the reviewed/);
  assert.throws(()=>reverseResponsiveChart(row.path,source+'\n// unreviewed'),/latest finite source/);
 }
});
