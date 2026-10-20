import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { resolveEmailPalette, buildEmailPalette } from './build-maison-email.mjs';
import { readInputs } from './build-palette.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const ts=require('typescript');
const mapping=JSON.parse(readFileSync(join(root,'patterns/foundation/maison-email-palette.json'),'utf8'));
const palette=resolveEmailPalette(readInputs(root),mapping);
function moduleAt(path, imports){
  const source=readFileSync(path,'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports={};
  vm.runInNewContext(js,{exports,require:name=>{if(!(name in imports))throw new Error(`Unexpected import: ${name}`);return imports[name];},Date},{filename:path});
  return exports;
}
// 겉모습은 정본 원본을, 업무 템플릿은 커밋본에서 떠 온 고정 사본을 읽습니다(fixtures/maison-email/SOURCE.md).
function templates(p=palette){
  const recipe=moduleAt(resolve(root,'patterns/foundation/maison-email.ts'),{'./q-design-email-palette':{EMAIL_PALETTE:p}});
  return moduleAt(resolve(root,'tools/fixtures/maison-email/templates.ts'),{
    '@/lib/design/q-design-email':recipe,
    '@/lib/utils/app-url':{appUrl:()=> 'https://local.invalid'},
  });
}
const request={recipientName:'검증 <받는 사람>',documentNo:'QD-LOCAL-001',documentTitle:'검증 문서 & 기록',level:'QP',requesterName:'로컬 검증',comment:'첫 줄\n<script>unsafe</script>',documentUrl:'https://local.invalid/doc?x=1&y="two"'};

test('email output is current and maps semantic success/rejection through the shared palette',()=>{
  assert.deepEqual(buildEmailPalette(root,{check:true}),palette);
  assert.equal(palette.approved,'#3d7a3d');
  assert.equal(palette.rejected,'#a83838');
});
test('shared palette edits propagate to email brand, paper and action colors',()=>{
  const inputs=structuredClone(readInputs(root));
  inputs[2].shared.dark['--qa-champagne']='#bb965d';
  inputs[2].shared.light['--qa-green']='#327a52';
  const changed=resolveEmailPalette(inputs,mapping);
  assert.equal(changed.champagne,'#bb965d');
  assert.equal(changed.approved,'#327a52');
  const html=templates(changed).approvalResultEmail({...request,action:'approved',actorName:'로컬 처리자'}).html;
  assert.ok(html.includes('background:#327a52;'));
  assert.ok(html.includes('color:#bb965d;'));
  assert.ok(!html.includes('background:#3d7a3d;'));
});
test('invalid or missing palette roles fail instead of emitting undefined or unsafe inline CSS',()=>{
  assert.throws(()=>resolveEmailPalette(readInputs(root),{missing:{theme:'light',token:'--qa-missing'}}),/requires a resolved/);
  assert.throws(()=>resolveEmailPalette(readInputs(root),{ink:{theme:'light',token:'--qa-bg',value:'#fff'}}),/Invalid email mapping/);
});
test('all four result states retain business labels with centrally owned badge appearance',()=>{
  for(const [action,label] of Object.entries({approved:'승인됨',rejected:'반려됨',published:'발행됨',retired:'폐기됨'})){
    const output=templates().approvalResultEmail({...request,action,actorName:'처리자 <검증>'});
    assert.equal(output.subject,`[${label}] QD-LOCAL-001 검증 문서 & 기록`);
    assert.ok(output.html.includes(`background:${palette[action]};`));
    assert.ok(output.html.includes('처리자 &lt;검증&gt;'));
    // 여러 줄 코멘트의 줄바꿈은 정본 comment 스타일이 지킵니다.
    assert.ok(output.html.includes('white-space:pre-wrap;'));
  }
});
test('generic notification omits absent CTA and emits a complete standalone inline-styled document',()=>{
  const output=templates().genericNotificationEmail({recipientName:'로컬 검증',title:'상태 <안내>',message:'첫째\n둘째 & 셋째'});
  assert.ok(output.html.startsWith('<!DOCTYPE html>'));
  assert.ok(output.html.includes('<title>상태 &lt;안내&gt;</title>'));
  assert.ok(output.html.includes('첫째\n둘째 &amp; 셋째'));
  assert.ok(output.html.includes('width="560"'));
  assert.ok(!output.html.includes('text-align:center;'));
  assert.ok(!/var\(|undefined|NaN/.test(output.html));
});
