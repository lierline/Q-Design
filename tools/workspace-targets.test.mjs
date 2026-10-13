import {beforeFormRecordData as beforeOriginalFormRecordData} from './maison-form-record-data.mjs';
import {beforeExtendedFormData as beforeOriginalExtendedFormData} from './maison-extended-form-record-data.mjs';
import {beforeMissingHintReport} from './maison-missing-hint-copy.mjs';
const beforeExtendedFormData=current=>beforeOriginalExtendedFormData(beforeMissingHintReport(current));
const beforeFormRecordData=current=>beforeOriginalFormRecordData(beforeExtendedFormData(current));
import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectWorkspaceTargets,beforeWorkspaceTargets} from './workspace-targets-review.mjs';
import {composeWorkspace} from './build-workspace.mjs';
import {beforeRemainingFields} from './maison-remaining-field-ledger.mjs';
import {beforeHeadingIconBoundaries} from './atelier-heading-icon-boundaries.mjs';
import {beforeMeetingData} from './maison-meeting-data-ledger.mjs';
import {beforeContentFields} from './maison-docx-content-fields.mjs';
import {beforeHonorificReport} from './carnet-honorific-review.mjs';
const root='D:/Claude/Q-Design';
test('all three live workspace copies contain exactly the central short-action rule',()=>{
 const result=inspectWorkspaceTargets();assert.equal(result.sources.length,3);
 assert.equal(composeWorkspace('a\r\n','b\r\n'),'a\n\nb\n');
 for(const product of ['atelier','maison','carnet']){
  const current=beforeHonorificReport(beforeHeadingIconBoundaries(beforeRemainingFields(beforeMeetingData(beforeContentFields(beforeFormRecordData(JSON.parse(fs.readFileSync(root+'/reviews/'+product+'-style-decisions.json','utf8')))))))),old=beforeWorkspaceTargets(current);
  assert.equal(current.counts.unknown,old.counts.unknown);assert.equal(current.counts['central-source-verified'],old.counts['central-source-verified']+2);
 }
});
test('complete target migration rejects altered rules, unrelated approvals and borrowed evidence',()=>{
 for(const product of ['atelier','maison','carnet']){
  const current=beforeFormRecordData(JSON.parse(fs.readFileSync(root+'/reviews/'+product+'-style-decisions.json','utf8')));
  const altered=structuredClone(current);altered.records.find(r=>r.path==='app/q-design.workspace.css'&&r.property==='min-width'&&r.context==='stylesheet .qd-text-action').value='100px';assert.throws(()=>beforeWorkspaceTargets(altered));
  const borrowed=structuredClone(current);borrowed.records.find(r=>r.path==='app/q-design.workspace.css').evidence[0].path='patterns/components.css';assert.throws(()=>beforeWorkspaceTargets(borrowed));
  const unrelated=structuredClone(current);unrelated.records.find(r=>r.path!=='app/q-design.workspace.css').decision='invented-approval';assert.throws(()=>beforeWorkspaceTargets(unrelated));
 }
});
