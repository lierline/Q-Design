import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {createLedgerReviewRecord,beforeLedgerReview,beforeLedgerReport,moveReview,movedReviews,rebuiltReports} from './atelier-ledger-pattern-review.mjs';
const root='D:/Claude/Q-Design',read=name=>JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8')),earlier=name=>JSON.parse(execFileSync('git',['show','ecc29c540540a29bdcfbc283dffee42c656a7945:reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));
const saved=JSON.parse(fs.readFileSync(root+'/reviews/atelier-ledger-pattern-review.json','utf8'));
test('the saved record is exactly what the current reports and the committed reports produce',()=>{
 assert.deepEqual(createLedgerReviewRecord(),saved);
 assert.deepEqual(saved.reports.map(r=>r.name),[...movedReviews,...rebuiltReports]);
});
test('moved reviews retire nothing and change only exact fingerprints and unedited positions',()=>{
 for(const name of movedReviews){
  const report=saved.reports.find(r=>r.name===name),{current,retired}=moveReview(earlier(name));
  assert.deepEqual(retired,[]);assert.deepEqual(read(name),current);assert.equal(report.carried,current.records.length);
  for(const [i,record] of current.records.entries()){const before=earlier(name).records[i];assert.equal(record.decision,before.decision);assert.equal(record.reason,before.reason);assert.equal(record.ruleId,before.ruleId);}
 }
});
test('each later report reverses only as a whole to its exact committed report',()=>{
 for(const name of [...movedReviews,...rebuiltReports]){
  const current=read(name),before=beforeLedgerReview(name,current);
  assert.deepEqual(before,earlier(name));assert.deepEqual(beforeLedgerReview(name,before),before,'The earlier report passes through');
 }
 const report=read('atelier-style-decisions.json');assert.deepEqual(beforeLedgerReport(report),earlier('atelier-style-decisions.json'));
 const altered=structuredClone(report);altered.records.find(r=>r.decision==='unknown').decision='business-data';
 assert.equal(beforeLedgerReport(altered),altered,'Altered content is not reversed; earlier layers refuse it');
});
test('no carried decision is lost: every changed entry is new code or an exact fingerprint move',()=>{
 const decisions=saved.reports.find(r=>r.name==='atelier-style-decisions.json');
 for(const change of decisions.changed.filter(c=>c.key==='records'))assert.equal(change.after,change.before,'A carried record changed its decision: '+change.id);
});
