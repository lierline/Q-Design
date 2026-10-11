import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {applyToastCopy,verifyToastCopy} from './toast-copy-proof.mjs';
import {reverseResponsiveChart} from './atelier-migration-inverse.mjs';
import {hash} from './style-arguments-core.mjs';

test('message wrapping restores all original toast logic and rejects timer, text and accessibility changes',()=>{
 const proof=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-toast-copy-migration.json',import.meta.url),'utf8'));
 const row=proof.records[0],before=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:'D:/Claude/Q-Atelier',encoding:'utf8'});
 const after=fs.readFileSync('D:/Claude/Q-Atelier/'+row.path,'utf8');
 verifyToastCopy(before,after);
 assert.equal(hash(reverseResponsiveChart(row.path,after)),hash(before));
 for(const change of [s=>s.replace('{t.message}','{t.title}'),s=>s.replace('aria-atomic="true"','aria-atomic="false"'),s=>s.replace('${t.ttlMs}ms','1000ms')])assert.throws(()=>verifyToastCopy(before,change(after)),/Only central/);
 assert.throws(()=>applyToastCopy(after),/Exact toast/);
});
