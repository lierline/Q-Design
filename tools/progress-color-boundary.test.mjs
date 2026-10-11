import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {collectAdapterReferences,expressionProof,sourceImports,localBindings} from './atelier-style-proof.mjs';
const ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript'),file='lib/design/components.tsx';
const original=fs.readFileSync('D:/Claude/Q-Atelier/'+file,'utf8');
const runtime='export const QDPresentation={visual:{battery:{maximumHue:125,saturation:62,lightness:52}}} as const;';
function refs(code=original,current=runtime,central=true){return collectAdapterReferences({ts,files:new Map([[file,code],['lib/design/q-design-runtime.ts',current]]),variables:new Map(),hash,centralFiles:new Map(central?[['lib/design/q-design-runtime.ts',{path:'source/design/atelier-runtime.ts',line:1,hash:hash(current)}]]:[])});}
function prove(code,references){const sf=ts.createSourceFile('components/progress-probe.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='probe')expression=n.initializer;ts.forEachChild(n,visit);};visit(sf);return expressionProof({ts,node:expression,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references,variables:new Map(),locals:localBindings(ts,sf,hash,references)});}
test('exact bounded progress recipe proves data composition and follows all three central settings',()=>{
 for(const current of [runtime,runtime.replace('maximumHue:125','maximumHue:80').replace('saturation:62','saturation:45').replace('lightness:52','lightness:60')]){
  const references=refs(original,current),proof=prove('import {batteryColor as progressInk} from "@/lib/design/components";const probe=progressInk(percent);',references);
  assert(proof);assert.equal(proof.central,false);assert(proof.evidence.some(e=>e.dataGeometryReview));assert(proof.evidence.some(e=>e.hash===hash(current)));
  assert(prove('import {batteryColor} from "@/lib/design/components";const ink=batteryColor(percent);consume(ink);const probe=ink;',references));
 }
});
test('changed formulas, unowned metric sources and shadowed or invalid calls fail closed',()=>{
 for(const [code,current,central]of [[original.replace('Math.round(hue)','Math.round(hue)+10'),runtime,true],[original,runtime,false],[original,runtime.replace('lightness:52','lightness:"red"'),true]])assert.equal(refs(code,current,central).has(file+'::batteryColor#progressColor'),false);
 const references=refs();
 for(const code of ['import {batteryColor} from "@/lib/design/components";const probe=batteryColor();','import {batteryColor} from "@/lib/design/components";const probe=batteryColor(percent,40);','import {batteryColor} from "@/lib/design/components";const probe=batteryColor(...values);','import {batteryColor} from "@/lib/design/components";function screen(batteryColor:any){const probe=batteryColor(percent);}','import {batteryColor} from "@/unreviewed";const probe=batteryColor(percent);'])assert.equal(prove(code,references),null);
});
test('the actual unchanged function clamps percentages and responds to central palette settings',()=>{
 const sf=ts.createSourceFile(file,original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='batteryColor');
 const compiled=ts.transpileModule(fn.getText(sf),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 for(const battery of [{maximumHue:125,saturation:62,lightness:52},{maximumHue:80,saturation:45,lightness:60}]){
  const exports={};vm.runInNewContext(compiled,{exports,QDPresentation:{visual:{battery}}});
  for(const percent of [-20,0,50,100,140])assert.equal(exports.batteryColor(percent),`hsl(${Math.round(Math.max(0,Math.min(100,percent))/100*battery.maximumHue)}, ${battery.saturation}%, ${battery.lightness}%)`);
 }
});
