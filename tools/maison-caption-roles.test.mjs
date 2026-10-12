import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {beforeMaisonCaptionRoles,verifyMaisonCaptionRoles,maisonCaptionClass} from './maison-caption-roles.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works';
test('current caption source allows only the reviewed class substitutions and product formatting',async()=>{
 const report=await verifyMaisonCaptionRoles();assert.equal(report.records.length,8);
 assert.equal(report.records.reduce((n,r)=>n+r.changes.length,0),11);
 const record=report.records[0],current=fs.readFileSync(product+'/'+record.path,'utf8'),before=beforeMaisonCaptionRoles(record.path,current);
 assert.notEqual(before,current);assert(before.includes(record.changes[0].before));
 assert.throws(()=>beforeMaisonCaptionRoles(record.path,current.replace(maisonCaptionClass,'text-[11px]')));
 assert.throws(()=>beforeMaisonCaptionRoles(record.path,current+'\nconst injected="unreviewed";'));
});
