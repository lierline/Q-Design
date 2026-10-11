import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBindings,normalizeCopy} from './copy-spacing.mjs';
const terms=[{from:'작성중',to:'작성 중'}];
test('copy changes preserve business codes, comments, dynamic values and explicit breaks',()=>{
 const code='// 작성중\nconst state="draft"; const error=`작성중입니다. ${name}\\n다시 확인하세요`; const view=<p>작성중 <br />{userText}</p>;';
 const result=applyBindings('copy.tsx',code,[],terms);
 assert.equal(result.after,'// 작성중\nconst state="draft"; const error=`작성 중입니다. ${name}\\n다시 확인하세요`; const view=<p>작성 중 <br />{userText}</p>;');
 assert.equal(result.changes.length,2);
});
test('a central term update propagates through exact bindings and rejects source drift',()=>{
 const code='const label="작성중";';const first=applyBindings('copy.ts',code,[],terms);
 const bindings=first.changes.map(c=>({line:c.line,kind:c.kind,ordinal:c.ordinal,original:c.original,emitted:c.emitted}));
 const second=applyBindings('copy.ts',first.after,bindings,[{from:'작성중',to:'초안 작성 중'}]);
 assert.equal(second.after,'const label="초안 작성 중";');
 assert.throws(()=>applyBindings('copy.ts','const label="업무 변경";',bindings,terms),/changed outside Q-Design/);
 assert.equal(normalizeCopy('사용자 입력',terms),'사용자 입력');
});
test('TypeScript generics cannot turn comments or business types into JSX copy',()=>{
 const code='type Row<T> = T & { state: "draft" }; // 작성중\nconst label: Row<string> = "작성중";';
 const result=applyBindings('types.ts',code,[],terms);
 assert.equal(result.after,'type Row<T> = T & { state: "draft" }; // 작성중\nconst label: Row<string> = "작성 중";');
 assert.equal(result.changes.length,1);
});
