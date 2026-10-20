import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {permissionCopySource} from './build-permission-copy.mjs';
const ts=createRequire(import.meta.url)('typescript');
const rules=JSON.parse(fs.readFileSync(new URL('../patterns/copy-rules.json',import.meta.url),'utf8'));
const load=terms=>{const source=ts.transpileModule(permissionCopySource(terms),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const exports={};Function('exports',source)(exports);return exports.formatPermissionDescription;};
test('central display term formats descriptions without changing permission codes or inputs',()=>{
 const format=load(rules.terms),record={code:'reviews:finalize',description:'경영검토 최종확정'},before=JSON.stringify(record);
 assert.equal(format(record.description),'경영 검토 최종 확정');
 assert.equal(format(record.code),record.code);assert.equal(JSON.stringify(record),before);
 assert.equal(format('문서 생성'),'문서 생성');assert.equal(format('경영 검토 생성'),'경영 검토 생성');
});
test('changing the central term changes generated display; unrelated contexts are excluded',()=>{
 const terms=structuredClone(rules.terms),term=terms.find(t=>t.id==='management-review-spacing');term.to='중앙 검토';
 assert.equal(load(terms)('경영검토 생성'),'중앙 검토 생성');
 term.displayContexts=['other-context'];assert.equal(load(terms)('경영검토 생성'),'경영검토 생성');
});
