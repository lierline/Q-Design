import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {createHeadingIconReview,inspectHeadingIconSources,beforeHeadingIconBoundaries} from './atelier-heading-icon-boundaries.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',require=createRequire(repo+'/package.json'),ts=require('typescript'),React=require('react'),render=require('react-dom/server').renderToStaticMarkup;
const read=p=>fs.readFileSync(p,'utf8');
function load(source,dependencies={}){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>dependencies[name]??require(name)});return exports;}
test('actual heading producer uses central title variable and breakpoint for all three selectors',()=>{
 const runtime=load(read(root+'/source/design/atelier-runtime.ts')),css=runtime.pageHeadingRules('qa-page-hd-proof');
 for(const suffix of ['title','row','actions'])assert(css.includes('.qa-page-hd-proof-'+suffix));
 assert(css.includes('font-size:var(--qd-title-size, 22px)'));assert(css.includes('max-width:767px'));
 runtime.BP.md=640;assert(runtime.pageHeadingRules('qa-page-hd-proof').includes('max-width:639px'));
 const result=createHeadingIconReview();assert.deepEqual(result,JSON.parse(read(root+'/reviews/atelier-heading-icon-boundaries.json')));assert.equal(result.records.length,7);
});
test('every actual alert icon ignores legacy stroke thickness while preserving size and filled geometry',()=>{
 const factory=load(read(repo+'/components/q-design-icons/_icon.tsx'));
 for(const name of ['AlertCircle','AlertTriangle','CheckCircle2','Info']){
  const Icon=load(read(repo+'/components/q-design-icons/'+name+'.tsx'),{'./_icon':factory})[name];
  const markup=props=>render(React.createElement(Icon,props));
  assert.equal(markup({size:16,strokeWidth:1.8}),markup({size:16,strokeWidth:7}));
  assert.match(markup({size:22,strokeWidth:1.8}),/width="22" height="22"/);assert.match(markup({size:22}),/stroke="none"/);
 }
});
test('changed class wiring or icon consumer cannot inherit source evidence',()=>{
 for(const[path,before,after]of [['lib/design/components.tsx','pageHeadingRules(headerClass)','pageHeadingRules(otherClass)'],['components/q-design-icons/_icon.tsx','void strokeWidth;','props.strokeWidth=strokeWidth;']])assert.throws(()=>inspectHeadingIconSources({[path]:read(repo+'/'+path).replace(before,after)}));
});
test('whole ledger reverses only the seven exact bindings and rejects unrelated or borrowed approvals',()=>{
 const current=JSON.parse(read(root+'/reviews/atelier-style-decisions.json')),old=beforeHeadingIconBoundaries(current);assert.equal(old.counts.unknown,580);assert.equal(current.counts.unknown,573);
 const unrelated=structuredClone(current);unrelated.records[0].decision='invented';assert.throws(()=>beforeHeadingIconBoundaries(unrelated));
 const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId==='resolved-heading-selector-producer').evidence[0].hash='borrowed';assert.throws(()=>beforeHeadingIconBoundaries(borrowed));
});
