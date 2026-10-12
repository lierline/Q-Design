import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHandoffRoleMigration,applyHandoffRoleSource,handoffRolePlans,beforeMaisonHandoffRoles} from './maison-handoff-roles.mjs';
test('numeric role links preserve every other whole-source byte through product formatting',async()=>{
 const {proof,records,canonical}=await createHandoffRoleMigration(),saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-handoff-role-migration.json','utf8'));
 assert.deepEqual(proof,saved);assert.equal(records.length,4);assert(canonical.after.includes('purchasingAnalysis: 4'));
 for(const r of records){assert.equal(beforeMaisonHandoffRoles(r.path,r.after).replaceAll('\r\n','\n'),r.before.replaceAll('\r\n','\n'));assert.throws(()=>beforeMaisonHandoffRoles(r.path,r.after+'\nconst unreviewed = true;'));}
 const plan=handoffRolePlans[0];assert.throws(()=>applyHandoffRoleSource(plan,'<StatRow/><StatRow/>'));assert.throws(()=>applyHandoffRoleSource(plan,'<StatRow><StatRow>'));
});
