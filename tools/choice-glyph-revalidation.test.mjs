import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {applyChoiceGlyphRules,inspectChoiceGlyphSources,beforeChoiceGlyphReview,historicalChoiceGlyphEvidence} from './choice-glyph-revalidation.mjs';
test('all three exact component copies share the same declared glyph factor',()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/choice-glyph-revalidation.json','utf8'));
 assert.deepEqual(inspectChoiceGlyphSources(),saved.sources);assert.equal(saved.sources.length,4);
 for(const record of saved.reports){const current=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/'+record.name,'utf8'));beforeChoiceGlyphReview(record.name,current);
  const changed=structuredClone(current);changed.scope='unreviewed';assert.throws(()=>beforeChoiceGlyphReview(record.name,changed));
 }
});
test('the glyph migration cannot edit unrelated selectors, root values or geometry',()=>{
 const before=execFileSync('git',['show','ba10c2d0679a64505cd2a6bb411c5978798d456e:patterns/components.css'],{cwd:'D:/Claude/Q-Design',encoding:'utf8'}).replaceAll('\r\n','\n');
 const after=applyChoiceGlyphRules(before);assert.equal((after.match(/width: var\(--qd-choice-glyph-size\)/g)||[]).length,3);
 assert.throws(()=>applyChoiceGlyphRules(before.replace('.qd-checkbox-mark { width: 16px','.qd-checkbox-mark { width: 17px')));
 assert.throws(()=>applyChoiceGlyphRules(after));
});
test('historical glyph projection follows the expected exact revision and cannot hide mixed or unknown source fingerprints',()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/choice-glyph-revalidation.json','utf8')),source=saved.sources.find(s=>s.path==='patterns/components.css');
 const current=[{path:source.path,line:1,hash:source.afterHash}],prior=[{path:source.path,line:1,hash:source.beforeHash}];
 assert.deepEqual(historicalChoiceGlyphEvidence(current,prior),prior);assert.deepEqual(historicalChoiceGlyphEvidence(current,current),current);
 assert.throws(()=>historicalChoiceGlyphEvidence([{...current[0],hash:'unreviewed'}],prior));assert.throws(()=>historicalChoiceGlyphEvidence(current,[...prior,...current]));assert.throws(()=>historicalChoiceGlyphEvidence(current,[{...prior[0],hash:'unreviewed'}]));
});
