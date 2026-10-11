import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ts,verifyIgnoredIconFactory,ignoredStrokeAttribute,createIconCompatibilityReview,applyIconBoundaryReplacements} from './atelier-icon-compatibility-review.mjs';

test('real SVG strokes, dynamic expressions, spread props and unresolved icons stay unapproved',()=>{
 const inspect=(code,resolve=()=>({central:true}))=>{
  const sf=ts.createSourceFile('fixture.tsx',code,99,true,ts.ScriptKind.TSX);let result;
  const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.getText(sf)==='strokeWidth')result=ignoredStrokeAttribute(n,sf,resolve);ts.forEachChild(n,visit);};visit(sf);return result;
 };
 assert.deepEqual(inspect('<CentralIcon strokeWidth={1.75} />'),{central:true});
 for(const code of ['<svg strokeWidth={1.75} />','<circle strokeWidth={1.75} />','<CentralIcon strokeWidth={width} />','<CentralIcon strokeWidth={calc()} />','<CentralIcon {...props} strokeWidth={1.75} />'])assert.equal(inspect(code),null);
 assert.equal(inspect('<ShadowedIcon strokeWidth={1.75} />',()=>null),null);
});
test('a factory that forwards stroke width or changes the outline needs a fresh review',()=>{
 const code=fs.readFileSync('D:/Claude/Q-Design/patterns/react-icon.tsx','utf8');
 verifyIgnoredIconFactory(code);
 assert.throws(()=>verifyIgnoredIconFactory(code.replace('void strokeWidth;','props.strokeWidth = strokeWidth;')),/Icon factory semantics/);
 assert.throws(()=>verifyIgnoredIconFactory(code.replace('stroke="none"','stroke="currentColor"')),/Icon factory semantics/);
});
test('saved consumer evidence matches fresh TypeScript resolution and exact central copies',()=>{
 const current=createIconCompatibilityReview();
 assert.deepEqual(current,JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-icon-compatibility-review.json','utf8')));
 assert.equal(current.records.length+current.replacements.length,7);
 assert.equal(current.supersededRecords.length,3);
 assert.deepEqual(applyIconBoundaryReplacements(current),JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/atelier-final-presentation-boundaries.json','utf8')));
});
