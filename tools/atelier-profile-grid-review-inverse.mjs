import fs from 'node:fs';import assert from 'node:assert/strict';import {hash} from './style-arguments-core.mjs';
export function beforeProfileGridReview(name,current){
 const file='D:/Claude/Q-Design/reviews/atelier-profile-grid-revalidation.json';if(!fs.existsSync(file))return current;
 const report=JSON.parse(fs.readFileSync(file,'utf8')).reports.find(r=>r.name===name);if(!report)return current;
 const serialize=j=>JSON.stringify(j,null,2)+'\n';if(hash(serialize(current))===report.beforeHash)return current;
 assert.equal(hash(serialize(current)),report.afterHash,'Unrelated report edits cannot inherit pre-grid evidence');
 const before=structuredClone(current);for(const change of report.changes){assert.deepEqual(before.records[change.index],change.after);before.records[change.index]=change.before;}
 for(const change of report.metadataChanges??[]){const object=change.location.slice(0,-1).reduce((value,key)=>value[key],before),key=change.location.at(-1);assert.equal(object[key],change.after);object[key]=change.before;}
 assert.equal(hash(serialize(before)),report.beforeHash);return before;
}
