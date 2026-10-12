import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPermissionActorConsumer,inspectHelpContentConsumer,createMaisonNonvisualHandoffReview} from './maison-nonvisual-handoff-review.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',ts=createRequire(product+'/package.json')('typescript'),parse=code=>ts.createSourceFile('consumer.tsx',code,99,true,4);
test('permission actor evidence rejects visual side effects and new actor fields',()=>{
 const code='function canReviewNow(status:string,line:any,me:any):boolean {if(status!=="submitted")return false;return line.reviewerId===me.id;}';
 inspectPermissionActorConsumer(parse(code),'canReviewNow');
 for(const changed of [code.replace('return line','document.body.style.color=me.id;return line'),code.replace('me.id','me.width'),code.replace('return line','paint(me);return line')])assert.throws(()=>inspectPermissionActorConsumer(parse(changed),'canReviewNow'));
});
test('help content evidence requires text-only uses and static intrinsic rendering',()=>{
 const code=fs.readFileSync(product+'/app/(app)/help/page.tsx','utf8');inspectHelpContentConsumer(parse(code));
 for(const changed of [code.replace('renderInline(block.content)','styleFor(block.content)'),code.replace('className="font-semibold text-brand-forestDark"','className={text}'),code.replace('<strong key','<style key').replace('</strong>','</style>')])assert.throws(()=>inspectHelpContentConsumer(parse(changed)));
});
test('current exact nonvisual records reproduce every saved consumer and source fingerprint',()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-nonvisual-handoff-review.json','utf8'));assert.deepEqual(createMaisonNonvisualHandoffReview(),saved);
 assert(saved.records.length>0);assert.equal(new Set(saved.records.map(r=>r.argumentHash)).size,saved.records.length);
});
