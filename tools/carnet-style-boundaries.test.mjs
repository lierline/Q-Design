import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reviewedScriptBoundary } from './carnet-style-boundaries.mjs';
const review=JSON.parse(fs.readFileSync(new URL('../reviews/carnet-script-boundaries.json',import.meta.url),'utf8'));
const sample=review.records[0];
const argument={line:sample.line,kind:sample.kind,property:sample.property,value:sample.value};
test('only the exact inspected bootstrap argument resolves to a named runtime boundary',()=>{
  const result=reviewedScriptBoundary(sample.path,sample.sourceHash,argument,review);
  assert.equal(result.decision,'runtime-boundary');
  assert.ok(result.reason && result.ruleId && result.evidence.length);
});
test('changed source, expression, line, path or unresolved parser kind never inherits approval',()=>{
  for(const [file,sourceHash,next] of [
    [sample.path,'changed',argument],['app/other.tsx',sample.sourceHash,argument],
    [sample.path,sample.sourceHash,{...argument,value:argument.value+'el.style.width="8px";'}],
    [sample.path,sample.sourceHash,{...argument,line:argument.line+1}],
    [sample.path,sample.sourceHash,{...argument,kind:'parse-error'}],
  ]) assert.equal(reviewedScriptBoundary(file,sourceHash,next,review),null);
});
