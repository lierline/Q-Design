import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {proveColorTransport,createColorFlowReview} from './atelier-color-flow-review.mjs';
const ts=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url))('typescript');
function inspect(source){
 const host={...ts.createCompilerHost({}),getSourceFile:f=>f==='case.tsx'?ts.createSourceFile(f,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX):undefined,getCurrentDirectory:()=>'',fileExists:f=>f==='case.tsx',readFile:()=>source};
 const program=ts.createProgram(['case.tsx'],{noLib:true,jsx:ts.JsxEmit.Preserve},host),sf=program.getSourceFile('case.tsx'),checker=program.getTypeChecker(),fn=sf.statements.find(ts.isFunctionDeclaration),binding=fn.parameters[0].name.elements[0],result=[];
 function visit(n){if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='color')result.push(Boolean(proveColorTransport({ts,checker,node:n.initializer,sf,binding,central:node=>/^T\.(text|green|border)$/.test(node.getText(sf))?[{path:'canonical',line:1,hash:'test'}]:null})));ts.forEachChild(n,visit);}visit(fn);
 return result;
}
test('color forwarding requires the original lexical parameter, including const aliases but excluding shadows and mutable aliases',()=>{
 assert.deepEqual(inspect('function A({color}:any){const alias=color;let mutable=color;function B(color:string){return <b style={{color:color}}/>}return <><i style={{color:color}}/><i style={{color:alias}}/><i style={{color:mutable}}/></>}'),[false,true,true,false]);
});
test('a delegated color branch cannot conceal a raw fallback, transformation or unverified token',()=>{
 assert.deepEqual(inspect('function A({color}:any){const value=color??T.text;return <><i style={{color:value}}/><i style={{color:active?color:T.green}}/><i style={{color:color||T.text}}/><i style={{color:color??"red"}}/><i style={{color:color??T.unowned}}/><i style={{color:alpha(color,.3)}}/></>}'),[true,true,true,false,false,false]);
});
test('all real color callers stay separately inventoried and no complete style is approved by a transport record',()=>{
 const actual=createColorFlowReview(),saved=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-color-flow-review.json',import.meta.url),'utf8'));
 assert.deepEqual(actual,saved);assert.equal(actual.flows.length,13);assert.equal(actual.records.length,13);
 const ring=actual.flows.find(f=>f.component==='ProgressRing'&&f.prop==='color');assert.equal(ring.outputs.length,1);assert.equal(ring.callers.length,2);assert.ok(ring.callers.every(c=>c.argumentHashes.length));
 assert.ok(actual.records.every(r=>r.decision==='delegated-renderer-parameter'));
 for(const flow of actual.flows){
  assert.ok(flow.independentBodyArguments.length);
  assert.equal(flow.otherReferences.length,0,flow.component+' has non-JSX callers requiring review');
  for(const caller of flow.callers){if(caller.value)assert.ok(caller.argumentHashes.length,caller.path+':'+caller.line);assert.equal(caller.jsxSpreads.length,0);}
 }
 assert.ok(actual.flows.find(f=>f.component==='Switch').binding.includes('='));
 assert.ok(actual.records.every(r=>r.evidence.length));
});
