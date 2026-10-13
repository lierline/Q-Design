import {beforeFormRecordData as beforeOriginalFormRecordData} from './maison-form-record-data.mjs';
import {beforeExtendedFormData as beforeOriginalExtendedFormData} from './maison-extended-form-record-data.mjs';
import {beforeMissingHintReport} from './maison-missing-hint-copy.mjs';
const beforeExtendedFormData=current=>beforeOriginalExtendedFormData(beforeMissingHintReport(current));
const beforeFormRecordData=current=>beforeOriginalFormRecordData(beforeExtendedFormData(current));
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createMeetingDataReview,inspectMeetingData} from './maison-meeting-data-review.mjs';
import {beforeMeetingData} from './maison-meeting-data-ledger.mjs';
import {beforeContentFields} from './maison-docx-content-fields.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',file='app/(app)/meetings/meeting-form.tsx',read=p=>fs.readFileSync(p,'utf8'),ts=createRequire(repo+'/package.json')('typescript');
test('all fifteen meeting spreads resolve to exact typed data and actual submit consumers',()=>{
 const result=createMeetingDataReview();assert.equal(result.records.length,15);assert.deepEqual(result,JSON.parse(read(root+'/reviews/maison-meeting-data-review.json')));
 const source=read(repo+'/'+file);assert.throws(()=>inspectMeetingData({[file]:source.replace('createMeeting(common)','createMeeting(otherData)')}));
});
test('actual row patch functions preserve text spacing, unrelated rows and nested follow-up identity',()=>{
 const source=read(repo+'/'+file),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),declarations=new Map();
 const visit=n=>{if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name))declarations.set(n.name.text,n);ts.forEachChild(n,visit);};visit(sf);
 const names=['patch','patchAgenda','patchFollowUp'],code=names.map(name=>{const n=declarations.get(name);assert(n);return'const '+n.getText(sf)+';';}).join('\n')+'\nexport { '+names.join(', ')+' };';
 const state={actions:[{task:'  첫 조치\n둘째 줄  ',owner:null,due_date:null,done:false},{task:'그대로',done:false}],agenda:[{title:'  안건  ',department_ids:['d1'],detail:'원문\n 유지',discussion:null,follow_ups:[{department_ids:['d1'],task:'  후속 업무\n 유지  '},{department_ids:['d2'],task:'다른 업무'}]},{title:'다른 안건',department_ids:[],follow_ups:[]}]};
 const initial=structuredClone(state),exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,setActions:fn=>{state.actions=fn(state.actions);},setAgendaItems:fn=>{state.agenda=fn(state.agenda);}});
 exports.patch(0,{owner:'담당자',done:true});assert.equal(state.actions[0].task,initial.actions[0].task);assert.deepEqual(state.actions[1],initial.actions[1]);
 exports.patchAgenda(0,{discussion:'검토\n 내용'});assert.equal(state.agenda[0].title,initial.agenda[0].title);assert.equal(state.agenda[0].detail,initial.agenda[0].detail);assert.deepEqual(state.agenda[1],initial.agenda[1]);
 exports.patchFollowUp(0,0,{department_ids:['d1','d3']});assert.equal(state.agenda[0].follow_ups[0].task,initial.agenda[0].follow_ups[0].task);assert.deepEqual(state.agenda[0].follow_ups[1],initial.agenda[0].follow_ups[1]);
});
test('only the reviewed meeting records change classification and borrowed evidence is rejected',()=>{
 const current=beforeContentFields(beforeFormRecordData(JSON.parse(read(root+'/reviews/maison-style-decisions.json')))),old=beforeMeetingData(current);assert.equal(old.counts.unknown,586);assert.equal(current.counts.unknown,571);
 const unrelated=structuredClone(current);unrelated.records[0].value='changed';assert.throws(()=>beforeMeetingData(unrelated));
 const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='symbol-resolved-meeting-record-data').evidence[0].hash='borrowed';assert.throws(()=>beforeMeetingData(borrowed));
});
