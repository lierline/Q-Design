import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSemanticPaletteReview} from './atelier-semantic-palette-review.mjs';
import {hash} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const read=file=>fs.readFileSync((/^(patterns|source|dist)\//.test(file)?root:qa)+'/'+file,'utf8');
test('all semantic palette keys retain exact AST and reviewed consumers',()=>{
 const actual=buildSemanticPaletteReview(),saved=JSON.parse(fs.readFileSync(root+'/reviews/atelier-semantic-palette-review.json','utf8'));
 assert.deepEqual(actual,saved);
});
test('changed enum keys, current renderer and newly imported metadata consumers cannot retain approval',()=>{
 assert.throws(()=>buildSemanticPaletteReview(file=>{const code=read(file);return file==='lib/letter-to-file.ts'?code.replace("color: 'red',","color: 'purple',"):code;}),/changed semantic keys/);
 assert.throws(()=>buildSemanticPaletteReview(file=>{const code=read(file);return file==='components/dashboard/RDDashboardView.tsx'?code.replace("c === 'red' ? T.red","c === 'red' ? '#ff0000'"):code;}),/changed semantic consumer/);
 assert.throws(()=>buildSemanticPaletteReview(file=>file==='components/Toast.tsx'?read(file)+'\nimport {MFDS_TYPE_LABELS} from "@/lib/mfds-labels";':read(file)),/consumer graph/);
});
test('central palette changes invalidate saved evidence even when semantic enum text is unchanged',()=>{
 const report=buildSemanticPaletteReview();for(const row of report.records)assert.ok(verifiedConsumerReview(row,row,file=>hash(read(file))));
 const row=report.records[0];assert.equal(verifiedConsumerReview(row,row,file=>file==='dist/q-design.palette.atelier.css'?hash('changed palette'):hash(read(file))),null);
});
