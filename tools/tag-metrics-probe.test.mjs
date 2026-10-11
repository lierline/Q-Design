import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {centralTagMetrics} from './tag-metrics-probe.mjs';
import {readRuntimeValues} from './atelier-runtime-values.mjs';
const root='D:/Claude/Q-Design';
const source=fs.readFileSync(root+'/source/tokens/tag-metrics.ts','utf8');
const runtime=readRuntimeValues(root);
test('committed source selects the actual centrally owned tag dimensions',()=>{
 const value=centralTagMetrics(source,runtime);assert.deepEqual(value.dims,runtime.QDPresentation.visual.tag.dims);assert.equal(value.border,runtime.QDPresentation.visual.tag.border);
});
test('tag extraction follows changed central dimensions without a historical numeric fallback',()=>{
 const changed=structuredClone(runtime);changed.QDPresentation.visual.tag.border=2;changed.QDPresentation.visual.tag.dims.md.padY=6;
 const value=centralTagMetrics(source,changed);assert.equal(value.border,2);assert.equal(value.dims.md.padY,6);
});
test('unknown consumer expressions and malformed central dimensions fail closed',()=>{
 assert.throws(()=>centralTagMetrics(source.replace('TAG_BORDER = QDPresentation.visual.tag.border','TAG_BORDER = 1'),runtime));
 const changed=structuredClone(runtime);changed.QDPresentation.visual.tag.dims.sm.fs='12px';assert.throws(()=>centralTagMetrics(source,changed));
});
