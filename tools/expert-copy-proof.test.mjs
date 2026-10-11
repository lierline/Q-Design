import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';import {reverseResponsiveChart} from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',proof=JSON.parse(fs.readFileSync(root+'/reviews/atelier-expert-copy-migration.json','utf8'));
test('copy-only inverses restore both historical forms and reject unreviewed edits',()=>{
 for(const row of proof.records){const source=fs.readFileSync(repo+'/'+row.path,'utf8'),before=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:repo,encoding:'utf8'});
  assert.equal(hash(reverseResponsiveChart(row.path,source)),hash(before));
  assert.throws(()=>reverseResponsiveChart(row.path,source+'\n// unreviewed'),/latest finite source/);
 }
});
