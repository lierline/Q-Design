import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {planBatchPrint,beforeBatchPrintCanon,beforeBatchPrintSource,batchPrintPath} from './maison-batch-print-migration.mjs';
import {renderBatch,batchFixture,currentBatch,batchSpecs,printExports} from './maison-batch-print-fixture.mjs';
const root='D:/Claude/Q-Design',req=createRequire('D:/Claude/Q-Works/package.json'),{JSDOM,VirtualConsole}=req('jsdom'),doc=html=>new JSDOM(html,{virtualConsole:new VirtualConsole().on('jsdomError',e=>{if(e.type!=='css parsing')throw e;})}).window.document;
test('all four real manufacturing forms keep the whole default markup and blank/filled material behavior',async()=>{
 const plan=await planBatchPrint();assert.equal(currentBatch,plan.after);assert.equal(Object.keys(batchSpecs).length,4);
 for(const spec of Object.values(batchSpecs))for(const populated of [false,true]){const props=batchFixture(spec,populated);assert.equal(renderBatch(plan.before,props),renderBatch(currentBatch,props));}
});
test('changed central manufacturing columns, title type and scoped paper CSS reach the actual form without changing text or cells',()=>{
 const mutated=structuredClone(printExports);mutated.qdPrint.batchColumns.identity=[30,70];mutated.qdPrint.fontSize.v12_5pt='13pt';mutated.qdPrintBatchCss=mutated.qdPrintBatchCss.replace('padding-top:1mm','padding-top:2mm');
 const props=batchFixture(Object.values(batchSpecs)[0],true),before=doc(renderBatch(currentBatch,props)),after=doc(renderBatch(currentBatch,props,mutated));
 assert(before.querySelector('col[style="width:26%"]'));assert(after.querySelector('col[style="width:30%"]'));assert(after.querySelector('[style*="font-size:13pt"]'));assert([...after.querySelectorAll('style')].some(s=>s.textContent.includes('padding-top:2mm')));
 assert.equal(before.querySelector('article').textContent,after.querySelector('article').textContent);assert.equal(before.querySelectorAll('th,td').length,after.querySelectorAll('th,td').length);
});
test('whole-source manufacturing inverse rejects unreviewed data, layout and CSS modifications',async()=>{
 const plan=await planBatchPrint();assert.equal(beforeBatchPrintSource(batchPrintPath,plan.after),plan.before);assert.equal(beforeBatchPrintCanon(plan.afterCanon),plan.canonical);
 assert.throws(()=>beforeBatchPrintSource(batchPrintPath,plan.after+'\nsubmitRecord();\n'));assert.throws(()=>beforeBatchPrintCanon(plan.afterCanon.replace('"12.5pt"','"14pt"')));assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/maison-batch-print-migration.json','utf8')),plan.proof);
});
