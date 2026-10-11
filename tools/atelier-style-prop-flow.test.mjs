import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {collectStylePropFlows,createProductFlowReport} from './atelier-style-prop-flow.mjs';
import {hash} from './style-arguments-core.mjs';
const qd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ts=createRequire(path.resolve(qd,'../Q-Atelier/package.json'))('typescript');

function fixture(sources,targets=[['panel.tsx','Panel','style']]){
 const root=path.resolve(qd,'../tmp/virtual-style-prop-flow');
 const entries=new Map(Object.entries(sources).map(([file,code])=>[path.join(root,file),code]));
 const options={jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext,noLib:true,noResolve:false};
 const host={...ts.createCompilerHost(options),fileExists:file=>entries.has(path.normalize(file)),readFile:file=>entries.get(path.normalize(file)),getSourceFile:file=>{const code=entries.get(path.normalize(file));return code===undefined?undefined:ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);},resolveModuleNames:(names,containing)=>names.map(name=>{const base=path.resolve(path.dirname(containing),name);const found=[base,base+'.tsx',base+'.ts'].find(file=>entries.has(file));return found?{resolvedFileName:found,extension:found.endsWith('tsx')?ts.Extension.Tsx:ts.Extension.Ts}:undefined;})};
 const program=ts.createProgram([...entries.keys()],options,host);
 return collectStylePropFlows({ts,program,root,files:Object.keys(sources),targets,sourceTexts:new Map(Object.entries(sources))});
}
const panel="export function Panel({style}:{style?:object}) {return <div style={{display:'block',...style}}/>}";

test('style prop flow resolves imported aliases and re-exports, not local same-name components',()=>{
 const [flow]=fixture({'panel.tsx':panel,'barrel.ts':"export {Panel as Shared} from './panel'",'screen.tsx':"import {Shared as Box} from './barrel'; function Panel(){return <div/>}; export const screen=<><Box style={{color:'red'}}/><Panel/></>"});
 assert.equal(flow.callers.length,1);assert.equal(flow.callers[0].tag,'Box');assert.equal(flow.callers[0].value,"{{color:'red'}}");
 assert.equal(flow.spreads.length,1);assert.match(flow.spreads[0].consumer,/\.\.\.style/);
});

test('new caller, forwarded props and component value escapes remain visible in the exact inventory',()=>{
 const first=fixture({'panel.tsx':panel,'screen.tsx':"import {Panel} from './panel'; const a=<Panel/>"})[0];
 const next=fixture({'panel.tsx':panel,'screen.tsx':"import {Panel} from './panel'; const a=<Panel/>; const b=<Panel {...external}/>; const Stored=Panel"})[0];
 assert.equal(first.callers.length,1);assert.equal(next.callers.length,2);
 assert.deepEqual(next.callers[1].jsxSpreads.map(x=>x.value),['external']);
 assert.ok(next.otherReferences.some(x=>x.consumer==='Stored=Panel'));
 assert.notDeepEqual(next.callers,first.callers);
});

test('a similarly named inner variable cannot masquerade as the original style prop',()=>{
 assert.throws(()=>fixture({'panel.tsx':"export function Panel({style}:{style?:object}) {const render=(style:object)=><div style={{...style}}/>; return render({});}"}),/No exact style consumer/);
 assert.throws(()=>fixture({'panel.tsx':"export function Panel({style}:{style?:object}) {return <Widget data={{...style}}/>}"}),/non-style consumer/);
});

test('BOM-bearing source keeps the exact raw file hash used by the independent argument ledger',()=>{
 const code='\uFEFF'+panel,consumer="\uFEFFimport {Panel} from './panel'; const a=<Panel style={{color:'red'}}/>";
 const [flow]=fixture({'panel.tsx':code,'screen.tsx':consumer});
 assert.equal(flow.sourceHash,hash(code));
 assert.equal(flow.callers[0].sourceHash,hash(consumer));
 assert.notEqual(flow.sourceHash,hash(panel));
});

test('all current renderer flows and every caller match the reviewed catalog; caller values stay independently indexed',()=>{
 const actual=createProductFlowReport();
 const reviewed=JSON.parse(fs.readFileSync(path.join(qd,'reviews/atelier-style-prop-flow-review.json'),'utf8'));
 assert.deepEqual(actual.flows,reviewed.flows,'A changed/new caller or prop consumer requires re-review');
 assert.deepEqual(actual.records,reviewed.records,'Exact hashed evidence changed');
 assert.ok(actual.flows.length>0);
 for(const flow of actual.flows)for(const caller of flow.callers){
  assert.equal(caller.jsxSpreads.length,0,'Forwarded prop payload requires explicit additional review');
  if(caller.value)assert.ok(caller.argumentHashes.length,'Style override is missing from independent argument inventory '+caller.path+':'+caller.attributeLine);
 }
});
