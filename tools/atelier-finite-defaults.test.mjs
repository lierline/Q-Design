import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { readRuntimeValues } from './atelier-runtime-values.mjs';
import { runtimeFiles, hash } from './style-arguments-core.mjs';
import { reverseFiniteThird } from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design', product='D:/Claude/Q-Atelier';
const require=createRequire(product+'/package.json'),ts=require('typescript'),postcss=require('postcss');
const read=file=>fs.readFileSync(file,'utf8');
function load(code, dependencies={}) {
  const output=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const exports={};vm.runInNewContext(output,{exports,require:name=>dependencies[name]??require(name)});return exports;
}
const tokens=load(read(product+'/lib/design/tokens.ts'));
test('every client module retains its actual directive prologue after adapter imports',()=>{
  const violations=[];
  for(const file of runtimeFiles(product).filter(file=>/\.[jt]sx?$/.test(file))){
    const sf=ts.createSourceFile(file,read(product+'/'+file),ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    const index=sf.statements.findIndex(node=>ts.isExpressionStatement(node)&&ts.isStringLiteral(node.expression)&&node.expression.text==='use client');
    if(index>0&&sf.statements.slice(0,index).some(node=>!ts.isExpressionStatement(node)||!ts.isStringLiteral(node.expression)))violations.push(file);
  }
  assert.deepEqual(violations,[]);
});
test('the actual Next server-component compiler accepts every client module and rejects import-before-directive regression',async()=>{
  const swc=require('next/dist/build/swc'),{getLoaderSWCOptions}=require('next/dist/build/swc/options');
  const compile=(file,code)=>{
    const filename=product+'/'+file;
    const options=getLoaderSWCOptions({filename,development:true,isServer:true,serverComponents:true,bundleLayer:'rsc',
      jsConfig:{compilerOptions:{jsx:'preserve'}},compilerOptions:{},isCacheComponents:false,useCacheEnabled:false,
      serverReferenceHashSalt:'local-design-audit',relativeFilePathFromRoot:file});
    return swc.transform(code,{...options,filename});
  };
  const clientFiles=[];
  for(const file of runtimeFiles(product).filter(file=>/\.[jt]sx?$/.test(file))){
    const code=read(product+'/'+file),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    if(sf.statements.some(node=>ts.isExpressionStatement(node)&&ts.isStringLiteral(node.expression)&&node.expression.text==='use client')){
      await compile(file,code);clientFiles.push(file);
    }
  }
  assert.ok(clientFiles.includes('components/DocumentArtifactPanel.tsx'));
  const file='components/DocumentArtifactPanel.tsx';
  await assert.rejects(()=>compile(file,"import './directive-regression-fixture';\n"+read(product+'/'+file)),/use client|directive/i);
});
const labels=()=>load(read(root+'/patterns/foundation/atelier-labels.ts'),{'@/lib/design/tokens':tokens});
function declarations(){const vars=new Map();for(const file of ['patterns/components.css','patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css'])postcss.parse(read(root+'/'+file)).walkDecls(d=>{if(d.prop.startsWith('--'))vars.set(d.prop,d.value);});return vars;}
function resolve(value,vars){let v=String(value);for(let i=0;i<15;i++){const next=v.replace(/var\((--[\w-]+)\)/g,(_,key)=>{assert.ok(vars.has(key),'undefined central value '+key);return vars.get(key);});if(next===v)return v;v=next;}throw Error('variable cycle');}

test('actual UI TYPE adapter preserves the locked ladder while central edits change its display values',()=>{
  const {QDType}=labels(),vars=declarations();
  for(const[role,style]of Object.entries(tokens.TYPE))for(const[property,value]of Object.entries(style)){
    if(property==='fontFamily'){assert.match(vars.get(QDType[role][property].slice(4,-1)),/var\(--qd-font-family-(?:ui|mono)\)/);continue;}
    const expected=typeof value==='number'&&property==='letterSpacing'?value+'px':String(value);
    assert.equal(resolve(QDType[role][property],vars),expected,role+'.'+property);
  }
  vars.set('--qd-atelier-type-h3-font-size','21px');
  assert.equal(resolve(QDType.h3.fontSize,vars),'21px');
  vars.delete('--qd-atelier-type-h3-font-size');
  assert.throws(()=>resolve(QDType.h3.fontSize,vars),/undefined central value/);
});

test('actual language-dependent font helper reads central tracking and preserves Hangul spacing',()=>{
  const vars=declarations(),source=read(product+'/lib/design/hangul-text.tsx');
  const scale={QDScale:{family:{ui:'var(--qd-font-family-ui)',mono:'var(--qd-font-family-mono)'},font:{12:'var(--qd-font-size-12)'}}};
  const make=labelModule=>load(source,{'@/lib/design/q-design-labels':labelModule,'@/lib/design/q-design-scale':scale,'@/lib/design/tokens':tokens}).codeOrTextFont;
  const normal=make(labels());assert.equal(normal('ISO').letterSpacing,0);
  assert.equal(normal('ISO',labels().QDText.tracking.codeMeta).letterSpacing,'0.06em');
  assert.equal(resolve(normal('한글',labels().QDText.tracking.codeMeta).letterSpacing,vars),'0px');
  const changed=labels();changed.QDText.tracking.codeDefault=0.7;
  assert.equal(make(changed)('ISO').letterSpacing,0.7);
  assert.equal(resolve(make(changed)('한글').letterSpacing,vars),'0px');
});

test('actual foldGrid uses central defaults while preserving explicit runtime lengths and column data',()=>{
  const code=read(product+'/lib/design/components.tsx');
  const sf=ts.createSourceFile('components.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='foldGrid');assert.ok(fn);
  const runtime=readRuntimeValues(root);
  const make=config=>load('const QDRuntime = '+JSON.stringify(config)+';\n'+fn.getText(sf)).foldGrid;
  const grid=make(runtime.QDRuntime)(3,'var(--qd-space-2)',{min:runtime.QDPresentation.gridMinColumn[110]});
  assert.match(grid.gridTemplateColumns,/max\(110px/);assert.match(grid.gridTemplateColumns,/2 \* var\(--qd-space-2\)/);
  const changed=structuredClone(runtime.QDRuntime);changed.grid.foldMinColumn=211;
  assert.match(make(changed)(2,8).gridTemplateColumns,/max\(211px/);
  assert.match(make(changed)(2,8,{min:180}).gridTemplateColumns,/max\(180px/);
});

test('current helper borders and drawer motion consume canonical parameters',()=>{
  const code=read(product+'/lib/design/components.tsx'),choice=read(product+'/lib/design/segmented-choice.tsx');
  assert.equal((code.match(/`var\(--qd-border-width\) var\(--qd-atelier-border-style-5ed175bd8d\) \$\{alpha\(c,/g)??[]).length,3);
  assert.ok(code.includes('`var(--qd-border-width) ${dividers} ${T.border}`'));
  assert.ok(choice.includes('inset 0 0 0 var(--qd-border-width) ${T.text}'));
  assert.ok(code.includes('<style>{drawerMotionRules}</style>'));
  const drawerMotion=load(read(root+'/source/design/atelier-runtime.ts')).drawerMotionRules;
  assert.ok(drawerMotion.includes('translateX(calc(-1 * var(--qd-space-6)))'));
  const vars=declarations();vars.set('--qd-border-width','3px');vars.set('--qd-space-6','30px');
  assert.equal(resolve('inset 0 0 0 var(--qd-border-width)',vars),'inset 0 0 0 3px');
  assert.equal(resolve('translateY(var(--qd-space-6))',vars),'translateY(30px)');
});

test('the third finite migration preserves each complete source outside its exact reviewed substitutions',()=>{
  const ledger=JSON.parse(read(root+'/reviews/atelier-finite-defaults-3-migration.json'));
  assert.equal(ledger.records.length,32);
  for(const record of ledger.records){
    const code=reverseFiniteThird(record.path,read(product+'/'+record.path));
    assert.equal(hash(code),record.beforeHash,record.path);
  }
  const vars=declarations();for(const[key,value]of Object.entries(ledger.definitions))assert.equal(vars.get(key),value,key);
});

test('actual grid columns, glove size and section typography receive central mutations',()=>{
  const vars=declarations();
  const exportedValue=(file,name,dependencies={})=>{
    const code=read(product+'/'+file),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    const declaration=sf.statements.filter(ts.isVariableStatement).flatMap(n=>n.declarationList.declarations).find(n=>n.name.getText(sf)===name);
    assert.ok(declaration,file+': '+name);return load('export const value = '+declaration.initializer.getText(sf)+';',dependencies).value;
  };
  const grid=exportedValue('app/(app)/admin/screening/page.tsx','MEMBER_GRID_COLS');
  const glove=exportedValue('app/(app)/m/field-ui.tsx','GLOVE_TARGET');
  assert.equal(resolve(grid,vars),'1fr 220px 160px 110px 130px 110px');assert.equal(resolve(glove,vars),'64px');
  vars.set('--qd-atelier-grid-members','1fr 250px');vars.set('--qd-atelier-glove-target','72px');
  assert.equal(resolve(grid,vars),'1fr 250px');assert.equal(resolve(glove,vars),'72px');
  const code=read(product+'/lib/design/components.tsx');
  const sf=ts.createSourceFile('components.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const declaration=sf.statements.filter(ts.isVariableStatement).flatMap(n=>n.declarationList.declarations).find(n=>n.name.getText(sf)==='SECTION_TITLE');
  const section=load('const QD={sectionSize:"16px"}, T={text:"var(--qd-text)"}, QDScale={family:{ui:"var(--qd-font-family-ui)"}}; export const value='+declaration.initializer.getText(sf)+';').value;
  assert.equal(resolve(section.fontWeight,vars),'700');assert.equal(resolve(section.lineHeight,vars),'1.35');
  vars.set('--qd-font-weight-bold','650');vars.set('--qd-atelier-section-leading','1.4');
  assert.equal(resolve(section.fontWeight,vars),'650');assert.equal(resolve(section.lineHeight,vars),'1.4');
});

test('expert state rings use valid color mixing for semantic variables instead of invalid hex suffixes',()=>{
  const vars=declarations();
  for(const[file,fragment,geometry,alpha]of[
    ['app/experts/inbox/[id]/page.tsx','risk.color','--qd-atelier-risk-ring-geometry','--qd-atelier-risk-ring-alpha'],
    ['app/experts/settings/page.tsx','statusInfo.color','--qd-atelier-status-glow-geometry','--qd-atelier-status-glow-alpha'],
  ]){
    const code=read(product+'/'+file);assert.ok(code.includes('`var('+geometry+') color-mix(in srgb, ${'+fragment+'} var('+alpha+'), transparent)`'));
    assert.ok(!code.includes('${'+fragment+'}22')&&!code.includes('${'+fragment+'}80'));
    assert.ok(Number.parseFloat(vars.get(alpha))>0&&Number.parseFloat(vars.get(alpha))<100);
  }
});

test('widget quarter and half widths track the exact parent gap in both rendering modes',()=>{
  const code=read(product+'/components/dashboard/CustomizableWidgetBoard.tsx'),vars=declarations();
  for(const[mode,gap]of [['edit-',4],['',3]])for(const[role,fraction]of [['quarter',0.25],['half',0.5]]){
    const name=`--qd-atelier-widget-${mode}${role}`;assert.ok(code.includes(`'var(${name})'`));
    const expression=vars.get(name);assert.ok(expression.includes(`var(--qd-space-${gap})`));
    const compute=gapValue=>{
      const arithmetic=expression.slice(5,-1).replace(/(\d+)%/g,(_,pct)=>String(800*Number(pct)/100)).replace(`var(--qd-space-${gap})`,String(gapValue));
      assert.match(arithmetic,/^[\d. +*/()-]+$/);return Function('return '+arithmetic)();
    };
    for(const gapValue of [gap*4,24])assert.equal(compute(gapValue)/fraction+(1/fraction-1)*gapValue,800);
  }
});

test('research native fields use common control contrast and state rules without inline surface overrides',()=>{
  const code=read(product+'/app/(app)/research/new/page.tsx'),sf=ts.createSourceFile('research.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fields=[];const visit=node=>{if(ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node)){const name=node.tagName.getText(sf);if(['input','textarea'].includes(name)){const id=node.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)==='id');if(id?.initializer&&/research-new-/.test(id.initializer.getText(sf)))fields.push(node);}}ts.forEachChild(node,visit);};visit(sf);
  assert.equal(fields.length,4);for(const field of fields)assert.match(field.getText(sf),/className="qa-input qd-input"/);
  const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='inputStyle');
  const style=load('const QDScale={radius:"var(--qd-radius)",font:{13:"var(--qd-control-size)"},family:{ui:"var(--qd-font-family-ui)"}};'+fn.getText(sf)+'; export const value=inputStyle();').value;
  assert.match(style.border,/var\(--qd-ctl\)/);assert.equal(style.minHeight,'var(--qd-control-height)');assert.equal(style.background,undefined);assert.equal(style.color,undefined);
  const palette=postcss.parse(read(root+'/dist/q-design.palette.atelier.css'));
  const luminance=hex=>hex.slice(1).match(/../g).map(s=>parseInt(s,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
  let themes=0;palette.walkRules(rule=>{const values=new Map();rule.walkDecls(d=>values.set(d.prop,d.value));if(!values.has('--qa-ctl'))return;const a=luminance(values.get('--qa-ctl')),b=luminance(values.get('--qa-surface'));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=3,rule.selector);themes++;});assert.equal(themes,2);
  const recipe=read(root+'/patterns/foundation/atelier.css');assert.match(recipe,/\.qa-input:focus[\s\S]*?border-color: var\(--qa-champagne\) !important/);
});

test('actual Collapse curves and displacement react to central edits while reduced motion keeps zero duration',()=>{
  const source=read(product+'/lib/design/components.tsx'),sf=ts.createSourceFile('components.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=sf.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='Collapse');assert.ok(fn);
  const runtime=readRuntimeValues(root),vars=declarations();
  const render=(open,reduced=false,durationMs)=>{
    const code=`const usePrefersReducedMotion=()=>${reduced};const useState=()=>[true,()=>{}];const useEffect=()=>{};const QDPresentation=${JSON.stringify(runtime.QDPresentation)};`+fn.getText(sf);
    return load(code).Collapse({open,children:'content',durationMs});
  };
  const expanded=render(true),closed=render(false);
  assert.equal(resolve(expanded.props.style.transition,vars),`grid-template-rows ${runtime.QDPresentation.motionDefaults.foldOpen}ms cubic-bezier(0.22, 1, 0.36, 1)`);
  assert.equal(resolve(closed.props.style.transition,vars),`grid-template-rows ${runtime.QDPresentation.motionDefaults.foldClose}ms cubic-bezier(0.4, 0, 0.2, 1)`);
  const hidden=closed.props.children.props.children.props.style;
  assert.equal(resolve(hidden.transform,vars),'translateY(-4px)');
  vars.set('--qd-atelier-collapse-hidden-transform','translateY(-8px)');vars.set('--qd-atelier-collapse-open-easing','linear');
  assert.equal(resolve(hidden.transform,vars),'translateY(-8px)');assert.match(resolve(expanded.props.style.transition,vars),/ms linear$/);
  assert.match(render(true,true).props.style.transition,/ 0ms /);assert.match(render(true,false,777).props.style.transition,/ 777ms /);
  assert.equal(closed.props.inert,true);assert.equal(expanded.props.inert,false);
});

test('actual dense DataTable cells and headers use central density and retain stroke arithmetic',()=>{
  const source=read(product+'/lib/design/components.tsx'),sf=ts.createSourceFile('components.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=sf.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='DataTable');assert.ok(fn);
  const prelude=`const QD={motionFast:'160ms'},T={border:'var(--qd-border)',text:'var(--qd-text)',subtle:'var(--qd-subtle)'},QDScale={family:{mono:'var(--qd-font-family-mono)'},font:{12:'12px',13:'13px'}};const QDText=${JSON.stringify(labels().QDText)};const labelTracking=()=>0,labelWordSpacing=()=>0,labelCase=()=> 'none';`;
  const DataTable=load(prelude+fn.getText(sf)).DataTable;
  const render=dense=>DataTable({columns:[{key:'a',header:'A',render:row=>row.a}],rows:[{a:'value'}],getRowKey:()=> 'row',dense});
  const find=(element,role)=>{if(!element)return null;if(element.props?.role===role)return element;for(const child of [element.props?.children].flat(Infinity)){const hit=find(child,role);if(hit)return hit;}return null;};
  const dense=render(true),normal=render(false),vars=declarations();
  vars.set('--qd-table-pad-y','11px');vars.set('--qd-table-pad-x','12px');
  assert.equal(resolve(find(dense,'cell').props.style.padding,vars),'calc(4px * 2) var(--qd-table-pad-x, 12px)');
  assert.match(resolve(find(dense,'columnheader').props.style.padding,vars),/^calc\(calc\(4px \* 2\) \+ 1px\)/);
  vars.set('--qd-table-pad-y-dense','18px');
  assert.match(resolve(find(dense,'cell').props.style.padding,vars),/^18px /);
  assert.match(find(normal,'cell').props.style.padding,/var\(--qd-table-pad-y, 11px\)/);
});
