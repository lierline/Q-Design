import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {valuesPath,verifyTextSource,inspectValueSite,createTextValuesReview,beforeTextValuesReport} from './maison-docx-values-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ts=createRequire(repo+'/package.json')('typescript');
test('all nineteen document fields have resolved string producers and exact current consumers',()=>{
 const result=createTextValuesReview();assert.deepEqual(result,JSON.parse(fs.readFileSync(root+'/reviews/maison-docx-values-review.json','utf8')));assert.equal(result.records.length,19);
 assert.throws(()=>verifyTextSource(valuesPath,fs.readFileSync(repo+'/'+valuesPath,'utf8')+'\n'));
 const code='function numbered(){return {color:"red"};}\nfunction resolveChangeRequest(){return {style:{...numbered()}};}';
 const sf=ts.createSourceFile(repo+'/'+valuesPath,code,99,true,3);assert.throws(()=>inspectValueSite(sf,{line:2,value:'numbered()'},{getResolvedSignature:()=>({declaration:sf.statements[0]})}));
});
test('actual numbered producer preserves record text, whitespace and ordering without executing database code',()=>{
 const source=fs.readFileSync(repo+'/'+valuesPath,'utf8'),sf=ts.createSourceFile(valuesPath,source,99,true,3),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='numbered');assert(fn);
 const code=ts.transpileModule(fn.getText(sf)+'\nmodule.exports=numbered;',{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,module={exports:{}};vm.runInNewContext(code,{module});
 const pick=module.exports,rows=[{key:'a',label:'첫 항목'},{key:'b',label:'둘째 항목'}],values=pick(rows,'impact',k=>k==='a'?'  첫 줄\n둘째 줄 & <내용>':'부서별 검토 의견');assert.deepEqual(JSON.parse(JSON.stringify(values)),{impact_1:'  첫 줄\n둘째 줄 & <내용>',impact_2:'부서별 검토 의견'});assert.deepEqual(Object.keys(pick(rows,'doc_target',k=>k)),['doc_target_1','doc_target_2']);
});
test('complete document-field ledger inverse rejects unrelated approvals and borrowed evidence',()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),old=beforeTextValuesReport(current);assert.equal(current.counts.unknown,607);assert.equal(old.counts.unknown,626);
 const changed=structuredClone(current);changed.records.find(r=>r.decision==='unknown').decision='business-content';assert.throws(()=>beforeTextValuesReport(changed));
 const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='symbol-resolved-docx-text-values').evidence[0].hash='borrowed';assert.throws(()=>beforeTextValuesReport(borrowed));
});
