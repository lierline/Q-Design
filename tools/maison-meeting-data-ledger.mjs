import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createMeetingDataReview} from './maison-meeting-data-review.mjs';
const root='D:/Claude/Q-Design',ref='ba4848f66d4d7743cd80ccd685545dff8ee9808e';
export function beforeMeetingData(current){
 if(current.product!=='maison'||!current.records.some(r=>r.ruleId==='symbol-resolved-meeting-record-data'))return current;
 const old=JSON.parse(execFileSync('git',['show',ref+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024})),entries=new Map(createMeetingDataReview().records.map(r=>[r.argumentHash,r]));assert.equal(entries.size,15);assert.equal(current.records.length,old.records.length);const inverse=structuredClone(current);let changed=0;
 for(const[i,r]of current.records.entries()){const previous=old.records[i],entry=entries.get(r.argumentHash);if(!entry){assert.deepEqual(r,previous);continue;}assert.equal(previous.decision,'unknown');for(const[k,v]of Object.entries(entry))assert.deepEqual(r[k],v);assert.deepEqual({...r,decision:previous.decision,ruleId:previous.ruleId,reason:previous.reason,evidence:previous.evidence},previous);inverse.records[i]=previous;changed++;}
 assert.equal(changed,15);assert.deepEqual(current.counts,{...old.counts,unknown:old.counts.unknown-15,'business-data':old.counts['business-data']+15});assert.equal(current.unknownCount,current.counts.unknown);inverse.counts=old.counts;inverse.unknownCount=old.unknownCount;inverse.generatedAt=old.generatedAt;assert.deepEqual(inverse,old);return old;
}
