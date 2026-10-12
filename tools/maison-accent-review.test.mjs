import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {statPalette,createAccentReview} from './maison-accent-review.mjs';
import {verifiedManualReview} from './maison-style-manual.mjs';
const ts=createRequire(new URL('../../Q-Works/package.json',import.meta.url))('typescript');
const source=fs.readFileSync(new URL('../../Q-Works/lib/ui/stat-accent.ts',import.meta.url),'utf8');
const vars=new Set(['green','copper','red','cobalt','violet'].map(k=>'--qa-state-'+k));

test('semantic KPI selectors require a complete central variable map, not fixed CSS colors',()=>{
 assert.equal(statPalette(ts,source,vars).length,6);
 assert.throws(()=>statPalette(ts,source.replace('var(--qa-state-green)','#367236'),vars),/Unowned/);
 assert.throws(()=>statPalette(ts,source.replace('var(--qa-state-green)','var(--unregistered-green)'),vars),/Unowned/);
 assert.throws(()=>statPalette(ts,source.replace('  gray: undefined,','  gray: undefined,\n  unknown: undefined,'),vars),/Non-token/);
});

test('all current exact accent arguments resolve through the inspected KPI or tag consumer',()=>{
 const actual=createAccentReview(),saved=JSON.parse(fs.readFileSync(new URL('../reviews/maison-accent-review.json',import.meta.url),'utf8'));
 assert.deepEqual(actual,saved);assert.equal(actual.rejected.length,0);
 const current=JSON.parse(fs.readFileSync(new URL('../reviews/maison-style-decisions.json',import.meta.url),'utf8'));
 const candidates=current.records.filter(r=>r.property==='accent'&&r.decision!=='central-source-verified');
 assert.deepEqual(actual.records.map(r=>r.argumentHash).sort(),candidates.map(r=>r.argumentHash).sort());
 assert.equal(new Set(actual.records.map(r=>r.argumentHash)).size,actual.records.length);
 assert.ok(actual.records.every(r=>r.consumer&&r.evidence.length>=6));
 assert.equal(actual.records.filter(r=>r.consumer==='TONE_CLASS.accent -> Badge.className').length,1);
});

test('a changed renderer, palette, argument or unregistered candidate cannot inherit an exact review',()=>{
 const saved=JSON.parse(fs.readFileSync(new URL('../reviews/maison-accent-review.json',import.meta.url),'utf8')),r=saved.records[0],hashes=new Map(r.evidence.map(e=>[e.path,e.hash]));
 hashes.set(r.path,r.sourceHash);
 assert.ok(verifiedManualReview(r,r,p=>hashes.get(p)));
 assert.equal(verifiedManualReview({...r,argumentHash:'new-argument'},r,p=>hashes.get(p)),null);
 assert.equal(verifiedManualReview(r,undefined,p=>hashes.get(p)),null);
 for(const file of ['components/shared/stat-block.tsx','dist/q-design.palette.maison.css']){
  assert.equal(verifiedManualReview(r,r,p=>p===file?'changed':hashes.get(p)),null);
 }
});
