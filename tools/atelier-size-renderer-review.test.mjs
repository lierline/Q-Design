import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {sizeCall,createSizeRendererReview,sizeRendererBodies} from './atelier-size-renderer-review.mjs';
import {verifyEnumBody} from './atelier-renderer-enum-review.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');

test('finite selectors accept only explicit reviewed strings and defaults, rejecting spreads and dynamic callers',()=>{
 const caller=(text,name='Tag')=>{
  const sf=ts.createSourceFile('example.tsx','const v='+text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  return sizeCall(ts,sf.statements[0].declarationList.declarations[0].initializer,sf,name);
 };
 assert.equal(caller('<Tag/>'),'sm');
 assert.equal(caller('<Switch/>','Switch'),'md');
 assert.equal(caller('<Tag size="xs"/>'),'xs');
 assert.equal(caller('<Switch size="sm"/>','Switch'),'sm');
 for(const text of ['<Tag size="large"/>','<Tag size={size}/>','<Tag {...props}/>','<Tag size="xs" {...props}/>','<Tag size="xs" size="md"/>','<Tag size/>'])assert.equal(caller(text),null);
 assert.equal(caller('<Switch size="xs"/>','Switch'),null);
});
test('size approval cannot survive an independent renderer dimension',()=>{
 const sf=ts.createSourceFile('changed.tsx','export function Switch(p:any){return <button style={{width:35}}/>}',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.throws(()=>verifyEnumBody(ts,sf.statements[0],sf,sizeRendererBodies.Switch),/renewed review/);
});
test('actual size graph and complete central fields match the saved evidence',()=>{
 const actual=createSizeRendererReview(),saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-size-renderer-review.json','utf8'));
 assert.deepEqual(actual,saved);
 assert.equal(actual.records.length,11);
 assert.ok(actual.callers.Tag.length>300);
 assert.ok(actual.callers.Switch.length>0);
 assert.ok(actual.records.some(r=>r.property==='left'));
});
