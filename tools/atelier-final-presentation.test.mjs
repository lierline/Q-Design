import {reversePostFinalPresentation} from './atelier-migration-inverse.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier',require=createRequire(qa+'/package.json');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),postcss=require('postcss');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
const manifest=JSON.parse(read(root+'/reviews/atelier-final-presentation-migration.json'));
function load(source,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,...globals});return exports;}
const runtime=load(read(root+'/source/design/atelier-runtime.ts'));
function extract(path,name){const sf=ts.createSourceFile(path,read(qa+'/'+path),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const f=sf.statements.find(n=>n.name?.text===name);assert.ok(f,name);return 'export '+f.getText(sf).replace(/^export /,'');}
function vars(){const out=new Map();for(const file of ['patterns/foundation.css','patterns/components.css','patterns/foundation/atelier.css'])postcss.parse(read(root+'/'+file)).walkDecls(d=>{if(d.prop.startsWith('--'))out.set(d.prop,d.value);});return out;}

test('each live prop migration and import exactly reverses to the original source with client directives intact',()=>{
 let props=0;for(const row of manifest.records){let source=reversePostFinalPresentation(row.path,read(qa+'/'+row.path));assert.equal(hash(source),row.afterHash,row.path);
  const sf=ts.createSourceFile(row.path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);assert.deepEqual(sf.parseDiagnostics,[]);
  const usesClient=sf.statements.some(n=>ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression)&&n.expression.text==='use client');if(usesClient)assert.equal(sf.statements[0].expression.text,'use client');
  for(const edit of [...row.edits].reverse()){assert.equal(source.slice(edit.start,edit.start+edit.after.length),edit.after);source=source.slice(0,edit.start)+edit.before+source.slice(edit.start+edit.after.length);if(edit.argumentHash)props++;}
  assert.equal(hash(source),row.beforeHash,row.path+' non-presentation code unchanged');
 }assert.equal(props,30);
 const copy=read(qa+'/lib/design/q-design-runtime.ts');assert.ok(copy.replaceAll('\r\n','\n').endsWith(read(root+'/source/design/atelier-runtime.ts').replaceAll('\r\n','\n')));
});

test('real field choice consumes central numeric columns without changing choices or callbacks',()=>{
 const source=extract('app/(app)/m/field-ui.tsx','ChoiceGroup');const changes=[];
 const {ChoiceGroup}=load(source,{QDPresentation:runtime.QDPresentation,QDScale:{space:{2:'8px',1.5:'6px',.5:'2px'},font:{15:'15px',12:'12px'},radius:'10px'},T:{champagne:'#aa8844',onAccent:'#000'},CTL:'#666'});
 const props={choices:[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}],value:'a',onChange:v=>changes.push(v),columns:runtime.QDPresentation.fieldChoiceColumns[2]};
 const before=ChoiceGroup(props);assert.equal(before.props.style.gridTemplateColumns,'repeat(2, 1fr)');before.props.children[1].props.onClick();assert.deepEqual(changes,['b']);
 const mutated=structuredClone(runtime.QDPresentation);mutated.fieldChoiceColumns[2]=4;const after=ChoiceGroup({...props,columns:mutated.fieldChoiceColumns[2]});assert.equal(after.props.style.gridTemplateColumns,'repeat(4, 1fr)');assert.equal(after.props.children.length,2);assert.equal(after.props.children[0].props['aria-checked'],true);
});

test('real loading skeleton proportions and segmented choice padding retain values and follow central CSS changes',()=>{
 const rules=vars();for(const [name,value] of Object.entries(manifest.definitions))assert.equal(rules.get(name),value);
 const tokens=load(read(qa+'/lib/design/tokens.ts'));
 const actualScale=load(read(qa+'/lib/design/q-design-scale.ts'),{require:n=>n==='./tokens'?tokens:require(n)}).QDScale;
 const {Skeleton}=load(read(qa+'/components/Skeleton.tsx'),{require:n=>n==='@/lib/design/q-design-runtime'?runtime:n==='@/lib/design/q-design-scale'?{QDScale:actualScale}:n==='@/lib/design/tokens'?{T:{border:'#ddd'}}:n==='@/lib/design/q-design-contract'?{QD:{radius:'10px'}}:require(n)});
 const html=renderToStaticMarkup(React.createElement(Skeleton.PageHd,{sub:false}));assert.match(html,/width:var\(--qd-atelier-skeleton-width-42\)/);assert.match(html,/width:var\(--qd-atelier-skeleton-width-28\)/);
 rules.set('--qd-atelier-skeleton-width-42','48%');const renderedWidth=html.match(/width:var\((--qd-atelier-skeleton-width-42)\)/)[1];assert.equal(rules.get(renderedWidth),'48%');
 const paddingEdits=manifest.records.flatMap(r=>r.edits).filter(e=>e.tag==='SegmentedChoice');assert.equal(paddingEdits.length,9);
 for(const edit of paddingEdits){const value=vm.runInNewContext(edit.after.slice(1,-1),{QDScale:actualScale});assert.match(value,/var\(--qd-space-/);const original=value.replace(/var\([^,]+, ([^)]+)\)/g,'$1');assert.equal(original,JSON.parse(edit.before));}
 const grain=load(read(qa+'/lib/design/grain.ts'),{require:n=>n==='./tokens'?tokens:n==='./q-design-runtime'?runtime:require(n)});
 const contract=load(read(qa+'/lib/design/q-design-contract.ts'),{require:n=>n==='./tokens'?tokens:n==='./grain'?grain:require(n)});
 const {SegmentedChoice}=load(read(qa+'/lib/design/segmented-choice.tsx'),{require:n=>n==='@/lib/design/q-design-runtime'?runtime:n==='@/lib/design/q-design-scale'?{QDScale:actualScale}:n==='@/lib/design/tokens'?tokens:n==='@/lib/design/q-design-contract'?contract:n==='@/lib/design/hangul-text'?{codeOrTextFont:()=>actualScale.family.ui}:require(n)});
 const sample=paddingEdits.find(e=>e.before==='"10px 14px"');assert.ok(sample);
 const changedScale=structuredClone(actualScale);changedScale.space[2.5]='20px';
 const padding=vm.runInNewContext(sample.after.slice(1,-1),{QDScale:changedScale});
 const choice=renderToStaticMarkup(React.createElement(SegmentedChoice,{options:[{value:'a',label:'Alpha'}],value:'a',onChange:()=>{},padding}));assert.match(choice,/padding:20px var\(--qd-space-3-5, 14px\)/);assert.match(choice,/role="radio"/);assert.match(choice,/aria-checked="true"/);
 const row=renderToStaticMarkup(React.createElement(Skeleton.Row,{count:2}));assert.match(row,/skeleton-width-70/);assert.match(row,/skeleton-width-100/);
});

test('native SVG size and stroke mutate while authored glyph geometry and ignored Phosphor stroke stay distinct',()=>{
 const source=extract('app/(auth)/login/page.tsx','SocialLinks');
 const render=p=>{const {SocialLinks}=load(source,{QDPresentation:p,QDScale:{space:{2:'8px',3:'12px'},radius:'10px'},QDText:{textDecoration:{v30a0924a33:'none'}},T:{border:'#aaa',muted:'#aaa'},Globe:()=>null});return renderToStaticMarkup(React.createElement(SocialLinks));};
 const before=render(runtime.QDPresentation);assert.match(before,/width="16" height="16"/);assert.match(before,/stroke-width="1.8"/);
 const p=structuredClone(runtime.QDPresentation);p.iconSize[16]=22;p.iconStroke[1.8]=2.25;const after=render(p);assert.match(after,/width="22" height="22"/);assert.match(after,/stroke-width="2.25"/);assert.match(after,/<rect x="3" y="3" width="18" height="18" rx="5"/);
 const {createIcon}=load(read(qa+'/components/q-design-icons/_icon.tsx'));const Icon=createIcon('proof',React.createElement('path',{d:'M0 0h1'}));assert.equal(renderToStaticMarkup(React.createElement(Icon,{strokeWidth:1.6})),renderToStaticMarkup(React.createElement(Icon,{strokeWidth:7})));
 const boundaries=JSON.parse(read(root+'/reviews/atelier-final-presentation-boundaries.json'));assert.equal(boundaries.records.filter(r=>r.decision==='compatibility-noop').length,16);assert.equal(boundaries.records.filter(r=>r.decision==='coordinate-boundary').length,2);
});
