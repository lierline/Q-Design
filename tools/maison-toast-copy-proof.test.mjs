import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {verifyMaisonToastCopy,retainedMaisonToastReview} from './maison-toast-copy-proof.mjs';

test('default copy bindings reject library mode or caller-prop changes and retain only the unchanged marker',()=>{
 const proof=JSON.parse(fs.readFileSync(new URL('../reviews/maison-toast-copy-migration.json',import.meta.url),'utf8')),row=proof.records[0];
 const before=execFileSync('git',['show',proof.ref+':'+row.path],{cwd:'D:/Claude/Q-Works',encoding:'utf8'}),after=fs.readFileSync('D:/Claude/Q-Works/'+row.path,'utf8');
 verifyMaisonToastCopy(before,after);
 for(const changed of [after.replace('unstyled: true','unstyled: false'),after.replace('...props','position="bottom-left"'),after.replace('toaster group','different group')])assert.throws(()=>verifyMaisonToastCopy(before,changed),/Only central/);
 const current=JSON.parse(fs.readFileSync(new URL('../reviews/maison-style-manual-review.json',import.meta.url),'utf8'));
 assert.deepEqual(retainedMaisonToastReview(before,after),current);
});
