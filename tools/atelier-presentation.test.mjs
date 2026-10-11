import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';
import { migratePresentation, presentationProps } from './atelier-presentation-core.mjs';
import { reverseFiniteThird } from './atelier-migration-inverse.mjs';
const ROOT=resolve(import.meta.dirname,'..'), QA=resolve(ROOT,'../Q-Atelier');
const require=createRequire(resolve(QA,'package.json')), ts=require('typescript'), React=require('react'), {renderToStaticMarkup}=require('react-dom/server');
const read=p=>fs.readFileSync(resolve(ROOT,p),'utf8');
function load(source, globals={}) { const module={exports:{}};runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require,...globals});return module.exports; }
const runtime=load(read('source/design/atelier-runtime.ts'));
const chartLayout=load(read('source/design/chart-layout.ts'));
const engineTokens=load(fs.readFileSync(resolve(QA,'lib/design/tokens.ts'),'utf8'));
const textRules=load(fs.readFileSync(resolve(QA,'lib/design/q-design-labels.ts'),'utf8'),{require:name=>name==='@/lib/design/tokens'?engineTokens:require(name)});
const scaleRules=load(fs.readFileSync(resolve(QA,'lib/design/q-design-scale.ts'),'utf8'),{require:name=>name==='./tokens'?engineTokens:require(name)});
const proof=JSON.parse(read('reviews/atelier-presentation-migration.json'));
function extract(path,names){const s=fs.readFileSync(path,'utf8'),sf=ts.createSourceFile(path,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);return sf.statements.filter(n=>n.name&&names.includes(n.name.text)).map(n=>n.getText(sf)).join('\n');}

// Later visual-only migrations are undone before checking the earlier byte
// snapshots. The original snapshots remain authoritative for business logic.
function reverseFiniteCentralizations(path, source) {
 source=reverseFiniteThird(path,source);
 for(const name of ['reviews/atelier-opaque-surfaces-migration.json','reviews/atelier-finite-defaults-2-migration.json','reviews/atelier-finite-defaults-migration.json']) {
  const manifest=JSON.parse(read(name));
  const original=manifest.files.find(file=>file.path===path);
  if(!original)continue;
  for(const change of manifest.changes.filter(change=>change.path===path).reverse()) {
   if(change.before==='TYPE display consumers') {
    source=source.replace(/\bQDType\./g,'TYPE.').replace(', QDType }',' }');
    source=source.replace('TOUCH, Z, alpha','TOUCH, TYPE, Z, alpha');
    continue;
   }
   assert.equal(source.split(change.after).length-1,change.count,`${path}: inverse ${change.after}`);
   source=source.replaceAll(change.after,change.before);
  }
  // This pass adds standalone imports only when the former source lacked them.
  // Remove an added import only after its final use has been inversely removed.
  for(const identifier of ['QDText','QDPresentation']) {
   const line=new RegExp(`^import \\{ ${identifier} \\} from '@/lib/design/q-design-(?:labels|runtime)';\\r?\\n`,'m');
   if(!new RegExp(`\\b${identifier}\\.`).test(source))source=source.replace(line,'');
  }
  // Moving a newly added import below a pre-existing CRLF directive leaves the
  // directive's old CRLF after the temporary LF prefix. Restore those bytes too.
  source=source.replace(/^('use client';)\n\r\n\r\n/,'$1\r\n\r\n');
  assert.equal(createHash('sha256').update(source.replaceAll('\r\n','\n')).digest('hex'),original.beforeHash,`${path}: finite migration inverse`);
 }
 return source;
}

test('only proven imported presentation props migrate; data and conditional expressions remain intact',()=>{
 const s=`'use client';\nimport { Grid, DataTable as Table } from '@/lib/design/components';\nimport { Search } from '@/components/q-design-icons/Search';\nconst x=<><Grid minCol={260} gap={12}/><Table minWidth={620}/><Search size={20}/><Unknown size={20}/><Data value={20} count={4}/><Search size={wide ? 24 : 16}/><svg width={256}><circle r={20}/></svg></>;`;
 const r=migratePresentation(ts,'fixture.tsx',s);
 assert.equal(r.records.length,4);assert.match(r.output,/minCol=\{QDPresentation.gridMinColumn\[260\]\}/);assert.match(r.output,/gap=\{QDScale.space\[3\]\}/);
 for(const unchanged of ['<Unknown size={20}/>','<Data value={20} count={4}/>','size={wide ? 24 : 16}','<svg width={256}><circle r={20}/>']) assert.ok(r.output.includes(unchanged));
 assert.ok(r.output.startsWith("'use client';"));assert.equal(migratePresentation(ts,'fixture.tsx',r.output).records.length,0);
});

test('every migrated numeric contract preserves its exact finite original value',()=>{
 let count=0;for(const file of proof.files)for(const r of file.records){count++;if(r.family==='gridGap'){assert.equal(r.expression,`QDScale.space[${r.value/4}]`);continue;}assert.equal(runtime.QDPresentation[r.family][r.value],r.value,`${file.path}:${r.line}`);assert.equal(typeof runtime.QDPresentation[r.family][r.value],'number');}
 assert.ok(count>=700);assert.equal(count,proof.summary.props);
});

test('all current proven JSX literal props are centralized and copied runtime matches canon',()=>{
 for(const file of proof.files){const s=fs.readFileSync(resolve(QA,file.path),'utf8');assert.equal(presentationProps(ts,file.path,s).records.length,0,file.path);assert.match(s,/import\s*\{[^}]*QD(?:Presentation|Scale)/);}
 const copy=fs.readFileSync(resolve(QA,'lib/design/q-design-runtime.ts'),'utf8');assert.ok(copy.replaceAll('\r\n','\n').endsWith(read('source/design/atelier-runtime.ts').replaceAll('\r\n','\n')));
});

test('central numeric icon-size mutation changes actual official SVG dimensions',()=>{
 const source=fs.readFileSync(resolve(QA,'components/q-design-icons/_icon.tsx'),'utf8');const {createIcon}=load(source);const Icon=createIcon('fixture',React.createElement('path',{d:'M0 0h1'}));
 const p=structuredClone(runtime.QDPresentation);assert.match(renderToStaticMarkup(React.createElement(Icon,{size:p.iconSize[20]})),/width="20" height="20"/);p.iconSize[20]=27;const html=renderToStaticMarkup(React.createElement(Icon,{size:p.iconSize[20]}));assert.match(html,/width="27" height="27"/);assert.doesNotMatch(html,/NaN/);
});

test('central numeric grid mutation remains usable in real px arithmetic while gap stays live CSS',()=>{
 const source=extract(resolve(QA,'lib/design/components.tsx'),['Grid']);const {Grid}=load(source,{...runtime,useId:React.useId,QDScale:{space:{2.5:'var(--qd-space-2-5, 10px)'}}});
 const p=structuredClone(runtime.QDPresentation),key=Object.keys(p.gridMinColumn)[0];p.gridMinColumn[key]=263;
 const html=renderToStaticMarkup(React.createElement(Grid,{minCol:p.gridMinColumn[key],gap:'var(--qd-space-3, 12px)'},'Fixture'));
 assert.match(html,/minmax\(263px, 1fr\)/);assert.match(html,/gap:var\(--qd-space-3, 12px\)/);assert.doesNotMatch(html,/NaN|var\([^)]*\)px/);
});

test('central numeric progress dimensions still produce finite SVG geometry after mutation',()=>{
 const source=extract(resolve(QA,'lib/design/components.tsx'),['ProgressRing']);const {ProgressRing}=load(source,{...runtime,S:{},T:{champagne:'#8a6838',border:'#ddd',text:'#111',muted:'#666'},F:{mono:'monospace'},FS:{},QD:{},QDScale:{space:{},font:{12:'12px'},family:{mono:'monospace'}}});
 const p=structuredClone(runtime.QDPresentation);p.progressSize[40]=52;
 const html=renderToStaticMarkup(React.createElement(ProgressRing,{size:p.progressSize[40],stroke:p.progressStroke[4],pct:50}));
 assert.match(html,/width="52"/);assert.doesNotMatch(html,/NaN|undefinedpx/);
});

test('chart presentation mutation changes geometry without changing source data values',()=>{
 const s=fs.readFileSync(resolve(QA,'components/TimeSeriesChart.tsx'),'utf8');
 const render=p=>{const {TimeSeriesChart}=load(s,{require:name=>name==='@/lib/design/q-design-labels'?textRules:name==='@/lib/design/q-design-chart-layout'?chartLayout:name==='@/lib/design/q-design-runtime'?{...runtime,QDPresentation:p}:name==='@/lib/design/q-design-scale'?{QDScale:{space:{1.5:'6px',2:'8px',4.5:'18px'},font:{12:'12px'},family:{mono:'monospace',ui:'sans-serif'}}}:name==='@/lib/design/tokens'?{T:{border:'#ddd',muted:'#666',subtle:'#333'},alpha:c=>c}:require(name)});return renderToStaticMarkup(React.createElement(TimeSeriesChart,{labels:['First','Last'],series:[{label:'Fixture',color:'#123456',data:[10,20]}]}));};
 const original=render(runtime.QDPresentation),p=structuredClone(runtime.QDPresentation);p.chartGeometry.width=1200;p.chartHeight[200]=240;p.chartGeometry.pointRadius=4;
 const changed=render(p);assert.match(original,/viewBox="0 0 1000 200"/);assert.match(changed,/viewBox="0 0 1200 240"/);assert.match(changed,/r="4"/);assert.doesNotMatch(changed,/NaN|undefinedpx/);for(const label of ['First','Last','>20<'])assert.ok(changed.includes(label),label);
});

test('coachmark geometry uses the same central width for placement and rendered panel',()=>{
 const s=fs.readFileSync(resolve(QA,'components/Coachmark.tsx'),'utf8'),fn=extract(resolve(QA,'components/Coachmark.tsx'),['calcPosition']);
 const calc=p=>load(fn+'\nexports.calc=calcPosition;',{QDPresentation:p}).calc;
 const rect={top:200,bottom:240,left:300,right:360,width:60,height:40};
 const original=calc(runtime.QDPresentation)(rect,'left');assert.equal(original.left,8);assert.equal(original.top,170);
 const p=structuredClone(runtime.QDPresentation);p.coachmarkGeometry.panelWidth=320;assert.equal(calc(p)(rect,'left').left,-32);assert.match(s,/width:\s*QDPresentation\.coachmarkGeometry\.panelWidth/);
});

test('final shared defaults preserve exact non-style source and canonical CSS fallback values',()=>{
 const manifest=JSON.parse(read('reviews/atelier-component-defaults-migration.json'));
 const hash=s=>createHash('sha256').update(s).digest('hex');
 for(const file of manifest.files){
  let source=reverseFiniteCentralizations(file.path,fs.readFileSync(resolve(QA,file.path),'utf8')).replaceAll('\r\n','\n');
  for(const added of file.addedImports)source=source.replace(added+'\n','');
  for(const change of [...file.changes].reverse()){assert.ok(source.includes(change.to),`${file.path}: ${change.to}`);source=source.replaceAll(change.to,change.from);}
  assert.ok([hash(source),hash(source.replaceAll('\n','\r\n'))].includes(file.beforeSHA256),file.path);
 }
 const css=read('patterns/foundation/atelier-values.css');
 assert.match(css,/--qd-atelier-padding-0ddf63605b:\s*10px 16px;/);
 assert.match(css,/--qd-atelier-width-260a93c4b6:\s*min\(480px, 96vw\);/);
 assert.match(read('patterns/components.css'),/--qd-choice-glyph-size:\s*16px;/);
 assert.equal(runtime.QDPresentation.commonDefaults.tableSqueeze,48);
 assert.equal(runtime.QDPresentation.commonDefaults.cardMinHeight,124);
});

test('real Checkbox default follows common glyph token while explicit numeric size remains supported',()=>{
 const source=extract(resolve(QA,'lib/design/components.tsx'),['Checkbox']);
 const render=(p,size)=>{const {Checkbox}=load(source,{QDPresentation:p,QD:{controlHeight:'var(--qd-control-height)'},QDScale:scaleRules.QDScale,T:{champagne:'#8a6838'}});return renderToStaticMarkup(React.createElement(Checkbox,{checked:false,onChange:()=>{},size,children:'Consent'}));};
 assert.match(render(runtime.QDPresentation),/width:var\(--qd-choice-glyph-size\);height:var\(--qd-choice-glyph-size\)/);
 const p=structuredClone(runtime.QDPresentation);p.cssDefaults.checkboxGlyph='var(--fixture-glyph)';assert.match(render(p),/width:var\(--fixture-glyph\)/);
 assert.match(render(p,22),/width:22px;height:22px/);
});

test('real ScrollTable uses numeric central squeeze without changing print geometry input',()=>{
 const source=extract(resolve(QA,'lib/design/components.tsx'),['ScrollTable']);
 const render=p=>{const widths=[];const {ScrollTable}=load(source,{useId:React.useId,QDPresentation:p,SCROLL_TABLE_SQUEEZE:p.commonDefaults.tableSqueeze,printZoom:w=>{widths.push(w);return 1;}});const html=renderToStaticMarkup(React.createElement(ScrollTable,{children:'Rows'}));return{html,widths};};
 const original=render(runtime.QDPresentation);assert.match(original.html,/min-width:712px/);assert.deepEqual(original.widths,[760]);
 const p=structuredClone(runtime.QDPresentation);p.commonDefaults.tableSqueeze=60;const changed=render(p);assert.match(changed.html,/min-width:700px/);assert.deepEqual(changed.widths,[760]);assert.doesNotMatch(changed.html,/NaN|var\([^)]*\)px/);
});

test('actual KPI call follows central count-up duration and retains reduced-motion and nonnumeric guards',()=>{
 const path=resolve(QA,'lib/design/components.tsx'),source=fs.readFileSync(path,'utf8');
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),calls=[];
 function visit(node){if(ts.isCallExpression(node)&&node.expression.getText(sf)==='useCountUp')calls.push(node);ts.forEachChild(node,visit);}visit(sf);
 assert.equal(calls.length,1);
 const expression=calls[0].getText(sf);
 const invoke=(duration,isNumeric,reducedMotion)=>{
  const p=structuredClone(runtime.QDPresentation);p.motionDefaults.countUp=duration;
  return load(`exports.observed = ${expression};`,{QDPresentation:p,isNumeric,reducedMotion,value:42,useCountUp:(...args)=>args}).observed;
 };
 assert.deepEqual([...invoke(800,true,false)],[42,800,true]);
 assert.deepEqual([...invoke(1234,true,false)],[42,1234,true]);
 assert.deepEqual([...invoke(1234,true,true)],[42,1234,false]);
 assert.deepEqual([...invoke(1234,false,false)],[0,1234,false]);
});

test('UI timing migration preserves callbacks, data, cleanup and original numeric timing exactly',()=>{
 const manifest=JSON.parse(read('reviews/atelier-interaction-motion-migration.json'));
 const hash=s=>createHash('sha256').update(s).digest('hex');
 for(const file of manifest.files){
  let source=reverseFiniteCentralizations(file.path,fs.readFileSync(resolve(QA,file.path),'utf8'));
  for(const added of file.addedImports)source=source.replace(added+'\n','');
  for(const change of [...file.changes].reverse())source=source.replaceAll(change.to,change.from);
  assert.equal(hash(source),file.beforeSHA256,file.path);
 }
 assert.match(read('patterns/foundation.css'),/--qd-border-width:\s*1px;/);
 assert.equal(scaleRules.QDScale.space[0.5],'var(--qd-space-0-5, 2px)');
});

test('all migrated UI timer arguments respond to central numeric mutation without CSS-unit coercion',()=>{
 const manifest=JSON.parse(read('reviews/atelier-interaction-motion-migration.json'));
 let count=0;
 for(const file of manifest.files){
  const source=fs.readFileSync(resolve(QA,file.path),'utf8');
  for(const change of file.changes.filter(c=>c.family)){
   assert.ok(source.includes(change.to),`${file.path}:${change.line}`);
   const evaluate=p=>load(`exports.value = ${change.to};`,{QDPresentation:p}).value;
   assert.equal(evaluate(runtime.QDPresentation),change.value);
   const p=structuredClone(runtime.QDPresentation),family=p.interactionMotion[change.family];
   if(typeof family==='object')family[change.value]=change.value+123;else p.interactionMotion[change.family]=change.value+123;
   assert.equal(evaluate(p),change.value+123);assert.equal(typeof evaluate(p),'number');count++;
  }
 }
 assert.equal(count,27);
});

test('actual toast TTL respects central default/error durations and caller override',()=>{
 const path=resolve(QA,'components/Toast.tsx'),source=fs.readFileSync(path,'utf8');
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),matches=[];
 function visit(n){if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='ttl')matches.push(n.initializer);ts.forEachChild(n,visit);}visit(sf);
 assert.equal(matches.length,1);
 const evaluate=(p,kind,opts)=>load(`exports.value = ${matches[0].getText(sf)};`,{QDPresentation:p,kind,opts}).value;
 const p=structuredClone(runtime.QDPresentation);p.interactionMotion.toastDefault=4100;p.interactionMotion.toastError=7100;
 assert.equal(evaluate(p,'info',undefined),4100);assert.equal(evaluate(p,'error',undefined),7100);assert.equal(evaluate(p,'error',{ttlMs:8000}),8000);
});
