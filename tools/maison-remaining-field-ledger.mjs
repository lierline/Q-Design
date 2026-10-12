import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createPrepDataReview} from './maison-prep-data-review.mjs';
import {createBoxAliasReview} from './maison-docx-box-alias-review.mjs';
const root='D:/Claude/Q-Design',ref='cc69294a510824b61ea428a10ae963aa3c525a0b';
export function beforeRemainingFields(current){
 if(current.product!=='maison'||!current.records.some(r=>['symbol-resolved-production-preparation-data','symbol-resolved-docx-box-alias'].includes(r.ruleId)))return current;
 const old=JSON.parse(execFileSync('git',['show',ref+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024})),entries=new Map([...createPrepDataReview().records,...createBoxAliasReview().records].map(r=>[r.argumentHash,r]));assert.equal(entries.size,21);assert.equal(current.records.length,old.records.length);const inverse=structuredClone(current);let changes=0;
 for(const[i,r]of current.records.entries()){const previous=old.records[i],entry=entries.get(r.argumentHash);if(!entry){assert.deepEqual(r,previous);continue;}assert.equal(previous.decision,'unknown');for(const[k,v]of Object.entries(entry))assert.deepEqual(r[k],v);assert.deepEqual({...r,decision:previous.decision,ruleId:previous.ruleId,reason:previous.reason,evidence:previous.evidence},previous);inverse.records[i]=previous;changes++;}
 assert.equal(changes,21);assert.deepEqual(current.counts,{...old.counts,unknown:old.counts.unknown-21,'business-data':old.counts['business-data']+17,'token-reference-verified':old.counts['token-reference-verified']+4});assert.equal(current.unknownCount,current.counts.unknown);inverse.counts=old.counts;inverse.unknownCount=old.unknownCount;inverse.generatedAt=old.generatedAt;assert.deepEqual(inverse,old,'No unrelated source, argument, decision or evidence may change');return old;
}
