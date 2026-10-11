import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {reverseResponsiveChart} from './atelier-migration-inverse.mjs';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Atelier');
const ts=createRequire(path.join(product,'package.json'))('typescript');
const source=fs.readFileSync(path.join(root,'source/design/chart-layout.ts'),'utf8');
function load(code=source){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}

test('axis density adapts to measured width and font size while retaining both endpoints',()=>{
 const {chartLabelIndices:indices}=load();
 for(const width of [240,295,1200])for(const size of [12,24]){
  const selected=Array.from(indices(30,width,size,8));
  assert.equal(selected[0],0);assert.equal(selected.at(-1),29);
  assert.equal(new Set(selected).size,selected.length);assert(selected.length>=2&&selected.length<=8);
 }
 assert.deepEqual(Array.from(indices(0,295,12,8)),[]);
 assert.deepEqual(Array.from(indices(1,295,12,8)),[0]);
 assert.deepEqual(Array.from(indices(30,295,12,1)),[0,29]);
 assert(indices(30,500,24,8).length<indices(30,500,12,8).length);
});

test('changing the canonical label spacing changes density without changing data indices or text',()=>{
 const before=load(),after=load(source.replace('minimumSpacing: 112','minimumSpacing: 144'));
 assert.notDeepEqual(Array.from(before.chartLabelIndices(30,500,12,8)),Array.from(after.chartLabelIndices(30,500,12,8)));
 assert.equal(after.chartLabelIndices(30,500,12,8).at(-1),29);
 assert.equal(after.chartLabelColumns(3),'repeat(3, minmax(0, 1fr))');
});

test('expanded font padding and label alignment are central presentation policies',()=>{
 const {chartPadding:padding,chartLabelAlignment:alignment}=load();
 const base={top:12,right:12,bottom:28,left:36};
 assert.equal(JSON.stringify(padding(12,base)),JSON.stringify(base));
 assert.equal(JSON.stringify(padding(24,base)),JSON.stringify({top:24,right:24,bottom:56,left:72}));
 assert.deepEqual([alignment(0,3),alignment(1,3),alignment(2,3),alignment(0,1)],['start','center','end','center']);
});

test('the responsive change reverses exactly and preserves each data calculation initializer',()=>{
 const current=fs.readFileSync(path.join(product,'components/TimeSeriesChart.tsx'),'utf8').replaceAll('\r\n','\n');
 const original=reverseResponsiveChart('components/TimeSeriesChart.tsx',current).replaceAll('\r\n','\n');
 const bindings=code=>{const sf=ts.createSourceFile('chart.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),values={};const visit=node=>{if(ts.isVariableDeclaration(node)&&['all','max','niceMax','yMax','w','h','x','y','paths','d','area','points','ticks'].includes(node.name.getText(sf))) (values[node.name.getText(sf)]??=[]).push(node.initializer?.getText(sf));ts.forEachChild(node,visit);};visit(sf);return values;};
 const old=bindings(original),now=bindings(current);
 // The removed second x binding placed SVG date labels. Data-point coordinates retain the first binding.
 assert.equal(now.x[0],old.x[0]);old.x=old.x.slice(0,1);
 assert.deepEqual(now,old);
 assert.match(current,/resize\.disconnect\(\); fonts\.disconnect\(\)/);
});

test('axis labels anchor to the exact selected data positions with independent wrapping cells',()=>{
 const {chartLabelStyle:style}=load();
 const indices=[0,4,8,12,17,21,25,29];
 for(const [position,index] of indices.entries()){
  const cell=style(indices,position,30,'8px');assert.equal(cell.marginLeft,`${index*100/29}%`);assert.equal(cell.gridArea,'1 / 1');assert.equal(cell.overflowWrap,'anywhere');
 }
 assert.equal(style([0],0,1,'8px').marginLeft,'50%');
 assert.equal(style(indices,0,30,'8px').transform,'none');
 assert.equal(style(indices,7,30,'8px').transform,'translateX(-100%)');
});
