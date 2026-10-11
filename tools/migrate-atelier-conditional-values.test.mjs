import test from 'node:test';
import assert from 'node:assert/strict';
import { transformConditionalValues } from './migrate-atelier-conditional-values.mjs';

test('conditional CSS defaults become live tokens while conditions and measurements remain identical',()=>{
  const code="const data={fontSize:important?14:12};const View=()=> <div style={{fontSize:important?14:12,fontWeight:ready?600:400,width:done?'100%':measured,opacity:disabled?0.6:1}}/>;";
  const defs=new Map([['--qd-font-size-14','14px'],['--qd-font-size-12','12px'],['--qd-font-weight-semibold','600'],['--qd-font-weight-normal','400']]);
  const result=transformConditionalValues('fixture.tsx',code,defs);
  assert.equal(result.edits.length,7);
  assert.ok(result.output.includes('const data={fontSize:important?14:12}'));
  assert.ok(result.output.includes('fontWeight:ready?"var(--qd-font-weight-semibold)":"var(--qd-font-weight-normal)"'));
  assert.match(result.output,/:measured/);
  assert.equal(transformConditionalValues('fixture.tsx',result.output,defs).edits.length,0);
});

test('existing central defaults cannot be silently overwritten with a different value',()=>{
  assert.throws(()=>transformConditionalValues('fixture.tsx',"const View=()=> <div style={{fontSize:small?12:14}}/>;",new Map([['--qd-font-size-12','15px']])),/Conflicting central default/);
});

test('typed CSS return objects migrate while untyped business returns and nested callbacks do not',()=>{
  const code="function input(): React.CSSProperties{return {padding:'12px 14px',minHeight:44,fontWeight:on?600:400};} function data(){return {padding:'data',height:3};} function outer(): CSSProperties {const cb=()=>({height:7});return {opacity:0.8};}";
  const result=transformConditionalValues('fixture.tsx',code,new Map(),{functionReturnsOnly:true});
  assert.equal(result.edits.length,5);
  assert.ok(result.output.includes("return {padding:'data',height:3}"));
  assert.ok(result.output.includes('const cb=()=>({height:7})'));
});
