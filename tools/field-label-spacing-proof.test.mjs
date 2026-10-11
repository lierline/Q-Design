import test from 'node:test';
import assert from 'node:assert/strict';
import {applyFieldLabelSpacing,verifyFieldLabelSpacing} from './field-label-spacing-proof.mjs';
test('label correction preserves other recipes and cannot bless unrelated canonical edits',()=>{
 const before='.other {width: 45px;}\n.expert-portal-root .field-label {\n letter-spacing: 0.18em;\n color: var(--mist);\n}\n';
 const after=applyFieldLabelSpacing(before);
 verifyFieldLabelSpacing(before,after);
 assert.throws(()=>verifyFieldLabelSpacing(before,after.replace('width: 45px','width: 46px')),/Unreviewed/);
 assert.throws(()=>applyFieldLabelSpacing('.other {letter-spacing:0.18em}'),/Expected exact/);
 assert.throws(()=>applyFieldLabelSpacing(before+before),/Expected exact/);
});
