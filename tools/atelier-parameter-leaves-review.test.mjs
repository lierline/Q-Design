import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {parameterLeaves,verifiedParameterLeaves,createParameterLeafReview} from './atelier-parameter-leaves-review.mjs';
import {hash} from './style-arguments-core.mjs';
import {expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
function fixture(code){const sf=ts.createSourceFile('f.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),host={getSourceFile:n=>n==='f.tsx'?sf:undefined,getDefaultLibFileName:()=>'',writeFile(){},getCurrentDirectory:()=>'',getDirectories:()=>[],fileExists:n=>n==='f.tsx',readFile:()=>code,getCanonicalFileName:n=>n,useCaseSensitiveFileNames:()=>true,getNewLine:()=> '\n'};const checker=ts.createProgram(['f.tsx'],{noLib:true,noResolve:true},host).getTypeChecker(),fn=sf.statements[0];return{sf,checker,fn,binding:fn.parameters[0].name.elements[0]};}
test('only the original lexical parameter becomes a leaf, leaving shadowed values and fallbacks unproved',()=>{
 const {sf,checker,fn,binding}=fixture('function A({height}:any){function B(height:any){return <b style={{height:height}}/>}return <i style={{height:height??37}}/>}');
 const leaves=parameterLeaves(ts,checker,fn,binding,sf);assert.equal(leaves.length,1);
 const reviewedNodes=new WeakMap();let value;
 const visit=n=>{if(ts.isIdentifier(n)&&leaves.some(l=>l.start===n.getStart(sf)))reviewedNodes.set(n,{central:false,evidence:[{delegatedReview:true}]});if(ts.isBinaryExpression(n))value=n;ts.forEachChild(n,visit);};visit(fn);
 const proof=expressionProof({ts,node:value,sf,property:'height',imports:sourceImports(ts,sf),file:'f.tsx',references:new Map(),variables:new Map(),locals:localBindings(ts,sf,hash),reviewedNodes});assert.equal(proof,null);
});
test('direct style forwarding proves only the exact parameter, excluding shadowed styles and defaults',()=>{
 const {sf,checker,fn,binding}=fixture('function A({style}:any){function B(style:any){return <b style={style}/>}return <i style={style??{borderRadius:19}}/>}');
 const leaves=parameterLeaves(ts,checker,fn,binding,sf);assert.equal(leaves.length,1);
 const reviewedNodes=new WeakMap(),nodes=[];
 const visit=n=>{if(ts.isIdentifier(n)&&leaves.some(l=>l.start===n.getStart(sf)))reviewedNodes.set(n,{central:false,evidence:[{delegatedReview:true}]});if(ts.isJsxAttribute(n)&&n.name.text==='style')nodes.push(n.initializer.expression);ts.forEachChild(n,visit);};visit(fn);
 const prove=node=>expressionProof({ts,node,sf,property:'style',imports:sourceImports(ts,sf),file:'f.tsx',references:new Map(),variables:new Map(),locals:localBindings(ts,sf,hash),reviewedNodes});
 assert.equal(prove(nodes[0]),null);assert.equal(prove(nodes[1]),null);
 assert.ok(prove(nodes[1].left)?.evidence.some(e=>e.delegatedReview));
});
test('source, caller, indexing, spread and non-JSX consumer changes invalidate leaf delegation',()=>{
 const flow={path:'f',sourceHash:'fhash',leaves:[{start:1,end:2,text:'x',line:1}],evidence:[{path:'f',line:1,hash:'fhash'},{path:'caller',line:1,hash:'chash'}],unindexed:[],unresolvedSpreads:[],unresolvedReferences:[]};
 const current=p=>p==='f'?'fhash':'chash';assert.equal(verifiedParameterLeaves(flow,current).length,1);
 assert.equal(verifiedParameterLeaves(flow,p=>p==='f'?'changed':'chash'),null);
 assert.equal(verifiedParameterLeaves(flow,p=>p==='f'?'fhash':'changed'),null);
 for(const key of ['unindexed','unresolvedSpreads','unresolvedReferences'])assert.equal(verifiedParameterLeaves({...flow,[key]:[{}]},current),null);
});
test('all current prop leaves retain independent caller values and exact source positions',()=>{
 const actual=createParameterLeafReview(),saved=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-parameter-leaves-review.json',import.meta.url),'utf8'));assert.deepEqual(actual,saved);
 assert.equal(actual.flows.length,40);assert.ok(actual.flows.some(f=>f.component==='IconBtn'&&f.prop==='size'));
 for(const flow of actual.flows){assert.equal(flow.unindexed.length,0);assert.equal(flow.unresolvedSpreads.length,0);assert.equal(flow.unresolvedReferences.length,0);const code=fs.readFileSync('D:/Claude/Q-Atelier/'+flow.path,'utf8');for(const leaf of flow.leaves)assert.equal(code.slice(leaf.start,leaf.end),leaf.text);for(const caller of flow.callers)if(caller.value)assert.ok(caller.argumentHashes.length);}
});
