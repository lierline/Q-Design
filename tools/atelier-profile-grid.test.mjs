import fs from 'node:fs';import assert from 'node:assert/strict';import test from 'node:test';import vm from 'node:vm';import {createRequire} from 'node:module';
import {beforeProfileGrid,profileGridSources,profileGridPath} from './atelier-profile-grid-source.mjs';import {inspectProfileGrid,createProfileGridReview,profileTs as ts} from './atelier-profile-grid-review.mjs';import {beforeProfileGridReview} from './atelier-profile-grid-review-inverse.mjs';import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json');
function load(code,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:req,...globals});return exports;}
test('nine exact inputs retain all other source and reject unrelated behavior or local constants',()=>{
 const code=fs.readFileSync(repo+'/'+profileGridPath,'utf8').replaceAll('\r\n','\n'),bodies=profileGridSources();assert.equal(beforeProfileGrid(code),bodies.before);assert.equal(createProfileGridReview().records.length,9);
 for(const mutated of [code+'\nconst unexpected=1;\n',code.replace('gridColumns[2]','gridColumns[3]'),code.replace('cols={QDPresentation.rendererInputs.gridColumns[2]}','cols={2}'),code.replace('checked ? null : o.value','o.value')]){assert.throws(()=>beforeProfileGrid(mutated));assert.throws(()=>inspectProfileGrid(mutated));}
});
test('actual RadioGrid follows central columns without changing choices, labels or toggle callbacks',()=>{
 const code=fs.readFileSync(repo+'/'+profileGridPath,'utf8').replaceAll('\r\n','\n'),fn=inspectProfileGrid(code).renderer,runtime=load(fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'));
 const {RadioGrid}=load('export '+fn.getText(),{QDScale:{space:{2:'8px',.5:'2px'},radius:'10px',family:{serif:'serif',mono:'monospace'},font:{12:'12px'}},T:{champagne:'#aa8844',border:'#333',text:'#fff',muted:'#999'},alpha:()=> '#aa884414',QDRuntime:runtime.QDRuntime});
 for(const n of [2,3,4]){const clicks=[],options=[{value:'a',label:'Alpha'},{value:'b',label:'Beta',sub:'Details'}],props={cols:runtime.QDPresentation.rendererInputs.gridColumns[n],value:'a',options,onChange:v=>clicks.push(v)},before=RadioGrid(props);assert.equal(before.props.style.gridTemplateColumns,`repeat(${n}, 1fr)`);const buttons=before.props.children;assert.equal(buttons.length,2);assert.equal(buttons[0].props['aria-pressed'],true);assert.equal(buttons[1].props['aria-pressed'],false);buttons[0].props.onClick();buttons[1].props.onClick();assert.deepEqual(clicks,[null,'b']);
  const changed=structuredClone(runtime.QDPresentation);changed.rendererInputs.gridColumns[n]=1;const after=RadioGrid({...props,cols:changed.rendererInputs.gridColumns[n]});assert.equal(after.props.style.gridTemplateColumns,'repeat(1, 1fr)');assert.deepEqual(after.props.children.map(b=>[b.props['aria-pressed'],b.props.children]),buttons.map(b=>[b.props['aria-pressed'],b.props.children]));
 }
});
test('the six prior reports exactly reverse and refuse unrelated evidence changes',()=>{
 const proof=JSON.parse(fs.readFileSync(root+'/reviews/atelier-profile-grid-revalidation.json','utf8'));assert.equal(proof.reports.length,6);
 for(const report of proof.reports){const current=JSON.parse(fs.readFileSync(root+'/reviews/'+report.name,'utf8')),before=beforeProfileGridReview(report.name,current);assert.equal(hash(JSON.stringify(before,null,2)+'\n'),report.beforeHash);const changed=structuredClone(current);changed.scope='unrelated';assert.throws(()=>beforeProfileGridReview(report.name,changed));}
});
