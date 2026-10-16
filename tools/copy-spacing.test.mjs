import test from 'node:test';
import assert from 'node:assert/strict';
import {applyBindings,normalizeCopy,termsForFile,relocateCopyBindings,formatProductCopy,mergeCopyBindings} from './copy-spacing.mjs';
const terms=[{from:'작성중',to:'작성 중'}];
test('a scoped copy build preserves every unselected product binding',()=>{
 const prior=['atelier','maison','carnet'].map(product=>({product,path:'copy.ts',bindings:[{original:product,emitted:product}]}));
 for(const product of ['atelier','maison','carnet']){
  const updated={product,path:'copy.ts',bindings:[{original:product,emitted:'updated'}]};
  const current=mergeCopyBindings(prior,[updated],[product]);
  assert.deepEqual(current.filter(r=>r.product!==product),prior.filter(r=>r.product!==product));
  assert.deepEqual(current.find(r=>r.product===product),updated);
 }
});

test('a build writes canonical bindings only and leaves product rows for sync',()=>{
 const prior=[{product:'atelier',path:'a.tsx',bindings:[{emitted:'old'}]},{product:'atelier',path:'c.tsx',canonical:'patterns/c.tsx',bindings:[{emitted:'old'}]}];
 const records=[{product:'atelier',path:'a.tsx',bindings:[{emitted:'new'}]},{product:'atelier',path:'c.tsx',canonical:'patterns/c.tsx',bindings:[{emitted:'new'}]}];
 assert.deepEqual(mergeCopyBindings(prior,records,['atelier'],'canonical'),[prior[0],records[1]]);
 assert.deepEqual(mergeCopyBindings(prior,records,['atelier'],'product'),[records[0],prior[1]]);
 // A file that changes owner keeps one row per file.
 const moved=[{product:'atelier',path:'a.tsx',canonical:'patterns/a.tsx',bindings:[]},records[1]];
 assert.deepEqual(mergeCopyBindings(prior,moved,['atelier'],'canonical'),moved);
});

test('a product without Prettier preserves source whitespace and explicit line breaks',async()=>{
 const code='const label = "경력 (년)";\r\nconst help = "첫 줄\\n둘째 줄";\r\n';
 assert.equal(await formatProductCopy('D:/Claude/Q-Atelier','app/experts/settings/profile-form.tsx',code),code);
});

test('the product formatter resolves its plugins from the product and relocates actual copy',async()=>{
 const before='const result = fail(ErrorCodes.VALIDATION, "사용 중인 창고만 선택할 수 있습니다.");';
 const formatted=await formatProductCopy('D:/Claude/Q-Works','app/(app)/shipping/actions.ts',before);
 const bindings=[{line:1,kind:'StringLiteral',ordinal:0,original:'"사용중인 창고만 선택할 수 있습니다."',emitted:'"사용 중인 창고만 선택할 수 있습니다."'}];
 const relocated=relocateCopyBindings('copy.ts',before,formatted,bindings);
 assert.equal(relocated[0].line,3);
 assert.equal(applyBindings('copy.ts',formatted,relocated,[{from:'사용중인',to:'운영 중인'}]).after,formatted.replace('사용 중인','운영 중인'));
});
test('formatter line breaks relocate exact bindings and reject literal mutations',()=>{
 const before='const result = fail(ErrorCodes.VALIDATION, "사용 중인 창고만 선택할 수 있습니다.");';
 const first=applyBindings('copy.ts',before,[],[{from:'사용 중인',to:'사용 중인'}]);
 const binding={line:1,kind:'StringLiteral',ordinal:0,original:'"사용중인 창고만 선택할 수 있습니다."',emitted:'"사용 중인 창고만 선택할 수 있습니다."'};
 const formatted='const result = fail(\n  ErrorCodes.VALIDATION,\n  "사용 중인 창고만 선택할 수 있습니다.",\n);';
 const relocated=relocateCopyBindings('copy.ts',first.after,formatted,[binding]);
 assert.equal(relocated[0].line,3);
 assert.equal(applyBindings('copy.ts',formatted,relocated,[{from:'사용중인',to:'운영 중인'}]).after,formatted.replace('사용 중인','운영 중인'));
 assert.throws(()=>relocateCopyBindings('copy.ts',before,formatted.replace('ErrorCodes.VALIDATION','ErrorCodes.UNKNOWN').replace('사용 중인','수정된'),[binding]),/changed authored literal/);
});
test('JSX formatter wrapping preserves rendered spaces while central text edits still propagate',()=>{
 const before='const view=<p>회의 · 출장 · 고객 방문 일정을 등록합니다.\n  기한은 자동으로 표시합니다.</p>;',after='const view=<p>회의 · 출장 · 고객 방문 일정을\n  등록합니다. 기한은 자동으로 표시합니다.</p>;';
 const binding={line:1,kind:'JsxText',ordinal:0,original:'회의 · 출장 · 고객 방문 사람이 아는 일을 달력에 적습니다.\n  기한은 자동으로 표시합니다.',emitted:'회의 · 출장 · 고객 방문 일정을 등록합니다.\n  기한은 자동으로 표시합니다.'};
 const relocated=relocateCopyBindings('copy.tsx',before,after,[binding]);
 const rules=[{from:'사람이 아는 일을 달력에 적습니다.',to:'일정을 등록합니다.'}];
 assert.equal(applyBindings('copy.tsx',after,relocated,rules).after,after);
 assert.match(applyBindings('copy.tsx',after,relocated,[{...rules[0],to:'일정을 관리합니다.'}]).after,/일정을 관리합니다/);
 assert.throws(()=>relocateCopyBindings('copy.tsx',before,after.replace('고객 방문','고객방문'),[binding]),/changed authored literal/);
 assert.throws(()=>relocateCopyBindings('copy.tsx',before,after.replace('기한은','기한 은'),[binding]),/changed authored literal/);
});
test('domain labels only change inside their explicitly reviewed product and paths',()=>{
 const scoped=[{from:'사용중',to:'사용 중',products:['maison'],paths:['lib/supabase/types.ts']}];
 assert.equal(applyBindings('lib/supabase/types.ts','const label="사용중";',[],termsForFile(scoped,'maison','lib/supabase/types.ts')).after,'const label="사용 중";');
 assert.equal(termsForFile(scoped,'atelier','lib/supabase/types.ts').length,0);
 assert.equal(termsForFile(scoped,'maison','app/recalls/recall-sheets.tsx').length,0);
});
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
