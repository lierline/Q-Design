import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {dimensionForward,createDimensionFlowReview} from './atelier-dimension-flow-review.mjs';
const ts=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url))('typescript');
function inspect(source,name='Component'){
 const host={...ts.createCompilerHost({}),getSourceFile:f=>f==='case.tsx'?ts.createSourceFile(f,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX):undefined,getCurrentDirectory:()=>'',fileExists:f=>f==='case.tsx',readFile:()=>source};
 const program=ts.createProgram(['case.tsx'],{noLib:true,jsx:ts.JsxEmit.Preserve},host),sf=program.getSourceFile('case.tsx'),checker=program.getTypeChecker(),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)),binding=fn.parameters[0].name.elements[0],result=[];
 function visit(n){if(ts.isJsxAttribute(n))result.push(dimensionForward(ts,checker,n,sf,binding,name));ts.forEachChild(n,visit);}visit(fn);
 return result;
}
test('dimension transport accepts the exact lexical parameter and rejects shadowed parameters or calculations',()=>{
 assert.deepEqual(inspect('function Component({size}:any){function Nested(size:number){return <img width={size}/>};return <><img width={size}/><img width={size+2}/><img width={48}/></>}'),[false,true,false,false]);
});
test('the reviewed last-line selection retains its independently reviewed fallback and rejects a new raw value',()=>{
 const make=fallback=>`function SkeletonRow({lastWidth}:any){return <Skeleton width={i === count - 1 && count > 1 ? lastWidth : ${fallback}}/>}`;
 assert.deepEqual(inspect(make("'var(--qd-atelier-skeleton-width-100)'"),'SkeletonRow'),[true]);
 assert.deepEqual(inspect(make("'80%'"),'SkeletonRow'),[false]);
 assert.deepEqual(inspect(make("'var(--qd-atelier-skeleton-width-100)'"),'AnotherRow'),[false]);
});
test('current exact caller inventory preserves defaults and nested appearance as separate candidates',()=>{
 const actual=createDimensionFlowReview(),saved=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-dimension-flow-review.json',import.meta.url),'utf8'));
 assert.deepEqual(actual,saved);
 assert.equal(actual.records.length,17);assert.equal(actual.flows.length,12);
 const ring=actual.flows.find(f=>f.component==='ProgressRing'&&f.prop==='stroke');assert.equal(ring.outputs.length,2);assert.ok(ring.binding.includes('QDPresentation.progressStroke[5]'));assert.equal(ring.callers.length,2);
 const ringSize=actual.flows.find(f=>f.component==='ProgressRing'&&f.prop==='size');assert.equal(ringSize.callers.length,2);assert.deepEqual(ringSize.callers.map(c=>[c.path,c.line]),ring.callers.map(c=>[c.path,c.line]));assert.ok(ringSize.callers.every(c=>c.argumentHashes.length));
 for(const flow of actual.flows){
  assert.ok(flow.independentBodyArguments.length);
  assert.equal(flow.otherReferences.length,0,flow.component+' has an unreviewed non-JSX consumer');
  for(const caller of flow.callers){if(caller.value)assert.ok(caller.argumentHashes.length);assert.equal(caller.jsxSpreads.length,0);}
 }
 assert.ok(actual.flows.find(f=>f.component==='Avatar').binding.includes('='));
 assert.equal(actual.records.filter(r=>r.decision==='structural-behavior').length,1);
 assert.equal(actual.records.find(r=>r.decision==='structural-behavior').component,'ListToolbar');
 assert.ok(actual.records.every(r=>r.evidence.length));
});
