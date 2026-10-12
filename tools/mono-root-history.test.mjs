import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {beforeMonoRootReport} from './mono-root-revalidation.mjs';
const root='D:/Claude/Q-Design',name='maison-style-manual-review.json';
test('already restored exact root history is idempotent, and altered historical evidence is rejected',()=>{
 const historical=JSON.parse(execFileSync('git',['show','63372ef3622c9ae2eb7f2584fc058f0d0167704b:reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
 assert.deepEqual(beforeMonoRootReport(name,historical),historical);
 const current=JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8'));
 assert.deepEqual(beforeMonoRootReport(name,current),historical);
 for(const value of [historical,current]){const changed=structuredClone(value);changed.scope='unreviewed';assert.throws(()=>beforeMonoRootReport(name,changed));}
});
