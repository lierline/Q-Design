import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {readRuntimeValues,readRuntimeTemplate} from './atelier-runtime-values.mjs';
import {reverseRendererInputs,reverseResponsiveChart} from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier',require=createRequire(qa+'/package.json');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const read=path=>fs.readFileSync(path,'utf8');
const ledger=JSON.parse(read(root+'/reviews/atelier-final-visual-rules-migration.json'));
const canonical=read(root+'/source/design/atelier-runtime.ts');
function load(source,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,...globals});return exports;}
const runtime=load(canonical),tokens=load(read(qa+'/lib/design/tokens.ts'));
const scale=load(read(qa+'/lib/design/q-design-scale.ts'),{require:n=>n==='./tokens'?tokens:require(n)}).QDScale;
const labels=load(read(qa+'/lib/design/q-design-labels.ts'),{require:n=>n==='@/lib/design/tokens'?tokens:require(n)});
function original(path){let source=reverseRendererInputs(path,read(qa+'/'+path));const row=ledger.records.find(row=>row.path===path);if(!row)return source;assert.equal(hash(source),row.afterHash,path);for(const edit of [...row.edits].reverse()){assert.equal(source.slice(edit.start,edit.start+edit.after.length),edit.after,path);source=source.slice(0,edit.start)+edit.before+source.slice(edit.start+edit.after.length);}assert.equal(hash(source),row.beforeHash,path);return source;}
function declaration(source,name){const sf=ts.createSourceFile('fixture.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const node=sf.statements.find(n=>n.name?.text===name);assert.ok(node,name);return 'export '+node.getText(sf).replace(/^export /,'');}
function mutated(change){const values=JSON.parse(JSON.stringify(runtime.QDPresentation));change(values);return load(canonical.replace(/export const QDPresentation = (\{[\s\S]*?\}) as const;/,'export const QDPresentation = '+JSON.stringify(values)+' as const;'));}
const globals=rt=>({...rt,QDScale:scale,...labels,T:tokens.T,useId:()=>':fixture:',sameHeadText:(a,b)=>a.replace(/\s/g,'')===b.replace(/\s/g,'')});

test('all 54 source edits reverse exactly and preserve directive prologues and protected files',()=>{
 assert.equal(ledger.records.length,54);assert.equal(ledger.records.reduce((n,r)=>n+r.edits.length,0),121);
 for(const row of ledger.records){const before=original(row.path),after=read(qa+'/'+row.path);assert.doesNotMatch(row.path,/tokens\.ts$|lock|^lib\/engine\//);const parse=s=>ts.createSourceFile(row.path,s,ts.ScriptTarget.Latest,true,row.path.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);const a=parse(after),b=parse(before);assert.equal(a.parseDiagnostics.length,0,row.path);const client=b.statements.find(n=>ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression)&&n.expression.text==='use client');if(client)assert.equal(a.statements[0].expression?.text,'use client',row.path);}
 // Later, separately reviewed renderer choices may add canonical fields.
 // The exact historical visual values and current distributed copy remain checked.
 assert.ok(read(qa+'/lib/design/q-design-runtime.ts').replaceAll('\r\n','\n').endsWith(canonical.replaceAll('\r\n','\n')));
 assert.equal(JSON.stringify(readRuntimeValues(root).QDPresentation.visual),JSON.stringify(ledger.visual));
});

test('actual Grid render preserves all default branches and changes tablet policy from the central module',()=>{
 const file='lib/design/components.tsx',old=original(file),now=read(qa+'/'+file);
 const before=load(declaration(old,'gridTemplateFor')+'\n'+declaration(old,'Grid'),globals(runtime)).Grid;
 const after=load(declaration(now,'Grid'),globals(runtime)).Grid;
 for(const props of [{},{cols:2},{cols:4},{responsive:{base:1,sm:2,md:3,lg:4,xl:5}},{cols:4,minCol:200,gap:'var(--qd-space-3)'}])assert.equal(renderToStaticMarkup(after({...props,children:'cell'})),renderToStaticMarkup(before({...props,children:'cell'})));
 const rt=mutated(v=>{v.visual.grid.tabletThreshold=4;v.visual.grid.tabletColumns=3;});
 const changed=load(declaration(now,'Grid'),globals(rt)).Grid;
 const html=renderToStaticMarkup(changed({cols:4,children:'cell'}));assert.match(html,/repeat\(3,minmax\(0,1fr\)\)/);assert.doesNotMatch(html,/<div[^>]+style="[^"]*grid-template-columns/);
 assert.doesNotMatch(renderToStaticMarkup(changed({cols:3,children:'cell'})),new RegExp('@media \\(min-width:'+rt.BP.md+'px\\)'));
});

test('actual PageHd and Drawer authored CSS move without changing default output',()=>{
 const file='lib/design/components.tsx',old=original(file),now=read(qa+'/'+file);
 const before=load(declaration(old,'PageHd'),globals(runtime)).PageHd,after=load(declaration(now,'PageHd'),globals(runtime)).PageHd;
 const props={title:'검토 현황',sub:'REVIEW',actions:'저장'};
 assert.equal(renderToStaticMarkup(after(props)),renderToStaticMarkup(before(props)));
 const drawer=old.match(/<style>\{(`\s*@keyframes qa-drawer-slide-r[\s\S]*?`)\}<\/style>/)?.[1];assert.ok(drawer);assert.equal(runtime.drawerMotionRules,load('export const css = '+drawer+';').css);
 const changed=load(canonical.replace(/"md": 768/, '"md": 812'));
 assert.match(changed.pageHeadingRules('fixture'),/max-width:811px/);
 assert.match(readRuntimeTemplate(root,'pageHeadingRules'),/var\(--qd-title-size, 22px\)/);
 assert.throws(()=>readRuntimeTemplate(root,'unknown'),/Missing canonical/);
});

test('actual tag arithmetic and battery paint preserve defaults and react to central numeric mutations',()=>{
 const file='lib/design/tag-metrics.ts',old=load(original(file),{require:n=>n==='./tokens'?tokens:require(n)}),now=load(read(qa+'/'+file),{require:n=>n==='@/lib/design/q-design-runtime'?runtime:require(n)});
 for(const size of ['xs','sm','md']){assert.equal(now.tagHeight(size),old.tagHeight(size));assert.equal(now.tagContentHeight(size),old.tagContentHeight(size));assert.equal(now.tagHeightDriver(size),old.tagHeightDriver(size));}
 const rt=mutated(v=>{v.visual.tag.border=2;v.visual.tag.dims.md.fs=15;v.visual.battery={maximumHue:240,saturation:50,lightness:40};});
 const changed=load(read(qa+'/'+file),{require:n=>n==='@/lib/design/q-design-runtime'?rt:require(n)});assert.equal(changed.tagContentHeight('md'),15*1.4+8+4);
 const battery=load(declaration(read(qa+'/lib/design/components.tsx'),'batteryColor'),globals(rt)).batteryColor;
 assert.equal(battery(50),'hsl(120, 50%, 40%)');assert.equal(battery(-1),'hsl(0, 50%, 40%)');assert.equal(battery(120),'hsl(240, 50%, 40%)');
});

test('historical chart migration preserves exact markup and current responsive chart still consumes central ticks and line join',()=>{
 const file='components/TimeSeriesChart.tsx';
 const renderer=(source,rt)=>load(source,{require:n=>n==='react'?{...React,useMemo:fn=>fn()}:n==='@/lib/design/q-design-runtime'?rt:n==='@/lib/design/q-design-scale'?{QDScale:scale}:n==='@/lib/design/tokens'?tokens:n==='@/lib/design/q-design-labels'?labels:require(n)}).TimeSeriesChart;
 const before=renderer(original(file),runtime),after=renderer(reverseResponsiveChart(file,read(qa+'/'+file)),runtime);
 for(const data of [[],[1,2],[2,8]]){const props={labels:data.map((_,i)=>'D'+i),series:[{label:'검토',color:'#123456',data}]};assert.equal(renderToStaticMarkup(after(props)),renderToStaticMarkup(before(props)));}
 const rt=mutated(v=>{v.visual.chart.sparseThreshold=10;v.visual.chart.sparseTicks=[0,.25,.75,1];v.visual.chart.lineJoin='bevel';});
 const current=load(read(qa+'/'+file),{require:n=>n==='react'?React:n==='@/lib/design/q-design-chart-layout'?load(read(root+'/source/design/chart-layout.ts')):n==='@/lib/design/q-design-runtime'?rt:n==='@/lib/design/q-design-scale'?{QDScale:scale}:n==='@/lib/design/tokens'?tokens:n==='@/lib/design/q-design-labels'?labels:require(n)}).TimeSeriesChart;
 const html=renderToStaticMarkup(React.createElement(current,{labels:['A','B'],series:[{label:'검토',color:'#123456',data:[2,8]}]}));assert.match(html,/stroke-linejoin="bevel"/);assert.match(html,/>6<\/text>/);assert.match(html,/>2<\/text>/);
});

test('paper allocation derives the data columns from the central number column instead of independent 94 percent',()=>{
 const source=read(qa+'/components/qms/SheetPaper.tsx');assert.equal(source.match(/width: `\$\{QDPresentation.visual.paperNumberColumnPercent\}%`/g)?.length,2);
 const expression=source.match(/Math\.floor\(\(100 - QDPresentation.visual.paperNumberColumnPercent\) \/ b.cols.length\)/)?.[0];assert.ok(expression);
 const calculate=rt=>load('export const width = '+expression+';',{QDPresentation:rt.QDPresentation,b:{cols:['A','B']}}).width;
 assert.equal(calculate(runtime),47);assert.equal(calculate(mutated(v=>{v.visual.paperNumberColumnPercent=10;})),45);
});

test('central layer ladder preserves existing values and spinner has an actual reduced-motion recipe',()=>{
 assert.equal(JSON.stringify(runtime.Z),JSON.stringify(tokens.Z));
 const changed=load(canonical.replace('"tooltip": 9999','"tooltip": 10500'));assert.equal(changed.Z.tooltip,10500);
 const css=read(root+'/patterns/foundation/atelier.css');assert.match(css,/\.animate-spin\s*\{\s*animation: var\(--qd-atelier-animation-f980f830ce\);/);assert.match(css,/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.animate-spin\s*\{\s*animation: none;/);
});
