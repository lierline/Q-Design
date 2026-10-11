import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {reverseRendererInputs,reverseChoiceContract} from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier',require=createRequire(qa+'/package.json');
const ts=require('typescript'),{renderToStaticMarkup}=require('react-dom/server');
const manifest=JSON.parse(fs.readFileSync(root+'/reviews/atelier-renderer-input-migration.json','utf8'));
function load(code,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require,...globals});return exports;}
const runtime=load(fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'));
const source=fs.readFileSync(qa+'/lib/design/components.tsx','utf8'),sf=ts.createSourceFile('components.tsx',source,99,true,4);
const declaration=name=>'export '+sf.statements.find(n=>n.name?.text===name).getText(sf).replace(/^export /,'');
const props=runtime.QDPresentation.rendererInputs;
const globals={...runtime,useId:()=>':audit:',QDScale:{space:{2.5:'var(--qd-space-2_5)',3:'var(--qd-space-3)',4:'var(--qd-space-4)'}}};

test('renderer-input migration preserves every other source byte and client directive',()=>{
 assert.equal(manifest.records.length,17);
 for(const row of manifest.records){const current=fs.readFileSync(qa+'/'+row.path,'utf8'),after=reverseChoiceContract(row.path,current),before=reverseRendererInputs(row.path,current);assert.equal(hash(before),row.beforeHash);assert.equal(hash(after),row.afterHash);const parse=s=>ts.createSourceFile(row.path,s,99,true,4);assert.equal(parse(current).parseDiagnostics.length,0);if(parse(before).statements[0]?.expression?.text==='use client')assert.equal(parse(current).statements[0]?.expression?.text,'use client');for(const e of row.edits.filter(e=>e.definition))assert.ok(e.definition.some(d=>d.file===qa+'/lib/design/components.tsx'||d.file===qa+'/components/Skeleton.tsx'));}
});

test('actual Grid and StatGrid retain previous rendered defaults and respond to central choices',()=>{
 const {Grid,StatGrid}=load(declaration('Grid')+'\n'+declaration('StatGrid'),globals);
 for(const n of [2,3,4])assert.equal(renderToStaticMarkup(Grid({cols:props.gridColumns[n],children:'cell'})),renderToStaticMarkup(Grid({cols:n,children:'cell'})));
 for(const n of [140,160])assert.equal(renderToStaticMarkup(StatGrid({minCol:props.statMinColumn[n],children:'stat'})),renderToStaticMarkup(StatGrid({minCol:n,children:'stat'})));
 const changed=structuredClone(props);changed.gridColumns[2]=5;changed.statMinColumn[140]=180;
 assert.match(renderToStaticMarkup(Grid({cols:changed.gridColumns[2],children:'cell'})),/repeat\(5,/);
 assert.match(renderToStaticMarkup(StatGrid({minCol:changed.statMinColumn[140],children:'stat'})),/minmax\(180px,/);
});
