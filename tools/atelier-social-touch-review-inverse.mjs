// Restore exact pre-append review reports for immutable historical proofs.
import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './style-arguments-core.mjs';
import {beforeProfileGridReview} from './atelier-profile-grid-review-inverse.mjs';
export function beforeSocialTouchReview(name,current){
 current=beforeProfileGridReview(name,current);
 const proof=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-social-touch-revalidation.json','utf8')),report=proof.reports.find(p=>p.name===name),serialize=j=>JSON.stringify(j,null,2)+'\n';
 if(!report)return current;
 if(hash(serialize(current))===report.beforeHash)return current;
 assert.equal(hash(serialize(current)),report.afterHash,'Unrelated review edits cannot inherit historical evidence');
 const before=structuredClone(current);
 for(const change of report.changes){const row=before.records[change.recordIndex];assert.equal(row.argumentHash,change.argumentHash);const e=row.evidence.find(e=>e.path===change.path&&e.line===change.afterLine&&e.hash===change.afterHash);assert(e,'Exact rebound evidence missing');e.line=change.beforeLine;e.hash=change.beforeHash;}
 for(const change of report.flowChanges??[]){const e=change.location.reduce((value,key)=>value[key],before);assert(e.path===change.path&&e.line===change.afterLine&&e.hash===change.afterHash,'Exact repeated flow evidence missing');e.line=change.beforeLine;e.hash=change.beforeHash;}
 assert.equal(hash(serialize(before)),report.beforeHash,'Every original review field must remain unchanged');return before;
}
