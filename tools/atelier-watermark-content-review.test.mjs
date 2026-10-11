import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {htmlInterpolationSlots} from './atelier-html-slots.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
const qd=new URL('../',import.meta.url),qa=new URL('../../Q-Atelier/',import.meta.url);
const req=createRequire(new URL('package.json',qa)),ts=req('typescript'),postcss=req('postcss');
const read=p=>fs.readFileSync(new URL(p,/^(source|patterns|dist)\//.test(p)?qd:qa),'utf8');
const catalog=JSON.parse(fs.readFileSync(new URL('reviews/atelier-watermark-content-review.json',qd),'utf8'));
const properties=cssProperties(ts,fs.readFileSync(req.resolve('typescript').replace(/typescript\.js$/,'lib.dom.d.ts'),'utf8'));
const source=read('lib/manual/watermark.ts'),args=scanArguments('lib/manual/watermark.ts',source,{ts,postcss,properties});

test('watermark approvals identify the exact current template or SVG argument and source evidence',()=>{
  assert.equal(catalog.records.length,12);
  for(const r of catalog.records){
    assert.equal(hash(source),r.sourceHash);
    const matches=args.filter(a=>hash(JSON.stringify(a))===r.argumentHash);
    assert.ok(matches.length>0,r.reviewedExpression);
    assert.equal(matches[0].line,r.line);assert.equal(matches[0].value,r.reviewedExpression);
    assert.deepEqual(htmlInterpolationSlots(source,r.path).filter(s=>s.line===r.line&&s.value===r.reviewedExpression),r.consumerContext.slots);
    assert.ok(verifiedConsumerReview(r,r,p=>hash(read(p))));
    assert.equal(verifiedConsumerReview({...r,sourceHash:hash('changed source')},r,p=>hash(read(p))),null);
    assert.equal(verifiedConsumerReview(r,r,p=>p===r.evidence.at(-1).path?hash('changed consumer'):hash(read(p))),null);
  }
});

test('CSS background and dimensions remain presentation proofs, not text-content exemptions',()=>{
  const image=catalog.records.find(r=>r.reviewedExpression==='tileDataUri(tileLine)');
  assert.equal(image.decision,'confirmed-style-composition');
  assert.ok(image.evidence.some(e=>e.path==='source/design/atelier-output.ts'));
  assert.match(source,/const tile = QDOutput\.manualWatermark/);
  assert.match(source,/const t = escapeMarkup\(line\)/);
  assert.match(source,/data:image\/svg\+xml,\$\{encodeURIComponent\(svg\)\}/);
  assert.equal(catalog.records.filter(r=>r.decision==='business-content').length,4);
  assert.equal(catalog.reported.length,1);
  assert.equal(catalog.reported[0].reviewedExpression,'wm-bar');
  assert.ok(!catalog.records.some(r=>r.argumentHash===catalog.reported[0].argumentHash));
});
