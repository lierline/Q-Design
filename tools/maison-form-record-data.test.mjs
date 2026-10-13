import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {inspectFormRecordData,createFormRecordReview,beforeFormRecordData as beforeOriginalFormRecordData} from './maison-form-record-data.mjs';
import {beforeExtendedFormData as beforeOriginalExtendedFormData} from './maison-extended-form-record-data.mjs';
import {beforeMissingHintReport} from './maison-missing-hint-copy.mjs';
const beforeExtendedFormData=current=>beforeOriginalExtendedFormData(beforeMissingHintReport(current));
const beforeFormRecordData=current=>beforeOriginalFormRecordData(beforeExtendedFormData(current));
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ts=createRequire(repo+'/package.json')('typescript'),read=p=>fs.readFileSync(p,'utf8');
test('six real forms resolve seven actual saves and only the twenty-four exact typed spreads',()=>{
 const inspected=inspectFormRecordData();assert.equal(inspected.sites.length,24);assert.equal(new Set(inspected.resolved.map(r=>r.file)).size,6);assert.equal(inspected.resolved.length,7);assert.deepEqual(createFormRecordReview(),JSON.parse(read(root+'/reviews/maison-form-record-data.json')));
 const file='app/(app)/capa/report-form.tsx';assert.throws(()=>inspectFormRecordData({[file]:read(repo+'/'+file).replace('{ ...a, ...patch }','{ ...a, style: patch }')}));
});
test('the actual corrective-action row patch preserves spaces, line breaks and untouched rows',()=>{
 const file='app/(app)/capa/report-form.tsx',code=read(repo+'/'+file),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let declaration;const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='patchAction')declaration=n;ts.forEachChild(n,visit);};visit(sf);assert(declaration);
 let state=[{owner:'담당자',done_on:'2026-10-13',content:'  첫 줄\n둘째 줄  '},{owner:'유지',done_on:'',content:'원문'}];const untouched=state[1],context=vm.createContext({setActions:fn=>{state=fn(state);}}),script=ts.transpileModule('const '+declaration.getText(sf)+'; globalThis.patchAction=patchAction;',{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;vm.runInContext(script,context);context.patchAction(0,{content:'  변경 첫 줄\n변경 둘째 줄  '});assert.equal(state[0].content,'  변경 첫 줄\n변경 둘째 줄  ');assert.equal(state[0].owner,'담당자');assert.equal(state[1],untouched);
});
test('the complete ledger restores exactly twenty-four classifications and rejects borrowed evidence',()=>{
 const current=beforeExtendedFormData(JSON.parse(read(root+'/reviews/maison-style-decisions.json'))),old=beforeFormRecordData(current);assert.equal(old.unknownCount,558);assert.equal(current.unknownCount,534);
 const unrelated=structuredClone(current);unrelated.records[0].decision='invented';assert.throws(()=>beforeFormRecordData(unrelated));const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='symbol-resolved-form-record-data').evidence[0].hash='borrowed';assert.throws(()=>beforeFormRecordData(borrowed));
});
