import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectColumnLiteral,verifyInboxConsumerSource,createInboxColumnsReview} from './maison-inbox-columns-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ts=createRequire(repo+'/package.json')('typescript');
const value=code=>{const sf=ts.createSourceFile('values.ts','const value='+code,99,true,3);return sf.statements[0].declarationList.declarations[0].initializer;};
test('database column values reject visual dimensions, colors, numeric layouts and executable composers',()=>{
 for(const code of ['"reviewed_at"','null','["created_by", "approved_by"] as const'])inspectColumnLiteral(value(code));
 for(const code of ['"22px"','"#000"','[16, 24]','paintColumns()','{width: "100%"}'])assert.throws(()=>inspectColumnLiteral(value(code)));
});
test('changed current workflow consumers cannot inherit the source-specific database classification',()=>{
 const file='lib/approvals/inbox.ts',code=fs.readFileSync(repo+'/'+file,'utf8');verifyInboxConsumerSource(file,code);
 assert.throws(()=>verifyInboxConsumerSource(file,code+'\nObject.assign(document.body.style, RULE_KINDS[kind].cols);\n'));
});
test('all twenty-six exact candidates and thirteen symbol-resolved registry reads reproduce their saved evidence',()=>{
 const saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-inbox-columns-review.json','utf8')),current=createInboxColumnsReview();assert.deepEqual(current,saved);assert.equal(current.records.length,26);assert.equal(new Set(current.records.map(r=>r.argumentHash)).size,26);assert.equal(current.readers.length,13);
});
