import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createContentFieldsReview,inspectContentFields,beforeContentFields} from './maison-docx-content-fields.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',read=p=>fs.readFileSync(p,'utf8'),require=createRequire(repo+'/package.json'),ts=require('typescript');
function load(source,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,...globals});return exports;}
function extractFunction(name){const sf=ts.createSourceFile('form-fill.ts',read(repo+'/lib/documents/form-fill.ts'),ts.ScriptTarget.Latest,true),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert(fn);return'export '+fn.getText(sf).replace(/^export /,'');}
test('thirteen exact string fields reproduce source evidence while unresolved query values remain unapproved',()=>{
 const result=createContentFieldsReview();assert.equal(result.records.length,13);assert.deepEqual(result,JSON.parse(read(root+'/reviews/maison-docx-content-fields.json')));
 assert(result.records.every(r=>r.decision==='business-content'));assert(!result.records.some(r=>[2399,3137,3794,3829].includes(r.line)));
 assert.throws(()=>inspectContentFields({'app/api/documents/form/route.ts':read(repo+'/app/api/documents/form/route.ts').replace('doc.render({ ...data.values, ...data.rows })','doc.render({ style: data.values })')}));
});
test('actual corrective-action text producer preserves whitespace and refuses non-string field values',()=>{
 const fn=load(extractFunction('capaExecRows')).capaExecRows,rows=JSON.parse(JSON.stringify(fn([{owner:'담당자',done_on:'2026-10-13',content:'  첫 줄\n둘째 줄 & <내용>  '},{owner:7,content:{color:'red'}},null,'wrong'])));
 assert.deepEqual(rows,[{no:'1',owner:'담당자',done_date:'2026-10-13',content:'  첫 줄\n둘째 줄 & <내용>  '},{no:'2',owner:'',done_date:'',content:''}]);assert.deepEqual(JSON.parse(JSON.stringify(fn('wrong'))),[]);
});
test('actual result-label producer and DOCX checkbox preprocessor consume labels without using tone as style',()=>{
 const code=read(repo+'/lib/monitoring/approval-rules.ts'),sf=ts.createSourceFile('approval-rules.ts',code,ts.ScriptTarget.Latest,true),statement=sf.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(sf)==='MONITORING_RESULTS'));assert(statement);
 const data=load(statement.getText(sf)).MONITORING_RESULTS,resultBox=load(extractFunction('resultBox'),{MONITORING_RESULTS:data}).resultBox,groups=JSON.parse(JSON.stringify(resultBox('conform')));assert.deepEqual(groups,[{anchor:'적합',checked:['적합']}]);assert.deepEqual(JSON.parse(JSON.stringify(resultBox('unknown'))),[]);
 const tick=load(read(repo+'/lib/documents/docx-placeholders.ts')).tickCheckboxes,xml='<w:p><w:r><w:t xml:space="preserve">  ☐ 적합  ☐ 부적합  </w:t></w:r></w:p>',output=tick(xml,groups);assert(output.includes('☑ 적합'));assert(output.includes('☐ 부적합'));assert(output.includes('xml:space="preserve"'));assert(!output.includes('style='));
});
test('the complete ledger reverses only thirteen fields and preserves six unresolved arguments',()=>{
 const current=JSON.parse(read(root+'/reviews/maison-style-decisions.json')),old=beforeContentFields(current);assert.equal(old.counts.unknown,571);assert.equal(current.counts.unknown,558);assert.equal(current.records.filter(r=>r.path==='lib/documents/form-fill.ts'&&r.decision==='unknown').length,6);
 const unrelated=structuredClone(current);unrelated.records[0].decision='invented';assert.throws(()=>beforeContentFields(unrelated));const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='resolved-docx-content-field').evidence[0].hash='borrowed';assert.throws(()=>beforeContentFields(borrowed));
});
